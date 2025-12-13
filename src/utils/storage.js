/**
 * Storage Utility
 * Handles localStorage operations for persisting app state
 */

const STORAGE_KEY = 'mealPlannerApp';

/**
 * Save checked items to localStorage
 * @param {Object} checkedItems - Object mapping item IDs to checked state
 */
export function saveCheckedItems(checkedItems) {
  try {
    const data = {
      checked: checkedItems,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Load checked items from localStorage
 * @returns {Object} Object mapping item IDs to checked state
 */
export function loadCheckedItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.checked || {};
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return {};
}

/**
 * Clear all saved data
 */
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Get storage statistics
 * @returns {Object} Storage stats
 */
export function getStorageStats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        lastUpdated: data.lastUpdated,
        itemCount: Object.keys(data.checked || {}).length
      };
    }
  } catch (error) {
    console.error('Error getting storage stats:', error);
  }
  return null;
}
