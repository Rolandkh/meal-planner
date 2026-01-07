/**
 * Unit Conversions for Shopping Lists
 * Converts all recipe units to metric supermarket units
 */

// Imperial to Metric conversions
export const CONVERSIONS = {
  // Volume conversions to ml
  volume: {
    'cup': 240,
    'tablespoon': 15,
    'tbsp': 15,
    'teaspoon': 5,
    'tsp': 5,
    'fluid ounce': 30,
    'fl oz': 30,
    'pint': 473,
    'quart': 946,
    'gallon': 3785
  },
  
  // Weight conversions to grams
  weight: {
    'ounce': 28.35,
    'oz': 28.35,
    'pound': 454,
    'lb': 454,
    'lbs': 454
  }
};

/**
 * Comprehensive ingredient unit mapping
 * Defines how each ingredient should be displayed on shopping lists
 */
export const INGREDIENT_SHOPPING_UNITS = {
  // ============================================================================
  // DAIRY & EGGS
  // ============================================================================
  'butter': { 
    unit: 'g',
    conversions: { 'tablespoon': 14, 'cup': 227, 'stick': 113 }
  },
  'milk': { 
    unit: 'ml',
    conversions: { 'cup': 240, 'tablespoon': 15, 'fluid ounce': 30 }
  },
  'almond milk': { unit: 'ml', conversions: { 'cup': 240 } },
  'soy milk': { unit: 'ml', conversions: { 'cup': 240 } },
  'cream': { unit: 'ml', conversions: { 'cup': 240, 'tablespoon': 15 } },
  'heavy cream': { unit: 'ml', conversions: { 'cup': 240 } },
  'sour cream': { unit: 'ml', conversions: { 'cup': 240 } },
  
  'cheese': { 
    unit: 'g',
    conversions: { 'cup': 113, 'ounce': 28.35, 'slice': 28, 'tablespoon': 7 }
  },
  'cheddar cheese': { unit: 'g', conversions: { 'cup': 113, 'slice': 28 } },
  'mozzarella': { unit: 'g', conversions: { 'cup': 113, 'slice': 28 } },
  'parmesan': { unit: 'g', conversions: { 'cup': 100, 'tablespoon': 5 } },
  'feta cheese': { unit: 'g', conversions: { 'cup': 150 } },
  
  'yogurt': { 
    unit: 'g',
    conversions: { 'cup': 245, 'ounce': 28.35 }
  },
  'greek yogurt': { unit: 'g', conversions: { 'cup': 280, 'ounce': 28.35 } },
  
  'eggs': { unit: 'whole', keepAsCount: true },
  
  // ============================================================================
  // MEATS & SEAFOOD
  // ============================================================================
  'chicken': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35 } },
  'chicken breast': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35, 'whole': 200 } },
  'chicken thigh': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35, 'whole': 120 } },
  'ground beef': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35 } },
  'ground turkey': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35 } },
  'beef': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35 } },
  'pork': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35 } },
  'pork chop': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35, 'whole': 150 } },
  'bacon': { unit: 'g', conversions: { 'slice': 28, 'ounce': 28.35, 'pound': 454 } },
  'turkey': { unit: 'g', conversions: { 'slice': 28, 'ounce': 28.35, 'pound': 454 } },
  'ham': { unit: 'g', conversions: { 'slice': 28, 'ounce': 28.35 } },
  'salmon': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35, 'fillet': 150 } },
  'smoked salmon': { unit: 'g', conversions: { 'ounce': 28.35, 'slice': 14 } },
  'tuna': { unit: 'g', conversions: { 'can': 140, 'ounce': 28.35 } },
  'shrimp': { unit: 'g', conversions: { 'pound': 454, 'ounce': 28.35 } },
  
  // ============================================================================
  // PANTRY & GRAINS
  // ============================================================================
  'rice': { unit: 'g', conversions: { 'cup': 185, 'ounce': 28.35 } },
  'brown rice': { unit: 'g', conversions: { 'cup': 195, 'ounce': 28.35 } },
  'white rice': { unit: 'g', conversions: { 'cup': 185, 'ounce': 28.35 } },
  'quinoa': { unit: 'g', conversions: { 'cup': 170, 'ounce': 28.35 } },
  'oats': { unit: 'g', conversions: { 'cup': 80, 'ounce': 28.35 } },
  'rolled oats': { unit: 'g', conversions: { 'cup': 80, 'ounce': 28.35 } },
  
  'pasta': { unit: 'g', conversions: { 'cup': 100, 'ounce': 28.35, 'pound': 454 } },
  'spaghetti': { unit: 'g', conversions: { 'cup': 100, 'ounce': 28.35 } },
  'penne': { unit: 'g', conversions: { 'cup': 90, 'ounce': 28.35 } },
  
  'flour': { unit: 'g', conversions: { 'cup': 120, 'ounce': 28.35 } },
  'sugar': { unit: 'g', conversions: { 'cup': 200, 'tablespoon': 12, 'ounce': 28.35 } },
  'brown sugar': { unit: 'g', conversions: { 'cup': 220, 'tablespoon': 14 } },
  
  'bread': { 
    unit: 'loaf',
    keepAsCount: true,
    conversions: { 'slice': 0.05 }, // 20 slices per loaf
    showBoth: true
  },
  
  // ============================================================================
  // OILS & CONDIMENTS  
  // ============================================================================
  'oil': { unit: 'ml', conversions: { 'tablespoon': 15, 'teaspoon': 5, 'cup': 240 } },
  'olive oil': { unit: 'ml', conversions: { 'tablespoon': 15, 'teaspoon': 5, 'cup': 240 } },
  'vegetable oil': { unit: 'ml', conversions: { 'tablespoon': 15, 'cup': 240 } },
  'sesame oil': { unit: 'ml', conversions: { 'tablespoon': 15, 'teaspoon': 5 } },
  
  'honey': { unit: 'g', conversions: { 'tablespoon': 21, 'cup': 340 } },
  'maple syrup': { unit: 'ml', conversions: { 'tablespoon': 15, 'cup': 240 } },
  
  'soy sauce': { unit: 'ml', conversions: { 'tablespoon': 15, 'teaspoon': 5 } },
  'vinegar': { unit: 'ml', conversions: { 'tablespoon': 15, 'cup': 240 } },
  'dressing': { unit: 'ml', conversions: { 'tablespoon': 15, 'cup': 240 } },
  'caesar dressing': { unit: 'ml', conversions: { 'tablespoon': 15 } },
  'ranch dressing': { unit: 'ml', conversions: { 'tablespoon': 15 } },
  
  // ============================================================================
  // PRODUCE (Count Items)
  // ============================================================================
  'onion': { unit: 'whole', keepAsCount: true },
  'tomato': { unit: 'whole', keepAsCount: true },
  'bell pepper': { unit: 'whole', keepAsCount: true },
  'potato': { unit: 'whole', keepAsCount: true },
  'carrot': { unit: 'whole', keepAsCount: true },
  'cucumber': { unit: 'whole', keepAsCount: true },
  'lemon': { unit: 'whole', keepAsCount: true },
  'lime': { unit: 'whole', keepAsCount: true },
  'garlic': { unit: 'whole', keepAsCount: true, note: 'whole bulbs' },
  'avocado': { unit: 'whole', keepAsCount: true },
  
  // Produce by head
  'lettuce': { unit: 'head', keepAsCount: true },
  'cabbage': { unit: 'head', keepAsCount: true },
  'broccoli': { unit: 'head', keepAsCount: true },
  'cauliflower': { unit: 'head', keepAsCount: true },
  
  // Produce by weight (leafy greens, etc.)
  'spinach': { unit: 'g', conversions: { 'cup': 30, 'ounce': 28.35, 'bunch': 340 } },
  'kale': { unit: 'g', conversions: { 'cup': 20, 'ounce': 28.35, 'bunch': 300 } },
  
  // ============================================================================
  // SNACKS & PACKAGED
  // ============================================================================
  'chips': { unit: 'g', conversions: { 'ounce': 28.35, 'bag': 200 } },
  'tortilla chips': { unit: 'g', conversions: { 'ounce': 28.35, 'bag': 200 } },
  'crackers': { unit: 'g', conversions: { 'ounce': 28.35 } },
  'granola': { unit: 'g', conversions: { 'cup': 120, 'ounce': 28.35 } },
  'nuts': { unit: 'g', conversions: { 'cup': 140, 'ounce': 28.35 } },
  
  // ============================================================================
  // CANNED/JARRED GOODS
  // ============================================================================
  'chickpeas': { unit: 'can', conversions: { 'can': 1, 'cup': 0.5 }, note: '400g cans' },
  'beans': { unit: 'can', conversions: { 'can': 1, 'cup': 0.5 }, note: '400g cans' },
  'tomato sauce': { unit: 'can', conversions: { 'can': 1, 'cup': 0.5 }, note: '400ml cans' },
  'diced tomatoes': { unit: 'can', conversions: { 'can': 1, 'cup': 0.5 }, note: '400g cans' }
};

/**
 * Convert any unit to metric
 * @param {number} quantity - Amount in original unit
 * @param {string} fromUnit - Original unit
 * @param {string} toUnit - Target metric unit (g, ml, whole, etc.)
 * @param {Object} conversions - Conversion ratios for this ingredient
 * @returns {number} Converted quantity
 */
export function convertToMetric(quantity, fromUnit, toUnit, conversions = {}) {
  const normalizedFrom = fromUnit.toLowerCase().trim();
  
  // Already metric or count
  if (['g', 'ml', 'kg', 'l', 'whole', 'head', 'bunch', 'can', 'loaf'].includes(normalizedFrom)) {
    return quantity;
  }
  
  // Convert using ingredient-specific conversions first
  if (conversions[normalizedFrom]) {
    return quantity * conversions[normalizedFrom];
  }
  
  // Fall back to standard conversions
  if (toUnit === 'g' && CONVERSIONS.weight[normalizedFrom]) {
    return quantity * CONVERSIONS.weight[normalizedFrom];
  }
  
  if (toUnit === 'ml' && CONVERSIONS.volume[normalizedFrom]) {
    return quantity * CONVERSIONS.volume[normalizedFrom];
  }
  
  // If no conversion found, return original
  console.warn(`No conversion found for ${fromUnit} to ${toUnit}`);
  return quantity;
}

/**
 * Get ingredient category for better grouping
 */
export function getIngredientCategory(name) {
  const normalized = name.toLowerCase();
  
  // Produce
  if (['lettuce', 'tomato', 'onion', 'pepper', 'cucumber', 'carrot', 
       'potato', 'broccoli', 'spinach', 'kale', 'cabbage'].some(v => normalized.includes(v))) {
    return 'produce';
  }
  
  // Meat
  if (['chicken', 'beef', 'pork', 'turkey', 'bacon', 'ham', 'salmon', 
       'tuna', 'shrimp', 'fish'].some(v => normalized.includes(v))) {
    return 'meat';
  }
  
  // Dairy
  if (['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'].some(v => normalized.includes(v))) {
    return 'dairy';
  }
  
  // Pantry
  return 'pantry';
}





