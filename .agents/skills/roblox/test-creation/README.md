# 🧪 Roblox Domain Test Creation Skill (`roblox-test-creation`)

## 🎯 What is this Skill for?
This skill is used to design, organize, and execute automated **BDD Unit Tests** in the **Domain Layer** using **TestEZ** syntax and verified via the **Roblox Development Kit (`rdk test`)** runner.

## 📖 Usage Guide
1. **Create Spec File**: Place `<DomainName>.spec.lua` directly inside the target domain's folder.
2. **Author BDD Blocks**: Use `describe`, `it`, and `expect` to verify factories, validation rules, immutable mutations, and `deltaTime` injection.
3. **Execute Verification**:
   ```powershell
   # Run all spec tests in workspace
   rdk test

   # Run tests targeting a specific domain
   rdk test src/shared/Domain/<DomainName>
   ```

## 💡 Examples
```lua
describe("Supply Domain", function()
    it("should mutate state immutably", function()
        local original = SupplyFactory.Create({ CurrentSupply = 5 })
        local nextState = SupplyDomain.Spend(original, 2)
        expect(original.CurrentSupply).to.equal(5) -- Original untouched
        expect(nextState.CurrentSupply).to.equal(3) -- New state updated
    end)
end)
```
