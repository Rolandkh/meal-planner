/**
 * Diet Profile Utilities
 * Load and query diet profile definitions
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Load all diet profiles from localStorage or bundled data
 * @returns {Array} Array of diet profile objects
 */
export function getAllDietProfiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    if (stored) {
      const data = JSON.parse(stored);
      return data.profiles || [];
    }
    
    // Return empty array - will be populated by migration/bootstrap
    return [];
    
  } catch (error) {
    console.error('Error loading diet profiles:', error);
    return [];
  }
}

/**
 * Get a specific diet profile by ID
 * @param {string} id - Profile ID
 * @returns {Object|null} Profile object or null
 */
export function getDietProfileById(id) {
  if (!id) return null;
  
  const profiles = getAllDietProfiles();
  return profiles.find(p => p.id === id) || null;
}

/**
 * Get profile name for display
 * @param {string} id - Profile ID
 * @returns {string} Display name
 */
export function getDietProfileName(id) {
  const profile = getDietProfileById(id);
  return profile ? profile.name : 'None';
}

/**
 * Check if profile is plant-based
 * @param {string} id - Profile ID
 * @returns {boolean}
 */
export function isPlantBased(id) {
  return ['vegetarian', 'vegan', 'flexitarian'].includes(id);
}

/**
 * Check if profile is low-carb
 * @param {string} id - Profile ID
 * @returns {boolean}
 */
export function isLowCarb(id) {
  return ['keto'].includes(id);
}

/**
 * Get compatible profile IDs
 * @param {string} id - Profile ID
 * @returns {string[]} Compatible profile IDs
 */
export function getCompatibleProfiles(id) {
  const profile = getDietProfileById(id);
  if (!profile) return [];
  
  return profile.compatibleWith || [];
}

/**
 * Get conflicting profile IDs
 * @param {string} id - Profile ID  
 * @returns {string[]} Conflicting profile IDs
 */
export function getConflictingProfiles(id) {
  const profile = getDietProfileById(id);
  if (!profile) return [];
  
  return profile.conflictsWith || [];
}
