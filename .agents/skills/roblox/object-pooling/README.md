# Roblox Object Pooling

This directory contains the Antigravity skill `roblox-object-pooling`.

---

## 🎯 What is this Skill for?

This skill provides deterministic guidelines, patterns, and code templates for creating high-performance **Object Pools** in Roblox Luau projects. It eliminates memory fragmentation and frame rate lag spikes caused by rapid `Instance.new()` and `:Destroy()` cycles for high-frequency objects.

### Key Capabilities:
- Implement reusable Luau `ObjectPool` generic modules with pre-warming and auto-recycling.
- Prevent Roblox Garbage Collection (GC) stutter on rapid-fire bullets, damage numbers, and combat VFX.
- Safely sanitize and reset physical properties, adornees, and particle emitters between usages.
- Integrate with `Trove` lifecycle management for leak-free module destruction.

---

## 📖 Developer Usage Guide

This skill is designed to guide Google Antigravity agents or developers when creating or refactoring object pooling systems in Roblox.

### How to Activate / Trigger:
- **Auto-activation**: Antigravity agents load this skill automatically when the task matches object pooling, projectile pooling, or memory optimization.
- **Manual instruction**: You can instruct the agent by typing:
  > "Use the `roblox-object-pooling` skill to implement a pool for [projectiles/damage numbers/VFX]"

### Input Parameters:
When invoking this skill, ensure you provide:
1. Target object type to pool (BasePart, BillboardGui, Sound, ParticleEmitter).
2. Expected spawn frequency and maximum capacity budget.
3. Target layer (Presentation for UI/effects or Infrastructure for physical projectiles).

### Step-by-Step Workflow:
1. **Inspect**: Determine whether the feature requires pooling (> 5 spawns/sec).
2. **Configure**: Define `Factory`, `Reset`, `InitialSize`, and `MaxSize`.
3. **Implement**: Create the pool adapter (Infrastructure) or presenter (Presentation) with `Trove` cleanup.
4. **Integrate**: Call `pool:Get()` on spawn and `pool:Release()` upon lifecycle completion.
5. **Verify**: Ensure recycled instances have clean states without residual velocity or visibility bugs.

---

## 📋 Examples & Templates

Refer to the references directory for full Luau code templates:
- [object-pooling-guide.md](./references/object-pooling-guide.md)
