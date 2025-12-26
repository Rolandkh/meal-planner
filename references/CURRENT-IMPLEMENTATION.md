# Current Implementation Reference

**Last Updated:** December 26, 2025  
**Version:** v0.9 (Slices 1, 2 & 3 Complete)

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

## 🏗️ What We Built (Slices 1, 2 & 3)

### Slice 1: Chat with Vanessa
**Status:** ✅ Complete

- `ChatWidget.js` - Collapsible chat interface (mobile + desktop)
- `POST /api/chat-with-vanessa` - SSE streaming endpoint with onboarding support
- Conversation persistence in localStorage
- AI-powered onboarding flow (5 questions)
- Mobile-responsive design
- Error handling
- Voice-activated generation ("plan my week" triggers generation)

**Key Files:**
- `/src/components/ChatWidget.js`
- `/api/chat-with-vanessa.js`
- `/src/utils/storage.js`

### Slice 2: Meal Plan Generation
**Status:** ✅ Complete

- `GenerationStatusPage.js` - Progress UI with SSE updates
- `MealPlanView.js` - Weekly meal display with household schedule grid
- `ShoppingListView.js` - Aggregated shopping list
- `POST /api/generate-meal-plan` - Generation endpoint with schedule support
- Data transformation and normalization
- Unit conversion system (70+ ingredients)
- Recipe deduplication
- Structured schedule extraction for accurate servings

**Key Files:**
- `/src/components/GenerationStatusPage.js`
- `/src/components/MealPlanView.js`
- `/src/components/ShoppingListView.js`
- `/api/generate-meal-plan.js`
- `/src/utils/mealPlanTransformer.js`
- `/src/utils/unitConversions.js`

### Slice 3: Recipe Library & Onboarding
**Status:** ✅ Complete

**Eater Management:**
- Household member profiles (name, preferences, allergies, schedule)
- CRUD operations for eaters
- Default eater management
- AI-powered extraction from onboarding conversation

**Settings Page (4 Sections):**
- Storage Management: Quota monitoring, export/import, cleanup
- Household Members: Full eater management with modal forms
- Meal Planning: Budget, shopping day, max ingredients, dietary goals
- Chat Preferences: Personality, style, reset onboarding

**Recipe Features:**
- Recipe library with search and filtering
- Recipe detail pages with ratings and favorites
- Usage tracking (times cooked, last cooked)
- "Mark as Cooked" functionality

**Onboarding System:**
- AI-powered 5-question conversation
- Automatic household member extraction
- Weekly schedule extraction and structuring
- Natural language confirmation with auto-generation

**Navigation:**
- Global navigation bar with mobile hamburger menu
- Active link highlighting
- Parameterized routes support (`/recipe/:id`)

**Data Migration:**
- Schema version tracking
- Automatic migration system
- Backward compatibility

**Key Files:**
- `/src/components/SettingsPage.js` (1,200+ lines)
- `/src/components/RecipeLibraryPage.js`
- `/src/components/RecipeDetailPage.js`
- `/src/components/Navigation.js`
- `/src/utils/storage.js` (enhanced with eater utilities)
- `/src/utils/router.js` (parameterized routes)
- `/src/utils/migrationManager.js`
- `/src/migrations/index.js`

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
'vanessa_recipes'                // Recipe library with ratings/favorites
'vanessa_meals'                  // Meal instances with eaterIds
'vanessa_current_meal_plan'      // Active meal plan
'vanessa_eaters'                 // Household members
'vanessa_base_specification'     // User profile + weeklySchedule
'vanessa_debug_raw_output'       // Raw AI response
'vanessa_schema_version'         // Migration version tracker
'vanessa_migration_slice3'       // Migration completion flag
```

**Slice 3 Storage Enhancements:**
- ✅ Storage quota monitoring (`getStorageQuota()`)
- ✅ Export all data to JSON (backup)
- ✅ Import from JSON (restore)
- ✅ Delete orphaned recipes (`deleteOrphanedRecipes()`)
- ✅ Warning banner at 60% (warning) and 80% (critical) capacity
- ✅ Safe save with quota exceeded handling

### Core Entities

**Recipe (Enhanced in Slice 3)**
```javascript
{
  recipeId: 'recipe_[uuid]',
  name: string,
  ingredients: [{name, quantity, unit, category}],
  instructions: string,
  prepTime: number,
  cookTime: number,
  servings: number,
  tags: string[],
  source: 'generated' | 'user' | 'imported',
  isFavorite: boolean,        // NEW: Slice 3
  rating: number | null,      // NEW: 1-5 stars
  timesCooked: number,        // NEW: Usage tracking
  lastCooked: string | null,  // NEW: ISO 8601
  createdAt: 'ISO 8601',
  updatedAt: 'ISO 8601'       // NEW: Slice 3
}
```

**Meal (Enhanced in Slice 3)**
```javascript
{
  mealId: 'meal_[uuid]',
  recipeId: 'recipe_[uuid]',
  mealType: 'breakfast' | 'lunch' | 'dinner',
  date: 'YYYY-MM-DD',
  eaterIds: ['eater_[uuid]'],  // NEW: Who's eating this meal
  servings: number,
  notes: string
}
```

**MealPlan**
```javascript
{
  _schemaVersion: 1,
  mealPlanId: 'plan_YYYYMMDD',
  weekOf: 'YYYY-MM-DD',
  weekEnd: 'YYYY-MM-DD',
  createdAt: 'ISO 8601',
  mealIds: ['meal_[uuid]'],
  budget: { target: number, estimated: number },
  weeklyPreferences: string,
  conversation: { messages: [] }
}
```

**Eater (NEW: Slice 3)**
```javascript
{
  eaterId: 'eater_[uuid]',
  name: string,
  preferences: string,
  allergies: string[],
  dietaryRestrictions: string[],
  schedule: string,
  isDefault: boolean,
  createdAt: 'ISO 8601',
  updatedAt: 'ISO 8601'
}
```

**BaseSpecification (NEW: Slice 3)**
```javascript
{
  _schemaVersion: 1,
  ownerEaterId: 'eater_[uuid]',
  weeklyBudget: number,
  shoppingDay: 0-6,  // 0=Sunday
  preferredStore: string,
  maxShoppingListItems: number,  // NEW: Dec 26
  householdEaterIds: ['eater_[uuid]'],
  dietaryGoals: string,
  onboardingComplete: boolean,
  weeklySchedule: {              // NEW: Structured schedule
    sunday: {
      breakfast: { servings, eaterIds, requirements },
      lunch: { servings, eaterIds, requirements },
      dinner: { servings, eaterIds, requirements }
    },
    // ... other days
  },
  chatPreferences: {
    personality: 'friendly' | 'professional' | 'casual',
    communicationStyle: 'concise' | 'detailed'
  },
  conversation: {
    startedAt: 'ISO 8601',
    messages: []
  },
  createdAt: 'ISO 8601',
  updatedAt: 'ISO 8601'
}
```

See PRD for complete schemas and relationships.

---

## 🚦 Routes

| Route | Component | Status |
|-------|-----------|--------|
| `#/` | HomePage | ✅ |
| `#/generating` | GenerationStatusPage | ✅ |
| `#/meal-plan` | MealPlanView | ✅ |
| `#/shopping-list` | ShoppingListView | ✅ |
| `#/recipes` | RecipeLibraryPage | ✅ Slice 3 |
| `#/recipe/:id` | RecipeDetailPage | ✅ Slice 3 (parameterized) |
| `#/settings` | SettingsPage | ✅ Slice 3 |

**Navigation:**
- Global nav bar: Home → Meal Plan → Recipes → Shopping → Settings
- Mobile hamburger menu (< 768px)
- Active link highlighting
- Sticky header

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

## 🎯 Next Steps (Slice 4)

See PRD for Slice 4 planning:
1. Add recipe flow (manual recipe creation)
2. Usage metering and limits
3. Offline mode support
4. Mobile app polish
5. Firebase migration (multi-device sync)

---

## ✨ Slice 3 Features in Detail

### AI-Powered Onboarding
**5-Question Conversation Flow:**
1. Dietary goals
2. Food preferences/restrictions
3. Household members
4. Weekly budget
5. Shopping day

**Smart Features:**
- Natural conversation (not a rigid form)
- AI paraphrases responses using "you" (not echoing with "I")
- Summary + next question in same message (smooth flow)
- Final comprehensive summary with confirmation
- Voice-activated generation ("plan my week" auto-triggers)
- Visual progress indicators (typing dots, progress messages)

**Automatic Extraction:**
- **Household Members:** AI extracts names, relationships, ages
  - Creates eater profiles automatically (Maya, Cathie, etc.)
  - Failsafe: Creates profiles even if AI parsing fails
- **Weekly Schedule:** AI extracts structured meal schedule
  - Maps who eats when (per day, per meal)
  - Calculates exact servings needed
  - Saves to baseSpecification.weeklySchedule

### Settings Page (4 Sections)

**1. Storage Management**
- Real-time quota monitoring with color-coded progress bar
- Export all data to JSON backup file
- Import data from backup
- Delete orphaned recipes
- Warning banners at 60% and 80% capacity

**2. Household Members**
- List all household members with dietary info
- Add/edit/delete with modal forms
- Default eater management (always exactly one default)
- Visual indicators for default eater
- Prevents deletion of only eater

**3. Meal Planning**
- Weekly budget (min: 0)
- Maximum shopping list items (15-100, default: 30)
- Shopping day dropdown (Sunday-Saturday)
- Preferred store (optional)
- Dietary goals textarea
- Auto-save with 300ms debounce
- Visual save confirmation

**4. Chat Preferences**
- Vanessa personality: Friendly, Professional, Casual
- Communication style: Concise, Detailed
- Reset onboarding button

### Recipe Library
- Browse all saved recipes
- Search by name, ingredients, or tags (300ms debounce)
- Filter tabs: All, Favorites, High-Rated (≥4 stars), Most Cooked (≥3 times)
- Recipe cards with emoji placeholders
- Sorting: Most cooked first, then alphabetical
- Empty states for each scenario
- Click card → Navigate to recipe detail

### Recipe Detail Page
- Hero image with emoji placeholder
- Interactive 5-star rating system
- Favorite toggle (❤️/🤍)
- Meta info: prep time, cook time, servings
- Ingredients grouped by category
- Step-by-step instructions
- Clickable tag chips
- Usage history: times cooked, last cooked
- "Mark as Cooked" button (increments counter)
- Back navigation to library

### Meal Plan View Enhancements
- **Household Schedule Grid:** Visual calendar showing who eats when
  - Color-coded dots per person
  - Shows attendance for each meal
  - Legend with household member names
  - Empty cells for skipped meals
- Positioned after header, before day cards
- Smart eaterIds assignment based on schedule

### Navigation System
- Sticky header navigation bar
- Links: Home → Meal Plan → Recipes → Shopping → Settings
- Active link highlighting (blue underline)
- Mobile hamburger menu (< 768px breakpoint)
- Parameterized route support (`/recipe/:id`)
- Browser back/forward support

### Data Migration System
- MigrationManager with version tracking
- Automatic schema updates on app load
- Migration v1 (Slice 3):
  - Renames keys to vanessa_ prefix
  - Creates default eater
  - Creates base specification
  - Updates recipe schema
- Error UI with retry button
- Idempotent migrations (safe to run multiple times)

---

## 🐛 Known Issues

**Current (Non-Blocking):**
- Tailwind CDN warning (cosmetic - can install PostCSS later)
- Chrome extension message errors (browser extension conflicts - harmless)

**Testing Blocked Until Jan 1, 2026:**
- Anthropic API quota exhausted
- All features built and ready to test when quota resets

---

## 💡 Key Learnings from Slices 1, 2 & 3

**Slice 1 & 2 Learnings:**
1. **SSE streaming provides excellent UX** for long operations
2. **Recipe deduplication works perfectly** with hash-based approach
3. **localStorage is sufficient** for Phase 1 (no backend needed yet)
4. **Unit conversion system is complex** but essential for shopping lists
5. **Chat context integration** eliminates need for separate preference forms
6. **Component lifecycle hooks** provide clean async operation handling

**Slice 3 Learnings:**
1. **Two-phase AI extraction is essential** for reliable data parsing
   - Phase 1: Extract structured schedule
   - Phase 2: Generate with explicit requirements
2. **Free-form conversation + structured output** is best UX
   - Natural onboarding conversation
   - AI extracts structured data automatically
3. **Visual feedback is critical** during long AI operations
   - Typing indicators prevent "is it broken?" moments
   - Progress messages show what's happening
4. **Date-to-day mapping is crucial** for schedule accuracy
   - Schedule uses day names (Sunday, Monday)
   - Generation uses dates (2025-12-29)
   - Must map explicitly in prompts
5. **Ingredient limits dramatically improve usability**
   - 46 items → overwhelming
   - 30 items → manageable
   - Constraint forces intelligent reuse
6. **Household schedule grid provides instant clarity**
   - Visual overview of complex schedules
   - Color-coded dots per person
   - Eliminates confusion about serving sizes

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

