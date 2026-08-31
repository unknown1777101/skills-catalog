---
name: roblox-object-pooling
category: Roblox
description: Roblox object pooling patterns (VFX, projectiles, sounds, UI indicators). Use when designing or creating object pools to prevent GC lag spikes. DO NOT use for general architecture rules (roblox-knit-arch) or project initialization.
---

# Roblox Object Pooling

## 🎯 Purpose & Scope
This skill provides deterministic patterns and guidelines for implementing high-performance **Object Pools** in Roblox Luau projects. The goal is to eliminate Garbage Collection (GC) lag spikes caused by frequent `Instance.new()` and `:Destroy()` cycles for high-frequency game objects (such as bullets, damage numbers, sound effects, and particle VFX).

---

## 📌 When to Use
- Implementing rapid-fire projectiles or bullets (e.g. guns, spell projectiles).
- Displaying high-frequency visual indicators (damage popups, hit splats, floating combat text).
- Triggering repetitive sound effects or impact VFX in combat.
- Managing temporary physical parts or debris that spawn and despawn continuously.

## 🛑 When Not to Use
- **DO NOT** use for persistent unique objects (Player Characters, Boss NPCs, persistent UI screens).
- **DO NOT** use for general 5-layer architecture decisions (use `roblox-knit-arch`).
- **DO NOT** use for objects created only once or very infrequently (e.g. Level loading, Shop GUI opening).

---

## 🛑 Strict Guardrails

### 1. Architectural Placement
* **Presentation Layer**: UI popups (BillboardGuis, floating texts) and local visual/audio effect pools reside in Presentation Presenters.
* **Infrastructure Layer**: Physical projectile instances, raycast visualizers, and server-side hitboxes reside in Infrastructure Adapters.
* **Prohibited**: Never place Roblox Instance pooling logic inside the **Domain Layer** or pure **Application UseCases**.

### 2. Pre-Warming & Sizing Budget
* Always pre-warm a reasonable initial budget (e.g. 10–30 items).
* Set a hard maximum capacity (`MaxSize`) to prevent unbounded memory growth in extreme edge cases.
* If the pool is exhausted and hits `MaxSize`, recycle the oldest active object instead of indefinitely allocating new memory.

### 3. Complete State Sanitization
* The `Reset` callback **MUST** thoroughly neutralize the object's active state:
  * Reset `AssemblyLinearVelocity` and `AssemblyAngularVelocity` to `Vector3.zero`.
  * Set `Transparency = 1` or `Enabled = false`.
  * Move physical parts out-of-bounds (e.g. `CFrame.new(0, -1000, 0)`) or set `CanCollide = false` so they do not trigger unwanted physics collisions.
  * Clear adornees or text properties on UI indicators.

### 4. Lifecycle & Memory Cleanup (`Trove`)
* Every pool created in client controllers or presenters **MUST** be registered to a `Trove` instance so that `:Destroy()` cleans up all pooled objects on character respawn or module shutdown.

---

## 📥 Inputs
- **Required**: Target object type/template (Part, Sound, BillboardGui, ParticleEmitter) and spawn frequency requirements.
- **Optional**: Initial pool size, max capacity, container parent folder.

---

## 📋 Execution Workflow

1. **Inspect Requirements**:
   Determine whether the feature spawns high-frequency instances (> 5 instances per second) and classify into Presentation (Visual/UI/Sound) or Infrastructure (Physics/Hitbox).

2. **Define Pool Configuration**:
   Establish `Factory`, `Reset`, `InitialSize`, `MaxSize`, and `Container` specifications.

3. **Implement ObjectPool / Adapter**:
   * For UI/VFX: Create a dedicated Presenter (e.g. `DamageIndicatorPoolPresenter.lua`) integrating `Trove`.
   * For Physics/Projectiles: Create an Infrastructure Adapter (e.g. `ProjectilePoolAdapter.lua`).

4. **Integrate with Controller / Service**:
   Trigger `pool:Get()` when spawning, and schedule `pool:Release(object)` when the lifecycle ends (via timer, collision, or animation completion).

5. **Verify State Reset**:
   Confirm that re-acquired objects appear clean without residual velocity, rotation, or visual artifacts from previous usages.

---

## 🔀 Decision Rules
- If spawn rate is **> 5 items/sec** (bullets, damage numbers, hit sparks) → **Must use Object Pooling**.
- If spawn rate is **< 1 item/sec** or one-off (UI menus, level models) → **Use direct Instantiation (`Instance.new` / `:Clone()`)**.
- If pool object is a physical part → Parent to a dedicated Workspace folder and set `CanCollide = false` while in pool.
- If pool object is a GUI/Billboard → Parent to `PlayerGui` or `Workspace` and set `Enabled = false` while in pool.

---

## 🔍 Verification Checklist

* [ ] **Layer Segregation**: Is the pool placed in Presentation (Visuals/UI) or Infrastructure (Engine/Physics), and kept out of Domain/Application?
* [ ] **Pre-warm Executed**: Does the pool pre-instantiate its initial capacity upon initialization?
* [ ] **State Fully Reset**: Does the `Reset` function clear velocity, collision, visibility, and adornees?
* [ ] **No Collision Leak**: Are inactive parts kept non-collidable or positioned outside the playable world?
* [ ] **Trove Integrated**: Is the pool connected to a `Trove` lifecycle for complete cleanup on destroy?
* [ ] **Cap Limit Enforced**: Is `MaxSize` configured to prevent runaway memory allocation?

---

## 📤 Output
- Modular, memory-safe object pool modules and adapters integrated into the Roblox project without GC spikes.

---

## 📚 References
- For full Luau implementation templates and examples, refer to [references/object-pooling-guide.md](./references/object-pooling-guide.md).

## 🔗 Related Skills
- **Required**: `roblox-knit-arch` (for 5-layer architectural compliance).
- **Optional**: `roblox-animation-system`.
