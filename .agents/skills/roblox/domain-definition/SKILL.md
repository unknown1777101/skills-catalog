---
name: roblox-domain-definition
category: Roblox
description: Guidelines and rules for authoring modular data-driven definition blueprints (Rule of Definition Sharding), aggregator catalog registries, and schema validators in Roblox Luau. DO NOT trigger for runtime states or UI.
---

# 📄 Roblox Domain Definition & Blueprint Sharding Guide

## 🎯 Purpose & Scope
This skill provides deterministic rules for authoring, organizing, validating, and aggregating **Data-Driven Definitions (Blueprints)** in Roblox Clean Architecture.

## 📌 When to Use
- Managing multiple static game data blueprints (Units, Weapons, Abilities, Items, Enemies).
- Implementing the **Rule of Definition Sharding** by creating discrete modular files inside `Definitions/`.
- Building master catalog aggregators (`UnitCatalog.lua`, `<Name>Catalog.lua`) with `Get(id)`, `GetAll()`, and `Validate(def)` functions.
- Centralizing Roblox Asset IDs into `CatalogConfig.lua`.

## 🛑 When Not to Use
- **DO NOT** trigger for dynamic mutable runtime session states (use `roblox-domain-component` or `roblox-domain-standalone`).
- **DO NOT** use for physical world entity compositions (use `roblox-domain-entity`).
- **DO NOT** use for Knit Services, Client Controllers, or UI Presenters.

## 📥 Inputs
- **Required**: Catalog name (e.g. `UnitCatalog`, `WeaponCatalog`), blueprint schema attributes, definition variants, and validation constraints.
- **Optional**: Derived metric calculation formulas (e.g., `CalculateRawDPS`).

## 📋 Workflow
1. **Inspect**: Verify that the data consists of static declarative blueprints rather than mutable runtime state.
2. **Decide**: Structure the files under `src/shared/Domain/Catalog/<CatalogName>/` with a `Definitions/` subfolder.
3. **Execute**: Create the blueprint package:
   - `<CatalogName>Types.lua`: Typed blueprint data structure contract.
   - `Definitions/<VariantName>.lua`: Discrete modular file for each data variant.
   - `<CatalogName>.lua`: Central aggregator registry, `Validate(def)` schema checker, and derived metric calculators.
   - `<CatalogName>.spec.lua`: TestEZ BDD test suite verifying registry retrieval and schema validation.
4. **Validate**: Execute `rdk test src/shared/Domain/Catalog/<CatalogName>` to verify 100% test passing.
5. **Report**: Confirm created definitions and validation results to the user.

## 🔀 Decision Rules
- If a catalog has multiple variants (e.g. 6 unit types) → **MUST** shard each variant into `Definitions/<Name>.lua`; NEVER put all tables into a single aggregator file.
- **Config vs Definition Separation**: ANY parameter that varies per individual unit, weapon, card, or item (e.g. `BaseDamage`, `AttackInterval`, `Range`, `MaxHealth`, `SupplyCost`, `MoveSpeed`, `ArmorClass`) **MUST** be placed in its specific `Definitions/<VariantName>.lua` file, NEVER in a global `*Config.lua`. Global configs are strictly for universal system constants.
- If a definition references a Roblox Asset ID (`rbxassetid://...`) → It **MUST** be mapped in `CatalogConfig.lua` to ensure zero hardcoded IDs in source code.
- If a definition table contains methods with side-effects → Strip the methods; definitions MUST be pure declarative data tables.
- **RDK Documentation Standard**: Every definition file and catalog aggregator must include `--- @module` / `--- @brief` and **EVERY single attribute/stat key must have an explicit comment** explaining its gameplay effect.
- All comments, docstrings, debug logs, error messages, and validation rejection strings **MUST** be written in **English**.

## 🔍 Verification Checklist
- [ ] Verify that every definition file exports a unique, non-empty `Id`.
- [ ] Verify `Validate(def)` rejects missing required fields and negative numbers.
- [ ] Verify all definition files are 100% free of Roblox Engine APIs.
- [ ] Run runner: `rdk test src/shared/Domain/Catalog/<CatalogName>` and achieve 100% green tests.

## 📤 Output
- Sharded definition package with modular `Definitions/` and master aggregator in `src/shared/Domain/Catalog/<CatalogName>/`.
- 100% verified BDD unit tests passing in RDK test runner.

## 📚 References
- For 5-layer architecture boundaries, refer to [roblox-knit-arch](../knit-arch/SKILL.md).
- For BDD unit testing rules, refer to [roblox-test-creation](../test-creation/SKILL.md).

## 🔗 Related Skills
- **Required**: `roblox-test-creation` (for test verification via `rdk test`).
- **Related**: `roblox-domain-standalone`, `roblox-domain-entity`.
