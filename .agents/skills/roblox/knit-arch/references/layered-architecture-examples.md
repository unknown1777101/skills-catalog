# Roblox + Knit Layered Architecture Reference

This reference document provides concrete examples and implementation details for the Roblox + Knit clean 5-layer architecture.

## 1. Directory Structure

```text
src/
├── shared/
│   ├── Domain/
│   │   ├── Combat/
│   │   │   ├── DamageRules.lua
│   │   │   └── CombatErrors.lua
│   │   └── Config/
│   │       └── CatalogConfig.lua
│   │
│   ├── Application/
│   │   └── Combat/
│   │       └── AttackUseCase.lua
│   │
│   └── Contracts/
│       ├── IHealthRepository.lua
│       └── ICombatPresenter.lua
│
├── server/
│   ├── Services/
│   │   └── CombatService.lua
│   │
│   └── Infrastructure/
│       └── Combat/
│           └── RobloxHealthRepository.lua
│
└── client/
    ├── Controllers/
    │   └── CombatController.lua
    │
    └── Presentation/
        └── CombatPresenter.lua
```

## 2. Layer Summary

| Layer | Function | Purpose |
|---|---|---|
| **Domain** | Core game rules, configs & error enums | "How do game rules work?" |
| **Application** | Execution flow / Use Case | "What happens when a player performs an action?" |
| **Interface / Adapter** | Framework boundary (Knit) | Bridge between framework and Application |
| **Infrastructure** | Roblox technical implementation | "How is this done technically in Roblox?" |
| **Presentation** | Player experience (UI/VFX/Audio + Trove) | Player-facing visual and audio rendering |
| **Contract** | Abstraction boundary | Loose coupling between layers |

---

## 3. Domain Layer Examples

### DamageRules (Calculations)
```lua
-- src/shared/Domain/Combat/DamageRules.lua
local DamageRules = {}

function DamageRules.CalculateDamage(
    attack: number,
    defense: number
): number
    return math.max(1, attack - defense)
end

return DamageRules
```

### CombatErrors (Standardized Error Enums)
```lua
-- src/shared/Domain/Combat/CombatErrors.lua
local CombatErrors = {
    INVALID_TARGET = "INVALID_TARGET",
    TARGET_DEAD = "TARGET_DEAD",
    OUT_OF_STAMINA = "OUT_OF_STAMINA",
    ON_COOLDOWN = "ON_COOLDOWN",
}

return table.freeze(CombatErrors)
```

### CatalogConfig (Centralized Asset Catalog)
```lua
-- src/shared/Domain/Config/CatalogConfig.lua
local CatalogConfig = {
    Audio = {
        Slash = "rbxassetid://9114223120",
        HitWood = "rbxassetid://9114223450",
        HitFlesh = "rbxassetid://9114223800",
    },
    VFX = {
        SlashEffect = "rbxassetid://10874523901",
        HitSparks = "rbxassetid://10874524102",
    },
    Products = {
        RevivePotion = 1592019482,
        VIPPass = 84920194,
    },
}

return table.freeze(CatalogConfig)
```

---

## 4. Application Layer Example: AttackUseCase (Result Pattern)

The Application layer defines the execution flow of use cases. It coordinates domain calculations and calls interfaces/contracts, returning a standardized `Result` table.

```lua
-- src/shared/Application/Combat/AttackUseCase.lua
local DamageRules = require(
    script.Parent.Parent.Parent.Domain.Combat.DamageRules
)
local CombatErrors = require(
    script.Parent.Parent.Parent.Domain.Combat.CombatErrors
)

export type Result<T> = {
    Success: boolean,
    Data: T?,
    Error: string?,
}

local AttackUseCase = {}
AttackUseCase.__index = AttackUseCase

export type Dependencies = {
    HealthRepository: any, -- Referencing IHealthRepository contract
}

function AttackUseCase.new(dependencies: Dependencies)
    return setmetatable({
        HealthRepository = dependencies.HealthRepository,
    }, AttackUseCase)
end

function AttackUseCase:Execute(
    attacker: Player,
    target: Model,
    attack: number,
    defense: number
): Result<{ Damage: number, Target: Model }>
    if not target then
        return {
            Success = false,
            Error = CombatErrors.INVALID_TARGET,
        }
    end

    local currentHealth = self.HealthRepository:GetHealth(target)

    if currentHealth <= 0 then
        return {
            Success = false,
            Error = CombatErrors.TARGET_DEAD,
        }
    end

    local damage = DamageRules.CalculateDamage(attack, defense)
    self.HealthRepository:ApplyDamage(target, damage)

    return {
        Success = true,
        Data = {
            Damage = damage,
            Target = target,
        },
    }
end

return AttackUseCase
```

---

## 5. Contract Layer Example: IHealthRepository

Contracts act as abstraction boundaries between layers to enable mock testing and decoupling.

```lua
-- src/shared/Contracts/IHealthRepository.lua
export type IHealthRepository = {
    GetHealth: (
        self: IHealthRepository,
        target: Model
    ) -> number,

    ApplyDamage: (
        self: IHealthRepository,
        target: Model,
        amount: number
    ) -> (),
}

return {}
```

---

## 6. Infrastructure Layer Example: RobloxHealthRepository

Infrastructure handles low-level Roblox API interactions (such as Humanoids, ProfileStores, Workspace lookups).

```lua
-- src/server/Infrastructure/Combat/RobloxHealthRepository.lua
local RobloxHealthRepository = {}
RobloxHealthRepository.__index = RobloxHealthRepository

function RobloxHealthRepository.new()
    return setmetatable({}, RobloxHealthRepository)
end

function RobloxHealthRepository:GetHealth(target: Model): number
    local humanoid = target:FindFirstChildOfClass("Humanoid")
    if not humanoid then
        return 0
    end
    return humanoid.Health
end

function RobloxHealthRepository:ApplyDamage(target: Model, amount: number)
    local humanoid = target:FindFirstChildOfClass("Humanoid")
    if not humanoid then
        return
    end
    humanoid:TakeDamage(amount)
end

return RobloxHealthRepository
```

---

## 7. Interface / Adapter Layer (Knit Service) Example

Knit Services act as thin boundaries to serialize network requests and delegate them to Application UseCases.

```lua
-- src/server/Services/CombatService.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Knit = require(ReplicatedStorage.Packages.Knit)
local AttackUseCase = require(
    ReplicatedStorage.Shared.Application.Combat.AttackUseCase
)
local RobloxHealthRepository = require(
    script.Parent.Parent.Infrastructure.Combat.RobloxHealthRepository
)

local CombatService = Knit.CreateService({
    Name = "CombatService",
    Client = {
        AttackResult = Knit.CreateSignal(),
    },
})

function CombatService:KnitInit()
    local healthRepository = RobloxHealthRepository.new()
    self.AttackUseCase = AttackUseCase.new({
        HealthRepository = healthRepository,
    })
end

function CombatService:Attack(player: Player, target: Model)
    local attack = 25
    local defense = 10

    return self.AttackUseCase:Execute(player, target, attack, defense)
end

function CombatService.Client:Attack(player: Player, target: Model)
    local result = self.Server:Attack(player, target)
    if result.Success then
        self.AttackResult:Fire(player, {
            Damage = result.Damage,
            Target = result.Target,
        })
    end
    return result.Success
end

return CombatService
```

---

## 8. Presentation Layer Examples

### ICombatPresenter (Contract)
```lua
-- src/shared/Contracts/ICombatPresenter.lua
export type AttackResult = {
    Damage: number,
    Target: Model,
}

export type ICombatPresenter = {
    ShowAttackResult: (
        self: ICombatPresenter,
        result: AttackResult
    ) -> (),
}

return {}
```

### CombatPresenter (Presentation Implementation with Trove & CatalogConfig)
```lua
-- src/client/Presentation/CombatPresenter.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")
local Trove = require(ReplicatedStorage.Packages.Trove)
local CatalogConfig = require(
    ReplicatedStorage.Shared.Domain.Config.CatalogConfig
)

local CombatPresenter = {}
CombatPresenter.__index = CombatPresenter

function CombatPresenter.new()
    local self = setmetatable({}, CombatPresenter)
    self._trove = Trove.new()
    return self
end

function CombatPresenter:ShowAttackResult(result)
    self:ShowDamageNumber(result.Target, result.Damage)
    self:PlayHitEffect(result.Target)
    self:PlayHitSound(result.Target)
    self:ShakeCamera()
end

function CombatPresenter:PlayPredictiveSwing()
    -- Instant local visual feedback before server confirmation (CSP)
    local sound = Instance.new("Sound")
    sound.SoundId = CatalogConfig.Audio.Slash
    sound.Parent = SoundService
    sound:Play()

    -- Automatically garbage collect the sound instance when finished
    self._trove:Add(sound.Ended:Connect(function()
        sound:Destroy()
    end))
end

function CombatPresenter:ShowDamageNumber(target: Model, damage: number)
    print(string.format("-%d HP", damage))
    -- (Implementation for BillboardGui / React UI managed via Trove)
end

function CombatPresenter:PlayHitEffect(target: Model)
    local root = target:FindFirstChild("HumanoidRootPart")
    if not root then return end
    -- (Spawn particle effect and attach to self._trove)
end

function CombatPresenter:PlayHitSound(target: Model)
    local sound = Instance.new("Sound")
    sound.SoundId = CatalogConfig.Audio.HitFlesh
    sound.Parent = SoundService
    sound:Play()

    self._trove:Add(sound.Ended:Connect(function()
        sound:Destroy()
    end))
end

function CombatPresenter:ShakeCamera()
    -- (Camera shake logic attached to Trove)
end

function CombatPresenter:Destroy()
    self._trove:Clean()
end

return CombatPresenter
```

---

## 9. Knit Controller Example (With Client-Side Prediction & Trove)

Knit Controllers coordinate client inputs, trigger optimistic visuals (CSP), and listen to server confirmation.

```lua
-- src/client/Controllers/CombatController.lua
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Knit = require(ReplicatedStorage.Packages.Knit)
local Trove = require(ReplicatedStorage.Packages.Trove)
local CombatPresenter = require(
    script.Parent.Parent.Presentation.CombatPresenter
)

local CombatController = Knit.CreateController({
    Name = "CombatController",
})

function CombatController:KnitInit()
    self._trove = Trove.new()
    self.CombatPresenter = CombatPresenter.new()
    self._trove:Add(self.CombatPresenter)
end

function CombatController:KnitStart()
    self.CombatService = Knit.GetService("CombatService")

    -- Server authoritative response listener
    self._trove:Add(
        self.CombatService.AttackResult:Connect(function(result)
            self.CombatPresenter:ShowAttackResult(result)
        end)
    )

    -- Input listener with Trove
    self._trove:Add(
        UserInputService.InputBegan:Connect(function(input, processed)
            if processed then return end
            if input.UserInputType == Enum.UserInputType.MouseButton1 then
                self:Attack()
            end
        end)
    )
end

function CombatController:GetTarget(): Model?
    local player = Players.LocalPlayer
    local mouse = player:GetMouse()
    local target = mouse.Target
    if not target then return nil end
    return target:FindFirstAncestorOfClass("Model")
end

function CombatController:Attack()
    local target = self:GetTarget()
    if not target then return end

    -- 1. Client-Side Prediction (Instant feedback)
    self.CombatPresenter:PlayPredictiveSwing()

    -- 2. Server Request (Authoritative validation)
    self.CombatService:Attack(target)
end

return CombatController
```

---

## 10. Execution Flow Chart

### Request Flow (Input to Server Execution):
```
Mouse Click (Client Input)
     │
     ▼
CombatController (Client Adapter)
     │
     ▼ [Network Request]
CombatService (Server Adapter)
     │
     ▼
AttackUseCase (Application Flow)
     │
     ├─> DamageRules (Domain Math calculation)
     │
     └─> IHealthRepository (Repository contract boundary)
               │
               ▼ [Resolved to]
         RobloxHealthRepository (Infrastructure layer implementation)
               │
               ▼
         Humanoid:TakeDamage() (Roblox Instance call)
```

### Response Flow (Network Event to Client Visuals):
```
Attack Result (Network Signal)
     │
     ▼
CombatController (Client Adapter listener)
     │
     ▼
ICombatPresenter (Presenter contract boundary)
     │
     ▼ [Resolved to]
CombatPresenter (Presentation layer implementation)
     ├── Damage Number BillboardGui
     ├── Character Hit Animation
     ├── Particle Emitter VFX
     ├── Sound Service Playback
     └── Camera Shake Effect
```

---

## 11. Dependency Direction

Dependencies must always point toward the more core layers.

```text
              DOMAIN
                ↑
           APPLICATION
           ↑         ↑
       ADAPTER     CONTRACT
                     ↑
              INFRASTRUCTURE
```

### Client Dependency Flow:
```text
Presentation
     ↑
Controller
     ↓
Application
     ↓
Domain
```

### Infrastructure Boundary Flow:
```text
Application
     ↓
Contract
     ↑
Infrastructure
```

---

## 12. Physics Rules and Separation

For physical movements, split the logic into rules, flows, and technical implementations.

* **Physics Rule (Domain)**: Game formulas and rules (e.g., maximum speed, acceleration, drag calculations).
* **Physics Flow (Application)**: Sequence of actions (e.g., player accelerate -> calculate desired movement -> apply movement).
* **Roblox Physics API (Infrastructure)**: Concrete Roblox API objects (e.g., `LinearVelocity`, `VectorForce`, `AssemblyLinearVelocity`, `AlignPosition`, `NetworkOwnership`).

### Structure:
```text
MoveVehicleUseCase (Application)
        ↓
MovementRules (Domain)
        ↓
IPhysicsMover (Contract)
        ↑
RobloxPhysicsMover (Infrastructure)
```

### RobloxPhysicsMover Example (Infrastructure)
```lua
local RobloxPhysicsMover = {}
RobloxPhysicsMover.__index = RobloxPhysicsMover

function RobloxPhysicsMover.new()
    return setmetatable({}, RobloxPhysicsMover)
end

function RobloxPhysicsMover:Move(
    part: BasePart,
    velocity: Vector3
)
    part.AssemblyLinearVelocity = velocity
end

return RobloxPhysicsMover
```

---

## 13. Controller and Presentation Interaction

The Controller is allowed to access the Presentation layer, but the Presentation layer should never access the Controller directly to avoid circular dependencies.

```text
CombatController (Controller)
      ↓
ICombatPresenter (Contract)
      ↑
CombatPresenter (Presentation)
```

---

## 14. Controller Reusability & Coordinator Pattern

Since Knit Controllers are tied to the framework, they are not reusable. To keep client logic modular, move complex orchestration/flows into a **Coordinator** component.

```text
KnitCombatController (Framework-specific adapter)
        ↓
CombatCoordinator (Orchestrator)
       ↙     ↘
Application  Presenter
```

---

## 15. The 12 Golden Rules

1. **Domain must not know about Knit**: Domain holds rules and remains framework-independent.
2. **Domain must not know about Roblox APIs**: Domain is free from `Workspace`, `DataStore`, `RemoteEvent`, etc., except for primitive mathematical types.
3. **Application manages flow, not technical details**: Application is *WHAT + WHEN*; Infrastructure is *HOW*.
4. **Knit Services must be thin**: Knit Services only serialize inputs, validate boundaries, and call Application UseCases.
5. **Knit Controllers must be thin**: Knit Controllers only manage input/network events and coordination.
6. **No business/game rules in Services or Controllers**: Keep them in the Domain or Application layers.
7. **Use Contracts at architectural boundaries**: Decouple layers (e.g., Application -> Contract <- Infrastructure).
8. **Do not create Contracts for every module**: Only use Contracts where they provide real decoupling value.
9. **Separate Physics layers**: Rules in Domain, Flow in Application, Roblox API details in Infrastructure.
10. **Presentation is only responsible for player experience**: UI, VFX, Sound, Animation, HUD, and Camera. It must not determine game rules.
11. **Dependencies flow inward**: Outer Layer -> Application -> Domain.
12. **Knit is a framework, not an architecture**: Knit acts as an Adapter/Boundary, not a replacement for Domain, Application, or Presentation.

---

## 16. Final Architecture Blueprint

```text
CLIENT

Input (Mouse/Keyboard)
  ↓

Knit Controller (Adapter)
  ↓

Coordinator / Application UseCase
  ↓

Service Request (Network Signal)
  │
  ▼

SERVER

Knit Service (Adapter)
  ↓

Application UseCase (Flow)
  ↓

Domain Rules (Calculations)
  ↓

Contract (Boundary)
  ↑

Infrastructure (Roblox Implementation)
  ↓

Roblox API (Humanoid, Instance, DataStore)
```

### Visual Response Flow:
```text
Server Result
  ↓
Knit Service
  ↓
Knit Controller
  ↓
Presenter Contract
  ↓
Presentation (UI, VFX, Animation, Sound, Camera)
```

---

## 17. Core Principles

This architecture ensures that components can be swapped without rewriting core game rules:
* **Domain**: Highly reusable.
* **Application**: Reusable.
* **Contract**: Stable boundary.
* **Infrastructure**: Replaceable.
* **Presentation**: Replaceable.
* **Knit**: Replaceable framework boundary.

