---
name: roblox-knit-arch
description: Roblox + Knit architecture rules (Domain, Application, Adapter/Knit, Infrastructure, Presentation, Contract). Use when designing or implementing Roblox Knit architectures. DO NOT use for project initialization (roblox-init) or git workflows.
---

# Roblox + Knit Architecture Rules

## 🎯 Purpose & Scope
This skill guides the implementation of a production-grade 5-layer clean architecture on Roblox game projects using the Knit framework. The goal is to maintain separation of concerns, improve testability, prevent memory leaks, eliminate latency lag via client-side prediction, and ensure gameplay logic remains independent of the framework/Roblox API.

## 📌 When to Use
- Designing new game systems, services, controllers, or features using Roblox + Knit.
- Refactoring monolithic Knit Services or Controllers into clean, modular layers.
- Establishing testable boundaries and contracts for Roblox codebases.

## 🛑 When Not to Use
- **DO NOT** trigger for initializing a new Roblox project repository (use `project-initialization`).
- **DO NOT** use for general Git version control operations (use `git`).
- **DO NOT** use for standalone non-Roblox web or Node.js development.

---

## 🛑 Strict Guardrails

### 1. Domain Layer
* **Purpose**: Store core game rules, entities, state models, formulas, and centralized catalogs.
* **Allowed**:
  * Pure game rules and calculations
  * Mathematical formulas and validation logic
  * Entities and Value Objects
  * **Centralized Asset Catalog (`CatalogConfig.lua`)**: All `rbxassetid://`, Sound IDs, Animation IDs, Gamepass IDs, and Developer Product IDs must reside here.
  * **Standardized Error Enums**: e.g., `CombatErrors.OUT_OF_STAMINA`, `InventoryErrors.SLOT_FULL`.
  * *Examples*: `DamageRules`, `WeaponRules`, `MovementRules`, `EconomyRules`, `Health`, `Weapon`, `Currency`, `CatalogConfig`
* **Prohibited**: Using `Knit`, `Workspace`, `DataStore`, `RemoteEvent`, UI, Camera, Animation, VFX, `HttpService`, or direct Roblox physics engine API.
* **Golden Rule**: **Domain must not depend on any other layer.** It must run as pure Luau and remain testable outside Roblox Studio.

### 2. Application Layer
* **Purpose**: Manage the game's flow/use cases ("What should happen when an action is performed?").
* **Allowed**:
  * Invoking the Domain layer for decisions and calculations
  * Organizing the execution flow/sequence
  * Calling outer layers via Contracts/Interfaces
  * Returning standardized `Result` objects (`{ Success = boolean, Data = T?, Error = ErrorCode? }`)
  * *Examples*: `AttackUseCase`, `PurchaseItemUseCase`, `SpawnVehicleUseCase`, `MoveObjectUseCase`, `EquipWeaponUseCase`
  * *Flow Example (AttackUseCase)*:
    ```
    Validate target -> Check cooldown -> Calculate damage -> Apply damage -> Return Result
    ```
* **Prohibited**: Calling `Knit.GetService()`, directly accessing `Workspace`, directly accessing `DataStore`, creating UI, playing animations, triggering camera shakes, or spawning VFX.
* **Golden Rule**: **Application knows WHAT and WHEN, not HOW Roblox performs it.**

### 3. Interface / Adapter Layer (Knit)
* **Purpose**: Bridge between the framework/network/input and the Application layer.
* **Knit Service (Server Boundary)**:
  * Acts as a network endpoint, validation boundary, and caller of the Application UseCase.
  * *Code Example*:
    ```lua
    function CombatService.Client:Attack(player, targetId)
        return self.AttackUseCase:Execute(player, targetId)
    end
    ```
  * *Prohibited*: Writing business/combat logic or database operations directly inside the service endpoint.
* **Knit Controller (Client Boundary)**:
  * Acts as client entry point, coordinator, and handles event/input bindings and networking.
  * *Allowed*: Calling Application UseCases, calling Presenters, managing Client-Side Prediction (CSP) triggers, and listening to Server Signals.
  * *Prohibited*: Hosting monolithic UI rendering or physics loops directly in controllers.
* **Golden Rule**: **Knit is an adapter/framework boundary. Knit is not the Domain and not the Application.**

### 4. Infrastructure Layer
* **Purpose**: Technical implementation regarding Roblox API, storage, network transport, or external systems.
* **Allowed**: `DataStoreService`, `ProfileStore`, `MemoryStore`, `MessagingService`, `HttpService`, `Workspace` operations, Roblox physics/pathfinding APIs, asset loading (`ContentProvider`).
* **Structure Example**:
  ```
  Infrastructure/
  ├── Persistence/
  │   └── ProfileStorePlayerRepository
  ├── Physics/
  │   └── RobloxPhysicsMover
  ├── Networking/
  └── Roblox/
  ```
* **Code Example*:
  ```lua
  function RobloxPhysicsMover:Move(part, velocity)
      part.AssemblyLinearVelocity = velocity
  end
  ```
* **Golden Rule**: **Infrastructure answers "How is this done technically?".** Application only interacts with it through contracts (e.g., `IPhysicsMover`, `IPlayerRepository`).

### 5. Presentation Layer
* **Purpose**: Manage everything the player sees, hears, or feels (UI, Animation, Camera Shake, VFX, Sound, HUD).
* **Allowed**: Visual effects, audio playback, layout updates, user inputs, HUD animations, lifecycle cleanup (`Trove`).
* **Example Flow (Attack Succeeded)**:
  ```
  1. Application determines: Damage = 50
  2. Presentation handles:
     ├── Play hit animation
     ├── Show damage indicator (50)
     ├── Trigger camera shake
     ├── Play sound effect (from CatalogConfig key)
     └── Spawn hit VFX
  ```
* **Golden Rule**: **Presentation only displays the state/result and does not determine game rules.**

---

## 💻 Contracts (Interfaces)
Use **Contracts** at architectural boundaries when implementation details need to be decoupled.

* **Boundary Schema**:
  ```
  Application ──> IPhysicsMover <── RobloxPhysicsMover (Infrastructure)
  Coordinator ──> ICombatPresenter <── CombatPresenter (Presentation)
  ```
* **When to use**:
  * Implementation is likely to change.
  * Crossing a boundary between layers (Application ➔ Infrastructure / Presentation).
  * Required for unit testing/mocking.
  * Component reusability.
* **Code Example**:
  ```lua
  export type IPhysicsMover = {
      Move: (
          self: IPhysicsMover,
          object: BasePart,
          velocity: Vector3
      ) -> ()
  }
  ```
* **When NOT to use**: Simple utility modules like `MathUtils`, `Constants`, basic damage calculations, or helper modules.
* **Golden Rule**: **Do not create contracts for every module. Only use them at architectural boundaries.**

---

## 🚀 5 Production-Grade Pillars

### 1. ⚡ Client-Side Prediction (CSP) & Server Reconciliation
For latency-sensitive mechanics (combat, stamina, movement, abilities):
* **Client (Optimistic Flow)**:
  1. Player inputs action (e.g., Attack/Dash).
  2. Controller immediately triggers local visual feedback via `Presenter` (play local animation/VFX) and applies predicted local state.
  3. Controller fires network request to `KnitService`.
* **Server (Authoritative Validation)**:
  1. `KnitService` invokes `UseCase`.
  2. If valid, server state mutates and fires broadcast/result signal.
  3. If invalid/mismatched, server returns rejection and client **reconciles/rolls back** the predicted state.

### 2. 🧹 Memory Management & Lifecycle Cleanup (`Trove`)
Memory leaks from orphaned `RBXScriptConnection`, running tweens, unanchored instances, and active signals are prohibited.
* **Rule**:
  * Every `Presenter` and `Controller` that binds events, creates instances, or plays tweens **MUST** maintain an internal `Trove` instance.
  * When a character respawns, UI closes, or module unmounts, invoke `self._trove:Clean()` to guarantee zero memory leaks.

### 3. 📡 State Replication Strategy
Choose a standardized data replication pattern between Server and Client:
* **Event-Driven (Knit Signals / RemoteEvents)**: For discrete actions and momentary notifications (e.g., `AttackResult`, `LevelUpToast`).
* **State-Driven (ProfileStore / Replica / Reflex / Charm)**: For persistent structured session data (e.g., Inventory, Coins, Equipment stats).
* **Client Local Cache**: Stored in a dedicated Client Repository or Coordinator; Controllers and Presenters read from this local cache, not from direct asynchronous network spam.

### 4. 🗄️ Centralized Asset & Config Catalog (`CatalogConfig`)
* Raw asset IDs (e.g. `rbxassetid://123456`), Animation IDs, Sound IDs, Badge IDs, and Gamepass/DevProduct IDs **MUST NOT** be hardcoded inside Services, Controllers, or Presenters.
* **Rule**: All asset IDs must be registered in `src/shared/Domain/Config/CatalogConfig.lua`. Outer layers must reference them by semantic keys (e.g., `CatalogConfig.Audio.HitWood`, `CatalogConfig.Product.SpinWheelX1`).

### 5. ⚠️ Standardized Result & Error Enums
* Every UseCase must return a standardized Result table:
  ```lua
  export type Result<T> = {
      Success: boolean,
      Data: T?,
      Error: string?,
  }
  ```
* Error codes must be defined as enums in Domain (e.g., `CombatErrors.OUT_OF_STAMINA`, `CombatErrors.INVALID_TARGET`).
* The **Presentation Layer** maps these error codes to localized player messages or specific UI error indicators.

---

## 📥 Inputs
- **Required**: Roblox codebase files (Knit Services, Controllers, Domain, Application logic) or feature specification documents.
- **Optional**: Design patterns or mock contracts for architectural integration.

## 📋 Execution Workflow

1. **Analyze Requirements**:
   Identify which layer the changes or new features should be placed in (Domain, Application, Adapter, Infrastructure, or Presentation).

2. **Apply Dependency Flow**:
   Ensure dependencies always point toward the more core logic:
   * **Server**: Knit Service (Adapter) → Application → Domain.
   * **Client**: Presentation → Controller (Adapter) → Application → Domain.
   * **Technical Access**: Application → Contract ← Infrastructure.

3. **Separate Physics Rules from Implementation**:
   * *Game Rules* (e.g. Max speed, acceleration formulas) ──> **Domain**
   * *Flow* (e.g. Calculate speed, apply velocity) ──> **Application**
   * *Roblox API* (e.g. AssemblyLinearVelocity, AlignPosition) ──> **Infrastructure**

4. **Decouple Presentation via Presenters & Trove**:
   Avoid tight coupling in Controllers. Delegate visual and audio logic to a Presenter and ensure all connections are attached to `Trove`.

5. **Ensure Thin Boundaries**:
   * **Knit Services**: Keep endpoints thin; forward requests directly to Application UseCases.
   * **Knit Controllers**: Limit responsibilities to coordinating inputs, managing CSP, and delegating to UseCases and Presenters.

---

## 🔀 Decision Rules
- If logic involves mathematical calculations or game rules → Place in **Domain Layer**.
- If logic orchestrates player actions (WHAT/WHEN) → Place in **Application Layer (UseCase)**.
- If logic interacts directly with Roblox Engine API (DataStore, Physics, HTTP) → Place in **Infrastructure Layer**.
- If logic handles networking endpoints or user input event triggers → Place in **Interface/Adapter Layer (Knit)**.
- If logic renders UI, plays sounds, shakes camera, or displays VFX → Place in **Presentation Layer**.

---

## 🔍 Verification Checklist

* [ ] **Domain Isolation**: Is the Domain free of `Knit`, `Workspace`, `DataStore`, UI, Camera, Animation, VFX, and `HttpService`?
* [ ] **Application Flow**: Does the Application UseCase only manage flow (WHAT & WHEN) and return a standardized `Result` table?
* [ ] **Thin Knit Service**: Is the Knit Service thin, acting only as a request endpoint that forwards to UseCases?
* [ ] **Thin Knit Controller**: Is the Knit Controller delegated to Coordinators/Presenters, without hosting thousand-line UI/physics logic?
* [ ] **Dependency Direction**: Does the dependency direction flow inward (Presentation/Adapter → Application → Domain)?
* [ ] **Contract Boundary**: Are Contracts used appropriately at layer boundaries and not on simple utility modules?
* [ ] **Memory Management (`Trove`)**: Are dynamic connections, tweens, and visual instances in Presenters/Controllers cleaned up using `Trove`?
* [ ] **Client-Side Prediction (CSP)**: Are latency-sensitive gameplay mechanics predicted locally on the client with server reconciliation?
* [ ] **Centralized Catalog**: Are all Roblox asset IDs (`rbxassetid://`, Sound IDs, Animation IDs) centralized inside `CatalogConfig.lua` in Domain?
* [ ] **Error Enums**: Are error codes standardized in Domain and handled cleanly by Presenter?

---

## 📤 Output
- Roblox game modules structured and organized into five clean architectural layers (Domain, Application, Interface/Adapter, Infrastructure, Presentation) with dependency flow pointing inward.

---

## 📚 References
- For a complete reference implementation (directory structure, code templates for all 5 layers + contracts, Trove, CatalogConfig, and CSP sequence flows), refer to [references/layered-architecture-examples.md](./references/layered-architecture-examples.md).

## 🔗 Related Skills
- **Required**: `project-initialization` (for initial repo scaffolding).
- **Optional**: `dev-tool-creation`, `git`.
