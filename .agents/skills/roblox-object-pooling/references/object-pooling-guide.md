# Roblox Object Pooling Guide & Reference

This reference document provides concrete implementation templates and best practices for creating and managing high-performance object pools in Roblox with Knit and Clean Architecture.

---

## 1. Why Object Pooling in Roblox?

In Roblox Luau:
- Repeatedly creating instances (`Instance.new("Part")`, `Instance.new("Sound")`, `BillboardGui`) and destroying them (`:Destroy()`) triggers intensive memory allocations and forces the **Garbage Collector (GC)** to clean up fragmented memory.
- During heavy action (e.g. machine gun firing 20 bullets/sec, multiple explosions, rapid damage numbers), continuous instantiating causes noticeable **frame rate stuttering / lag spikes**.
- **Object Pooling** solves this by pre-instantiating a fixed collection of objects (*pre-warming*), recycling them when released, and reusing them without GC overhead.

---

## 2. Generic ObjectPool Module (Reusable Infrastructure/Utility)

```lua
-- src/shared/Infrastructure/Pooling/ObjectPool.lua
local ObjectPool = {}
ObjectPool.__index = ObjectPool

export type PoolConfig<T> = {
    Factory: () -> T,
    Reset: (object: T) -> (),
    InitialSize: number,
    MaxSize: number?,
    Container: Instance?,
}

function ObjectPool.new<T>(config: PoolConfig<T>)
    local self = setmetatable({
        _factory = config.Factory,
        _reset = config.Reset,
        _initialSize = config.InitialSize or 10,
        _maxSize = config.MaxSize or 100,
        _container = config.Container,
        _available = {},
        _inUse = {},
    }, ObjectPool)

    self:_prewarm()
    return self
end

function ObjectPool:_prewarm()
    for _ = 1, self._initialSize do
        local object = self._factory()
        if self._container and typeof(object) == "Instance" then
            object.Parent = self._container
        end
        table.insert(self._available, object)
    end
end

function ObjectPool:Get()
    local object = table.remove(self._available)
    if not object then
        -- Pool exhausted: create new object if within max limit
        if not self._maxSize or (#self._inUse < self._maxSize) then
            object = self._factory()
            if self._container and typeof(object) == "Instance" then
                object.Parent = self._container
            end
        else
            warn("[ObjectPool] Max pool size reached, recycling oldest object.")
            object = table.remove(self._inUse, 1)
            self._reset(object)
        end
    end

    table.insert(self._inUse, object)
    return object
end

function ObjectPool:Release(object)
    local index = table.find(self._inUse, object)
    if index then
        table.remove(self._inUse, index)
    end

    self._reset(object)
    table.insert(self._available, object)
end

function ObjectPool:ReleaseAll()
    for _, object in ipairs(self._inUse) do
        self._reset(object)
        table.insert(self._available, object)
    end
    table.clear(self._inUse)
end

function ObjectPool:Destroy()
    self:ReleaseAll()
    for _, object in ipairs(self._available) do
        if typeof(object) == "Instance" then
            object:Destroy()
        end
    end
    table.clear(self._available)
    table.clear(self._inUse)
end

return ObjectPool
```

---

## 3. Layer Integration Examples

### A. Presentation Layer: DamageIndicatorPoolPresenter (Client)
```lua
-- src/client/Presentation/Combat/DamageIndicatorPoolPresenter.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local ObjectPool = require(ReplicatedStorage.Shared.Infrastructure.Pooling.ObjectPool)
local Trove = require(ReplicatedStorage.Packages.Trove)

local DamageIndicatorPresenter = {}
DamageIndicatorPresenter.__index = DamageIndicatorPresenter

function DamageIndicatorPresenter.new(templateBillboard: BillboardGui)
    local self = setmetatable({}, DamageIndicatorPresenter)
    self._trove = Trove.new()

    -- Setup Folder in PlayerGui/Workspace
    local container = Instance.new("Folder")
    container.Name = "DamageIndicatorPool"
    container.Parent = workspace
    self._trove:Add(container)

    -- Initialize ObjectPool
    self._pool = ObjectPool.new({
        InitialSize = 20,
        MaxSize = 60,
        Container = container,
        Factory = function()
            local clone = templateBillboard:Clone()
            clone.Enabled = false
            return clone
        end,
        Reset = function(billboard: BillboardGui)
            billboard.Enabled = false
            billboard.Adornee = nil
        end,
    })
    self._trove:Add(self._pool)

    return self
end

function DamageIndicatorPresenter:ShowDamage(targetPart: BasePart, amount: number)
    local billboard = self._pool:Get()
    billboard.Adornee = targetPart
    billboard.Enabled = true

    local textLabel = billboard:FindFirstChildOfClass("TextLabel")
    if textLabel then
        textLabel.Text = "-" .. tostring(amount)
        textLabel.TextTransparency = 0
    end

    -- Animate popup and return to pool
    task.delay(0.8, function()
        self._pool:Release(billboard)
    end)
end

function DamageIndicatorPresenter:Destroy()
    self._trove:Clean()
end

return DamageIndicatorPresenter
```

---

### B. Infrastructure Layer: ProjectilePoolAdapter (Server / Client)
```lua
-- src/server/Infrastructure/Combat/ProjectilePoolAdapter.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ObjectPool = require(ReplicatedStorage.Shared.Infrastructure.Pooling.ObjectPool)

local ProjectilePoolAdapter = {}
ProjectilePoolAdapter.__index = ProjectilePoolAdapter

function ProjectilePoolAdapter.new(templateProjectile: BasePart)
    local self = setmetatable({}, ProjectilePoolAdapter)

    local folder = Instance.new("Folder")
    folder.Name = "ProjectilePool"
    folder.Parent = workspace

    self._pool = ObjectPool.new({
        InitialSize = 30,
        MaxSize = 100,
        Container = folder,
        Factory = function()
            local part = templateProjectile:Clone()
            part.CanCollide = false
            part.Anchored = true
            part.Transparency = 1
            return part
        end,
        Reset = function(part: BasePart)
            part.AssemblyLinearVelocity = Vector3.zero
            part.AssemblyAngularVelocity = Vector3.zero
            part.Anchored = true
            part.Transparency = 1
            part.CFrame = CFrame.new(0, -500, 0) -- Hidden under map
        end,
    })

    return self
end

function ProjectilePoolAdapter:Spawn(origin: Vector3, direction: Vector3, speed: number)
    local projectile = self._pool:Get()
    projectile.CFrame = CFrame.lookAt(origin, origin + direction)
    projectile.Transparency = 0
    projectile.Anchored = false
    projectile.AssemblyLinearVelocity = direction.Unit * speed

    return projectile, function()
        self._pool:Release(projectile)
    end
end

return ProjectilePoolAdapter
```

---

## 4. Best Practices & Safety Rules
1. **Always Reset State Completely**: Ensure visual transparency, linear velocity, adornees, and tweens are fully reset in the `Reset` callback.
2. **Hidden Container**: Keep inactive objects inside a dedicated folder or positioned out-of-bounds (e.g. `CFrame.new(0, -1000, 0)`) so they do not trigger physics collisions or visual artifacts.
3. **Budget Sizing**: Prewarm only what is realistically expected on screen simultaneously (e.g. 20–50 items) to prevent high upfront memory consumption.
