# Session: Shopping List Deduplication & Ingredient Normalization
**Date:** January 10, 2026  
**Focus:** Shopping list generation improvements, performance tracking, mode toggle feature

---

## 🎯 Original Problem

User reported shopping list had **59 items with significant duplication** after generating a week-long meal plan:
- Duplicate ingredients (basil appearing twice, pepper appearing twice)
- Compound ingredients (salt and pepper as one item)
- Overly specific items difficult to find in supermarkets
- Quantities with excessive decimal precision (0.2g)

---

## ✅ Work Completed This Session

### 1. Fixed Critical Slice 5 Data Structure Bug

**Problem:** Shopping list wasn't working at all after Slice 5 migration
- Expected old structure: `mealPlan.days[]` array with nested meal data
- Actual structure: `mealPlan.mealIds[]` + meals stored separately
- Meals have `recipeId`, not `recipeName`

**Fix:**
- Updated `ShoppingListView.getRecipesFromMealPlan()` to:
  - Load meals via `loadMeals()`
  - Filter by `mealPlan.mealIds`
  - Look up recipes by `meal.recipeId` (not by name)
- Updated `getRecipeUsageCounts()` to work with separated meal storage
- Result: Shopping list now generates successfully

**Files Changed:**
- `src/components/ShoppingListView.js` - Data loading logic

---

### 2. Fixed Servings Scaling Across Multiple Uses

**Problem:** When same recipe appears multiple times (e.g., "Greek Yogurt with Honey" 3 times), ingredients weren't scaling properly.

**Fix:**
- New method: `getRecipeUsageCounts()` tracks usage across meal plan
- Accounts for: 
  - Same recipe appearing multiple meals
  - Different serving counts per meal (1 serving breakfast vs 3 serving dinner)
- Scales ingredient quantities by total servings needed
- Example: Recipe for 2 servings used 3x with (1 + 2 + 1) servings → scales by 4/2 = 2x

**Files Changed:**
- `src/components/ShoppingListView.js` - Servings calculation

---

### 3. Fixed Quantity Rounding (No More 0.2g!)

**Problem:** Shopping list showed excessive precision: "125.7g", "0.2g"

**Fix:**
- Changed rounding from complex logic to simple: `Math.round(converted)`
- Minimum 1g for metric units
- Whole numbers only in both conversion stage and display stage
- Quote: "This isn't chemistry!"

**Files Changed:**
- `src/components/ShoppingListView.js` - Rounding logic

---

### 4. Enhanced Unit Conversions

**Fixed Missing Units:**
- Added plural forms: `tbsps`, `tsps`, `cups`, `tablespoons`, `teaspoons`, `ounces`, `pounds`
- Added `serving` → `whole` mapping
- Added fallback conversions for unmapped ingredients:
  - `tablespoon` → 15ml
  - `teaspoon` → 5ml
  - `leaf` → count (for herbs)
- Result: No more unit conversion warnings

**Files Changed:**
- `src/utils/unitConversions.js` - Unit mappings
- `src/components/ShoppingListView.js` - Fallback conversions

---

### 5. Implemented Chef vs Pantry Mode Toggle ✨

**Research-Backed Feature:**
- Used Taskmaster research tool to study production meal planning apps
- Learned: Most apps offer two modes for different user preferences

**Implementation:**
- **Storage Layer:** (`src/utils/storage.js`)
  - New key: `VANESSA_SHOPPING_LIST_MODE`
  - `getShoppingListMode()` - Returns 'chef' or 'pantry' (default: 'chef')
  - `setShoppingListMode(mode)` - Saves preference with validation

- **Settings UI:** (`src/components/SettingsPage.js`)
  - Radio button toggle in Meal Planning section
  - Two styled options with descriptions and examples
  - Visual feedback (green border on selected)
  - Toast notification on mode change
  - Help text explaining the difference

- **Shopping List Logic:** (`src/components/ShoppingListView.js`)
  - Mode-aware `getCanonicalName()` function
  - Chef mode: Preserves variety distinctions (default)
  - Pantry mode: Groups similar items (~30-40% fewer items)

**Mode Comparison:**

| Ingredient | Chef Mode | Pantry Mode |
|------------|-----------|-------------|
| Cherry tomatoes | Separate line | Grouped as "tomato" |
| Roma tomatoes | Separate line | Grouped as "tomato" |
| Red onion | Separate line | Grouped as "onion" |
| Yellow onion | Separate line | Grouped as "onion" |
| Russet potatoes | Separate line | Grouped as "potato" |

**Strict Variety Ingredients List** (never merge in Chef mode):
- Apples (Granny Smith ≠ Gala)
- Rice (long-grain ≠ arborio)
- Flour (bread ≠ all-purpose ≠ cake)
- Onions (red ≠ yellow ≠ white)
- Cheese varieties
- Tomato varieties
- Potato varieties
- Peppers

**Files Changed:**
- `src/utils/storage.js` - Storage functions
- `src/components/SettingsPage.js` - UI toggle
- `src/components/ShoppingListView.js` - Mode-aware grouping

---

### 6. Added Performance Tracking ⏱️

**Meal Plan Generation:**
- Start/end timestamps with human-readable times
- Data loading times (eaters, chat history, catalog)
- API connection time
- Stream processing time
- Post-processing times (transform, save)
- Total generation time in ms and seconds

**Shopping List Generation:**
- Recipe loading time
- Meal plan extraction time
- Ingredient aggregation time
- Shopping list generation time
- Total time with step-by-step breakdown

**Example Console Output:**
```
🚀 Starting meal plan generation...
⏱️ Start time: 9:45:32
  ⏱️ Loaded 3 eater(s) in 0ms
  ⏱️ Loaded chat history (1 messages) and base spec in 0ms
  ⏱️ Loaded recipe index: 622 recipes in 20ms
  📡 Sending request to API...
  ⏱️ API connection established in 1946ms
  ⏱️ Stream processing completed in 17509ms
✅ Total generation time: 19475ms (19.5s)
⏱️ End time: 9:45:52
```

**Files Changed:**
- `src/components/GenerationStatusPage.js` - Generation timing
- `src/components/ShoppingListView.js` - Shopping list timing

---

### 7. Improved Ingredient Name Cleaning

**Conservative Approach:**
- Splits compound ingredients: "salt and pepper" → "salt"
- Removes prep terms: "boneless", "skinless", "chopped", "diced", "fresh"
- Only generalizes branded/obscure items:
  - "Campari tomatoes" → "cherry tomatoes" (brand)
  - "San Marzano" → "plum tomatoes" (specific variety)
  - "Pecorino Romano" → "parmesan cheese" (obscure)
- **Preserves important distinctions:**
  - Feta cheese ≠ Parmesan cheese
  - Chicken breast ≠ Chicken thigh
  - Cherry tomatoes ≠ Roma tomatoes

**Files Changed:**
- `src/components/ShoppingListView.js` - Cleaning logic
- `api/generate-meal-plan.js` - AI prompt guidance

---

## 📊 Current Status

### What Works:
✅ Shopping list generates successfully  
✅ Performance tracking shows detailed timing  
✅ Quantities are whole numbers  
✅ Mode toggle UI implemented  
✅ Unit conversion warnings mostly fixed  
✅ Slice 5 data structure compatibility  

### What Still Needs Work:
⚠️ **Still 90 items in shopping list** (should be ~30-40)
⚠️ Deduplication not effective enough
⚠️ Some conversion errors still occurring

---

## 💡 Next Steps (Strategic Shift)

### User's Insight:
**Normalize ingredients at IMPORT time, not at shopping list generation time**

### Benefits:
1. **One-time processing** - Normalize once when importing recipes
2. **Consistent data** - All recipes work with normalized ingredients
3. **Faster shopping lists** - No conversion needed at generation
4. **Better deduplication** - Ingredients already in canonical form
5. **Ingredient density table** - Can store both volume and weight equivalents

### Proposed Approach:

**1. Create Ingredient Master Dictionary**
```javascript
{
  "tomato-cherry": {
    "canonicalId": "tomato",
    "variety": "cherry",
    "displayName": "cherry tomatoes",
    "category": "produce",
    "keepAsCount": true,
    "unit": "whole",
    "densityG": 15,  // 1 cherry tomato ≈ 15g
    "volumeMl": null
  },
  "tomato-roma": {
    "canonicalId": "tomato",
    "variety": "roma",
    "displayName": "roma tomatoes",
    "category": "produce",
    "keepAsCount": true,
    "unit": "whole",
    "densityG": 100,  // 1 roma tomato ≈ 100g
    "volumeMl": null
  }
}
```

**2. Normalize During Import/Creation**
- When importing from Spoonacular: parse → normalize → store
- When user creates recipe: parse → normalize → store
- Store ingredients in canonical format with both:
  - Weight equivalent (grams)
  - Volume equivalent (ml) where applicable
  - Count equivalent (whole items)

**3. Shopping List Becomes Simple**
- Just sum quantities by `canonicalId` (or `canonicalId + variety` in Chef mode)
- No conversion needed - already in shopping units
- Display from pre-calculated canonical form

---

## 📁 Files Modified This Session

### Core Logic:
- `src/components/ShoppingListView.js` - Major rewrite for Slice 5 compatibility
- `src/utils/unitConversions.js` - Added plural forms
- `src/utils/storage.js` - Added shopping list mode functions
- `api/generate-meal-plan.js` - Updated AI prompt guidance

### UI:
- `src/components/SettingsPage.js` - Added mode toggle
- `src/components/GenerationStatusPage.js` - Performance tracking

### Documentation:
- `docs/CHANGELOG.md` - v1.3.2-alpha release notes
- `docs/FEATURES.md` - Updated shopping list feature docs

---

## 🔬 Technical Learnings

### Data Structure (Slice 5):
```javascript
// Meal Plan
{
  mealPlanId: "plan_20260110",
  mealIds: ["meal_001", "meal_002", ...],  // References
  weekOf: "2026-01-10",
  budget: { estimated: 145 }
}

// Meals (stored separately)
[
  {
    mealId: "meal_001",
    recipeId: "recipe_abc123",  // Key: Use ID, not name!
    date: "2026-01-10",
    mealType: "breakfast",
    servings: 1
  }
]

// Recipes
[
  {
    recipeId: "recipe_abc123",
    name: "Greek Yogurt Bowl",
    ingredients: [...]
  }
]
```

### Research Findings (Taskmaster Research Tool):
- Production apps use canonical ingredient dictionaries
- Two common modes: "Chef-centric" (strict) vs "Pantry-centric" (flexible)
- Strict variety ingredients list prevents inappropriate merging
- Most apps normalize at storage time, not display time
- Include both weight and volume for flexibility

---

## 🚀 Recommended Next Session Focus

**Goal:** Implement ingredient normalization pipeline

**Tasks:**
1. Design ingredient master dictionary schema
2. Extract all unique ingredients from 622-recipe catalog
3. Create normalization rules and density mappings
4. Implement import-time normalization
5. Update recipe storage to include normalized ingredient data
6. Simplify shopping list to just sum normalized ingredients
7. Test with real data

**Expected Impact:**
- Shopping list: 90 items → ~30-40 items
- Generation time: faster (no conversion needed)
- Consistency: all recipes use same ingredient names
- Maintainability: easier to add new recipes

---

## 📝 Code References

### Key Functions:
- `ShoppingListView.getRecipesFromMealPlan()` - Extracts recipes from Slice 5 structure
- `ShoppingListView.getRecipeUsageCounts()` - Tracks servings scaling
- `ShoppingListView.getCanonicalName(name, mode)` - Mode-aware grouping
- `getShoppingListMode()` / `setShoppingListMode()` - User preference storage

### Storage Keys:
- `vanessa_shopping_list_mode` - Chef or Pantry preference
- `vanessa_recipes` - Recipe storage (needs normalization)
- `vanessa_meals` - Meal references
- `vanessa_current_meal_plan` - Active plan metadata

---

## 📊 Performance Metrics (Typical Run)

- **Meal plan generation:** 19-35 seconds
  - API connection: ~1-2 seconds
  - Stream processing: ~18-33 seconds
  - Data transformation: ~12ms
  - Storage save: ~1ms

- **Shopping list generation:** ~8-10ms
  - Recipe loading: <1ms
  - Meal plan extraction: <1ms
  - Ingredient aggregation: ~8ms

---

## 🎯 Strategic Recommendation

**Current approach:** Fix symptoms at display time (deduplication in shopping list)  
**Better approach:** Fix root cause at import time (normalized ingredient storage)

This aligns with production app architecture and will provide:
- Cleaner codebase
- Better performance
- Easier maintenance
- More reliable deduplication
- Foundation for future features (nutrition tracking, substitutions, etc.)

---

## 📚 Related Documentation

- `docs/CHANGELOG.md` - v1.3.2-alpha (this session's changes)
- `docs/FEATURES.md` - Shopping List section (updated)
- `.taskmaster/docs/prd.txt` - PRD (not updated this session)
- Research: Production meal planning app ingredient normalization strategies

---

**End of Session**
