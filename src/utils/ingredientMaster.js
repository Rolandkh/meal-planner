/**
 * Ingredient Master Dictionary Loader
 * 
 * Browser-compatible version - fetches JSON on demand
 * Provides access to the canonical ingredient master dictionary
 * used for normalization, matching, and conversion operations.
 */

let masterData = null;
let loadPromise = null;

async function ensureLoaded() {
  if (masterData) return masterData;

  if (!loadPromise) {
    loadPromise = fetch('/src/data/ingredientMaster.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load ingredient master');
        return r.json();
      })
      .then(data => {
        masterData = data;
        return data;
      });
  }

  return loadPromise;
}

export async function getMasterMetadata() {
  const data = await ensureLoaded();
  return {
    version: data._version,
    lastUpdated: data._lastUpdated,
    totalEntries: data._totalEntries,
    coverage: data._coverage,
  };
}

/**
 * Get a specific ingredient entry by ID
 * @param {string} id - The ingredient ID (e.g., 'onion', 'garlic')
 * @returns {Promise<Object|null>} The ingredient entry or null if not found
 */
export async function getMasterIngredient(id) {
  const data = await ensureLoaded();
  return data.ingredients[id] || null;
}

/**
 * Get all master ingredient entries as an array
 * @returns {Promise<Array>} Array of all ingredient entries
 */
export async function getAllMasterIngredients() {
  const data = await ensureLoaded();
  return Object.values(data.ingredients);
}

/**
 * Get all ingredient IDs
 * @returns {Promise<Array<string>>} Array of ingredient IDs
 */
export async function getAllIngredientIds() {
  const data = await ensureLoaded();
  return Object.keys(data.ingredients);
}

/**
 * Search for ingredients by alias
 * @param {string} alias - The alias to search for
 * @returns {Promise<Object|null>} The first matching ingredient entry or null
 */
export async function findByAlias(alias) {
  const data = await ensureLoaded();
  const normalized = alias.toLowerCase().trim();
  
  for (const ingredient of Object.values(data.ingredients)) {
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
 * @returns {Promise<Object>} Statistics about the dictionary
 */
export async function getDictionaryStats() {
  const ingredients = await getAllMasterIngredients();
  const metadata = await getMasterMetadata();
  
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
    version: metadata.version,
    lastUpdated: metadata.lastUpdated
  };
}

// Legacy exports for backward compatibility (now async)
export const ingredientMaster = {
  async get() {
    const data = await ensureLoaded();
    return data.ingredients;
  }
};

export default {
  getMasterMetadata,
  getMasterIngredient,
  getAllMasterIngredients,
  getAllIngredientIds,
  findByAlias,
  getDictionaryStats
};
