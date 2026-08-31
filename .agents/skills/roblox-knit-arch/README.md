# Roblox + Knit Architecture Rules

This directory contains the Antigravity skill `roblox-knit-arch`.

---

## 🎯 What is this Skill for?

This skill guides the implementation of a production-grade 5-layer clean architecture on Roblox game projects using the Knit framework. The goal is to maintain separation of concerns, improve testability, prevent memory leaks via `Trove`, eliminate latency via Client-Side Prediction (CSP), and ensure gameplay logic is completely independent of the framework/Roblox API.

### Key Capabilities:
- Organize Roblox codebase files into five clean architectural layers (Domain, Application, Interface/Adapter, Infrastructure, Presentation).
- Validate dependencies flow inward: Presentation/Adapter → Application → Domain.
- Keep boundaries thin and decoupled using Contracts (Interfaces).
- Standardize Client-Side Prediction (CSP) and server reconciliation.
- Enforce memory leak prevention using `Trove` lifecycle management in Presentation & Controllers.
- Centralize all asset IDs (`rbxassetid://`, Sounds, Animations) inside `CatalogConfig.lua` in Domain.
- Standardize UseCase Result tables (`Result<T>`) and Domain Error Enums.

---

## 📖 Usage Guide (Panduan Penggunaan)

This skill is designed to guide Google Antigravity agents or developers when performing `roblox-knit-arch` operations.

### How to Activate/Trigger:
- **Auto-activation**: Antigravity agents will load this skill automatically when their task matches the description: *"Roblox + Knit architecture rules (Domain, Application, Adapter/Knit, Infrastructure, Presentation, Contract)."*
- **Manual reference**: You can instruct the agent to use it by writing:
  > "Gunakan skill `roblox-knit-arch` untuk mendesain arsitektur fitur [nama fitur]"

### Input Parameters:
When invoking this skill, ensure you provide:
1. Feature specifications or game mechanics requirements.
2. Target layer or specific modules to create/refactor (e.g. Combat, Inventory, Stamina, Movement).

### Step-by-Step Workflow:
1. **Analyze**: Identify which layer the new features or modifications should reside in (Domain, Application, Adapter, Infrastructure, Presentation).
2. **Design**: Establish the dependency flow pointing inward (e.g. Server: Service -> UseCase -> Domain).
3. **Decouple**: Use Contracts at boundaries where implementation details can change.
4. **Implement**: Write thin boundaries, pure domain rules, and ensure `Trove` cleans up all event listeners and UI objects.
5. **Verify**: Ensure Domain does not depend on Knit/Roblox API, and all items in the verification checklist are met.

---

## 📋 Examples & Templates

Refer to the references directory for a complete guide, code structure examples, and sequence diagrams:
- [layered-architecture-examples.md](./references/layered-architecture-examples.md)

