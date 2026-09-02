---
name: roblox-domain-standalone
category: Roblox
description: Guidelines and rules for writing pure Luau standalone game systems, scoring rules, targeting algorithms, and match rules without component compositions. DO NOT trigger for physical entities or UI.
---

# 🌀 Roblox Standalone Domain Creator Guide

## 🎯 Purpose & Scope
This skill provides deterministic rules for creating and maintaining **Standalone Domains**. A Standalone Domain represents independent game system rules, mathematical calculators, supply systems, or global matchmaking/scoring logic that does not map directly to a physical world entity and does not use component compositions.

## 📌 When to Use
- Writing global game rules, mathematical calculators, or algorithms (e.g. `Supply`, `CombatCalculator`, `TargetingSelector`, `MatchRules`).
- Implementing game systems where calculations do not belong to a single physical entity instance.
- Creating the 5-file standalone domain standard (`Types.lua`, `Config.lua`, `Domain.lua`, `Factory.lua`, `.spec.lua`).

## 🛑 When Not to Use
- **DO NOT** trigger for assembling physical game world objects (use `roblox-domain-entity`).
- **DO NOT** use for atomic behaviors attached to entities (use `roblox-domain-component`).
- **DO NOT** use for data-driven blueprint definitions or catalog aggregators (use `roblox-domain-definition`).
- **DO NOT** use for Knit Services, Client Controllers, or UI Presenters.

## 📥 Inputs
- **Required**: Domain name (e.g. `Supply`, `Combat`, `Targeting`), state attributes, mathematical formulas, balancing configs, and mutation functions.
- **Optional**: Derived calculation queries and policies.

## 📋 Workflow
1. **Inspect**: Verify the calculation represents global rules or math without mapping to a physical entity.
2. **Decide**: Choose the folder location: `src/shared/Domain/Standalone/<DomainName>/` (or feature-sharded under `src/shared/Features/<Feature>/Domain/Standalone/<DomainName>/`).
3. **Execute**: Create the 5 standard files:
   - `<DomainName>Types.lua`: Typed state table and DTOs.
   - `<DomainName>Config.lua`: Immutable balancing constants and multipliers.
   - `<DomainName>Domain.lua`: Pure static calculation functions.
   - `<DomainName>Factory.lua`: Initial state constructor (`Create(overrides?)`).
   - `<DomainName>.spec.lua`: TestEZ BDD test suite.
4. **Validate**: Execute `rdk test src/shared/Domain/Standalone/<DomainName>` to verify 100% test passing.
5. **Report**: Confirm created files and test verification results to the user.

## 🔀 Decision Rules
- If the feature represents a physical game world object (e.g. `Unit`, `Base`) → Switch to `roblox-domain-entity`.
- If the feature represents a reusable trait attached to an entity (e.g. `Health`) → Switch to `roblox-domain-component`.
- If a setting varies per individual entity/unit/weapon (e.g. Damage, Range, HP) → It **MUST** go into `Definitions/<Name>.lua`, NOT in `*Config.lua`. Global configs are strictly for universal system constants.
- If the domain manages multiple static data blueprints (such as unit definitions) → Use `roblox-domain-definition` with `Definitions/` subfolder.
- If a state mutation is executed → Always use `table.clone(state)` and return a newly constructed table.
- **RDK Documentation Standard**: Every `*Config.lua` must include `--- @module` / `--- @brief` and **EVERY single config key must have an explicit comment** explaining its purpose, unit of measure, and default balancing intent.
- All comments, docstrings, debug logs, error messages, and validation rejection strings **MUST** be written in **English**.

## 🔍 Verification Checklist
- [ ] Verify all modules are 100% free of Roblox Engine APIs (`game`, `workspace`, `Instance.new()`, `task.wait()`).
- [ ] Verify immutability: original state remains unchanged after mutation calls.
- [ ] Verify discrete time-step injection without real-time async delays.
- [ ] Run runner: `rdk test src/shared/Domain/Standalone/<DomainName>` and achieve 100% green tests.

## 📤 Output
- Compilation-ready standalone domain package in `src/shared/Domain/Standalone/<DomainName>/`.
- 100% verified BDD unit tests passing in RDK test runner.

## 📚 References
- For 5-layer architecture boundaries, refer to [roblox-knit-arch](../knit-arch/SKILL.md).
- For BDD testing rules, refer to [roblox-test-creation](../test-creation/SKILL.md).

## 🔗 Related Skills
- **Required**: `roblox-test-creation` (for test verification via `rdk test`).
- **Related**: `roblox-domain-definition`, `roblox-domain-component`.
