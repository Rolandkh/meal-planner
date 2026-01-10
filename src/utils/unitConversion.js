/**
 * Unit Conversion Utilities
 * Converts recipe units to canonical grams/ml for calculations
 */

/**
 * Convert ingredient quantity to grams
 * @param {number} quantity - Original quantity
 * @param {string} unit - Original unit
 * @param {string} ingredientName - Ingredient name
 * @param {Object} ingredientData - Ingredient data from master
 * @returns {number} Quantity in grams
 */
export function convertToGrams(quantity, unit, ingredientName, ingredientData) {
  if (!quantity || quantity === 0) return 0;
  
  const normalizedUnit = normalizeUnit(unit);
  
  // Already in canonical units
  if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'grams') {
    return quantity;
  }
  
  if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter' || normalizedUnit === 'milliliters') {
    // For liquids, 1ml ≈ 1g (close enough for most ingredients)
    // Could use density data if available
    return quantity;
  }
  
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogram' || normalizedUnit === 'kilograms') {
    return quantity * 1000;
  }
  
  if (normalizedUnit === 'l' || normalizedUnit === 'liter' || normalizedUnit === 'liters') {
    return quantity * 1000;
  }
  
  // Volume conversions using density data
  if (ingredientData.density) {
    const density = ingredientData.density;
    
    if (normalizedUnit === 'cup' || normalizedUnit === 'cups') {
      return quantity * (density.gPerCup || 200);
    }
    
    if (normalizedUnit === 'tbsp' || normalizedUnit === 'tablespoon' || normalizedUnit === 'tablespoons') {
      return quantity * (density.gPerTbsp || 15);
    }
    
    if (normalizedUnit === 'tsp' || normalizedUnit === 'teaspoon' || normalizedUnit === 'teaspoons') {
      return quantity * (density.gPerTsp || 5);
    }
  }
  
  // Fallback estimates for common units (when density data missing)
  const fallbackConversions = {
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'oz': 28.35,
    'lb': 453.592,
    'pound': 453.592
  };
  
  if (fallbackConversions[normalizedUnit]) {
    return quantity * fallbackConversions[normalizedUnit];
  }
  
  // Count-based units (items, pieces, cloves, heads, bunches, sheets, etc.)
  const countUnits = ['', 'whole', 'item', 'piece', 'clove', 'head', 'bunch', 'sheet', 'leaf', 'leaves', 'stalk'];
  if (countUnits.includes(normalizedUnit)) {
    // Use average item weight if available
    if (ingredientData.averageItemWeight) {
      return quantity * ingredientData.averageItemWeight;
    }
    
    // Use pricing typical weight if available
    if (ingredientData.pricing?.typicalWeight) {
      return quantity * ingredientData.pricing.typicalWeight;
    }
    
    // Common item weights (fallback)
    const itemWeights = {
      'egg': 50,
      'onion': 150,
      'tomato': 120,
      'potato': 180,
      'carrot': 60,
      'apple': 180,
      'lemon': 80,
      'lime': 50,
      'garlic': 5,           // Per clove
      'garlic clove': 5,
      'chicken breast': 200,
      'mushroom': 15,        // Medium mushroom
      'zucchini': 200,       // Medium zucchini
      'bell pepper': 150,
      'cucumber': 300,
      'banana': 120,
      'basil': 0.5,          // Per leaf
      'basil leaf': 0.5,
      'sage': 0.3,           // Per leaf
      'lasagna': 20,         // Per sheet
      'lasagna sheet': 20,
      'lasagna noodle': 20
    };
    
    const normalizedName = ingredientName.toLowerCase();
    for (const [item, weight] of Object.entries(itemWeights)) {
      if (normalizedName.includes(item)) {
        return quantity * weight;
      }
    }
  }
  
  // If all else fails, log warning and return quantity as-is
  console.warn(`Unable to convert unit "${unit}" for "${ingredientName}" - using quantity as grams`);
  return quantity;
}

/**
 * Normalize unit string
 * @param {string} unit - Original unit
 * @returns {string} Normalized unit
 */
function normalizeUnit(unit) {
  if (!unit) return '';
  
  return unit
    .toLowerCase()
    .trim()
    .replace(/\./g, '')  // Remove periods (oz. → oz)
    .replace(/s$/, '');  // Remove plural (cups → cup)
}

/**
 * Convert grams back to display unit
 * @param {number} grams - Quantity in grams
 * @param {string} preferredUnit - Preferred display unit
 * @param {Object} ingredientData - Ingredient data for density
 * @returns {Object} { quantity, unit }
 */
export function convertFromGrams(grams, preferredUnit = 'g', ingredientData = null) {
  const unit = normalizeUnit(preferredUnit);
  
  if (unit === 'g' || unit === 'gram') {
    return { quantity: Math.round(grams), unit: 'g' };
  }
  
  if (unit === 'kg' || unit === 'kilogram') {
    return { quantity: Math.round(grams / 1000 * 100) / 100, unit: 'kg' };
  }
  
  if (ingredientData?.density) {
    const density = ingredientData.density;
    
    if (unit === 'cup') {
      return { quantity: Math.round(grams / density.gPerCup * 100) / 100, unit: 'cup' };
    }
    
    if (unit === 'tbsp') {
      return { quantity: Math.round(grams / density.gPerTbsp * 10) / 10, unit: 'tbsp' };
    }
    
    if (unit === 'tsp') {
      return { quantity: Math.round(grams / density.gPerTsp * 10) / 10, unit: 'tsp' };
    }
  }
  
  // Default to grams
  return { quantity: Math.round(grams), unit: 'g' };
}

export default {
  convertToGrams,
  convertFromGrams,
  normalizeUnit
};
