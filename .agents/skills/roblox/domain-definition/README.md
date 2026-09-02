# 📄 Roblox Domain Definition Skill (`roblox-domain-definition`)

## 🎯 What is this Skill for?
This skill is used to author **Data-Driven Definitions (Blueprints)**, enforce the **Rule of Definition Sharding**, build master catalog aggregators, and implement automated schema validators in Roblox Luau clean architecture.

## 📖 Usage Guide
1. **Identify Blueprints**: Define the static data items to create (e.g. roster of units, weapons, cards).
2. **Create Sharded Blueprint Package**:
   - `<Name>Types.lua`: Blueprint data contract typings.
   - `Definitions/<VariantName>.lua`: One modular file per data variant.
   - `<Name>Catalog.lua`: Master aggregator registry exposing `Get(id)`, `GetAll()`, and `Validate(def)`.
   - `<Name>.spec.lua`: Unit tests verifying catalog integrity.
3. **Execute Verification**: Run tests using the **RDK** runner:
   ```powershell
   rdk test src/shared/Domain/<CatalogName>
   ```

## 💡 Examples
```lua
-- Catalog lookup and validation in UnitCatalog.lua
local unit = UnitCatalog.Get("rifle_squad")
local isValid, err = UnitCatalog.Validate(unit)
assert(isValid, err)
```
