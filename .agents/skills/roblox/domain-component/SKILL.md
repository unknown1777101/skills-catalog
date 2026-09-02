---
name: roblox-domain-component
category: Roblox
description: Guidelines and rules for authoring pure Luau engine-agnostic, stateless, and immutable Domain Behavior Components (Health, Movement, Combat) reusable by game entities. DO NOT trigger for composite entities or UI.
---

# 🧩 Roblox Domain Component Creator Guide (Behaviors)

## 🎯 Purpose & Scope
This skill provides deterministic rules for creating and maintaining **Domain Components (Behavior Components)**. A Domain Component represents an independent, modular behavior or attribute (such as `Health`, `Movement`, `Stamina`, `Shield`) that attaches to and is composed by Domain Entities.

## 📌 When to Use
- Creating atomic, reusable behaviors or stats attached to game entities.
- Writing pure Luau calculations, damage/healing logic, locomotion speed rules, or stamina consumption.
- Implementing the 5-file component standard (`Types.lua`, `Config.lua`, `Domain.lua`, `Factory.lua`, `.spec.lua`).

## 🛑 When Not to Use
- **DO NOT** trigger for assembling physical game entities with unique identities (use `roblox-domain-entity`).
- **DO NOT** use for global game rules, match timers, or supply systems without entities (use `roblox-domain-standalone`).
- **DO NOT** use for data-driven blueprint definitions or catalog aggregators (use `roblox-domain-definition`).
- **DO NOT** use for Knit Services, Client Controllers, or UI Presenters.

## 📥 Inputs
- **Required**: Component name (e.g. `Health`, `Movement`, `Stamina`), state attributes, balancing parameters, and mutation rules.
- **Optional**: Custom validation policies (`Can...`), derived queries (`Get...`).

## 📋 Workflow
1. **Inspect**: Determine whether the required behavior is a reusable component (behavior/trait) and not a physical entity or standalone rule.
2. **Decide**: Choose the folder location: `src/shared/Domain/Component/<ComponentName>/` (or feature-sharded under `src/shared/Features/<Feature>/Domain/Component/<ComponentName>/`).
3. **Execute**: Create the 5 standard files:
   - `<ComponentName>Types.lua`: Typed Luau state table (`export type <ComponentName>State`).
   - `<ComponentName>Config.lua`: Immutable balancing constants and default numbers.
   - `<ComponentName>Domain.lua`: Pure static functions (`Can...`, `Get...`, `<Verb>`).
   - `<ComponentName>Factory.lua`: Initial state constructor (`Create(overrides?)`).
   - `<ComponentName>.spec.lua`: TestEZ BDD test suite.
4. **Validate**: Execute `rdk test` on the component directory to verify 100% test passing and immutability.
5. **Report**: Confirm created files and test verification results to the user.

## 🔀 Decision Rules
- If the feature represents a physical object in the game world (e.g. `Unit`, `Base`) → Switch to `roblox-domain-entity`.
- If the feature represents global game math or match rules without an entity (e.g. `Supply`, `MatchRules`) → Switch to `roblox-domain-standalone`.
- If a state mutation is performed → Always use `table.clone(state)` and return a new table; NEVER mutate the input table in-place.
- If naming functions:
  - Policy/validation → Prefix with `Can<Action>` (returns `boolean, string?`).
  - Queries/calculations → Prefix with `Get<Value>` or `Calculate<Value>`.
  - State mutations → Use explicit verbs (e.g. `ApplyDamage`, `Heal`, `Consume`).
  - Boolean state fields → Use `Is<Property>` (e.g. `state.IsDead`); never use `Is...` as a function name.
- **RDK Documentation Standard**: Every `*Config.lua` must include `--- @module` / `--- @brief` and **EVERY single config key must have an explicit comment** explaining its purpose, unit of measure, and default balancing intent.
- All comments, docstrings, debug logs, error messages, and validation rejection strings **MUST** be written in **English**.

## 🔍 Verification Checklist
- [ ] Verify all files are 100% free of Roblox Engine APIs (`game`, `workspace`, `Instance.new()`, `task.wait()`).
- [ ] Verify immutability: original model remains untouched after executing mutations.
- [ ] Verify time-stepping logic injects discrete `deltaTime` parameters without `wait()`.
- [ ] Run runner: `rdk test src/shared/Domain/Component/<ComponentName>` and achieve 100% green tests.

## 📤 Output
- Compilation-ready 5-file component package in `src/shared/Domain/Component/<ComponentName>/`.
- 100% verified BDD unit tests passing in RDK test runner.

## 📚 References
- For 5-layer architecture boundaries, refer to [roblox-knit-arch](../knit-arch/SKILL.md).
- For BDD unit testing standards, refer to [roblox-test-creation](../test-creation/SKILL.md).

## 🔗 Related Skills
- **Required**: `roblox-test-creation` (for test execution via `rdk test`).
- **Related**: `roblox-domain-entity`, `roblox-domain-standalone`.
