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

## 📖 Developer Usage Guide

This skill is designed to guide Google Antigravity agents or developers when creating or refactoring alert indicator systems in Roblox.

### How to Activate / Trigger:
- **Auto-activation**: Antigravity agents load this skill automatically when the task matches indicator badges, red-dots, or unread notification counters.
- **Manual instruction**: You can instruct the agent by typing:
  > "Use the `roblox-indicator-system` skill to build a red-dot indicator for [feature/button name]"

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
