# 🪐 Antigravity Universal Skills Catalog & Manager

A modular collection of production-grade Google Antigravity Agent Skills equipped with an **Interactive CLI** and a modern **Web GUI Dashboard** for granular multi-skill selection, real-time revision detection, and one-click installation & updates to Global or Local workspaces.

---

## 🚀 Getting Started

### 1. Global Installation (Recommended)
Install the Skills Manager globally on your machine once:

```bash
npm install -g https://github.com/unknown1777101/skills-catalog/tarball/main
```

*Once installed globally, the `skills-catalog` command is available everywhere across all terminals on your machine.*

---

## 🔄 Smart Update & Revision Workflow

Whenever a skill receives revisions or rule updates in the central catalog, updating your projects or global environment is instant:

### 1. Update via Web GUI Dashboard
1. Open the dashboard: `skills-catalog ui` (or double-click `start-ui.bat`).
2. If any installed skill has revisions, the card will display an animated **`Update Available 🔄`** badge.
3. Click the **"🔄 Update"** button on individual cards, or click **"🔄 Update All"** in the top stats bar.
4. Use the **"Revision Comparison (Diff)"** tab in the preview modal to inspect line-by-line differences before applying updates.

### 2. Update via CLI
```bash
# Check status and revision diff across all skills
skills-catalog status --local
skills-catalog status --global

# Update all currently installed skills in local project workspace
skills-catalog update --local

# Update specific skill(s)
skills-catalog update roblox/knit-arch roblox/object-pooling --local

# Update all skills in global config (~/.gemini/config/skills/)
skills-catalog update --global
```

### 3. Synchronization (Reverse Sync & Auto-Import New Skills)
If you made improvements, created brand new skills in your local project, or tuned prompts in global config:
```bash
# Sync edits and automatically import any newly created skills from local workspace into catalog repository
skills-catalog sync-from-local

# Sync from a specific external project path
skills-catalog sync-from-local --from "D:\path\to\project"

# Sync edits and automatically import any newly created skills from global config into catalog repository
skills-catalog sync-from-global
```

### 4. Upgrading the Installer & CLI (`self-update`)
To upgrade the global `skills-catalog` CLI tool itself to the latest release:
```bash
skills-catalog self-update
```

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
- 📊 **Quick Stats Bar**: View total skills, installed counts, and pending updates at a glance.
- 🔍 **Instant Search & Filter**: Find skills by keyword or category.
- ☑️ **Batch Operations**: Select multiple skills and execute 1-click **Install**, **Update**, or **Uninstall**.
- 👁️ **Rich Markdown & Diff Modal**: Formatted `SKILL.md` rules and live revision comparison view.

---

### Option 2: ⌨️ Interactive Terminal CLI
Run the interactive terminal prompt to choose which skills to install:

```bash
skills-catalog install
```
*The CLI will display a numbered checklist where you can select specific skill numbers (e.g. `1, 3, 4`) or `0` for all, followed by your choice of destination (Global or Local).*

---

### Option 3: ⚡ Direct Command-Line Execution

```bash
# List all available skills and their status
skills-catalog list

# Detailed status and checksum comparison
skills-catalog status --local

# Search skills by keyword
skills-catalog search knit

# Install specific skills directly to Global config
skills-catalog install roblox-knit-arch roblox-object-pooling --global

# Install specific skills directly to Local workspace
skills-catalog install roblox-responsive-ui roblox-indicator-system --local

# Install all skills at once
skills-catalog install --all --global

# Update all installed skills
skills-catalog update --local

# Upgrade the global CLI tool itself
skills-catalog self-update

# Uninstall specific skills
skills-catalog uninstall roblox-object-pooling --global
```

---

## 📦 Available Skills in this Catalog

| Skill Name | Path | Primary Responsibility |
|---|---|---|
| **[`roblox-knit-arch`](./.agents/skills/roblox/knit-arch/)** | `.agents/skills/roblox/knit-arch/` | **Master 5-Layer Clean Architecture**: Domain, Application, Interface/Adapter, Infrastructure, Presentation, Contracts, and 5 Production Pillars. |
| **[`roblox-domain-component`](./.agents/skills/roblox/domain-component/)** | `.agents/skills/roblox/domain-component/` | **Domain Behavior Components**: Stateless, immutable, and engine-agnostic component behaviors (Health, Movement, Combat). |
| **[`roblox-domain-entity`](./.agents/skills/roblox/domain-entity/)** | `.agents/skills/roblox/domain-entity/` | **Domain Composite Entities**: Composed entity game objects (Unit, Base, Character) owning multiple behavior components. |
| **[`roblox-domain-standalone`](./.agents/skills/roblox/domain-standalone/)** | `.agents/skills/roblox/domain-standalone/` | **Standalone Domain Rules**: Pure mathematical calculations, match rules, scoring, and targeting algorithms. |
| **[`roblox-domain-definition`](./.agents/skills/roblox/domain-definition/)** | `.agents/skills/roblox/domain-definition/` | **Data-Driven Definitions**: Definition blueprints, Rule of Definition Sharding, and catalog aggregator configs. |
| **[`roblox-test-creation`](./.agents/skills/roblox/test-creation/)** | `.agents/skills/roblox/test-creation/` | **BDD Unit Testing (RDK)**: Automated test suite creation (`*.spec.lua`) and execution with TestEZ via Roblox Development Kit. |
| **[`roblox-object-pooling`](./.agents/skills/roblox/object-pooling/)** | `.agents/skills/roblox/object-pooling/` | **Object Pooling**: Pre-warmed pools for fast bullets, damage numbers, and particle effects to eliminate GC lag spikes. |
| **[`roblox-animation-system`](./.agents/skills/roblox/animation-system/)** | `.agents/skills/roblox/animation-system/` | **Animation Pipeline**: Centralized track caching, `CatalogConfig` asset ID mapping, and frame-perfect marker event synchronization. |
| **[`roblox-responsive-ui`](./.agents/skills/roblox/responsive-ui/)** | `.agents/skills/roblox/responsive-ui/` | **Cross-Platform Responsive UI**: Model-View-Presenter (MVP), dynamic `UIScale` modifier, 44px touch targets, and `Trove` memory cleanup. |
| **[`roblox-indicator-system`](./.agents/skills/roblox/indicator-system/)** | `.agents/skills/roblox/indicator-system/` | **Alert & Badge System**: Reactive red-dot and unread counters across UI buttons and navigation tabs. |
| **[`roblox-contract-interface`](./.agents/skills/roblox/contract-interface/)** | `.agents/skills/roblox/contract-interface/` | **Contract Interface Types**: Type schemas, DTOs, and interface segregation contracts (`*Types.lua`). |
| **[`roblox-ioc-container`](./.agents/skills/roblox/ioc-container/)** | `.agents/skills/roblox/ioc-container/` | **IoC & Dependency Injection**: Dynamic singleton/factory container registry and decoupled testing. |
| **[`game-design-document`](./.agents/skills/game-design-document/)** | `.agents/skills/game-design-document/` | **Game Design Documentation (GDD)**: Structured game design documentation, systems specs, and codebase drift validation. |

---

## 🧪 Validating Skills

To audit and validate all skills against the Antigravity Quality Gate (100% compliance standard):
```bash
node node_modules/ai-skill-creator/scripts/validate_plugin.js .
```

