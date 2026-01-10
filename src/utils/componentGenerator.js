/**
 * Component Generator - Creates recipe components from parsed processes
 * Calculates yields, costs, and nutrition through process chains
 * 
 * Phase 2.2 of Recipe Conversion Engine
 */

import { convertToGrams } from './unitConversion.js';
import { calculateIngredientCost as calcCost } from './costCalculator.js';

/**
 * Generate components from parsed recipe processes
 * @param {Object} parsedRecipe - Output from processParser
 * @param {Object} recipe - Original recipe with ingredients
 * @param {Object} processMaster - Process Master database
 * @param {Object} ingredientMaster - Ingredient Master database
 * @returns {Object} Components with calculated yields, costs, nutrition
 */
export function generateComponents(parsedRecipe, recipe, processMaster, ingredientMaster) {
  const components = [];
  const errors = [];
  
  // Track ingredient state through the recipe
  // Key insight: Each ingredient is purchased ONCE and flows through components
  const ingredientState = initializeIngredientState(recipe.ingredients, ingredientMaster);
  
  // Track which ingredients have been "consumed" into components
  const consumedIngredients = new Set();
  
  // Process each step
  parsedRecipe.processSteps.forEach((step, stepIndex) => {
    try {
      const stepComponents = processStep(
        step,
        ingredientState,
        processMaster,
        ingredientMaster,
        recipe,
        consumedIngredients,
        components
      );
      
      components.push(...stepComponents);
    } catch (error) {
      errors.push({
        stepNumber: step.stepNumber,
        error: error.message
      });
    }
  });
  
  // Calculate final recipe metrics (only count raw ingredients ONCE)
  const recipeMetrics = calculateRecipeMetrics(components, recipe, ingredientState);
  
  return {
    success: errors.length === 0,
    components,
    recipeMetrics,
    errors,
    metadata: {
      totalComponents: components.length,
      totalProcesses: parsedRecipe.processSteps.reduce(
        (sum, step) => sum + step.processes.length, 0
      )
    }
  };
}

/**
 * Initialize ingredient state tracking
 * @param {Array} ingredients - Recipe ingredients
 * @param {Object} ingredientMaster - Ingredient database
 * @returns {Map} Ingredient state map
 */
function initializeIngredientState(ingredients, ingredientMaster) {
  const state = new Map();
  
  ingredients.forEach(ing => {
    // Find ingredient in master database
    const ingredientData = findIngredient(ing.name, ingredientMaster);
    
    if (!ingredientData) {
      console.warn(`Ingredient not found in master: ${ing.name}`);
      return;
    }
    
    // Convert to grams
    const quantityG = convertToGrams(
      ing.quantity,
      ing.unit,
      ing.name,
      ingredientData
    );
    
    state.set(ing.name, {
      ingredientId: ingredientData.id,
      originalName: ing.name,
      currentQuantityG: quantityG,
      originalQuantityG: quantityG,
      state: 'raw',
      costAUD: calcCost(quantityG, ingredientData),
      nutrition: calculateIngredientNutrition(quantityG, ingredientData, 'raw'),
      processes: []  // Track what's been done to it
    });
  });
  
  return state;
}

/**
 * Process a single recipe step
 * @param {Object} step - Parsed step with processes
 * @param {Map} ingredientState - Current state of ingredients
 * @param {Object} processMaster - Process database
 * @param {Object} ingredientMaster - Ingredient database
 * @param {Object} recipe - Original recipe
 * @param {Set} consumedIngredients - Track which ingredients have been used
 * @param {Array} previousComponents - Components from previous steps
 * @returns {Array} Components created in this step
 */
function processStep(step, ingredientState, processMaster, ingredientMaster, recipe, consumedIngredients, previousComponents) {
  const components = [];
  
  // Check if this step creates a distinct component (intermediate result)
  const isComponentStep = step.processes.length > 1 || step.outputDescription;
  
  if (!isComponentStep) {
    // Simple single-process step, just update ingredient states
    step.processes.forEach(proc => {
      applyProcessToIngredients(
        proc,
        ingredientState,
        processMaster,
        ingredientMaster
      );
    });
    return components;
  }
  
  // This step creates a component
  const component = {
    id: `comp_${recipe.spoonacularId}_step${step.stepNumber}`,
    name: step.outputDescription || `Step ${step.stepNumber} output`,
    stepNumber: step.stepNumber,
    sourceIngredients: [],
    processes: [],
    output: {
      quantityG: 0,
      state: 'prepared'
    },
    calculated: {
      costAUD: 0,
      costPerG: 0,
      nutrition: initializeNutritionProfile(),
      prepTimeMin: 0
    },
    prepAhead: {
      canStore: false,
      shelfLifeHours: 0,
      storageLocation: 'counter'
    }
  };
  
  // Process each process in sequence
  let cumulativeYield = 1.0;
  
  step.processes.forEach(proc => {
    const processData = processMaster.processes[proc.processId];
    if (!processData) {
      throw new Error(`Process not found: ${proc.processId}`);
    }
    
    // Track ingredients involved
    const involvedIngredients = proc.ingredients
      .map(ingName => ingredientState.get(ingName))
      .filter(Boolean);
    
    // Calculate yield for this process
    const yieldFactor = getYieldFactor(processData, proc.ingredients, ingredientMaster);
    cumulativeYield *= yieldFactor;
    
    // Add to component
    component.processes.push({
      processId: proc.processId,
      processName: processData.displayName,
      yieldFactor,
      durationMinutes: proc.durationMinutes || processData.timeEstimate.baseMinutes,
      nutritionMultiplier: processData.nutritionMultiplierRef
    });
    
    // Track source ingredients (first process only) - but only if NOT already consumed
    if (component.sourceIngredients.length === 0) {
      involvedIngredients.forEach(ingState => {
        // Only add to source if this ingredient hasn't been used yet
        if (!consumedIngredients.has(ingState.originalName)) {
          component.sourceIngredients.push({
            ingredientId: ingState.ingredientId,
            name: ingState.originalName,
            quantityG: ingState.originalQuantityG  // Use ORIGINAL quantity, not current
          });
          
          // Mark as consumed
          consumedIngredients.add(ingState.originalName);
        }
      });
    }
    
    // Update ingredient states
    applyProcessToIngredients(proc, ingredientState, processMaster, ingredientMaster);
    
    // Update component calculated values
    component.calculated.prepTimeMin += proc.durationMinutes || processData.timeEstimate.baseMinutes;
    
    // Update prep-ahead info (most restrictive wins)
    if (processData.prepAhead.canPrepAhead) {
      if (!component.prepAhead.canStore || processData.prepAhead.shelfLifeHours < component.prepAhead.shelfLifeHours) {
        component.prepAhead = {
          canStore: processData.prepAhead.canPrepAhead,
          shelfLifeHours: processData.prepAhead.shelfLifeHours,
          storageLocation: processData.prepAhead.storageLocation
        };
      }
    }
  });
  
  // Calculate final component metrics - ONLY for newly consumed ingredients
  component.sourceIngredients.forEach(src => {
    const ingState = ingredientState.get(src.name);
    if (ingState) {
      component.calculated.costAUD += ingState.costAUD;
      addNutrition(component.calculated.nutrition, ingState.nutrition);
    }
  });
  
  // Calculate output quantity (sum of all source ingredients after yield)
  const totalInputG = component.sourceIngredients.reduce((sum, src) => sum + src.quantityG, 0);
  component.output.quantityG = totalInputG * cumulativeYield;
  
  if (component.output.quantityG > 0) {
    component.calculated.costPerG = component.calculated.costAUD / component.output.quantityG;
  }
  
  components.push(component);
  return components;
}

/**
 * Apply a process to ingredient states
 * @param {Object} process - Process to apply
 * @param {Map} ingredientState - Current ingredient states
 * @param {Object} processMaster - Process database
 * @param {Object} ingredientMaster - Ingredient database
 */
function applyProcessToIngredients(process, ingredientState, processMaster, ingredientMaster) {
  const processData = processMaster.processes[process.processId];
  if (!processData) return;
  
  process.ingredients.forEach(ingName => {
    const state = ingredientState.get(ingName);
    if (!state) return;
    
    // Apply yield factor
    const yieldFactor = getYieldFactor(processData, [ingName], ingredientMaster);
    state.currentQuantityG *= yieldFactor;
    
    // Update state
    state.state = processData.category === 'prep' ? 'prepped' : 'cooked';
    state.processes.push(process.processId);
    
    // Apply nutrition multiplier if cooking
    if (processData.nutritionMultiplierRef !== 'raw') {
      // This would apply nutrition multipliers - simplified for now
      state.nutrition.method = processData.nutritionMultiplierRef;
    }
  });
}

/**
 * Get yield factor for a process, checking for ingredient-specific overrides
 * @param {Object} processData - Process from Process Master
 * @param {Array} ingredientNames - Ingredients being processed
 * @param {Object} ingredientMaster - Ingredient database
 * @returns {number} Yield factor
 */
function getYieldFactor(processData, ingredientNames, ingredientMaster) {
  // Check for ingredient-specific overrides
  if (processData.yieldFactorOverrides && ingredientNames.length > 0) {
    const primaryIngredient = ingredientNames[0];
    const ingData = findIngredient(primaryIngredient, ingredientMaster);
    
    if (ingData && processData.yieldFactorOverrides[ingData.id]) {
      return processData.yieldFactorOverrides[ingData.id];
    }
  }
  
  return processData.yieldFactor;
}

/**
 * Find ingredient in master database
 * @param {string} name - Ingredient name from recipe
 * @param {Object} ingredientMaster - Ingredient database
 * @returns {Object|null} Ingredient data
 */
function findIngredient(name, ingredientMaster) {
  // Access the ingredients object
  const ingredients = ingredientMaster.ingredients || ingredientMaster;
  
  // Normalize name
  const normalized = name.toLowerCase().trim();
  
  // Direct match by ID
  if (ingredients[normalized]) {
    return { id: normalized, ...ingredients[normalized] };
  }
  
  // Search by aliases and display name
  for (const [id, data] of Object.entries(ingredients)) {
    // Skip metadata fields
    if (id.startsWith('_')) continue;
    
    if (data.aliases && data.aliases.some(alias => alias.toLowerCase() === normalized)) {
      return { id, ...data };
    }
    if (data.displayName && data.displayName.toLowerCase() === normalized) {
      return { id, ...data };
    }
  }
  
  // Partial match on aliases (for more flexible matching)
  for (const [id, data] of Object.entries(ingredients)) {
    if (id.startsWith('_')) continue;
    
    if (data.aliases && data.aliases.some(alias => 
      normalized.includes(alias.toLowerCase()) || alias.toLowerCase().includes(normalized)
    )) {
      return { id, ...data };
    }
  }
  
  return null;
}

/**
 * Calculate ingredient nutrition
 * @param {number} quantityG - Quantity in grams
 * @param {Object} ingredientData - Ingredient from master
 * @param {string} state - Cooking state
 * @returns {Object} Nutrition profile
 */
function calculateIngredientNutrition(quantityG, ingredientData, state) {
  const nutrition = initializeNutritionProfile();
  
  if (!ingredientData.nutritionBase || !ingredientData.nutritionBase.per100g) {
    return nutrition;
  }
  
  const per100g = ingredientData.nutritionBase.per100g;
  const factor = quantityG / 100;
  
  nutrition.calories = (per100g.calories || 0) * factor;
  nutrition.protein = (per100g.protein || 0) * factor;
  nutrition.fat = (per100g.fat || 0) * factor;
  nutrition.carbs = (per100g.carbs || 0) * factor;
  nutrition.fiber = (per100g.fiber || 0) * factor;
  nutrition.sugar = (per100g.sugar || 0) * factor;
  nutrition.sodium = (per100g.sodium || 0) * factor;
  nutrition.method = state;
  
  return nutrition;
}

/**
 * Initialize empty nutrition profile
 * @returns {Object} Empty nutrition profile
 */
function initializeNutritionProfile() {
  return {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    method: 'raw'
  };
}

/**
 * Add nutrition from one profile to another
 * @param {Object} target - Target nutrition profile
 * @param {Object} source - Source nutrition profile
 */
function addNutrition(target, source) {
  target.calories += source.calories || 0;
  target.protein += source.protein || 0;
  target.fat += source.fat || 0;
  target.carbs += source.carbs || 0;
  target.fiber += source.fiber || 0;
  target.sugar += source.sugar || 0;
  target.sodium += source.sodium || 0;
}

/**
 * Calculate final recipe metrics
 * @param {Array} components - All components
 * @param {Object} recipe - Original recipe
 * @param {Map} ingredientState - Final ingredient state (for cost/nutrition totals)
 * @returns {Object} Recipe metrics
 */
function calculateRecipeMetrics(components, recipe, ingredientState) {
  // CRITICAL: Calculate cost from RAW INGREDIENTS ONLY (purchased once)
  // Don't sum component costs (that double/triple counts ingredients)
  let totalCost = 0;
  const totalNutrition = initializeNutritionProfile();
  
  ingredientState.forEach((state, name) => {
    totalCost += state.costAUD;
    addNutrition(totalNutrition, state.nutrition);
  });
  
  const totalPrepTime = components.reduce((sum, comp) => sum + comp.calculated.prepTimeMin, 0);
  
  return {
    totalCost,
    costPerServing: totalCost / recipe.servings,
    totalPrepTime,
    totalNutrition,
    nutritionPerServing: {
      calories: totalNutrition.calories / recipe.servings,
      protein: totalNutrition.protein / recipe.servings,
      fat: totalNutrition.fat / recipe.servings,
      carbs: totalNutrition.carbs / recipe.servings,
      fiber: totalNutrition.fiber / recipe.servings,
      sugar: totalNutrition.sugar / recipe.servings,
      sodium: totalNutrition.sodium / recipe.servings
    },
    prepAheadComponents: components.filter(c => c.prepAhead.canStore),
    reusableComponents: identifyReusableComponents(components)
  };
}

/**
 * Identify components that could be reused in other recipes
 * @param {Array} components - Recipe components
 * @returns {Array} Reusable component IDs
 */
function identifyReusableComponents(components) {
  return components
    .filter(comp => {
      // Reusable if:
      // 1. Can be stored (prep ahead)
      // 2. Has multiple processes (not just a single chop)
      // 3. Has a descriptive name
      return comp.prepAhead.canStore &&
             comp.processes.length > 1 &&
             comp.name.length > 20;
    })
    .map(comp => ({
      componentId: comp.id,
      name: comp.name,
      shelfLifeHours: comp.prepAhead.shelfLifeHours,
      processes: comp.processes.map(p => p.processId)
    }));
}

// Named exports
export { initializeIngredientState };
