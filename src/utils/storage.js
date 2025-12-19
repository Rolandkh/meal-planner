/**
 * Storage Utility
 * Handles localStorage operations for persisting app state
 */

const STORAGE_KEY = 'mealPlannerApp';

// Slice 2 Storage Keys
const EATERS_KEY = 'eaters';
const RECIPES_KEY = 'recipes';
const MEALS_KEY = 'meals';
const CURRENT_MEAL_PLAN_KEY = 'currentMealPlan';

/**
 * Save checked items to localStorage
 * @param {Object} checkedItems - Object mapping item IDs to checked state
 */
export function saveCheckedItems(checkedItems) {
  try {
    const data = {
      checked: checkedItems,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Load checked items from localStorage
 * @returns {Object} Object mapping item IDs to checked state
 */
export function loadCheckedItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.checked || {};
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return {};
}

/**
 * Clear all saved data
 */
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Get storage statistics
 * @returns {Object} Storage stats
 */
export function getStorageStats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        lastUpdated: data.lastUpdated,
        itemCount: Object.keys(data.checked || {}).length
      };
    }
  } catch (error) {
    console.error('Error getting storage stats:', error);
  }
  return null;
}

// ============================================================================
// SLICE 2: Meal Plan Storage Functions
// ============================================================================

/**
 * Safe save wrapper that handles quota exceeded errors
 * @param {string} key - localStorage key
 * @param {*} data - Data to save (will be JSON stringified)
 * @returns {Object} Result object with success status and optional error
 */
export function safeSave(key, data) {
  try {
    // Validate that data can be serialized
    const serialized = JSON.stringify(data);
    
    // Attempt to save to localStorage
    localStorage.setItem(key, serialized);
    
    return {
      success: true,
      key
    };
  } catch (error) {
    // Check for quota exceeded error (DOMException code 22)
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error(`localStorage quota exceeded when saving ${key}`, error);
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        message: 'Storage limit reached. Please clear some data.',
        key
      };
    }
    
    // Other errors (like JSON serialization failures)
    console.error(`Error saving ${key} to localStorage:`, error);
    return {
      success: false,
      error: 'SAVE_FAILED',
      message: error.message || 'Failed to save data',
      key
    };
  }
}

/**
 * Generate a unique recipe ID
 * @returns {string} Recipe ID in format: recipe_[uuid]
 */
export function generateRecipeId() {
  return `recipe_${crypto.randomUUID()}`;
}

/**
 * Generate a unique meal ID
 * @returns {string} Meal ID in format: meal_[uuid]
 */
export function generateMealId() {
  return `meal_${crypto.randomUUID()}`;
}

/**
 * Generate a unique eater ID
 * @returns {string} Eater ID in format: eater_[uuid]
 */
export function generateEaterId() {
  return `eater_${crypto.randomUUID()}`;
}

/**
 * Generate a unique meal plan ID based on date
 * @param {string} weekOf - Week start date in YYYY-MM-DD format
 * @returns {string} Meal plan ID in format: plan_YYYYMMDD
 */
export function generateMealPlanId(weekOf) {
  const dateStr = weekOf.replace(/-/g, '');
  return `plan_${dateStr}`;
}

/**
 * Validate ID format
 * @param {string} id - ID to validate
 * @param {string} type - Expected type ('recipe', 'meal', 'eater', 'plan')
 * @returns {boolean} True if ID format is valid
 */
export function validateId(id, type) {
  if (typeof id !== 'string' || !id) {
    return false;
  }
  
  const patterns = {
    recipe: /^recipe_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    meal: /^meal_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    eater: /^eater_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    plan: /^plan_\d{8}$/
  };
  
  return patterns[type] ? patterns[type].test(id) : false;
}

/**
 * Create a hash from recipe name and ingredients for deduplication
 * @param {Object} recipe - Recipe object with name and ingredients
 * @returns {string} Hash string for deduplication
 */
function createRecipeHash(recipe) {
  const name = (recipe.name || '').toLowerCase().trim();
  
  // Sort and normalize ingredients for consistent hashing
  const ingredientsStr = (recipe.ingredients || [])
    .map(ing => {
      const ingName = (ing.name || '').toLowerCase().trim();
      const quantity = ing.quantity || '';
      const unit = (ing.unit || '').toLowerCase().trim();
      return `${ingName}:${quantity}:${unit}`;
    })
    .sort()
    .join('|');
  
  return `${name}::${ingredientsStr}`;
}

/**
 * Deduplicate recipes by name and ingredients
 * @param {Array} recipes - Array of recipe objects
 * @returns {Array} Deduplicated array of recipes with assigned IDs
 */
export function deduplicateRecipes(recipes) {
  if (!Array.isArray(recipes)) {
    console.error('deduplicateRecipes: expected array, got', typeof recipes);
    return [];
  }
  
  const seenHashes = new Map();
  const uniqueRecipes = [];
  
  for (const recipe of recipes) {
    const hash = createRecipeHash(recipe);
    
    if (!seenHashes.has(hash)) {
      // First time seeing this recipe - add it with a new ID
      const uniqueRecipe = {
        ...recipe,
        recipeId: recipe.recipeId || generateRecipeId()
      };
      seenHashes.set(hash, uniqueRecipe.recipeId);
      uniqueRecipes.push(uniqueRecipe);
    }
    // If we've seen this hash before, skip it (duplicate)
  }
  
  return uniqueRecipes;
}

/**
 * Load eaters from localStorage
 * @returns {Array} Array of eater objects
 */
export function loadEaters() {
  try {
    const saved = localStorage.getItem(EATERS_KEY);
    if (saved) {
      const eaters = JSON.parse(saved);
      return Array.isArray(eaters) ? eaters : [];
    }
  } catch (error) {
    console.error('Error loading eaters from localStorage:', error);
  }
  return [];
}

/**
 * Save eaters to localStorage
 * @param {Array} eaters - Array of eater objects
 * @returns {Object} Result object with success status
 */
export function saveEaters(eaters) {
  if (!Array.isArray(eaters)) {
    console.error('saveEaters: expected array, got', typeof eaters);
    return { success: false, error: 'INVALID_TYPE', message: 'Expected array' };
  }
  return safeSave(EATERS_KEY, eaters);
}

/**
 * Load recipes from localStorage
 * @returns {Array} Array of recipe objects
 */
export function loadRecipes() {
  try {
    const saved = localStorage.getItem(RECIPES_KEY);
    if (saved) {
      const recipes = JSON.parse(saved);
      return Array.isArray(recipes) ? recipes : [];
    }
  } catch (error) {
    console.error('Error loading recipes from localStorage:', error);
  }
  return [];
}

/**
 * Save recipes to localStorage
 * @param {Array} recipes - Array of recipe objects
 * @returns {Object} Result object with success status
 */
export function saveRecipes(recipes) {
  if (!Array.isArray(recipes)) {
    console.error('saveRecipes: expected array, got', typeof recipes);
    return { success: false, error: 'INVALID_TYPE', message: 'Expected array' };
  }
  return safeSave(RECIPES_KEY, recipes);
}

/**
 * Load meals from localStorage
 * @returns {Array} Array of meal objects
 */
export function loadMeals() {
  try {
    const saved = localStorage.getItem(MEALS_KEY);
    if (saved) {
      const meals = JSON.parse(saved);
      return Array.isArray(meals) ? meals : [];
    }
  } catch (error) {
    console.error('Error loading meals from localStorage:', error);
  }
  return [];
}

/**
 * Save meals to localStorage
 * @param {Array} meals - Array of meal objects
 * @returns {Object} Result object with success status
 */
export function saveMeals(meals) {
  if (!Array.isArray(meals)) {
    console.error('saveMeals: expected array, got', typeof meals);
    return { success: false, error: 'INVALID_TYPE', message: 'Expected array' };
  }
  return safeSave(MEALS_KEY, meals);
}

/**
 * Load current meal plan from localStorage
 * @returns {Object|null} Meal plan object or null if none exists
 */
export function loadCurrentMealPlan() {
  try {
    const saved = localStorage.getItem(CURRENT_MEAL_PLAN_KEY);
    if (saved) {
      const plan = JSON.parse(saved);
      return typeof plan === 'object' && plan !== null ? plan : null;
    }
  } catch (error) {
    console.error('Error loading current meal plan from localStorage:', error);
  }
  return null;
}

/**
 * Save current meal plan to localStorage
 * @param {Object} plan - Meal plan object
 * @returns {Object} Result object with success status
 */
export function saveCurrentMealPlan(plan) {
  if (typeof plan !== 'object' || plan === null || Array.isArray(plan)) {
    console.error('saveCurrentMealPlan: expected object, got', typeof plan);
    return { success: false, error: 'INVALID_TYPE', message: 'Expected object' };
  }
  return safeSave(CURRENT_MEAL_PLAN_KEY, plan);
}
