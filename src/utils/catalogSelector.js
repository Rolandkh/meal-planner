/**
 * Catalog Recipe Selector
 * Selects recipes from catalog based on constraints
 * Used by meal generation to prefer catalog over AI generation
 */

/**
 * Select a recipe from catalog for a specific meal slot
 * @param {Array} catalog - Full recipe catalog
 * @param {Object} constraints - Meal constraints
 * @param {Array} usedRecipeIds - Recently used recipe IDs to avoid
 * @returns {Object|null} Selected recipe or null if none suitable
 */
export function selectRecipeFromCatalog(catalog, constraints = {}, usedRecipeIds = []) {
  if (!catalog || catalog.length === 0) {
    console.log('📭 No catalog available');
    return null;
  }

  const {
    mealType = 'dinner',  // breakfast, lunch, dinner
    dietProfiles = [],     // e.g., ['mediterranean', 'vegetarian']
    excludeIngredients = [], // e.g., ['eggplant', 'tomatoes']
    preferIngredients = [],  // e.g., ['fish', 'walnuts']
    effortLevel = null,      // 'quick', 'easy', 'medium', 'project'
    servings = 2
  } = constraints;

  // Filter pipeline
  let candidates = [...catalog];

  console.log(`🔍 Filtering ${candidates.length} catalog recipes for ${mealType}...`);

  // 1. Filter by meal slot
  candidates = candidates.filter(r => 
    r.tags?.mealSlots?.includes(mealType) || 
    r.tags?.mealSlots?.length === 0  // Recipes with no slots work for any meal
  );
  console.log(`  After meal slot filter: ${candidates.length}`);

  // 2. Filter by diet profiles (if specified)
  if (dietProfiles && dietProfiles.length > 0) {
    candidates = candidates.filter(r => {
      const recipeDiets = r.tags?.diets || [];
      // Recipe should be compatible with ALL diet profiles
      // Or have no diet tags (universal)
      if (recipeDiets.length === 0) return true;
      
      return dietProfiles.some(profile => 
        recipeDiets.includes(profile) ||
        recipeDiets.includes(profile.replace('-', ' '))
      );
    });
    console.log(`  After diet filter (${dietProfiles.join(', ')}): ${candidates.length}`);
  }

  // 3. Filter out excluded ingredients
  if (excludeIngredients && excludeIngredients.length > 0) {
    candidates = candidates.filter(r => {
      const ingredientNames = (r.ingredients || [])
        .map(i => i.name.toLowerCase())
        .join(' ');
      
      return !excludeIngredients.some(excluded =>
        ingredientNames.includes(excluded.toLowerCase())
      );
    });
    console.log(`  After exclusion filter: ${candidates.length}`);
  }

  // 4. Filter by effort level (if specified)
  if (effortLevel) {
    candidates = candidates.filter(r => 
      !r.tags?.effortLevel || r.tags.effortLevel === effortLevel
    );
    console.log(`  After effort filter (${effortLevel}): ${candidates.length}`);
  }

  // 5. Remove recently used recipes
  if (usedRecipeIds && usedRecipeIds.length > 0) {
    candidates = candidates.filter(r => 
      !usedRecipeIds.includes(r.recipeId) &&
      !usedRecipeIds.includes(r.spoonacularId?.toString())
    );
    console.log(`  After avoiding repeats: ${candidates.length}`);
  }

  // 6. Prioritize recipes with preferred ingredients
  if (preferIngredients && preferIngredients.length > 0) {
    candidates = candidates.map(r => {
      const ingredientNames = (r.ingredients || [])
        .map(i => i.name.toLowerCase())
        .join(' ');
      
      const matchCount = preferIngredients.filter(pref =>
        ingredientNames.includes(pref.toLowerCase())
      ).length;
      
      return { ...r, _preferScore: matchCount };
    }).sort((a, b) => b._preferScore - a._preferScore);
  }

  // 7. Prioritize by health score (if available)
  candidates.sort((a, b) => {
    const scoreA = a.dietCompassScores?.overall || 0;
    const scoreB = b.dietCompassScores?.overall || 0;
    return scoreB - scoreA;
  });

  if (candidates.length === 0) {
    console.log('  ❌ No suitable catalog recipes found');
    return null;
  }

  // Select from top candidates (add some randomness for variety)
  const topCandidates = candidates.slice(0, Math.min(10, candidates.length));
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  console.log(`  ✅ Selected: "${selected.name}" (score: ${selected.dietCompassScores?.overall || 'N/A'})`);

  return selected;
}

/**
 * Select recipes for a full week
 * @param {Array} catalog - Recipe catalog
 * @param {Array} days - Array of day configurations
 * @returns {Object} Selected recipes per day/meal
 */
export function selectWeekFromCatalog(catalog, days) {
  const selections = {};
  const usedRecipeIds = [];

  for (const day of days) {
    selections[day.date] = {};

    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
      const mealConfig = day[mealType];
      if (!mealConfig) continue;

      const recipe = selectRecipeFromCatalog(
        catalog,
        {
          mealType,
          dietProfiles: mealConfig.dietProfiles || [],
          excludeIngredients: mealConfig.excludeIngredients || [],
          preferIngredients: mealConfig.preferIngredients || [],
          effortLevel: mealConfig.effortLevel,
          servings: mealConfig.servings
        },
        usedRecipeIds
      );

      if (recipe) {
        selections[day.date][mealType] = recipe;
        usedRecipeIds.push(recipe.recipeId);
      } else {
        selections[day.date][mealType] = null;  // Will need AI generation
      }
    }
  }

  return selections;
}

/**
 * Get statistics on catalog usage
 * @param {Object} selections - Selected recipes
 * @returns {Object} Stats
 */
export function getCatalogUsageStats(selections) {
  let total = 0;
  let fromCatalog = 0;
  let needGeneration = 0;

  Object.values(selections).forEach(day => {
    Object.values(day).forEach(recipe => {
      total++;
      if (recipe) {
        fromCatalog++;
      } else {
        needGeneration++;
      }
    });
  });

  return {
    total,
    fromCatalog,
    needGeneration,
    catalogPercentage: Math.round((fromCatalog / total) * 100)
  };
}
