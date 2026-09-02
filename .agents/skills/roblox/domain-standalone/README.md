# 🌀 Roblox Standalone Domain Skill (`roblox-domain-standalone`)

## 🎯 What is this Skill for?
This skill is used to design and author **Standalone Domains** for independent game systems, global mathematical formulas, combat rules, and calculators (such as `Supply`, `Combat`, `Targeting`) without composing physical entity instances.

## 📖 Usage Guide
1. **Identify System**: Define the global mathematical calculation or ruleset.
2. **Create the 5 Standard Files**:
   - `<Name>Types.lua`: State structure typings & DTOs.
   - `<Name>Config.lua`: Balancing constants and default values.
   - `<Name>Domain.lua`: Pure static calculation functions.
   - `<Name>Factory.lua`: Initial state constructor.
   - `<Name>.spec.lua`: BDD TestEZ test suite.
3. **Execute Verification**: Run tests using the **RDK** runner:
   ```powershell
   rdk test src/shared/Domain/<DomainName>
   ```

## 💡 Examples
```lua
-- Supply calculation example in SupplyDomain.lua
function SupplyDomain.Spend(state: SupplyState, cost: number): SupplyState
    local nextState = table.clone(state)
    nextState.CurrentSupply = math.clamp(nextState.CurrentSupply - cost, 0, nextState.MaxSupply)
    return nextState
end
```
