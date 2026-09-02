# 📜 Roblox Contract Interface Skill (`roblox-contract-interface`)

## 🎯 Purpose & Scope
This skill provides engineering guidelines and templates for authoring Contract Interfaces (`*Types.lua`) in Roblox Luau Clean Architecture projects.
It enforces the Interface Segregation Principle (ISP) and Contract-First design across Presenters, Services, and Infrastructure Adapters.

---

## 📖 Developer Usage Guide

### 1. When to Use This Skill
- When designing a layer with multiple potential implementations (e.g. UI Presenters, 3D World Views, Storage Adapters).
- When ensuring that callers (Knit Controllers or Services) are not tightly coupled to concrete implementations.
- When defining DTOs (Data Transfer Objects) and clean method signatures for IoC Container resolution.

### 2. File Organization
```text
src/client/Presentation/World/
├── LaneWorldTypes.lua       <-- Contract types & DTO definitions (returns nil)
├── LaneWorldPresenter.lua   <-- Implements ILaneWorldPresenter
└── LaneWorldView.lua        <-- Concrete 3D View
```

### 3. Consuming Contracts via IoC Container:
```lua
local LaneWorldTypes = require(script.Parent.Parent.Presentation.World.LaneWorldTypes)
type ILaneWorldPresenter = LaneWorldTypes.ILaneWorldPresenter

local presenter: ILaneWorldPresenter = Container.Resolve("ILaneWorldPresenter")
presenter:RenderSnapshot(snapshot.Units)
```
