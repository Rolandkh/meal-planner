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
  
  let normalizedUnit = normalizeUnit(unit);
  
  // Special case: If unit is empty but ingredient name contains unit info
  // Example: "28 oz can tomatoes" with quantity=28, unit=""
  if (!normalizedUnit || normalizedUnit === '') {
    const nameMatch = ingredientName.toLowerCase().match(/(\d+\s*)?(oz|ounce|pound|lb|can|jar|bottle|box)/);
    if (nameMatch) {
      normalizedUnit = nameMatch[2]; // Extract the unit from name
    }
  }
  
  // Handle size modifiers (large, medium, small, extra large)
  const sizeModifiers = {
    'extra_large': 1.5,
    'extra large': 1.5,
    'medium_size': 1.0,
    'medium size': 1.0,
    'large': 1.3,
    'medium': 1.0,
    'small': 0.7,
    'mini': 0.5
  };
  
  let sizeMultiplier = 1.0;
  // Check for size modifiers (order matters - check compound modifiers first)
  for (const [sizeWord, multiplier] of Object.entries(sizeModifiers)) {
    if (normalizedUnit.includes(sizeWord)) {
      sizeMultiplier = multiplier;
      normalizedUnit = normalizedUnit.replace(sizeWord, '').trim();
      break;
    }
  }
  
  // Already in canonical units
  if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'grams') {
    return quantity * sizeMultiplier;
  }
  
  if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter' || normalizedUnit === 'milliliters') {
    // For liquids, 1ml ≈ 1g (close enough for most ingredients)
    return quantity * sizeMultiplier;
  }
  
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogram' || normalizedUnit === 'kilograms') {
    return quantity * 1000 * sizeMultiplier;
  }
  
  if (normalizedUnit === 'l' || normalizedUnit === 'liter' || normalizedUnit === 'liters') {
    return quantity * 1000 * sizeMultiplier;
  }
  
  // Volume conversions using density data
  if (ingredientData.density) {
    const density = ingredientData.density;
    
    if (normalizedUnit === 'cup' || normalizedUnit === 'cups') {
      return quantity * (density.gPerCup || 200) * sizeMultiplier;
    }
    
    if (normalizedUnit === 'tbsp' || normalizedUnit === 'tablespoon' || normalizedUnit === 'tablespoons') {
      return quantity * (density.gPerTbsp || 15) * sizeMultiplier;
    }
    
    if (normalizedUnit === 'tsp' || normalizedUnit === 'teaspoon' || normalizedUnit === 'teaspoons') {
      return quantity * (density.gPerTsp || 5) * sizeMultiplier;
    }
  }
  
  // Fallback estimates for common units (when density data missing)
  const fallbackConversions = {
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'oz': 28.35,
    'ounce': 28.35,
    'lb': 453.592,
    'pound': 453.592,
    'can': 400,        // Average can size
    'jar': 250,        // Average jar
    'bottle': 500,     // Average bottle
    'box': 300,        // Average box (pasta, frozen spinach)
    'loaf': 400,       // Average bread loaf
    'handful': 30,     // ~30g per handful
    'handfuls': 30,    // per handful
    'sprig': 5,        // Herb sprig
    'sprigs': 5,       // per sprig
    'stalk': 40,       // Celery stalk
    'stalks': 40,      // per stalk
    'pinch': 1,        // Pinch of spice/herb
    'dash': 1,         // Dash of liquid
    'pt': 473,         // Pint = 473ml
    'pts': 473,        // Pints
    'pint': 473,
    'pints': 473
    // NOTE: 'serving' and 'servings' handled specially below
  };
  
  // Special handling for "servings" unit - context-aware
  if (normalizedUnit === 'serving' || normalizedUnit === 'servings') {
    const name = ingredientName.toLowerCase();
    
    // Seasonings (salt, pepper, spices): ~1g per serving
    if (name.includes('salt') || name.includes('pepper') || name.includes('chili flakes') ||
        name.includes('spice') || name.includes('seasoning')) {
      return quantity * 1 * sizeMultiplier;
    }
    
    // Garnishes and herbs: ~5g per serving
    if (name.includes('parsley') || name.includes('cilantro') || name.includes('basil') ||
        name.includes('chive') || name.includes('herb') || name.includes('garnish')) {
      return quantity * 5 * sizeMultiplier;
    }
    
    // Seeds/nuts: ~10g per serving
    if (name.includes('seed') || name.includes('nuts') || name.includes('walnut') ||
        name.includes('almond') || name.includes('cashew')) {
      return quantity * 10 * sizeMultiplier;
    }
    
    // Lemon/lime juice: ~15ml per serving
    if (name.includes('lemon juice') || name.includes('lime juice') || name.includes('juice')) {
      return quantity * 15 * sizeMultiplier;
    }
    
    // Proteins: ~150g per serving
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
        name.includes('fish') || name.includes('tilapia') || name.includes('salmon') ||
        name.includes('shrimp') || name.includes('meat')) {
      return quantity * 150 * sizeMultiplier;
    }
    
    // Sauces/liquids: ~30g per serving
    if (name.includes('sauce') || name.includes('gravy') || name.includes('dressing')) {
      return quantity * 30 * sizeMultiplier;
    }
    
    // Vegetables/sides: ~80g per serving
    if (name.includes('vegetable') || name.includes('salad')) {
      return quantity * 80 * sizeMultiplier;
    }
    
    // Generic fallback: 20g per serving (conservative)
    return quantity * 20 * sizeMultiplier;
  };
  
  if (fallbackConversions[normalizedUnit]) {
    return quantity * fallbackConversions[normalizedUnit] * sizeMultiplier;
  }
  
  // Count-based units (items, pieces, cloves, heads, bunches, sheets, etc.)
  const countUnits = ['', 'whole', 'item', 'piece', 'clove', 'head', 'bunch', 'sheet', 'leaf', 'leaves', 'stalk'];
  if (countUnits.includes(normalizedUnit)) {
    // FIRST: Check specific item weights (most accurate for count-based)
    // Common item weights (per item/leaf/sheet)
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
    
    // Check if ingredient name matches any item weight
    const normalizedName = ingredientName.toLowerCase();
    for (const [item, weight] of Object.entries(itemWeights)) {
      if (normalizedName.includes(item)) {
        return quantity * weight * sizeMultiplier;
      }
    }
    
    // SECOND: Use average item weight if available
    if (ingredientData.averageItemWeight) {
      return quantity * ingredientData.averageItemWeight * sizeMultiplier;
    }
    
    // THIRD: Use pricing typical weight (ONLY for units like "bunch", "pack", "bag")
    // NOT for count units like leaf/piece/clove
    if (normalizedUnit === 'bunch' || normalizedUnit === 'pack' || normalizedUnit === 'bag') {
      if (ingredientData.pricing?.typicalWeight) {
        return quantity * ingredientData.pricing.typicalWeight * sizeMultiplier;
      }
    }
  }
  
  // If all else fails, log warning and return quantity as-is
  console.warn(`Unable to convert unit "${unit}" for "${ingredientName}" - using quantity as grams`);
  return quantity * sizeMultiplier;
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
