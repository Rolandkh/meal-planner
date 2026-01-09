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

/**
 * Save a custom diet profile
 * @param {Object} profile - Profile object
 * @returns {Object} Result with success status
 */
export function saveDietProfile(profile) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    const data = stored ? JSON.parse(stored) : { _dataVersion: '1.0.0', profiles: [] };
    
    // Mark as custom
    profile.isCustom = true;
    profile.createdAt = profile.createdAt || new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    
    // Check if updating existing
    const existingIndex = data.profiles.findIndex(p => p.id === profile.id);
    if (existingIndex >= 0) {
      data.profiles[existingIndex] = profile;
    } else {
      data.profiles.push(profile);
    }
    
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(data));
    
    return {
      success: true,
      message: 'Profile saved successfully',
      profile
    };
  } catch (error) {
    console.error('Error saving diet profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a custom diet profile
 * @param {string} id - Profile ID to delete
 * @returns {Object} Result with success status
 */
export function deleteDietProfile(id) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    if (!stored) return { success: false, error: 'No profiles found' };
    
    const data = JSON.parse(stored);
    const profile = data.profiles.find(p => p.id === id);
    
    // Prevent deletion of built-in profiles
    if (profile && !profile.isCustom) {
      return {
        success: false,
        error: 'Cannot delete built-in profiles'
      };
    }
    
    data.profiles = data.profiles.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(data));
    
    return {
      success: true,
      message: 'Profile deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting diet profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Export a diet profile as JSON file
 * @param {Object} profile - Profile to export
 */
export function exportDietProfile(profile) {
  try {
    const exportData = {
      _exportVersion: 1,
      _exportedAt: new Date().toISOString(),
      _type: 'diet-profile',
      profile: {
        ...profile,
        isCustom: true // Mark as custom when imported
      }
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diet-profile-${profile.id}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting profile:', error);
    throw error;
  }
}

/**
 * Import a diet profile from JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Result with success status and profile
 */
export async function importDietProfile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // Validate format
        if (imported._type !== 'diet-profile' || !imported.profile) {
          throw new Error('Invalid profile file format');
        }
        
        const profile = imported.profile;
        
        // Validate required fields
        if (!profile.id || !profile.name || !profile.summary) {
          throw new Error('Profile missing required fields');
        }
        
        // Check if profile already exists
        const existing = getDietProfileById(profile.id);
        if (existing) {
          if (!confirm(`Profile "${profile.name}" already exists. Overwrite?`)) {
            resolve({
              success: false,
              error: 'Import cancelled by user'
            });
            return;
          }
        }
        
        // Save the profile
        const result = saveDietProfile(profile);
        
        if (result.success) {
          resolve({
            success: true,
            profile: result.profile,
            message: 'Profile imported successfully'
          });
        } else {
          resolve(result);
        }
      } catch (error) {
        resolve({
          success: false,
          error: error.message
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file'
      });
    };
    
    reader.readAsText(file);
  });
}
