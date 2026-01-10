# Recipe Import Validation Workflow
**Date:** January 10, 2026  
**Purpose:** Quality control for new recipe additions

---

## 🎯 Goal

Prevent recipes with unintelligible or unavailable ingredients from entering the catalog or being recommended in meal plans.

---

## 📋 Validation Flow

### Step 1: Parse All Ingredients

When a recipe is imported (Spoonacular, manual, or URL extraction):

```javascript
import { parseIngredient } from './utils/ingredientParsing.js';
import { matchIngredientEnhanced } from './utils/ingredientMatcherEnhanced.js';

function validateRecipeIngredients(recipe) {
  const results = {
    total: 0,
    matched: 0,
    compounds: 0,
    unknown: [],
    malformed: [],
    quality: 'excellent',
    canAddToCatalog: true,
    canRecommendInPlans: true,
    warnings: []
  };
  
  recipe.ingredients.forEach(rawIng => {
    const rawText = typeof rawIng === 'string' ? rawIng : rawIng.name;
    
    // Check for malformed
    if (!rawText || rawText.trim().length < 2) {
      results.malformed.push({ raw: rawText, issue: 'empty_or_invalid' });
      results.total++;
      return;
    }
    
    results.total++;
    
    // Parse and match
    const parsed = parseIngredient(rawText);
    const match = matchIngredientEnhanced(parsed.identityText, parsed.state);
    
    if (match.status === 'matched') {
      results.matched++;
    } else if (match.status === 'compound') {
      results.compounds++;
      results.matched++; // Count as matched
    } else if (match.status === 'partial_compound') {
      // Some components unknown
      const unknownComponents = match.matches.filter(m => !m.masterId);
      results.unknown.push({
        raw: rawText,
        identity: parsed.identityText,
        unknownComponents: unknownComponents.map(c => c.componentText)
      });
    } else {
      // Completely unknown
      results.unknown.push({
        raw: rawText,
        identity: parsed.identityText
      });
    }
  });
  
  // Determine quality tier
  const unknownCount = results.unknown.length + results.malformed.length;
  
  if (unknownCount === 0) {
    results.quality = 'excellent';
    results.canAddToCatalog = true;
    results.canRecommendInPlans = true;
  } else if (unknownCount <= 2 && results.total > 5) {
    results.quality = 'good';
    results.canAddToCatalog = true;
    results.canRecommendInPlans = true;
    results.warnings.push(`${unknownCount} unknown ingredient(s) - user should be notified`);
  } else if (unknownCount >= 3 || (unknownCount >= 1 && results.total <= 5)) {
    results.quality = 'poor';
    results.canAddToCatalog = false; // Private only
    results.canRecommendInPlans = false;
    results.warnings.push(`Too many unknown ingredients (${unknownCount}/${results.total}) - not suitable for catalog`);
  }
  
  return results;
}
```

---

## 🚦 Quality Tiers

### ✅ Excellent (100% matched)
- **Criteria:** All ingredients recognized
- **Action:** Add to catalog, enable for meal plans
- **User notification:** None needed
- **Example:** "Mediterranean Chicken" with standard ingredients

### ⚠️ Good (1-2 unknowns in 6+ ingredient recipe)
- **Criteria:** 1-2 unknown ingredients, recipe has 6+ total
- **Action:** Add to catalog with flag, enable for meal plans
- **User notification:** Show warning badge + unknown ingredients
- **Example:** "Thai Curry" with 1 specialty item

### 🔍 Questionable (1-2 unknowns in short recipe)
- **Criteria:** 1-2 unknown in ≤5 ingredient recipe (high impact)
- **Action:** Private catalog only OR require substitution
- **User notification:** Request clarification or substitution
- **Example:** "Vegetable Dip" (4 ingredients, 1 unknown = 25% unknown)

### ❌ Poor (3+ unknowns)
- **Criteria:** 3+ unknown ingredients
- **Action:** Reject OR private catalog only (never recommend)
- **User notification:** Explain issue, offer to fix or keep private
- **Example:** "Winter Kimchi" (4 unknowns including "fermented shrimps")

---

## 🔧 Import Workflow (UI)

### Spoonacular Import

```
1. User pastes recipe URL
2. Extract recipe data via API
3. Run validateRecipeIngredients()
4. Show validation results:
   
   ┌─────────────────────────────────────────┐
   │ Recipe Import Preview                    │
   ├─────────────────────────────────────────┤
   │ ✅ 12/14 ingredients recognized         │
   │ ⚠️  2 unknown ingredients:              │
   │    • "fermented shrimp paste"           │
   │    • "korean gochujang"                 │
   │                                          │
   │ Options:                                 │
   │ [ Provide Substitutions ]                │
   │ [ Add to Private Recipes Only ]          │
   │ [ Cancel Import ]                        │
   └─────────────────────────────────────────┘
   
5. If user clicks "Provide Substitutions":
   
   For each unknown ingredient:
   ┌─────────────────────────────────────────┐
   │ Unknown: "fermented shrimp paste"        │
   ├─────────────────────────────────────────┤
   │ Suggested substitutions:                 │
   │ ○ fish sauce                             │
   │ ○ soy sauce                              │
   │ ○ anchovy paste                          │
   │ ○ [Skip - no substitution available]    │
   └─────────────────────────────────────────┘
   
6. Store recipe with:
   - quality.hasUnknownIngredients = true/false
   - quality.substitutions = [...]
   - quality.canRecommendInPlans = true/false
```

---

### Manual Recipe Entry

```
1. User fills recipe form
2. On each ingredient blur/change:
   - Parse and match in real-time
   - Show match status badge:
   
   ┌───────────────────────────────────────┐
   │ Ingredient: [1 cup chopped onion   ] │
   │             ✅ Recognized             │
   └───────────────────────────────────────┘
   
   ┌───────────────────────────────────────┐
   │ Ingredient: [2 tbsp gochujang paste] │
   │             ⚠️  Unknown - add note?  │
   │             [Substitute with...]      │
   └───────────────────────────────────────┘

3. Before save:
   - Run full validation
   - If unknown ingredients exist:
     • Warn user
     • Offer substitution entry
     • Default to "Private only" if no substitutions
```

---

## 🗄️ Recipe Schema Updates

### Add Quality Fields

```javascript
{
  "recipeId": "recipe_123",
  "name": "Thai Curry",
  "ingredients": [...],
  "normalizedIngredients": [...],
  
  // NEW: Quality tracking
  "quality": {
    "ingredientMatchRate": 92.3,
    "hasUnknownIngredients": true,
    "unknownCount": 1,
    "qualityTier": "good",
    "canRecommendInPlans": true,
    "flagForUser": true,
    "problematicIngredients": [
      {
        "raw": "1 tbsp fish sauce",
        "identity": "fish sauce",
        "issue": "no_match_found",
        "userProvidedSubstitution": null
      }
    ],
    "lastValidated": "2026-01-10T00:30:00.000Z"
  },
  
  // NEW: Visibility control
  "visibility": {
    "isPublic": false,        // Can appear in shared catalog
    "canRecommend": true,     // Can be used in meal plan generation
    "ownerOnly": false        // Only visible to recipe creator
  }
}
```

---

## 🎯 Meal Plan Generation Filter

### Updated Recipe Selection Logic

```javascript
function selectRecipesForMealPlan(catalog, filters) {
  return catalog.recipes.filter(recipe => {
    // Existing filters (diet, cuisine, etc.)
    if (!matchesDietFilters(recipe, filters)) return false;
    
    // NEW: Quality filter
    if (recipe.quality) {
      // Never recommend recipes that can't be made
      if (!recipe.quality.canRecommendInPlans) return false;
      
      // Optionally skip recipes with unknown ingredients
      // (user preference in settings)
      if (filters.skipUnknownIngredients && recipe.quality.hasUnknownIngredients) {
        return false;
      }
    }
    
    // NEW: Visibility filter
    if (recipe.visibility) {
      if (!recipe.visibility.canRecommend) return false;
    }
    
    return true;
  });
}
```

---

## 🛡️ Data Integrity Rules

### Catalog Acceptance Criteria

**Auto-accept:**
- ✅ 100% ingredient match rate
- ✅ All ingredients in master dictionary
- ✅ No malformed data

**Accept with warning:**
- ⚠️ 1-2 unknown ingredients in 6+ ingredient recipe
- ⚠️ Match rate ≥ 85%
- ⚠️ User acknowledges warnings

**Reject (private only):**
- ❌ 3+ unknown ingredients
- ❌ Match rate < 70%
- ❌ Critical ingredients unknown (main protein, base)
- ❌ Malformed ingredient data

---

## 📝 User-Facing Messages

### Import Success (Excellent)

```
✅ Recipe imported successfully!
   All ingredients recognized.
   This recipe is ready for meal plans.
```

### Import Warning (Good)

```
⚠️  Recipe imported with 1 unknown ingredient:
    • "gochujang paste"
    
   This recipe can be used in meal plans, but you may need
   to substitute this ingredient or source it specially.
   
   [Provide Substitution] [Keep As-Is]
```

### Import Blocked (Poor)

```
❌ Cannot add to shared catalog
   This recipe has 4 unknown ingredients:
   • "fermented shrimp paste"
   • "korean gochugaru"
   • "dashida powder"
   • "korean fish sauce"
   
   Options:
   [Add to My Private Recipes] [Provide Substitutions] [Cancel]
   
   Note: Private recipes won't appear in meal plan recommendations
   until ingredients are clarified.
```

---

## 🔄 Validation Triggers

**When to validate:**
- ✅ Recipe import (Spoonacular/URL)
- ✅ Manual recipe creation
- ✅ Recipe edit (if ingredients changed)
- ✅ Catalog quality check (periodic script)

**When NOT to validate:**
- User's existing private recipes (grandfather in)
- Recipes being viewed (read-only)
- Recipes in meal plan (already selected)

---

## 📊 Analytics & Monitoring

### Track Over Time

**Metrics to monitor:**
```javascript
{
  "catalogQuality": {
    "totalRecipes": 516,
    "excellentRecipes": 249,
    "flaggedRecipes": 247,
    "privateOnlyRecipes": 20,
    "averageMatchRate": "94.2%",
    "lastCheck": "2026-01-10T00:30:00Z"
  },
  "userImports": {
    "totalAttempts": 150,
    "autoAccepted": 120,
    "flaggedWithWarning": 25,
    "rejectedToPrivate": 5,
    "averageQuality": "good"
  }
}
```

**Monthly quality check:**
```bash
node scripts/analyzeRecipeQuality.js
# Review flagged recipes
# Update dictionary based on patterns
# Re-evaluate catalog
```

---

## ✅ Implementation Checklist

**Backend:**
- [ ] Add `validateRecipeIngredients()` to recipe import API
- [ ] Update catalog save logic to include quality metadata
- [ ] Filter recipes in meal plan generation by `canRecommendInPlans`

**Frontend:**
- [ ] Add real-time ingredient validation on Recipe Edit page
- [ ] Show match status badges during import
- [ ] Implement substitution input UI
- [ ] Add quality tier badges to recipe cards
- [ ] Filter settings: "Skip recipes with unknown ingredients"

**Scripts:**
- [x] `analyzeRecipeQuality.js` - Catalog quality analysis
- [x] `removeProblematicRecipes.js` - Cleanup tool
- [ ] Periodic quality check cron/script

**Documentation:**
- [x] This workflow document
- [ ] User help article about unknown ingredients
- [ ] Admin guide for reviewing flagged recipes

---

## 🎓 Design Decisions

**Why remove vs flag?**
- Recipes with 3+ unknown ingredients are essentially unusable
- Users can't shop for ingredients they can't identify
- Better UX to have smaller, higher-quality catalog
- Can always re-add if ingredients become available

**Why allow 1-2 unknowns?**
- May be specialty items user can source
- Recipe might still be valuable with substitutions
- Gives flexibility for advanced cooks
- Warning system keeps users informed

**Why private-only option?**
- Respects user's imported recipes
- Doesn't force deletion of their data
- Prevents bad recipes from affecting other users
- Allows gradual improvement as dictionary expands

---

**Status:** Design complete, ready for implementation  
**Next:** Run cleanup script to remove 106 problematic recipes from catalog
