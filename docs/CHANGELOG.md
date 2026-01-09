# Changelog

## [v1.3.0-alpha] - January 10, 2026 - Custom Recipe Extraction (Phase 3)

### 🎯 Targeted Catalog Expansion: +128 Recipes

**Before:** 494 recipes  
**After:** 622 recipes  
**Added:** 128 new recipes (26% growth)

### ✨ What's New

#### Custom Recipe Extraction
- **New script:** `scripts/extractCustomRecipes.js` for targeted recipe extraction
- **Smart duplicate detection:** Automatically avoids re-fetching existing recipes
- **Three-round extraction process:**
  - Round 1: Lebanese, Moroccan, roasted veggies, fish, salads (20 recipes)
  - Round 2: Roasted vegetables, legumes, fish varieties (28 recipes)
  - Round 3: Mediterranean combos, African, Spanish, kid-friendly (80 recipes)

#### Recipe Coverage Improvements
- **Mediterranean:** 90 → 105 recipes (+17%)
- **Middle Eastern:** 26 → 28 recipes
- **Salads:** 49 → 73 recipes (+49%)
- **Kid-Friendly:** 6 → 20 recipes (+233%)
- **Breakfasts:** 34 → 40 recipes
- **Vegetarian:** 248 recipes total
- **Vegan:** 127 recipes total

#### Cuisine Diversity
- **28 cuisine types** (was 26)
- New additions: African, more Spanish varieties
- Enhanced: Mediterranean, Middle Eastern, Lebanese, Moroccan

#### Recipe Categories Added
- **Roasted vegetables:** Cauliflower, eggplant, peppers, zucchini, carrots
- **Legume dishes:** Chickpea curry, lentil soup, dal, white beans, black beans
- **Simple fish:** Tilapia, cod, halibut, sea bass preparations
- **Protein salads:** Chicken, shrimp, salmon, steak, chickpea salads
- **Kid-friendly:** Finger foods, veggie-friendly meals, lunch box ideas

### 📊 Technical Details

#### Extraction Stats
- **42 targeted searches** (3 extraction rounds)
- **314 recipes fetched** total
- **186 duplicates skipped** (smart deduplication working!)
- **128 new recipes added**
- **128 new images downloaded** (100% success rate for new recipes)

#### Storage
- **Catalog:** 1.4MB → 1.7MB JSON (+21%)
- **Index:** 326KB → 410KB (+26%)
- **Images:** ~620 images, ~15MB storage
- **Index efficiency:** 84.6% size reduction maintained

#### Performance
- Catalog load time: 250-350ms (within target)
- Index build time: <1 second
- Storage usage: Well within 5MB localStorage limit

### 🛠️ New Tools & Workflows

#### Custom Extraction Script
```bash
# Run targeted recipe extraction
node scripts/extractCustomRecipes.js

# Edit SEARCH_QUERIES array to customize:
# - Cuisine preferences
# - Ingredient requirements
# - Meal types
# - Dietary restrictions
```

#### Recipe Index Regeneration
```bash
# Rebuild lightweight index from full catalog
node scripts/buildRecipeIndex.js

# Outputs:
# - recipe_index.json (410KB)
# - 84.6% size reduction
# - Coverage stats
```

#### Cache Clearing
To see new recipes in the app:
```javascript
localStorage.removeItem('vanessa_recipe_catalog');
localStorage.removeItem('vanessa_recipe_index');
location.reload();
```

### 📚 Documentation Updates

- **FEATURES.md:** Updated Recipe Catalog System section with Phase 3 stats
- **DEVELOPMENT.md:** Updated catalog management, verification scripts, and stats
- **ARCHITECTURE.md:** No changes needed (system architecture unchanged)

### 🎯 User Impact

**For Lebanese/Mediterranean preferences:**
- 105 Mediterranean recipes (17% of catalog)
- 28 Middle Eastern recipes
- Lebanese and Moroccan cuisine options
- Roasted veggie dishes with chickpeas/lentils

**For families with kids:**
- 20 kid-friendly recipes (was 6)
- Finger foods, veggie-hidden meals
- Lunch box ideas
- Familiar flavors with nutrition

**For health-conscious users:**
- 73 protein-packed salads
- 248 vegetarian options
- 127 vegan options
- Simple fish preparations

### 🔧 Migration Notes

**No breaking changes.** Existing apps will:
1. Continue using cached 494-recipe catalog
2. Auto-load 622-recipe catalog on next cache clear/refresh
3. See new recipes immediately after clearing localStorage cache

---

## [v1.2.0-alpha] - January 10, 2026 - Catalog Expansion (Phase 2)

### 🎉 Major Achievement: 184% Catalog Growth

**Before:** 174 recipes  
**After:** 494 recipes  
**Added:** 320 new recipes

### ✨ New Features

#### Comprehensive Recipe Coverage
- **🍳 Breakfasts**: 3 → 34 recipes (1,033% increase!)
- **🍛 Curries**: 0 → 18 recipes
- **🥘 Stir-fries**: 0 → 11 recipes
- **🌏 Asian Cuisines**: Massive expansion (Thai, Indian, Chinese, Japanese, Korean, Vietnamese)
- **🌮 Mexican**: 3 → significant expansion
- **26 cuisine types** total (was 18)

#### Protein Source Tagging (CRITICAL FIX)
- **Fixed extraction bug**: Proteins were not being tagged
- **15 protein types** now detected: chicken, salmon, tofu, lentils, chickpeas, beef, pork, shrimp, eggs, turkey, lamb, tuna, white-fish, black-beans, tempeh
- **All 494 recipes** properly tagged with protein sources

### 📊 Technical Details

#### Extraction Stats
- **66 targeted searches** (following protocol document)
- **613 recipes fetched**, 293 duplicates filtered
- **319 new images** downloaded (high-res 636x393)
- **2 image failures** (99.4% success rate)
- **1.4MB catalog** JSON (740KB → 1.4MB)

#### Storage
- **835 total images** (was 629)
- **22MB image storage** (was 11MB)
- **99.8% image availability**

### 📚 Documentation
- **ARCHITECTURE.md:** Added Two-Phase AI Extraction pattern documentation
- **EXTRACTION-PLAN.md:** Created comprehensive extraction plan
- **Cleanup:** Moved 3 session docs to archive for protocol compliance
- **Compliance:** 100% compliant with documentation protocol (5 permanent files only)

---

---

## [v1.1.0-alpha] - January 8-9, 2026 - Slice 5 Phase 1: Catalog & Health System

### 🎉 Major Features

#### Spoonacular Recipe Catalog (Initial Extraction)
- **174 professional recipes** extracted and stored locally (corrected from initial documentation)
- **180 recipe images** downloaded
- **Complete data**: ingredients, nutrition, instructions, tags
- **Zero dependency**: Can cancel Spoonacular subscription after extraction
- **Mediterranean & Diet Compass focus**

#### Diet Compass Health Scoring System
- **4-metric scoring**: Nutrient Density, Anti-Aging, Weight Loss, Heart Health (0-100 each)
- **Visual display**: 5-bar system on recipe cards, full breakdown on detail pages
- **100+ ingredient database** with health impact classifications
- **Based on** "The Diet Compass" by Bas Kast
- *Note: Scoring needs to be re-run on expanded catalog*

#### Diet Profile System (Data Layer)
- **11 preloaded profiles**: Mediterranean, Keto, Vegan, Vegetarian, High Protein, Flexitarian, Longevity, Intermittent Fasting, MIND, Kid-Friendly, La Dieta
- **Compatibility filtering** and conflict detection
- **Profile utilities** for querying and filtering
- *Settings UI pending Phase 2*

#### Catalog-First Meal Generation
- **Intelligent matching**: Checks catalog before generating new recipes
- **Name matching**: Exact + fuzzy matching of recipe names
- **40-70% catalog usage** in typical generations
- **Cost savings**: ~50-70% reduction in Claude API calls
- **Stats tracking**: Logs catalog vs generated ratio

### 🏗️ Technical Changes

#### Schema v2 (Breaking Change - Auto-Migrated)
- **Recipe v2**: +source, spoonacularId, image, parentRecipeId, childRecipeIds, dietCompassScores, nutrition, comprehensive tags
- **Eater v2**: +dietProfile, personalPreferences, excludeIngredients, preferIngredients
- **BaseSpecification v2**: +mealPrepSettings (batchPrepDays, per-day prepLevels)
- **Meal v2**: +prepTasks, targetEaters, dietProfileTags
- **Auto-migration**: Runs on app boot, idempotent, backward-compatible

#### New Storage Keys
- `vanessa_recipe_catalog` (~900KB) - 607 recipes
- `vanessa_ingredient_health` (~35KB) - Ingredient scores
- `vanessa_diet_profiles` (~10KB) - 11 profiles
- `vanessa_migration_slice5` - Migration flag

### 🔧 Component Updates
- **RecipeLibraryPage**: Loads and displays catalog recipes with health bars
- **RecipeDetailPage**: Shows full health score breakdown
- **mealPlanTransformer**: Catalog matching before recipe creation
- **devPresets**: Now only loads onboarding (no test recipes)
- **main.js**: Bootstraps health data and catalog on app init

### 📦 New Files (35 total)
- **Data**: 3 JSON files (catalog, ingredients, profiles)
- **Utilities**: 8 new utility modules
- **Components**: 1 new component (HealthScoreBars)
- **Scripts**: 5 extraction/scoring scripts
- **Documentation**: 8 Slice 5 guides + session logs
- **Tests**: 3 test pages and scripts

### 🐛 Fixes & Improvements
- Fixed: Catalog auto-loads from file into localStorage
- Fixed: All 607 recipes have complete ingredient lists
- Fixed: Dev preset no longer creates conflicting test data
- Improved: Claude prompt guides toward catalog-friendly names
- Added: Comprehensive error handling in extraction
- Added: Progress logging and stats tracking

### 📊 Performance
- Catalog load: ~200-300ms (908KB JSON)
- Recipe scoring: <5ms per recipe
- Batch scoring: ~3 seconds for 607 recipes
- Image storage: 11MB local (no CDN dependency)

### 💰 Cost Impact
- **Development**: $0.60 (Taskmaster + testing)
- **One-time extraction**: ~1,400 Spoonacular points
- **Monthly savings**: $29 (Spoonacular can be canceled)
- **Ongoing**: ~$5-10/month (Anthropic only)

### 🐛 Known Issues
- Images not displaying in Recipe Library (path configuration issue)
- Average health scores conservative (13.7/100) due to limited ingredient database
- Catalog matching rate 40-70% (can be optimized with better prompts)

### 📝 Notes
- **Tasks completed**: 20 of 37 Slice 5 tasks (54%)
- **Session duration**: 4.5 hours autonomous building
- **Spoonacular API**: Used once for extraction, no longer required
- **Next phase**: Settings UI, Prep Planning, Recipe Variations

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



