---
name: game-design-document
category: Game Design
description: Creates, audits, dynamically updates, and validates Game Design Documents (GDD) by learning from user prompts, tracking codebase drift, and proposing relevance syncs. DO NOT trigger for general code writing or bug fixing.
---

# 📜 Game Design Document (GDD) Dynamic Manager

## 🎯 Purpose & Scope
This skill provides deterministic procedures for creating, auditing, evolving, and dynamically maintaining living **Game Design Documents (GDD)**. It continuously analyzes user conversation prompts, tracks design intent shifts, audits alignment between the GDD and active game code, detects outdated/irrelevant sections, and interactively offers structured GDD updates to keep documentation 100% relevant throughout development.

## 📌 When to Use
- Detecting missing GDD in a game project and proactively offering to generate one.
- Creating a comprehensive, industry-standard `GDD_<GameTitle>.md` from initial brainstorming or user prompts.
- Updating an existing GDD dynamically when new mechanics, balancing numbers, unit rosters, or economy rules are discussed.
- Auditing GDD relevance against active codebase implementations (e.g. Domain configs, unit definitions).
- Proactively detecting design drift and offering the user structured reconciliation diffs.

## 🛑 When Not to Use
- **DO NOT** trigger for writing application Luau/C# code or debugging game errors (use specific coding skills).
- **DO NOT** use for generating Git commit messages (use `git`).
- **DO NOT** use for non-game technical documentation (e.g. API specs, infra deploy scripts).

## 📥 Inputs
- **Required**: Game concept description, user prompts/instructions, or path to existing GDD file (e.g. `GDD_Frontline_Command.md`).
- **Optional**: Active codebase paths for cross-referencing implementation drift (`src/shared/Domain/`).

## 📋 Workflow
1. **Inspect**:
   - Check if an existing GDD file exists in the workspace root or docs folder (e.g. `GDD_*.md`).
   - Extract design decisions, unit stats, mechanics, economy numbers, and constraints from recent user prompts.
2. **Decide (Lifecycle Route)**:
   - **Route A (Missing GDD - Proactive Offer)**: If no GDD exists → Proactively offer to the user: *"No Game Design Document (GDD) found for this project. Would you like me to create a comprehensive GDD_<GameTitle>.md based on your game concept?"*.
   - **Route B (Relevance Audit)**: If a GDD exists → Cross-reference GDD content against recent prompts and the active codebase (`src/shared/Domain/`).
   - **Route C (Prompt Drift Detected)**: If GDD contradicts recent user prompts or code → Flag discrepancies and formulate an update proposal.
3. **Execute**:
   - **If Creating New GDD (Upon Approval)**: Author a complete GDD containing Executive Summary, Core Loop, Mechanics, Unit/Item Catalogs, Economy, Technical Architecture, and UI/UX flows using `references/gdd-template.md`.
   - **If Updating GDD**:
     1. Present a clear **GDD Drift Audit Report** highlighting outdated vs new values.
     2. Offer the user: *"Discrepancies detected between GDD and current design/codebase. Would you like to update the GDD?"*.
     3. Upon user confirmation, apply surgical updates to the GDD file while preserving unchanged sections.
4. **Validate**:
   - Verify that all game numbers (damage, HP, supply, cooldowns, timers) in the GDD match active Domain configs and definitions.
   - Ensure the GDD remains free of placeholder text, ambiguous vague statements, or circular contradictions.
5. **Report**:
   - Summarize updated GDD sections, version bump (e.g. v1.1 → v1.2), and confirmed alignment.

## 🔀 Decision Rules
- If no GDD exists in the workspace when game concepts, units, or mechanics are discussed → AI **MUST** proactively offer to generate a standard GDD document.
- If a user prompt introduces a new mechanic or alters stats (e.g. "change MBT HP from 750 to 800") → **DO NOT** silently overwrite the GDD; check relevance and ask the user if they want the GDD updated.
- If GDD stats contradict active code definitions in `src/shared/Domain/Catalog/` → Flag as **Implementation Drift** and offer to synchronize GDD to match code (or vice versa).
- If creating a new GDD → Follow the modular 10-section structure in `references/gdd-template.md`.
- All GDD files must be authored in clear, structured Markdown with tables, mermaid diagrams, and numbered balancing matrices.
- All comments, docstrings, and GDD headings **MUST** be written in **standard professional English**.

## 🔍 Verification Checklist
- [ ] Does the GDD reflect all current gameplay mechanics discussed in recent prompts?
- [ ] Are all balancing numbers (stats, costs, intervals) 100% aligned with active domain configs?
- [ ] Has the user explicitly approved any non-trivial GDD updates?
- [ ] Is the document structured with clear versioning, table of contents, and changelog?

## 📤 Output
- Living, up-to-date `GDD_<GameTitle>.md` in workspace.
- GDD Drift Audit Report detailing synced vs updated mechanics.

## 📚 References
- For standard document structure, refer to [references/gdd-template.md](references/gdd-template.md).
- For drift detection heuristics, refer to [references/relevance-audit-guide.md](references/relevance-audit-guide.md).

## 🔗 Related Skills
- **Related**: `roblox-knit-arch`, `roblox-domain-definition`, `roblox-domain-standalone`.
