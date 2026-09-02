# IoC Container & Dynamic Dependency Injection Patterns

## 1. Core Principles of Dynamic DI in Luau
In large-scale Clean Architecture projects, components should depend on abstractions (Contract Interfaces), not on concrete implementations. A lightweight Inversion of Control (IoC) Container acts as the central registry and resolution mechanism during application bootstrap.

### Benefits
1. **Decoupled Architecture**: Controllers and Services never require concrete Presenter or Adapter classes.
2. **Deterministic Test Mocking**: Test suites can inject mock implementations (`Container.RegisterInstance("ILogger", mockLogger)`) without touching production code.
3. **Platform Polymorphism**: Easily bind different presenters for Mobile, Desktop, Console, or VR during bootstrap.

---

## 2. Container API Contract
```lua
export type Factory<T> = (...any) -> T

export type IContainer = {
    Register: (contractName: string, factory: Factory<any>) -> (),
    RegisterInstance: (contractName: string, instance: any) -> (),
    Resolve: (contractName: string, ...any) -> any,
    Has: (contractName: string) -> boolean,
    Clear: () -> (),
}
```

---

## 3. Best Practices & Anti-Patterns

### ✅ Recommended Patterns
- **Bootstrap-Time Registration**: Always register all providers in `init.client.lua` or `init.server.lua` before calling `Knit.Start()`.
- **Lazy Instantiation via Factory**: Use `Container.Register(contractName, factory)` so instances are constructed on-demand with required runtime parameters.
- **Contract Naming Convention**: Use `"I<InterfaceName>"` as standard contract identifiers (e.g. `"ILaneWorldPresenter"`, `"IBattleHUDPresenter"`, `"IDataStoreAdapter"`).

### ❌ Anti-Patterns (Prohibited)
- **Direct Construction in Controllers**: Calling `ConcretePresenter.New()` inside a Controller defeats the purpose of Inversion of Control.
- **Circular Dependencies**: Do not create factory callbacks that resolve each other cyclically.
- **Service Locator Abuse**: Do not pass the `Container` itself around deep into Domain entities or components. Domain must remain 100% pure and unaware of the container.
