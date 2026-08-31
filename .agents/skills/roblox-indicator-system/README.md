# Roblox Alert Indicator & Badge System

This directory contains the Antigravity skill `roblox-indicator-system`.

---

## 🎯 What is this Skill for?

This skill provides deterministic guidelines, architecture patterns, and code templates for building a centralized, reactive **Alert Indicator and Badge System (Red-Dot / Unread Counter)** across UI buttons, topbars, and navigation tabs in Roblox.

### Key Capabilities:
- Centralize semantic indicator keys in `IndicatorKeys.lua` in Domain.
- Manage reactive client alert states via `IndicatorController`.
- Attach animated red-dot and numerical counter badges to any GUI button using `IndicatorBadgePresenter`.
- Synchronize unread badges across multiple UI locations without desync bugs.
- Prevent memory leaks using `Trove` lifecycle management.

---

## 📖 Usage Guide (Panduan Penggunaan)

This skill is designed to guide Google Antigravity agents or developers when implementing alert badges and unread indicators on Roblox UI elements.

### How to Activate/Trigger:
- **Auto-activation**: Antigravity agents will load this skill automatically when their task matches: *"Roblox alert indicator and badge system patterns (red-dots, unread counts, attention badges)."*
- **Manual reference**: You can instruct the agent to use it by writing:
  > "Gunakan skill `roblox-indicator-system` untuk membuat sistem red-dot [nama menu/tombol]"

### Input Parameters:
When invoking this skill, ensure you provide:
1. Target GUI button / icon to attach the indicator.
2. Semantic key name in `IndicatorKeys.lua`.
3. Badge style (simple red dot vs numerical count).

### Step-by-Step Workflow:
1. **Register**: Add the semantic key in `IndicatorKeys.lua`.
2. **Setup**: Initialize `IndicatorController.lua` in Knit client.
3. **Mount**: Attach `IndicatorBadgePresenter.new(button, key)` in your UI presenter.
4. **Trigger**: Call `IndicatorController:SetIndicator(key, value)` when the state changes.
5. **Verify**: Ensure the badge pops smoothly and cleans up on unmount.

---

## 📋 Examples & Templates

Refer to the references directory for full Luau code templates:
- [indicator-system-guide.md](./references/indicator-system-guide.md)
