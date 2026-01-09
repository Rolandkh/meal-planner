/**
 * Recipe Catalog Storage
 * Manages vanessa_recipe_catalog in localStorage
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Load recipe catalog from localStorage or static file
 * @returns {Array} Array of catalog recipes
 */
export async function getRecipeCatalog() {
  try {
    // Try localStorage first
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPE_CATALOG);
    if (stored) {
      const data = JSON.parse(stored);
      return data.recipes || [];
    }

    // If not in localStorage, try to load from static file
    console.log('📦 Catalog not in localStorage, loading from file...');
    try {
      const response = await fetch('/src/data/vanessa_recipe_catalog.json');
      if (response.ok) {
        const catalogData = await response.json();
        
        // Save to localStorage for faster future loads
        localStorage.setItem(STORAGE_KEYS.RECIPE_CATALOG, JSON.stringify(catalogData));
        console.log(`✅ Loaded ${catalogData.recipes?.length || 0} recipes from catalog file`);
        
        return catalogData.recipes || [];
      }
    } catch (fetchError) {
      console.warn('Could not load catalog from file:', fetchError);
    }

    return [];
    
  } catch (error) {
    console.error('Error loading recipe catalog:', error);
    return [];
  }
}

/**
 * Synchronous version - loads from localStorage only
 * @returns {Array} Array of catalog recipes
 */
export function getRecipeCatalogSync() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPE_CATALOG);
    if (!stored) {
      console.warn('⚠️ Catalog not in localStorage - use loadCatalogFromFile() first');
      return [];
    }

    const data = JSON.parse(stored);
    return data.recipes || [];
    
  } catch (error) {
    console.error('Error loading recipe catalog:', error);
    return [];
  }
}

/**
 * Load catalog from file into localStorage (one-time import)
 * @returns {Promise<boolean>} Success
 */
export async function loadCatalogFromFile() {
  try {
    console.log('📂 Loading catalog from file...');
    const response = await fetch('/src/data/vanessa_recipe_catalog.json');
    
    if (!response.ok) {
      console.error('Catalog file not found');
      return false;
    }

    const catalogData = await response.json();
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.RECIPE_CATALOG, JSON.stringify(catalogData));
    console.log(`✅ Loaded ${catalogData.recipes?.length || 0} recipes into localStorage`);
    
    return true;
    
  } catch (error) {
    console.error('Error loading catalog from file:', error);
    return false;
  }
}

/**
 * Save recipe catalog to localStorage
 * @param {Array} recipes - Array of recipe objects
 * @param {boolean} updateIndex - Whether to regenerate the recipe index (default: true)
 * @returns {boolean} Success
 */
export function saveRecipeCatalog(recipes, updateIndex = true) {
  try {
    const catalog = {
      _catalogVersion: '2.0.0',
      _lastUpdated: new Date().toISOString(),
      _count: recipes.length,
      recipes
    };

    localStorage.setItem(STORAGE_KEYS.RECIPE_CATALOG, JSON.stringify(catalog));
    console.log(`✅ Saved ${recipes.length} recipes to catalog`);
    
    // Auto-update recipe index whenever catalog changes
    if (updateIndex) {
      regenerateRecipeIndex(recipes);
    }
    
    return true;
    
  } catch (error) {
    console.error('Error saving recipe catalog:', error);
    
    // Check for quota exceeded
    if (error.name === 'QuotaExceededError') {
      console.error('❌ localStorage quota exceeded! Catalog too large.');
    }
    
    return false;
  }
}

/**
 * Add or update recipes in catalog (upsert)
 * @param {Array} newRecipes - Recipes to add/update
 * @returns {number} Number of recipes added
 */
export function upsertCatalogRecipes(newRecipes) {
  const existing = getRecipeCatalog();
  const existingMap = new Map(existing.map(r => [r.spoonacularId || r.recipeId, r]));
  
  let added = 0;
  for (const recipe of newRecipes) {
    const key = recipe.spoonacularId || recipe.recipeId;
    if (!existingMap.has(key)) {
      added++;
    }
    existingMap.set(key, recipe);
  }
  
  const merged = Array.from(existingMap.values());
  saveRecipeCatalog(merged);
  
  return added;
}

/**
 * Find recipe by Spoonacular ID
 * @param {number} spoonacularId
 * @returns {Object|null}
 */
export function findRecipeBySpoonacularId(spoonacularId) {
  const catalog = getRecipeCatalog();
  return catalog.find(r => r.spoonacularId === spoonacularId) || null;
}

/**
 * Find recipe by internal recipe ID
 * @param {string} recipeId
 * @returns {Object|null}
 */
export function findCatalogRecipeById(recipeId) {
  const catalog = getRecipeCatalog();
  return catalog.find(r => r.recipeId === recipeId) || null;
}

/**
 * Get catalog statistics
 * @returns {Object} Stats
 */
export function getCatalogStats() {
  const catalog = getRecipeCatalog();
  
  const cuisines = new Set();
  const diets = new Set();
  const mealSlots = new Set();
  
  catalog.forEach(r => {
    r.tags?.cuisines?.forEach(c => cuisines.add(c));
    r.tags?.diets?.forEach(d => diets.add(d));
    r.tags?.mealSlots?.forEach(m => mealSlots.add(m));
  });
  
  return {
    totalRecipes: catalog.length,
    cuisines: Array.from(cuisines).sort(),
    diets: Array.from(diets).sort(),
    mealSlots: Array.from(mealSlots).sort(),
    avgScore: catalog.reduce((sum, r) => sum + (r.dietCompassScores?.overall || 0), 0) / catalog.length || 0
  };
}

/**
 * Clear the catalog (for development/testing)
 * @returns {boolean} Success
 */
export function clearCatalog() {
  try {
    saveRecipeCatalog([]);
    console.log('✅ Catalog cleared');
    return true;
  } catch (error) {
    console.error('Error clearing catalog:', error);
    return false;
  }
}

/**
 * Load lightweight recipe index for meal plan generation
 * This is a much smaller file (78% smaller) containing only essential recipe info
 * @returns {Promise<Array>} Array of recipe summaries
 */
export async function getRecipeIndex() {
  try {
    // Try localStorage first
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPE_INDEX);
    if (stored) {
      const data = JSON.parse(stored);
      return data.recipes || [];
    }

    // If not in localStorage, load from static file
    console.log('📦 Recipe index not in localStorage, loading from file...');
    try {
      const response = await fetch('/src/data/recipe_index.json');
      if (response.ok) {
        const indexData = await response.json();
        
        // Save to localStorage for faster future loads
        localStorage.setItem(STORAGE_KEYS.RECIPE_INDEX, JSON.stringify(indexData));
        console.log(`✅ Loaded ${indexData.recipes?.length || 0} recipes from index file`);
        
        return indexData.recipes || [];
      }
    } catch (fetchError) {
      console.warn('Could not load recipe index from file:', fetchError);
    }

    return [];
    
  } catch (error) {
    console.error('Error loading recipe index:', error);
    return [];
  }
}

/**
 * Synchronous version - loads recipe index from localStorage only
 * @returns {Array} Array of recipe summaries
 */
export function getRecipeIndexSync() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPE_INDEX);
    if (!stored) {
      console.warn('⚠️ Recipe index not in localStorage - use loadRecipeIndexFromFile() first');
      return [];
    }

    const data = JSON.parse(stored);
    return data.recipes || [];
    
  } catch (error) {
    console.error('Error loading recipe index:', error);
    return [];
  }
}

/**
 * Load recipe index from file into localStorage (one-time import)
 * @returns {Promise<boolean>} Success
 */
export async function loadRecipeIndexFromFile() {
  try {
    console.log('📂 Loading recipe index from file...');
    const response = await fetch('/src/data/recipe_index.json');
    
    if (!response.ok) {
      console.error('Recipe index file not found');
      return false;
    }

    const indexData = await response.json();
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.RECIPE_INDEX, JSON.stringify(indexData));
    console.log(`✅ Loaded ${indexData.recipes?.length || 0} recipe summaries into localStorage`);
    
    return true;
    
  } catch (error) {
    console.error('Error loading recipe index from file:', error);
    return false;
  }
}

/**
 * Regenerate recipe index from provided recipes (lightweight version for Claude)
 * Called automatically when catalog is saved
 * @param {Array} recipes - Array of full recipe objects
 * @returns {boolean} Success
 */
export function regenerateRecipeIndex(recipes) {
  try {
    // Transform to lightweight entries (no full ingredients/instructions)
    const indexEntries = recipes.map(recipe => ({
      recipeId: recipe.recipeId,
      name: recipe.name,
      prepTime: recipe.prepTime || 0,
      cookTime: recipe.cookTime || 0,
      servings: recipe.servings || 4,
      
      // Nutrition (if available)
      calories: recipe.nutrition?.calories || 0,
      protein: recipe.nutrition?.protein || 0,
      carbs: recipe.nutrition?.carbs || 0,
      fat: recipe.nutrition?.fat || 0,
      fiber: recipe.nutrition?.fiber || 0,
      
      // Tags for filtering
      cuisines: recipe.tags?.cuisines || [],
      diets: recipe.tags?.diets || [],
      dishTypes: recipe.tags?.dishTypes || [],
      mealSlots: recipe.tags?.mealSlots || [],
      proteinSources: recipe.tags?.proteinSources || [],
      effortLevel: recipe.tags?.effortLevel || 'medium',
      
      // Main ingredients (first 5-8 by quantity)
      mainIngredients: extractMainIngredients(recipe.ingredients),
      
      // Diet flags (quick filters)
      vegetarian: recipe.tags?.diets?.includes('vegetarian') || recipe.tags?.diets?.includes('lacto ovo vegetarian'),
      vegan: recipe.tags?.diets?.includes('vegan'),
      glutenFree: recipe.tags?.diets?.includes('gluten free'),
      dairyFree: recipe.tags?.diets?.includes('dairy free'),
      ketogenic: recipe.tags?.diets?.includes('ketogenic'),
      pescatarian: recipe.tags?.diets?.includes('pescatarian'),
      
      // Health score (if available)
      healthScore: recipe.dietCompassScores?.overall || null,
      
      // Source
      source: recipe.source || 'user'
    }));
    
    // Build index structure
    const index = {
      _version: '2.0.0',
      _lastUpdated: new Date().toISOString(),
      _count: indexEntries.length,
      _description: 'Lightweight recipe index for Claude meal plan generation',
      _usage: 'Contains only essential recipe info (no full ingredients/instructions)',
      _source: 'Auto-generated from recipe catalog',
      recipes: indexEntries
    };
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.RECIPE_INDEX, JSON.stringify(index));
    console.log(`✅ Recipe index updated: ${indexEntries.length} recipes`);
    
    return true;
    
  } catch (error) {
    console.error('Error regenerating recipe index:', error);
    return false;
  }
}

/**
 * Rebuild recipe index from both catalog AND user recipes
 * Called when user recipes change to ensure index includes everything
 * @returns {Promise<boolean>} Success
 */
export async function rebuildRecipeIndexFull() {
  try {
    // Get catalog recipes
    const catalogRecipes = getRecipeCatalogSync();
    
    // Get user recipes (async import to avoid circular dependency)
    const { loadRecipes } = await import('./storage.js');
    const userRecipes = loadRecipes();
    
    // Combine (catalog first for priority)
    const allRecipes = [...catalogRecipes, ...userRecipes];
    
    console.log(`🔄 Rebuilding index: ${catalogRecipes.length} catalog + ${userRecipes.length} user recipes`);
    
    // Regenerate index with combined recipes
    return regenerateRecipeIndex(allRecipes);
    
  } catch (error) {
    console.error('Error rebuilding full recipe index:', error);
    return false;
  }
}

/**
 * Extract main ingredients (first 5-8 most significant)
 * Helper for recipe index generation
 */
function extractMainIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return [];
  
  // Sort by quantity (descending) and take top ingredients
  const sorted = [...ingredients]
    .filter(ing => ing.name && ing.quantity)
    .sort((a, b) => {
      // Convert to approximate grams for sorting
      const aGrams = convertToGrams(a.quantity, a.unit);
      const bGrams = convertToGrams(b.quantity, b.unit);
      return bGrams - aGrams;
    })
    .slice(0, 8)  // Top 8 ingredients
    .map(ing => ing.name);
  
  return sorted.length > 0 ? sorted : ingredients.slice(0, 5).map(i => i.name);
}

/**
 * Rough conversion to grams for sorting ingredients
 * Helper for extractMainIngredients
 */
function convertToGrams(quantity, unit) {
  if (!quantity) return 0;
  
  const conversions = {
    'g': 1,
    'kg': 1000,
    'oz': 28,
    'lb': 454,
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'ml': 1,
    'l': 1000
  };
  
  const unitLower = (unit || '').toLowerCase();
  const multiplier = conversions[unitLower] || 100; // Default guess
  
  return quantity * multiplier;
}
