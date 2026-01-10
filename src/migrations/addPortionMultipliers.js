/**
 * Migration: Add portionMultiplier to existing eaters (Slice 5.1)
 * Adds the portionMultiplier field (default 1.0) to all existing eater objects
 */

import { loadEaters, saveEaters } from '../utils/storage.js';

/**
 * Migrate existing eaters to include portionMultiplier field
 * @returns {Object} Migration result
 */
export function addPortionMultipliersToEaters() {
  console.log('🔄 Migrating eaters to add portionMultiplier field...');
  
  try {
    const eaters = loadEaters();
    
    if (!eaters || eaters.length === 0) {
      console.log('  ℹ️  No eaters found, nothing to migrate');
      return { success: true, message: 'No eaters to migrate', updated: 0 };
    }
    
    let updated = 0;
    const migratedEaters = eaters.map(eater => {
      // Check if portionMultiplier already exists
      if (typeof eater.portionMultiplier === 'number') {
        return eater; // Already has the field
      }
      
      // Add default portionMultiplier
      updated++;
      return {
        ...eater,
        portionMultiplier: 1.0 // Default to adult portion size
      };
    });
    
    if (updated > 0) {
      const result = saveEaters(migratedEaters);
      if (result.success) {
        console.log(`  ✅ Successfully added portionMultiplier to ${updated} eater(s)`);
        return { 
          success: true, 
          message: `Added portionMultiplier to ${updated} eater(s)`, 
          updated 
        };
      } else {
        console.error('  ❌ Failed to save migrated eaters:', result.error);
        return { 
          success: false, 
          message: `Failed to save: ${result.error}`, 
          updated: 0 
        };
      }
    } else {
      console.log('  ℹ️  All eaters already have portionMultiplier field');
      return { 
        success: true, 
        message: 'All eaters already migrated', 
        updated: 0 
      };
    }
    
  } catch (error) {
    console.error('  ❌ Migration failed:', error);
    return { 
      success: false, 
      message: error.message, 
      updated: 0 
    };
  }
}

/**
 * Helper: Set portion multiplier for a specific eater
 * Useful for setting child portion sizes after migration
 * 
 * @param {string} eaterId - Eater ID
 * @param {number} multiplier - Portion multiplier (0.5 for young child, 0.75 for older child/teen)
 * @returns {Object} Result
 */
export function setEaterPortionMultiplier(eaterId, multiplier) {
  if (typeof multiplier !== 'number' || multiplier <= 0 || multiplier > 2) {
    return { 
      success: false, 
      error: 'Invalid multiplier (must be number between 0 and 2)' 
    };
  }
  
  const eaters = loadEaters();
  const eaterIndex = eaters.findIndex(e => e.eaterId === eaterId);
  
  if (eaterIndex === -1) {
    return { 
      success: false, 
      error: `Eater ${eaterId} not found` 
    };
  }
  
  eaters[eaterIndex].portionMultiplier = multiplier;
  eaters[eaterIndex].updatedAt = new Date().toISOString();
  
  const result = saveEaters(eaters);
  if (result.success) {
    console.log(`✅ Set ${eaters[eaterIndex].name}'s portion multiplier to ${multiplier}`);
  }
  
  return result;
}

/**
 * Suggested portion multipliers by age/category
 */
export const SUGGESTED_PORTION_MULTIPLIERS = {
  'toddler': 0.25,      // 1-3 years
  'young_child': 0.5,   // 4-8 years
  'older_child': 0.75,  // 9-13 years
  'teen': 0.9,          // 14-18 years
  'adult': 1.0,         // Standard
  'large_appetite': 1.25 // Very active adults
};
