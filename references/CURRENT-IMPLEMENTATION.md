# Current Implementation Reference

**Last Updated:** January 9, 2026  
**Version:** v1.1-alpha (Slice 5 Foundation Complete)  
**Status:** Slice 4 complete, Slice 5 60% complete (24/40 tasks), API integration tested

---

## 🆕 Recent Updates (January 9, 2026)

### Slice 5: Recipe Catalog & Diet Profile Integration

**Task 70 Complete: API Integration** ✅
- **Server-side catalog filtering:** Filters 607-recipe catalog by diet profiles, exclusions, preferences
- **Enhanced Claude prompts:** Includes household diet context, catalog availability, personalization
- **Multi-profile support:** API handles households with different diet profiles (keto + vegan, etc.)
- **Catalog matching:** 5-15% of recipes matched to catalog (improving with better names)

**Foundation Complete:**
- ✅ Recipe catalog system (607 Spoonacular recipes)
- ✅ Diet Compass scoring engine (4 health metrics)
- ✅ Diet profile definitions (10 profiles: Mediterranean, Keto, Vegan, etc.)
- ✅ Ingredient health database (200+ ingredients)
- ✅ Data schema migration to Slice 5
- ✅ Catalog storage and loading utilities

**Bugs Fixed:**
- Fixed catalog recipe hash mismatch causing missing meals
- Fixed catalog recipes not being persisted to localStorage
- Increased Claude max_tokens (8192 → 12288) to prevent 6-day truncation

**Impact:** Meal plans now leverage professional recipe catalog with health scores and can respect personalized diet preferences

---

## 🆕 Previous Updates (January 8, 2026)

### UI Polish & Summary Feature
- **Button Styling:** Refined with 12px border-radius and lighter gradient
- **Meal Plan Summary:** Added `summary` field to data model (replaces numerical stats)
- **Summary Display:** Shows on HomePage, History, and Meal Plan View
- **Budget Relocation:** Moved to Shopping List for better context
- **CSS Fix:** Custom gradient styles now properly loaded in index.html

---

## 🔧 Slice 5: API Enhancements (Task 70)

### Generate Meal Plan API (`/api/generate-meal-plan`)

**New Capabilities:**
1. **Diet Profile Integration**
   - Accepts `eaters` with `dietProfile`, `excludeIngredients`, `preferIngredients`
   - Server-side filtering by profile compatibility
   - Multi-profile household support

2. **Recipe Catalog Integration**
   - Accepts `catalogSlice` (pre-filtered recipes)
   - Matches Claude output to catalog recipes
   - Catalog recipes persist to localStorage
   - 5-15% catalog usage (improving)

3. **Enhanced Prompts**
   - Rich dietary context (profiles, exclusions, preferences)
   - Catalog awareness (count, benefits, examples)
   - Meal prep settings (future expansion ready)

**Request Format (Enhanced):**
```javascript
{
  eaters: [
    {
      name: "Mom",
      dietProfile: "mediterranean",        // NEW
      excludeIngredients: ["eggplant"],   // NEW
      preferIngredients: ["salmon"],      // NEW
      personalPreferences: "..."          // NEW
    }
  ],
  baseSpecification: { ... },             // Enhanced
  catalogSlice: [ ... ],                  // NEW
  chatHistory: [ ... ],                   // Existing
  regenerateDay: "monday",                // Existing (Slice 4)
  dateForDay: "2026-01-13",              // Existing (Slice 4)
  existingMeals: [ ... ]                  // Existing (Slice 4)
}
```

**Server-Side Processing:**
```javascript
// New filtering pipeline
catalogSlice (607 recipes)
  → filter by diet profiles
  → filter by excluded ingredients
  → prioritize by preferred ingredients
  → filter by meal type
  ↓
filteredCatalog (200-400 recipes)
  → pass to Claude prompt
  → Claude generates with awareness
  → transformer matches output to catalog
  ↓
Final: ~5-15% catalog recipes + ~85-95% AI-generated
```

**Key Functions:**
- `getCandidateCatalogRecipes(catalog, eaters, mealType)` - server-side filtering
- `matchCatalogRecipe(recipeName, catalog)` - fuzzy name matching
- Enhanced `buildUserPrompt()` - diet context inclusion

**Files Modified:**
- `api/generate-meal-plan.js` - API handler and prompts
- `src/utils/mealPlanTransformer.js` - catalog matching and persistence

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

## 🏗️ What We Built (Slices 1, 2, 3 & 4)

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
- `DayView.js` - Single day view with all meals for that day (NEW: Dec 26)
- `ShoppingListView.js` - Aggregated shopping list
- `POST /api/generate-meal-plan` - Generation endpoint with schedule support
- Data transformation and normalization
- Unit conversion system (70+ ingredients)
- Recipe deduplication
- Structured schedule extraction for accurate servings
- Day-of-week navigation buttons on home page (NEW: Dec 26)

**Key Files:**
- `/src/components/GenerationStatusPage.js`
- `/src/components/MealPlanView.js`
- `/src/components/DayView.js` (NEW: Dec 26)
- `/src/components/ShoppingListView.js`
- `/api/generate-meal-plan.js`
- `/src/utils/mealPlanTransformer.js`
- `/src/utils/unitConversions.js`

### Slice 3: Recipe Library & Onboarding
**Status:** ✅ Complete (December 26, 2025)

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
- Parameterized routes support (`/recipe/:id`, `/day/:day`)
- Day-of-week quick access buttons (7 buttons on home page)

**Data Migration:**
- Schema version tracking
- Automatic migration system
- Backward compatibility

**Development Tools (NEW: Dec 26):**
- Dev preset import feature (bypass onboarding for testing)
- Pre-configured household data (Roland, Maya, Cathie)
- Sample meal plan with 5 recipes and 21 meals
- One-click import button on home page

**Key Files:**
- `/src/components/SettingsPage.js` (1,200+ lines)
- `/src/components/RecipeLibraryPage.js`
- `/src/components/RecipeDetailPage.js`
- `/src/components/Navigation.js`
- `/src/utils/storage.js` (enhanced with eater utilities)
- `/src/utils/router.js` (parameterized routes)
- `/src/utils/migrationManager.js`
- `/src/migrations/index.js`
- `/src/utils/devPresets.js` (NEW: Dec 26)

### Slice 4: Recipe Management & History
**Status:** ✅ Code Complete (December 26, 2025) - Testing In Progress

**Recipe Editing:**
- Full edit form for existing recipes
- Dynamic ingredient rows (add/remove)
- Auto-save drafts every 30 seconds
- Form validation and error display
- BeforeUnload protection

**Single Day Regeneration:**
- Regenerate any single day (3 meals)
- Buttons in MealPlanView and DayView
- Confirmation modal with meal preview
- Recipe duplication avoidance
- Fast generation (~20-30 seconds)

**Meal Plan History:**
- Auto-archive on new plan generation
- Browse past meal plans
- Read-only historical views
- Configurable retention (1-12 weeks)
- Snapshot system (frozen data)

**Recipe Import:**
- Import from pasted text (blogs, emails, etc.)
- AI extraction with Claude
- Confidence scoring (0-100%)
- Preview/edit before save
- Character limits (50-5000 chars)

**Key Files:**
- `/api/extract-recipe.js` (NEW - 300 lines)
- `/src/components/RecipeEditPage.js` (NEW - 400 lines)
- `/src/components/MealPlanHistoryPage.js` (NEW - 200 lines)
- `/src/components/MealPlanHistoryDetailPage.js` (NEW - 250 lines)
- `/src/components/RecipeImportModal.js` (NEW - 400 lines)
- `/src/utils/regenerateDay.js` (NEW - 250 lines)
- `/src/utils/storage.js` (enhanced +330 lines)
- `/api/generate-meal-plan.js` (enhanced +80 lines)

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

### localStorage Keys (Slice 3 Standardized, Slice 4 Enhanced)
```javascript
'vanessa_chat_history'           // Chat messages
'vanessa_recipes'                // Recipe library with ratings/favorites
'vanessa_meals'                  // Meal instances with eaterIds
'vanessa_current_meal_plan'      // Active meal plan
'vanessa_meal_plan_history'      // Archived meal plans (NEW: Slice 4)
'vanessa_eaters'                 // Household members
'vanessa_base_specification'     // User profile + weeklySchedule + historyRetentionWeeks
'vanessa_debug_raw_output'       // Raw AI response
'vanessa_schema_version'         // Migration version tracker
'vanessa_migration_slice3'       // Migration completion flag
'recipe_draft_[recipeId]'        // Auto-save drafts (NEW: Slice 4, temporary)
```

**Slice 3 Storage Enhancements:**
- ✅ Storage quota monitoring (`getStorageQuota()`)
- ✅ Export all data to JSON (backup)
- ✅ Import from JSON (restore)
- ✅ Delete orphaned recipes (`deleteOrphanedRecipes()`)
- ✅ Warning banner at 60% (warning) and 80% (critical) capacity
- ✅ Safe save with quota exceeded handling

**Slice 4 Storage Enhancements:**
- ✅ Recipe update with ID preservation (`updateRecipe()`)
- ✅ Meal plan history storage (`loadMealPlanHistory()`, `saveMealPlanHistory()`)
- ✅ Auto-archive system (`saveNewMealPlan()` - replaces old `saveCurrentMealPlan` in generation)
- ✅ Snapshot creation (`createMealPlanSnapshot()` - frozen meals + recipes)
- ✅ History cleanup (`cleanupHistory()` - keeps last N weeks)
- ✅ Historical plan loading (`loadHistoricalPlan()`)
- ✅ History retention settings (`getHistoryRetentionWeeks()`)

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

**BaseSpecification (Slice 3, Enhanced in Slice 4)**
```javascript
{
  _schemaVersion: 1,
  ownerEaterId: 'eater_[uuid]',
  weeklyBudget: number,
  shoppingDay: 0-6,  // 0=Sunday
  preferredStore: string,
  maxShoppingListItems: number,  // Slice 3
  historyRetentionWeeks: number, // NEW: Slice 4 (default: 4)
  householdEaterIds: ['eater_[uuid]'],
  dietaryGoals: string,
  onboardingComplete: boolean,
  weeklySchedule: {              // Slice 3: Structured schedule
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

**Archived Meal Plan (NEW: Slice 4)**
```javascript
{
  // All MealPlan fields, plus:
  archivedAt: 'ISO 8601',        // When archived
  mealsSnapshot: Meal[],          // Frozen copy of meals
  recipesSnapshot: Recipe[]       // Frozen copy of recipes
}
```

See PRD for complete schemas and relationships.

---

## 🚦 Routes

| Route | Component | Status | Slice | Notes |
|-------|-----------|--------|-------|-------|
| `#/` | HomePage | ✅ | 1 | Includes day navigation buttons |
| `#/generating` | GenerationStatusPage | ✅ | 2 | SSE streaming progress, auto-archive |
| `#/meal-plan` | MealPlanView | ✅ | 2 | Full week view, regenerate buttons |
| `#/day/:day` | DayView | ✅ | 2 | Single day view, regenerate button |
| `#/shopping-list` | ShoppingListView | ✅ | 2 | Aggregated shopping list |
| `#/recipes` | RecipeLibraryPage | ✅ | 3 | Browse recipes, Add Recipe button |
| `#/recipe/:id` | RecipeDetailPage | ✅ | 3 | Recipe detail, Edit button |
| `#/recipe/:id/edit` | RecipeEditPage | ✅ | 4 | Edit recipe form (NEW) |
| `#/history` | MealPlanHistoryPage | ✅ | 4 | Browse past plans (NEW) |
| `#/history/:id` | MealPlanHistoryDetailPage | ✅ | 4 | View archived plan (NEW) |
| `#/settings` | SettingsPage | ✅ | 3 | Settings with history retention |

**Navigation:**
- Global nav bar: Home → Meal Plan → Recipes → Shopping → Settings
- Mobile hamburger menu (< 768px)
- Active link highlighting
- Sticky header
- **Day Navigation (NEW Dec 26):** 7 large buttons on home page for quick day access
  - Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
  - Same size as main action buttons
  - Disabled/grayed out for days not in current meal plan

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

## 🎯 Next Steps

### Immediate (Testing Phase)
1. **Manual API Testing** - Test all AI-powered features
   - Recipe import from text (various formats)
   - Single day regeneration (all 7 days)
   - Auto-archive system (generate multiple plans)
   - Recipe editing (edit and verify persistence)

2. **Bug Fixes** - Fix issues found during testing
   - Settings tab switching (known issue)
   - Recipe edit add ingredient re-render (known issue)
   - Any issues found during manual testing

3. **Polish** - Based on testing feedback
   - UI/UX improvements
   - Error message refinements
   - Performance optimizations

### Slice 5+ (Future Features)

See PRD for Slice 5+ planning:
1. **Recipe Management Pro**
   - Manual recipe creation (from scratch)
   - Recipe import from URL
   - Recipe duplication/copying
   - Recipe categories and advanced tagging

2. **Meal Prep Optimization System** (Spec complete in PRD)
   - Three strategies: Fresh Only, Batch Cooking, Hybrid
   - Prep day scheduling and component reuse
   - Time optimization for busy vs. light days
   - Enhanced recipe metadata for prep planning

3. **Firebase Migration & Sync**
   - Migrate from localStorage to Firestore
   - Multi-device sync
   - Usage metering (free tier: 4 generations/month)
   - Cloud backup

4. **Advanced Features**
   - Offline mode enhancements
   - Mobile app polish
   - Nutrition tracking
   - Meal plan templates

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

**Testing Status:**
- ✅ API quota increased - testing available now!
- ✅ All Slice 3 features built and ready to test
- ✅ All Slice 4 features built and ready to test

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

**Development Experience (Dec 26):**
1. **Dev presets dramatically speed up testing**
   - Onboarding takes 5+ minutes every test
   - Dev preset loads everything in 2 seconds
   - Essential for rapid feature iteration
2. **Day-specific views improve usability**
   - Full week view can be overwhelming
   - Single day view focuses on what's needed now
   - Quick navigation buttons provide easy access

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

