/**
 * Force Diet Profiles Initialization
 * Manual fallback to ensure diet profiles are always available
 */

import { STORAGE_KEYS } from '../types/schemas.js';

/**
 * Hardcoded diet profiles as fallback
 * Copy of basic data from dietProfiles.json v2.0.0
 * Updated 2026-01-09 to include all 18 profiles
 */
const FALLBACK_DIET_PROFILES = {
  "_dataVersion": "2.0.0",
  "_lastUpdated": "2026-01-09T00:00:00Z",
  "profiles": [
    {
      "id": "mediterranean",
      "name": "Mediterranean",
      "summary": "Heart-healthy eating pattern rich in olive oil, fish, vegetables, and whole grains.",
      "foodsToEmphasize": ["olive oil", "fish", "vegetables", "fruits", "whole grains", "nuts", "legumes", "yogurt", "herbs", "garlic"]
    },
    {
      "id": "longevity",
      "name": "Longevity Protocol (Diet Compass)",
      "summary": "Science-based diet optimized for lifespan extension based on Diet Compass research by Bas Kast.",
      "foodsToEmphasize": ["leafy greens", "cruciferous vegetables", "legumes", "oily fish", "nuts", "seeds", "fermented yogurt", "kefir", "olive oil", "berries"]
    },
    {
      "id": "la-dieta",
      "name": "La Dieta",
      "summary": "Temporary cleansing protocol for preparation before plant medicine retreats.",
      "foodsToEmphasize": ["fresh vegetables", "fresh fruits", "basmati rice", "quinoa", "fresh fish", "free-range chicken", "eggs", "olive oil"]
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
      "foodsToEmphasize": ["vegetables", "fruits", "legumes", "beans", "tofu", "tempeh", "whole grains", "nuts", "seeds", "dairy", "eggs"]
    },
    {
      "id": "high-protein",
      "name": "High Protein",
      "summary": "Emphasizes protein-rich foods for muscle building, satiety, and weight management.",
      "foodsToEmphasize": ["chicken breast", "turkey", "fish", "eggs", "greek yogurt", "cottage cheese", "lean beef", "tofu", "tempeh", "legumes"]
    },
    {
      "id": "flexitarian",
      "name": "Flexitarian",
      "summary": "Primarily plant-based with occasional meat and fish for flexibility.",
      "foodsToEmphasize": ["vegetables", "fruits", "whole grains", "legumes", "nuts", "seeds", "occasional fish", "occasional poultry", "eggs", "dairy"]
    },
    {
      "id": "intermittent-fasting",
      "name": "Intermittent Fasting",
      "summary": "Time-restricted eating pattern that cycles between fasting and eating periods.",
      "foodsToEmphasize": ["nutrient-dense foods", "vegetables", "lean proteins", "healthy fats", "whole grains", "fruits", "legumes"]
    },
    {
      "id": "vegan",
      "name": "Vegan",
      "summary": "Entirely plant-based diet excluding all animal products.",
      "foodsToEmphasize": ["vegetables", "fruits", "legumes", "beans", "lentils", "tofu", "tempeh", "edamame", "whole grains", "nuts", "seeds", "nutritional yeast"]
    },
    {
      "id": "mind",
      "name": "MIND Diet",
      "summary": "Brain-health focused diet combining Mediterranean and DASH approaches for cognitive function.",
      "foodsToEmphasize": ["blueberries", "strawberries", "leafy greens", "vegetables", "nuts", "beans", "whole grains", "fish", "poultry", "olive oil"]
    },
    {
      "id": "kid-friendly",
      "name": "Kid-Friendly",
      "summary": "Nutritious, familiar foods that children typically enjoy and parents approve.",
      "foodsToEmphasize": ["chicken", "pasta", "cheese", "fruits", "yogurt", "whole grain bread", "mild vegetables", "eggs", "milk"]
    },
    {
      "id": "pescatarian",
      "name": "Pescatarian",
      "summary": "Plant-based diet that includes fish and seafood but excludes other meats.",
      "foodsToEmphasize": ["fatty fish", "white fish", "shellfish", "mollusks", "vegetables", "fruits", "legumes", "whole grains", "eggs", "dairy"]
    },
    {
      "id": "paleo",
      "name": "Paleo",
      "summary": "Eating pattern based on foods available to our Paleolithic ancestors.",
      "foodsToEmphasize": ["grass-fed meat", "wild-caught fish", "free-range poultry", "eggs", "vegetables", "fruits", "nuts", "seeds", "healthy fats"]
    },
    {
      "id": "dash",
      "name": "DASH Diet",
      "summary": "Dietary Approaches to Stop Hypertension - designed to lower blood pressure.",
      "foodsToEmphasize": ["fruits", "vegetables", "whole grains", "low-fat dairy", "lean proteins", "nuts", "seeds", "legumes"]
    },
    {
      "id": "anti-inflammatory",
      "name": "Anti-Inflammatory",
      "summary": "Diet designed to reduce chronic inflammation through food choices.",
      "foodsToEmphasize": ["fatty fish", "leafy greens", "berries", "turmeric", "ginger", "olive oil", "nuts", "tomatoes", "green tea"]
    },
    {
      "id": "low-fodmap",
      "name": "Low FODMAP",
      "summary": "Therapeutic diet for managing IBS and digestive sensitivities.",
      "foodsToEmphasize": ["low-fodmap vegetables", "low-fodmap fruits", "proteins", "lactose-free dairy", "gluten-free grains", "nuts", "olive oil"]
    },
    {
      "id": "whole30",
      "name": "Whole30",
      "summary": "30-day elimination diet focusing on whole, unprocessed foods to reset eating habits.",
      "foodsToEmphasize": ["meat", "poultry", "seafood", "eggs", "vegetables", "fruits", "nuts", "seeds", "healthy fats"]
    },
    {
      "id": "gut-health",
      "name": "Gut Health Protocol",
      "summary": "Diet optimized for digestive health and microbiome diversity.",
      "foodsToEmphasize": ["fermented foods", "prebiotic foods", "high-fiber foods", "diverse plant foods", "bone broth", "ginger", "turmeric", "omega-3 sources"]
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
      const existingVersion = data._dataVersion || '0.0.0';
      
      // Check if we need to update
      if (data.profiles && data.profiles.length > 0 && existingVersion === FALLBACK_DIET_PROFILES._dataVersion) {
        console.log(`✅ Diet profiles already exist: ${data.profiles.length} profiles (v${existingVersion})`);
        return true;
      }
      
      console.log(`🔄 Updating diet profiles: v${existingVersion} → v${FALLBACK_DIET_PROFILES._dataVersion}`);
    }
    
    // Initialize with fallback data
    localStorage.setItem(STORAGE_KEYS.DIET_PROFILES, JSON.stringify(FALLBACK_DIET_PROFILES));
    console.log(`✅ Force initialized ${FALLBACK_DIET_PROFILES.profiles.length} diet profiles (v${FALLBACK_DIET_PROFILES._dataVersion})`);
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
