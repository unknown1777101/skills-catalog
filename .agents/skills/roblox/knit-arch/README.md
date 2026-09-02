# 🏛️ Roblox Knit Clean Architecture Skill (`roblox-knit-arch`)

## 🎯 What is this Skill for?
This skill governs the end-to-end implementation of the **5-Layer Clean Architecture** in Roblox using Knit, enforcing strict boundaries, 4 Domain subcategories (`Component/`, `Entity/`, `Standalone/`, `Catalog/`), and mandatory BDD unit testing with **RDK (`rdk test`)**.

## 📖 Usage Guide
1. **Model Domain Layer (`src/shared/Domain/`)**:
   - `Component/`: Reusable behavior traits (`Health`, `Movement`).
   - `Entity/`: Composite physical objects (`Unit`, `Base`).
   - `Standalone/`: Global rules/math (`Supply`, `Combat`, `Targeting`).
   - `Catalog/`: Blueprints & `Definitions/` folder (`UnitCatalog`).
2. **Implement Application UseCases (`src/shared/Application/`)**:
   - Write `*UseCase.lua` modules returning `Result<T>`.
3. **Build Knit Services & Controllers (`src/server/` & `src/client/`)**:
   - Server Services as thin data providers.
   - Client Controllers as coordinators.
4. **Build Presentation Views & Presenters (`src/client/Presentation/`)**:
   - Model-View-Presenter (MVP) with `Trove` cleanup and responsive `UIScale`.
5. **Run Verification**:
   ```powershell
   rdk test
   ```

## 💡 Examples
```lua
-- Standard UseCase Result Contract
export type Result<T> = {
    Success: boolean,
    Data: T?,
    Error: string?,
}
```
