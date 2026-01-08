# Changelog

## [v1.0-rc2] - January 8, 2026 - UI Polish & Summary Feature

### 🎨 UI Improvements

#### Button Styling Updates
**Enhancement:** Modernized button appearance with softer corners and refined gradient.

**Changes:**
- **Border Radius:** Increased from 8px (`rounded-lg`) to 12px (`rounded-xl`)
  - Affects all primary, view, and secondary buttons
  - More modern, softer appearance
- **Gradient Color:** Lighter, more subtle gradient
  - Old: `rgba(134, 139, 152, 1) 39%, rgba(121, 125, 134, 0.59) 100%`
  - New: `rgba(156, 163, 175, 1) 52%, rgba(156, 163, 175, 0.32) 100%`
  - Lighter gray tones with more transparency

**Files Changed:**
- `src/components/HomePage.js` - Updated button classes
- `index.html` - Added `.btn-custom-gradient` styles

**Impact:** Cleaner, more professional button appearance across the app.

---

### ✨ New Feature: Meal Plan Summary

#### Concept Change
**Before:** Displayed numerical statistics (Total Meals, Unique Recipes, Budget)  
**After:** Display brief 5-6 word descriptive summary of the meal plan theme

**Rationale:**
- Numbers are data, summaries are meaning
- Total meals is always 21 (redundant)
- Unique recipes isn't actionable
- Summaries help users remember and differentiate meal plans
- Examples: "Mediterranean weight loss week", "Guest dinner week", "Vegan budget meals"

**Changes:**

1. **Data Structure**
   - Added `summary` field to meal plan object
   - Falls back to "Weekly meal plan" if not provided
   - Claude will generate contextual summaries during plan generation

2. **HomePage Summary Card**
   - Replaced 3-column stats grid with single centered summary
   - Large italic text (text-2xl md:text-3xl)
   - Shows meal plan theme at a glance

3. **History Cards**
   - Replaced Meals/Recipes/Budget grid with summary text
   - Cleaner card layout focused on what made that week special

4. **Full Meal Plan View**
   - Summary displayed below date range instead of stat badges
   - Streamlined header with personality

5. **Shopping List Enhancement**
   - **Moved budget display to Shopping List** (where it's most relevant)
   - Shows alongside item count: "$115 / $120 Budget  •  32 Items"
   - More contextual for actual shopping decisions

**Files Changed:**
- `src/utils/mealPlanTransformer.js` - Added summary field to data structure
- `src/utils/devPresets.js` - Added example summary
- `src/components/HomePage.js` - Summary card instead of stats
- `src/components/MealPlanView.js` - Summary display
- `src/components/MealPlanHistoryPage.js` - Summary in cards
- `src/components/ShoppingListView.js` - Budget + items display

**Impact:** 
- More personality and context in meal plan displays
- Budget information positioned where it's most useful
- Cleaner, less data-heavy interface
- Better storytelling about each meal plan

---

### 🐛 Bug Fix: CSS Loading

**Issue:** `.btn-custom-gradient` styles were not being applied.

**Root Cause:** `src/styles/main.css` was never imported into the application.

**Fix:** Added custom gradient styles directly to `index.html` inline styles section.

**Files Changed:**
- `index.html` - Added `.btn-custom-gradient` class definition

**Impact:** Button gradients now render correctly.

---

## [v1.0-rc1] - December 26, 2025 (Evening) - Bug Fixes

### 🐛 Bug Fixes

#### 1. Settings Meal Planning Tab Not Working
**Issue:** Clicking the "Meal Planning" tab in Settings did nothing, preventing access to budget/shopping/dietary settings.

**Root Cause:** Code called `this.createSelectGroup()` which didn't exist (line 587 in `SettingsPage.js`).

**Fix:** Changed to `this.createFormGroup()` which already handles select elements.

**Files Changed:**
- `src/components/SettingsPage.js` (line 587)

**Impact:** Settings → Meal Planning tab now fully functional.

---

#### 2. Meal Plan Generation 500 Error
**Issue:** Meal plan generation failed with "HTTP 500" error from `/api/generate-meal-plan`.

**Root Cause:** API code expected `requirements` field to be an array but it was a string in the baseSpecification:
```javascript
// Expected (array):
requirements: ['Quick', 'kid-friendly']

// Actual (string):
requirements: 'Quick, kid-friendly'
```

Error occurred at line 208 when trying to call `.join()` on a string.

**Fix:** Updated code to handle both string and array formats:
```javascript
// Handle requirements as either string or array
let requirements = '';
if (mealData.requirements) {
  if (typeof mealData.requirements === 'string' && mealData.requirements.length > 0) {
    requirements = ` - ${mealData.requirements}`;
  } else if (Array.isArray(mealData.requirements) && mealData.requirements.length > 0) {
    requirements = ` - ${mealData.requirements.join(', ')}`;
  }
}
```

**Files Changed:**
- `api/generate-meal-plan.js` (lines 207-217)

**Impact:** Meal plan generation now works correctly with both data formats.

---

### ✨ Improvements

#### 3. Dev Presets Personalized
**Enhancement:** Updated development presets with real user data for more realistic testing.

**Changes:**
- **Eaters:** Updated Roland's preferences (Mediterranean diet, anti-inflammatory, no caffeine, minimal red meat), Maya (4yo schedule), Cathie (Tuesday dinners)
- **Budget:** Changed from $150 to $120/week
- **Dietary Goals:** Detailed Mediterranean diet goals with Food Compass guidelines
- **Weekly Schedule:** Accurate meal servings based on actual household schedule:
  - Sunday: Maya arrives for lunch (2 servings lunch/dinner)
  - Monday-Tuesday: All meals with Maya (2-3 servings)
  - Wednesday: Breakfast with Maya, then solo (2→1 servings)
  - Thursday-Saturday: Just Roland (1 serving)
- **Recipes:** 6 Mediterranean recipes (was 5 generic):
  - Greek Yogurt Breakfast Bowl
  - Mediterranean Baked Salmon
  - Chickpea & Vegetable Stew (batch-cook)
  - Lemon Herb Chicken with Roasted Vegetables
  - Hummus Pasta with Cherry Tomatoes
  - Mediterranean White Fish with Green Beans

**Files Changed:**
- `src/utils/devPresets.js` (full rewrite of preset data)

**Impact:** Dev preset now reflects actual use case for more realistic testing.

---

## [v1.0-rc1] - December 26, 2025 - Slice 4 Code Complete

### ✨ New Features

#### Recipe Editing
- Edit any recipe after generation
- Auto-save drafts every 30 seconds
- Dynamic ingredient rows (add/remove)
- Full validation
- BeforeUnload protection

**Routes:** `#/recipe/:id/edit`  
**Files:** `src/components/RecipeEditPage.js`

---

#### Single Day Regeneration
- Regenerate any single day without losing the week
- Buttons on day cards in Meal Plan View
- Button in DayView header
- Confirmation modal
- Recipe duplication avoidance
- Fast generation (~20-30 seconds)

**API:** `POST /api/generate-meal-plan` (with `regenerateDay` param)  
**Files:** `src/utils/regenerateDay.js`, `src/components/MealPlanView.js`, `src/components/DayView.js`

---

#### Meal Plan History
- Auto-archive old plans when generating new
- Browse all past meal plans
- Read-only historical views
- Configurable retention (1-12 weeks, default: 4)
- Automatic cleanup based on retention
- Snapshot system (frozen data)

**Routes:** `#/history`, `#/history/:id`  
**Files:** `src/components/MealPlanHistoryPage.js`, `src/components/MealPlanHistoryDetailPage.js`  
**Storage:** `vanessa_meal_plan_history`

---

#### Recipe Import from Text
- Import recipes from pasted text
- AI extraction using Claude Sonnet 4.5
- Confidence scoring (0-100%)
- Preview/edit screen before saving
- Character limits (50-5000 chars)
- Comprehensive error handling
- Metric unit conversion

**API:** `POST /api/extract-recipe`  
**Files:** `src/components/RecipeImportModal.js`, `api/extract-recipe.js`

---

## Earlier Slices

### Slice 3 - December 26, 2025
- AI-powered onboarding with household extraction
- Recipe library with search, filter, ratings
- Settings page (4 sections)
- Household management
- Day-specific navigation
- Development presets

### Slice 2 - December 25, 2025
- Meal plan generation with progress
- Shopping list with ingredient aggregation
- Unit conversion system
- Meal plan and day views

### Slice 1 - December 24, 2025
- Chat with Vanessa (SSE streaming)
- Collapsible chat widget
- Conversation persistence

---

## Status Summary

**Current Version:** v1.0-rc1 (Release Candidate 1)

**Completion Status:**
- ✅ Code: 100%
- ✅ Automated Tests: 100% (6/6 passed)
- ✅ Bug Fixes: 100% (all critical bugs resolved)
- ⏳ Manual Testing: 0% (awaiting user testing)
- ⏳ Reality Check: 0% (pending)

**Next Steps:**
1. Manual testing of AI features (Recipe Import, Single Day Regeneration)
2. Slice 4 Reality Check documentation
3. Decision: Ship v1.0 or continue to Slice 5

---

**Last Updated:** December 26, 2025 (Evening)



