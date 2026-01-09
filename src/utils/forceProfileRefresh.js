/**
 * Force Diet Profiles Refresh
 * Loads the latest diet profiles from the bundled JSON file
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Force load diet profiles from bundled JSON file
 * Bypasses version check - always loads fresh
 * @returns {Promise<boolean>} Success
 */
export async function forceLoadDietProfiles() {
  try {
    console.log('🔄 Force loading diet profiles from bundled JSON...');
    
    // Dynamically import the bundled data
    const profileData = await import('../data/dietProfiles.json', { assert: { type: 'json' } });
    const bundledData = profileData.default;
    
    if (!bundledData || !bundledData.profiles) {
      throw new Error('Invalid diet profiles data');
    }
    
    // Save to localStorage (overwrite existing)
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(bundledData));
    
    console.log(`✅ Loaded ${bundledData.profiles.length} diet profiles (v${bundledData._dataVersion})`);
    console.log('Profile IDs:', bundledData.profiles.map(p => p.id).join(', '));
    
    return true;
    
  } catch (error) {
    console.error('❌ Error force loading diet profiles:', error);
    return false;
  }
}

/**
 * Check version and auto-update if needed
 * @returns {Promise<Object>} Status object
 */
export async function checkAndUpdateProfiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    
    if (!stored) {
      console.log('📦 No diet profiles in localStorage, loading from file...');
      await forceLoadDietProfiles();
      return { updated: true, reason: 'missing' };
    }
    
    const data = JSON.parse(stored);
    const currentVersion = data._dataVersion || '0.0.0';
    const currentCount = data.profiles?.length || 0;
    
    // Load bundled version to check
    const profileData = await import('../data/dietProfiles.json', { assert: { type: 'json' } });
    const bundledVersion = profileData.default._dataVersion || '0.0.0';
    const bundledCount = profileData.default.profiles?.length || 0;
    
    // Check if update needed
    if (currentVersion !== bundledVersion) {
      console.log(`🔄 Version mismatch: v${currentVersion} → v${bundledVersion}. Updating...`);
      await forceLoadDietProfiles();
      return { updated: true, reason: 'version', from: currentVersion, to: bundledVersion };
    }
    
    if (currentCount !== bundledCount) {
      console.log(`🔄 Count mismatch: ${currentCount} → ${bundledCount}. Updating...`);
      await forceLoadDietProfiles();
      return { updated: true, reason: 'count', from: currentCount, to: bundledCount };
    }
    
    console.log(`✅ Diet profiles up to date: v${currentVersion}, ${currentCount} profiles`);
    return { updated: false, version: currentVersion, count: currentCount };
    
  } catch (error) {
    console.error('Error checking profile version:', error);
    return { updated: false, error: error.message };
  }
}
