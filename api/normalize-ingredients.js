/**
 * Normalize Ingredients API Endpoint
 * 
 * Takes raw recipe ingredients and normalizes them against the master catalog.
 * Returns matched ingredients with confidence scores and flags unmatched items.
 * 
 * This is a critical component of the recipe import pipeline.
 */

// Configure for Vercel Edge Runtime (browser-compatible imports)
export const config = {
  runtime: 'edge',
};

// Import utilities (these need to be browser-compatible)
import { parseIngredient } from '../src/utils/ingredientParsing.js';
import { matchIngredient } from '../src/utils/ingredientMatcher.js';
import { getMasterIngredient, getAllMasterIngredients } from '../src/utils/ingredientMaster.js';
import { buildNormalizedQuantity } from '../src/utils/ingredientQuantities.js';

/**
 * Generate smart suggestions for unmatched ingredients
 * @param {string} ingredientText - The ingredient text that didn't match
 * @param {number} maxSuggestions - Maximum suggestions to return
 * @returns {Array} Array of suggested ingredient IDs
 */
function generateSuggestions(ingredientText, maxSuggestions = 5) {
  const allIngredients = getAllMasterIngredients();
  const searchText = ingredientText.toLowerCase();
  
  // Score each ingredient based on similarity
  const scored = allIngredients.map(ing => {
    let score = 0;
    const displayLower = ing.displayName.toLowerCase();
    const id = ing.id;
    
    // Exact match
    if (displayLower === searchText) score += 1000;
    
    // Contains match
    if (displayLower.includes(searchText)) score += 500;
    if (searchText.includes(displayLower)) score += 400;
    
    // Word matches
    const searchWords = searchText.split(/\s+/);
    const displayWords = displayLower.split(/\s+/);
    const matchingWords = searchWords.filter(w => displayWords.includes(w)).length;
    score += matchingWords * 100;
    
    // Alias matches
    if (ing.aliases) {
      const aliasMatch = ing.aliases.some(alias => 
        alias.toLowerCase().includes(searchText) || searchText.includes(alias.toLowerCase())
      );
      if (aliasMatch) score += 300;
    }
    
    // Same category (if we can infer it)
    if (ing.tags) {
      const hasProtectiveTag = ing.tags.includes('protective');
      if (hasProtectiveTag) score += 50; // Prioritize healthy ingredients
    }
    
    return { ...ing, score };
  });
  
  // Sort by score and return top N
  return scored
    .filter(ing => ing.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(ing => ({
      id: ing.id,
      displayName: ing.displayName,
      state: ing.state,
      canonicalUnit: ing.canonicalUnit,
      score: ing.score
    }));
}

/**
 * Normalize a single ingredient
 * @param {Object} rawIngredient - Raw ingredient object {name, quantity, unit}
 * @param {number} confidenceThreshold - Minimum confidence for auto-match (default 0.8)
 * @returns {Object} Normalized ingredient with match info
 */
function normalizeSingleIngredient(rawIngredient, confidenceThreshold = 0.8) {
  // Reconstruct ingredient string if needed
  let rawText;
  if (typeof rawIngredient === 'string') {
    rawText = rawIngredient;
  } else {
    const quantity = rawIngredient.quantity || '';
    const unit = rawIngredient.unit || '';
    const name = rawIngredient.name || rawIngredient.ingredient || '';
    rawText = `${quantity} ${unit} ${name}`.trim();
  }
  
  // Parse the ingredient
  const parsed = parseIngredient(rawText);
  
  // Match to master dictionary
  const match = matchIngredient(parsed.identityText, parsed.state);
  
  // Build normalized quantity
  let quantity = null;
  let masterIngredient = null;
  
  if (match.masterId) {
    masterIngredient = getMasterIngredient(match.masterId);
    if (masterIngredient) {
      quantity = buildNormalizedQuantity(parsed, match);
    }
  }
  
  // Determine if user review is needed
  const needsReview = !match.masterId || match.confidence < confidenceThreshold;
  
  // Generate suggestions if match is weak or missing
  const suggestions = needsReview 
    ? generateSuggestions(parsed.identityText, 5)
    : [];
  
  return {
    // Original data
    original: {
      rawText: rawText,
      name: rawIngredient.name || parsed.identityText,
      quantity: rawIngredient.quantity,
      unit: rawIngredient.unit
    },
    
    // Parsed data
    parsed: {
      identityText: parsed.identityText,
      state: parsed.state,
      preparation: parsed.preparation,
      quantity: parsed.quantity,
      unit: parsed.unit
    },
    
    // Match result
    matched: masterIngredient ? {
      id: masterIngredient.id,
      displayName: masterIngredient.displayName,
      canonicalUnit: masterIngredient.canonicalUnit,
      state: masterIngredient.state,
      confidence: match.confidence,
      matchMethod: match.method
    } : null,
    
    // Normalized quantity
    quantity: quantity,
    
    // Review flags
    needsReview: needsReview,
    reviewReason: !match.masterId ? 'no_match' : 
                  match.confidence < confidenceThreshold ? 'low_confidence' : null,
    suggestions: suggestions
  };
}

/**
 * Main handler for normalize-ingredients endpoint
 */
export default async function handler(req) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const { ingredients, confidenceThreshold } = body;
    
    // Validate input
    if (!ingredients || !Array.isArray(ingredients)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'ingredients field is required and must be an array'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (ingredients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'EMPTY_INPUT',
          message: 'At least one ingredient is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (ingredients.length > 50) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOO_MANY_INGREDIENTS',
          message: 'Maximum 50 ingredients per request'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Set confidence threshold (default 0.8)
    const threshold = confidenceThreshold !== undefined ? confidenceThreshold : 0.8;
    
    if (threshold < 0 || threshold > 1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_THRESHOLD',
          message: 'confidenceThreshold must be between 0 and 1'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Normalize each ingredient
    const normalized = ingredients.map(ing => 
      normalizeSingleIngredient(ing, threshold)
    );
    
    // Calculate summary statistics
    const stats = {
      total: normalized.length,
      matched: normalized.filter(n => n.matched !== null).length,
      needsReview: normalized.filter(n => n.needsReview).length,
      highConfidence: normalized.filter(n => n.matched && n.matched.confidence >= 0.9).length,
      mediumConfidence: normalized.filter(n => n.matched && n.matched.confidence >= 0.7 && n.matched.confidence < 0.9).length,
      lowConfidence: normalized.filter(n => n.matched && n.matched.confidence < 0.7).length,
      noMatch: normalized.filter(n => n.matched === null).length
    };
    
    // Determine if user review is required
    const requiresUserReview = stats.needsReview > 0;
    
    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        normalized: normalized,
        requiresUserReview: requiresUserReview,
        stats: stats,
        confidenceThreshold: threshold
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Normalize ingredients endpoint error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred during normalization',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
