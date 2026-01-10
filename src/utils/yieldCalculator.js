/**
 * Yield Calculator - Tracks material throughput through process chains
 * Applies yield factors and calculates output quantities
 * 
 * Part of Phase 2.3
 */

/**
 * Calculate yield through a process chain
 * @param {number} inputQuantityG - Starting quantity in grams
 * @param {Array} processes - Array of process objects with yieldFactors
 * @returns {Object} Yield calculation result
 */
export function calculateYieldChain(inputQuantityG, processes) {
  let currentQuantityG = inputQuantityG;
  const yieldSteps = [];
  
  processes.forEach(process => {
    const beforeQuantity = currentQuantityG;
    currentQuantityG *= process.yieldFactor;
    
    yieldSteps.push({
      processId: process.processId,
      processName: process.processName,
      yieldFactor: process.yieldFactor,
      inputG: beforeQuantity,
      outputG: currentQuantityG,
      lossG: beforeQuantity - currentQuantityG,
      lossPercent: ((1 - process.yieldFactor) * 100).toFixed(1)
    });
  });
  
  const totalYieldFactor = currentQuantityG / inputQuantityG;
  
  return {
    inputQuantityG,
    outputQuantityG: currentQuantityG,
    totalYieldFactor,
    totalLossG: inputQuantityG - currentQuantityG,
    totalLossPercent: ((1 - totalYieldFactor) * 100).toFixed(1),
    steps: yieldSteps
  };
}

/**
 * Calculate raw ingredient quantity needed to achieve target output
 * @param {number} targetOutputG - Desired final quantity in grams
 * @param {Array} processes - Process chain
 * @returns {number} Required input quantity in grams
 */
export function calculateRequiredInput(targetOutputG, processes) {
  // Work backwards through the process chain
  let requiredG = targetOutputG;
  
  for (let i = processes.length - 1; i >= 0; i--) {
    requiredG = requiredG / processes[i].yieldFactor;
  }
  
  return requiredG;
}

/**
 * Analyze yield for shopping list generation
 * Given a meal plan, calculate how much raw ingredient to buy
 * @param {Object} mealPlan - Meal plan with recipes and servings
 * @param {Object} processMaster - Process database
 * @returns {Object} Shopping quantities
 */
export function calculateShoppingQuantities(mealPlan, processMaster) {
  const shoppingList = {};
  
  mealPlan.recipes.forEach(plannedRecipe => {
    const { recipe, servings, scaleFactor } = plannedRecipe;
    
    recipe.components.forEach(component => {
      component.sourceIngredients.forEach(sourceIng => {
        // Calculate quantity needed for this recipe
        const quantityNeeded = sourceIng.quantityG * scaleFactor;
        
        // Calculate yield chain to determine raw quantity to buy
        const processes = component.processes.map(p => ({
          processId: p.processId,
          yieldFactor: p.yieldFactor
        }));
        
        const rawQuantityNeeded = calculateRequiredInput(quantityNeeded, processes);
        
        // Add to shopping list
        if (!shoppingList[sourceIng.ingredientId]) {
          shoppingList[sourceIng.ingredientId] = {
            ingredientId: sourceIng.ingredientId,
            totalQuantityG: 0,
            usedInRecipes: []
          };
        }
        
        shoppingList[sourceIng.ingredientId].totalQuantityG += rawQuantityNeeded;
        shoppingList[sourceIng.ingredientId].usedInRecipes.push({
          recipeId: recipe.recipeId,
          componentId: component.id,
          quantityG: rawQuantityNeeded
        });
      });
    });
  });
  
  return shoppingList;
}

/**
 * Calculate yield factor for a specific ingredient through specific process
 * Checks for ingredient-specific overrides
 * @param {string} ingredientId - Ingredient ID
 * @param {Object} processData - Process from Process Master
 * @returns {number} Yield factor
 */
export function getIngredientSpecificYield(ingredientId, processData) {
  if (processData.yieldFactorOverrides && processData.yieldFactorOverrides[ingredientId]) {
    return processData.yieldFactorOverrides[ingredientId];
  }
  
  return processData.yieldFactor;
}

export default {
  calculateYieldChain,
  calculateRequiredInput,
  calculateShoppingQuantities,
  getIngredientSpecificYield
};
