/**
 * Recipe Ingredient Normalization Pipeline
 * 
 * Normalizes recipe ingredients at import time by:
 * 1. Parsing raw ingredient text
 * 2. Matching to master dictionary
 * 3. Converting quantities to canonical units
 * 4. Separating identity from preparation
 * 
 * Result: Each recipe gets a normalizedIngredients array with
 * clean, aggregatable data for shopping lists.
 */

import { parseIngredient } from '../utils/ingredientParsing.js';
import { matchIngredient } from '../utils/ingredientMatcher.js';
import { buildNormalizedQuantity } from '../utils/ingredientQuantities.js';
import { getMasterIngredient } from '../utils/ingredientMaster.js';

/**
 * Normalize all ingredients in a recipe
 * @param {Object} recipe - Recipe object with ingredients array
 * @returns {Object} Recipe with normalizedIngredients added
 */
export function normalizeRecipeIngredients(recipe) {
  // Skip if already normalized (idempotency)
  if (recipe.normalizedIngredients && recipe.normalizedIngredients.length > 0) {
    console.log(`   ⏭️  Recipe "${recipe.name}" already normalized, skipping`);
    return recipe;
  }
  
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    console.warn(`   ⚠️  Recipe "${recipe.name}" has no ingredients array`);
    return {
      ...recipe,
      normalizedIngredients: [],
      normalizationStatus: 'no_ingredients'
    };
  }
  
  const normalizedIngredients = [];
  const diagnostics = {
    totalIngredients: recipe.ingredients.length,
    matched: 0,
    unmatched: 0,
    lowConfidence: 0,
    missingDensity: 0,
    unmatchedIngredients: []
  };
  
  for (const rawIngredient of recipe.ingredients) {
    // Handle both string and object formats
    let rawText;
    if (typeof rawIngredient === 'string') {
      rawText = rawIngredient;
    } else {
      // Object format: reconstruct ingredient string from parts
      const quantity = rawIngredient.quantity || '';
      const unit = rawIngredient.unit || '';
      const name = rawIngredient.name || rawIngredient.ingredient || '';
      
      if (!name) {
        diagnostics.unmatched++;
        continue;
      }
      
      // Reconstruct as "quantity unit name"
      rawText = `${quantity} ${unit} ${name}`.trim();
    }
    
    if (!rawText) {
      diagnostics.unmatched++;
      continue;
    }
    
    // Step 1: Parse
    const parsed = parseIngredient(rawText);
    
    // Step 2: Match to master dictionary
    const match = matchIngredient(parsed.identityText, parsed.state);
    
    // Track diagnostics
    if (!match.masterId) {
      diagnostics.unmatched++;
      diagnostics.unmatchedIngredients.push({
        rawText,
        identityText: parsed.identityText,
        state: parsed.state
      });
      continue;
    }
    
    if (match.confidence < 0.7) {
      diagnostics.lowConfidence++;
    }
    
    diagnostics.matched++;
    
    // Step 3: Convert quantity
    const quantity = buildNormalizedQuantity(parsed, match);
    
    // Track missing density
    if (parsed.unit && quantity.normalizedQuantityG === null && 
        (parsed.unit === 'cup' || parsed.unit === 'tbsp' || parsed.unit === 'tsp')) {
      diagnostics.missingDensity++;
    }
    
    // Step 4: Get master ingredient details
    const master = getMasterIngredient(match.masterId);
    
    // Step 5: Build normalized ingredient object
    normalizedIngredients.push({
      masterIngredientId: master.id,
      displayName: master.displayName,
      quantity,
      state: master.state,
      preparation: parsed.preparation,
      rawText,
      matchConfidence: match.confidence
    });
  }
  
  // Determine status
  let status = 'complete';
  if (diagnostics.unmatched > 0) {
    status = 'partial';
  } else if (diagnostics.lowConfidence > 0 || diagnostics.missingDensity > 0) {
    status = 'complete_with_warnings';
  }
  
  return {
    ...recipe,
    normalizedIngredients,
    normalizationStatus: status,
    normalizationDiagnostics: diagnostics
  };
}

/**
 * Batch normalize multiple recipes
 * @param {Array<Object>} recipes - Array of recipe objects
 * @param {Function} progressCallback - Optional callback(current, total, recipe)
 * @returns {Array<Object>} Normalized recipes
 */
export function batchNormalizeRecipes(recipes, progressCallback = null) {
  const normalized = [];
  const overallStats = {
    total: recipes.length,
    complete: 0,
    partial: 0,
    skipped: 0,
    totalIngredients: 0,
    totalMatched: 0,
    totalUnmatched: 0
  };
  
  recipes.forEach((recipe, index) => {
    if (progressCallback) {
      progressCallback(index + 1, recipes.length, recipe);
    }
    
    const result = normalizeRecipeIngredients(recipe);
    normalized.push(result);
    
    // Update stats
    if (result.normalizationStatus === 'complete' || 
        result.normalizationStatus === 'complete_with_warnings') {
      overallStats.complete++;
    } else if (result.normalizationStatus === 'partial') {
      overallStats.partial++;
    } else {
      overallStats.skipped++;
    }
    
    if (result.normalizationDiagnostics) {
      overallStats.totalIngredients += result.normalizationDiagnostics.totalIngredients;
      overallStats.totalMatched += result.normalizationDiagnostics.matched;
      overallStats.totalUnmatched += result.normalizationDiagnostics.unmatched;
    }
  });
  
  return { recipes: normalized, stats: overallStats };
}

export default {
  normalizeRecipeIngredients,
  batchNormalizeRecipes
};
