/**
 * Nutrition Calculator - Applies cooking method multipliers through process chains
 * Tracks nutritional changes as ingredients are transformed
 * 
 * Part of Phase 2.5
 */

/**
 * Calculate nutrition through a process chain
 * @param {Object} baseNutrition - Starting nutrition (raw ingredient per 100g)
 * @param {number} quantityG - Quantity being processed
 * @param {Array} processes - Process chain
 * @param {Object} nutritionMultipliers - Nutrition multipliers database
 * @returns {Object} Final nutrition profile
 */
export function calculateNutritionChain(baseNutrition, quantityG, processes, nutritionMultipliers) {
  // Start with raw nutrition scaled to quantity
  let currentNutrition = scaleNutrition(baseNutrition, quantityG);
  let currentWeight = quantityG;
  
  const nutritionSteps = [];
  
  processes.forEach(process => {
    const beforeNutrition = { ...currentNutrition };
    const beforeWeight = currentWeight;
    
    // Apply yield factor (weight change)
    currentWeight *= process.yieldFactor;
    
    // Apply nutrition multiplier if cooking method
    if (process.nutritionMultiplier && process.nutritionMultiplier !== 'raw') {
      const multipliers = nutritionMultipliers.defaultMultipliers[process.nutritionMultiplier];
      
      if (multipliers) {
        currentNutrition = applyNutritionMultipliers(currentNutrition, multipliers.multipliers);
      }
    }
    
    nutritionSteps.push({
      processId: process.processId,
      processName: process.processName,
      method: process.nutritionMultiplier,
      beforeWeight,
      afterWeight: currentWeight,
      beforeNutrition,
      afterNutrition: { ...currentNutrition }
    });
  });
  
  return {
    finalNutrition: currentNutrition,
    finalWeight: currentWeight,
    nutritionPer100g: scaleNutritionTo100g(currentNutrition, currentWeight),
    steps: nutritionSteps
  };
}

/**
 * Scale nutrition data to a specific quantity
 * @param {Object} per100g - Nutrition per 100g
 * @param {number} quantityG - Target quantity
 * @returns {Object} Scaled nutrition
 */
function scaleNutrition(per100g, quantityG) {
  const factor = quantityG / 100;
  
  return {
    calories: (per100g.calories || 0) * factor,
    protein: (per100g.protein || 0) * factor,
    fat: (per100g.fat || 0) * factor,
    carbs: (per100g.carbs || 0) * factor,
    fiber: (per100g.fiber || 0) * factor,
    sugar: (per100g.sugar || 0) * factor,
    saturatedFat: (per100g.saturatedFat || 0) * factor,
    sodium: (per100g.sodium || 0) * factor,
    cholesterol: (per100g.cholesterol || 0) * factor
  };
}

/**
 * Scale nutrition back to per 100g
 * @param {Object} totalNutrition - Total nutrition
 * @param {number} totalWeightG - Total weight
 * @returns {Object} Nutrition per 100g
 */
function scaleNutritionTo100g(totalNutrition, totalWeightG) {
  const factor = 100 / totalWeightG;
  
  const per100g = {};
  for (const [key, value] of Object.entries(totalNutrition)) {
    per100g[key] = value * factor;
  }
  
  return per100g;
}

/**
 * Apply cooking method multipliers to nutrition values
 * @param {Object} nutrition - Current nutrition values
 * @param {Object} multipliers - Multipliers from nutrition-multipliers.json
 * @returns {Object} Updated nutrition
 */
function applyNutritionMultipliers(nutrition, multipliers) {
  const updated = {};
  
  // Apply multipliers to macros
  updated.calories = nutrition.calories * (multipliers.calories || 1.0);
  updated.protein = nutrition.protein * (multipliers.protein || 1.0);
  updated.fat = nutrition.fat * (multipliers.fat || 1.0);
  updated.carbs = nutrition.carbs * (multipliers.carbs || 1.0);
  updated.fiber = nutrition.fiber * (multipliers.fiber || 1.0);
  updated.sugar = nutrition.sugar * (multipliers.sugar || 1.0);
  updated.saturatedFat = nutrition.saturatedFat * (multipliers.saturatedFat || 1.0);
  updated.sodium = nutrition.sodium * (multipliers.sodium || 1.0);
  updated.cholesterol = nutrition.cholesterol * (multipliers.cholesterol || 1.0);
  
  return updated;
}

/**
 * Calculate nutrition for multiple ingredients combined
 * @param {Array} ingredients - Array of {ingredientId, quantityG}
 * @param {Object} ingredientMaster - Ingredient database
 * @returns {Object} Combined nutrition
 */
export function calculateCombinedNutrition(ingredients, ingredientMaster) {
  const totalNutrition = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    saturatedFat: 0,
    sodium: 0,
    cholesterol: 0
  };
  
  ingredients.forEach(ing => {
    const ingData = ingredientMaster[ing.ingredientId];
    if (!ingData?.nutritionBase?.per100g) return;
    
    const scaled = scaleNutrition(ingData.nutritionBase.per100g, ing.quantityG);
    
    for (const key of Object.keys(totalNutrition)) {
      totalNutrition[key] += scaled[key] || 0;
    }
  });
  
  return totalNutrition;
}

/**
 * Calculate nutrition per serving
 * @param {Object} totalNutrition - Total recipe nutrition
 * @param {number} servings - Number of servings
 * @returns {Object} Nutrition per serving
 */
export function calculateNutritionPerServing(totalNutrition, servings) {
  const perServing = {};
  
  for (const [key, value] of Object.entries(totalNutrition)) {
    perServing[key] = value / servings;
  }
  
  return perServing;
}

/**
 * Apply ingredient-specific nutrition adjustments
 * @param {Object} nutrition - Base nutrition
 * @param {string} ingredientId - Ingredient ID
 * @param {string} cookingMethod - Cooking method (grilled, fried, etc.)
 * @param {Object} nutritionMultipliers - Nutrition multipliers database
 * @returns {Object} Adjusted nutrition
 */
export function applyIngredientSpecificAdjustments(nutrition, ingredientId, cookingMethod, nutritionMultipliers) {
  // Check for ingredient-specific adjustments
  const adjustments = nutritionMultipliers.ingredientSpecificAdjustments;
  
  // Determine ingredient category (meat, vegetables, fish)
  let category = null;
  if (ingredientId.includes('chicken') || ingredientId.includes('beef') || ingredientId.includes('pork')) {
    category = 'meat';
  } else if (ingredientId.includes('fish') || ingredientId.includes('salmon') || ingredientId.includes('tuna')) {
    category = 'fish';
  } else {
    category = 'vegetables'; // Default
  }
  
  if (adjustments[category]?.[cookingMethod]) {
    const categoryAdjustments = adjustments[category][cookingMethod];
    
    // Apply category-specific multipliers
    if (categoryAdjustments.fat) {
      nutrition.fat *= categoryAdjustments.fat;
      nutrition.saturatedFat *= categoryAdjustments.saturatedFat || categoryAdjustments.fat;
    }
    
    if (categoryAdjustments.vitamins) {
      // Would apply vitamin-specific adjustments here
      // For now, using default multipliers
    }
  }
  
  return nutrition;
}

export default {
  calculateNutritionChain,
  calculateCombinedNutrition,
  calculateNutritionPerServing,
  applyIngredientSpecificAdjustments,
  scaleNutrition,
  scaleNutritionTo100g
};
