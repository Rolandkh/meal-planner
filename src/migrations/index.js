/**
 * Migration Definitions
 * Defines all schema migrations for the application
 * Slice 3 - Task 46
 */

import { MigrationManager } from '../utils/migrationManager.js';
import { 
  migrateStorageKeys, 
  migrateRecipes 
} from '../utils/storage.js';

// Create migration manager instance
const migrationManager = new MigrationManager();

/**
 * Migration to Slice 3 (Version 1)
 * - Rename storage keys to vanessa_ prefix
 * - Create default eater if none exists
 * - Create base specification if none exists
 * - Update recipe schema with new fields
 */
async function migrateToSlice3() {
  try {
    console.log('  → Migrating storage keys...');
    
    // 1. Rename storage keys to vanessa_ prefix
    const keyResult = migrateStorageKeys();
    if (!keyResult.success && !keyResult.alreadyMigrated) {
      return keyResult;
    }
    
    // 2. Create default eater if none exists
    console.log('  → Checking eaters...');
    const eatersKey = 'vanessa_eaters';
    if (!localStorage.getItem(eatersKey)) {
      const defaultEater = {
        eaterId: `eater_${crypto.randomUUID()}`,
        name: 'User',
        preferences: 'No specific preferences',
        allergies: [],
        dietaryRestrictions: [],
        schedule: 'Home for dinner',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(eatersKey, JSON.stringify([defaultEater]));
      console.log('    ✓ Created default eater');
    }
    
    // 3. Create base specification if none exists
    console.log('  → Checking base specification...');
    const baseSpecKey = 'vanessa_base_specification';
    if (!localStorage.getItem(baseSpecKey)) {
      const eatersJson = localStorage.getItem(eatersKey);
      const eaters = eatersJson ? JSON.parse(eatersJson) : [];
      const ownerEater = eaters.find(e => e.isDefault) || eaters[0];
      
      const baseSpec = {
        _schemaVersion: 1,
        ownerEaterId: ownerEater?.eaterId || null,
        weeklyBudget: 150,
        shoppingDay: 6, // Saturday
        preferredStore: '',
        householdEaterIds: eaters.map(e => e.eaterId),
        dietaryGoals: '',
        onboardingComplete: false,
        conversation: {
          startedAt: new Date().toISOString(),
          messages: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(baseSpecKey, JSON.stringify(baseSpec));
      console.log('    ✓ Created base specification');
    }
    
    // 4. Update recipe schema with new fields
    console.log('  → Migrating recipes...');
    const recipeResult = migrateRecipes();
    if (!recipeResult.success) {
      return recipeResult;
    }
    if (recipeResult.migrated > 0) {
      console.log(`    ✓ Migrated ${recipeResult.migrated} recipe(s)`);
    }
    
    return { 
      success: true,
      message: 'Slice 3 migration completed'
    };
  } catch (error) {
    console.error('Error in Slice 3 migration:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Helper function to rename localStorage key
function renameStorageKey(oldKey, newKey) {
  const value = localStorage.getItem(oldKey);
  if (value !== null) {
    localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
  }
}

// Register all migrations
migrationManager.registerMigration(1, migrateToSlice3);

// Future migrations will be registered here
// migrationManager.registerMigration(2, migrateToSlice4);
// migrationManager.registerMigration(3, migrateToSlice5);

export default migrationManager;





