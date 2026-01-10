/**
 * Nutrition Multipliers Utility
 * 
 * Applies cooking method multipliers to base nutrition data
 * Based on research-backed values in references/nutrition-multipliers.json
 */

import multipliersData from '../../references/nutrition-multipliers.json' with { type: 'json' };

/**
 * Get multipliers for a cooking method
 * @param {string} method - Cooking method (raw, grilled, baked, fried, boiled, steamed, air-fried)
 * @param {string} ingredientType - Optional: meat, vegetables, fish for specific adjustments
 * @returns {Object} Multipliers object
 */
export function getMultipliers(method, ingredientType = null) {
  const baseMultipliers = multipliersData.defaultMultipliers[method];
  
  if (!baseMultipliers) {
    console.warn(`Unknown cooking method: ${method}, using raw (1.0)`);
    return multipliersData.defaultMultipliers.raw.multipliers;
  }
  
  let multipliers = { ...baseMultipliers.multipliers };
  
  // Apply ingredient-specific adjustments if applicable
  if (ingredientType && multipliersData.ingredientSpecificAdjustments[ingredientType]) {
    const specificAdjustments = multipliersData.ingredientSpecificAdjustments[ingredientType][method];
    
    if (specificAdjustments) {
      // Merge specific adjustments (they override defaults)
      multipliers = deepMerge(multipliers, specificAdjustments);
    }
  }
  
  return multipliers;
}

/**
 * Apply multipliers to base nutrition data
 * @param {Object} baseNutrition - Base nutrition object (per100g)
 * @param {string} method - Cooking method
 * @param {string} ingredientType - Optional ingredient type for specific adjustments
 * @returns {Object} Adjusted nutrition values
 */
export function applyMultipliers(baseNutrition, method, ingredientType = null) {
  if (method === 'raw') {
    // No multiplication needed
    return { ...baseNutrition };
  }
  
  const multipliers = getMultipliers(method, ingredientType);
  const adjusted = {};
  
  // Apply to macronutrients and simple fields
  const simpleFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'saturatedFat', 'sodium', 'cholesterol'];
  
  for (const field of simpleFields) {
    if (baseNutrition[field] !== undefined && multipliers[field] !== undefined) {
      adjusted[field] = Math.round(baseNutrition[field] * multipliers[field] * 10) / 10;
    } else {
      adjusted[field] = baseNutrition[field];
    }
  }
  
  // Apply to vitamins
  if (baseNutrition.vitamins && multipliers.vitamins) {
    adjusted.vitamins = {};
    for (const [vitamin, value] of Object.entries(baseNutrition.vitamins)) {
      const mult = multipliers.vitamins[vitamin] !== undefined ? multipliers.vitamins[vitamin] : 1.0;
      adjusted.vitamins[vitamin] = Math.round(value * mult * 10) / 10;
    }
  } else {
    adjusted.vitamins = baseNutrition.vitamins;
  }
  
  // Apply to minerals
  if (baseNutrition.minerals && multipliers.minerals) {
    adjusted.minerals = {};
    for (const [mineral, value] of Object.entries(baseNutrition.minerals)) {
      const mult = multipliers.minerals[mineral] !== undefined ? multipliers.minerals[mineral] : 1.0;
      adjusted.minerals[mineral] = Math.round(value * mult * 10) / 10;
    }
  } else {
    adjusted.minerals = baseNutrition.minerals;
  }
  
  return adjusted;
}

/**
 * Generate complete nutritionByPreparation object for an ingredient
 * @param {Object} baseNutrition - Base nutrition data (per100g in raw state)
 * @param {string} ingredientType - Optional: meat, vegetables, fish
 * @param {Array<string>} methods - Cooking methods to include (default: all 7)
 * @returns {Object} nutritionByPreparation object
 */
export function generatePreparationVariants(baseNutrition, ingredientType = null, methods = null) {
  const defaultMethods = ['raw', 'grilled', 'baked', 'fried', 'boiled', 'steamed', 'air-fried'];
  const methodsToUse = methods || defaultMethods;
  
  const variants = {};
  
  for (const method of methodsToUse) {
    const methodData = multipliersData.defaultMultipliers[method];
    
    if (!methodData) continue;
    
    variants[method] = {
      multipliers: getMultipliers(method, ingredientType),
      notes: methodData.notes
    };
    
    // Add optional fields if they exist
    if (methodData.oilAbsorption) {
      variants[method].oilAbsorption = methodData.oilAbsorption;
    }
  }
  
  return variants;
}

/**
 * Calculate nutrition for a specific quantity and cooking method
 * @param {Object} ingredient - Ingredient with nutritionBase
 * @param {number} grams - Amount in grams
 * @param {string} method - Cooking method
 * @returns {Object} Nutrition values for the specified amount
 */
export function calculateNutritionForAmount(ingredient, grams, method = 'raw') {
  if (!ingredient.nutritionBase || !ingredient.nutritionBase.per100g) {
    console.warn(`Ingredient "${ingredient.displayName}" missing nutritionBase`);
    return null;
  }
  
  const baseNutrition = ingredient.nutritionBase.per100g;
  
  // Apply cooking method multipliers
  const adjusted = applyMultipliers(baseNutrition, method, ingredient.ingredientType);
  
  // Scale to requested amount
  const factor = grams / 100;
  const scaled = {};
  
  // Scale simple fields
  const simpleFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'saturatedFat', 'sodium', 'cholesterol'];
  
  for (const field of simpleFields) {
    if (adjusted[field] !== undefined) {
      scaled[field] = Math.round(adjusted[field] * factor * 10) / 10;
    }
  }
  
  // Scale vitamins
  if (adjusted.vitamins) {
    scaled.vitamins = {};
    for (const [vitamin, value] of Object.entries(adjusted.vitamins)) {
      scaled.vitamins[vitamin] = Math.round(value * factor * 10) / 10;
    }
  }
  
  // Scale minerals
  if (adjusted.minerals) {
    scaled.minerals = {};
    for (const [mineral, value] of Object.entries(adjusted.minerals)) {
      scaled.minerals[mineral] = Math.round(value * factor * 10) / 10;
    }
  }
  
  return scaled;
}

/**
 * Deep merge utility
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Get all available cooking methods
 * @returns {Array<string>} Array of cooking method names
 */
export function getAvailableMethods() {
  return Object.keys(multipliersData.defaultMultipliers);
}

/**
 * Get method description and notes
 * @param {string} method - Cooking method
 * @returns {Object} Method metadata
 */
export function getMethodInfo(method) {
  const methodData = multipliersData.defaultMultipliers[method];
  
  if (!methodData) return null;
  
  return {
    method,
    description: methodData.description,
    notes: methodData.notes,
    waterLoss: methodData.waterLoss || 0,
    fatLoss: methodData.fatLoss || 0,
    oilAbsorption: methodData.oilAbsorption || 0
  };
}

export default {
  getMultipliers,
  applyMultipliers,
  generatePreparationVariants,
  calculateNutritionForAmount,
  getAvailableMethods,
  getMethodInfo
};
