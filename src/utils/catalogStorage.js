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
 * @returns {boolean} Success
 */
export function saveRecipeCatalog(recipes) {
  try {
    const catalog = {
      _catalogVersion: '1.0.0',
      _lastUpdated: new Date().toISOString(),
      _count: recipes.length,
      recipes
    };

    localStorage.setItem(STORAGE_KEYS.RECIPE_CATALOG, JSON.stringify(catalog));
    console.log(`✅ Saved ${recipes.length} recipes to catalog`);
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
