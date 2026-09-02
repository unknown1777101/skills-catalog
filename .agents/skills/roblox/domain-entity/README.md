# 🤖 Roblox Domain Entity Skill (`roblox-domain-entity`)

## 🎯 What is this Skill for?
This skill is used to assemble **Domain Entities** (concrete game world objects like `Unit`, `Pet`, `Base`, `Enemy`) via **Component Composition** in Roblox Luau clean architecture without using class inheritance.

## 📖 Usage Guide
1. **Identify Entity**: Define the concrete game entity and its composed child components (e.g. `Health`, `Movement`).
2. **Create the 4 Standard Files**:
   - `<Name>Types.lua`: Composite state table embedding component states.
   - `<Name>Factory.lua`: Initial state assembler calling child component factories.
   - `<Name>Domain.lua`: Static delegator forwarding logic to child component domains.
   - `<Name>.spec.lua`: BDD TestEZ test suite.
3. **Execute Verification**: Run tests using the **RDK** runner:
   ```powershell
   rdk test src/shared/Domain/Entity/<EntityName>
   ```

## 💡 Examples
```lua
-- Delegation example in UnitEntityDomain.lua
function UnitEntityDomain.TakeDamage(state: UnitEntityState, amount: number): UnitEntityState
    local nextState = table.clone(state)
    nextState.Health = HealthDomain.ApplyDamage(state.Health, amount)
    return nextState
end
```
