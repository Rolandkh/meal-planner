/**
 * Ingredient Master Dictionary Loader
 * 
 * Browser-compatible version - uses static import instead of fs
 * Provides access to the canonical ingredient master dictionary
 * used for normalization, matching, and conversion operations.
 */

import masterData from '../data/ingredientMaster.js';

export const ingredientMaster = masterData.ingredients;
export const masterMetadata = {
  version: masterData._version,
  lastUpdated: masterData._lastUpdated,
  totalEntries: masterData._totalEntries,
  coverage: masterData._coverage
};

/**
 * Get a specific ingredient entry by ID
 * @param {string} id - The ingredient ID (e.g., 'onion', 'garlic')
 * @returns {Object|null} The ingredient entry or null if not found
 */
export function getMasterIngredient(id) {
  return ingredientMaster[id] || null;
}

/**
 * Get all master ingredient entries as an array
 * @returns {Array} Array of all ingredient entries
 */
export function getAllMasterIngredients() {
  return Object.values(ingredientMaster);
}

/**
 * Get all ingredient IDs
 * @returns {Array<string>} Array of ingredient IDs
 */
export function getAllIngredientIds() {
  return Object.keys(ingredientMaster);
}

/**
 * Search for ingredients by alias
 * @param {string} alias - The alias to search for
 * @returns {Object|null} The first matching ingredient entry or null
 */
export function findByAlias(alias) {
  const normalized = alias.toLowerCase().trim();
  
  for (const [id, ingredient] of Object.entries(ingredientMaster)) {
    if (ingredient.aliases && ingredient.aliases.some(a => 
      a.toLowerCase() === normalized
    )) {
      return ingredient;
    }
  }
  
  return null;
}

/**
 * Get dictionary statistics
 * @returns {Object} Statistics about the dictionary
 */
export function getDictionaryStats() {
  const ingredients = getAllMasterIngredients();
  
  return {
    totalIngredients: ingredients.length,
    byState: {
      fresh: ingredients.filter(i => i.state === 'fresh').length,
      frozen: ingredients.filter(i => i.state === 'frozen').length,
      canned: ingredients.filter(i => i.state === 'canned').length,
      dried: ingredients.filter(i => i.state === 'dried').length,
      other: ingredients.filter(i => i.state === 'other').length
    },
    byUnit: {
      grams: ingredients.filter(i => i.canonicalUnit === 'g').length,
      milliliters: ingredients.filter(i => i.canonicalUnit === 'ml').length,
      whole: ingredients.filter(i => i.canonicalUnit === 'whole').length
    },
    withDensity: ingredients.filter(i => i.density && (
      i.density.gPerCup || i.density.gPerTbsp || i.density.gPerTsp
    )).length,
    version: masterMetadata.version,
    lastUpdated: masterMetadata.lastUpdated
  };
}

export default {
  ingredientMaster,
  masterMetadata,
  getMasterIngredient,
  getAllMasterIngredients,
  getAllIngredientIds,
  findByAlias,
  getDictionaryStats
};
