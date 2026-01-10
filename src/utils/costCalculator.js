/**
 * Cost Calculator - Tracks ingredient costs through process transformations
 * Accounts for yield loss, added ingredients (oil, butter), and waste
 * 
 * Part of Phase 2.4
 */

/**
 * Calculate cost through a process chain
 * @param {Array} sourceIngredients - Starting ingredients with costs
 * @param {Array} processes - Process chain with yield factors
 * @param {Object} processMaster - Process database
 * @param {Object} ingredientMaster - Ingredient database
 * @returns {Object} Cost breakdown
 */
export function calculateCostChain(sourceIngredients, processes, processMaster, ingredientMaster) {
  let totalCost = 0;
  const costSteps = [];
  
  // 1. Calculate base cost of source ingredients
  sourceIngredients.forEach(ing => {
    const ingData = ingredientMaster[ing.ingredientId];
    const cost = calculateIngredientCost(ing.quantityG, ingData);
    
    totalCost += cost;
    
    costSteps.push({
      type: 'ingredient',
      name: ingData?.displayName || ing.ingredientId,
      quantityG: ing.quantityG,
      costAUD: cost,
      costPerG: cost / ing.quantityG
    });
  });
  
  // 2. Add cost of additional ingredients (oil, butter, etc.)
  processes.forEach(process => {
    const processData = processMaster.processes[process.processId];
    
    if (processData?.additionalIngredients) {
      processData.additionalIngredients.forEach(addIngName => {
        // Estimate quantity of additional ingredient
        const ingredients = ingredientMaster.ingredients || ingredientMaster;
        const addIngData = ingredients[addIngName];
        if (!addIngData) return;
        
        // Use absorption data from process if available
        const quantityG = estimateAdditionalIngredientQuantity(
          addIngName,
          processData,
          sourceIngredients
        );
        
        const cost = calculateIngredientCost(quantityG, addIngData);
        totalCost += cost;
        
        costSteps.push({
          type: 'additional',
          process: process.processId,
          name: addIngData.displayName || addIngName,
          quantityG,
          costAUD: cost,
          notes: `Added during ${processData.displayName}`
        });
      });
    }
  });
  
  return {
    totalCost,
    costBreakdown: costSteps,
    sourceIngredientCost: costSteps
      .filter(s => s.type === 'ingredient')
      .reduce((sum, s) => sum + s.costAUD, 0),
    additionalIngredientCost: costSteps
      .filter(s => s.type === 'additional')
      .reduce((sum, s) => sum + s.costAUD, 0)
  };
}

/**
 * Calculate cost of a single ingredient
 * @param {number} quantityG - Quantity in grams
 * @param {Object} ingredientData - Ingredient from master database
 * @returns {number} Cost in AUD
 */
export function calculateIngredientCost(quantityG, ingredientData) {
  if (!ingredientData?.pricing) {
    console.warn(`No pricing data for ingredient: ${ingredientData?.displayName || 'unknown'}`);
    return 0;
  }
  
  const pricing = ingredientData.pricing;
  
  // PRIORITY 1: Use pricePerKg if available (most accurate)
  if (pricing.pricePerKg) {
    return (quantityG / 1000) * pricing.pricePerKg;
  }
  
  // PRIORITY 2: Calculate from averagePrice + unit
  const { averagePrice, unit, unitSize } = pricing;
  let gramsPerUnit = 1000; // Default: 1kg
  
  if (unit === 'kg') {
    const sizeMatch = unitSize?.match(/(\d+(?:\.\d+)?)\s*kg/);
    gramsPerUnit = sizeMatch ? parseFloat(sizeMatch[1]) * 1000 : 1000;
  } else if (unit === 'g') {
    // Unit is 'g' but averagePrice is for the package (not per gram!)
    // Extract package size from unitSize (e.g., "250-500g" → use 500g)
    const sizeMatch = unitSize?.match(/(\d+)\s*g/g);
    if (sizeMatch) {
      const sizes = sizeMatch.map(m => parseInt(m.match(/\d+/)[0]));
      gramsPerUnit = Math.max(...sizes); // Use larger size
    } else {
      gramsPerUnit = 500; // Default package
    }
  } else if (unit === '100g') {
    gramsPerUnit = 100;
  } else if (unit === 'L' || unit === 'l' || unit === 'liter') {
    gramsPerUnit = 1000; // 1L ≈ 1000g for liquids
  } else if (unit === 'ml') {
    const sizeMatch = unitSize?.match(/(\d+)\s*ml/);
    gramsPerUnit = sizeMatch ? parseInt(sizeMatch[1]) : 1000;
  } else if (unit === 'each' || unit === 'item' || unit === 'bunch' || unit === 'pack') {
    // For items sold individually, use typical weight if available
    if (pricing.typicalWeight) {
      gramsPerUnit = pricing.typicalWeight;
    } else {
      gramsPerUnit = estimateItemWeight(ingredientData);
    }
  }
  
  const pricePerGram = averagePrice / gramsPerUnit;
  return quantityG * pricePerGram;
}

/**
 * Estimate quantity of additional ingredient (oil, butter, salt)
 * @param {string} ingredientName - Additional ingredient name
 * @param {Object} processData - Process being performed
 * @param {Array} sourceIngredients - Main ingredients being processed
 * @returns {number} Estimated quantity in grams
 */
function estimateAdditionalIngredientQuantity(ingredientName, processData, sourceIngredients) {
  const totalSourceG = sourceIngredients.reduce((sum, ing) => sum + ing.quantityG, 0);
  
  // Common additional ingredient quantities
  const estimates = {
    'oil': totalSourceG * 0.05,           // 5% of ingredient weight
    'olive_oil': totalSourceG * 0.05,
    'butter': totalSourceG * 0.08,        // 8% of ingredient weight
    'salt': totalSourceG * 0.01,          // 1% of ingredient weight
    'pepper': totalSourceG * 0.005,       // 0.5% of ingredient weight
    'oil_spray': 2,                       // 2g per spray
    'water': totalSourceG * 0.1           // 10% for steaming, etc.
  };
  
  // Check process notes for oil absorption data
  if (ingredientName.includes('oil') && processData.notes) {
    const absorptionMatch = processData.notes.match(/(\d+)g.*per 100g/);
    if (absorptionMatch) {
      const gPer100g = parseFloat(absorptionMatch[1]);
      return (totalSourceG / 100) * gPer100g;
    }
  }
  
  return estimates[ingredientName] || 10; // Default: 10g
}

/**
 * Estimate average item weight for count-based pricing
 * @param {Object} ingredientData - Ingredient from master
 * @returns {number} Estimated weight in grams
 */
function estimateItemWeight(ingredientData) {
  // If we have density data, use cup weight as proxy
  if (ingredientData.density?.gPerCup) {
    return ingredientData.density.gPerCup;
  }
  
  // Common item weights
  const itemWeights = {
    'lemon': 80,
    'lime': 50,
    'onion': 150,
    'tomato': 120,
    'potato': 180,
    'apple': 180,
    'avocado': 150,
    'bell pepper': 150,
    'egg': 50
  };
  
  const name = ingredientData.displayName?.toLowerCase() || '';
  for (const [item, weight] of Object.entries(itemWeights)) {
    if (name.includes(item)) {
      return weight;
    }
  }
  
  return 100; // Generic fallback
}

/**
 * Calculate cost per serving for a recipe
 * @param {number} totalCost - Total recipe cost
 * @param {number} servings - Number of servings
 * @returns {Object} Cost breakdown
 */
export function calculateCostPerServing(totalCost, servings) {
  return {
    totalCost,
    servings,
    costPerServing: totalCost / servings,
    costPerServing100: Math.round((totalCost / servings) * 100) / 100
  };
}

/**
 * Calculate cost for a scaled recipe
 * @param {Object} baseCost - Base recipe cost
 * @param {number} scaleFactor - Scale multiplier (e.g., 1.5 for 1.5x recipe)
 * @returns {number} Scaled cost
 */
export function calculateScaledCost(baseCost, scaleFactor) {
  return baseCost * scaleFactor;
}

export default {
  calculateYieldChain,
  calculateCostChain,
  calculateIngredientCost,
  calculateCostPerServing,
  calculateScaledCost
};
