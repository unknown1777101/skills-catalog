---
name: roblox-knit-arch
category: Roblox
description: Enforces Roblox Knit 5-layer Clean Architecture with 4 Domain subcategories (Component, Entity, Standalone, Catalog), Feature-Sliced sharding, UseCases, CSP, Trove, and RDK unit testing. DO NOT use for project init or git.
---

# 🏛️ Roblox Knit Clean Architecture Standard

## 🎯 Purpose & Scope
This skill provides comprehensive, deterministic guidelines for implementing a production-grade **5-Layer Clean Architecture** on Roblox game projects using the **Knit** framework. It guarantees separation of concerns, testability, memory safety via `Trove`, zero latency via Client-Side Prediction (CSP), engine independence in the Domain layer, **scalability for large-scale codebases (100–1000+ files)**, and **mandatory BDD unit testing with RDK (`rdk test`)**.

## 📌 When to Use
- Designing new game features, systems, services, controllers, or presentation views in Roblox + Knit.
- Organizing the codebase into 5 architectural layers and sharding the Domain into 4 structured subcategories.
- Implementing Application UseCases with standardized `Result<T>` contracts.
- Building authoritative thin Knit Services and coordinator Knit Controllers.
- Creating responsive MVP UI Views and Presenters with `Trove` lifecycle management.
- Implementing Client-Side Prediction (CSP) and server reconciliation.

## 🛑 When Not to Use
- **DO NOT** trigger for initializing a new repository workspace (use `roblox-project-initialization`).
- **DO NOT** use for general Git version control operations (use `git`).
- **DO NOT** use for standalone non-Roblox web or Node.js development.

## 📥 Inputs
- **Required**: Feature specification, domain rules, state models, remote network requirements, and UI presentation wireframes.
- **Optional**: Asset IDs, Sound IDs, and Animation IDs (must be centralized in `CatalogConfig.lua`).

---

## 🛑 Strict Guardrails (The 5 Layers)

### 1. Domain Layer (`src/shared/Domain/`)
* **Purpose**: Store core game rules, mathematical formulas, state models, and centralized catalogs.
* **4 Structured Subcategories**:
  - `Domain/Component/<Name>/`: Reusable atomic behaviors & traits (`Health`, `Movement`, `Stamina`).
  - `Domain/Entity/<Name>/`: Concrete game world objects composed of child components (`Unit`, `Base`).
  - `Domain/Standalone/<Name>/`: Global calculations and rules without an entity (`Supply`, `Combat`, `Targeting`).
  - `Domain/Catalog/<Name>/`: Data-driven blueprints with modular `Definitions/` subfolder (`UnitCatalog`).
* **Allowed**: Pure Luau rules, math calculations, entity factories, `CatalogConfig.lua`, standardized error enums.
* **Prohibited**: Calling `Knit`, `Workspace`, `DataStore`, `RemoteEvent`, `Instance.new()`, UI, Camera, Animation, VFX, `HttpService`, `task.wait()`, or Roblox physics engine APIs.
* **Golden Rule**: **Domain must not depend on any outer layer. It must run as pure Luau and remain testable outside Roblox Studio.**

### 2. Application Layer (`src/shared/Application/`)
* **Purpose**: Manage the game's flow and use cases ("What should happen when an action is performed?").
* **Allowed**:
  - Orchestrating the Domain layer for calculations and state mutations.
  - Organizing execution flow and calling outer layers via Contracts/Interfaces.
  - Returning standardized `Result<T>` tables:
    ```lua
    export type Result<T> = {
        Success: boolean,
        Data: T?,
        Error: string?,
    }
    ```
* **Prohibited**: Calling `Knit.GetService()`, accessing `Workspace` or `DataStore` directly, spawning 3D visuals, playing animations, or creating UI.
* **Golden Rule**: **Application knows WHAT and WHEN, not HOW Roblox performs it.**

### 3. Interface / Adapter Layer (Knit Framework)
* **Knit Service (`src/server/Services/` — Thin Server State Authority & Data Provider)**:
  - Acts as a network endpoint, validation boundary, and caller of Application UseCases.
  - Emits lightweight data snapshots (DTO tables) via Knit Signals (e.g. `BattleStateUpdated`, `CombatBeatBroadcast`).
  - *Strictly Prohibited*: Instantiating 3D visual parts in Workspace, manipulating `Lighting`, or executing client visual rendering on the server.
* **Knit Controller (`src/client/Controllers/` — Client Coordinator)**:
  - Acts as client entry point and coordinator for input bindings and networking.
  - Listens to server data signals and commands the Presentation layer to render models, play animations, and update HUD bars.
  - *Prohibited*: Hosting monolithic UI rendering or heavy physics loops directly inside controllers.
* **Golden Rule**: **Server provides authoritative raw data; Client coordinates presentation.**

### 4. Infrastructure Layer (`src/*/Infrastructure/`)
* **Purpose**: Technical implementations wrapping Roblox platform APIs, storage, and spatial conversions.
* **Allowed**: `DataStoreService`, `ProfileStore`, `Workspace` raycasting, pathfinding, and spatial coordinate mappers (`GridWorldMapper`).
* **Golden Rule**: **Infrastructure answers "How is this done technically?". Application only interacts with it through contracts.**

### 5. Presentation Layer (`src/client/Presentation/` — Client-Exclusive Visual Realm)
* **Purpose**: Manage everything the player sees, hears, or feels (3D Arenas, UI Views, Presenters, Animation, Camera Shake, VFX, Sound, HUD).
* **Allowed**: Procedural 3D environment generation, lighting setup, VFX, audio playback, HUD animations, and lifecycle cleanup via `Trove`.
* **Golden Rule**: **Presentation only renders state/results from server data and never determines authoritative game rules.**

---

## 🏢 Large-Scale Organization Standards (100–1000+ Files)

### 1. Standard 5-Layer & Categorized Domain Layout
By default, projects organize files by architectural layers with a strict 4-category taxonomy in the Domain layer:
```text
src/
├── shared/
│   ├── Core/                           <-- Shared Utilities, Math, Types, Errors
│   ├── Domain/                         <-- Pure Domain Layer (4 Categories)
│   │   ├── Component/                  <-- Behavior components (Health, Movement)
│   │   ├── Entity/                     <-- Composite entities (Unit, Base)
│   │   ├── Standalone/                 <-- Global calculators (Supply, Combat, Targeting)
│   │   └── Catalog/                    <-- Data catalogs (UnitCatalog, CatalogConfig)
│   └── Application/                    <-- Application UseCases (*UseCase.lua)
├── server/
│   ├── Services/                       <-- Server Knit Services (*Service.lua)
│   └── Infrastructure/                 <-- Server Adapters (DataStoreAdapter)
└── client/
    ├── Controllers/                    <-- Client Knit Controllers (*Controller.lua)
    ├── Presentation/                   <-- Views (*View.lua) & Presenters (*Presenter.lua)
    └── Infrastructure/                 <-- Client Adapters (PreloadAdapter)
```

### 2. Vertical Feature-Sliced Sharding (For Massive Systems)
For massive multi-game systems exceeding 500+ files, modules may optionally be grouped vertically by feature slice:
`src/shared/Features/[FeatureName]/Domain/[Component|Entity|Standalone|Catalog]/`

### 3. Taxonomic Data Sharding (Rule of 7±2)
- No directory should contain more than **15–20 files**.
- When data items (Units, Weapons, Cards, Quests) exceed 20 files, sub-shard hierarchically:
  `Domain/Catalog/[CatalogName]/Definitions/[Category]/[Tier]/`

### 4. Standardized File Suffixes
- **Domain Entity**: `*Entity.lua` (e.g. `UnitEntity.lua`)
- **Domain Config/Def**: `*Config.lua` or `*Def.lua` (e.g. `SupplyConfig.lua`, `RifleSquad.lua`)
- **Domain Unit Test**: `*.spec.lua` (e.g. `Combat.spec.lua`)
- **Application UseCase**: `*UseCase.lua` (e.g. `DeployCardUseCase.lua`)
- **Knit Service**: `*Service.lua` (e.g. `BattleSessionService.lua`)
- **Knit Controller**: `*Controller.lua` (e.g. `BattleController.lua`)
- **Presentation View**: `*View.lua` (e.g. `BattleHUDView.lua`)
- **Presentation Presenter**: `*Presenter.lua` (e.g. `BattleHUDPresenter.lua`)

### 5. Strict Separation: Global Config vs Individual Definition
- **`*Config.lua` (Universal System Constants)**: Reserved EXCLUSIVELY for universal system-wide constants, global formulas, baseline scoring weights, and match parameters that apply identically across the entire game (e.g. `StartingSupply = 5`, `MaxSupply = 10`, `BaseRegenInterval = 2.5`, `DamageMatrix`, `RetargetInterval = 0.25`).
  - *Strictly Prohibited*: Placing individual unit/weapon stats (e.g. `SniperDamage = 120`, `RifleRange = 22`) inside a Config file.
- **`Definitions/<VariantName>.lua` (Per-Entity / Per-Blueprint Stats)**: Used for ANY parameter whose value differs per individual unit, weapon, card, item, or enemy (e.g. `BaseDamage`, `AttackInterval`, `Range`, `MaxHealth`, `SupplyCost`, `MoveSpeed`, `ArmorClass`). Each variant MUST declare its individual stats in its dedicated file inside `Definitions/`.

---

## 🚀 5 Production-Grade Pillars

### 1. ⚡ Client-Side Prediction (CSP) & Server Reconciliation
For latency-sensitive mechanics (card deployment, unit movement, ability triggers):
- **Client (Optimistic Flow)**:
  1. Player inputs action.
  2. Controller applies predicted local visual state via `Presenter`.
  3. Controller fires network request to `KnitService`.
- **Server (Authoritative Validation)**:
  1. `KnitService` invokes `UseCase`.
  2. If valid: Server state mutates and broadcasts confirmation signal.
  3. If invalid: Server returns rejection and client reconciles predicted state.

### 2. 🧹 Memory Management & Lifecycle Cleanup (`Trove`)
Memory leaks from orphaned connections, running tweens, and active signals are strictly prohibited.
- Every `Presenter`, `Controller`, and `View` that binds events or creates instances **MUST** maintain an internal `Trove` instance and clean up on teardown (`trove:Clean()`).

### 3. 📡 State Replication Strategy
- **Event-Driven (Knit Signals)**: For discrete actions and momentary notifications (e.g. `CombatBeatBroadcast`, `CardDeployed`).
- **State-Driven (ProfileStore / Replica / Data DTOs)**: For persistent structured session data (Player Supply, Base HP, Deck loadout).

### 4. 🗄️ Centralized Asset & Config Catalog (`CatalogConfig`)
- Raw asset IDs (`rbxassetid://123456`) **MUST NOT** be hardcoded inside Services, Controllers, or Views.
- All asset IDs must be registered in `src/shared/Domain/Catalog/CatalogConfig.lua`.

### 5. ⚠️ Standardized Result & Error Enums
- Every UseCase must return a standardized `Result<T>` table: `{ Success = boolean, Data = T?, Error = string? }`.

### 6. 🌐 English-Only & RDK Documentation Standard (Configs, Logs & Tests)
- **Mandatory Config Documentation**: Every `*Config.lua` and `*Def.lua` module MUST include standard Moonwave/RDK docstring headers (`--- @module`, `--- @brief`) and **EVERY SINGLE key/parameter MUST have an explicit English comment** detailing its purpose, units (seconds, studs, multipliers, percentages), and balancing impact.
- **English-Only**: All code comments, docstrings, debug logs (`print`, `warn`), runtime errors (`error`), validation error strings (`return false, "..."`), and BDD test descriptions (`describe(...)`, `it(...)`) **MUST** be authored in **standard professional English**.

### 7. 🔌 Strict MVP Pattern & Contract-First Interface Types
- **Controllers MUST NEVER Access Views Directly**: A Knit Controller is strictly a coordinator. It must ONLY communicate with `Presenter` classes. The `Presenter` owns and controls the `View`.
- **Contract-First Interface Types**: Whenever a presenter, visual layer, or infrastructure provider can have multiple implementations or is expected to change/evolve (e.g., swapping 3D part tokens to skinned mesh rigs, switching HUD layouts, or alternative audio providers), it **MUST define an explicit Contract/Interface Type** (`*Types.lua` exporting `export type I<Name> = { ... }`). Callers must depend on the Contract Interface, guaranteeing plug-and-play substitution.
- **Dynamic IoC Container Injection**: Concrete presenters and infrastructure adapters are registered into a centralized IoC Container (`src/shared/Infrastructure/Container/Container.lua`) during client bootstrap (`init.client.lua`). Controllers resolve dependencies dynamically (`Container.Resolve("I<ContractName>", ...)`) based on contract names, ensuring zero static dependencies on concrete presentation classes and enabling frictionless test mocks.

---

## 📋 Workflow
1. **Inspect**: Identify feature specifications, domain rules, state structures, and UI requirements.
2. **Decide**: Categorize domain modules into `Component/`, `Entity/`, `Standalone/`, or `Catalog/`.
3. **Execute**:
   - Write Domain modules and accompany them with `*.spec.lua` BDD test suites.
   - Author Application UseCases (`*UseCase.lua`) in `src/shared/Application/` returning `Result<T>`.
   - Build Server Knit Services (`*Service.lua`) as thin data providers emitting signals (no 3D visual parts on server).
   - Build Client Knit Controllers (`*Controller.lua`) as coordinators.
   - Build Client Presentation Views (`*View.lua`) and Presenters (`*Presenter.lua`) with `Trove` and responsive `UIScale`.
4. **Validate**: Execute `rdk test` to ensure 100% unit tests pass across all Domain modules.
5. **Report**: Confirm layer architecture integrity and test verification results to the user.

## 🔀 Decision Rules
- If logic performs game math, damage calculation, or validation rules → Place in **Domain Layer** as pure Luau.
- If logic coordinates multiple domains or executes a user action flow → Place in **Application Layer (`*UseCase.lua`)**.
- If logic handles networking, player sessions, or Knit remote endpoints → Place in **Interface Layer (`*Service.lua` or `*Controller.lua`)**.
- If logic wraps Roblox platform APIs (DataStore, raycasting) → Place in **Infrastructure Layer**.
- If logic renders UI, 3D meshes, particles, sounds, or tweens → Place in **Presentation Layer**.

## 🔍 Verification Checklist
- [ ] Are Domain modules strictly categorized into `Component/`, `Entity/`, `Standalone/`, or `Catalog/`?
- [ ] Does every Domain module have an accompanying `.spec.lua` file?
- [ ] Do all unit tests pass with 100% success via `rdk test`?
- [ ] Are UseCases returning standardized `Result<T>` tables?
- [ ] Are Server Services pure data providers without server-side 3D visual instantiation?
- [ ] Are all dynamic connections, tweens, and instances managed via `Trove`?
- [ ] Are all asset IDs centralized inside `CatalogConfig.lua`?

## 📤 Output
- Scalable, modular Roblox game codebases organized into 5 clean layers and 4 domain subcategories with 100% verified unit test coverage via **RDK (`rdk test`)**.

## 📚 References
- For component behaviors, refer to [roblox-domain-component](../domain-component/SKILL.md).
- For entity composition, refer to [roblox-domain-entity](../domain-entity/SKILL.md).
- For standalone systems, refer to [roblox-domain-standalone](../domain-standalone/SKILL.md).
- For data definitions, refer to [roblox-domain-definition](../domain-definition/SKILL.md).
- For testing procedures, refer to [roblox-test-creation](../test-creation/SKILL.md).

## 🔗 Related Skills
- **Required**: `roblox-test-creation`, `roblox-domain-component`, `roblox-domain-entity`, `roblox-domain-standalone`, `roblox-domain-definition`.
- **Related**: `roblox-responsive-ui`, `roblox-object-pooling`, `roblox-animation-system`, `roblox-indicator-system`.
