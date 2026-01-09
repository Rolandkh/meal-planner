/**
 * Force Diet Profiles Initialization
 * Manual fallback to ensure diet profiles are always available
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Hardcoded diet profiles as fallback
 * Copy of the data from dietProfiles.json
 */
const FALLBACK_DIET_PROFILES = {
  "_dataVersion": "1.0.0",
  "_lastUpdated": "2026-01-08T00:00:00Z",
  "profiles": [
    {
      "id": "mediterranean",
      "name": "Mediterranean",
      "summary": "Heart-healthy eating pattern rich in olive oil, fish, vegetables, and whole grains.",
      "foodsToEmphasize": ["olive oil", "fish", "vegetables", "fruits", "whole grains", "nuts", "legumes", "yogurt", "herbs", "garlic"]
    },
    {
      "id": "keto",
      "name": "Keto / Low-Carb",
      "summary": "Very low carbohydrate, high fat diet that induces ketosis for metabolic benefits.",
      "foodsToEmphasize": ["fatty fish", "eggs", "cheese", "avocado", "nuts", "seeds", "olive oil", "coconut oil", "non-starchy vegetables", "meat"]
    },
    {
      "id": "vegetarian",
      "name": "Vegetarian",
      "summary": "Plant-based diet that excludes meat and fish but includes dairy and eggs.",
      "foodsToEmphasize": ["vegetables", "fruits", "legumes", "beans", "lentils", "whole grains", "nuts", "seeds", "tofu", "tempeh", "dairy", "eggs"]
    },
    {
      "id": "high-protein",
      "name": "High Protein",
      "summary": "Emphasizes protein-rich foods for muscle building, satiety, and weight management.",
      "foodsToEmphasize": ["chicken breast", "fish", "eggs", "greek yogurt", "cottage cheese", "lean beef", "turkey", "tofu", "tempeh", "legumes"]
    },
    {
      "id": "flexitarian",
      "name": "Flexitarian",
      "summary": "Primarily plant-based with occasional meat and fish for flexibility.",
      "foodsToEmphasize": ["vegetables", "fruits", "whole grains", "legumes", "nuts", "seeds", "occasional fish", "occasional poultry", "eggs", "dairy"]
    },
    {
      "id": "longevity",
      "name": "Longevity Protocol",
      "summary": "Science-based diet optimized for lifespan extension based on Diet Compass research.",
      "foodsToEmphasize": ["leafy greens", "cruciferous vegetables", "berries", "nuts", "fatty fish", "olive oil", "whole grains", "legumes", "fermented foods"]
    },
    {
      "id": "intermittent-fasting",
      "name": "Intermittent Fasting",
      "summary": "Time-restricted eating pattern that cycles between fasting and eating periods.",
      "foodsToEmphasize": ["nutrient-dense foods", "vegetables", "lean proteins", "healthy fats", "whole grains"]
    },
    {
      "id": "vegan",
      "name": "Vegan",
      "summary": "Entirely plant-based diet excluding all animal products.",
      "foodsToEmphasize": ["vegetables", "fruits", "legumes", "beans", "lentils", "whole grains", "nuts", "seeds", "tofu", "tempeh", "nutritional yeast", "plant milks"]
    },
    {
      "id": "mind",
      "name": "MIND Diet",
      "summary": "Brain-health focused diet combining Mediterranean and DASH for cognitive function.",
      "foodsToEmphasize": ["blueberries", "strawberries", "leafy greens", "vegetables", "nuts", "beans", "whole grains", "fish", "poultry", "olive oil"]
    },
    {
      "id": "kid-friendly",
      "name": "Kid-Friendly",
      "summary": "Nutritious, familiar foods that children typically enjoy and parents approve.",
      "foodsToEmphasize": ["chicken", "pasta", "cheese", "fruits", "yogurt", "whole grain bread", "mild vegetables", "eggs", "milk"]
    },
    {
      "id": "la-dieta",
      "name": "La Dieta",
      "summary": "Ceremonial preparation approach emphasizing mindfulness, gratitude, and intentional eating.",
      "foodsToEmphasize": ["seasonal produce", "local ingredients", "whole foods", "traditional preparations"]
    }
  ]
};

/**
 * Force initialize diet profiles in localStorage
 * @param {boolean} force - Force overwrite even if already exists
 * @returns {boolean} Success
 */
export function forceDietProfilesInit(force = false) {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    
    if (existing && !force) {
      const data = JSON.parse(existing);
      if (data.profiles && data.profiles.length > 0) {
        console.log(`✅ Diet profiles already exist: ${data.profiles.length} profiles`);
        return true;
      }
    }
    
    // Initialize with fallback data
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(FALLBACK_DIET_PROFILES));
    console.log(`✅ Force initialized ${FALLBACK_DIET_PROFILES.profiles.length} diet profiles`);
    return true;
    
  } catch (error) {
    console.error('❌ Error force initializing diet profiles:', error);
    return false;
  }
}

/**
 * Check if diet profiles are loaded
 * @returns {Object} Status object
 */
export function checkDietProfiles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DIET_PROFILES);
    
    if (!stored) {
      return {
        loaded: false,
        count: 0,
        message: 'No diet profiles found in localStorage'
      };
    }
    
    const data = JSON.parse(stored);
    const profiles = data.profiles || [];
    
    return {
      loaded: true,
      count: profiles.length,
      version: data._dataVersion,
      profiles: profiles.map(p => ({ id: p.id, name: p.name })),
      message: `${profiles.length} diet profiles loaded`
    };
    
  } catch (error) {
    return {
      loaded: false,
      count: 0,
      error: error.message,
      message: 'Error reading diet profiles'
    };
  }
}

/**
 * Auto-check and initialize if needed
 * Call this on settings page load
 */
export function ensureDietProfiles() {
  const status = checkDietProfiles();
  
  if (!status.loaded || status.count === 0) {
    console.warn('⚠️ Diet profiles missing, initializing...');
    return forceDietProfilesInit();
  }
  
  console.log(`✅ Diet profiles OK: ${status.count} profiles available`);
  return true;
}
