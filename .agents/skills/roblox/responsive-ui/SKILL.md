---
name: roblox-responsive-ui
category: Roblox
description: Roblox responsive UI patterns, dynamic UIScale modifiers, and Model-View-Presenter (MVP) architecture (RDK integration). Use when creating cross-platform UI/HUDs. DO NOT use for general 5-layer architecture (roblox-knit-arch) or animation caching (roblox-animation-system).
---

# Roblox Responsive UI & MVP Presenter

## 🎯 Purpose & Scope
This skill guides the creation of responsive, cross-platform **User Interfaces (UI/HUD)** in Roblox projects using the Model-View-Presenter (MVP) pattern, dynamic viewport scaling (`UIScale`), and verified with the **Roblox Development Kit (RDK)** suite. The goal is to ensure UI components look polished, scale automatically across Mobile, Tablet, Desktop, and Console screens without clipping, and remain decoupled from network/gameplay logic.

---

## 📌 When to Use
- Designing new HUD widgets, modal dialogs, shops, inventory menus, or toasts in Roblox.
- Implementing cross-platform UI scaling that adapts automatically to varying screen aspect ratios and mobile resolutions.
- Refactoring bloated UI scripts into clean Model-View-Presenter (MVP) components with `Trove` lifecycle cleanup.

## 🛑 When Not to Use
- **DO NOT** use for general 5-layer architecture rules (use `roblox-knit-arch`).
- **DO NOT** use for 3D character animation pipelines (use `roblox-animation-system`).
- **DO NOT** use for pure backend Knit services or database operations.

---

## 🛑 Strict Guardrails

### 1. Mandatory MVP Separation
* **View (`*View.lua`)**: Pure visual hierarchy and layout. Must only read instances and fire local UI signals (`OnClicked`). Prohibited from calling `Knit.GetService()`, `RemoteEvent`, or business logic.
* **Presenter (`*Presenter.lua`)**: Formats data, drives tween animations, binds signals, and attaches dynamic `UIScale`.
* **Controller (`*Controller.lua`)**: Routes player actions from Presenter to Server and pushes server state changes down to Presenter.

### 2. Dynamic `UIScale` Modifier
* All primary `ScreenGui` containers **MUST** attach a dynamic `UIScale` modifier that automatically scales down on smaller viewports (`math.clamp(viewportSize.Y / 720, 0.65, 1.15)`).
* **Prohibited**: Hardcoded absolute pixel offsets (e.g. `Offset = 900px`) that cause GUI elements to clip or overflow on mobile screens.

### 3. Touch-Friendly Hitbox Standards
* Every clickable button or interactive icon **MUST** have a minimum tap target size of **44×44 pixels** on mobile viewports.

### 4. Lifecycle & Memory Cleanup (`Trove`)
* Every Presenter **MUST** manage a `Trove` instance. All tween animations, signal connections, and temporary GUI clones must be registered to `self._trove` and destroyed on unmount.

---

## 📥 Inputs
- **Required**: Target UI layout/template (ScreenGui, Frame hierarchy) and interactive feature requirements.
- **Optional**: Reference resolution baseline, custom min/max scale clamp bounds, tween duration.

---

## 📋 Execution Workflow

1. **Design Layout & View**:
   Create `*View.lua` to index GUI instances and expose clean event signals (e.g. `CloseClicked`, `ItemActivated`).

2. **Attach Responsive Scaling**:
   Integrate `ResponsiveScaleHelper` to bind `UIScale.Scale` dynamically to camera `ViewportSize` changes.

3. **Implement Presenter**:
   Create `*Presenter.lua` with `Trove`. Connect View signals, handle tween popups, and format state text/icons.

4. **Connect Controller**:
   Wire the Presenter to the relevant Knit Controller for server queries and state synchronization.

5. **Verify Multi-Device Compatibility**:
   Test on simulated Phone (iPhone X / 16:9), Tablet (iPad / 4:3), and 1080p Desktop viewports in Roblox Studio Device Emulator.

---

## 🔀 Decision Rules
- If UI is a fullscreen modal/menu → Use Center AnchorPoint `(0.5, 0.5)` and Position `(0.5, 0, 0.5, 0)` with dynamic `UIScale`.
- If UI is a corner HUD widget → Use edge AnchorPoints (e.g. `(0, 0)` or `(1, 1)`) with proportional scaling.
- If UI needs smooth show/hide transitions → Drive `Position` and `GroupTransparency` / `BackgroundTransparency` via `TweenService` registered in `Trove`.

---

## 🔍 Verification Checklist

* [ ] **Clean Separation**: Is `*View.lua` completely free of RemoteEvents and Knit Service queries?
* [ ] **Responsive UIScale Active**: Does the ScreenGui have a dynamic `UIScale` linked to viewport dimensions?
* [ ] **No Mobile Clipping**: Does the UI render cleanly on mobile viewports without text/button clipping?
* [ ] **Minimum Tap Target (44px)**: Are interactive buttons sufficiently sized for mobile touch inputs?
* [ ] **Trove Managed**: Are all tweens and event connections cleaned up in `Presenter:Destroy()`?

---

## 📤 Output
- Decoupled, responsive MVP View and Presenter modules with automatic cross-device screen scaling.

---

## 🔗 Related Skills
- **Required**: `roblox-knit-arch` (for 5-layer architectural compliance and `rdk test` runner).
- **Optional**: `roblox-indicator-system`.
