/**
 * Ingredient Parsing Utilities
 * 
 * Parses raw ingredient strings into structured components:
 * - Quantity (numeric)
 * - Unit (normalized)
 * - Identity (what you buy)
 * - State (fresh/frozen/canned/dried)
 * - Preparation (what you do - chopped/diced/etc)
 * 
 * CRITICAL: Preparation terms are instructions, NOT shopping list items!
 */

import { ingredientMaster } from './ingredientMaster.js';

// Build state lookup from master dictionary (cached at module load)
const STATE_LOOKUP = new Map();
if (ingredientMaster) {
  Object.entries(ingredientMaster).forEach(([id, ing]) => {
    // Add ID
    STATE_LOOKUP.set(id.replace(/_/g, ' '), ing.state);
    STATE_LOOKUP.set(id, ing.state);
    
    // Add all aliases
    if (ing.aliases) {
      ing.aliases.forEach(alias => {
        STATE_LOOKUP.set(alias.toLowerCase(), ing.state);
      });
    }
  });
}

console.log(`📚 Ingredient parser loaded with ${STATE_LOOKUP.size} state mappings from dictionary`);

// Preparation keywords (instructions, NOT identity)
export const PREPARATION_KEYWORDS = [
  'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded',
  'crushed', 'ground', 'peeled', 'trimmed', 'halved', 'quartered',
  'finely', 'roughly', 'coarsely', 'thinly', 'thickly',
  'julienned', 'cubed', 'mashed', 'pureed', 'crumbled'
];

// State keywords (product identity modifiers)
export const STATE_KEYWORDS = {
  fresh: ['fresh', 'raw'],
  frozen: ['frozen'],
  canned: ['canned', 'tinned', 'in can'],
  dried: ['dried', 'dehydrated', 'dry'],
  other: ['jarred', 'bottled', 'pickled', 'smoked', 'cured']
};

// Quality/size descriptors to remove (not identity)
const QUALITY_DESCRIPTORS = [
  'large', 'small', 'medium', 'extra', 'jumbo', 'baby',
  'ripe', 'firm', 'soft', 'tender', 'young',
  'organic', 'free-range', 'grass-fed', 'wild-caught'
];

// Noise words to remove (packaging/misc)
const NOISE_WORDS = ['can', 'of'];

// Unit normalization map
export const UNIT_ALIASES = {
  // Volume
  'cup': ['cup', 'cups', 'c'],
  'tbsp': ['tbsp', 'tbsps', 'tablespoon', 'tablespoons', 'tbs'],
  'tsp': ['tsp', 'tsps', 'teaspoon', 'teaspoons'],
  'ml': ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'],
  'l': ['l', 'liter', 'liters', 'litre', 'litres'],
  
  // Weight
  'g': ['g', 'gram', 'grams'],
  'kg': ['kg', 'kilogram', 'kilograms'],
  'oz': ['oz', 'ounce', 'ounces'],
  'lb': ['lb', 'lbs', 'pound', 'pounds'],
  
  // Count
  'whole': ['whole', 'piece', 'pieces', 'clove', 'cloves', 'head', 'heads', 
            'bunch', 'bunches', 'stalk', 'stalks', 'sprig', 'sprigs',
            'leaf', 'leaves', 'pinch', 'dash']
};

/**
 * Convert vulgar fractions and mixed numbers to decimals
 * @param {string} text - Text potentially containing fractions
 * @returns {string} Text with fractions converted to decimals
 */
function convertFractionsToDecimals(text) {
  const vulgarFractions = {
    '½': '0.5',
    '⅓': '0.333',
    '⅔': '0.667',
    '¼': '0.25',
    '¾': '0.75',
    '⅕': '0.2',
    '⅖': '0.4',
    '⅗': '0.6',
    '⅘': '0.8',
    '⅙': '0.167',
    '⅚': '0.833',
    '⅛': '0.125',
    '⅜': '0.375',
    '⅝': '0.625',
    '⅞': '0.875'
  };
  
  let result = text;
  
  // Replace vulgar fractions
  for (const [vulgar, decimal] of Object.entries(vulgarFractions)) {
    result = result.replace(new RegExp(vulgar, 'g'), decimal);
  }
  
  // Convert "1 1/2" to "1.5"
  result = result.replace(/(\d+)\s+(\d+)\/(\d+)/g, (match, whole, num, denom) => {
    return (parseFloat(whole) + parseFloat(num) / parseFloat(denom)).toString();
  });
  
  // Convert "1/2" to "0.5"
  result = result.replace(/(\d+)\/(\d+)/g, (match, num, denom) => {
    return (parseFloat(num) / parseFloat(denom)).toString();
  });
  
  return result;
}

/**
 * Normalize unit string to canonical form
 * @param {string} unit - Raw unit string
 * @returns {string|null} Canonical unit or null
 */
function normalizeUnit(unit) {
  if (!unit) return null;
  
  const lower = unit.toLowerCase().trim();
  
  for (const [canonical, variants] of Object.entries(UNIT_ALIASES)) {
    if (variants.includes(lower)) {
      return canonical;
    }
  }
  
  return lower; // Return as-is if not recognized
}

/**
 * Extract quantity and unit from beginning of text
 * @param {string} text - Ingredient text
 * @returns {{quantity: number|null, unit: string|null, remaining: string}}
 */
function extractQuantityAndUnit(text) {
  // Match patterns like:
  // "1 cup", "2.5 tbsp", "½ tsp", "1 1/2 cups", "150g", "2 cloves"
  const quantityUnitPattern = /^([\d\.\s\/]+)\s*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|milliliters?|l|liters?|whole|cloves?|bunch|head|stalk|sprig|pinch|dash)?\b/i;
  
  const match = text.match(quantityUnitPattern);
  
  if (!match) {
    return { quantity: null, unit: null, remaining: text };
  }
  
  const quantityStr = match[1].trim();
  const unitStr = match[2] || null;
  const remaining = text.slice(match[0].length).trim();
  
  // Parse quantity
  let quantity = null;
  try {
    quantity = parseFloat(quantityStr);
    if (isNaN(quantity)) quantity = null;
  } catch (e) {
    quantity = null;
  }
  
  const unit = normalizeUnit(unitStr);
  
  return { quantity, unit, remaining };
}

/**
 * Classify tokens into identity, state, and preparation
 * @param {string[]} tokens - Array of word tokens
 * @returns {{identity: string[], state: string, preparation: string[]}}
 */
function classifyTokens(tokens) {
  const identityTokens = [];
  const preparationTokens = [];
  let state = null; // will be determined
  
  for (const token of tokens) {
    const lower = token.toLowerCase();
    
    // Check if it's a preparation term
    if (PREPARATION_KEYWORDS.includes(lower)) {
      preparationTokens.push(lower);
      continue;
    }
    
    // Check if it's a state term
    let isState = false;
    for (const [stateType, keywords] of Object.entries(STATE_KEYWORDS)) {
      if (keywords.includes(lower)) {
        state = stateType;
        // Keep state words in identity for canned/frozen/dried products
        if (stateType !== 'fresh') {
          identityTokens.push(lower);
        }
        isState = true;
        break;
      }
    }
    
    if (isState) continue;
    
    // Check if it's a quality descriptor (remove)
    if (QUALITY_DESCRIPTORS.includes(lower)) {
      continue;
    }
    
    // Check if it's a noise word (remove)
    if (NOISE_WORDS.includes(lower)) {
      continue;
    }
    
    // Otherwise, it's part of the identity
    identityTokens.push(lower);
  }
  
  // Determine final state if not set
  if (state === null) {
    const identityStr = identityTokens.join(' ');
    
    // First, try exact lookup from dictionary
    if (STATE_LOOKUP.has(identityStr)) {
      state = STATE_LOOKUP.get(identityStr);
    } 
    // Try with underscores (for compound names)
    else if (STATE_LOOKUP.has(identityStr.replace(/ /g, '_'))) {
      state = STATE_LOOKUP.get(identityStr.replace(/ /g, '_'));
    }
    // Fallback to keyword-based detection
    else {
      // Keyword patterns for state detection
      const pantryKeywords = ['oil', 'sauce', 'vinegar', 'syrup', 'paste',
                               'flour', 'sugar', 'rice', 'pasta', 'quinoa',
                               'broth', 'stock', 'bread', 'noodle'];
      
      const hasPantryKeyword = pantryKeywords.some(keyword => identityStr.includes(keyword));
      state = hasPantryKeyword ? 'other' : 'fresh';
    }
  }
  
  return { identity: identityTokens, state, preparation: preparationTokens };
}

/**
 * Parse a raw ingredient string into structured components
 * @param {string} rawText - Raw ingredient text (e.g., "1 cup chopped onion")
 * @returns {Object} Parsed ingredient object
 */
export function parseIngredient(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      raw: '',
      quantity: null,
      unit: null,
      identityText: '',
      state: 'other',
      preparation: []
    };
  }
  
  // Convert fractions to decimals
  const textWithDecimals = convertFractionsToDecimals(rawText);
  
  // Extract quantity and unit
  const { quantity, unit, remaining } = extractQuantityAndUnit(textWithDecimals);
  
  // Clean remaining text
  let cleanText = remaining
    .replace(/[,;()]/g, ' ')           // Remove punctuation
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .trim();
  
  // Split into tokens
  const tokens = cleanText.split(' ').filter(t => t.length > 0);
  
  // Classify tokens
  const { identity, state, preparation } = classifyTokens(tokens);
  
  // Build identity text (what you actually buy)
  const identityText = identity.join(' ');
  
  return {
    raw: rawText,
    quantity,
    unit,
    identityText,
    state,
    preparation
  };
}

/**
 * Helper: Extract just the identity and preparation from tokens
 * (Exposed for testing)
 */
export function extractIdentityAndPreparation(tokens) {
  return classifyTokens(tokens);
}

export default {
  parseIngredient,
  extractIdentityAndPreparation,
  PREPARATION_KEYWORDS,
  STATE_KEYWORDS,
  UNIT_ALIASES
};
