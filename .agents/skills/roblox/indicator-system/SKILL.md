---
name: roblox-indicator-system
category: Roblox
description: Roblox alert indicator and badge system patterns (red-dots, unread counts, attention badges). Use when creating reactive UI indicators. DO NOT use for general architecture (roblox-knit-arch) or animations (roblox-animation-system).
---

# Roblox Alert Indicator & Badge System

## 🎯 Purpose & Scope
This skill guides the implementation of a centralized, reactive **Alert Indicator & Badge System (Red-Dots / Unread Badges)** in Roblox Luau projects. The goal is to standardize how notification dots and badge counters are displayed across UI buttons, topbar icons, and navigation tabs without scattering ad-hoc visibility checks across disparate UI scripts.

---

## 📌 When to Use
- Adding red-dot notification badges to UI buttons (Shop, Quests, Daily Rewards, Battle Pass).
- Displaying numerical unread counts (new mail, unread chat messages, claimable rewards).
- Synchronizing the same indicator state across multiple UI locations (e.g. Main HUD button and internal Tab header).

## 🛑 When Not to Use
- **DO NOT** use for full UI layout and MVP scaffolding (use `roblox-responsive-ui`).
- **DO NOT** use for general 5-layer architecture rules (use `roblox-knit-arch`).
- **DO NOT** use for combat floating damage numbers (use `roblox-object-pooling`).

---

## 🛑 Strict Guardrails

### 1. Centralized Semantic Keys
* **Prohibited**: Using magic strings (e.g. `"dot1"`, `"reward_badge"`) scattered across UI files.
* **Rule**: All indicator keys **MUST** be defined centrally in `src/shared/Domain/Indicators/IndicatorKeys.lua` (e.g. `IndicatorKeys.DailyReward_Claimable`).

### 2. State-Driven, Not Ad-Hoc
* **Prohibited**: Writing inline conditions like `if coins > 100 then dot.Visible = true` directly inside separate UI view files.
* **Rule**: State calculations reside in UseCases/Services. The result updates `IndicatorController:SetIndicator(key, value)`, and Presenters reactively render the change.

### 3. Lifecycle & Memory Cleanup (`Trove`)
* Every `IndicatorBadgePresenter` attached to a button or GUI element **MUST** manage a `Trove` instance so that signal listeners and badge frames are destroyed when the UI unmounts.

---

## 📥 Inputs
- **Required**: Target GUI button / icon and semantic indicator key from `IndicatorKeys.lua`.
- **Optional**: Custom badge template (numerical counter vs simple red dot), popup tween parameters.

---

## 📋 Execution Workflow

1. **Register Semantic Key**:
   Add the indicator key identifier into `src/shared/Domain/Indicators/IndicatorKeys.lua`.

2. **Initialize IndicatorController**:
   Ensure `IndicatorController.lua` is loaded in Knit client initialization to serve as the reactive state broker.

3. **Attach Presenter to UI**:
   In your UI Presenter, attach `IndicatorBadgePresenter.new(button, IndicatorKeys.YourKey)` and register it into `self._trove`.

4. **Trigger State Updates**:
   When game state changes (e.g. quest completed, free gift available), call `IndicatorController:SetIndicator(key, true)` or pass numeric counts.

5. **Verify Reactive Synchronization**:
   Confirm the badge pops up with animation when true, updates numbers when counts change, and hides cleanly when cleared.

---

## 🔀 Decision Rules
- If indicator is a simple binary alert (free item available) → Use boolean state (`true`/`false`) rendering a simple red dot.
- If indicator represents multiple items (e.g. 3 unread messages) → Use number state (`count > 0`) rendering a numerical text badge.
- If multiple UI buttons represent the same feature → Attach separate badge presenters listening to the identical indicator key.

---

## 🔍 Verification Checklist

* [ ] **Semantic Registry**: Is the indicator key defined in `IndicatorKeys.lua`?
* [ ] **Reactive Controller**: Are UI badges listening to `IndicatorController.IndicatorChanged` instead of manual polling?
* [ ] **Pop Animation Active**: Does the badge appear smoothly with a tween animation?
* [ ] **Trove Managed**: Is the badge presenter registered to `Trove` to prevent orphaned listeners on UI close?

---

## 📤 Output
- Decoupled, reactive alert badge and red-dot indicators synchronized seamlessly across all UI navigation elements.

---

## 📚 References
- For full Luau implementation templates and examples, refer to [references/indicator-system-guide.md](./references/indicator-system-guide.md).

## 🔗 Related Skills
- **Required**: `roblox-knit-arch`, `roblox-responsive-ui`.
