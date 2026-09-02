# 📜 Game Design Document (GDD) Dynamic Manager (`game-design-document`)

## 🎯 What is this Skill for?
This skill is used to author, audit, evolve, and maintain living **Game Design Documents (GDD)**. It continuously monitors user prompts and codebase changes, detects design drift or outdated sections, and interactively proposes structured GDD synchronization updates.

## 📖 Usage Guide
1. **Triggering the Skill**:
   - **Missing GDD Detection**: If no GDD exists in the project workspace, the agent proactively offers to scaffold a complete `GDD_<GameTitle>.md` based on your initial concept prompts.
   - **Explicit Request**: *"Create GDD for [game concept]"* or *"Audit GDD relevance against codebase"*.
   - **Dynamic Prompt Tracking**: Whenever major mechanics, balancing changes, or new units are discussed, the agent audits GDD relevance.
2. **Relevance Audit Workflow**:
   - The agent compares `GDD_<GameTitle>.md` against current user conversation intent and active domain definitions (`src/shared/Domain/`).
   - If discrepancies are found, the agent presents a **Drift Audit Report** and asks if you want the GDD updated.
   - Upon confirmation, surgical updates are applied to the GDD with version changelog tracking.

## 💡 Examples
```markdown
### 🔍 GDD Drift Audit Report Example:
- **Unit: Main Battle Tank**: GDD lists HP as `600`, but codebase (`MainBattleTank.lua`) uses `750`.
- **Supply Economy**: GDD lists BaseRegen as `3.0s`, but codebase (`SupplyConfig.lua`) uses `2.5s`.
- **Recommendation**: Update Section 7.3 and Section 8.1 in GDD_Frontline_Command.md to v1.2.
```
