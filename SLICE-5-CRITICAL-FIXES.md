# Slice 5 Critical Fixes - Task Breakdown

## Overview
Addressing 4 critical issues discovered during user testing before proceeding to Task 69.

---

## Task 97: Fix Recipe Images Display

**Priority**: HIGH  
**Dependencies**: None  
**Estimated Time**: 30 minutes

### Problem
- Images were successfully downloaded (606 images in `/public/images/recipes/`)
- Catalog stores correct paths (`/images/recipes/715769.jpg`)
- BUT: UI components render emoji placeholders instead of actual images

### Root Cause
`RecipeDetailPage.js` line 193-196 creates a div placeholder instead of an `<img>` element.

### Subtasks

#### 97.1: Fix RecipeDetailPage Image Rendering
- Replace emoji placeholder div with actual `<img>` element
- Use `recipe.image` path from catalog
- Add fallback to emoji if image fails to load
- Ensure responsive image sizing

**Files to modify:**
- `src/components/RecipeDetailPage.js` (renderHeroSection method)

**Implementation:**
```javascript
renderHeroSection() {
  // ... existing code ...
  
  // Replace lines 193-196 with:
  let imageElement;
  if (this.state.recipe.image) {
    imageElement = document.createElement('img');
    imageElement.src = this.state.recipe.image;
    imageElement.alt = this.state.recipe.name;
    imageElement.className = 'w-full h-64 object-cover';
    imageElement.onerror = () => {
      // Fallback to emoji on error
      imageElement.replaceWith(this.createEmojiPlaceholder());
    };
  } else {
    imageElement = this.createEmojiPlaceholder();
  }
  
  hero.appendChild(imageElement);
  // ... rest of code ...
}

createEmojiPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'h-64 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-8xl';
  placeholder.textContent = this.getRecipeEmoji(this.state.recipe);
  return placeholder;
}
```

#### 97.2: Fix Recipe Card Images
- Update `RecipeCard` component (likely in `RecipeLibraryPage.js`)
- Ensure catalog recipe images display in cards
- Add loading state for images

**Files to check/modify:**
- `src/components/RecipeLibraryPage.js`
- Any recipe card rendering functions

#### 97.3: Fix Meal Plan View Images
- Update `MealPlanView.js` to display recipe images
- Update `DayView.js` to display recipe images in meal cards

**Files to modify:**
- `src/components/MealPlanView.js`
- `src/components/DayView.js`

#### 97.4: Verify Image Path Strategy
- Confirm `/images/recipes/` paths work correctly
- Images exist in `/public/images/recipes/` (they do)
- Web server should serve from public directory automatically

**Testing:**
- View catalog recipe in detail page - image should appear
- View recipe in meal plan - image should appear
- View recipe in library - image should appear
- Test with missing image - should fallback to emoji

---

## Task 98: Fix Recipe Instructions Extraction

**Priority**: HIGH  
**Dependencies**: None  
**Estimated Time**: 1-2 hours

### Problem
- Catalog shows `"instructions": "No instructions available"`
- Spoonacular API provides instructions in `analyzedInstructions` field
- Extraction script didn't parse/extract properly

### Root Cause
`scripts/extractSpoonacularCatalog.js` didn't properly parse the `analyzedInstructions` nested structure.

### Subtasks

#### 98.1: Debug Spoonacular Instructions Format
- Review Spoonacular API response structure
- Check `analyzedInstructions` format (array of objects with steps)
- Document expected structure

**Spoonacular Format:**
```json
{
  "analyzedInstructions": [
    {
      "name": "",
      "steps": [
        {
          "number": 1,
          "step": "Preheat the oven to 350 degrees F.",
          "ingredients": [],
          "equipment": []
        }
      ]
    }
  ]
}
```

#### 98.2: Fix Extraction Script
- Update `mapSpoonacularToRecipe()` function in extraction script
- Parse `analyzedInstructions` properly
- Concatenate steps into readable instruction text
- Handle multiple instruction sections if present

**Files to modify:**
- `scripts/extractSpoonacularCatalog.js` (mapSpoonacularToRecipe function)

**Implementation approach:**
```javascript
function extractInstructions(spoonacularRecipe) {
  if (!spoonacularRecipe.analyzedInstructions || 
      spoonacularRecipe.analyzedInstructions.length === 0) {
    return "No instructions available";
  }
  
  // Combine all instruction sections
  const allSteps = spoonacularRecipe.analyzedInstructions
    .flatMap(section => section.steps || [])
    .sort((a, b) => a.number - b.number)
    .map(step => `${step.number}. ${step.step}`)
    .join('\n\n');
  
  return allSteps || "No instructions available";
}
```

#### 98.3: Re-extract Catalog
- Run extraction script again to regenerate catalog with proper instructions
- Verify instructions appear in catalog JSON
- May take 2-3 hours due to API rate limits

**Command:**
```bash
node scripts/extractSpoonacularCatalog.js
```

#### 98.4: Update Existing Recipes (If Needed)
- If some recipes already imported to user storage, may need migration
- Consider adding a "Re-sync from Catalog" feature for future

**Testing:**
- Check catalog JSON for proper instructions
- View recipe detail page - instructions should appear
- Verify instructions are readable and properly formatted

---

## Task 99: Enhance Instructions with Inline Quantities

**Priority**: MEDIUM  
**Dependencies**: Task 98 (instructions must be fixed first)  
**Estimated Time**: 2-3 hours

### Problem
- Instructions reference ingredients generically ("add the onions")
- User wants quantities embedded inline ("add 2 cups diced onions")

### Approach
Two options:
1. **Parse & Enhance** - Parse existing Spoonacular instructions and inject quantities
2. **AI Rewrite** - Use Claude to rewrite instructions with quantities

**Recommended**: Option 2 (AI Rewrite) for better readability and context.

### Subtasks

#### 99.1: Create Instruction Enhancement Utility
- Create `src/utils/enhanceInstructions.js`
- Function to take recipe (with ingredients + instructions) and rewrite
- Use Claude API to intelligently merge quantities into instruction steps

**Files to create:**
- `src/utils/enhanceInstructions.js`

**Implementation approach:**
```javascript
export async function enhanceInstructionsWithQuantities(recipe) {
  const prompt = `
Rewrite these recipe instructions to include ingredient quantities inline:

Recipe: ${recipe.name}

Ingredients:
${recipe.ingredients.map(ing => 
  `- ${ing.quantity} ${ing.unit} ${ing.name}`
).join('\n')}

Current Instructions:
${recipe.instructions}

Please rewrite the instructions to naturally include the quantities when 
ingredients are mentioned. Make it read naturally, like:
"Add 2 cups (280g) diced onions and cook until softened, about 5 minutes."

Only return the enhanced instructions, nothing else.
  `.trim();

  const response = await callClaude(prompt);
  return response;
}
```

#### 99.2: Add Enhancement During Catalog Extraction
- Option A: Enhance during extraction (slower but one-time)
- Option B: Enhance on-demand when recipe is viewed (faster extraction, uses tokens)

**Recommended**: Option A - enhance during extraction so it's done once.

#### 99.3: Add Enhancement UI Toggle (Optional)
- In RecipeDetailPage, add toggle for "Show quantities in instructions"
- Store preference in localStorage
- Apply enhancement on-the-fly if not already done

#### 99.4: Re-extract or Batch Enhance
- Either re-run extraction with enhancement
- Or create batch script to enhance existing catalog recipes

**Testing:**
- Verify quantities appear naturally in instructions
- Check multiple recipes for readability
- Ensure no duplicate quantity information

---

## Task 100: Debug & Recalibrate Diet Compass Scoring

**Priority**: HIGH  
**Dependencies**: None  
**Estimated Time**: 2-3 hours

### Problem
- Most recipes scoring very low (e.g., overall: 19 out of 100)
- Example: "Broccolini Quinoa Pilaf" (healthy ingredients) scores 19
- Indicates either:
  - Scoring algorithm is too harsh
  - Ingredient health data is incomplete/incorrect
  - Point calculations are wrong

### Subtasks

#### 100.1: Analyze Sample Recipes
- Select 5-10 recipes with varying healthiness:
  - Very healthy (salad, grilled fish)
  - Moderately healthy (pasta with vegetables)
  - Less healthy (fried foods, processed items)
- Document their current scores
- Manually calculate expected scores

**Create analysis document:**
- `docs/scoring-analysis.md`

#### 100.2: Debug Scoring Engine
- Add detailed logging to `dietCompassScoring.js`
- Log per-ingredient contributions
- Log penalty/bonus applications
- Identify where scores are getting suppressed

**Files to modify:**
- `src/utils/dietCompassScoring.js`

**Add debug function:**
```javascript
export function debugRecipeScore(recipe, verbose = true) {
  console.log('\n=== SCORING DEBUG ===');
  console.log('Recipe:', recipe.name);
  console.log('\nIngredients:');
  
  let totalPoints = { nd: 0, aa: 0, wl: 0, hh: 0 };
  let totalWeight = 0;
  
  for (const ing of recipe.ingredients || []) {
    const meta = getIngredientHealthData(ing.name);
    const weight = getIngredientWeight(ing);
    totalWeight += weight;
    
    if (meta) {
      console.log(`  ${ing.name}: ${weight}g`);
      console.log(`    ND: ${meta.nutrientDensityPoints}`);
      console.log(`    AA: ${meta.antiAgingPoints}`);
      console.log(`    WL: ${meta.weightLossPoints}`);
      console.log(`    HH: ${meta.heartHealthPoints}`);
      
      totalPoints.nd += meta.nutrientDensityPoints * weight;
      totalPoints.aa += meta.antiAgingPoints * weight;
      totalPoints.wl += meta.weightLossPoints * weight;
      totalPoints.hh += meta.heartHealthPoints * weight;
    } else {
      console.log(`  ${ing.name}: NO DATA`);
    }
  }
  
  console.log(`\nTotal Weight: ${totalWeight}g`);
  console.log('Raw totals:', totalPoints);
  console.log('Normalized:', {
    nd: totalPoints.nd / totalWeight,
    aa: totalPoints.aa / totalWeight,
    wl: totalPoints.wl / totalWeight,
    hh: totalPoints.hh / totalWeight
  });
  
  const finalScore = calculateRecipeScores(recipe);
  console.log('\nFinal scores:', finalScore);
  console.log('===================\n');
  
  return finalScore;
}
```

#### 100.3: Review Ingredient Health Data
- Check `src/data/ingredientHealthData.json`
- Verify common ingredients have appropriate scores
- Look for:
  - Missing ingredients (defaulting to neutral)
  - Incorrectly scored ingredients
  - Overly harsh penalties

**Files to review:**
- `src/data/ingredientHealthData.json`

**Common fixes might include:**
- Increasing base points for vegetables, whole grains
- Reducing penalties or making them less aggressive
- Adding missing ingredient entries

#### 100.4: Adjust Scoring Algorithm
Based on debug findings, adjust:
- Point ranges (currently 0-100, might need scaling)
- Weight calculations (per-serving vs total)
- Penalty multipliers
- Overall score formula

**Potential adjustments:**
```javascript
// Current formula might be too conservative
// Consider adjusting weights:
const overall = Math.round(
  nd * 0.30 +  // Nutrient density (was 0.35?)
  aa * 0.25 +  // Anti-aging (was 0.20?)
  wl * 0.20 +  // Weight loss (was 0.20?)
  hh * 0.25    // Heart health (was 0.25?)
);

// Or scale final scores:
const scaledScore = Math.min(100, score * 1.5);
```

#### 100.5: Re-score Catalog
- Run scoring on all catalog recipes
- Update catalog with new scores
- Verify distribution (should see range from 20-90, not all 15-25)

**Script to create:**
- `scripts/rescoreCatalog.js`

**Testing:**
- Manually verify sample recipes score appropriately
- Healthy recipes should score 70-90
- Moderate recipes should score 40-70
- Unhealthy recipes should score 15-40
- Check UI displays scores correctly with proper bar counts

---

## Implementation Order

### Phase 1: Quick Wins (Do First)
1. **Task 97**: Fix image display (30 min)
   - Immediate visual improvement
   - Easiest to implement
   - High user impact

### Phase 2: Data Quality (Do Second)
2. **Task 98**: Fix instructions extraction (1-2 hours)
   - Critical functionality
   - Requires re-extraction (long-running)
3. **Task 100**: Fix scoring (2-3 hours)
   - Parallel work while extraction runs
   - Improves core feature quality

### Phase 3: Enhancement (Do Last)
4. **Task 99**: Enhance instructions with quantities (2-3 hours)
   - Depends on Task 98
   - Nice-to-have improvement
   - Can be deferred if needed

---

## Taskmaster Commands

To add these tasks manually:

```bash
# Task 97
task-master add-task --prompt="Fix recipe images display in RecipeDetailPage, RecipeCard, MealPlanView, and DayView. Images exist in /public/images/recipes/ and catalog has correct paths, but UI renders emoji placeholders instead of actual <img> tags. Update renderHeroSection and related image rendering code." --priority=high

# Task 98
task-master add-task --prompt="Fix recipe instructions extraction from Spoonacular. Current catalog shows 'No instructions available' because analyzedInstructions field wasn't properly parsed. Update mapSpoonacularToRecipe function to extract and format instruction steps. Re-run extraction script." --priority=high --dependencies=97

# Task 99
task-master add-task --prompt="Enhance recipe instructions to include ingredient quantities inline. Create enhanceInstructionsWithQuantities utility using Claude API to rewrite instructions naturally (e.g., 'Add 2 cups diced onions'). Apply during catalog extraction or on-demand." --priority=medium --dependencies=98

# Task 100
task-master add-task --prompt="Debug and recalibrate Diet Compass scoring system. Current scores are too low (most recipes 15-25 instead of expected 40-80 range). Add debug logging, review ingredient health data, adjust algorithm parameters, and re-score catalog." --priority=high
```

---

## Success Criteria

### Task 97 (Images)
- ✅ Recipe detail pages show actual images
- ✅ Recipe cards in library show images
- ✅ Meal plan views show recipe images
- ✅ Graceful fallback to emoji if image missing

### Task 98 (Instructions)
- ✅ Catalog recipes have proper step-by-step instructions
- ✅ Instructions are readable and properly formatted
- ✅ 95%+ of recipes have instructions (some may legitimately have none)

### Task 99 (Quantity Enhancement)
- ✅ Instructions naturally include quantities when mentioning ingredients
- ✅ Text reads naturally, not robotic
- ✅ No duplicate quantity information

### Task 100 (Scoring)
- ✅ Healthy recipes (salads, fish, whole grains) score 70-90
- ✅ Moderate recipes score 40-70
- ✅ Less healthy recipes score 15-40
- ✅ Score distribution across catalog is reasonable
- ✅ UI displays correct number of bars (1-5) based on scores

---

## Notes

- Tasks 97 and 100 can be done in parallel
- Task 98 requires long re-extraction time (plan accordingly)
- Task 99 is optional enhancement, can be deferred
- All fixes should be tested with real catalog data
- Consider adding automated tests for scoring in future
