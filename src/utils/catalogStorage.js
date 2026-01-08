/**
 * Recipe Catalog Storage
 * Manages vanessa_recipe_catalog in localStorage
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Load recipe catalog from localStorage
 * @returns {Array} Array of catalog recipes
 */
export function getRecipeCatalog() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPE_CATALOG);
    if (!stored) {
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
