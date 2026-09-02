---
name: roblox-domain-entity
category: Roblox
description: Guidelines and rules for assembling concrete Domain Entities by composing multiple behavioral Domain Components in Roblox Luau. DO NOT trigger for single atomic components or UI.
---

# 🤖 Roblox Domain Entity Composition Guide

## 🎯 Purpose & Scope
This skill provides deterministic rules for assembling and maintaining **Domain Entities**. A Domain Entity represents a concrete object inside the game world that possesses an identity (such as `Unit`, `CommandBase`, `Player`, `Pet`, or `Enemy`) and is composed of multiple child component states rather than using class inheritance.

## 📌 When to Use
- Assembling stateful, physical game world objects (`Unit`, `Pet`, `NPC`, `Enemy`, `Base`).
- Composing multiple Domain Component states (e.g. `HealthState` + `MovementState`) into a parent entity state.
- Implementing entity delegator logic that delegates state calculations to child component domains.

## 🛑 When Not to Use
- **DO NOT** trigger for atomic reusable behaviors (use `roblox-domain-component`).
- **DO NOT** use for abstract math formulas or match scoring without physical entities (use `roblox-domain-standalone`).
- **DO NOT** use for data-driven blueprint definitions or catalog aggregators (use `roblox-domain-definition`).
- **DO NOT** use for Knit Services, Client Controllers, or UI Presenters.

## 📥 Inputs
- **Required**: Entity name (e.g. `Unit`, `Pet`, `Player`), list of child Domain Components being composed, composite state attributes, and delegation methods.
- **Optional**: Initial parameter overrides for child component factories.

## 📋 Workflow
1. **Inspect**: Verify the element is a concrete game world object (physical object) that spawns and despawns.
2. **Decide**: Choose the folder location: `src/shared/Domain/Entity/<EntityName>/` (or feature-sharded under `src/shared/Features/<Feature>/Domain/Entity/<EntityName>/`).
3. **Execute**: Create the 4 standard files:
   - `<EntityName>Types.lua`: Composite state table embedding child component states.
   - `<EntityName>Factory.lua`: Initial state assembler calling child component factories.
   - `<EntityName>Domain.lua`: Pure static delegators forwarding calls to child component domains.
   - `<EntityName>.spec.lua`: TestEZ BDD test suite verifying delegation and composite immutability.
4. **Validate**: Execute `rdk test` on the entity directory to verify 100% test passing.
5. **Report**: Confirm created entity files and test results to the user.

## 🔀 Decision Rules
- If the element is an atomic attribute or behavior owned by an entity (e.g. `Health`, `Movement`) → Switch to `roblox-domain-component`.
- If an entity function performs a mutation on a component state → It **MUST** delegate to the respective component domain (e.g. `HealthDomain.ApplyDamage(state.Health, amount)`); NEVER rewrite component math inline.
- If an entity mutation occurs → Always return a cloned entity state (`table.clone(state)`) with the updated component state.
- All comments, docstrings, debug logs, error messages, and validation rejection strings **MUST** be written in **English**.

## 🔍 Verification Checklist
- [ ] Verify that no component internal logic is duplicated inside `<EntityName>Domain.lua`.
- [ ] Verify all modules are 100% free of Roblox Engine APIs (`game`, `workspace`, `Instance.new()`, `task.wait()`).
- [ ] Run runner: `rdk test src/shared/Domain/Entity/<EntityName>` and achieve 100% green tests.

## 📤 Output
- Compilation-ready composite entity package in `src/shared/Domain/Entity/<EntityName>/`.
- 100% verified BDD unit tests passing in RDK test runner.

## 📚 References
- For component creation, refer to [roblox-domain-component](../domain-component/SKILL.md).
- For 5-layer architecture boundaries, refer to [roblox-knit-arch](../knit-arch/SKILL.md).

## 🔗 Related Skills
- **Required**: `roblox-domain-component` (for composing child components), `roblox-test-creation`.
- **Related**: `roblox-domain-standalone`, `roblox-domain-definition`.
