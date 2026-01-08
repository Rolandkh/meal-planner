/**
 * Initialize Health Data in localStorage
 * Loads bundled ingredient health data and diet profiles into localStorage
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Initialize ingredient health data from bundled JSON
 * @param {Object} bundledData - Imported ingredientHealthData.json
 * @returns {boolean} Success
 */
export async function initializeIngredientHealthData(bundledData) {
  try {
    // Check if already initialized
    const existing = localStorage.getItem(STORAGE_KEYS.INGREDIENT_HEALTH);
    if (existing) {
      const data = JSON.parse(existing);
      // Check version - only update if bundled is newer
      if (data._dataVersion === bundledData._dataVersion) {
        console.log('✅ Ingredient health data already up to date');
        return true;
      }
    }

    // Save bundled data to localStorage
    localStorage.setItem(STORAGE_KEYS.INGREDIENT_HEALTH, JSON.stringify(bundledData));
    console.log(`✅ Initialized ${Object.keys(bundledData.ingredients || {}).length} ingredient health entries`);
    return true;
    
  } catch (error) {
    console.error('Error initializing ingredient health data:', error);
    return false;
  }
}

/**
 * Initialize diet profiles from bundled JSON
 * @param {Object} bundledData - Imported dietProfiles.json
 * @returns {boolean} Success
 */
export async function initializeDietProfiles(bundledData) {
  try {
    // Check if already initialized
    const existing = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    if (existing) {
      const data = JSON.parse(existing);
      // Check version - only update if bundled is newer
      if (data._dataVersion === bundledData._dataVersion) {
        console.log('✅ Diet profiles already up to date');
        return true;
      }
    }

    // Save bundled data to localStorage
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(bundledData));
    console.log(`✅ Initialized ${bundledData.profiles?.length || 0} diet profiles`);
    return true;
    
  } catch (error) {
    console.error('Error initializing diet profiles:', error);
    return false;
  }
}

/**
 * Bootstrap all health data on app initialization
 * Called from main.js before app mounts
 */
export async function bootstrapHealthData() {
  console.log('🔄 Bootstrapping health data...');
  
  try {
    // Dynamically import bundled data
    const [ingredientData, profileData] = await Promise.all([
      import('../data/ingredientHealthData.json', { assert: { type: 'json' } })
        .catch(() => ({ default: { ingredients: {}, _dataVersion: '1.0.0' } })),
      import('../data/dietProfiles.json', { assert: { type: 'json' } })
        .catch(() => ({ default: { profiles: [], _dataVersion: '1.0.0' } }))
    ]);

    await Promise.all([
      initializeIngredientHealthData(ingredientData.default),
      initializeDietProfiles(profileData.default)
    ]);

    console.log('✅ Health data bootstrap complete');
    return true;
    
  } catch (error) {
    console.error('❌ Error bootstrapping health data:', error);
    return false;
  }
}
