# 🧩 Roblox Domain Component Skill (`roblox-domain-component`)

## 🎯 What is this Skill for?
This skill is used to design and author **Domain Components (Behavior Components)** that are pure, stateless, immutable, engine-agnostic, and reusable across multiple game entities.

## 📖 Usage Guide
1. **Identify Behavior**: Define the atomic component to create (e.g. `Health`, `Movement`, `Stamina`).
2. **Create the 5 Standard Files**:
   - `<Name>Types.lua`: Typed Luau state definitions.
   - `<Name>Config.lua`: Balancing constants and default values.
   - `<Name>Domain.lua`: Pure business logic and mathematical mutations (`Can...`, `Get...`, `<Verb>`).
   - `<Name>Factory.lua`: Initial state constructor (`Create(overrides?)`).
   - `<Name>.spec.lua`: BDD TestEZ test suite.
3. **Execute Verification**: Run tests using the **RDK** runner:
   ```powershell
   rdk test src/shared/Domain/Component/<ComponentName>
   ```

## 💡 Examples
```lua
-- Pure state mutation example in HealthDomain.lua
function HealthDomain.ApplyDamage(state: HealthState, amount: number): HealthState
    local nextState = table.clone(state)
    nextState.CurrentHealth = math.clamp(nextState.CurrentHealth - amount, 0, nextState.MaxHealth)
    nextState.IsDead = nextState.CurrentHealth <= 0
    return nextState
end
```
