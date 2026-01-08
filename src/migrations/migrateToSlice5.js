/**
 * Slice 5 Data Migration
 * Upgrades localStorage data from Slice 4 (schema v1) to Slice 5 (schema v2)
 * 
 * Runs automatically on app boot, idempotent
 */

import { 
  SCHEMA_DEFAULTS, 
  STORAGE_KEYS,
  SCHEMA_VERSION,
  normalizeRecipe,
  normalizeEater,
  normalizeBaseSpecification,
  normalizeMeal
} from '../types/schemas.js';

/**
 * Check if Slice 5 migration has already been run
 * @returns {boolean}
 */
export function isSlice5Migrated() {
  return localStorage.getItem(STORAGE_KEYS.MIGRATION_SLICE_5) === 'complete';
}

/**
 * Main migration function - runs once on app boot
 * @returns {Object} Migration results
 */
export function migrateToSlice5() {
  console.log('🔄 Checking for Slice 5 migration...');
  
  // Check if already migrated
  if (isSlice5Migrated()) {
    console.log('✅ Slice 5 migration already complete');
    return { alreadyMigrated: true };
  }

  console.log('🚀 Starting Slice 5 migration...');
  const results = {
    baseSpecification: false,
    eaters: 0,
    recipes: 0,
    meals: 0,
    newKeys: [],
    errors: []
  };

  try {
    // 1. Migrate BaseSpecification
    results.baseSpecification = migrateBaseSpecification();
    
    // 2. Migrate Eaters
    results.eaters = migrateEaters();
    
    // 3. Migrate Recipes
    results.recipes = migrateRecipes();
    
    // 4. Migrate Meals
    results.meals = migrateMeals();
    
    // 5. Initialize new localStorage keys
    results.newKeys = initializeNewStorageKeys();
    
    // 6. Mark migration complete
    localStorage.setItem(STORAGE_KEYS.MIGRATION_SLICE_5, 'complete');
    
    console.log('✅ Slice 5 migration complete!', results);
    return { success: true, ...results };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    results.errors.push(error.message);
    return { success: false, ...results };
  }
}

/**
 * Migrate BaseSpecification to schema v2
 * @returns {boolean} Success
 */
function migrateBaseSpecification() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BASE_SPECIFICATION);
    if (!stored) {
      console.log('⚠️ No BaseSpecification found - will be created on onboarding');
      return false;
    }

    const spec = JSON.parse(stored);
    
    // Check if already v2
    if (spec._schemaVersion >= SCHEMA_VERSION.SLICE_5) {
      console.log('✅ BaseSpecification already at schema v2');
      return true;
    }

    // Normalize to v2
    const normalized = normalizeBaseSpecification(spec);
    
    // Save
    localStorage.setItem(STORAGE_KEYS.BASE_SPECIFICATION, JSON.stringify(normalized));
    console.log('✅ Migrated BaseSpecification to schema v2');
    return true;
    
  } catch (error) {
    console.error('❌ Error migrating BaseSpecification:', error);
    throw error;
  }
}

/**
 * Migrate all Eaters to include diet profile fields
 * @returns {number} Number of eaters migrated
 */
function migrateEaters() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EATERS);
    if (!stored) {
      console.log('⚠️ No eaters found');
      return 0;
    }

    const eaters = JSON.parse(stored);
    if (!Array.isArray(eaters)) {
      console.warn('⚠️ Eaters is not an array');
      return 0;
    }

    // Normalize each eater
    const normalized = eaters.map(normalizeEater);
    
    // Save
    localStorage.setItem(STORAGE_KEYS.EATERS, JSON.stringify(normalized));
    console.log(`✅ Migrated ${normalized.length} eater(s)`);
    return normalized.length;
    
  } catch (error) {
    console.error('❌ Error migrating eaters:', error);
    throw error;
  }
}

/**
 * Migrate all Recipes to schema v2
 * @returns {number} Number of recipes migrated
 */
function migrateRecipes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!stored) {
      console.log('⚠️ No recipes found');
      return 0;
    }

    const recipes = JSON.parse(stored);
    if (!Array.isArray(recipes)) {
      console.warn('⚠️ Recipes is not an array');
      return 0;
    }

    // Normalize each recipe
    const normalized = recipes.map(normalizeRecipe);
    
    // Save
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(normalized));
    console.log(`✅ Migrated ${normalized.length} recipe(s)`);
    return normalized.length;
    
  } catch (error) {
    console.error('❌ Error migrating recipes:', error);
    throw error;
  }
}

/**
 * Migrate all Meals to include new fields
 * @returns {number} Number of meals migrated
 */
function migrateMeals() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!stored) {
      console.log('⚠️ No meals found');
      return 0;
    }

    const meals = JSON.parse(stored);
    if (!Array.isArray(meals)) {
      console.warn('⚠️ Meals is not an array');
      return 0;
    }

    // Normalize each meal
    const normalized = meals.map(normalizeMeal);
    
    // Save
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(normalized));
    console.log(`✅ Migrated ${normalized.length} meal(s)`);
    return normalized.length;
    
  } catch (error) {
    console.error('❌ Error migrating meals:', error);
    throw error;
  }
}

/**
 * Initialize new localStorage keys for Slice 5
 * @returns {string[]} Keys created
 */
function initializeNewStorageKeys() {
  const created = [];

  try {
    // Recipe Catalog (empty initially - will be populated by extraction)
    if (!localStorage.getItem(STORAGE_KEYS.RECIPE_CATALOG)) {
      localStorage.setItem(STORAGE_KEYS.RECIPE_CATALOG, JSON.stringify({
        _catalogVersion: '1.0.0',
        _lastUpdated: new Date().toISOString(),
        recipes: []
      }));
      created.push(STORAGE_KEYS.RECIPE_CATALOG);
      console.log('✅ Created vanessa_recipe_catalog');
    }

    // Ingredient Health Data (will be populated from bundled data)
    if (!localStorage.getItem(STORAGE_KEYS.INGREDIENT_HEALTH)) {
      localStorage.setItem(STORAGE_KEYS.INGREDIENT_HEALTH, JSON.stringify({
        _dataVersion: '1.0.0',
        _lastUpdated: new Date().toISOString(),
        ingredients: {}
      }));
      created.push(STORAGE_KEYS.INGREDIENT_HEALTH);
      console.log('✅ Created vanessa_ingredient_health');
    }

    // Diet Profiles (will be populated from bundled data)
    if (!localStorage.getItem(STORAGE_KEYS.DIET_PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify({
        _dataVersion: '1.0.0',
        _lastUpdated: new Date().toISOString(),
        profiles: []
      }));
      created.push(STORAGE_KEYS.DIET_PROFILES);
      console.log('✅ Created vanessa_diet_profiles');
    }

    return created;
    
  } catch (error) {
    console.error('❌ Error initializing new storage keys:', error);
    throw error;
  }
}

/**
 * Force re-run migration (for development/testing only)
 */
export function resetMigration() {
  localStorage.removeItem(STORAGE_KEYS.MIGRATION_SLICE_5);
  console.log('🔄 Migration flag reset - will run on next boot');
}

/**
 * Get migration status
 * @returns {Object} Status information
 */
export function getMigrationStatus() {
  return {
    isComplete: isSlice5Migrated(),
    schemaVersion: SCHEMA_VERSION.CURRENT,
    storageKeys: Object.keys(STORAGE_KEYS).map(key => ({
      key: STORAGE_KEYS[key],
      exists: !!localStorage.getItem(STORAGE_KEYS[key]),
      size: localStorage.getItem(STORAGE_KEYS[key])?.length || 0
    }))
  };
}
