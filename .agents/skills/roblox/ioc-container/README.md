# 💉 Roblox IoC Container & Dependency Injection Skill (`roblox-ioc-container`)

## 🎯 Purpose & Scope
This skill guides the design, implementation, testing, and registration of lightweight Inversion of Control (IoC) Containers and dynamic Dependency Injection (DI) in Roblox Luau Clean Architecture projects.

---

## 📖 Developer Usage Guide

### 1. When to Use This Skill
- When dynamically injecting dependencies (*Presenters*, *Infrastructure Adapters*, *Audio Providers*) into Knit Controllers or Services.
- When creating *Mock* dependencies for unit testing without altering Controller or Service source code.
- When supporting multi-platform visual bindings (e.g., Mobile, Desktop, VR Presenters).

### 2. File Organization
```text
src/shared/Infrastructure/Container/
├── Container.lua       <-- Lightweight pure IoC Container module
└── Container.spec.lua  <-- BDD Unit test suite for Registration & Resolution
```

### 3. Standard Usage Workflow
1. **Register Bindings during Bootstrap (`init.client.lua` / `init.server.lua`)**:
   ```lua
   Container.Register("ILaneWorldPresenter", function()
       return LaneWorldPresenter.New()
   end)
   ```
2. **Resolve Dynamically in Controllers / Services**:
   ```lua
   self.WorldPresenter = Container.Resolve("ILaneWorldPresenter")
   ```
