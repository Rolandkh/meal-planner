# Ingredient Catalog Enhancement - January 10, 2026

## Session Goal
Expand the ingredient catalog system to support comprehensive nutrition tracking, pricing, and cooking method awareness for recipe normalization and meal planning.

---

## ✅ Completed Work (Tasks 1-5)

### Task 1: Schema Expansion ✅

**What Was Done:**
- Updated `ingredientMaster.json` schema to v10.0.0
- Added three major new field groups:
  1. `pricing` - Price per retail unit in AUD (Melbourne)
  2. `nutritionBase` - Complete nutrition data per 100g (raw state)
  3. `nutritionByPreparation` - Cooking method multipliers for 7 methods

**Files Modified:**
- `src/data/ingredientMaster.json` - Schema structure updated
- `docs/ingredients/master-dictionary.md` - Complete documentation with examples

**Schema Changes:**
```typescript
{
  // ... existing fields ...
  
  "pricing": {
    "averagePrice": number,
    "unit": string,
    "unitSize": string,
    "currency": "AUD",
    "region": "Melbourne, VIC, Australia",
    "lastUpdated": string,
    "source": string,
    "notes": string
  },
  
  "nutritionBase": {
    "per100g": {
      calories, protein, carbs, fat, fiber, sugar, saturatedFat,
      sodium, cholesterol,
      vitamins: { all vitamins from Spoonacular },
      minerals: { all minerals from Spoonacular }
    },
    "source": "spoonacular",
    "spoonacularId": number,
    "lastUpdated": string
  },
  
  "nutritionByPreparation": {
    "raw": { multipliers, notes },
    "grilled": { multipliers, notes },
    "baked": { multipliers, notes },
    "fried": { multipliers, notes, oilAbsorption },
    "boiled": { multipliers, notes },
    "steamed": { multipliers, notes },
    "air-fried": { multipliers, notes, oilAbsorption }
  }
}
```

---

### Task 2: Spoonacular Integration ✅

**What Was Done:**
- Created comprehensive Spoonacular API integration utilities
- Built both browser-compatible (ES6) and Node.js (CommonJS) versions
- Implemented nutrition data fetching, transformation, and batch processing

**New Files:**
- `src/utils/spoonacularNutrition.js` - Browser/ES6 version
- `scripts/spoonacularNutrition.cjs` - Node.js/CommonJS version

**Key Functions:**
- `searchIngredient(name, apiKey)` - Find Spoonacular ID by name
- `getIngredientNutrition(id, apiKey)` - Get full nutrition data per 100g
- `getNutritionByName(name, apiKey)` - Combined search + fetch
- `batchFetchNutrition(names[], apiKey)` - Batch process with rate limiting
- `getCookingMethodVariants(name, apiKey)` - Fetch raw + cooked versions
- `calculateMultipliers(raw, cooked)` - Calculate nutrition change ratios

**API Key:**
- Already configured in environment (`SPOONACULAR_API_KEY`)
- Free tier: 150 requests/day (sufficient for 200 ingredients over ~2 days)

---

### Task 3: Preparation Multipliers Research ✅

**What Was Done:**
- Researched nutrition changes during cooking from multiple sources
- Created comprehensive multiplier database with 7 cooking methods
- Built utility to apply multipliers to base nutrition data
- Added ingredient-type-specific adjustments (meat vs vegetables vs fish)

**New Files:**
- `references/nutrition-multipliers.json` - Research-backed multiplier database
- `src/utils/nutritionMultipliers.js` - Multiplier application utilities

**Cooking Methods Covered:**
1. **Raw** (baseline 1.0)
2. **Grilled** (~15% water loss, fat renders out)
3. **Baked** (~10% water loss, gentler than grilling)
4. **Fried** (major oil absorption: 10-20g per 100g)
5. **Boiled** (water-soluble vitamin loss, nutrient leaching)
6. **Steamed** (minimal changes, best vitamin preservation)
7. **Air-fried** (moderate oil: 2-5g per 100g)

**Key Principles:**
- Water loss → nutrient concentration (multiplier > 1.0)
- Fat rendering → fat decrease (multiplier < 1.0)
- Oil absorption → fat/calorie increase (multiplier > 1.0)
- Heat-sensitive vitamins → degradation (multiplier < 1.0)
- Minerals → mostly stable

**Research Sources:**
- USDA FoodData Central (raw vs cooked comparisons)
- Spoonacular API (cooked variants)
- Nutrition research studies
- Culinary science references

---

### Task 4: Pricing Data Collection ✅

**What Was Done:**
- Created interactive pricing collection tool
- Built CSV template for pricing data
- Designed workflow for Coles/Woolworths price research

**New Files:**
- `scripts/collectPricingData.cjs` - Interactive collection tool
- `references/pricing-template.csv` - Template with example data

**Pricing Workflow:**
1. Run collection tool: `node scripts/collectPricingData.cjs`
2. Tool guides you through each ingredient
3. Look up prices on Coles and Woolworths websites
4. Enter prices, units, and notes
5. Tool calculates averages and saves to JSON
6. Use saved file with enrichment script

**Data Collected:**
- Average price (AUD)
- Retail unit (kg, L, pack, bunch, etc.)
- Unit size description
- Individual Coles/Woolworths prices
- Optional notes
- Melbourne, VIC region
- Timestamp

**Tool Features:**
- Progress tracking (current/total)
- Skip ingredients
- Save progress anytime
- Resume from any ingredient #
- Automatic averaging

---

### Task 5: Catalog Enrichment Script ✅

**What Was Done:**
- Created comprehensive automated enrichment script
- Supports batch processing with range selection
- Includes progress tracking, error handling, and statistics
- Generates backup before making changes

**New File:**
- `scripts/enrichIngredientCatalog.cjs` - Main enrichment script

**Script Features:**

**Command Line Options:**
```bash
# Basic usage
node scripts/enrichIngredientCatalog.cjs

# With pricing file
node scripts/enrichIngredientCatalog.cjs --pricing=tmp/pricing-data-123.json

# Process range of ingredients
node scripts/enrichIngredientCatalog.cjs --start=0 --end=50

# Skip nutrition (pricing only)
node scripts/enrichIngredientCatalog.cjs --skip-nutrition

# Custom API rate limit delay
node scripts/enrichIngredientCatalog.cjs --delay=2000
```

**What It Does:**
1. Creates backup of current catalog (v9.0.1)
2. Loads pricing data if provided
3. For each ingredient:
   - Fetches nutrition from Spoonacular
   - Generates 7 cooking method variants
   - Adds pricing data (if available)
   - Applies ingredient-type-specific multipliers
4. Updates catalog version to v10.0.0
5. Saves enriched catalog
6. Prints comprehensive statistics

**Statistics Tracked:**
- Total processed
- Already enriched (skipped)
- Nutrition added
- Nutrition failed
- Preparation variants added
- Pricing added
- Pricing missing

**Safety Features:**
- Automatic backup before changes
- Idempotent (won't re-enrich already enriched ingredients)
- Validates API key before starting
- Rate limiting between API calls
- Error handling with detailed logging

---

## 🎯 What This Enables

### For Recipe Import:
- Normalize all ingredients to known catalog entries
- Prompt user when ingredient not recognized
- Collect complete data (nutrition + price) for new ingredients
- Ensure all recipes have consistent, complete ingredient data

### For Meal Planning:
- Calculate accurate nutrition per serving
- Adjust nutrition based on cooking method
- Estimate meal plan costs (total and per day)
- Support budget-aware meal plan generation
- Enable personalized diet tracking

### For Shopping Lists:
- Show accurate cost estimates
- Display prices per retail unit
- Enable price comparison features
- Support budget management

### For Health Tracking:
- Complete micronutrient tracking
- Cooking method impact on nutrition
- Diet compatibility scoring
- Personalized nutrition goals

---

## 📋 Next Steps (Tasks 6-11)

### Remaining Import Pipeline Tasks:

**Task 6: Ingredient Normalization API**
- Create `/api/normalize-ingredients` endpoint
- Match recipe ingredients to catalog
- Calculate confidence scores
- Flag unmatched for user review

**Task 7: User Review UI**
- Modal for unrecognized ingredients
- Smart suggestions from catalog
- "Add new ingredient" workflow

**Task 8: Ingredient Addition Flow**
- Collect metadata from user
- Research nutrition via Spoonacular
- Research pricing (optional AI assist)
- Generate preparation variants
- Add to master catalog

**Task 9: Instruction Enhancement**
- Parse recipe instructions
- Identify ingredient mentions
- Insert quantities inline
- Add helpful equivalents

**Task 10: Recipe Formatting**
- Standardize step numbering
- Add spacing between steps
- Bold ingredient mentions
- Consistent tense and style

**Task 11: Integrated Import Flow**
- Wire all components together
- End-to-end recipe import with normalization
- User review when needed
- Enhanced instructions
- Complete recipe storage

---

## 🔧 How to Use (Current State)

### To Enrich the Current 200 Ingredients:

**Step 1: Collect Pricing Data (Manual)**
```bash
node scripts/collectPricingData.cjs
# Follow prompts to research and enter prices
# This saves to tmp/pricing-data-[timestamp].json
```

**Step 2: Run Enrichment (Automated)**
```bash
# With pricing file
node scripts/enrichIngredientCatalog.cjs --pricing=tmp/pricing-data-123456.json

# Or without pricing (nutrition only)
node scripts/enrichIngredientCatalog.cjs
```

**Step 3: Review Results**
- Check console output for statistics
- Review any failed ingredients
- Backup is at `src/data/ingredientMaster.v9.0.1.backup.json`
- Enriched catalog is at `src/data/ingredientMaster.json` (v10.0.0)

### To Process in Batches:

```bash
# First 50 ingredients
node scripts/enrichIngredientCatalog.cjs --start=0 --end=50

# Next 50 ingredients
node scripts/enrichIngredientCatalog.cjs --start=50 --end=100

# Remaining ingredients
node scripts/enrichIngredientCatalog.cjs --start=100 --end=200
```

**Why Batch Processing?**
- Spoonacular free tier: 150 requests/day
- 200 ingredients = 2 days of API calls
- Can pause and resume
- Reduces risk of data loss

---

## 📊 Expected Results

After full enrichment:
- **200 ingredients** with complete data
- **Base nutrition** from Spoonacular for ~180-190 ingredients
- **7 cooking methods** per ingredient with multipliers
- **Pricing data** for all 200 (if collected manually)
- **Ready for recipe normalization** import flow

Time Estimate:
- **Pricing collection:** 4-6 hours (manual research)
- **Nutrition fetching:** 200-300 minutes (automated, spread over 2 days due to API limits)
- **Total:** ~6-8 hours of active work, 2 days elapsed

---

## 🎉 Achievement Summary

**5 out of 11 tasks complete!**

✅ Schema expansion
✅ Spoonacular integration  
✅ Preparation multipliers research
✅ Pricing collection tooling
✅ Catalog enrichment automation

**What's Ready:**
- Complete data model for ingredients
- All utilities and scripts for enrichment
- Documentation for every new feature
- Research-backed cooking multipliers
- Interactive tools for data collection

**What's Next:**
- Build import pipeline (Tasks 6-11)
- Actually run enrichment on 200 ingredients
- Test normalization flow
- Create user review interface
- Wire it all together!

---

## 📚 Documentation Created

- `docs/ingredients/master-dictionary.md` - Complete schema documentation
- `references/nutrition-multipliers.json` - Multiplier database with research notes
- `references/pricing-template.csv` - Pricing data template
- `docs/CHANGELOG.md` - v10.0.0 release notes
- This file - Session summary

---

**Session Duration:** ~2 hours  
**Files Created:** 8 new files  
**Files Modified:** 3 files  
**Lines of Code:** ~1,500 lines  
**Documentation:** ~600 lines  

**Status:** Phase 1 (Data Foundation) Complete ✅  
**Next:** Phase 2 (Import Pipeline) - Ready to begin
