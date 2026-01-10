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

import { getAllMasterIngredients } from './ingredientMaster.js';

// Build state lookup from master dictionary (lazy-loaded on first use)
let STATE_LOOKUP = null;

async function ensureStateLookup() {
  if (STATE_LOOKUP) return STATE_LOOKUP;
  
  STATE_LOOKUP = new Map();
  const allIngredients = await getAllMasterIngredients();
  
  for (const ing of allIngredients) {
    const id = ing.id;
    // Add ID
    STATE_LOOKUP.set(id.replace(/_/g, ' '), ing.state);
    STATE_LOOKUP.set(id, ing.state);
    
    // Add all aliases
    if (ing.aliases) {
      ing.aliases.forEach(alias => {
        STATE_LOOKUP.set(alias.toLowerCase(), ing.state);
      });
    }
  }
  
  console.log(`📚 Ingredient parser loaded with ${STATE_LOOKUP.size} state mappings from dictionary`);
  return STATE_LOOKUP;
}

// Preparation keywords (instructions, NOT identity)
export const PREPARATION_KEYWORDS = [
  'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded',
  'crushed', 'ground', 'peeled', 'trimmed', 'halved', 'quartered',
  'finely', 'roughly', 'coarsely', 'thinly', 'thickly',
  'julienned', 'cubed', 'mashed', 'pureed', 'crumbled',
  'poached', 'roasted', 'grilled', 'baked', 'fried', 'boiled', 'steamed',
  'blanched', 'sauteed', 'braised', 'stewed'
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
  'ripe', 'firm', 'soft', 'tender', 'young', 'over-ripe', 'under-ripe',
  'organic', 'free-range', 'grass-fed', 'wild-caught',
  'aged', 'mature', 'premium', 'quality'
];

// Noise words to remove (packaging/misc)
const NOISE_WORDS = ['can', 'of', 'servings', 'serving', 'size', 'cube', 'equivalent', 'amount', 
                     'sheets', 'sheet', 'san', 'marzano', 'or', 'pkg', 'pkt', 'package',
                     'head', 'bunch', 'bag', 'several', 'sprinkle', 'remove', 'steam'];

// Vague quantity unit conversions (grams)
const VAGUE_UNITS_TO_GRAMS = {
  'handful': 80,      // Average handful ~80g
  'dash': 0.3,        // Less than 1/8 tsp
  'pinch': 0.5,       // 1/8 tsp
  'smidgen': 0.25,    // Even smaller
  'sprig': 3,         // Fresh herb sprig
  'leaf': 2,          // Average leaf (varies by herb)
  'bunch': 100        // Average bunch
};

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
            'bunch', 'bunches', 'stalk', 'stalks'],
  
  // Vague units (will be converted to grams)
  'handful': ['handful', 'handfull', 'handfulls'],
  'sprig': ['sprig', 'sprigs'],
  'leaf': ['leaf', 'leaves'],
  'dash': ['dash'],
  'pinch': ['pinch', 'pinches']
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
  // ENHANCED: Now includes "handful", "leaf/leaves", "sprig/sprigs"
  const quantityUnitPattern = /^([\d\.\s\/]+)\s*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|milliliters?|l|liters?|whole|cloves?|bunch|head|stalk|sprigs?|pinch|dash|handfull?s?|lea(?:f|ves))?\b/i;
  
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
 * @returns {Promise<{identity: string[], state: string, preparation: string[]}>}
 */
async function classifyTokens(tokens) {
  await ensureStateLookup();
  
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
 * @returns {Promise<Object>} Parsed ingredient object
 */
export async function parseIngredient(rawText) {
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
  
  // PRE-PROCESS: Fix formatting errors
  let preprocessed = rawText;
  preprocessed = preprocessed.replace(/&/g, ' and ');            // Fix "basil& oregano" → "basil and oregano"
  preprocessed = preprocessed.replace(/\bover-ripe\b/gi, '');    // Remove "over-ripe"
  preprocessed = preprocessed.replace(/\baged\b/gi, '');         // Remove "aged"
  preprocessed = preprocessed.replace(/\bsan marzano\b/gi, '');  // Remove brand name
  preprocessed = preprocessed.trim();
  
  // Convert fractions to decimals
  const textWithDecimals = convertFractionsToDecimals(preprocessed);
  
  // Extract quantity and unit
  let { quantity, unit, remaining } = extractQuantityAndUnit(textWithDecimals);
  
  // Clean remaining text
  let cleanText = remaining
    .replace(/[,;()]/g, ' ')           // Remove punctuation
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .trim();
  
  // Split into tokens
  const tokens = cleanText.split(' ').filter(t => t.length > 0);
  
  // Classify tokens
  const { identity, state, preparation } = await classifyTokens(tokens);
  
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
export async function extractIdentityAndPreparation(tokens) {
  return await classifyTokens(tokens);
}

export default {
  parseIngredient,
  extractIdentityAndPreparation,
  PREPARATION_KEYWORDS,
  STATE_KEYWORDS,
  UNIT_ALIASES
};
