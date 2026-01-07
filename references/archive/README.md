# Archive - Historical Documentation

This folder contains outdated specifications and documents from earlier phases of the project.

## Why These Are Archived

During development, we shifted from a complex, fully-specified architecture to an iterative **vertical slice approach**. The documents here describe what was originally planned, but not what was actually built.

## Archived Files

### phase1-vanessa-specification-v5.2.md
- **Date:** December 19, 2025
- **Status:** Superseded
- **Why Archived:** Described a complex normalized data model with full features (onboarding, eaters, profile management, recipe library, usage metering, pantry system, etc.) before any code was written
- **What Changed:** We adopted vertical slices, building Slice 1 (chat) and Slice 2 (generation) first, then documenting what was actually built
- **Replaced By:** `/.taskmaster/docs/prd.txt` (living specification matching actual implementation)

### vanessa-implementation-issues-v5.2.md
- **Date:** December 19, 2025
- **Status:** Resolved/Outdated
- **Why Archived:** Listed 15 implementation issues from the v5.2 spec, most of which don't apply to the simpler Slice 1 & 2 implementation
- **Resolution:** Issues either resolved during implementation or not applicable to current architecture

### Other Archived Files
- `DEPLOYMENT.md` - Old deployment guide (see main README.md instead)
- `diet-compass-app.html` - Original single-file prototype
- `ENVIRONMENT_SETUP.md` - Old environment setup (see main README.md instead)
- `generation-status-ui-spec.md` - Early UI mockup (implemented differently)
- `meal-planner-app-spec_v1.md` - Original specification (pre-Vanessa)

## Current Documentation

**For up-to-date specifications, see:**
1. `/.taskmaster/docs/prd.txt` - **MAIN SPECIFICATION**
2. `/README.md` - Project overview and quick start
3. `/references/CURRENT-IMPLEMENTATION.md` - Architecture reference

## Historical Context

These documents are valuable for understanding:
- The evolution of the project's thinking
- Features considered but deferred (pantry system, onboarding flow, etc.)
- Lessons learned about over-specification before implementation
- The shift to vertical slice methodology

They're kept for reference but should **not** be used as implementation guides.

---

**Last Updated:** December 20, 2025







