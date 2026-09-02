---
name: roblox-knit-arch
category: Roblox
description: Enforces Roblox Knit 5-layer Clean Architecture with pure domain rules, authoritative server data providers, client visual presentation, and mandatory RDK unit testing. Use for Knit system architecture. DO NOT use for project init or git.
---

# Roblox + Knit Architecture Rules

## 🎯 Purpose & Scope
This skill guides the implementation of a production-grade 5-layer clean architecture on Roblox game projects using the Knit framework. The goal is to maintain separation of concerns, improve testability, prevent memory leaks, eliminate latency lag via client-side prediction, ensure gameplay logic remains independent of the framework/Roblox API, **scale seamlessly across codebases with hundreds to thousands of files**, and **guarantee codebase correctness through mandatory Domain Unit Testing using RDK (`rdk test`)**.

## 📌 When to Use
- Designing new game systems, services, controllers, or features using Roblox + Knit.
- Organizing large-scale codebases (100–1000+ files) using Feature-Sliced Domain Sharding.
- Writing mandatory BDD unit tests (`.spec.lua`) for pure Luau Domain logic.
- Executing unit tests using the **Roblox Development Kit (RDK)** suite.
- Refactoring monolithic Knit Services or Controllers into clean, modular layers.
- Establishing testable boundaries and contracts for Roblox codebases.

## 🛑 When Not to Use
- **DO NOT** trigger for initializing a new Roblox project repository (use `project-initialization`).
- **DO NOT** use for general Git version control operations (use `git`).
- **DO NOT** use for standalone non-Roblox web or Node.js development.

---

## 📋 Execution Workflow

1. **Model Pure Domain (`src/shared/Domain/`)**:
   - Write pure Luau entities, value objects, mathematical formulas, and centralized catalogs (`CatalogConfig.lua`).
   - Create accompanying `*.spec.lua` BDD test suites and verify with `rdk test`.
2. **Implement Application UseCases (`src/shared/Application/`)**:
   - Orchestrate domain operations, sequence execution flows, and return standardized `Result<T>` tables.
3. **Build Authoritative Server Services (`src/server/Services/`)**:
   - Create Knit Services as thin network endpoints and data providers.
   - Emit state snapshots via Knit Signals; NEVER instantiate 3D visuals or `Lighting` on the server.
4. **Implement Client Presentation & Controllers (`src/client/`)**:
   - Build 3D environments, particle VFX, and HUD views in `src/client/Presentation/`.
   - Use Client Controllers to listen to server data signals and drive presentation views.

---

## 🧪 Mandatory Domain Unit Testing (`rdk test`)

* **Golden Rule**: **Every Domain module MUST have accompanying BDD unit tests (`*.spec.lua`) targeting 100% test coverage.**
* **Mandatory Runner**: Unit tests **MUST** be executed using **[unknown1777101/roblox-development-kit (RDK)](https://github.com/unknown1777101/roblox-development-kit)**:
  ```powershell
  rdk test
  ```
  Or for targeted project testing:
  ```powershell
  rdk test [project-path]
  ```
* **Strict Prohibitions**:
  - ❌ **Using Lune is strictly prohibited.**
  - ❌ **Never access Roblox Engine APIs (`game`, `Workspace`, `Instance.new()`, etc.) inside Domain unit tests.**
  - ❌ **Never use `wait()` or `task.wait()` in tests; always inject discrete time increments (deltaTime).**
* **Test Structure (TestEZ BDD Style)**:
  Place each spec file alongside the domain module (e.g. `GridMath.spec.lua`, `GladiatorStats.spec.lua`):
  ```lua
  return function()
      local GladiatorStats = require(script.Parent.GladiatorStats)

      describe("GladiatorStats Domain", function()
          it("should calculate correct step ticks based on agility", function()
              local attrs = { Strength = 50, Agility = 75, CombatIQ = 50, Endurance = 50, Armor = 10 }
              local stepTicks = GladiatorStats.CalculateStepTicks(attrs, {})
              expect(stepTicks).to.equal(2)
          end)
      end)
  end
  ```

---

## 🏢 Large-Scale Organization Standards (100–1000+ Files)

### 1. Feature-Sliced Architecture (Vertical Domain Sharding)
Monolithic flat folders (e.g. 200 files in a single `Services/` or `UseCases/` folder) are strictly prohibited.
* **Rule**: Codebases must be sharded by **Feature / Domain Context**:
  ```
  src/
  ├── shared/
  │   ├── Core/                           <-- Shared Utilities, Math, Types, Errors
  │   └── Features/                       <-- Feature Slices
  │       ├── Combat/                     <-- Combat Domain, UseCases, Grid Systems
  │       ├── Gladiators/                 <-- Gladiator Entities, Stats, Progression
  │       ├── Inventory/                  <-- Weapons, Armor, Items
  │       ├── Narrative/                  <-- Procedural Narrative, Dialects, Logs
  │       └── Economy/                    <-- Gold, Wagers, Marketplace
  ├── server/Features/                    <-- Server Knit Services grouped per feature
  └── client/Features/                    <-- Client Controllers & Presenters grouped per feature
  ```

### 2. Taxonomic Data Sharding (Rule of 7±2)
* **Rule**: No directory should contain more than **15–20 files**.
* When data items (Skills, Items, Weapons, Quests) exceed 20 files, sub-shard hierarchically:
  `Features/[Feature]/Domain/[DataType]/[Category]/[SubCategory]/[Tier]/`
  * *Example*: `Features/Combat/Domain/Skills/Swords/OneHanded/Tier1_Novice/`

### 3. Auto-Discovery Indexing (`init.luau` / Barrel Loader)
* Large subdirectories (containing 50–500 data files) **MUST** provide an `init.luau` or master index module that recursively registers and caches all child modules. Outer layers import the single index rather than hundreds of discrete file paths.

### 4. Standardized File Suffixes
* **Domain Entity**: `*Entity.lua` (e.g., `GladiatorEntity.lua`)
* **Domain Config/Def**: `*Config.lua` or `*Def.lua` (e.g., `GladiusSlashDef.lua`)
* **Domain Unit Test**: `*.spec.lua` (e.g., `GladiatorStats.spec.lua`)
* **Application UseCase**: `*UseCase.lua` (e.g., `ExecuteSkillUseCase.lua`)
* **Knit Service**: `*Service.lua` (e.g., `CombatService.lua`)
* **Knit Controller**: `*Controller.lua` (e.g., `CombatController.lua`)
* **Presentation View**: `*View.lua` (e.g., `CombatNarrativeView.lua`)
* **Presentation Presenter**: `*Presenter.lua` (e.g., `CombatNarrativePresenter.lua`)

---

## 🛑 Strict Guardrails (The 5 Layers)

### 1. Domain Layer
* **Purpose**: Store core game rules, entities, state models, formulas, and centralized catalogs.
* **Allowed**:
  * Pure game rules, calculations, and formulas
  * Entities and Value Objects
  * **Centralized Asset Catalog (`CatalogConfig.lua`)**: All `rbxassetid://`, Sound IDs, and Animation IDs.
  * **Standardized Error Enums**: e.g., `CombatErrors.OUT_OF_STAMINA`, `InventoryErrors.SLOT_FULL`.
  * **Mandatory Unit Tests (`*.spec.lua`)**: Tested via `rdk test`.
* **Prohibited**: Using `Knit`, `Workspace`, `DataStore`, `RemoteEvent`, UI, Camera, Animation, VFX, `HttpService`, or direct Roblox physics engine API.
* **Golden Rule**: **Domain must not depend on any other layer. It must run as pure Luau and remain testable outside Roblox Studio.**

### 2. Application Layer
* **Purpose**: Manage the game's flow/use cases ("What should happen when an action is performed?").
* **Allowed**:
  * Invoking the Domain layer for decisions and calculations
  * Organizing the execution flow/sequence
  * Calling outer layers via Contracts/Interfaces
  * Returning standardized `Result` objects (`{ Success = boolean, Data = T?, Error = ErrorCode? }`)
* **Prohibited**: Calling `Knit.GetService()`, directly accessing `Workspace`, directly accessing `DataStore`, creating UI, playing animations, triggering camera shakes, or spawning VFX.
* **Golden Rule**: **Application knows WHAT and WHEN, not HOW Roblox performs it.**

### 3. Interface / Adapter Layer (Knit)
* **Purpose**: Bridge between the framework/network/input and the Application layer.
* **Knit Service (Server Boundary - Pure Data Provider & State Authority)**:
  * Acts as a network endpoint, validation boundary, and caller of the Application UseCase.
  * Emits lightweight data snapshots (DTO tables) via Knit Signals (`ArenaStateUpdated`, `CombatBeatBroadcast`).
  * *Strictly Prohibited*: Instantiating 3D visual parts in Workspace, manipulating `Lighting`, or executing client visual rendering on the server.
* **Knit Controller (Client Boundary - Coordinator)**:
  * Acts as client entry point, coordinator, and handles event/input bindings and networking.
  * Listens to server data signals and commands the Presentation layer to render models, play animations, and display HUD bars.
  * *Prohibited*: Hosting monolithic UI rendering or physics loops directly in controllers.
* **Golden Rule**: **Server provides authoritative raw data; Client coordinates presentation.**

### 4. Infrastructure Layer
* **Purpose**: Technical implementation regarding Roblox API, storage, network transport, or spatial conversions.
* **Allowed**: `DataStoreService`, `ProfileStore`, `Workspace` operations, Roblox physics/pathfinding APIs, spatial coordinate mappers (`GridWorldMapper`).
* **Golden Rule**: **Infrastructure answers "How is this done technically?".** Application only interacts with it through contracts.

### 5. Presentation Layer (Client-Exclusive Visual Realm)
* **Purpose**: Manage everything the player sees, hears, or feels (Procedural 3D Arenas, UI, Animation, Camera Shake, VFX, Sound, HUD).
* **Allowed**: Procedural 3D environment generation (`ColosseumArenaView`), atmosphere lighting setup, visual effects, audio playback, layout updates, user inputs, HUD animations, lifecycle cleanup (`Trove`).
* **Golden Rule**: **Presentation only renders the state/result from server data and does not determine authoritative game rules.**

---

## 🚀 5 Production-Grade Pillars

### 1. ⚡ Client-Side Prediction (CSP) & Server Reconciliation
For latency-sensitive mechanics (combat, stamina, movement, abilities):
* **Client (Optimistic Flow)**:
  1. Player inputs action.
  2. Controller triggers local visual feedback via `Presenter` and applies predicted local state.
  3. Controller fires network request to `KnitService`.
* **Server (Authoritative Validation)**:
  1. `KnitService` invokes `UseCase`.
  2. If valid, server state mutates and fires broadcast/result signal.
  3. If invalid/mismatched, server returns rejection and client reconciles predicted state.

### 2. 🧹 Memory Management & Lifecycle Cleanup (`Trove`)
Memory leaks from orphaned connections, running tweens, and active signals are prohibited.
* **Rule**: Every `Presenter` and `Controller` that binds events, creates instances, or plays tweens **MUST** maintain an internal `Trove` instance.

### 3. 📡 State Replication Strategy
* **Event-Driven (Knit Signals / RemoteEvents)**: For discrete actions and momentary notifications (`CombatBeatBroadcast`).
* **State-Driven (ProfileStore / Replica / Reflex)**: For persistent structured session data (Inventory, Coins, Equipment stats).

### 4. 🗄️ Centralized Asset & Config Catalog (`CatalogConfig`)
* Raw asset IDs (`rbxassetid://123456`) **MUST NOT** be hardcoded inside Services, Controllers, or Presenters.
* **Rule**: All asset IDs must be registered in `src/shared/Domain/Config/CatalogConfig.lua`.

### 5. ⚠️ Standardized Result & Error Enums
* Every UseCase must return a standardized Result table:
  ```lua
  export type Result<T> = {
      Success: boolean,
      Data: T?,
      Error: string?,
  }
  ```

---

## 🔍 Verification Checklist

* [ ] **Domain Unit Tests Active**: Does every Domain module have a corresponding `.spec.lua` file?
* [ ] **`rdk test` Passed**: Do all unit tests pass with 100% success via `rdk test`?
* [ ] **Large-Scale Sharding**: Are folders containing > 20 files properly sub-sharded by category/tier?
* [ ] **Feature Slicing Active**: Is code segregated by Feature Domain (`Features/Combat`, `Features/Gladiators`) rather than flat layer dumps?
* [ ] **Auto-Discovery Loader**: Do large data folders provide an index/loader to prevent manual require spam?
* [ ] **Standardized Suffixes**: Do filenames strictly follow suffixes (`*UseCase.lua`, `*Presenter.lua`, `*Entity.lua`, `*.spec.lua`)?
* [ ] **Domain Isolation**: Is the Domain 100% pure Luau and testable outside Roblox Studio?
* [ ] **Trove Managed**: Are dynamic connections, tweens, and visual instances cleaned up using `Trove`?
* [ ] **Centralized Catalog**: Are all asset IDs centralized inside `CatalogConfig.lua` in Domain?

---

## 📤 Output
- Scalable, modular Roblox game codebases organized into feature slices and 5 clean architectural layers with 100% verified unit test coverage using **RDK (`rdk test`)**.
