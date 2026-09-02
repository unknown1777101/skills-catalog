# 🔍 GDD Relevance & Drift Detection Guide

This guide establishes the heuristic audit process for continuously checking whether a Game Design Document (GDD) remains relevant against active codebase files and recent user conversation prompts.

---

## 🎯 4 Types of GDD Drift to Detect

### 1. Numerical & Balancing Drift
- **Symptom**: GDD specifies one number (e.g. `Supply Regen = 3.0s`, `MBT HP = 600`), while the codebase (`SupplyConfig.lua`, `MainBattleTank.lua`) implements another (`2.5s`, `750 HP`).
- **Detection Method**: Compare GDD tables directly against `*Config.lua` and `Definitions/*.lua`.

### 2. Feature & Mechanic Scope Drift
- **Symptom**: A new mechanic was discussed and built in recent turns (e.g., adding `MinimumRange` blindspot to Mortar, or adding 5-layer Clean Architecture), but the GDD has no section describing it.
- **Detection Method**: Scan recent conversation turns for approved mechanics and verify if they exist in GDD Section 3 & 4.

### 3. Removed / Deprecated Feature Drift
- **Symptom**: GDD describes features that the team/user explicitly discarded (e.g., magic spells, multi-lane branching, hero skills).
- **Detection Method**: Flag features in GDD that have zero corresponding domain modules or were superseded by newer decisions.

### 4. Architectural & Technical Drift
- **Symptom**: GDD mentions legacy framework tools (e.g. Lune, raw scripts) while the project has standardized on Knit 5-Layer and RDK (`rdk test`).
- **Detection Method**: Cross-reference GDD Technical Architecture against active project manifest (`default.project.json`, `wally.toml`, `.agents/skills/`).

---

## 📋 Interactive Update Proposal Procedure

Whenever drift is identified during a session:

1. **Do NOT silently modify the GDD**.
2. **Formulate a structured Drift Summary**:
   ```markdown
   ### ⚠️ GDD Relevance Discrepancy Detected
   - **Section 3.2 (Economy)**: GDD states Supply Regen is 3.0s, but active `SupplyConfig.lua` uses 2.5s.
   - **Section 4.1 (Unit Roster)**: 6 MVP Units are now fully implemented and tested in code, but GDD lists outdated alpha stats for Assault Squad.
   - **Recommendation**: Update `GDD_Frontline_Command.md` to Version 1.2 to reflect these active parameters.
   ```
3. **Ask the User for Permission**:
   *"Would you like me to update the GDD document now to synchronize it with our latest design and codebase?"*
4. **Apply Changes**: Upon user confirmation, apply surgical updates to the specific GDD sections and log the modification in Section 10 (Changelog).
