# Handoff Document for Opus Chat
**Date:** January 10, 2026  
**Context:** Ingredient normalization system debugging  
**Current State:** System functional but needs optimization

---

## 🎯 What We're Trying to Achieve

**Goal:** Shopping lists with ~30-40 items (currently showing ~100)

**Core Requirement:**
- Aggregate duplicate ingredients ("olive oil" + "virgin olive oil" → ONE item)
- Use normalized masterIngredientIds for deduplication
- Shopping list shows "what you BUY" not "exact recipe wording"

---

## 📊 Current Status

### Dictionary
- **Version:** 4.0.0
- **Entries:** 214 (core ingredients only)
- **Strategy:** Keep only ingredients used ≥5× + essentials
- **Location:** `src/data/ingredientMaster.json`

### Catalog
- **Recipes:** 516 (cleaned, removed 106 problematic ones)
- **Match Rate:** 71.2% (lower due to smaller dictionary)
- **Normalized:** All recipes have normalizedIngredients with quantities

### Shopping List
- **Expected:** ~40-60 items
- **Last Seen:** 100+ items
- **Status:** Needs browser testing after latest fixes

---

## 🔑 Key Insight

**THE FUNDAMENTAL PROBLEM:**

Spoonacular integration created TOO MANY ingredient IDs instead of using ALIASES:

```javascript
// WRONG (what happened):
ingredients = {
  "greek_yogurt": { ... },
  "nonfat_greek_yogurt": { ... },     // NEW ID
  "lowfat_greek_yogurt": { ... },     // NEW ID  
  "vanilla_yogurt": { ... }            // NEW ID
}
// Result: 4 shopping list items ❌

// CORRECT (what should happen):
ingredients = {
  "greek_yogurt": {
    aliases: [
      "greek yogurt",
      "nonfat greek yogurt",
      "lowfat greek yogurt",
      "non-fat greek yogurt",
      "low-fat greek yogurt"
    ]
  }
}
// Result: 1 shopping list item ✅
```

---

## 🔧 What Was Fixed (This Session)

### Code Fixes
1. ✅ ShoppingListView.js - Missing closing brace
2. ✅ ingredientMaster.js - Browser compatibility (removed fs/path)
3. ✅ normalizeRecipeIngredients.js - Object format handling
4. ✅ ShoppingListView.js - Data structure mapping

### Dictionary Fixes
1. ✅ Removed 106 bad recipes from catalog
2. ✅ Consolidated olive oil, yogurt, cheese variations
3. ✅ Removed "salt_and_pepper" compound (should be split)
4. ✅ Removed vague items ("seasoning", "ore")
5. ✅ Trimmed to 214 core ingredients

### Scripts Created
- `scripts/analyzeRecipeQuality.js`
- `scripts/removeProblematicRecipes.js`
- `scripts/consolidateDictionaryVariations.js`
- `scripts/fixDictionaryDuplicates.js`
- `scripts/buildCleanCoreDictionary.js`
- `scripts/reNormalizeCatalog.js`

---

## ⚠️ What Still Needs Work

### Issue #1: Match Rate vs Shopping List Size Trade-Off

**Current Situation:**
- 214 ingredients = clean lists but 71.2% match rate
- 688 ingredients = 93.7% match rate but 100+ shopping items

**The Balance:**
Need to find sweet spot:
- **~250-300 ingredients** 
- **90%+ match rate**
- **~30-40 shopping list items**

**How to Achieve:**
- Add back ~50-100 common ingredients (used 2-4×)
- Use AGGRESSIVE alias consolidation
- Map Spoonacular results to existing ingredients FIRST

### Issue #2: Client-Side Normalization

**Problem:**
AI-generated recipes in meal plans aren't normalized (6 recipes showing fallback warnings)

**Solution:**
Add normalization to recipe creation:
```javascript
// When AI generates recipe:
const recipe = parseAIResponse(response);
const normalized = normalizeRecipeIngredients(recipe);
saveRecipe(normalized);  // Save with normalizedIngredients
```

**Location:** GenerationStatusPage.js or mealPlanTransformer.js

### Issue #3: Serving Counts Wrong

**Separate from ingredient normalization**
- Saturday lunch: 4 servings (should be 1)
- Random servings throughout week
- Check: mealPlanTransformer.js serving calculation logic

### Issue #4: Storage Over Quota

**Warning:** 135% of 5MB used
- May cause localStorage failures
- Need to clear old data or optimize
- Catalog is 4.7MB (too large)

---

## 🎯 Recommended Approach for Opus

### Option A: Balanced Dictionary (Recommended)

**Goal:** 90% match + 30-40 shopping items

**Steps:**
1. Start with current 214 core
2. Add back 50-100 ingredients used 2-4× in catalog
3. For each addition, check similarity to existing:
   - If similar → add as ALIAS
   - If unique → add as NEW
4. Re-normalize catalog
5. Test shopping list

**Expected:** 250-300 ingredients, 90% match, ~35 shopping items

---

### Option B: Fix Spoonacular Integration Properly

**Rebuild integration script:**

```javascript
// For each Spoonacular match:
const spoonName = spoonacular.name.toLowerCase();

// 1. Check for similar existing ingredient
const similar = findSimilarIngredient(spoonName, dictionary);

if (similar && similarity > 0.8) {
  // Add as alias to existing
  dictionary[similar.id].aliases.push(spoonName);
} else {
  // Truly unique - add as new
  dictionary[newId] = { ... };
}
```

**Key:** Match to existing FIRST, create new ONLY if needed

---

### Option C: Hybrid Approach

**Combine both:**
1. Use current 214 core
2. Add missing essentials manually (~30 ingredients)
3. Implement client-side normalization
4. Add Spoonacular fallback API for unknowns (server-side)

---

## 📚 Important Files

### To Review
- `src/data/ingredientMaster.json` - Current dictionary (214 entries)
- `src/data/vanessa_recipe_catalog.json` - 516 recipes, normalized
- `src/utils/normalizedShoppingList.js` - Shopping list generator
- `src/components/ShoppingListView.js` - UI rendering

### Documentation
- `docs/sessions/2026-01-10-ingredient-normalization.md` - Full history
- `docs/sessions/2026-01-10-continuation-summary.md` - This session
- `docs/ingredients/spoonacular-integration-analysis.md` - API research

### Backups (If Needed)
- `tmp/dictionary_before_comprehensive_fix.json` - Dictionary at 654 entries
- `tmp/catalog_backup_before_cleanup.json` - Original 622 recipes
- `tmp/catalog_before_renormalization.json` - Before latest normalization

---

## 🧪 Testing Checklist

**After making changes, test:**

1. **Shopping List Size**
   ```
   Navigate to /shopping-list
   Count items - should be ~30-50
   ```

2. **No Duplicates**
   ```
   Check for: olive oil + virgin olive oil (should be ONE)
   Check for: ricotta + ricotta cheese (should be ONE)
   Check for: Greek yogurt variations (should be ONE)
   ```

3. **Quantities Present**
   ```
   Items should show "160g" or "250ml" (not "undefined")
   ```

4. **Aggregation Working**
   ```
   Same ingredient across multiple recipes should combine
   ```

5. **Performance**
   ```
   Shopping list generates in <100ms
   No browser lag
   ```

---

## 💡 Quick Fixes to Try

### If match rate too low (71.2%):
```bash
# Add back medium-frequency ingredients
node -e "
const catalog = require('./src/data/vanessa_recipe_catalog.json');
const usage = new Map();
catalog.recipes.forEach(r => {
  if (r.normalizedIngredients) {
    r.normalizedIngredients.forEach(ing => {
      usage.set(ing.masterIngredientId, (usage.get(ing.masterIngredientId) || 0) + 1);
    });
  }
});

const freq2to4 = Array.from(usage.entries())
  .filter(([id, count]) => count >= 2 && count <= 4)
  .sort((a, b) => b[1] - a[1]);

console.log('Ingredients used 2-4 times:', freq2to4.length);
console.log('Top 30:', freq2to4.slice(0, 30).map(([id, count]) => \`\${id} (\${count}×)\`).join(', '));
"
```

### If shopping list still has duplicates:
```bash
# Check for duplicate masterIngredientIds
node -e "
const catalog = require('./src/data/vanessa_recipe_catalog.json');
const ids = new Map();

catalog.recipes.forEach(r => {
  if (r.normalizedIngredients) {
    r.normalizedIngredients.forEach(ing => {
      const display = ing.displayName;
      if (!ids.has(display)) ids.set(display, new Set());
      ids.get(display).add(ing.masterIngredientId);
    });
  }
});

// Find displayNames with multiple IDs
Array.from(ids.entries())
  .filter(([display, idSet]) => idSet.size > 1)
  .forEach(([display, idSet]) => {
    console.log(\`\${display}: \${Array.from(idSet).join(', ')}\`);
  });
"
```

---

## ✅ What's Ready

- ✅ All code syntax valid
- ✅ Browser compatibility fixed
- ✅ Catalog re-normalized with quantities
- ✅ Dictionary trimmed to core (214 entries)
- ✅ Recipe quality cleanup (106 removed)
- ✅ Comprehensive documentation
- ✅ Multiple backups for rollback

---

**Handoff Status:** 🟢 Ready for Opus  
**Priority:** Optimize dictionary size vs match rate trade-off  
**Goal:** 90% match + 30-40 shopping list items
