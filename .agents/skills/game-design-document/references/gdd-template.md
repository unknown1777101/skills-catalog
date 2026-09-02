# 📋 Standard Game Design Document (GDD) Template

Use this modular structure when scaffolding a new Game Design Document or doing deep structural audits:

```markdown
# 🎖️ [Game Title] — Game Design Document (GDD)
**Document Version**: 1.0.0  
**Last Updated**: YYYY-MM-DD  
**Status**: Living Design Document / Production Blueprint  

---

## 1. Executive Summary & Vision
- **Elevator Pitch**: 1-2 sentence core concept summary.
- **Genre & Subgenre**: Primary mechanics classification.
- **Target Audience & Platform**: Target demographic, hardware, and input methods.
- **Unique Selling Points (USP)**: 3-5 core differentiators.
- **Pillars of Design**: 3 foundational tenets guiding all game decisions.

---

## 2. Core Game Loop & Player Progression
- **Minute-to-Minute Loop**: Micro gameplay loop (spawn, counter, attack, defend).
- **Session Loop**: Match progression (5-8 minute session from early to late/overtime).
- **Meta-Progression Loop**: Long-term retention (deck building, cards collection, ranks, battle pass).
- **Flowchart**: Mermaid diagram visualizing loop transitions.

---

## 3. Gameplay Mechanics & Rules
- **Match Structure**: Match duration, lane layout, starting conditions, base health.
- **Economy System**: Resource generation, starting supply, capacity caps, overtime acceleration.
- **Combat Resolution**: Damage vs armor matrix, flat armor reduction, armor penetration, area splash falloff.
- **Targeting & Aggro**: Acquisition range, priority scoring weights (retaliation, class preference, proximity, low HP).

---

## 4. Entity & Roster Catalogs (Data-Driven Blueprints)
- Detailed specification tables for all playable units, structures, spells, and cards.
- Stats: Class, Cost, SpawnCount, MaxHealth, ArmorClass, FlatArmor, Speed, AttackRange, Damage, AttackInterval, AttackPattern.

---

## 5. Map & Level Architecture
- Lane dimensions (length, width, deployment zones).
- Base structure placement, lane obstacles, forward capture points.
- Camera perspective, viewport bounds, and zoom constraints.

---

## 6. UI / UX Design & Wireframes
- Match HUD layout (Base HP bars, Supply meter, Deck deployment slot bar, Overtime alerts).
- Out-of-Match Menus (Deck builder, Catalog roster, Settings).
- Responsive mobile & PC input layouts (Touch, Mouse, Keyboard shortcuts).

---

## 7. Art, Audio & Thematic Direction
- Visual aesthetic (e.g. Toy military plastic vs hyper-realistic).
- VFX style (hit markers, muzzle flash, blast debris).
- SFX & Audio landscape (ambient battle audio, weapon sounds, UI feedback chimes).

---

## 8. Technical Architecture & Clean Code Compliance
- 5-Layer Clean Architecture mapping.
- Network replication strategy (Knit Signals vs ProfileStore).
- Client-Side Prediction (CSP) for latency-free controls.
- Memory lifecycle cleanup with Trove.

---

## 9. Monetization & LiveOps Strategy
- Free-to-Play balance philosophy (Zero Pay-to-Win).
- Cosmetic items, Battle Pass, Deck slot unlocks, Emotes.

---

## 10. Document Revision History & Changelog
- Chronological table of document versions, modified sections, rationale, and author.
```
