/**
 * Enhanced Ingredient Parsing Rules
 * 
 * Handles edge cases and vague descriptors found in recipe catalogs
 */

// Standard conversions for vague descriptors
export const VAGUE_QUANTITY_CONVERSIONS = {
  // Handful conversions (by ingredient type)
  'handful': {
    defaultGrams: 40,
    byType: {
      'leafy_greens': 35,      // Spinach, kale, lettuce
      'herbs': 10,             // Basil, parsley, cilantro
      'nuts': 25,              // Almonds, walnuts, cashews
      'berries': 80,           // Strawberries, blueberries
      'vegetables': 100,       // Onions, tomatoes, etc.
      'pasta': 60,             // Dry pasta
      'rice': 75               // Uncooked rice
    }
  },
  
  // Dash conversions
  'dash': {
    grams: 0.3,
    ml: 0.5,
    tsp: 0.08  // Less than 1/8 tsp
  },
  
  // Pinch conversions
  'pinch': {
    grams: 0.5,
    ml: 0.5,
    tsp: 0.125  // 1/8 tsp
  },
  
  // Smidgen (even smaller than pinch)
  'smidgen': {
    grams: 0.25,
    ml: 0.25,
    tsp: 0.06
  },
  
  // Sprig (for herbs)
  'sprig': {
    grams: 3,  // Average sprig of fresh herb
    note: 'Approximately 3g per sprig for most herbs'
  },
  
  // Leaf (for herbs/greens)
  'leaf': {
    byType: {
      'basil': 0.5,      // Basil leaf ~0.5g
      'mint': 0.3,       // Mint leaf ~0.3g
      'sage': 0.2,       // Sage leaf ~0.2g
      'bay': 0.3,        // Bay leaf ~0.3g
      'kale': 5,         // Kale leaf ~5g
      'lettuce': 8,      // Lettuce leaf ~8g
      'spinach': 2       // Spinach leaf ~2g
    },
    default: 2  // Default leaf weight
  },
  
  // Bunch (for herbs/vegetables)
  'bunch': {
    byType: {
      'herbs': 30,       // Fresh herb bunch ~30g
      'greens': 200,     // Leafy greens bunch ~200g
      'scallions': 150,  // Spring onions ~150g
      'carrots': 300     // Carrot bunch ~300g
    },
    default: 100
  }
};

// Common descriptors to strip (they don't affect matching)
export const DESCRIPTORS_TO_STRIP = [
  'fresh', 'dried', 'frozen', 'canned', 'jarred',
  'aged', 'mature', 'young', 'baby',
  'ripe', 'over-ripe', 'under-ripe',
  'raw', 'cooked', 'roasted', 'grilled',
  'organic', 'free-range', 'grass-fed',
  'extra virgin', 'virgin', 'pure',
  'unsalted', 'salted', 'sweetened', 'unsweetened',
  'whole', 'skim', 'low-fat', 'full-fat',
  'large', 'medium', 'small',
  'thick', 'thin',
  'quality', 'premium', 'gourmet'
];

// Common formatting errors to fix
export const FORMATTING_FIXES = [
  // Missing spaces before symbols
  { pattern: /(\w)&(\w)/g, replacement: '$1 & $2' },           // "basil&oregano" → "basil & oregano"
  { pattern: /(\w)\/(\w)/g, replacement: '$1 / $2' },          // "salt/pepper" → "salt / pepper"
  { pattern: /(\w),(\w)/g, replacement: '$1, $2' },            // "salt,pepper" → "salt, pepper"
  
  // Common spelling variations
  { pattern: /lasagna/gi, replacement: 'lasagne' },            // US → Italian
  { pattern: /flavor/gi, replacement: 'flavour' },             // US → AU
  { pattern: /cilantro/gi, replacement: 'coriander' },         // US → AU
  { pattern: /arugula/gi, replacement: 'rocket' },             // US → AU
  
  // Remove extra spaces
  { pattern: /\s+/g, replacement: ' ' },                        // Multiple spaces → single
  { pattern: /\s+,/g, replacement: ',' },                       // Space before comma
  { pattern: /\(\s+/g, replacement: '(' },                      // Space after (
  { pattern: /\s+\)/g, replacement: ')' },                      // Space before )
];

/**
 * Pre-process ingredient text to fix common formatting issues
 * @param {string} text - Raw ingredient text
 * @returns {string} Cleaned text
 */
export function preprocessIngredientText(text) {
  let cleaned = text;
  
  // Apply all formatting fixes
  for (const fix of FORMATTING_FIXES) {
    cleaned = cleaned.replace(fix.pattern, fix.replacement);
  }
  
  return cleaned.trim();
}

/**
 * Convert vague quantity to standard units
 * @param {string} vagueUnit - "handful", "dash", "pinch", etc.
 * @param {string} ingredientName - Name of ingredient for context
 * @returns {Object} {quantity: number, unit: string, conversionNote: string}
 */
export function convertVagueQuantity(vagueUnit, ingredientName) {
  const unit = vagueUnit.toLowerCase();
  const ingLower = ingredientName.toLowerCase();
  
  // Handful
  if (unit === 'handful' || unit === 'handfull') {
    // Determine ingredient type
    let grams = VAGUE_QUANTITY_CONVERSIONS.handful.defaultGrams;
    
    if (ingLower.includes('kale') || ingLower.includes('spinach') || ingLower.includes('lettuce')) {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.leafy_greens;
    } else if (ingLower.includes('basil') || ingLower.includes('parsley') || ingLower.includes('cilantro') || ingLower.includes('herb')) {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.herbs;
    } else if (ingLower.includes('nut') || ingLower.includes('almond') || ingLower.includes('walnut')) {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.nuts;
    } else if (ingLower.includes('berry') || ingLower.includes('berries')) {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.berries;
    } else if (ingLower.includes('pasta') || ingLower.includes('noodle')) {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.pasta;
    } else if (ingLower.includes('rice')) {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.rice;
    } else {
      grams = VAGUE_QUANTITY_CONVERSIONS.handful.byType.vegetables;
    }
    
    return {
      quantity: grams,
      unit: 'g',
      conversionNote: `~${grams}g (1 handful approximation)`,
      wasVague: true
    };
  }
  
  // Dash
  if (unit === 'dash') {
    return {
      quantity: VAGUE_QUANTITY_CONVERSIONS.dash.grams,
      unit: 'g',
      conversionNote: '~0.3g (less than 1/8 tsp)',
      wasVague: true
    };
  }
  
  // Pinch
  if (unit === 'pinch') {
    return {
      quantity: VAGUE_QUANTITY_CONVERSIONS.pinch.grams,
      unit: 'g',
      conversionNote: '~0.5g (1/8 tsp)',
      wasVague: true
    };
  }
  
  // Leaf/Leaves
  if (unit === 'leaf' || unit === 'leaves') {
    let gramsPerLeaf = VAGUE_QUANTITY_CONVERSIONS.leaf.default;
    
    // Check for specific herb/green
    for (const [herb, weight] of Object.entries(VAGUE_QUANTITY_CONVERSIONS.leaf.byType)) {
      if (ingLower.includes(herb)) {
        gramsPerLeaf = weight;
        break;
      }
    }
    
    return {
      quantity: gramsPerLeaf,
      unit: 'g',
      conversionNote: `~${gramsPerLeaf}g per leaf`,
      wasVague: true,
      isPerItem: true  // Flag that this is per leaf
    };
  }
  
  // Sprig
  if (unit === 'sprig' || unit === 'sprigs') {
    return {
      quantity: VAGUE_QUANTITY_CONVERSIONS.sprig.grams,
      unit: 'g',
      conversionNote: '~3g per sprig',
      wasVague: true,
      isPerItem: true
    };
  }
  
  // Serving (flag as invalid)
  if (unit === 'serving' || unit === 'servings') {
    return {
      quantity: null,
      unit: 'serving',
      conversionNote: 'Invalid - serving is context-dependent',
      wasVague: true,
      isInvalid: true
    };
  }
  
  return null;
}

/**
 * Strip descriptors from ingredient name for better matching
 * @param {string} ingredientName - Ingredient name with possible descriptors
 * @returns {string} Cleaned name
 */
export function stripDescriptors(ingredientName) {
  let cleaned = ingredientName;
  
  for (const descriptor of DESCRIPTORS_TO_STRIP) {
    // Remove descriptor as whole word
    const regex = new RegExp(`\\b${descriptor}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  
  // Clean up extra spaces
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Enhanced ingredient parsing with all improvements
 * @param {string} rawText - Raw ingredient text
 * @returns {Object} Enhanced parsed result
 */
export function enhancedParse(rawText) {
  // Step 1: Pre-process (fix formatting)
  let cleaned = preprocessIngredientText(rawText);
  
  // Step 2: Check for vague quantities
  const vaguePattern = /^(\d+(?:\.\d+)?)\s+(handful|dash|pinch|leaf|leaves|sprig|sprigs|serving|servings)\s+(.+)$/i;
  const vagueMatch = cleaned.match(vaguePattern);
  
  if (vagueMatch) {
    const [, quantity, vagueUnit, ingredientName] = vagueMatch;
    const conversion = convertVagueQuantity(vagueUnit, ingredientName);
    
    if (conversion && !conversion.isInvalid) {
      const finalQuantity = conversion.isPerItem 
        ? parseFloat(quantity) * conversion.quantity
        : conversion.quantity;
      
      return {
        quantity: finalQuantity,
        unit: conversion.unit,
        ingredientName: stripDescriptors(ingredientName),
        wasVague: true,
        originalUnit: vagueUnit,
        conversionNote: conversion.conversionNote
      };
    }
  }
  
  // Step 3: Strip descriptors for better matching
  const strippedName = stripDescriptors(cleaned);
  
  return {
    originalText: rawText,
    cleanedText: cleaned,
    strippedText: strippedName,
    wasVague: false
  };
}

export default {
  VAGUE_QUANTITY_CONVERSIONS,
  DESCRIPTORS_TO_STRIP,
  FORMATTING_FIXES,
  preprocessIngredientText,
  convertVagueQuantity,
  stripDescriptors,
  enhancedParse
};
