# 🪐 Antigravity Universal Skills Catalog & Manager

A modular collection of production-grade Google Antigravity Agent Skills equipped with an **Interactive CLI** and a modern **Web GUI Dashboard** for granular multi-skill selection and one-click installation to Global or Local workspaces.

---

## 🚀 Getting Started

### 1. Global Installation (Recommended)
Install the Skills Manager globally on your machine once:

```bash
npm install -g git+https://github.com/unknown1777101/skills-catalog.git
```

*Once installed globally, the `skills-catalog` command is available everywhere across all terminals on your machine.*

---

## 🖥️ 3 Ways to Use & Install Skills

### Option 1: 🌐 Modern Web GUI Dashboard (Visual & 1-Click)
Launch the interactive web dashboard in your browser:

```bash
skills-catalog ui
```
*Or on Windows: simply **double-click `start-ui.bat`** directly from File Explorer.*

**Web GUI Capabilities**:
- 🔄 **Target Toggle**: Switch between **Global (`~/.gemini/config/skills/`)** and **Local Workspace (`.agents/skills/`)**.
- 🔍 **Search & Filter**: Find skills instantly by keyword or category (Roblox, Unity, Git, Dev Tools).
- ☑️ **Granular Selection**: Pick specific individual skills using checkboxes and click **"Install Selected"**.
- 👁️ **In-App Markdown Preview**: Read and inspect `SKILL.md` rules and `README.md` usage guides in a modal window before installing.

---

### Option 2: ⌨️ Interactive Terminal CLI (Terminal Selection)
Run the interactive terminal prompt to choose which skills to install:

```bash
skills-catalog install
```
*The CLI will display a numbered checklist where you can select specific skill numbers (e.g. `1, 3, 4`) or `0` for all, followed by your choice of destination (Global or Local).*

---

### Option 3: ⚡ Direct Command-Line Execution

```bash
# List all available skills and their installation status
skills-catalog list

# Install specific skills directly to Global config
skills-catalog install roblox-knit-arch roblox-object-pooling --global

# Install specific skills directly to Local workspace
skills-catalog install roblox-responsive-ui roblox-indicator-system --local

# Install all skills at once
skills-catalog install --all --global

# Uninstall specific skills
skills-catalog uninstall roblox-object-pooling --global
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
