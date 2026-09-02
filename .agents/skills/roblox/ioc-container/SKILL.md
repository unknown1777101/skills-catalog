---
name: roblox-ioc-container
category: Roblox
description: Designs, creates, tests, and registers lightweight Inversion of Control (IoC) Containers and dynamic Dependency Injection (DI) for Roblox Luau Clean Architecture projects. Use when implementing dependency injection, container registries, or decoupling controllers from presenters. DO NOT trigger for general UI design or non-DI domain logic.
---

# Roblox IoC Container & Dependency Injection Skill

## 🎯 Purpose & Scope
This skill provides automated standards and workflows for creating, structuring, and maintaining lightweight, deterministic Inversion of Control (IoC) Containers in Roblox Luau projects.
It enforces dynamic Dependency Injection (DI) to decouple Knit Controllers and Services from concrete Presenters, Views, and Infrastructure Adapters.

---

## 🛑 Strict Guardrails / Batasan

1. **PROHIBITED IN DOMAIN LAYER**: The IoC Container belongs to `src/shared/Infrastructure/Container/` or `src/client/Infrastructure/Container/`. The pure Domain layer MUST remain 100% agnostic and MUST NEVER reference or call `Container`.
2. **BOOTSTRAP REGISTRATION ONLY**: Concrete dependencies MUST be registered during application bootstrap (`init.client.lua` or `init.server.lua`) before `Knit.Start()`.
3. **MANDATORY BDD UNIT TESTS**: Every IoC Container implementation MUST include a comprehensive `Container.spec.lua` test suite verifying factory resolution, parameter passing, error on unregistered keys, and singleton resolution.
## 📥 Inputs & Outputs
- **Inputs**: Contract Interface name (`I<ContractName>`), factory constructor or singleton instance, and resolution arguments.
- **Outputs**: Resolved dependency instance conforming to contract, clean decoupled controllers/services, and passing `Container.spec.lua`.

---

## 📌 Lifecycle & Execution Workflow

### Step 1: Scaffold Container Module
Place the pure container in `src/shared/Infrastructure/Container/Container.lua`:
```lua
--!strict
--- @module Container
--- @brief Lightweight Inversion of Control (IoC) Container for Dynamic Dependency Injection.

export type Factory<T> = (...any) -> T

local Container = {}
local registry: { [string]: Factory<any> } = {}
local singletons: { [string]: any } = {}

function Container.Register(contractName: string, factory: Factory<any>)
    registry[contractName] = factory
    singletons[contractName] = nil
end

function Container.RegisterInstance(contractName: string, instance: any)
    singletons[contractName] = instance
    registry[contractName] = nil
end

function Container.Resolve(contractName: string, ...: any): any
    if singletons[contractName] ~= nil then
        return singletons[contractName]
    end

    local factory = registry[contractName]
    if not factory then
        error(string.format("[Container] No provider registered for contract '%s'", contractName))
    end

    return factory(...)
end

function Container.Has(contractName: string): boolean
    return registry[contractName] ~= nil or singletons[contractName] ~= nil
end

function Container.Clear()
    table.clear(registry)
    table.clear(singletons)
end

return Container
```

### Step 2: Write BDD Spec Suite
Create `src/shared/Infrastructure/Container/Container.spec.lua` and test registration, dynamic factory instantiation with arguments, exception on missing keys, and singleton caching.

### Step 3: Register Bindings in Bootstrap
In `src/client/init.client.lua` or `src/server/init.server.lua`:
```lua
Container.Register("ILaneWorldPresenter", function()
    return LaneWorldPresenter.New()
end)

Container.Register("IBattleHUDPresenter", function(onDeployRequested)
    return BattleHUDPresenter.New(onDeployRequested)
end)
```

### Step 4: Resolve in Controllers / Services
Controllers only resolve dynamically without static require coupling:
```lua
function BattleController:KnitStart()
    self.WorldPresenter = Container.Resolve("ILaneWorldPresenter")
    self.HUDPresenter = Container.Resolve("IBattleHUDPresenter", function(cardId)
        self:DeployCard(cardId)
    end)
end
```

---

## 🔍 Verification Checklist

- [ ] Container is located in `src/shared/Infrastructure/Container/` or `src/client/Infrastructure/Container/`.
- [ ] No Domain module requires `Container`.
- [ ] `Container.spec.lua` passes 100% on `rdk test`.
- [ ] Controllers and Services depend on Contract Interfaces (`*Types.lua`) and resolve via `Container.Resolve()`.

---

## 📚 References
- Detailed container patterns & test mocking: [references/container-patterns.md](file://./references/container-patterns.md)
