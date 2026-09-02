# Contract Interface Rules & Design Guidelines

## 1. The Interface Segregation Principle (ISP) in Luau
Clients should not be forced to depend on methods they do not use. In Luau, where interfaces are defined via typed tables, contracts should be compact, cohesive, and focused on specific caller interactions.

---

## 2. Naming Conventions & Anatomy
- **File Naming**: Place contracts in `<FeatureName>Types.lua` (e.g. `LaneWorldTypes.lua`, `BattleHUDTypes.lua`, `DataStoreTypes.lua`).
- **Interface Naming**: Prefix contract types with `I` (e.g. `export type ILaneWorldPresenter = { ... }`, `export type IDataStoreAdapter = { ... }`).
- **Method Signatures**: Explicitly annotate `self: any` or `self: IContractName`, parameter types, and return types `-> ()` or `-> Result<T>`.

### Example Presenter Contract
```lua
--!strict
--- @module LaneWorldTypes
--- @brief Contract interface and event types for the 3D battlefield visual presentation layer.

export type UnitSnapshot = {
    Id: string,
    DefinitionId: string,
    DisplayName: string,
    Team: string,
    PositionX: number,
    CurrentHealth: number,
    MaxHealth: number,
    IsMoving: boolean,
    IsDead: boolean,
}

export type CombatEffectEvent = {
    AttackerId: string,
    AttackerPositionX: number,
    TargetId: string,
    TargetPositionX: number,
    AttackPattern: string,
    DamageType: string,
    FinalDamage: number,
    IsImmune: boolean,
    MatrixMultiplier: number,
    IsStructure: boolean,
}

--- Authoritative Presenter contract interface for 3D battlefield visualization.
export type ILaneWorldPresenter = {
    RenderSnapshot: (self: any, units: { UnitSnapshot }) -> (),
    PlayCombatEffect: (self: any, event: CombatEffectEvent) -> (),
    Destroy: (self: any) -> (),
}

return nil
```

---

## 3. Best Practices
1. **Return `nil` from Pure Type Files**: A Contract module that only defines types should return `nil` so it has zero runtime overhead.
2. **Document Preconditions & Postconditions**: Use RDK/Moonwave docstrings (`--- @brief`, `--- @param`, `--- @return`) explaining what each method expects and accomplishes.
3. **Immutability of Data DTOs**: DTOs passed through contracts (like snapshots or events) should be read-only data tables.
