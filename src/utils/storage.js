/**
 * Storage Utility
 * Handles localStorage operations for persisting app state
 */

const STORAGE_KEY = 'mealPlannerApp';

// Slice 2 Storage Keys (will be migrated to vanessa_ prefix in Slice 3)
const EATERS_KEY = 'eaters';
const RECIPES_KEY = 'recipes';
const MEALS_KEY = 'meals';
const CURRENT_MEAL_PLAN_KEY = 'currentMealPlan';

// Slice 3: Standardized Storage Keys (with vanessa_ prefix)
const VANESSA_CHAT_HISTORY = 'vanessa_chat_history'; // Already prefixed
const VANESSA_EATERS = 'vanessa_eaters';
const VANESSA_RECIPES = 'vanessa_recipes';
const VANESSA_MEALS = 'vanessa_meals';
const VANESSA_CURRENT_MEAL_PLAN = 'vanessa_current_meal_plan';
const VANESSA_BASE_SPECIFICATION = 'vanessa_base_specification';
const VANESSA_DEBUG_RAW_OUTPUT = 'vanessa_debug_raw_output';
const VANESSA_MIGRATION_SLICE3 = 'vanessa_migration_slice3';
const VANESSA_SCHEMA_VERSION = 'vanessa_schema_version';

// Key mapping for migration
const KEY_MAPPING = {
  'recipes': VANESSA_RECIPES,
  'meals': VANESSA_MEALS,
  'currentMealPlan': VANESSA_CURRENT_MEAL_PLAN,
  'debug_raw_ai_output': VANESSA_DEBUG_RAW_OUTPUT
};

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
    const saved = localStorage.getItem(VANESSA_EATERS);
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
  
  // Validate eater objects
  for (const eater of eaters) {
    if (!eater.eaterId || !validateId(eater.eaterId, 'eater')) {
      console.error('Invalid eater ID:', eater.eaterId);
      return { 
        success: false, 
        error: 'INVALID_EATER_ID', 
        message: 'All eaters must have valid IDs' 
      };
    }
    if (!eater.name || typeof eater.name !== 'string') {
      return { 
        success: false, 
        error: 'INVALID_EATER_NAME', 
        message: 'All eaters must have a name' 
      };
    }
  }
  
  return safeSave(VANESSA_EATERS, eaters);
}

/**
 * Create a new eater object with default values
 * @param {Object} data - Eater data (name, preferences, allergies, etc.)
 * @returns {Object} New eater object with generated ID and timestamps
 */
export function createEater(data = {}) {
  const now = new Date().toISOString();
  return {
    eaterId: generateEaterId(),
    name: data.name || 'New Member',
    preferences: data.preferences || '',
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    dietaryRestrictions: Array.isArray(data.dietaryRestrictions) ? data.dietaryRestrictions : [],
    schedule: data.schedule || '',
    isDefault: data.isDefault === true,
    
    // Slice 5 fields
    dietProfile: data.dietProfile || null,
    personalPreferences: data.personalPreferences || '',
    excludeIngredients: Array.isArray(data.excludeIngredients) ? data.excludeIngredients : [],
    preferIngredients: Array.isArray(data.preferIngredients) ? data.preferIngredients : [],
    
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Get or create a default eater
 * Ensures at least one default eater always exists
 * @returns {Object} Default eater object
 */
export function getOrCreateDefaultEater() {
  let eaters = loadEaters();
  
  // Find existing default eater
  let defaultEater = eaters.find(e => e.isDefault);
  
  if (!defaultEater) {
    // No default eater exists - create one
    defaultEater = createEater({
      name: 'You',
      preferences: '',
      isDefault: true
    });
    
    eaters.push(defaultEater);
    const result = saveEaters(eaters);
    
    if (!result.success) {
      console.error('Failed to save default eater:', result);
      // Return in-memory object even if save failed
    }
  }
  
  return defaultEater;
}

/**
 * Update an eater by ID
 * @param {string} eaterId - ID of eater to update
 * @param {Object} updates - Fields to update
 * @returns {Object} Result object with success status
 */
export function updateEater(eaterId, updates) {
  const eaters = loadEaters();
  const index = eaters.findIndex(e => e.eaterId === eaterId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'EATER_NOT_FOUND',
      message: `Eater ${eaterId} not found`
    };
  }
  
  // If setting this eater as default, unset others
  if (updates.isDefault === true) {
    eaters.forEach((e, i) => {
      if (i !== index) {
        e.isDefault = false;
      }
    });
  }
  
  // Apply updates
  eaters[index] = {
    ...eaters[index],
    ...updates,
    eaterId: eaters[index].eaterId, // Don't allow ID change
    updatedAt: new Date().toISOString()
  };
  
  return saveEaters(eaters);
}

/**
 * Delete an eater by ID
 * @param {string} eaterId - ID of eater to delete
 * @returns {Object} Result object with success status
 */
export function deleteEater(eaterId) {
  const eaters = loadEaters();
  const eaterToDelete = eaters.find(e => e.eaterId === eaterId);
  
  if (!eaterToDelete) {
    return {
      success: false,
      error: 'EATER_NOT_FOUND',
      message: `Eater ${eaterId} not found`
    };
  }
  
  // Prevent deletion of default eater if it's the only one
  if (eaterToDelete.isDefault && eaters.length === 1) {
    return {
      success: false,
      error: 'CANNOT_DELETE_ONLY_EATER',
      message: 'Cannot delete the only household member'
    };
  }
  
  // Remove the eater
  const filtered = eaters.filter(e => e.eaterId !== eaterId);
  
  // If deleted eater was default, make another one default
  if (eaterToDelete.isDefault && filtered.length > 0) {
    filtered[0].isDefault = true;
  }
  
  return saveEaters(filtered);
}

/**
 * Load recipes from localStorage
 * @returns {Array} Array of recipe objects
 */
export function loadRecipes() {
  try {
    const saved = localStorage.getItem(VANESSA_RECIPES);
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
 * @param {boolean} updateIndex - Whether to update recipe index (default: true)
 * @returns {Object} Result object with success status
 */
export function saveRecipes(recipes, updateIndex = true) {
  if (!Array.isArray(recipes)) {
    console.error('saveRecipes: expected array, got', typeof recipes);
    return { success: false, error: 'INVALID_TYPE', message: 'Expected array' };
  }
  
  const result = safeSave(VANESSA_RECIPES, recipes);
  
  // Auto-update recipe index when user recipes change
  if (result.success && updateIndex) {
    updateRecipeIndex();
  }
  
  return result;
}

/**
 * Update recipe index with catalog + user recipes
 * Called automatically when user recipes change
 */
async function updateRecipeIndex() {
  try {
    // Dynamically import to avoid circular dependency
    const { rebuildRecipeIndexFull } = await import('./catalogStorage.js');
    
    // Rebuild full index (catalog + user recipes)
    await rebuildRecipeIndexFull();
    
  } catch (error) {
    console.error('Error updating recipe index:', error);
  }
}

/**
 * Load meals from localStorage
 * @returns {Array} Array of meal objects
 */
export function loadMeals() {
  try {
    const saved = localStorage.getItem(VANESSA_MEALS);
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
  return safeSave(VANESSA_MEALS, meals);
}

/**
 * Load current meal plan from localStorage
 * @returns {Object|null} Meal plan object or null if none exists
 */
export function loadCurrentMealPlan() {
  try {
    const saved = localStorage.getItem(VANESSA_CURRENT_MEAL_PLAN);
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
  return safeSave(VANESSA_CURRENT_MEAL_PLAN, plan);
}

// ============================================================================
// SLICE 3: Recipe Enhancement Functions (Task 42)
// ============================================================================

/**
 * Toggle favorite status for a recipe
 * @param {string} recipeId - Recipe ID to toggle
 * @returns {Object} Result object with success status
 */
export function toggleFavorite(recipeId) {
  const recipes = loadRecipes();
  const index = recipes.findIndex(r => r.recipeId === recipeId);
  
  if (index === -1) {
    return { 
      success: false, 
      error: 'RECIPE_NOT_FOUND', 
      message: `Recipe ${recipeId} not found` 
    };
  }
  
  recipes[index].isFavorite = !recipes[index].isFavorite;
  recipes[index].updatedAt = new Date().toISOString();
  
  return saveRecipes(recipes);
}

/**
 * Update rating for a recipe
 * @param {string} recipeId - Recipe ID to update
 * @param {number|null} rating - Rating value (1-5) or null to clear
 * @returns {Object} Result object with success status
 */
export function updateRating(recipeId, rating) {
  // Validate rating
  if (rating !== null && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return { 
      success: false, 
      error: 'INVALID_RATING', 
      message: 'Rating must be a number between 1-5 or null' 
    };
  }
  
  const recipes = loadRecipes();
  const index = recipes.findIndex(r => r.recipeId === recipeId);
  
  if (index === -1) {
    return { 
      success: false, 
      error: 'RECIPE_NOT_FOUND', 
      message: `Recipe ${recipeId} not found` 
    };
  }
  
  recipes[index].rating = rating;
  recipes[index].updatedAt = new Date().toISOString();
  
  return saveRecipes(recipes);
}

/**
 * Increment times cooked counter for a recipe
 * @param {string} recipeId - Recipe ID to increment
 * @returns {Object} Result object with success status
 */
export function incrementTimesCooked(recipeId) {
  const recipes = loadRecipes();
  const index = recipes.findIndex(r => r.recipeId === recipeId);
  
  if (index === -1) {
    return { 
      success: false, 
      error: 'RECIPE_NOT_FOUND', 
      message: `Recipe ${recipeId} not found` 
    };
  }
  
  recipes[index].timesCooked = (recipes[index].timesCooked || 0) + 1;
  recipes[index].lastCooked = new Date().toISOString();
  recipes[index].updatedAt = new Date().toISOString();
  
  return saveRecipes(recipes);
}

/**
 * Update a recipe by ID (Slice 4: Task 48)
 * Preserves recipeId to maintain references from meals
 * @param {string} recipeId - Recipe ID to update
 * @param {Object} updatedData - Fields to update
 * @returns {Object} Result object with success status and updated recipe
 */
export function updateRecipe(recipeId, updatedData) {
  // Validate recipeId
  if (!recipeId || !validateId(recipeId, 'recipe')) {
    return {
      success: false,
      error: 'INVALID_RECIPE_ID',
      message: 'Invalid recipe ID format'
    };
  }
  
  // Load all recipes
  const recipes = loadRecipes();
  const index = recipes.findIndex(r => r.recipeId === recipeId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'RECIPE_NOT_FOUND',
      message: `Recipe ${recipeId} not found`
    };
  }
  
  // Validate critical fields if present
  if (updatedData.name !== undefined) {
    if (typeof updatedData.name !== 'string' || updatedData.name.length < 3 || updatedData.name.length > 100) {
      return {
        success: false,
        error: 'INVALID_NAME',
        message: 'Recipe name must be 3-100 characters'
      };
    }
  }
  
  if (updatedData.ingredients !== undefined) {
    if (!Array.isArray(updatedData.ingredients) || updatedData.ingredients.length < 1) {
      return {
        success: false,
        error: 'INVALID_INGREDIENTS',
        message: 'At least one ingredient is required'
      };
    }
    if (updatedData.ingredients.length > 30) {
      return {
        success: false,
        error: 'TOO_MANY_INGREDIENTS',
        message: 'Maximum 30 ingredients allowed'
      };
    }
  }
  
  if (updatedData.instructions !== undefined) {
    if (typeof updatedData.instructions !== 'string' || updatedData.instructions.length < 10) {
      return {
        success: false,
        error: 'INVALID_INSTRUCTIONS',
        message: 'Instructions must be at least 10 characters'
      };
    }
  }
  
  if (updatedData.prepTime !== undefined || updatedData.cookTime !== undefined) {
    if ((updatedData.prepTime !== undefined && (typeof updatedData.prepTime !== 'number' || updatedData.prepTime < 0)) ||
        (updatedData.cookTime !== undefined && (typeof updatedData.cookTime !== 'number' || updatedData.cookTime < 0))) {
      return {
        success: false,
        error: 'INVALID_TIME',
        message: 'Prep and cook times must be non-negative numbers'
      };
    }
  }
  
  // Update recipe while preserving its ID
  recipes[index] = {
    ...recipes[index],
    ...updatedData,
    recipeId: recipes[index].recipeId, // CRITICAL: Never change the ID
    updatedAt: new Date().toISOString()
  };
  
  const result = saveRecipes(recipes);
  
  if (result.success) {
    return {
      success: true,
      recipe: recipes[index],
      message: 'Recipe updated successfully'
    };
  }
  
  return result;
}

/**
 * Migrate existing recipes to include new fields for Slice 3
 * Adds: isFavorite, rating, timesCooked, lastCooked, updatedAt
 * @returns {Object} Result object with success status and migration stats
 */
export function migrateRecipes() {
  const recipes = loadRecipes();
  
  if (recipes.length === 0) {
    return {
      success: true,
      migrated: 0,
      message: 'No recipes to migrate'
    };
  }
  
  let migratedCount = 0;
  const updated = recipes.map(recipe => {
    const needsMigration = 
      recipe.isFavorite === undefined ||
      recipe.rating === undefined ||
      recipe.timesCooked === undefined ||
      recipe.lastCooked === undefined ||
      recipe.updatedAt === undefined;
    
    if (needsMigration) {
      migratedCount++;
    }
    
    return {
      ...recipe,
      isFavorite: recipe.isFavorite ?? false,
      rating: recipe.rating ?? null,
      timesCooked: recipe.timesCooked ?? 0,
      lastCooked: recipe.lastCooked ?? null,
      updatedAt: recipe.updatedAt ?? recipe.createdAt ?? new Date().toISOString()
    };
  });
  
  const result = saveRecipes(updated);
  
  if (result.success) {
    return {
      success: true,
      migrated: migratedCount,
      total: recipes.length,
      message: `Migrated ${migratedCount} of ${recipes.length} recipes`
    };
  }
  
  return result;
}

// ============================================================================
// SLICE 3: Storage Management Utilities (Task 43)
// ============================================================================

/**
 * Migrate storage keys to standardized vanessa_ prefix
 * @returns {Object} Result object with success status
 */
export function migrateStorageKeys() {
  // Check if migration already completed
  if (localStorage.getItem(VANESSA_MIGRATION_SLICE3) === 'complete') {
    return { 
      success: true, 
      message: 'Migration already completed',
      alreadyMigrated: true
    };
  }
  
  try {
    const migrated = [];
    
    // Rename existing keys to new vanessa_ prefixed keys
    for (const [oldKey, newKey] of Object.entries(KEY_MAPPING)) {
      const value = localStorage.getItem(oldKey);
      if (value !== null) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        migrated.push({ oldKey, newKey });
        console.log(`✓ Migrated ${oldKey} → ${newKey}`);
      }
    }
    
    // Mark migration as complete
    localStorage.setItem(VANESSA_MIGRATION_SLICE3, 'complete');
    localStorage.setItem(VANESSA_SCHEMA_VERSION, '1');
    
    return { 
      success: true, 
      message: `Migration completed successfully (${migrated.length} keys migrated)`,
      migrated
    };
  } catch (error) {
    console.error('Error during storage migration:', error);
    return { 
      success: false, 
      error: 'MIGRATION_FAILED', 
      message: error.message 
    };
  }
}

/**
 * Get storage quota information
 * @returns {Object} Storage stats with usage and warning level
 */
export function getStorageQuota() {
  try {
    let totalBytes = 0;
    
    // Calculate total bytes used in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      // UTF-16 = 2 bytes per character
      totalBytes += (key.length + value.length) * 2;
    }
    
    const limitBytes = 5 * 1024 * 1024; // 5MB typical limit
    const usedMB = totalBytes / 1024 / 1024;
    const percentUsed = (totalBytes / limitBytes) * 100;
    
    return {
      usedBytes: totalBytes,
      usedMB: usedMB.toFixed(2),
      limitMB: 5,
      percentUsed: percentUsed.toFixed(1),
      remainingMB: ((limitBytes - totalBytes) / 1024 / 1024).toFixed(2),
      warning: percentUsed > 80 ? 'critical' : percentUsed > 60 ? 'warning' : 'ok'
    };
  } catch (error) {
    console.error('Error calculating storage quota:', error);
    return {
      usedBytes: 0,
      usedMB: '0.00',
      limitMB: 5,
      percentUsed: '0.0',
      remainingMB: '5.00',
      warning: 'error',
      error: error.message
    };
  }
}

/**
 * Export all app data to downloadable JSON file
 * @returns {Object} Result object with success status and file size
 */
export function exportAllData() {
  try {
    const data = {
      _exportVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '0.8',
      data: {
        chatHistory: loadChatHistory(),
        eaters: loadEaters(),
        recipes: loadRecipes(),
        meals: loadMeals(),
        currentMealPlan: loadCurrentMealPlan(),
        baseSpecification: loadBaseSpecification()
      }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanessa-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { 
      success: true, 
      size: json.length,
      sizeKB: (json.length / 1024).toFixed(2),
      exportedAt: data.exportedAt
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { 
      success: false, 
      error: 'EXPORT_FAILED', 
      message: error.message 
    };
  }
}

/**
 * Import app data from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Result object with success status
 */
export async function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // Validate export version
        if (imported._exportVersion !== 1) {
          throw new Error('Incompatible backup version');
        }
        
        // Restore all data using existing save functions
        const data = imported.data || {};
        let restored = 0;
        
        if (data.chatHistory) {
          saveChatHistory(data.chatHistory);
          restored++;
        }
        if (data.eaters) {
          saveEaters(data.eaters);
          restored++;
        }
        if (data.recipes) {
          saveRecipes(data.recipes);
          restored++;
        }
        if (data.meals) {
          saveMeals(data.meals);
          restored++;
        }
        if (data.currentMealPlan) {
          saveCurrentMealPlan(data.currentMealPlan);
          restored++;
        }
        if (data.baseSpecification) {
          saveBaseSpecification(data.baseSpecification);
          restored++;
        }
        
        resolve({ 
          success: true, 
          restored,
          exportedAt: imported.exportedAt,
          message: `Restored ${restored} data collections`
        });
      } catch (error) {
        reject({ 
          success: false, 
          error: 'IMPORT_FAILED',
          message: error.message 
        });
      }
    };
    
    reader.onerror = () => reject({ 
      success: false, 
      error: 'FILE_READ_ERROR',
      message: 'Failed to read file' 
    });
    
    reader.readAsText(file);
  });
}

/**
 * Delete orphaned recipes (recipes not used in any meal)
 * @returns {Object} Result object with deletion stats
 */
export function deleteOrphanedRecipes() {
  try {
    const recipes = loadRecipes();
    const meals = loadMeals();
    
    // Get all recipe IDs currently in use
    const usedRecipeIds = new Set(meals.map(m => m.recipeId));
    
    // Find orphaned recipes
    const orphaned = recipes.filter(r => !usedRecipeIds.has(r.recipeId));
    
    if (orphaned.length === 0) {
      return { 
        success: true, 
        deleted: 0, 
        remaining: recipes.length,
        message: 'No orphaned recipes found'
      };
    }
    
    // Keep only used recipes
    const remaining = recipes.filter(r => usedRecipeIds.has(r.recipeId));
    const result = saveRecipes(remaining);
    
    if (result.success) {
      return {
        success: true,
        deleted: orphaned.length,
        remaining: remaining.length,
        orphanedNames: orphaned.map(r => r.name),
        message: `Deleted ${orphaned.length} orphaned recipe(s)`
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting orphaned recipes:', error);
    return { 
      success: false, 
      error: 'DELETE_FAILED', 
      message: error.message 
    };
  }
}

// ============================================================================
// SLICE 4: Meal Plan History & Archive System (Tasks 53, 54)
// ============================================================================

// Storage key for meal plan history
const VANESSA_MEAL_PLAN_HISTORY = 'vanessa_meal_plan_history';

/**
 * Load meal plan history from localStorage
 * @returns {Array} Array of archived meal plan objects
 */
export function loadMealPlanHistory() {
  try {
    const saved = localStorage.getItem(VANESSA_MEAL_PLAN_HISTORY);
    if (saved) {
      const history = JSON.parse(saved);
      return Array.isArray(history) ? history : [];
    }
  } catch (error) {
    console.error('Error loading meal plan history:', error);
  }
  return [];
}

/**
 * Save meal plan history to localStorage
 * @param {Array} history - Array of archived meal plan objects
 * @returns {Object} Result object with success status
 */
export function saveMealPlanHistory(history) {
  if (!Array.isArray(history)) {
    return { success: false, error: 'INVALID_TYPE', message: 'Expected array' };
  }
  return safeSave(VANESSA_MEAL_PLAN_HISTORY, history);
}

/**
 * Get history retention weeks setting from base specification
 * @returns {number} Number of weeks to keep (default: 4)
 */
export function getHistoryRetentionWeeks() {
  const baseSpec = loadBaseSpecification();
  return baseSpec?.historyRetentionWeeks || 4;
}

/**
 * Add archived meal plan to history
 * @param {Object} archivedPlan - Archived meal plan object
 * @returns {Object} Result object with success status
 */
export function addToHistory(archivedPlan) {
  try {
    const history = loadMealPlanHistory();
    history.push(archivedPlan);
    return saveMealPlanHistory(history);
  } catch (error) {
    console.error('Error adding to history:', error);
    return {
      success: false,
      error: 'ADD_TO_HISTORY_FAILED',
      message: error.message
    };
  }
}

/**
 * Clean up old meal plan history, keeping only last N weeks
 * @param {number} keepWeeks - Number of most recent weeks to keep
 * @returns {Object} Result object with cleanup stats
 */
export function cleanupHistory(keepWeeks = 4) {
  try {
    const history = loadMealPlanHistory();
    
    if (history.length === 0) {
      return {
        success: true,
        kept: 0,
        removed: 0,
        message: 'No history to clean up'
      };
    }
    
    // Sort by archivedAt (newest first)
    history.sort((a, b) => {
      const dateA = new Date(b.archivedAt || b.createdAt);
      const dateB = new Date(a.archivedAt || a.createdAt);
      return dateA - dateB;
    });
    
    // Keep only last N weeks
    const kept = history.slice(0, keepWeeks);
    const removed = history.length - kept.length;
    
    if (removed > 0) {
      const result = saveMealPlanHistory(kept);
      if (result.success) {
        return {
          success: true,
          kept: kept.length,
          removed,
          message: `Removed ${removed} old meal plan(s), kept ${kept.length}`
        };
      }
      return result;
    }
    
    return {
      success: true,
      kept: kept.length,
      removed: 0,
      message: 'No plans to remove'
    };
  } catch (error) {
    console.error('Error cleaning up history:', error);
    return {
      success: false,
      error: 'CLEANUP_FAILED',
      message: error.message
    };
  }
}

/**
 * Create snapshot of current meal plan with meals and recipes
 * @param {Object} mealPlan - Current meal plan object
 * @returns {Object} Archived plan with snapshots
 */
export function createMealPlanSnapshot(mealPlan) {
  try {
    const meals = loadMeals();
    const recipes = loadRecipes();
    
    // Get recipe IDs used by current meals
    const mealRecipeIds = meals.map(m => m.recipeId);
    const usedRecipes = recipes.filter(r => mealRecipeIds.includes(r.recipeId));
    
    // Create archived plan with snapshots
    const archived = {
      ...mealPlan,
      archivedAt: new Date().toISOString(),
      mealsSnapshot: meals,
      recipesSnapshot: usedRecipes
    };
    
    return archived;
  } catch (error) {
    console.error('Error creating meal plan snapshot:', error);
    throw error;
  }
}

/**
 * Save new meal plan and auto-archive current plan (Slice 4: Task 53)
 * @param {Object} newMealPlan - New meal plan to save as current
 * @returns {Object} Result object with success status and archive info
 */
export function saveNewMealPlan(newMealPlan) {
  try {
    // Validate new meal plan
    if (!newMealPlan || typeof newMealPlan !== 'object') {
      return {
        success: false,
        error: 'INVALID_MEAL_PLAN',
        message: 'Invalid meal plan object'
      };
    }
    
    // Get current meal plan
    const current = loadCurrentMealPlan();
    let archived = false;
    
    if (current) {
      // Create snapshot with meals and recipes
      const archivedPlan = createMealPlanSnapshot(current);
      
      // Add to history
      const historyResult = addToHistory(archivedPlan);
      if (!historyResult.success) {
        console.warn('Failed to archive current plan:', historyResult);
        // Continue anyway - don't block new plan save
      } else {
        archived = true;
      }
      
      // Cleanup old history (keep last N weeks)
      const cleanupResult = cleanupHistory(getHistoryRetentionWeeks());
      if (!cleanupResult.success) {
        console.warn('Failed to cleanup history:', cleanupResult);
        // Continue anyway
      }
    }
    
    // Save new plan as current
    const result = saveCurrentMealPlan(newMealPlan);
    
    if (result.success) {
      return {
        success: true,
        archived,
        message: archived 
          ? 'New meal plan saved, previous plan archived'
          : 'New meal plan saved'
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error saving new meal plan:', error);
    return {
      success: false,
      error: 'SAVE_FAILED',
      message: error.message
    };
  }
}

/**
 * Load a specific historical meal plan by ID
 * @param {string} planId - Meal plan ID to load
 * @returns {Object|null} Archived meal plan or null if not found
 */
export function loadHistoricalPlan(planId) {
  try {
    const history = loadMealPlanHistory();
    return history.find(plan => plan.mealPlanId === planId) || null;
  } catch (error) {
    console.error('Error loading historical plan:', error);
    return null;
  }
}

/**
 * Clear old meal plans (Slice 4: implemented)
 * @param {number} keepMostRecent - Number of most recent plans to keep
 * @returns {Object} Result object with cleanup stats
 */
export function clearOldMealPlans(keepMostRecent = 4) {
  // Now implemented - uses cleanupHistory
  return cleanupHistory(keepMostRecent);
}

// ============================================================================
// Helper functions for import/export (need to be defined)
// ============================================================================

/**
 * Load chat history from localStorage
 * @returns {Array} Chat history array
 */
export function loadChatHistory() {
  try {
    const saved = localStorage.getItem(VANESSA_CHAT_HISTORY);
    if (saved) {
      const history = JSON.parse(saved);
      return Array.isArray(history) ? history : [];
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
}

/**
 * Save chat history to localStorage
 * @param {Array} history - Chat history array
 * @returns {Object} Result object
 */
export function saveChatHistory(history) {
  if (!Array.isArray(history)) {
    return { success: false, error: 'INVALID_TYPE', message: 'Expected array' };
  }
  return safeSave(VANESSA_CHAT_HISTORY, history);
}

/**
 * Load base specification from localStorage
 * @returns {Object|null} Base specification or null
 */
export function loadBaseSpecification() {
  try {
    const saved = localStorage.getItem(VANESSA_BASE_SPECIFICATION);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading base specification:', error);
  }
  return null;
}

/**
 * Save base specification to localStorage
 * @param {Object} spec - Base specification object
 * @returns {Object} Result object
 */
export function saveBaseSpecification(spec) {
  if (typeof spec !== 'object' || spec === null) {
    return { success: false, error: 'INVALID_TYPE', message: 'Expected object' };
  }
  
  // Validate critical fields
  if (spec.weeklyBudget !== null && spec.weeklyBudget !== undefined) {
    if (typeof spec.weeklyBudget !== 'number' || spec.weeklyBudget < 0) {
      return { 
        success: false, 
        error: 'INVALID_BUDGET', 
        message: 'Weekly budget must be a positive number or null' 
      };
    }
  }
  
  if (spec.shoppingDay !== null && spec.shoppingDay !== undefined) {
    if (typeof spec.shoppingDay !== 'number' || spec.shoppingDay < 0 || spec.shoppingDay > 6) {
      return { 
        success: false, 
        error: 'INVALID_SHOPPING_DAY', 
        message: 'Shopping day must be 0-6 (0=Sunday, 6=Saturday)' 
      };
    }
  }
  
  // Update timestamp
  spec.updatedAt = new Date().toISOString();
  
  return safeSave(VANESSA_BASE_SPECIFICATION, spec);
}

// ============================================================================
// SLICE 3: Base Specification Utilities (Task 37)
// ============================================================================

/**
 * Create a default base specification
 * @param {string} ownerEaterId - ID of the owner eater
 * @returns {Object} Default base specification object
 */
export function createDefaultBaseSpecification(ownerEaterId = null) {
  return {
    _schemaVersion: 1,
    ownerEaterId: ownerEaterId,
    weeklyBudget: 150,
    shoppingDay: 6, // Saturday
    preferredStore: '',
    maxShoppingListItems: 30, // Maximum unique ingredients
    householdEaterIds: ownerEaterId ? [ownerEaterId] : [],
    dietaryGoals: '',
    onboardingComplete: false,
    conversation: {
      startedAt: new Date().toISOString(),
      messages: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Get or create base specification
 * Ensures base specification always exists
 * @returns {Object} Base specification object
 */
export function getOrCreateBaseSpecification() {
  let baseSpec = loadBaseSpecification();
  
  if (!baseSpec) {
    // Get owner eater from eaters list
    const eaters = loadEaters();
    const ownerEater = eaters.find(e => e.isDefault) || eaters[0];
    
    // Create default
    baseSpec = createDefaultBaseSpecification(ownerEater?.eaterId);
    const result = saveBaseSpecification(baseSpec);
    
    if (!result.success) {
      console.error('Failed to create default base specification:', result);
      // Return in-memory object even if save failed
    }
  }
  
  return baseSpec;
}

/**
 * Update specific fields in base specification
 * @param {Object} updates - Object with fields to update
 * @returns {Object} Result object with success status
 */
export function updateBaseSpecification(updates) {
  const baseSpec = getOrCreateBaseSpecification();
  
  // Merge updates
  const updated = {
    ...baseSpec,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return saveBaseSpecification(updated);
}
