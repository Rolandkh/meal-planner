/**
 * Debug Helper Functions
 * Accessible from browser console via window.debug
 */

import { forceDietProfilesInit, checkDietProfiles } from './forceDietProfilesInit.js';
import { getAllDietProfiles } from './dietProfiles.js';
import { STORAGE_KEYS } from '../types/schemas.js';
import { transformGeneratedPlan } from './mealPlanTransformer.js';
import { saveCurrentMealPlan, saveRecipes, saveMeals } from './storage.js';

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
   * Load test meal plan data for debugging shopping list
   */
  async loadTestMealPlan() {
    console.log('🚀 Loading test meal plan data...');
    
    const rawData = {
      "weekOf": "2026-01-17",
      "budget": { "estimated": 85 },
      "days": [
        {
          "date": "2026-01-17",
          "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
          "lunch": { "name": "Greek Yogurt Chicken Salad", "servings": 1, "fromCatalog": true },
          "dinner": { "name": "Greek-Style Baked Fish: Fresh, Simple, and Delicious", "servings": 1, "fromCatalog": true }
        },
        {
          "date": "2026-01-18",
          "breakfast": {
            "name": "Greek Yogurt with Banana",
            "servings": 1,
            "fromCatalog": false,
            "ingredients": [
              { "name": "greek yogurt", "quantity": 200, "unit": "g", "category": "dairy" },
              { "name": "banana", "quantity": 1, "unit": "whole", "category": "produce" },
              { "name": "honey", "quantity": 15, "unit": "ml", "category": "pantry" }
            ],
            "instructions": "Place yogurt in bowl, slice banana on top, drizzle with honey.",
            "prepTime": 2, "cookTime": 0,
            "tags": ["quick", "breakfast", "kid-friendly"]
          },
          "lunch": { "name": "Italian Tuna Pasta", "servings": 2, "fromCatalog": true },
          "dinner": {
            "name": "Simple Chicken with Vegetables",
            "servings": 2,
            "fromCatalog": false,
            "ingredients": [
              { "name": "chicken breast", "quantity": 300, "unit": "g", "category": "meat" },
              { "name": "zucchini", "quantity": 200, "unit": "g", "category": "produce" },
              { "name": "cherry tomatoes", "quantity": 150, "unit": "g", "category": "produce" },
              { "name": "olive oil", "quantity": 30, "unit": "ml", "category": "pantry" }
            ],
            "instructions": "Season chicken with salt and pepper, bake at 200°C for 20 minutes.",
            "prepTime": 10, "cookTime": 20,
            "tags": ["kid-friendly", "simple", "dinner"]
          }
        },
        {
          "date": "2026-01-19",
          "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 2, "fromCatalog": true },
          "lunch": { "name": "Easy Cheesy Pizza Casserole", "servings": 2, "fromCatalog": true },
          "dinner": { "name": "Salmon Quinoa Risotto", "servings": 2, "fromCatalog": true }
        },
        {
          "date": "2026-01-20",
          "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
          "lunch": { "name": "Italian Tuna Pasta", "servings": 2, "fromCatalog": true },
          "dinner": { "name": "Greek Chicken Sheet Pan Dinner with Green Beans and Feta", "servings": 3, "fromCatalog": true }
        },
        {
          "date": "2026-01-21",
          "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 2, "fromCatalog": true },
          "lunch": { "name": "Light Greek Lemon Chicken Orzo Soup", "servings": 1, "fromCatalog": true },
          "dinner": { "name": "Greek-Style Baked Fish: Fresh, Simple, and Delicious", "servings": 1, "fromCatalog": true }
        },
        {
          "date": "2026-01-22",
          "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
          "lunch": { "name": "Great Greek Salad", "servings": 1, "fromCatalog": true },
          "dinner": { "name": "Baked Ratatouille", "servings": 1, "fromCatalog": true }
        },
        {
          "date": "2026-01-23",
          "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
          "lunch": { "name": "Greek Yogurt Chicken Salad", "servings": 1, "fromCatalog": true },
          "dinner": { "name": "Salmon Quinoa Risotto", "servings": 1, "fromCatalog": true }
        }
      ]
    };
    
    try {
      const transformed = transformGeneratedPlan(rawData);
      console.log('✅ Transformed:', transformed);
      
      saveCurrentMealPlan(transformed.mealPlan);
      saveRecipes(transformed.recipes);
      saveMeals(transformed.meals);
      
      console.log('✅ Test data loaded!');
      console.log(`   ${transformed.recipes.length} recipes`);
      console.log(`   ${transformed.meals.length} meals`);
      console.log('   Redirecting to shopping list...');
      
      setTimeout(() => {
        window.location.hash = '#/shopping-list';
        window.location.reload();
      }, 500);
      
      return transformed;
    } catch (error) {
      console.error('❌ Error loading test data:', error);
      throw error;
    }
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
  loadTestMealPlan() - Load test data and view shopping list ⭐
  help()             - Show this help message

Example usage:
  window.debug.checkProfiles()    // Check status
  window.debug.refreshProfiles()  // ⭐ BEST: Clear and reload page
  window.debug.listProfiles()     // See all profiles
  window.debug.loadTestMealPlan() // Load test meal plan for shopping list
  
To update to latest profiles (v2.0.0, 18 profiles):
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
