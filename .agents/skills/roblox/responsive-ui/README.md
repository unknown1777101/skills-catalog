# Roblox Responsive UI & MVP Presenter

This directory contains the Antigravity skill `roblox-responsive-ui`.

---

## 🎯 What is this Skill for?

This skill provides guidelines, best practices, and code templates for building clean, responsive, and cross-platform **User Interfaces (UI/HUD)** in Roblox using the Model-View-Presenter (MVP) pattern and dynamic `UIScale` viewport scaling.

### Key Capabilities:
- Structure UI components cleanly using the Model-View-Presenter (MVP) pattern.
- Automatically scale ScreenGuis across Mobile, Tablet, Desktop, and Console screens using `UIScale`.
- Prevent UI clipping and overflowing on small mobile screens.
- Guarantee touch-friendly hitboxes (minimum 44×44 pixels).
- Safely clean up tweens and event listeners using `Trove`.

---

## 📖 Usage Guide (Panduan Penggunaan)

This skill is designed to guide Google Antigravity agents or developers when creating or refactoring UI components in Roblox.

### How to Activate/Trigger:
- **Auto-activation**: Antigravity agents will load this skill automatically when their task matches: *"Roblox responsive UI patterns, dynamic UIScale modifiers, and Model-View-Presenter (MVP) architecture."*
- **Manual reference**: You can instruct the agent to use it by writing:
  > "Gunakan skill `roblox-responsive-ui` untuk mendesain UI [nama menu/HUD]"

### Input Parameters:
When invoking this skill, ensure you provide:
1. Target UI type (Modal, Fullscreen Menu, Corner HUD widget, Toast).
2. Layout structure and interactive actions (buttons, slots, inputs).
3. Reference resolution baseline (default: 1280×720).

### Step-by-Step Workflow:
1. **Design Layout**: Create `*View.lua` for pure layout and signal event declarations.
2. **Attach Scale**: Apply dynamic `UIScale` helper to adapt to camera viewport changes.
3. **Implement Presenter**: Create `*Presenter.lua` with `Trove` for animations and data formatting.
4. **Connect Controller**: Connect user actions to the client Knit Controller.
5. **Verify**: Test on phone, tablet, and desktop viewport sizes.

---

## 📋 Examples & Templates

Refer to the references directory for full Luau code templates:
- [responsive-ui-guide.md](./references/responsive-ui-guide.md)
