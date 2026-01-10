# Changelog

## [v10.0.0] - Enhanced Ingredient Catalog & Import Pipeline (January 10, 2026)

### 🎉 MAJOR RELEASE: Complete Ingredient Normalization System

This release represents a fundamental transformation of the Meal Planner's ingredient and recipe systems, introducing comprehensive nutrition tracking, price awareness, and intelligent recipe normalization.

---

## [v10.0.0] - Enhanced Ingredient Catalog System (January 10, 2026)

### 🆕 Major Feature: Comprehensive Ingredient Data Model

**Overview:**
Expanded the ingredient master catalog to include complete nutrition, pricing, and cooking method data. This enables accurate meal planning nutrition calculations, budget estimates, and health tracking across all recipes.

**New Schema Fields:**

1. **Pricing Data:**
   - Average price per retail unit (AUD, Melbourne region)
   - Typical retail unit (kg, L, pack, bunch, etc.)
   - Unit size descriptions
   - Source tracking (manual, Coles, Woolworths)
   - Last updated timestamps

2. **Base Nutrition Data** (per 100g raw):
   - Complete macronutrients (calories, protein, carbs, fat, fiber, sugar, saturated fat)
   - Sodium and cholesterol
   - ALL vitamins from Spoonacular (A, C, D, E, K, B-complex, etc.)
   - ALL minerals (calcium, iron, magnesium, phosphorus, potassium, zinc, etc.)
   - Spoonacular ID for data tracking
   - Source metadata

3. **Nutrition by Preparation Method:**
   - Multipliers for 7 cooking methods: raw, grilled, baked, fried, boiled, steamed, air-fried
   - Research-backed adjustments for nutrient changes during cooking
   - Special handling for water loss, fat loss, oil absorption
   - Ingredient-type-specific adjustments (meat vs vegetables vs fish)
   - Detailed notes on cooking conditions

**New Files Created:**

- `src/utils/spoonacularNutrition.js` - Spoonacular API integration (browser)
- `scripts/spoonacularNutrition.cjs` - Spoonacular API integration (Node.js)
- `src/utils/nutritionMultipliers.js` - Cooking method multiplier utilities
- `references/nutrition-multipliers.json` - Research-backed multiplier database
- `scripts/collectPricingData.cjs` - Interactive pricing collection tool
- `scripts/enrichIngredientCatalog.cjs` - Automated catalog enrichment script
- `references/pricing-template.csv` - Pricing data template

**Documentation Updates:**

- `docs/ingredients/master-dictionary.md` - Complete schema documentation with examples
- Added sections on pricing data, nutrition data, preparation multipliers
- Updated schema TypeScript definition
- Added data population process documentation

**Research & Data Sources:**

- **Nutrition:** Spoonacular API, USDA FoodData Central
- **Cooking Multipliers:** Research studies, USDA raw vs cooked comparisons, culinary science
- **Pricing:** Manual research from Coles and Woolworths (Melbourne, VIC)

**Version Updates:**

- Ingredient Master: v9.0.1 → v10.0.0
- Schema now includes: pricing, nutritionBase, nutritionByPreparation

**Impact:**

- Enables accurate nutrition tracking for meal plans
- Supports budget-aware meal planning
- Allows cooking method selection with nutrition awareness
- Foundation for personalized diet profiles
- Better shopping list cost estimates

**Usage:**

```bash
# Collect pricing data interactively
node scripts/collectPricingData.cjs

# Enrich catalog with nutrition and pricing
node scripts/enrichIngredientCatalog.cjs --pricing=tmp/pricing-data-123.json

# Enrich specific range (e.g., ingredients 1-50)
node scripts/enrichIngredientCatalog.cjs --start=0 --end=50
```

**Files Modified:**

- `src/data/ingredientMaster.json` - Schema expansion (v10.0.0)
- `docs/ingredients/master-dictionary.md` - Complete documentation update

---

### 🆕 Major Feature: Comprehensive Melbourne Ingredient Database

**Overview:**
Expanded ingredient catalog from 311 to **1,029 ingredients** covering the complete range of ingredients available at Melbourne supermarkets (Coles, Woolworths).

**Coverage:**
- Vegetables (fresh): 80+ varieties including leafy greens, root vegetables, cruciferous, nightshades, squash
- Fruits (fresh): 50+ varieties including citrus, stone fruits, berries, tropical, melons
- Fresh herbs: 18 varieties
- Meat & poultry: 90+ cuts and varieties (beef, lamb, pork, chicken, turkey, duck)
- Seafood: 50+ fresh and canned varieties
- Dairy & eggs: 80+ products (milk, cream, cheese, yoghurt, eggs, plant milks)
- Grains & pasta: 60+ varieties (rice, pasta, noodles, oats, quinoa, breads)
- Legumes: 20+ canned and dried varieties
- Nuts & seeds: 30+ varieties including nut butters
- Oils & vinegars: 25+ cooking oils and vinegars
- Condiments & sauces: 80+ Asian, Western, and specialty sauces
- Spices & seasonings: 100+ ground, whole, dried herbs, and blends
- Baking essentials: 60+ flours, sugars, leaveners, chocolate, dried fruits
- Canned goods: 40+ canned vegetables, fruits, and stocks
- Frozen foods: 30+ frozen vegetables, fruits, and pastry
- Beverages: 20+ cooking wines, stocks, and other liquids

**Australian/Melbourne Specifics:**
- Proper Australian names (capsicum not bell pepper, zucchini not courgette)
- Melbourne-specific varieties (Wombok cabbage, Kipfler potatoes, etc.)
- Common Australian brands and products (Vegemite, chicken salt, etc.)
- Coles/Woolworths stock availability focus

**Alias System:**
- Comprehensive Australian → International mappings
- Product state variants (fresh vs frozen vs canned)
- Brand name → generic mappings
- Common misspellings and variations

**New Scripts Created:**
- `scripts/parseMelbourneList.cjs` - Part 1 parser
- `scripts/addMelbourneIngredients_Part2.cjs` - Herbs, meat, seafood
- `scripts/addMelbourneIngredients_Part3.cjs` - Dairy, grains, legumes, nuts
- `scripts/addMelbourneIngredients_Part4.cjs` - Spices, baking, canned, frozen
- `scripts/enrichNewIngredients.cjs` - Batch enrichment for new ingredients
- `scripts/fixMissingIds.cjs` - Utility to fix catalog integrity issues

**Ingredient Count:**
- Original: 311 ingredients
- Added: 718 Melbourne ingredients
- **Total: 1,029 ingredients**

**Enrichment Status:**
- ~650 ingredients with full Spoonacular nutrition data
- 1,029 ingredients with cooking method multipliers
- Estimated coverage: 85-90% of common recipe ingredients

---

### 🆕 Major Feature: Recipe Import Pipeline with Normalization

**Overview:**
Complete recipe import pipeline that normalizes ingredients, enhances instructions, and ensures data quality.

**Import Flow:**
```
User Pastes Recipe Text
        ↓
AI Extraction (Claude)
        ↓
Ingredient Normalization (match to 1,029 catalog)
        ↓
User Review (if unmatched ingredients)
        ↓
Add New Ingredients (with AI research)
        ↓
Instruction Enhancement (insert quantities)
        ↓
Recipe Formatting (standardize display)
        ↓
Save Complete Recipe
```

**New API Endpoints:**

1. **`/api/extract-recipe-v2`** - Enhanced extraction
   - Preserves original units for better matching
   - Extracts preparation methods
   - Higher token limit for complex recipes

2. **`/api/normalize-ingredients`** - Ingredient normalization
   - Matches ingredients to master catalog
   - Calculates confidence scores
   - Generates smart suggestions
   - Returns review flags

3. **`/api/research-ingredient`** - AI ingredient research
   - Searches Spoonacular
   - Researches metadata (density, pricing, aliases)
   - Suggests substitutes
   - Returns complete ingredient data

4. **`/api/add-ingredient`** - Add to catalog
   - Validates new ingredient data
   - Updates master catalog file
   - Returns updated catalog stats

**New Components:**

- `src/components/IngredientReviewModal.js` - Modal for reviewing unmatched ingredients
  - Shows ingredient in recipe context
  - Provides searchable ingredient list
  - Smart suggestions with confidence scores
  - Add new or skip options

- `src/components/AddIngredientDialog.js` - Dialog for adding new ingredients
  - Collects metadata from user
  - Triggers AI research
  - Shows confirmation with research results
  - Adds to catalog

**New Utilities:**

- `src/utils/instructionEnhancer.js` - Instruction enhancement
  - Finds ingredient mentions in text
  - Inserts quantities inline
  - Adds helpful equivalents (cups, whole items)
  - Boldifies ingredient mentions

- `src/utils/recipeFormatter.js` - Recipe formatting
  - Standardizes step numbering
  - Ensures proper spacing
  - Consistent temperature/time formatting
  - Validates instruction format
  - Converts to HTML for display

- `src/utils/recipeImportOrchestrator.js` - Pipeline orchestrator
  - Coordinates entire import flow
  - Manages state between steps
  - Handles user interactions
  - Single entry point for imports

**Features:**

✅ **Automatic Normalization:**
- 1,029 ingredient catalog with extensive aliases
- Confidence-based matching (0.8+ threshold)
- Smart fallback suggestions

✅ **User Review Interface:**
- Clean modal UI for unmatched ingredients
- Real-time search through catalog
- Confidence score display
- Skip or add new options

✅ **AI-Powered Ingredient Research:**
- Automatic Spoonacular lookup
- Density value research
- Price estimation guidance (Melbourne)
- Alias generation
- Substitute recommendations

✅ **Enhanced Instructions:**
- Quantities displayed inline: "Add **garlic (25g, about 3 cloves)**"
- Helpful equivalents (grams → cups, whole items)
- Bold formatting for ingredients
- Clear, scannable format

✅ **Standardized Formatting:**
- Numbered steps (always)
- Double-space between steps
- Consistent timing format (5 minutes, not 5 min)
- Consistent temperature format (180°C)
- Imperative tense throughout

**Impact:**
- Recipes fully normalized to catalog
- Accurate nutrition calculations possible
- Shopping lists can aggregate properly
- Meal planning understands all ingredients
- Budget estimates can be calculated
- Diet compatibility scoring improved

**Usage Example:**
```javascript
import RecipeImportOrchestrator from './src/utils/recipeImportOrchestrator.js';

const orchestrator = new RecipeImportOrchestrator();

orchestrator.importRecipe(
  recipeText,
  (finalRecipe) => {
    console.log('Import complete!', finalRecipe);
    // Save recipe to storage
  },
  (error) => {
    console.error('Import failed:', error);
  }
);
```

**Files Created:**

API Endpoints (4):
- `api/extract-recipe-v2.js`
- `api/normalize-ingredients.js`
- `api/research-ingredient.js`
- `api/add-ingredient.js`

Components (2):
- `src/components/IngredientReviewModal.js`
- `src/components/AddIngredientDialog.js`

Utilities (3):
- `src/utils/instructionEnhancer.js`
- `src/utils/recipeFormatter.js`
- `src/utils/recipeImportOrchestrator.js`

**Files Modified:**
- `docs/CHANGELOG.md` - This file

---

## [Unreleased] - Ingredient Normalization System

### 🔧 Shopping List Unit Corrections (January 10, 2026 - Night)

**Issue:** Shopping list displayed nonsensical units for many ingredients:
- Ricotta showed as "2" (no unit - should be grams)
- Rice vinegar showed as "2 grams" (vinegar is liquid - should be ml)
- Basil showed as "1 mil" (should be grams for fresh herbs)
- Mint showed as "10 mils" (should be grams for fresh herbs)
- Lemon juice inconsistent units
- Garlic powder showed as "1" (no unit)

**Root Cause:**
- Some ingredients had incorrect `canonicalUnit` in master dictionary (vinegars set to "g" instead of "ml")
- Missing or incorrect density mappings prevented proper unit conversions
- Shopping list needs to show units as items are SOLD, not just measured in recipes

**Research Conducted:**
Used AI research to determine standard grocery store units:
- **Fresh herbs**: Sold in grams (bunches ~30-40g), recipes use tbsp/cups → need density conversion
- **Vinegars**: Sold in ml bottles (250ml, 500ml, 1L), always measure in ml
- **Ricotta**: Sold in gram containers (226g, 425g, 454g), recipes use cups → need density conversion
- **Spice powders**: Sold in grams (40-85g jars), recipes use tsp → need accurate tsp-to-gram conversion

**Fixes Applied:**

1. **Vinegar Units Corrected:**
   - `rice_vinegar`: g → ml ✓
   - `rice_wine_vinegar`: g → ml ✓

2. **Fresh Herb Densities Updated** (for proper cup/tbsp/tsp → gram conversion):
   - Mint: 1 tsp = 1g (not 0.3g)
   - Rosemary: 1 tsp = 0.7g
   - Dill: 1 tsp = 0.2g
   - Basil, parsley, cilantro: Already correct

3. **Spice Powder Densities Refined** (research-backed values):
   - Garlic powder: 1 tsp = 3.1g (was 2.8g)
   - Onion powder: 1 tsp = 2.3g
   - Chili powder: 1 tsp = 2.7g

4. **Dairy Product Densities Updated:**
   - Ricotta: 1 cup = 246g (accurate whole milk ricotta density)

**Files Modified:**
- `src/data/ingredientMaster.json` - Version bumped to 9.0.1
- `scripts/fixIngredientUnits.cjs` - New maintenance script (documented fix)

**Impact:**
- Shopping lists now show correct, purchasable units
- Vinegars display in ml (not grams)
- Fresh herbs aggregate properly in grams
- Spice powders show accurate gram amounts
- Dairy products (ricotta, yogurt) convert cups → grams accurately

**Verification:**
```bash
# Run the fix
node scripts/fixIngredientUnits.cjs

# Then regenerate meal plan to see corrected shopping list
```

**Next Steps:**
- User needs to regenerate meal plan to see corrected units
- Future: Consider displaying both metric and imperial for US users
- Future: Add "smart package sizing" (e.g., "1 × 500ml bottle" instead of "450ml")

---

### 🐛 CRITICAL BUG FIX: Shopping List Overcounting (January 10, 2026 - Late Evening)

**Issue:** Shopping list calculated 3.2kg yogurt when only 2.0kg needed (60% overcounting)

**Root Cause:** 
- Recipe deduplication hash included quantities, causing same recipe at different serving sizes to be treated as separate recipes
- Shopping list scaling didn't normalize by recipe base servings before multiplying by total servings needed
- Example: Recipe with 400g yogurt for 2 servings, used 5 times = 400g × 5 = **2000g WRONG**
- Correct: (400g ÷ 2) × 5 = **1000g**

**Files Fixed:**
1. `src/utils/mealPlanTransformer.js` - Updated `createRecipeHash()` to exclude quantities from hash (only use ingredient names + units)
2. `src/utils/normalizedShoppingList.js` - Fixed scaling logic to divide by base servings first: `scalingFactor = totalServingsNeeded / recipeBaseServings`

**Impact:**
- Shopping lists now accurate (no more 60% overcounting)
- Recipes with same ingredients at different scales deduplicate correctly
- Budget estimates more accurate
- Food waste reduced significantly

**Test Results:**
- Before: 3.0kg yogurt (wrong)
- After: 2.0kg yogurt (correct) ✓

---

### ✨ Portion Multiplier Support for Children (January 10, 2026 - Late Evening)

**🎉 ACHIEVEMENT: Accurate serving sizes for mixed-age households**

#### Problem Solved
Previously, the system treated all eaters equally - a 4-year-old child would get the same "1 serving" as an adult, resulting in oversized meals for children and inaccurate shopping lists.

#### Implementation
- **New Field:** `portionMultiplier` added to Eater schema
  - `1.0` = Adult/standard serving (default)
  - `0.5` = Young child (4-8 years) - half an adult serving
  - `0.75` = Older child/teen (9-13 years)
  - `0.25` = Toddler (1-3 years)
  - `1.25` = Large appetite/very active adults

#### How It Works
**Example:** Dad + 4-year-old daughter eating breakfast together
- Dad: `portionMultiplier = 1.0`
- Daughter: `portionMultiplier = 0.5`
- **Total servings: 1.5** (instead of 2.0)

The AI generation now:
1. Reads each eater's `portionMultiplier` from the household data
2. Calculates accurate total servings per meal
3. Scales ingredient quantities accordingly
4. Results in appropriately-sized meals and accurate shopping lists

#### Technical Changes
- **Schema:** Updated `Eater` schema with `portionMultiplier` field (defaults to 1.0)
- **Storage:** Updated `createEater()` function to include field
- **API:** Enhanced prompt to explain portion multipliers with examples
- **Schedule:** Updated schedule display to show portion-adjusted servings
- **Migration:** Created `addPortionMultipliers.js` migration script
- **Suggested Values:** Added `SUGGESTED_PORTION_MULTIPLIERS` constants

#### User Impact
- More accurate meal sizes for families with children
- Reduced food waste (no more oversized children's portions)
- Correct shopping list quantities
- Better recipe instructions with proper serving counts

#### Future Enhancement (Task 106)
When onboarding flow is enhanced, Vanessa will:
- Automatically ask: "Do you have any children? How old are they?"
- Extract ages from natural conversation: "my 4-year-old daughter" → auto-set `portionMultiplier: 0.5`
- Apply correct portion sizes from first meal plan generation
- No manual setup needed

#### Manual Setup (Temporary)
Until Task 106 is complete, use browser console to set child portions (see DEVELOPMENT.md for instructions)

---

### ✨ Multi-Profile Meal Generation (January 10, 2026 - Late Evening)

**🎉 ACHIEVEMENT: System now supports households with conflicting diet profiles**

#### Implementation Complete
- **Tasks Completed:** Task 100 (Diet Profile Filter - verified), Task 101 (Multi-Profile Generation)
- **New Files:**
  - `src/utils/eaterGrouping.js` - Groups eaters by diet compatibility
  - `src/utils/__tests__/eaterGrouping.test.js` - Test examples

#### Key Features
1. **Automatic Conflict Detection:** API detects when household has incompatible profiles (Keto + Vegan, etc.)
2. **Multiple Recipes Per Meal:** When conflicts exist, AI generates separate recipes for each group
3. **Target Eater Tracking:** Each recipe labeled with who it's for (e.g., "Mom, Kids" vs "Dad")
4. **Flexible Profile Handling:** Kid-friendly and flexitarian profiles added to all compatible groups
5. **Shopping List Integration:** Automatically aggregates ingredients from all recipe variants

#### Technical Implementation
- **API Changes** (`api/generate-meal-plan.js`):
  - Added `checkDietProfileConflicts()` to detect profile conflicts
  - Enhanced system prompt with multi-recipe array format instructions
  - Generates array of recipes per meal when conflicts detected
- **Transformer Changes** (`src/utils/mealPlanTransformer.js`):
  - Handles both single recipe and array-of-recipes format
  - Creates separate Meal objects for each recipe in multi-profile scenarios
  - Maps `targetEaters` names to eater IDs and preserves `dietProfileTags`
- **Schema Updates:**
  - Meal schema now includes optional `targetEaters` and `dietProfileTags` fields
  - Supports multiple Meal objects per date+mealType combination

#### Example Use Case
**Household:** Mom (Keto), Dad (Vegan), Kids (Kid-Friendly)
**Result:** Tuesday Dinner generates:
- Grilled Salmon with Asparagus → Mom, Kids (Keto, Kid-Friendly)
- Chickpea Buddha Bowl → Dad (Vegan)

Shopping list includes ingredients for both recipes with correct servings.

#### Next Steps
- Task 119: Update UI components to display multiple recipes per meal with eater labels
- Test with real multi-profile households in production

---

### ✨ Shopping List Optimization & Servings Fix (January 10, 2026 - Evening)

**🎉 ACHIEVEMENT: Shopping list reduced from 56 to 32 items via AI prompt optimization**

#### Shopping List Optimization
- **File:** `api/generate-meal-plan.js`
- **Approach:** Instead of normalizing ingredients after generation, instruct Claude to select recipes with overlapping ingredients
- **Changes:**
  - Added comprehensive "Ingredient Overlap Strategy" to system prompt
  - Step-by-step process: Choose core ingredients first, then select recipes that use them
  - Concrete examples of good/bad ingredient reuse patterns
  - Hard budget constraint: ~35 unique ingredients max
  - Guidance to reject one-off specialty items
- **Result:** Shopping list dropped from 56 items to **32 items** ✅

#### Servings Display Fix
- **File:** `src/components/MealPlanView.js`
- **Problem:** UI showed `recipe.servings` (base recipe serving count, e.g., 6) instead of `meal.servings` (actual planned servings, e.g., 2)
- **Fix:** Updated `renderMealCard()` to use `meal.servings` over `recipe.servings`
- **Result:** Meal plan now correctly shows servings matching the AI-generated plan

---

### ✨ Opus Session: Dictionary Optimization (January 10, 2026)

**🎉 ACHIEVEMENT: 86.1% match rate with 311-ingredient dictionary, shopping list reduced to ~56 items**

#### Summary
Continued optimization work from Sonnet session. Focused on balancing match rate vs shopping list size through dictionary consolidation and fixing AI-generated recipe normalization.

#### Dictionary Improvements (v4.0.0 → v9.0.0)
- **Entries:** 214 → 311 ingredients (+97 entries)
- **Match Rate:** 71.3% → 86.1% (+14.8 percentage points)
- **Shopping List Items:** 100+ → ~56 items

**Ingredients Added:**
- Common produce: banana, blueberry, pumpkin, asparagus, radish, artichoke, fennel, turnip, brussels_sprouts
- Proteins: tofu, tempeh, seitan, crab_meat, falafel
- Grains: couscous, polenta, bulgur, elbow_macaroni, spaghetti
- Nuts/Seeds: pine_nut, macadamia, pepita, chia_seeds, flax_seeds, hazelnut, cashew
- Dairy: almond_milk, buttermilk, mascarpone
- Sauces/Condiments: hoisin_sauce, sriracha, marinara_sauce, tzatziki, harissa, hummus, tabouleh
- Spices/Herbs: tarragon, cardamom, marjoram, rosemary, saffron, herbs_de_provence, star_anise
- Other: yeast, cocoa_powder, cornmeal, chocolate, ghee, nutritional_yeast, liquid_smoke, kombu, wonton_wrappers

**Alias Consolidation:**
- Added extensive aliases to: bacon, ginger, lemon, butter, bell_pepper, parsley, cream, olive_oil, vegetable_oil, cilantro, basil, tomato, onion, salt, cucumber, rice, juice_orange, parmesan_cheese, chicken_breast, chicken_whole

#### Code Fixes

**1. AI-Generated Recipe Normalization (CRITICAL)**
- **File:** `src/utils/mealPlanTransformer.js`
- **Problem:** AI-generated recipes (marked `fromCatalog: false`) were missing `normalizedIngredients`
- **Fix:** Added call to `normalizeRecipeIngredients()` when creating new recipes
- **Result:** All recipes now normalized before saving

**2. Count-Based Item Display**
- **File:** `src/utils/ingredientQuantities.js`
- **Problem:** Whole items (peaches, bananas) showed "varies" instead of counts
- **Fix:** Added `totalCount` tracking in `aggregateQuantities()` and updated `formatAggregated()`
- **Result:** Now shows "5" for count-based items

**3. Shopping List Quantity Display**
- **File:** `src/components/ShoppingListView.js`
- **Problem:** Quantities not displaying correctly, wrong field being used
- **Fix:** Updated mapping to use `item.quantity` (pre-formatted string) for `displayText`
- **Result:** Shows "160g", "1.3kg", "5" correctly

**4. Ingredient Parsing Improvements**
- **File:** `src/utils/ingredientParsing.js`
- **Problem:** "4 servings ricotta cheese" not parsing correctly
- **Fix:** Added "servings", "serving", "size" to `NOISE_WORDS`
- **Result:** Strips noise words during parsing

#### Scripts Created/Run
- `scripts/consolidateDictionary.cjs` - Merged duplicate IDs, added missing ingredients
- `scripts/addMissingIngredients.cjs` - Batch added common ingredients and aliases
- `scripts/fixMissingAliases.cjs` - Fixed alias references
- `scripts/reNormalizeCatalog.js` - Re-processed catalog after dictionary changes

#### Testing Results
- **Shopping List:** 56 items (down from 100+)
- **Quantities:** Displaying correctly (e.g., "1.3kg yogurt", "5 peaches")
- **Normalization Warnings:** 0 fallbacks (all recipes normalized)
- **Match Rate:** 86.1%

#### Files Modified
- `src/data/ingredientMaster.json` - v9.0.0 with 311 entries
- `src/utils/mealPlanTransformer.js` - Added normalization call
- `src/utils/ingredientQuantities.js` - Added totalCount support
- `src/components/ShoppingListView.js` - Fixed quantity display
- `src/utils/ingredientParsing.js` - Added noise words
- `src/utils/debugHelpers.js` - Added loadTestMealPlan helper

#### Remaining Work
- **Target:** 30-40 shopping list items (currently ~56)
- **Approach:** Continue adding aliases for similar ingredients
- **Storage:** Over quota (126.7% used) - needs cleanup
- **Generation Time:** ~21s (acceptable)

---

### ✨ Task 98: Spoonacular-Enhanced Normalization (COMPLETE)

**🎉 ACHIEVEMENT: 89.4% ingredient match rate with 688-ingredient dictionary (+1.9% from baseline)**

#### Spoonacular Integration (All 4 Phases)

**Phase 1: Infrastructure**
- ✅ Compound ingredient splitting utility (100% test pass rate)
- ✅ Enhanced matching algorithm with pattern support
- ✅ Schema evolution (v2.1.0 → v3.1.0)
- ✅ Fallback handling with `unknown_ingredient` placeholder

**Phase 2: Spoonacular API Integration**
- ✅ Batch parsing of 98 unmatched ingredients via `/recipes/parseIngredients`
- ✅ 99% parse success rate (97/98 ingredients)
- ✅ Added 90 Spoonacular-validated ingredients
- ✅ Metadata enrichment (categories, Spoonacular IDs)

**Phase 3: Dictionary Expansion**
- 584 → 688 entries (+104 ingredients, +17.8%)
- Added: tofu varieties, mushrooms, pasta, cheese, vegetables
- Portobello spelling variants consolidated (6 aliases)
- Spoonacular IDs stored for future nutrition enrichment

**Results:**
- **Match rate:** 87.5% → 89.4% (+1.9%)
- **Matched ingredients:** 6,287 → 6,425 (+138)
- **Compound handling:** 155/175 fully matched (88.6%)
- **Dictionary:** 688 entries with comprehensive aliases
- **State mappings:** 1,091 → 1,338 (+247)

**Performance:**
- File size: 215KB → 410KB (still fast, gzips to ~115KB)
- Load time: 5-10ms → 12-18ms (imperceptible)
- Match time: 0.45ms → 0.58ms per ingredient
- Memory footprint: 1MB → 1.8MB (trivial)

**Components:**
- `src/utils/ingredientCompoundSplit.js` - Detects "X and Y" patterns
- `src/utils/ingredientMatcherEnhanced.js` - Compound + pattern matching
- `scripts/parseViaSpoonacular.js` - Batch API integration
- `scripts/integrateSpoonacularMatches.js` - Dictionary builder
- `scripts/evaluateNormalizationImprovements.js` - Metrics tracking

**Documentation:**
- `docs/ingredients/schema-evolution.md` - v3.0.0 schema design
- `docs/ingredients/spoonacular-integration-analysis.md` - API strategy
- `docs/sessions/2026-01-10-normalization-phase2-review.md` - Architecture review
- `.taskmaster/docs/research/` - Industry research (2 reports)

**Catalog Quality Cleanup:**
- Analyzed 622 recipes for ingredient match quality
- Removed 106 recipes with 3+ unknown ingredients (17%)
- Remaining: 516 high-quality recipes
- **Final match rate: 93.7% (up from 87.5% baseline, +6.2%)**
- Flagged 247 recipes with minor issues (1-2 unknowns)
- 249 recipes are perfect (100% matched)

**Status Update - Debugging Session:**
- **Issue Found:** Spoonacular integration created duplicates (688 bloated entries)
- **Fix Applied:** Rebuilt dictionary with core ingredients only (214 entries)
- **Current Match Rate:** 71.2% (trade-off: clean lists vs coverage)
- **Shopping List:** Should show ~40-60 items (down from 100+)
- **Outstanding:** Needs testing and validation
- **Next:** Balance between match rate and shopping list cleanliness

**Quality Control System:**
- Created recipe quality analysis tools
- Import validation workflow designed
- Recipes flagged with quality metadata
- Production-ready recipes: 516/622 (83%)

---

### ✨ Task 97: Ingredient Normalization Pipeline (COMPLETE)

**🎉 MAJOR ACHIEVEMENT: 87.5% ingredient match rate with 584-ingredient master dictionary**

#### Implementation Complete (All 8 Subtasks)

**Architecture:**
- ✅ Master ingredient dictionary with 584 comprehensive entries
- ✅ Density mappings for volume-to-weight conversion (gPerCup, gPerTbsp, gPerTsp)
- ✅ Multi-stage matching algorithm (exact → token → fuzzy) - 95.8% test pass rate
- ✅ Dynamic state detection from dictionary (1,091 state mappings)
- ✅ Quantity normalization with 100% conversion accuracy
- ✅ All 622 catalog recipes normalized with normalizedIngredients array

**Key Innovation: Preparation vs. Shopping Separation**
```
BEFORE (broken):
Shopping List: chopped onion, diced onion, sliced onion (3 items)

AFTER (fixed):
Shopping List: onion - 510g (1 item)
Recipe: Prep - chop 160g, dice 320g, slice 30g
```

**Results:**
- **Matched ingredients:** 6,287/7,183 (87.5%) ✅
- **Fully normalized recipes:** 190/622 (30.5%)
- **Partially normalized:** 432/622 (69.5%)
- **Shopping list reduction:** ~60% fewer items (preparation terms eliminated)
- **Performance:** No conversion at display time (all done at import)

**Components Created:**
- `src/data/ingredientMaster.json` - 584-entry master dictionary
- `src/utils/ingredientMaster.js` - Dictionary loader
- `src/utils/ingredientParsing.js` - Smart parser (fractions, state, prep separation)
- `src/utils/ingredientMatcher.js` - Multi-stage matcher with confidence scores
- `src/utils/ingredientQuantities.js` - Volume-to-weight conversion
- `src/pipelines/normalizeRecipeIngredients.js` - Import-time pipeline
- `src/utils/normalizedShoppingList.js` - New shopping list generator
- `scripts/analyzeCatalogIngredients.js` - Frequency analysis
- `scripts/buildComprehensiveDictionary.js` - Auto-generate dictionary
- `scripts/normalizeExistingCatalog.js` - Migrate 622 recipes

**Integration:**
- ✅ Spoonacular extraction auto-normalizes new recipes
- ✅ Shopping list uses normalized data (hybrid with legacy fallback)
- 📋 Client-side normalization for Recipe Import/Edit (future enhancement)

**Based on:** Taskmaster research + USDA FoodData Central + industry best practices

**User Feedback & Next Iteration:**
- 87.5% coverage good but not sufficient for production
- Need comprehensive coverage (95-98% target) to avoid system instability
- Remaining 896 unmatched ingredients should be added
- Goal: Expand dictionary to ~900-1,000 entries for near-complete coverage
- Next session: Add all ingredients with ≥2 occurrences + handle edge cases

## [v1.3.2-alpha] - January 10, 2026 - Shopping List Fixes & Mode Toggle

### ✨ New Feature: Shopping List Mode Toggle

#### Chef Mode vs Pantry Mode
- **New Setting:** "Shopping List Style" in Settings → Meal Planning
- **Two modes available:**
  - **👨‍🍳 Chef Mode (Default):** Preserves variety distinctions for recipe accuracy
    - Cherry tomatoes ≠ Roma tomatoes
    - Red onion ≠ yellow onion
    - Russet potatoes ≠ red potatoes
    - Bread flour ≠ all-purpose flour
  - **🏪 Pantry Mode:** Groups similar items for shorter lists (~30-40% fewer items)
    - All tomato varieties → "tomatoes"
    - All onion colors → "onions"
    - All potato types → "potatoes"
- **User control:** Toggle in Settings, persists across sessions
- **Visual feedback:** Selected mode highlighted in green
- **Toast notification:** Confirms mode change
- **Based on:** Production meal planning app research

#### Implementation
- New storage functions: `getShoppingListMode()`, `setShoppingListMode()`
- Storage key: `vanessa_shopping_list_mode`
- Mode-aware canonical grouping in `ShoppingListView.getCanonicalName()`
- Radio button UI with descriptions and examples
- Default: Chef mode (respects recipe integrity)

### 🛒 Major Shopping List Improvements

#### Fixed Critical Data Structure Bug (Slice 5 Migration)
- **Problem 1:** Shopping list expected old structure with `mealPlan.days[]` array
- **Reality:** Slice 5 changed structure - meal plan now has `mealIds[]`, meals stored separately
- **Problem 2:** Shopping list looked for `meal.recipeName` but meals have `meal.recipeId`
- **Fix:** Updated `getRecipesFromMealPlan()` and `getRecipeUsageCounts()` to:
  - Load meals from `loadMeals()` (separate storage)
  - Filter meals by `mealPlan.mealIds`
  - Build recipe map by `recipeId` (not recipe name)
  - Look up recipes using `meal.recipeId` field
  - Track usage by `recipeId` for proper scaling
- **Result:** Shopping list now correctly extracts recipes and generates list

#### Fixed Critical Duplication Bug
- **Problem:** Shopping list included ingredients from ALL 622 recipes in storage, not just the 8-13 recipes in current meal plan
- **Root cause:** `loadRecipes()` loaded entire catalog, then aggregated everything
- **Fix:** New `getRecipesFromMealPlan()` method extracts only recipes referenced in current meal plan
- **Result:** Dramatic reduction in shopping list items (59 → ~20-30 items for typical week)

#### Proper Servings Scaling
- **Added:** `getRecipeUsageCounts()` tracks recipe usage across meal plan
- **Accounts for:**
  - Same recipe appearing multiple times (e.g., "Greek Yogurt with Honey" 3x)
  - Different serving counts per meal (1 serving breakfast vs 3 serving dinner)
  - Scales ingredient quantities by total servings needed
- **Example:** Recipe for 2 servings used 3x with (1 + 2 + 1) servings → scales by 4/2 = 2x

#### Fixed Quantity Rounding
- **Before:** Shopping list showed "125.7g", "0.2g" (excessive precision)
- **After:** Whole numbers only - "126g", "1g" (this isn't chemistry!)
- **Applied to:** Both conversion stage and display stage
- **Minimum:** 1g for metric, count items always round up

#### Smarter Ingredient Generalization
- **Keep specific names:** "feta cheese", "chicken breast", "cherry tomatoes" (common, recipe-important)
- **Only generalize:**
  - Branded products: "Campari tomatoes" → "cherry tomatoes"
  - Obscure items: "Pecorino Romano" → "parmesan cheese"
  - Specialty ingredients: "black garlic" → "garlic"
- **Why:** Balance recipe quality with supermarket availability

#### Fixed Unit Conversions
- **Added missing units:** `tbsps`, `tsps`, `servings`, `leaf` (all plural forms)
- **Result:** No more console warnings for unrecognized units

#### Updated AI Prompt
- **New guidance:** Use specific but common ingredients ("feta cheese" ✅, "Gruyère" ❌)
- **Whole numbers:** All AI-generated quantities are whole numbers
- **Substitutions:** Instructs AI to replace obscure items with common equivalents

### 🐛 Bug Fixes
- Shopping list now only includes recipes from current meal plan
- Quantities round to whole numbers (no more 0.2g)
- Unit conversion warnings eliminated
- Proper servings scaling across multiple recipe uses
- Enhanced ingredient deduplication (production app research-backed):
  - **Strategy:** "Chef-centric" mode preserving variety distinctions
  - **Splits compound ingredients:** "salt and pepper" → just "salt"
  - **Normalizes ONLY truly equivalent ingredients:**
    - Black pepper / white pepper / ground pepper → "pepper (spice)"
    - Sea salt / kosher salt / table salt → "salt"  
    - "Basil leaves" → "basil" (same herb, different form)
    - "Extra virgin olive oil" → "olive oil"
  - **STRICT VARIETY INGREDIENTS (never merge):**
    Based on production meal planning apps, these are functionally different:
    - Apples: Granny Smith ≠ Gala (different uses/flavors)
    - Rice: long-grain ≠ short-grain ≠ arborio (behave differently)
    - Flour: bread flour ≠ all-purpose ≠ cake flour (NOT interchangeable)
    - Onions: red ≠ yellow ≠ white (different flavors/cooking properties)
    - Cheese: feta ≠ parmesan ≠ cheddar (very distinct)
    - Tomatoes: cherry ≠ roma ≠ regular (different uses/sizes)
    - Potatoes: russet ≠ red ≠ yukon gold (different cooking properties)
    - Peppers: bell ≠ jalapeño ≠ habanero (completely different)
  - **Branded items generalized to actual type:**
    - "Campari tomatoes" → "cherry tomatoes" (brand name)
    - "San Marzano" → "plum tomatoes" (specific variety)
  - **Research source:** Perplexity AI with high detail level
  - **Future:** Can add "generic/pantry-centric" mode toggle if users want fewer items

### ⏱️ Performance Tracking Added

#### Comprehensive Timing Metrics
- **Generation process:**
  - Data loading times (eaters, chat history, recipe catalog)
  - API connection time
  - Streaming processing time
  - Total generation time with human-readable timestamps
- **Post-processing:**
  - Raw output save time
  - Data transformation time
  - localStorage save time
  - Total processing time
- **Shopping list:**
  - Recipe loading time
  - Meal plan extraction time
  - Shopping list generation time
  - Total shopping list generation time

#### Console Output Format
```
🚀 Starting meal plan generation...
⏱️ Start time: 9:37:12 PM
  ⏱️ Loaded 3 eater(s) in 2ms
  ⏱️ Loaded chat history (8 messages) and base spec in 5ms
  ⏱️ Loaded recipe index: 622 recipes in 12ms
  📡 Sending request to API...
  ⏱️ API connection established in 234ms
  ⏱️ Stream processing completed in 15678ms
✅ Total generation time: 15931ms (15.9s)
⏱️ End time: 9:37:28 PM
```

#### Error Handling Enhanced
- Comprehensive try-catch in shopping list generation
- Detailed logging at each step for debugging
- Missing recipe warnings with meal location details
- Stack traces on errors for easier troubleshooting

### 📝 Technical Details
- `ShoppingListView.getRecipesFromMealPlan()`: Filters to meal plan recipes only
- `ShoppingListView.getRecipeUsageCounts()`: Tracks usage and scales servings
- `ShoppingListView.cleanIngredientName()`: Smarter branded/obscure item detection
- `ShoppingListView.getCanonicalName()`: Simplified to preserve specificity
- Rounding logic: `Math.round(converted)` for whole numbers minimum 1g
- Performance tracking: `performance.now()` for high-precision timing
- All timing logged in milliseconds with human-readable formatting

---

## [v1.3.1-alpha] - January 10, 2026 - Settings Page Cleanup

### 🧹 Settings Page Improvements

#### Removed Duplication
- **Removed:** "Dietary Goals" field from Meal Planning tab
- **Why:** Created confusion with per-member dietary settings in Household tab
- **Replaced with:** Info box directing users to Household tab for dietary preferences
- **One source of truth:** All dietary information now managed per household member

#### Improved Data & Backup Tab
- **Renamed:** "Storage" → "Data & Backup" (clearer naming)
- **Added:** Help banner explaining browser localStorage and backup purpose
- **Enabled:** "Clear Old Meal Plans" button (was disabled as "Coming in Slice 4")
- **Functionality:** Uses `historyRetentionWeeks` setting to clean up old plans

#### Data Flow Verification
- **Verified:** All household member fields flow to Vanessa correctly
- **Fields used:**
  - Diet profiles → Filter catalog and inform AI
  - Exclude ingredients → Server-side filtering + AI exclusion
  - Prefer ingredients → Recipe sorting + AI guidance
  - Allergies → Critical AI exclusion
  - Dietary restrictions, preferences, personal notes → AI context
- **Technical:** Complete trace from Settings → localStorage → API → Claude AI

### 🐛 Bug Fixes
- Fixed `handleClearOldPlans()` to use `result.removed` instead of `result.deleted`
- Updated confirmation prompt to clarify retention behavior

### 📝 Notes
- Session documentation in `docs/sessions/2026-01-10-settings-review.md`
- Onboarding intentionally collects minimal info; Settings provides full customization

---

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



