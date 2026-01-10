/**
 * Shopping List Generation from Normalized Ingredients
 * 
 * Uses pre-normalized ingredient data from recipes to generate
 * clean, consolidated shopping lists without runtime conversion.
 * 
 * KEY PRINCIPLE: Preparation terms (chopped, diced) do NOT create separate items.
 * Shopping list shows what you BUY, not what you DO.
 */

import { getMasterIngredient } from './ingredientMaster.js';
import { aggregateQuantities, formatAggregated } from './ingredientQuantities.js';

/**
 * Build shopping list from recipes with normalized ingredients
 * @param {Array<Object>} recipes - Recipes from meal plan
 * @param {Object} usageCounts - Map of recipeId -> number of times used
 * @param {string} mode - 'chef' or 'pantry'
 * @returns {Array<Object>} Shopping list items
 */
export function buildNormalizedShoppingList(recipes, usageCounts = {}, mode = 'chef') {
  console.log(`🛒 Building shopping list from ${recipes.length} recipes (mode: ${mode})`);
  
  // Group ingredients by masterIngredientId + state (or just masterIngredientId in pantry mode)
  const ingredientBuckets = new Map();
  
  let normalizedRecipes = 0;
  let fallbackRecipes = 0;
  let totalIngredientsProcessed = 0;
  
  recipes.forEach(recipe => {
    const totalServingsNeeded = usageCounts[recipe.recipeId] || 1;
    const recipeBaseServings = recipe.servings || 1;
    
    // CRITICAL FIX: Scale by (totalServingsNeeded / recipeBaseServings)
    // This accounts for recipes that may have different base serving sizes
    const scalingFactor = totalServingsNeeded / recipeBaseServings;
    
    // Prefer normalizedIngredients if available
    if (recipe.normalizedIngredients && recipe.normalizedIngredients.length > 0) {
      normalizedRecipes++;
      
      recipe.normalizedIngredients.forEach(ing => {
        totalIngredientsProcessed++;
        
        // Create aggregation key
        let key;
        if (mode === 'chef') {
          // Chef mode: Keep state variations separate (fresh vs canned)
          key = `${ing.masterIngredientId}::${ing.state}`;
        } else {
          // Pantry mode: Group by ingredient only (ignore state)
          key = ing.masterIngredientId;
        }
        
        if (!ingredientBuckets.has(key)) {
          ingredientBuckets.set(key, {
            masterIngredientId: ing.masterIngredientId,
            displayName: ing.displayName,
            state: ing.state,
            quantities: [],
            preparations: new Set(),
            recipes: []
          });
        }
        
        const bucket = ingredientBuckets.get(key);
        
        // Add quantity (scaled by total servings / base servings)
        const scaledQuantity = {
          originalQuantity: ing.quantity.originalQuantity ? ing.quantity.originalQuantity * scalingFactor : null,
          originalUnit: ing.quantity.originalUnit,
          normalizedQuantityG: ing.quantity.normalizedQuantityG ? ing.quantity.normalizedQuantityG * scalingFactor : null,
          normalizedQuantityMl: ing.quantity.normalizedQuantityMl ? ing.quantity.normalizedQuantityMl * scalingFactor : null
        };
        
        bucket.quantities.push(scaledQuantity);
        
        // Track preparation methods (for reference, not for shopping)
        if (ing.preparation && ing.preparation.length > 0) {
          ing.preparation.forEach(prep => bucket.preparations.add(prep));
        }
        
        // Track which recipes use this ingredient
        if (!bucket.recipes.includes(recipe.name)) {
          bucket.recipes.push(recipe.name);
        }
      });
    } else {
      // Fallback: Recipe hasn't been normalized yet
      fallbackRecipes++;
      console.warn(`  ⚠️ Recipe "${recipe.name}" not normalized, using fallback`);
    }
  });
  
  console.log(`  📊 Processed ${totalIngredientsProcessed} normalized ingredients`);
  console.log(`  ✅ ${normalizedRecipes} recipes used normalized data`);
  if (fallbackRecipes > 0) {
    console.log(`  ⚠️  ${fallbackRecipes} recipes need normalization (using fallback)`);
  }
  
  // Convert buckets to shopping list items
  const shoppingList = [];
  
  for (const [key, bucket] of ingredientBuckets.entries()) {
    // Aggregate all quantities
    const aggregated = aggregateQuantities(bucket.quantities);
    
    // Get master ingredient for display info
    const master = getMasterIngredient(bucket.masterIngredientId);
    
    // Format quantity for display
    const quantityDisplay = formatAggregated(aggregated);
    
    // Determine category for grouping
    const category = master?.tags?.[0] || 'other';
    
    shoppingList.push({
      masterIngredientId: bucket.masterIngredientId,
      displayName: bucket.displayName,
      state: bucket.state,
      quantity: quantityDisplay,
      quantityRaw: aggregated,
      category,
      usedIn: bucket.recipes.length,
      recipes: bucket.recipes,
      preparations: Array.from(bucket.preparations), // For reference only
      checked: false
    });
  }
  
  // Sort by category, then by name
  const categoryOrder = ['vegetable', 'protein', 'dairy', 'grain', 'spice', 'oil', 'other'];
  
  shoppingList.sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    
    if (catA !== catB) {
      return catA - catB;
    }
    
    return a.displayName.localeCompare(b.displayName);
  });
  
  console.log(`  🎯 Generated ${shoppingList.length} shopping list items`);
  
  return shoppingList;
}

/**
 * Calculate recipe usage counts from meal plan
 * @param {Object} mealPlan - Meal plan with mealIds
 * @param {Array} meals - All meals
 * @returns {Object} Map of recipeId -> total usage count
 */
export function getRecipeUsageCounts(mealPlan, meals) {
  const counts = {};
  
  if (!mealPlan || !mealPlan.mealIds) return counts;
  
  const planMealIds = new Set(mealPlan.mealIds);
  const planMeals = meals.filter(meal => planMealIds.has(meal.mealId));
  
  planMeals.forEach(meal => {
    if (meal.recipeId) {
      counts[meal.recipeId] = (counts[meal.recipeId] || 0) + (meal.servings || 1);
    }
  });
  
  return counts;
}

export default {
  buildNormalizedShoppingList,
  getRecipeUsageCounts
};
