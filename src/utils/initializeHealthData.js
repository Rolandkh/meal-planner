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
      const existingVersion = data._dataVersion || '0.0.0';
      const bundledVersion = bundledData._dataVersion || '0.0.0';
      
      // Only skip if bundled version is NOT newer
      if (existingVersion === bundledVersion) {
        console.log(`✅ Diet profiles already up to date (v${existingVersion})`);
        return true;
      }
      
      // Bundled is newer - update it
      console.log(`🔄 Updating diet profiles: v${existingVersion} → v${bundledVersion}`);
    }

    // Save bundled data to localStorage (new install or update)
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(bundledData));
    console.log(`✅ Initialized ${bundledData.profiles?.length || 0} diet profiles (v${bundledData._dataVersion})`);
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
    // Load data using fetch (more compatible than import with assert)
    const [ingredientData, profileData] = await Promise.all([
      fetch('/src/data/ingredientHealthData.json')
        .then(async r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          const data = await r.json();
          console.log('📦 Loaded ingredient data:', Object.keys(data.ingredients || {}).length, 'ingredients');
          return data;
        })
        .catch(err => {
          console.error('Failed to load ingredient data:', err.message);
          return { ingredients: {}, _dataVersion: '1.0.0' };
        }),
      fetch('/src/data/dietProfiles.json')
        .then(async r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          const data = await r.json();
          console.log('📦 Loaded diet profiles data:', data.profiles?.length || 0, 'profiles, version:', data._dataVersion);
          return data;
        })
        .catch(err => {
          console.error('Failed to load diet profiles:', err.message);
          return { profiles: [], _dataVersion: '1.0.0' };
        })
    ]);

    await Promise.all([
      initializeIngredientHealthData(ingredientData),
      initializeDietProfiles(profileData)
    ]);

    console.log('✅ Health data bootstrap complete');
    return true;
    
  } catch (error) {
    console.error('❌ Error bootstrapping health data:', error);
    return false;
  }
}
