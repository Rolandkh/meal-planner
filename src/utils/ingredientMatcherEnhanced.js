/**
 * Enhanced Ingredient Matching Utilities
 * 
 * Extends the base matcher with:
 * - Compound ingredient splitting
 * - Pattern-based matching (regex)
 * - Structured multi-component results
 * - Backward compatible with existing matcher
 */

import { matchIngredient as baseMatch } from './ingredientMatcher.js';
import { splitCompoundIngredient } from './ingredientCompoundSplit.js';
import { ingredientMaster } from './ingredientMaster.js';

/**
 * Match ingredient with optional pattern matching
 * @param {string} identityText - Normalized identity text
 * @param {string} state - Product state
 * @returns {{masterId: string|null, confidence: number, matchedAlias?: string}}
 */
function matchWithPatterns(identityText, state = 'fresh') {
  // First try base match (exact, token, fuzzy)
  const baseResult = baseMatch(identityText, state);
  
  if (baseResult.masterId) {
    return baseResult;
  }
  
  // Try pattern matching as fallback
  const normalized = identityText.toLowerCase().trim();
  
  for (const [id, ingredient] of Object.entries(ingredientMaster)) {
    // Skip if no pattern defined
    if (!ingredient.patterns) continue;
    
    try {
      const regex = new RegExp(ingredient.patterns, 'i');
      if (regex.test(normalized)) {
        // State bonus/penalty
        let confidence = 0.85; // Pattern matches get medium confidence
        if (ingredient.state === state) {
          confidence = 0.90;
        }
        
        return {
          masterId: id,
          confidence,
          matchedAlias: `pattern_match: ${ingredient.patterns}`
        };
      }
    } catch (error) {
      console.warn(`Invalid pattern for ${id}:`, ingredient.patterns, error.message);
    }
  }
  
  // No match found
  return { masterId: null, confidence: 0 };
}

/**
 * Enhanced ingredient matching with compound support
 * @param {string} identityText - Normalized identity text (no prep terms)
 * @param {string} state - Product state ('fresh', 'frozen', etc.)
 * @returns {{
 *   status: 'matched'|'compound'|'unknown',
 *   matches: Array<{masterId: string, confidence: number}>,
 *   raw: string
 * }}
 */
export function matchIngredientEnhanced(identityText, state = 'fresh') {
  if (!identityText) {
    return {
      status: 'unknown',
      matches: [],
      raw: identityText || ''
    };
  }
  
  // Step 1: Check if it's a compound ingredient
  const compoundResult = splitCompoundIngredient(identityText);
  
  if (compoundResult.isCompound && compoundResult.components) {
    // Match each component separately
    const matches = compoundResult.components.map(component => {
      const match = matchWithPatterns(component, state);
      return {
        componentText: component,
        masterId: match.masterId,
        confidence: match.confidence,
        matchedAlias: match.matchedAlias
      };
    });
    
    // Check if all components matched
    const allMatched = matches.every(m => m.masterId !== null);
    const anyMatched = matches.some(m => m.masterId !== null);
    
    return {
      status: allMatched ? 'compound' : (anyMatched ? 'partial_compound' : 'unknown'),
      matches,
      raw: identityText,
      connectorType: compoundResult.connectorType
    };
  }
  
  // Step 2: Not compound - try regular matching
  const match = matchWithPatterns(identityText, state);
  
  if (match.masterId) {
    return {
      status: 'matched',
      matches: [{
        componentText: identityText,
        masterId: match.masterId,
        confidence: match.confidence,
        matchedAlias: match.matchedAlias
      }],
      raw: identityText
    };
  }
  
  // Step 3: No match found
  return {
    status: 'unknown',
    matches: [],
    raw: identityText
  };
}

/**
 * Backward-compatible wrapper that returns base matcher format
 * @param {string} identityText - Normalized identity text
 * @param {string} state - Product state
 * @param {Object} options - Options
 * @param {boolean} options.useEnhanced - Use enhanced matching
 * @returns {{masterId: string|null, confidence: number, matchedAlias?: string}}
 */
export function matchIngredient(identityText, state = 'fresh', options = {}) {
  if (!options.useEnhanced) {
    // Use base matcher (existing behavior)
    return baseMatch(identityText, state);
  }
  
  // Use enhanced matcher
  const enhanced = matchIngredientEnhanced(identityText, state);
  
  // Convert to base format (take first match)
  if (enhanced.status === 'matched' && enhanced.matches.length > 0) {
    const first = enhanced.matches[0];
    return {
      masterId: first.masterId,
      confidence: first.confidence,
      matchedAlias: first.matchedAlias
    };
  }
  
  // For compounds, we can't represent in base format
  // Return null to maintain backward compatibility
  return {
    masterId: null,
    confidence: 0,
    isCompound: enhanced.status === 'compound' || enhanced.status === 'partial_compound',
    componentMatches: enhanced.matches
  };
}

/**
 * Batch match with enhanced features
 * @param {Array<{identityText: string, state: string}>} ingredients - Ingredients to match
 * @returns {Array} Array of enhanced match results
 */
export function batchMatchIngredientsEnhanced(ingredients) {
  return ingredients.map(ing => ({
    input: ing.identityText,
    state: ing.state,
    result: matchIngredientEnhanced(ing.identityText, ing.state)
  }));
}

/**
 * Get detailed match statistics
 * @param {Array} enhancedResults - Array of enhanced match results
 * @returns {Object} Statistics
 */
export function getEnhancedMatchStats(enhancedResults) {
  const matched = enhancedResults.filter(r => r.result.status === 'matched');
  const compounds = enhancedResults.filter(r => r.result.status === 'compound');
  const partialCompounds = enhancedResults.filter(r => r.result.status === 'partial_compound');
  const unknown = enhancedResults.filter(r => r.result.status === 'unknown');
  
  const highConfidence = matched.filter(r => 
    r.result.matches.length > 0 && r.result.matches[0].confidence >= 0.9
  );
  
  const mediumConfidence = matched.filter(r => 
    r.result.matches.length > 0 && 
    r.result.matches[0].confidence >= 0.7 && 
    r.result.matches[0].confidence < 0.9
  );
  
  const lowConfidence = matched.filter(r => 
    r.result.matches.length > 0 && r.result.matches[0].confidence < 0.7
  );
  
  return {
    total: enhancedResults.length,
    matched: matched.length,
    compounds: compounds.length,
    partialCompounds: partialCompounds.length,
    unknown: unknown.length,
    matchRate: ((matched.length + compounds.length) / enhancedResults.length * 100).toFixed(1) + '%',
    highConfidence: highConfidence.length,
    mediumConfidence: mediumConfidence.length,
    lowConfidence: lowConfidence.length,
    breakdown: {
      simple_matched: matched.length,
      compound_full: compounds.length,
      compound_partial: partialCompounds.length,
      unmatched: unknown.length
    }
  };
}

export default {
  matchIngredient,
  matchIngredientEnhanced,
  batchMatchIngredientsEnhanced,
  getEnhancedMatchStats
};
