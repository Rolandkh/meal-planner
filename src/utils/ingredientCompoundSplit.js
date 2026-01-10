/**
 * Compound Ingredient Splitting Utility
 * 
 * Detects and splits compound ingredient strings like:
 * - "salt and pepper" → ["salt", "pepper"]
 * - "onion & garlic" → ["onion", "garlic"]
 * - "carrots, peas and corn" → ["carrots", "peas", "corn"]
 * 
 * IMPORTANT: Does NOT split product names like "sweet and sour sauce"
 */

// Connectors that indicate a compound ingredient
const CONNECTORS = {
  and: ['and', '&', 'plus'],
  or: ['or'],
  with: ['with'],
  comma: [',', ';']
};

// Product keywords that indicate a single item (NOT compound)
const PRODUCT_KEYWORDS = [
  // Sauces & condiments
  'sauce', 'dressing', 'marinade', 'glaze', 'syrup',
  
  // Mixed products
  'mix', 'blend', 'mixture', 'combination',
  
  // Desserts & treats
  'cream', 'ice', 'cookie', 'cake', 'pie',
  
  // Descriptive phrases
  'sweet and sour', 'cookies and cream', 'mac and cheese',
  'beans and franks', 'pork and beans', 'fish and chips'
];

// Common prep terms to remove before splitting
const PREP_TERMS = [
  'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded',
  'crushed', 'ground', 'peeled', 'trimmed', 'fresh', 'dried'
];

/**
 * Clean a text string for analysis
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Check if text contains a product keyword (single item)
 * @param {string} text - Cleaned text
 * @returns {boolean} True if product name detected
 */
function isProductName(text) {
  return PRODUCT_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Detect if string contains compound connectors
 * @param {string} text - Cleaned text
 * @returns {{hasConnector: boolean, connectorType: string|null}}
 */
function detectConnectors(text) {
  for (const [type, connectors] of Object.entries(CONNECTORS)) {
    for (const connector of connectors) {
      // For word connectors, ensure word boundaries
      if (connector.length > 1) {
        const regex = new RegExp(`\\b${connector}\\b`, 'i');
        if (regex.test(text)) {
          return { hasConnector: true, connectorType: type };
        }
      } else {
        // For punctuation, check directly
        if (text.includes(connector)) {
          return { hasConnector: true, connectorType: type };
        }
      }
    }
  }
  
  return { hasConnector: false, connectorType: null };
}

/**
 * Split text by detected connector
 * @param {string} text - Cleaned text
 * @param {string} connectorType - Type of connector detected
 * @returns {string[]} Array of component strings
 */
function splitByConnector(text, connectorType) {
  let parts = [];
  
  // Handle comma + and pattern specially (e.g., "A, B and C")
  if (text.includes(',') && /\s+and\s+/i.test(text)) {
    // Split by both comma and "and"
    parts = text.split(/\s*[,;]\s*|\s+and\s+/i);
  } else {
    switch (connectorType) {
      case 'and':
        // Split by "and", "&", "plus"
        parts = text.split(/\s+(?:and|&|plus)\s+/i);
        break;
        
      case 'or':
        // Split by "or"
        parts = text.split(/\s+or\s+/i);
        break;
        
      case 'with':
        // Split by "with"
        parts = text.split(/\s+with\s+/i);
        break;
        
      case 'comma':
        // Split by comma or semicolon
        parts = text.split(/\s*[,;]\s+/);
        break;
    }
  }
  
  // Clean up parts
  return parts
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .filter(p => !PREP_TERMS.includes(p)); // Remove standalone prep terms
}

/**
 * Validate that components look like reasonable ingredients
 * @param {string[]} components - Potential ingredient components
 * @returns {boolean} True if components seem valid
 */
function validateComponents(components) {
  // Must have at least 2 components
  if (components.length < 2) {
    return false;
  }
  
  // Each component should have at least 2 characters
  if (components.some(c => c.length < 2)) {
    return false;
  }
  
  // No component should be only numbers
  if (components.some(c => /^\d+$/.test(c))) {
    return false;
  }
  
  // At least one component should have letters
  if (!components.some(c => /[a-z]/i.test(c))) {
    return false;
  }
  
  return true;
}

/**
 * Split a compound ingredient string into components
 * @param {string} rawText - Raw ingredient string (e.g., "salt and pepper")
 * @returns {{
 *   isCompound: boolean,
 *   components: string[]|null,
 *   connectorType: string|null,
 *   raw: string
 * }}
 */
export function splitCompoundIngredient(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isCompound: false,
      components: null,
      connectorType: null,
      raw: rawText || ''
    };
  }
  
  const cleaned = cleanText(rawText);
  
  // Quick exit: too short to be compound
  if (cleaned.length < 5) {
    return {
      isCompound: false,
      components: null,
      connectorType: null,
      raw: rawText
    };
  }
  
  // Check if it's a product name (single item despite connector)
  if (isProductName(cleaned)) {
    return {
      isCompound: false,
      components: null,
      connectorType: null,
      raw: rawText
    };
  }
  
  // Detect connectors
  const { hasConnector, connectorType } = detectConnectors(cleaned);
  
  if (!hasConnector) {
    return {
      isCompound: false,
      components: null,
      connectorType: null,
      raw: rawText
    };
  }
  
  // Split by connector
  const components = splitByConnector(cleaned, connectorType);
  
  // Validate components
  if (!validateComponents(components)) {
    return {
      isCompound: false,
      components: null,
      connectorType: null,
      raw: rawText
    };
  }
  
  // Success - this is a valid compound ingredient
  return {
    isCompound: true,
    components,
    connectorType,
    raw: rawText
  };
}

/**
 * Test if a string is a compound ingredient (quick check)
 * @param {string} text - Text to test
 * @returns {boolean} True if compound
 */
export function isCompoundIngredient(text) {
  const result = splitCompoundIngredient(text);
  return result.isCompound;
}

/**
 * Batch split multiple ingredient strings
 * @param {string[]} ingredients - Array of ingredient strings
 * @returns {Array} Array of split results
 */
export function batchSplitCompounds(ingredients) {
  return ingredients.map(ing => splitCompoundIngredient(ing));
}

/**
 * Get statistics on compound detection
 * @param {string[]} ingredients - Array of ingredient strings
 * @returns {Object} Statistics
 */
export function getCompoundStats(ingredients) {
  const results = batchSplitCompounds(ingredients);
  const compounds = results.filter(r => r.isCompound);
  
  const byConnectorType = {};
  compounds.forEach(c => {
    byConnectorType[c.connectorType] = (byConnectorType[c.connectorType] || 0) + 1;
  });
  
  return {
    total: ingredients.length,
    compounds: compounds.length,
    simple: results.length - compounds.length,
    compoundRate: (compounds.length / ingredients.length * 100).toFixed(1) + '%',
    byConnectorType,
    examples: compounds.slice(0, 10).map(c => ({
      raw: c.raw,
      components: c.components,
      connectorType: c.connectorType
    }))
  };
}

export default {
  splitCompoundIngredient,
  isCompoundIngredient,
  batchSplitCompounds,
  getCompoundStats
};
