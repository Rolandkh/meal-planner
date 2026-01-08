/**
 * Slice 5 Data Schemas
 * Centralized type definitions and schema documentation for all data entities
 * Version: 2.0 (Slice 5)
 */

/**
 * @typedef {Object} DietCompassScores
 * @property {number} overall - Overall health score (0-100)
 * @property {number} nutrientDensity - Protective vs harmful foods score (0-100)
 * @property {number} antiAging - mTOR, autophagy, inflammation score (0-100)
 * @property {number} weightLoss - Glycemic impact, satiety score (0-100)
 * @property {number} heartHealth - Omega-3, healthy fats score (0-100)
 * @property {Object} [breakdown] - Optional detailed scoring breakdown
 */

/**
 * @typedef {Object} RecipeTags
 * @property {string[]} cuisines - e.g., ['italian', 'mediterranean']
 * @property {string[]} diets - e.g., ['vegetarian', 'gluten-free']
 * @property {string[]} dishTypes - e.g., ['main course', 'side dish']
 * @property {string[]} mealSlots - e.g., ['breakfast', 'lunch', 'dinner']
 * @property {string[]} proteinSources - e.g., ['chicken', 'tofu']
 * @property {string[]} cookingMethods - e.g., ['baking', 'grilling']
 * @property {string[]} carbBases - e.g., ['rice', 'pasta', 'potatoes']
 * @property {'quick'|'easy'|'medium'|'project'} effortLevel
 * @property {'none'|'mild'|'medium'|'hot'} spiceLevel
 * @property {'budget'|'moderate'|'premium'} budgetTier
 * @property {boolean} kidFriendly
 * @property {boolean} makeAhead
 * @property {string[]} protectiveFoods - Diet Compass protective foods present
 */

/**
 * @typedef {Object} RecipeNutrition
 * @property {number} calories
 * @property {number} protein - grams
 * @property {number} fat - grams
 * @property {number} carbs - grams
 * @property {number} fiber - grams
 * @property {number} sugar - grams
 * @property {number} saturatedFat - grams
 * @property {number} omega3 - grams
 * @property {number} omega6 - grams
 * @property {number} sodium - mg
 * @property {number} [cholesterol] - mg
 * @property {number} [vitaminA] - IU
 * @property {number} [vitaminC] - mg
 * @property {number} [calcium] - mg
 * @property {number} [iron] - mg
 */

/**
 * @typedef {Object} RecipeIngredient
 * @property {string} name
 * @property {number} quantity
 * @property {string} unit
 * @property {'produce'|'meat'|'dairy'|'pantry'|'other'} category
 * @property {'protective'|'neutral'|'harmful'} [healthImpact]
 */

/**
 * Enhanced Recipe Schema (Slice 5)
 * @typedef {Object} Recipe
 * @property {number} _schemaVersion - Schema version (2 for Slice 5)
 * @property {string} recipeId - Unique ID: 'recipe_[uuid]'
 * 
 * @property {string} name - Recipe title
 * @property {RecipeIngredient[]} ingredients - List of ingredients
 * @property {string} instructions - Step-by-step instructions
 * @property {number} prepTime - Preparation time in minutes
 * @property {number} cookTime - Cooking time in minutes
 * @property {number} servings - Number of servings
 * 
 * @property {'spoonacular'|'generated'|'user'|'imported'} source - Recipe origin
 * @property {number|null} spoonacularId - Spoonacular recipe ID (if applicable)
 * @property {string|null} image - Local image path or URL
 * @property {string|null} imageUrl - Original Spoonacular image URL (for reference)
 * 
 * @property {string|null} parentRecipeId - Parent recipe ID (for variations)
 * @property {string[]} childRecipeIds - Child recipe IDs (variations)
 * @property {string|null} variationNote - How this varies from parent
 * 
 * @property {DietCompassScores|null} dietCompassScores - Health scores
 * @property {RecipeNutrition|null} nutrition - Nutrition data
 * @property {RecipeTags} tags - Comprehensive tagging
 * 
 * @property {boolean} isFavorite - User favorite flag
 * @property {number|null} rating - User rating (1-5)
 * @property {number} timesCooked - Times user has made this
 * @property {string|null} lastCooked - ISO date string
 * 
 * @property {string} createdAt - ISO date string
 * @property {string} updatedAt - ISO date string
 */

/**
 * @typedef {Object} PrepTask
 * @property {string} task - Task description
 * @property {number} estimatedTime - Minutes
 * @property {'before_cooking'|'day_before'|'morning_of'|'batch_day'} timing
 * @property {string[]} usedIn - Meal types using this prep
 */

/**
 * Enhanced Meal Schema (Slice 5)
 * @typedef {Object} Meal
 * @property {string} mealId - Unique ID: 'meal_[uuid]'
 * @property {string} recipeId - Reference to Recipe
 * @property {'breakfast'|'lunch'|'dinner'} mealType
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string[]} eaterIds - Eaters for this meal
 * @property {number} servings - Number of servings
 * @property {string} notes - User notes
 * 
 * @property {PrepTask[]} [prepTasks] - Prep tasks for this meal (Slice 5)
 * @property {string[]} [targetEaters] - Specific eaters this recipe is for (multi-profile)
 * @property {string[]} [dietProfileTags] - Diet profiles this satisfies (multi-profile)
 */

/**
 * @typedef {Object} MealPrepSettings
 * @property {number[]} batchPrepDays - Day indices for batch prep (0=Sun, 6=Sat)
 * @property {Object} prepLevels - Prep level per day/meal
 * @property {'minimal'|'medium'|'full'} prepLevels.monday.breakfast
 * @property {'minimal'|'medium'|'full'} prepLevels.monday.lunch
 * @property {'minimal'|'medium'|'full'} prepLevels.monday.dinner
 * @property {Object} prepLevels.tuesday
 * @property {Object} prepLevels.wednesday
 * @property {Object} prepLevels.thursday
 * @property {Object} prepLevels.friday
 * @property {Object} prepLevels.saturday
 * @property {Object} prepLevels.sunday
 */

/**
 * Enhanced BaseSpecification Schema (Slice 5)
 * @typedef {Object} BaseSpecification
 * @property {number} _schemaVersion - Schema version (2 for Slice 5)
 * @property {string} ownerEaterId - Primary eater ID
 * @property {number} weeklyBudget
 * @property {number} shoppingDay - 0-6 (day of week)
 * @property {string} preferredStore
 * @property {number} maxShoppingListItems
 * @property {string[]} householdEaterIds
 * @property {string} dietaryGoals
 * @property {boolean} onboardingComplete
 * 
 * @property {MealPrepSettings} mealPrepSettings - Meal prep preferences (Slice 5)
 * 
 * @property {Object} weeklySchedule
 * @property {Object} chatPreferences
 * @property {Object} conversation
 * @property {number} historyRetentionWeeks
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Enhanced Eater Schema (Slice 5)
 * @typedef {Object} Eater
 * @property {string} eaterId - Unique ID: 'eater_[uuid]'
 * @property {string} name
 * 
 * @property {string|null} dietProfile - Diet profile ID (Slice 5)
 * @property {string} personalPreferences - Free-text preferences (Slice 5)
 * @property {string[]} excludeIngredients - Foods to exclude (Slice 5)
 * @property {string[]} preferIngredients - Foods to prefer (Slice 5)
 * 
 * @property {string[]} allergies
 * @property {Object} schedule
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} MealPlan
 * @property {string} planId
 * @property {string} weekOf - Start date (Monday)
 * @property {string[]} mealIds
 * @property {Object} shoppingList
 * @property {number} budgetUsed
 * @property {Object} [prepSchedule] - Weekly prep schedule (Slice 5)
 * @property {string} createdAt
 */

/**
 * Default values for Slice 5 schema fields
 */
export const SCHEMA_DEFAULTS = {
  version: 2,
  
  recipe: {
    _schemaVersion: 2,
    parentRecipeId: null,
    childRecipeIds: [],
    variationNote: null,
    spoonacularId: null,
    imageUrl: null,
    dietCompassScores: null,
    nutrition: null,
    tags: {
      cuisines: [],
      diets: [],
      dishTypes: [],
      mealSlots: [],
      proteinSources: [],
      cookingMethods: [],
      carbBases: [],
      effortLevel: 'medium',
      spiceLevel: 'none',
      budgetTier: 'moderate',
      kidFriendly: false,
      makeAhead: false,
      protectiveFoods: []
    }
  },
  
  meal: {
    prepTasks: [],
    targetEaters: [],
    dietProfileTags: []
  },
  
  eater: {
    dietProfile: null,
    personalPreferences: '',
    excludeIngredients: [],
    preferIngredients: []
  },
  
  baseSpecification: {
    _schemaVersion: 2,
    mealPrepSettings: {
      batchPrepDays: [6],  // Default: Saturday
      prepLevels: {
        monday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        tuesday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        wednesday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        thursday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        friday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        saturday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        sunday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' }
      }
    }
  }
};

/**
 * Normalize a recipe to ensure all Slice 5 fields exist
 * @param {Object} recipe - Recipe object (any version)
 * @returns {Recipe} Normalized recipe with all Slice 5 fields
 */
export function normalizeRecipe(recipe) {
  return {
    ...recipe,
    _schemaVersion: recipe._schemaVersion ?? SCHEMA_DEFAULTS.recipe._schemaVersion,
    parentRecipeId: recipe.parentRecipeId ?? SCHEMA_DEFAULTS.recipe.parentRecipeId,
    childRecipeIds: recipe.childRecipeIds ?? SCHEMA_DEFAULTS.recipe.childRecipeIds,
    variationNote: recipe.variationNote ?? SCHEMA_DEFAULTS.recipe.variationNote,
    spoonacularId: recipe.spoonacularId ?? SCHEMA_DEFAULTS.recipe.spoonacularId,
    imageUrl: recipe.imageUrl ?? SCHEMA_DEFAULTS.recipe.imageUrl,
    dietCompassScores: recipe.dietCompassScores ?? SCHEMA_DEFAULTS.recipe.dietCompassScores,
    nutrition: recipe.nutrition ?? SCHEMA_DEFAULTS.recipe.nutrition,
    tags: {
      ...SCHEMA_DEFAULTS.recipe.tags,
      ...(recipe.tags || {})
    },
    // Ensure ingredients have healthImpact
    ingredients: (recipe.ingredients || []).map(ing => ({
      ...ing,
      healthImpact: ing.healthImpact ?? 'neutral'
    }))
  };
}

/**
 * Normalize a meal to ensure all Slice 5 fields exist
 * @param {Object} meal - Meal object (any version)
 * @returns {Meal} Normalized meal with all Slice 5 fields
 */
export function normalizeMeal(meal) {
  return {
    ...meal,
    prepTasks: meal.prepTasks ?? SCHEMA_DEFAULTS.meal.prepTasks,
    targetEaters: meal.targetEaters ?? SCHEMA_DEFAULTS.meal.targetEaters,
    dietProfileTags: meal.dietProfileTags ?? SCHEMA_DEFAULTS.meal.dietProfileTags
  };
}

/**
 * Normalize an eater to ensure all Slice 5 fields exist
 * @param {Object} eater - Eater object (any version)
 * @returns {Eater} Normalized eater with all Slice 5 fields
 */
export function normalizeEater(eater) {
  return {
    ...eater,
    dietProfile: eater.dietProfile ?? SCHEMA_DEFAULTS.eater.dietProfile,
    personalPreferences: eater.personalPreferences ?? SCHEMA_DEFAULTS.eater.personalPreferences,
    excludeIngredients: eater.excludeIngredients ?? SCHEMA_DEFAULTS.eater.excludeIngredients,
    preferIngredients: eater.preferIngredients ?? SCHEMA_DEFAULTS.eater.preferIngredients
  };
}

/**
 * Normalize base specification to ensure all Slice 5 fields exist
 * @param {Object} spec - BaseSpecification object (any version)
 * @returns {BaseSpecification} Normalized spec with all Slice 5 fields
 */
export function normalizeBaseSpecification(spec) {
  return {
    ...spec,
    _schemaVersion: spec._schemaVersion ?? SCHEMA_DEFAULTS.baseSpecification._schemaVersion,
    mealPrepSettings: spec.mealPrepSettings ?? SCHEMA_DEFAULTS.baseSpecification.mealPrepSettings
  };
}

/**
 * Validate recipe has all required fields
 * @param {Object} recipe
 * @returns {boolean}
 */
export function isValidRecipe(recipe) {
  return !!(
    recipe.recipeId &&
    recipe.name &&
    recipe.ingredients &&
    Array.isArray(recipe.ingredients) &&
    recipe.instructions
  );
}

/**
 * Get default meal prep settings
 * @returns {MealPrepSettings}
 */
export function getDefaultMealPrepSettings() {
  return JSON.parse(JSON.stringify(SCHEMA_DEFAULTS.baseSpecification.mealPrepSettings));
}

/**
 * Schema version constants
 */
export const SCHEMA_VERSION = {
  SLICE_4: 1,
  SLICE_5: 2,
  CURRENT: 2
};

/**
 * localStorage keys used in the app
 */
export const STORAGE_KEYS = {
  // Existing (Slice 1-4)
  BASE_SPECIFICATION: 'vanessa_base_specification',
  EATERS: 'vanessa_eaters',
  RECIPES: 'vanessa_recipes',
  MEALS: 'vanessa_meals',
  CURRENT_MEAL_PLAN: 'vanessa_current_meal_plan',
  MEAL_PLAN_HISTORY: 'vanessa_meal_plan_history',
  CONVERSATION: 'vanessa_conversation',
  
  // New (Slice 5)
  RECIPE_CATALOG: 'vanessa_recipe_catalog',
  INGREDIENT_HEALTH: 'vanessa_ingredient_health',
  DIET_PROFILES: 'vanessa_diet_profiles',
  
  // Migration flags
  MIGRATION_SLICE_5: 'vanessa_migration_slice5'
};
