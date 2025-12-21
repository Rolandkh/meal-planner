# Current Implementation Reference

**Last Updated:** December 20, 2025  
**Version:** v0.8 (Slices 1 & 2 Complete)

---

## 📋 Main Specification Document

**The primary source of truth is:**

```
.taskmaster/docs/prd.txt
```

This document contains:
- Complete Slice 1 & 2 specifications (as built)
- Reality Check learnings from each slice
- Data models (actual implementation)
- API endpoint specifications
- Component patterns and conventions
- Slice 3 planning

---

## 🏗️ What We Built (Slices 1 & 2)

### Slice 1: Chat with Vanessa
**Status:** ✅ Complete

- `ChatWidget.js` - Collapsible chat interface (mobile + desktop)
- `POST /api/chat-with-vanessa` - SSE streaming endpoint
- Conversation persistence in localStorage
- Mobile-responsive design
- Error handling

**Key Files:**
- `/src/components/ChatWidget.js`
- `/api/chat-with-vanessa.js`
- `/src/utils/storage.js`

### Slice 2: Meal Plan Generation
**Status:** ✅ Complete

- `GenerationStatusPage.js` - Progress UI with SSE updates
- `MealPlanView.js` - Weekly meal display
- `ShoppingListView.js` - Aggregated shopping list
- `POST /api/generate-meal-plan` - Generation endpoint
- Data transformation and normalization
- Unit conversion system (70+ ingredients)
- Recipe deduplication

**Key Files:**
- `/src/components/GenerationStatusPage.js`
- `/src/components/MealPlanView.js`
- `/src/components/ShoppingListView.js`
- `/api/generate-meal-plan.js`
- `/src/utils/mealPlanTransformer.js`
- `/src/utils/unitConversions.js`

---

## 📊 Data Architecture (As Implemented)

### Storage Architecture

**Current (Slices 1-3): localStorage**
- Browser-based storage (5MB limit)
- ~20-30 weeks of meal plan capacity
- Offline-first, zero cost
- Single device only

**Future (Slice 4+): Firebase Firestore**
- Planned migration when usage metering added
- Multi-device sync
- Unlimited storage
- 1-2 days migration effort (storage abstraction layer)

### localStorage Keys (Slice 3 Standardized)
```javascript
'vanessa_chat_history'           // Chat messages
'vanessa_recipes'                // Recipe library
'vanessa_meals'                  // Meal instances
'vanessa_current_meal_plan'      // Active meal plan
'vanessa_eaters'                 // Household members (Slice 3)
'vanessa_base_specification'     // User profile (Slice 3)
'vanessa_debug_raw_output'       // Raw AI response
'vanessa_schema_version'         // Migration version tracker (Slice 3)
```

**Slice 3 Enhancements:**
- ✅ Storage quota monitoring (`getStorageQuota()`)
- ✅ Export all data to JSON (backup)
- ✅ Import from JSON (restore)
- ✅ Cleanup old data (delete old weeks)
- ✅ Warning banner at 80% capacity

### Core Entities
- **Recipe** - Unique recipe with ingredients, instructions, metadata
- **Meal** - Instance of a recipe on a specific date/mealType
- **MealPlan** - Collection of 21 meals for one week
- **Conversation** - Chat message history

See PRD for complete schemas.

---

## 🚦 Routes

| Route | Component | Status |
|-------|-----------|--------|
| `#/` | HomePage | ✅ |
| `#/generating` | GenerationStatusPage | ✅ |
| `#/meal-plan` | MealPlanView | ✅ |
| `#/shopping-list` | ShoppingListView | ✅ |

---

## 🔑 Environment Variables

### Required
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Setup

**Local Development:**
1. Create `.env.local` in project root
2. Add `ANTHROPIC_API_KEY=...`
3. Never commit this file!

**Vercel Deployment:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` for all environments
3. Redeploy

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

### Deployment
```bash
vercel --prod
```

---

## 📖 Architecture Patterns

### Component Pattern
```javascript
export class ComponentName {
  render() {
    const container = document.createElement('div');
    // Build UI...
    return container;
  }
  
  afterRender() {
    // Called after render (for async operations)
  }
  
  beforeUnload() {
    // Cleanup before unmount
  }
}
```

### Storage Pattern
```javascript
// Always return data or default (never throw)
export function loadData() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Load error:', error);
    return []; // Safe default
  }
}

// Always return result object
export function saveData(data) {
  return safeSave(KEY, data); // { success: true/false, error?: string }
}
```

### SSE Streaming Pattern
See implemented examples in:
- `/api/chat-with-vanessa.js` (server)
- `/src/components/ChatWidget.js` (client)
- `/api/generate-meal-plan.js` (server)
- `/src/components/GenerationStatusPage.js` (client)

---

## 📚 Documentation Files

### Active Documents
- `/.taskmaster/docs/prd.txt` - **MAIN SPEC** (Slices 1-4 planning + learnings)
- `/README.md` - This file (project overview)
- `/references/CURRENT-IMPLEMENTATION.md` - This file (quick reference)
- `/references/coles-caulfield-aisle-map.md` - Shopping reference
- `/references/diet-compass-meal-plan.md` - Dietary reference

### Archived Documents
- `/references/archive/phase1-vanessa-specification-v5.2.md` - Old detailed spec (pre-vertical-slice)
- `/references/archive/vanessa-implementation-issues-v5.2.md` - Old issues list (mostly resolved)
- `/references/archive/*.md` - Other historical documents

---

## 🎯 Next Steps (Slice 3)

See PRD for Slice 3 planning:
1. Eater management (household members)
2. Preference settings
3. Recipe library browsing
4. Recipe detail view with ratings
5. Standardize storage keys (`vanessa_` prefix)

---

## 🐛 Known Issues

None currently blocking. See GitHub issues or PRD for enhancement ideas.

---

## 💡 Key Learnings from Slices 1 & 2

1. **SSE streaming provides excellent UX** for long operations
2. **Recipe deduplication works perfectly** with hash-based approach
3. **localStorage is sufficient** for Phase 1 (no backend needed yet)
4. **Unit conversion system is complex** but essential for shopping lists
5. **Chat context integration** eliminates need for separate preference forms
6. **Component lifecycle hooks** provide clean async operation handling

See PRD "Reality Check" section for complete learnings.

---

## 📞 Support

For questions or issues:
1. Check the PRD at `.taskmaster/docs/prd.txt`
2. Review implementation in relevant component files
3. Check console logs for debugging info
4. Export raw AI output using the debug button

---

**Remember:** The PRD is the living specification. Always refer to it for the latest architecture, patterns, and decisions.

