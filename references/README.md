# Documentation Index

**Last Updated:** December 20, 2025

This folder contains reference materials for the Vanessa Meal Planner project.

---

## 📋 Current Documentation

### Primary Specifications

**1. Main Product Requirements Document**
- **File:** `/.taskmaster/docs/prd.txt`
- **Purpose:** Living specification matching actual implementation
- **Scope:** Slices 1-4 planning, Slices 1-2 complete documentation
- **Status:** ✅ Up to date
- **Use For:** Architecture decisions, data models, API specs, patterns

**2. Current Implementation Reference**
- **File:** `CURRENT-IMPLEMENTATION.md`
- **Purpose:** Quick reference for implemented features
- **Scope:** Slices 1 & 2 only
- **Status:** ✅ Up to date
- **Use For:** Quick lookups, onboarding new developers

**3. Project README**
- **File:** `/README.md`
- **Purpose:** Project overview and getting started guide
- **Status:** ✅ Up to date
- **Use For:** Setup, deployment, high-level features

---

## 📚 Reference Materials

These documents provide context and reference data but are not implementation specifications.

### Shopping Reference
- **File:** `coles-caulfield-aisle-map.md`
- **Purpose:** Aisle organization at Coles Caulfield
- **Status:** Reference material (not implementation spec)
- **Use For:** Understanding shopping list organization and aisle mapping

### Dietary Reference
- **File:** `diet-compass-meal-plan.md`
- **Purpose:** Diet Compass principles and food classifications
- **Status:** Reference material (not implementation spec)
- **Use For:** Understanding dietary preferences and meal planning principles

---

## 🗄️ Archived Documentation

Outdated specifications from earlier planning phases before the vertical slice approach.

**Location:** `archive/`

**Why Archived:**
- Described complex architecture before any code was written
- Used different data models than actual implementation
- Listed issues that were resolved or didn't apply to simpler approach
- Pre-dated vertical slice methodology

**Key Archived Files:**
- `phase1-vanessa-specification-v5.2.md` - Original detailed spec (6800+ lines)
- `vanessa-implementation-issues-v5.2.md` - Issues list from old spec

**See:** `archive/README.md` for complete explanation

---

## 🎯 How to Find What You Need

### For Implementation Work
→ Read `/.taskmaster/docs/prd.txt` (main spec)

### For Quick Reference
→ Read `CURRENT-IMPLEMENTATION.md`

### For Project Setup
→ Read `/README.md`

### For Shopping Context
→ Read `coles-caulfield-aisle-map.md`

### For Dietary Context
→ Read `diet-compass-meal-plan.md`

### For Historical Context
→ Check `archive/` folder

---

## ✅ Documentation Status

| Document | Status | Last Updated | Purpose |
|----------|--------|--------------|---------|
| `/.taskmaster/docs/prd.txt` | ✅ Current | Dec 20, 2025 | Main specification |
| `/README.md` | ✅ Current | Dec 20, 2025 | Project overview |
| `CURRENT-IMPLEMENTATION.md` | ✅ Current | Dec 20, 2025 | Quick reference |
| `coles-caulfield-aisle-map.md` | 📘 Reference | Dec 2024 | Shopping reference |
| `diet-compass-meal-plan.md` | 📘 Reference | Dec 2025 | Dietary reference |
| `archive/*` | 🗄️ Archived | Dec 19, 2025 | Historical only |

---

## 🔄 Update Protocol

When making changes to the implementation:

1. **Always update:** `/.taskmaster/docs/prd.txt`
2. **Update if major changes:** `/README.md`
3. **Update if architecture changes:** `CURRENT-IMPLEMENTATION.md`
4. **Never update:** Archived documents (they're historical snapshots)
5. **Rarely update:** Reference materials (only if external data changes)

---

**Remember:** The PRD is the single source of truth for implementation decisions.





