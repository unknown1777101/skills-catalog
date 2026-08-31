# Roblox Centralized Animation System

This directory contains the Antigravity skill `roblox-animation-system`.

---

## 🎯 What is this Skill for?

This skill provides guidelines, best practices, and code templates for creating a centralized, high-performance **Animation System** in Roblox Luau projects. It eliminates redundant `Animator:LoadAnimation()` calls, prevents track leaks, and unifies animation triggering across server and client.

### Key Capabilities:
- Centralize all animation asset IDs inside `CatalogConfig.lua` in Domain.
- Automatically cache and reuse loaded `AnimationTrack`s per `Animator`.
- Synchronize combat hitboxes, sound effects, and VFX precisely using Animation Event Markers (`:GetMarkerReachedSignal()`).
- Support smooth crossfading, speed adjustments, and priority overrides.
- Clean up animation tracks safely on character death/respawn using `Trove`.

---

## 📖 Usage Guide (Panduan Penggunaan)

This skill is designed to guide Google Antigravity agents or developers when implementing character, NPC, or weapon animations in Roblox projects.

### How to Activate/Trigger:
- **Auto-activation**: Antigravity agents will load this skill automatically when their task matches: *"Roblox centralized animation management (caching, track pooling, CatalogConfig IDs, crossfades)."*
- **Manual reference**: You can instruct the agent to use it by writing:
  > "Gunakan skill `roblox-animation-system` untuk membuat sistem animasi [karakter/senjata/NPC]"

### Input Parameters:
When invoking this skill, ensure you provide:
1. Target model or character containing a `Humanoid` and `Animator`.
2. Semantic animation category and key in `CatalogConfig` (e.g. `Combat.SwordSlash`).
3. Playback options (FadeTime, Speed, Priority, Looped).

### Step-by-Step Workflow:
1. **Register**: Add the asset ID to `CatalogConfig.lua`.
2. **Setup**: Instantiate `AnimationServerAdapter` (Server) or `AnimationPresenter` (Client) with `Trove`.
3. **Play**: Trigger playback using cached tracks with desired fade time and priority.
4. **Synchronize**: Connect to animation event markers for frame-perfect effects.
5. **Verify**: Ensure tracks are not reloaded on every trigger and clean up on respawn.

---

## 📋 Examples & Templates

Refer to the references directory for full Luau code templates:
- [animation-system-guide.md](./references/animation-system-guide.md)
