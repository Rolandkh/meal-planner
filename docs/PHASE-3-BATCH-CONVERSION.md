# Phase 3: Batch Recipe Conversion

**Status:** Ready to Execute  
**Date:** January 11, 2026

---

## Overview

Phase 3 converts all 516 recipes from flat ingredient lists to structured process graphs with calculated components, yields, costs, and nutrition.

---

## What Gets Generated

For each recipe, we create:

### 1. Process Graph
```json
{
  "processSteps": [
    {
      "stepNumber": 1,
      "processes": [
        { "processId": "dice", "ingredients": ["onion"], "durationMinutes": 3 }
      ]
    }
  ]
}
```

### 2. Components
```json
{
  "components": [
    {
      "id": "comp_12345_step2",
      "name": "caramelized onions",
      "sourceIngredients": [...],
      "processes": [...],
      "calculated": {
        "costAUD": 2.50,
        "nutrition": {...},
        "prepTimeMin": 25
      },
      "prepAhead": {
        "canStore": true,
        "shelfLifeHours": 120
      }
    }
  ]
}
```

### 3. Calculated Metrics
- Total recipe cost
- Cost per serving
- Nutrition per serving (post-cooking)
- Total prep time
- Prep-ahead opportunities
- Reusable components

---

## Batch Conversion Script

**File:** `scripts/batch-convert-recipes.js`

### Features

✅ **Progress Tracking** - Resume if interrupted  
✅ **Incremental Saving** - Save every 10 recipes  
✅ **Error Collection** - Track failures for analysis  
✅ **Statistics** - Cost/nutrition accuracy across all recipes  
✅ **Process Usage** - Identify most common processes  
✅ **Pattern Detection** - Find systematic issues

### Usage

```bash
# Convert all 516 recipes
node scripts/batch-convert-recipes.js

# Convert first 50 recipes (test run)
node scripts/batch-convert-recipes.js --limit=50

# Start from recipe 100
node scripts/batch-convert-recipes.js --start=100

# Resume from last progress
node scripts/batch-convert-recipes.js --resume
```

---

## Time & Cost Estimates

### For Full Catalog (516 recipes)

**Time:**
- Processing: ~30 seconds/recipe
- Total: **4-5 hours**
- With 1.5s delays for API rate limiting

**API Cost:**
- Model: Claude Sonnet 4
- Per recipe: ~$0.02-0.06
- Total: **$10-30**

**Recommendation:** Run in batches or overnight

### For Test Run (50 recipes)

**Time:** ~30-45 minutes  
**Cost:** ~$1-3  
**Use:** Validate system before full run

---

## Output Files

### During Conversion

```
test-output/
├── batch-conversion-progress.json    # Resume state
├── converted-recipes/
│   ├── recipe-0-715769.json
│   ├── recipe-1-664737.json
│   └── ...                           # All converted recipes
└── batch-conversion-stats.json       # Final statistics
```

### Progress File Format

```json
{
  "lastProcessed": 125,
  "totalProcessed": 126,
  "successful": 119,
  "failed": 7,
  "startedAt": "2026-01-11T...",
  "lastUpdated": "2026-01-11T...",
  "errors": [...]
}
```

---

## Expected Results

Based on 30-recipe validation:

### Cost Accuracy
- ✅ **87% within $1-15/serving**
- ✅ **73% within $1-10/serving**
- ✅ Average: ~$7/serving

### Nutrition Accuracy
- ✅ **77% within ±30%**
- ✅ **63% within ±20%**
- ✅ **43% within ±10%**

### Process Success
- ✅ **~95-98% parse success rate**
- ✅ **100% component generation** (with warnings for some)

---

## After Batch Conversion

### Immediate Analysis

1. **Review `batch-conversion-stats.json`**
   - Overall accuracy metrics
   - Process usage frequency
   - Common error patterns

2. **Identify Systematic Issues**
   - Ingredients missing from database (affecting 10+ recipes)
   - Unit conversions needed (affecting 10+ recipes)
   - Process parsing patterns

3. **Extract Rules** (Phase 2.8)
   - Common process sequences
   - Ingredient→process mappings
   - Create rule-based parser for common cases

### High-ROI Fixes

After batch conversion, prioritize fixes that affect many recipes:
- If 50 recipes missing "phyllo dough" → Add it (high ROI)
- If 100 recipes have "bunch" unit issues → Fix it (high ROI)  
- If 5 recipes have exotic ingredients → Document as limitation (low ROI)

---

## Interruption Handling

The script saves progress every 10 recipes. If interrupted:

1. **Check progress:**
   ```bash
   cat test-output/batch-conversion-progress.json
   ```

2. **Resume:**
   ```bash
   node scripts/batch-convert-recipes.js --resume
   ```

3. **Or restart from specific point:**
   ```bash
   node scripts/batch-convert-recipes.js --start=150
   ```

---

## Performance Optimization

### Current Settings
- Delay: 1.5s between recipes (conservative)
- Batch size: 1 recipe at a time
- Model: Claude Sonnet 4 (accurate, moderate cost)

### If You Have Higher API Limits
Edit the script to:
- Reduce delay to 500ms
- Increase batch size (parallel processing)
- Could reduce 4-5 hours to 1-2 hours

---

## Success Criteria

Phase 3 is complete when:
- ✅ 500+ recipes converted (>95% success rate)
- ✅ Cost accuracy maintains ~85%+
- ✅ Nutrition accuracy maintains ~75%+
- ✅ Error patterns documented
- ✅ Statistics file generated

---

## Next Phase

**Phase 4: Rule Extraction & Hybrid Parser**
- Analyze the 500+ converted recipes
- Identify common process patterns
- Create rule-based shortcuts
- Reduce API dependency for common recipes
- Improve speed and reduce cost

---

## Monitoring During Conversion

Watch for:
- Progress bar updating smoothly
- Success rate staying >90%
- No repeated API errors
- Files appearing in `converted-recipes/`

If issues occur:
- Script saves progress automatically
- Can resume without losing work
- Errors are logged for review

---

**Ready to begin Phase 3!** 🚀

Choose your approach:
1. **Test run**: 50 recipes (~30 min, $2-3)
2. **Full run**: 516 recipes (~4-5 hrs, $25-50)
3. **Overnight**: Full run in background
