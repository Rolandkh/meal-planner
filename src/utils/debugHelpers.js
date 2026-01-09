/**
 * Debug Helper Functions
 * Accessible from browser console via window.debug
 */

import { forceDietProfilesInit, checkDietProfiles } from './forceDietProfilesInit.js';
import { getAllDietProfiles } from './dietProfiles.js';
import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Debug helpers object
 */
export const debugHelpers = {
  /**
   * Check diet profiles status
   */
  checkProfiles() {
    const status = checkDietProfiles();
    console.log('📋 Diet Profiles Status:');
    console.log(`  Loaded: ${status.loaded}`);
    console.log(`  Count: ${status.count}`);
    console.log(`  Version: ${status.version || 'N/A'}`);
    if (status.profiles) {
      console.log('  Profiles:');
      status.profiles.forEach(p => console.log(`    - ${p.name} (${p.id})`));
    }
    if (status.error) {
      console.error(`  Error: ${status.error}`);
    }
    return status;
  },

  /**
   * Force reinitialize diet profiles
   */
  fixProfiles() {
    console.log('🔧 Force initializing diet profiles...');
    const result = forceDietProfilesInit(true);
    if (result) {
      console.log('✅ Diet profiles reinitialized successfully');
      this.checkProfiles();
    } else {
      console.error('❌ Failed to reinitialize diet profiles');
    }
    return result;
  },

  /**
   * List all diet profiles from localStorage
   */
  listProfiles() {
    const profiles = getAllDietProfiles();
    console.log(`📋 ${profiles.length} Diet Profiles:`);
    profiles.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.id})`);
      console.log(`   ${p.summary}`);
    });
    return profiles;
  },

  /**
   * Clear diet profiles (for testing)
   */
  clearProfiles() {
    localStorage.removeItem(STORAGE_KEYS.DIET_PROFILES);
    console.log('🗑️ Diet profiles cleared from localStorage');
  },

  /**
   * Show all localStorage keys
   */
  showStorage() {
    console.log('📦 localStorage Contents:');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      console.log(`  ${key}: ${(size / 1024).toFixed(2)} KB`);
    });
    return keys;
  },

  /**
   * Get full help text
   */
  help() {
    console.log(`
🛠️ Debug Helper Functions (accessible via window.debug):

  checkProfiles()   - Check if diet profiles are loaded
  fixProfiles()     - Force reinitialize diet profiles
  listProfiles()    - List all available profiles
  clearProfiles()   - Remove profiles from localStorage
  showStorage()     - Show all localStorage keys
  help()            - Show this help message

Example usage:
  window.debug.checkProfiles()   // Check status
  window.debug.fixProfiles()     // Fix if profiles missing
  window.debug.listProfiles()    // See all 11 profiles
    `);
  }
};

/**
 * Initialize debug helpers on window
 */
export function initDebugHelpers() {
  window.debug = debugHelpers;
  console.log('🛠️ Debug helpers available: Type window.debug.help() for commands');
}
