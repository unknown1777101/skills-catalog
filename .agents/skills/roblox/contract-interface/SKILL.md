---
name: roblox-contract-interface
category: Roblox
description: Designs, authors, and validates Contract Interface Types (*Types.lua) and DTO schemas for Roblox Luau Clean Architecture. Use when defining interface contracts for Presenters, Services, or Adapters, or enforcing Interface Segregation (ISP). DO NOT trigger for domain math logic or general UI layout scripting.
---

# Roblox Contract Interface Skill

## 🎯 Purpose & Scope
This skill guides the design, creation, and standardization of Contract Interfaces (`*Types.lua`) in Roblox Luau Clean Architecture projects.
It enforces Contract-First architecture, the Interface Segregation Principle (ISP), and strict type checking so that Controllers, Services, and Adapters can be developed, tested, and swapped independently.

---

## 🛑 Strict Guardrails / Batasan

1. **CONTRACT FILES ARE PURE TYPES**: Contract modules (`*Types.lua`) MUST only declare and export types (`export type I<Name> = { ... }`) and MUST return `nil`. They MUST NOT contain stateful runtime code.
2. **PREFIX CONVENTION (`I<Name>`)**: All contract interface types MUST be prefixed with `I` (e.g. `ILaneWorldPresenter`, `IBattleHUDPresenter`, `IDataStoreAdapter`).
3. **EXPLICIT METHOD SIGNATURES**: Every method on a contract interface MUST explicitly annotate `self`, parameter types, and return types.
4. **ENGLISH-ONLY DOCUMENTATION**: All docstrings (`--- @brief`, `--- @param`, `--- @return`) MUST be authored in standard professional English.

---

## 📥 Inputs & Outputs
- **Inputs**: Layer requirements, method signatures, parameter types, DTO shapes, and caller behavior needs.
- **Outputs**: Pure Moonwave-documented `*Types.lua` module exporting `I<ContractName>` returning `nil`.

---

## 📌 Lifecycle & Execution Workflow

### Step 1: Identify Callers & Behaviors
Determine what the caller (e.g., Knit Controller or UseCase) needs to accomplish. Keep methods focused and avoid leaking internal view/storage implementation details.

### Step 2: Author Contract Module (`*Types.lua`)
Create `<FeatureName>Types.lua`:
```lua
--!strict
--- @module FeatureTypes
--- @brief Contract interface and event definitions for <FeatureName>.

export type FeatureSnapshot = {
    Id: string,
    State: string,
}

--- Authoritative contract interface.
export type IFeaturePresenter = {
    Render: (self: any, data: FeatureSnapshot) -> (),
    Reset: (self: any) -> (),
    Destroy: (self: any) -> (),
}

return nil
```

### Step 3: Implement Contract in Concrete Class
In the concrete class (`<FeatureName>Presenter.lua`):
```lua
local FeatureTypes = require(script.Parent.FeatureTypes)
type IFeaturePresenter = FeatureTypes.IFeaturePresenter

local FeaturePresenter = {}
FeaturePresenter.__index = FeaturePresenter

function FeaturePresenter.New(): IFeaturePresenter
    local self = setmetatable({}, FeaturePresenter)
    return (self :: any) :: IFeaturePresenter
end
```

### Step 4: Consume Contract via IoC Container / Type Annotation
In the caller (Controller or Service):
```lua
local FeatureTypes = require(script.Parent.Parent.Presentation.Feature.FeatureTypes)
type IFeaturePresenter = FeatureTypes.IFeaturePresenter

local presenter: IFeaturePresenter = Container.Resolve("IFeaturePresenter")
presenter:Render(snapshot)
```

---

## 🔍 Verification Checklist

- [ ] Contract file ends in `Types.lua` and returns `nil`.
- [ ] Contract interface types start with `I` (e.g., `ILaneWorldPresenter`).
- [ ] All method signatures have explicit parameter and return type annotations.
- [ ] All comments and Moonwave docstrings are in professional English.

---

## 📚 References
- Contract rules and Interface Segregation guide: [references/contract-rules.md](file://./references/contract-rules.md)
