---
name: roblox-animation-system
category: Roblox
description: Roblox centralized animation management (caching, track pooling, CatalogConfig IDs, crossfades). Use when playing or loading character/NPC animations. DO NOT use for general architecture (roblox-knit-arch) or object pooling (roblox-object-pooling).
---

# Roblox Centralized Animation System

## 🎯 Purpose & Scope
This skill guides the implementation of a centralized, high-performance **Animation Pipeline** in Roblox Luau projects. The goal is to eliminate redundant `Animator:LoadAnimation()` calls, prevent animation track leaks, centralize asset IDs, and synchronize combat/ability visuals seamlessly via animation events.

---

## 📌 When to Use
- Loading and playing character or NPC animations (walk, idle, attack, emote, cast spell).
- Synchronizing VFX, camera shake, and sound effects to specific animation frames via `:GetMarkerReachedSignal()`.
- Managing animation crossfades, weight adjustments, and priority overrides.
- Refactoring ad-hoc `LoadAnimation()` scripts into a clean, cached service/adapter pipeline.

## 🛑 When Not to Use
- **DO NOT** use for general 5-layer clean architecture rules (use `roblox-knit-arch`).
- **DO NOT** use for projectile, VFX, or part pooling (use `roblox-object-pooling`).
- **DO NOT** use for non-animated procedural TweenService animations (UI tweens, camera tweens).

---

## 🛑 Strict Guardrails

### 1. Zero Hardcoded Asset IDs
* Raw animation asset IDs (e.g. `rbxassetid://123456789`) **MUST NOT** be hardcoded inside Services, Controllers, or scripts.
* **Rule**: All animation IDs must be registered in `src/shared/Domain/Config/CatalogConfig.lua` and referenced by semantic keys (e.g. `CatalogConfig.Animations.Combat.SwordSlash`).

### 2. Mandatory Track Caching
* **Prohibited**: Never call `Animator:LoadAnimation()` in loops, `Heartbeat` callbacks, or on every attack click.
* **Rule**: All loaded `AnimationTrack`s must be cached per `Animator` in an `AnimationServerAdapter` (Server) or `AnimationPresenter` (Client). Subsequent play requests must retrieve and reuse the cached track.

### 3. Marker-Driven Synchronization
* **Prohibited**: Avoid using fragile `task.wait(0.3)` delays to time damage application or sound effects during an animation.
* **Rule**: Use Animation Events / Markers (e.g. `track:GetMarkerReachedSignal("Hit")`) to trigger damage, sounds, and particle effects exactly when the weapon makes contact.

### 4. Lifecycle & Memory Cleanup (`Trove`)
* When a character dies, respawns, or unmounts, all cached `AnimationTrack`s must be stopped and cleared via `Trove` to prevent memory leaks.

---

## 📥 Inputs
- **Required**: Target character/NPC model (containing `Humanoid` and `Animator`) and desired animation catalog key.
- **Optional**: Fade time, speed multiplier, weight, loop configuration, animation priority.

---

## 📋 Execution Workflow

1. **Register Asset IDs**:
   Ensure all target animation IDs are registered in `CatalogConfig.lua` under the appropriate category.

2. **Initialize Adapter / Presenter**:
   * **Server**: Inject `AnimationServerAdapter.lua` into relevant Knit Services.
   * **Client**: Initialize `AnimationPresenter.lua` bound to the local character with `Trove`.

3. **Play with Options**:
   Call `adapter:Play(animator, animId, options)` specifying priority, crossfade time, and speed.

4. **Listen to Animation Events**:
   Attach listeners to `track:GetMarkerReachedSignal(markerName)` for synchronized visual/audio execution.

5. **Cleanup on Death/Destroy**:
   Ensure `Trove:Clean()` is called on character respawn to dispose of stale track references.

---

## 🔀 Decision Rules
- If animation affects gameplay/combat timing → Attach markers in Roblox Animation Editor and listen via `:GetMarkerReachedSignal()`.
- If playing on Server (Replicated to all players) → Route through `AnimationService` ➔ `AnimationServerAdapter`.
- If playing local client-only visuals (Viewmodel / FPS Arms / Local Emote) → Play directly via `AnimationPresenter` (Client).
- If switching between two active animations → Use `FadeTime` parameter (0.1s – 0.3s) for smooth blending.

---

## 🔍 Verification Checklist

* [ ] **Catalog Centralization**: Are all animation asset IDs located in `CatalogConfig.lua`?
* [ ] **Track Caching Active**: Are `AnimationTrack` instances cached per Animator and reused across calls?
* [ ] **No Ad-hoc Loops**: Is `LoadAnimation()` completely absent from runtime update loops and attack triggers?
* [ ] **Marker Synchronization**: Are gameplay events triggered via `GetMarkerReachedSignal()` instead of arbitrary delays?
* [ ] **Trove Cleanup**: Are animation tracks and connections safely cleaned up when characters respawn?

---

## 📤 Output
- Modular, memory-safe animation adapters and presenters cleanly integrated with Knit Services and Domain Catalog.

---

## 📚 References
- For full Luau implementation templates and examples, refer to [references/animation-system-guide.md](./references/animation-system-guide.md).

## 🔗 Related Skills
- **Required**: `roblox-knit-arch` (for 5-layer architectural compliance).
- **Optional**: `roblox-object-pooling`.
