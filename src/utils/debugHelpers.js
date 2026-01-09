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
   * Force reinitialize diet profiles (simple fallback)
   */
  fixProfiles() {
    console.log('🔧 Force initializing diet profiles (fallback)...');
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
   * Clear and reload profiles (RECOMMENDED for updates)
   */
  refreshProfiles() {
    console.log('🔄 Clearing diet profiles and reloading page...');
    console.log('This will reload the latest profiles from the JSON file.');
    localStorage.removeItem(STORAGE_KEYS.DIET_PROFILES);
    setTimeout(() => {
      location.reload();
    }, 500);
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

  checkProfiles()    - Check if diet profiles are loaded
  refreshProfiles()  - Clear and reload (RECOMMENDED for updates) ⭐
  fixProfiles()      - Force reinitialize with fallback
  listProfiles()     - List all available profiles
  clearProfiles()    - Remove profiles from localStorage
  showStorage()      - Show all localStorage keys
  help()             - Show this help message

Example usage:
  window.debug.checkProfiles()    // Check status
  window.debug.refreshProfiles()  // ⭐ BEST: Clear and reload page
  window.debug.listProfiles()     // See all profiles
  
To update to latest profiles (v2.0.0, 17 profiles):
  window.debug.refreshProfiles()  // Clears and reloads automatically
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
