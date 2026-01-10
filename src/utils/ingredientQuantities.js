/**
 * Ingredient Quantity Normalization and Conversion
 * 
 * Converts ingredient quantities to canonical units using density data.
 * Preserves original volume/count alongside normalized weight.
 */

import { getMasterIngredient } from './ingredientMaster.js';

// Unit conversion constants
const UNIT_TO_GRAMS = {
  // Weight units (direct conversion)
  'g': 1,
  'kg': 1000,
  'oz': 28.3495,
  'lb': 453.592
};

const UNIT_TO_ML = {
  // Volume units (to milliliters)
  'ml': 1,
  'l': 1000,
  'cup': 240,
  'tbsp': 15,
  'tsp': 5
};

/**
 * Normalize a quantity to canonical units using density data
 * @param {number|null} quantity - Parsed quantity
 * @param {string|null} unit - Parsed unit (normalized)
 * @param {string|null} masterId - Master ingredient ID for density lookup
 * @returns {Object} Normalized quantity object
 */
export function normalizeQuantity(quantity, unit, masterId) {
  const result = {
    originalQuantity: quantity,
    originalUnit: unit,
    normalizedQuantityG: null,
    normalizedQuantityMl: null
  };
  
  // No quantity to normalize
  if (quantity === null || quantity === 0) {
    return result;
  }
  
  // No unit (count-based like "3 cloves")
  if (!unit || unit === 'whole') {
    // For whole items, we'd need average weight from master
    // Leave as null for now - will be handled separately
    return result;
  }
  
  // Direct weight conversion
  if (UNIT_TO_GRAMS[unit]) {
    result.normalizedQuantityG = quantity * UNIT_TO_GRAMS[unit];
    return result;
  }
  
  // Volume conversion - requires density data
  if (UNIT_TO_ML[unit]) {
    const ml = quantity * UNIT_TO_ML[unit];
    result.normalizedQuantityMl = ml;
    
    // Convert to grams if we have density data
    if (masterId) {
      const ingredient = getMasterIngredient(masterId);
      
      if (ingredient && ingredient.density) {
        const { gPerCup, gPerTbsp, gPerTsp } = ingredient.density;
        
        // Choose the most appropriate density based on unit
        let grams = null;
        
        if (unit === 'cup' && gPerCup) {
          grams = quantity * gPerCup;
        } else if (unit === 'tbsp' && gPerTbsp) {
          grams = quantity * gPerTbsp;
        } else if (unit === 'tsp' && gPerTsp) {
          grams = quantity * gPerTsp;
        } else if (gPerCup) {
          // Fallback: convert via cup equivalent
          const cups = ml / 240;
          grams = cups * gPerCup;
        }
        
        if (grams !== null) {
          result.normalizedQuantityG = Math.round(grams); // Round to nearest gram
        }
      }
    }
    
    return result;
  }
  
  // Unknown unit - preserve original
  return result;
}

/**
 * Build a normalized quantity from parsing and matching results
 * @param {Object} parsed - Result from parseIngredient()
 * @param {Object} match - Result from matchIngredient()
 * @returns {Object} Normalized quantity object
 */
export function buildNormalizedQuantity(parsed, match) {
  return normalizeQuantity(
    parsed.quantity,
    parsed.unit,
    match?.masterId || null
  );
}

/**
 * Format a normalized quantity for display
 * @param {Object} normalized - Normalized quantity object
 * @param {boolean} preferWeight - Whether to prefer weight over volume display
 * @returns {string} Formatted quantity string
 */
export function formatQuantity(normalized, preferWeight = false) {
  const { originalQuantity, originalUnit, normalizedQuantityG, normalizedQuantityMl } = normalized;
  
  // No quantity
  if (!originalQuantity) {
    return '';
  }
  
  // Prefer weight if available and requested
  if (preferWeight && normalizedQuantityG) {
    if (normalizedQuantityG >= 1000) {
      return `${(normalizedQuantityG / 1000).toFixed(1)}kg`;
    }
    return `${normalizedQuantityG}g`;
  }
  
  // Prefer volume for liquids
  if (normalizedQuantityMl && originalUnit && UNIT_TO_ML[originalUnit]) {
    if (normalizedQuantityMl >= 1000) {
      return `${(normalizedQuantityMl / 1000).toFixed(1)}L`;
    }
    if (originalUnit === 'cup' || originalUnit === 'tbsp' || originalUnit === 'tsp') {
      return `${originalQuantity} ${originalUnit}`;
    }
    return `${Math.round(normalizedQuantityMl)}ml`;
  }
  
  // Fallback to original
  return `${originalQuantity}${originalUnit ? ' ' + originalUnit : ''}`;
}

/**
 * Aggregate quantities for shopping list
 * Combines multiple normalized quantities of the same ingredient
 * @param {Array<Object>} quantities - Array of normalized quantity objects
 * @returns {Object} Aggregated result
 */
export function aggregateQuantities(quantities) {
  let totalG = 0;
  let totalMl = 0;
  let hasG = false;
  let hasMl = false;
  let countWithoutNormalization = 0;
  
  quantities.forEach(q => {
    if (q.normalizedQuantityG !== null) {
      totalG += q.normalizedQuantityG;
      hasG = true;
    } else if (q.normalizedQuantityMl !== null) {
      totalMl += q.normalizedQuantityMl;
      hasMl = true;
    } else {
      countWithoutNormalization++;
    }
  });
  
  return {
    totalG: hasG ? Math.round(totalG) : null,
    totalMl: hasMl ? Math.round(totalMl) : null,
    itemCount: quantities.length,
    unnormalizedCount: countWithoutNormalization,
    hasCompleteData: countWithoutNormalization === 0
  };
}

/**
 * Format aggregated quantities for shopping list display
 * @param {Object} aggregated - Result from aggregateQuantities()
 * @returns {string} Formatted string
 */
export function formatAggregated(aggregated) {
  if (aggregated.totalG) {
    if (aggregated.totalG >= 1000) {
      return `${(aggregated.totalG / 1000).toFixed(1)}kg`;
    }
    return `${aggregated.totalG}g`;
  }
  
  if (aggregated.totalMl) {
    if (aggregated.totalMl >= 1000) {
      return `${(aggregated.totalMl / 1000).toFixed(1)}L`;
    }
    return `${aggregated.totalMl}ml`;
  }
  
  // No normalized data available
  if (aggregated.itemCount === 1) {
    return 'varies';
  }
  
  return `${aggregated.itemCount} items`;
}

export default {
  normalizeQuantity,
  buildNormalizedQuantity,
  formatQuantity,
  aggregateQuantities,
  formatAggregated,
  UNIT_TO_GRAMS,
  UNIT_TO_ML
};
