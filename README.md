# 🟥 Antigravity Roblox Clean Architecture Skills Catalog

A modular collection of production-grade Google Antigravity Agent Skills for **Roblox Luau Clean Architecture**, **Knit Framework**, and high-performance game development.

---

## 🚀 Installation

### 1. Global Installation (Recommended for Personal Machine)
Installs all Roblox skills globally across all projects on your machine (`~/.gemini/config/skills/`):

```bash
npm install -g git+https://github.com/unknown1777101/skills-catalog.git
```
*After global installation, Antigravity AI agents in any Roblox project workspace will automatically recognize and use these skills.*

---

### 2. Local Project Installation (For Team Repositories)
Installs the package into a specific game project repository:

```bash
npm install git+https://github.com/unknown1777101/skills-catalog.git
```
*Or manually copy into your active project folder:*
```bash
npx skills-roblox install --local
```

---

## 🛠️ CLI Commands

You can manage, list, and install skills anytime using the CLI:

```bash
# List all available skills and their descriptions
npx skills-roblox list

# Install skills globally to ~/.gemini/config/skills/
npx skills-roblox install --global

# Install skills locally to .agents/skills/ in the current project
npx skills-roblox install --local

# Remove skills from global config
npx skills-roblox uninstall --global

# Remove skills from local project
npx skills-roblox uninstall --local
```

---

## 📦 Available Skills in this Catalog

| Skill Name | Path | Primary Responsibility |
|---|---|---|
| **[`roblox-knit-arch`](./.agents/skills/roblox-knit-arch/)** | `.agents/skills/roblox-knit-arch/` | **Master 5-Layer Clean Architecture**: Domain, Application, Interface/Adapter, Infrastructure, Presentation, Contracts, and 5 Production Pillars (CSP, Trove, Replication, Catalog, Error Enums). |
| **[`roblox-object-pooling`](./.agents/skills/roblox-object-pooling/)** | `.agents/skills/roblox-object-pooling/` | **Object Pooling**: Pre-warmed pools for fast bullets, damage numbers, and particle effects to eliminate GC lag spikes. |
| **[`roblox-animation-system`](./.agents/skills/roblox-animation-system/)** | `.agents/skills/roblox-animation-system/` | **Animation Pipeline**: Centralized track caching, `CatalogConfig` asset ID mapping, and frame-perfect marker event synchronization. |
| **[`roblox-responsive-ui`](./.agents/skills/roblox-responsive-ui/)** | `.agents/skills/roblox-responsive-ui/` | **Cross-Platform Responsive UI**: Model-View-Presenter (MVP), dynamic `UIScale` modifier, 44px touch targets, and `Trove` memory cleanup. |
| **[`roblox-indicator-system`](./.agents/skills/roblox-indicator-system/)** | `.agents/skills/roblox-indicator-system/` | **Alert & Badge System**: Reactive red-dot and unread counters across UI buttons and navigation tabs. |

---

## 🧪 Validating Skills

To audit and validate all skills against the Antigravity Quality Gate (100% compliance standard):
```bash
node node_modules/ai-skill-creator/scripts/validate_plugin.js .
```
