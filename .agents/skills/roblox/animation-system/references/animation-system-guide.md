# Roblox Centralized Animation System Guide & Reference

This reference document provides concrete architecture templates, patterns, and code examples for managing, caching, and playing character, NPC, and viewmodel animations cleanly in Roblox projects.

---

## 1. Why a Centralized Animation System?

In Roblox Luau:
- Repeatedly calling `Animator:LoadAnimation(animation)` every time an action occurs (e.g. on every sword swing or step) wastes memory, causes micro-stutters, and quickly exceeds the engine's active track limit.
- Hardcoding `Animation.AnimationId = "rbxassetid://..."` across various controllers makes changing animation assets difficult and error-prone.
- **Centralized Animation Pipeline** solves this by:
  1. Centralizing all Animation Asset IDs in `CatalogConfig.lua` (Domain).
  2. Caching loaded `AnimationTrack`s per `Animator` in an Animation Adapter (Infrastructure).
  3. Providing a clean API to play, crossfade, stop, and observe animation marker events (`:GetMarkerReachedSignal()`).

---

## 2. Directory Structure

```text
src/
├── shared/
│   ├── Domain/
│   │   └── Config/
│   │       └── CatalogConfig.lua (Animation Asset IDs)
│   └── Contracts/
│       └── IAnimationAdapter.lua
│
├── server/
│   ├── Services/
│   │   └── AnimationService.lua (Replication / Server Animation playback)
│   └── Infrastructure/
│       └── Animation/
│           └── AnimationServerAdapter.lua (Animator cache & track manager)
│
└── client/
    ├── Controllers/
    │   └── AnimationController.lua (Client animation triggers & track listeners)
    └── Presentation/
        └── AnimationPresenter.lua (Viewmodel / local character animation presenter)
```

---

## 3. Implementation Code Examples

### A. AnimationServerAdapter (Infrastructure)
```lua
-- src/server/Infrastructure/Animation/AnimationServerAdapter.lua
local AnimationServerAdapter = {}
AnimationServerAdapter.__index = AnimationServerAdapter

export type PlayOptions = {
    FadeTime: number?,
    Weight: number?,
    Speed: number?,
    Priority: Enum.AnimationPriority?,
    Looped: boolean?,
}

function AnimationServerAdapter.new()
    local self = setmetatable({
        _trackCache = {}, -- [Animator] = { [animationId] = AnimationTrack }
    }, AnimationServerAdapter)
    return self
end

function AnimationServerAdapter:_getOrCreateTrack(animator: Animator, animationId: string): AnimationTrack
    if not self._trackCache[animator] then
        self._trackCache[animator] = {}
        
        -- Clean cache when animator / character is destroyed
        animator.AncestryChanged:Connect(function(_, parent)
            if not parent then
                self._trackCache[animator] = nil
            end
        end)
    end

    local cachedTrack = self._trackCache[animator][animationId]
    if cachedTrack then
        return cachedTrack
    end

    local animation = Instance.new("Animation")
    animation.AnimationId = animationId
    local track = animator:LoadAnimation(animation)
    animation:Destroy()

    self._trackCache[animator][animationId] = track
    return track
end

function AnimationServerAdapter:Play(animator: Animator, animationId: string, options: PlayOptions?): AnimationTrack?
    if not animator or not animator:IsDescendantOf(workspace) then
        return nil
    end

    local opts = options or {}
    local track = self:_getOrCreateTrack(animator, animationId)

    if opts.Priority then
        track.Priority = opts.Priority
    end
    if opts.Looped ~= nil then
        track.Looped = opts.Looped
    end

    track:Play(opts.FadeTime or 0.1, opts.Weight or 1, opts.Speed or 1)
    return track
end

function AnimationServerAdapter:Stop(animator: Animator, animationId: string, fadeTime: number?)
    if not self._trackCache[animator] then return end
    local track = self._trackCache[animator][animationId]
    if track and track.IsPlaying then
        track:Stop(fadeTime or 0.1)
    end
end

function AnimationServerAdapter:StopAll(animator: Animator, fadeTime: number?)
    if not self._trackCache[animator] then return end
    for _, track in pairs(self._trackCache[animator]) do
        if track.IsPlaying then
            track:Stop(fadeTime or 0.1)
        end
    end
end

return AnimationServerAdapter
```

---

### B. Client AnimationPresenter (Presentation with Trove)
```lua
-- src/client/Presentation/Animation/AnimationPresenter.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Trove = require(ReplicatedStorage.Packages.Trove)
local CatalogConfig = require(ReplicatedStorage.Shared.Domain.Config.CatalogConfig)

local AnimationPresenter = {}
AnimationPresenter.__index = AnimationPresenter

function AnimationPresenter.new(character: Model)
    local self = setmetatable({}, AnimationPresenter)
    self._trove = Trove.new()
    self._character = character
    self._tracks = {}

    local humanoid = character:WaitForChild("Humanoid")
    self._animator = humanoid:WaitForChild("Animator")

    return self
end

function AnimationPresenter:PlayByCatalogKey(catalogCategory: string, key: string, fadeTime: number?)
    local animId = CatalogConfig.Animations[catalogCategory] 
        and CatalogConfig.Animations[catalogCategory][key]

    if not animId then
        warn(string.format("[AnimationPresenter] Animation ID not found for %s.%s", catalogCategory, key))
        return nil
    end

    if not self._tracks[animId] then
        local animation = Instance.new("Animation")
        animation.AnimationId = animId
        self._tracks[animId] = self._animator:LoadAnimation(animation)
        animation:Destroy()
        self._trove:Add(self._tracks[animId])
    end

    local track = self._tracks[animId]
    track:Play(fadeTime or 0.1)
    return track
end

function AnimationPresenter:Destroy()
    self._trove:Clean()
    table.clear(self._tracks)
end

return AnimationPresenter
```

---

## 4. Best Practices
1. **Never Load in Loops**: Always query the track cache or use the Adapter/Presenter.
2. **Use Animation Events / Markers**: For synchronized VFX/Sound triggers (e.g. hit frame, footstep), use `track:GetMarkerReachedSignal("Hit")` rather than fragile `task.wait()` delays.
3. **Clean On Respawn**: Clear animation track references and troves when the character dies or respawns to avoid memory leaks.
