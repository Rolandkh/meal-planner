/**
 * Ingredient Matching Utilities
 * 
 * Implements multi-stage matching strategy:
 * 1. Exact ID/alias match
 * 2. Token-normalized match
 * 3. Fuzzy match (Levenshtein distance)
 * 4. State-aware disambiguation
 * 
 * Returns confidence scores for match quality
 */

import { getAllMasterIngredients } from './ingredientMaster.js';

// Stopwords to remove from token matching
const STOPWORDS = ['of', 'and', 'or', 'the', 'a', 'an', 'with', 'to'];

// Cache for preprocessed data (lazy-loaded on first use)
let aliasIndex = null;
let tokenIndex = null;
let ingredientMaster = null;

/**
 * Ensure indexes are built (lazy initialization)
 */
async function ensureIndexes() {
  if (aliasIndex && tokenIndex) return;
  
  const allIngredients = await getAllMasterIngredients();
  
  // Convert array to dictionary for backward compatibility
  ingredientMaster = {};
  for (const ing of allIngredients) {
    ingredientMaster[ing.id] = ing;
  }
  
  // Build alias index
  aliasIndex = new Map();
  for (const [id, ingredient] of Object.entries(ingredientMaster)) {
    // Index the ID itself
    aliasIndex.set(id.toLowerCase(), id);
    
    // Index all aliases
    if (ingredient.aliases) {
      for (const alias of ingredient.aliases) {
        aliasIndex.set(alias.toLowerCase(), id);
      }
    }
  }
  
  // Build token index
  tokenIndex = new Map();
  for (const [id, ingredient] of Object.entries(ingredientMaster)) {
    const tokens = new Set();
    
    // Tokenize display name
    ingredient.displayName.toLowerCase().split(' ').forEach(t => {
      if (!STOPWORDS.includes(t)) tokens.add(t);
    });
    
    // Tokenize all aliases
    if (ingredient.aliases) {
      for (const alias of ingredient.aliases) {
        alias.toLowerCase().split(' ').forEach(t => {
          if (!STOPWORDS.includes(t)) tokens.add(t);
        });
      }
    }
    
    tokenIndex.set(id, tokens);
  }
}

/**
 * Tokenize and normalize a string for matching
 * @param {string} text - Text to tokenize
 * @returns {Set<string>} Set of normalized tokens
 */
function tokenize(text) {
  const tokens = text
    .toLowerCase()
    .split(' ')
    .filter(t => t.length > 0 && !STOPWORDS.includes(t));
  
  return new Set(tokens);
}

/**
 * Calculate Jaccard similarity between two token sets
 * @param {Set<string>} set1 - First token set
 * @param {Set<string>} set2 - Second token set
 * @returns {number} Similarity score 0-1
 */
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Singularize simple English plurals
 * @param {string} word - Word to singularize
 * @returns {string} Singularized word
 */
function singularize(word) {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y'; // berries -> berry
  } else if (word.endsWith('oes')) {
    return word.slice(0, -2);        // tomatoes -> tomato
  } else if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);        // onions -> onion
  }
  return word;
}

/**
 * Match an ingredient identity to the master dictionary
 * @param {string} identityText - Normalized identity text (no prep terms)
 * @param {string} state - Product state ('fresh', 'frozen', etc.)
 * @returns {Promise<{masterId: string|null, confidence: number, matchedAlias?: string}>}
 */
export async function matchIngredient(identityText, state = 'fresh') {
  await ensureIndexes();
  
  if (!identityText) {
    return { masterId: null, confidence: 0 };
  }
  
  const normalized = identityText.toLowerCase().trim();
  
  // STAGE 1: Exact ID/alias match
  if (aliasIndex.has(normalized)) {
    const masterId = aliasIndex.get(normalized);
    const ingredient = ingredientMaster[masterId];
    
    // Prefer matches where state also matches
    if (ingredient.state === state) {
      return { masterId, confidence: 1.0, matchedAlias: normalized };
    } else {
      return { masterId, confidence: 0.95, matchedAlias: normalized };
    }
  }
  
  // Try singular form
  const singular = singularize(normalized);
  if (singular !== normalized && aliasIndex.has(singular)) {
    const masterId = aliasIndex.get(singular);
    const ingredient = ingredientMaster[masterId];
    
    if (ingredient.state === state) {
      return { masterId, confidence: 0.95, matchedAlias: singular };
    } else {
      return { masterId, confidence: 0.90, matchedAlias: singular };
    }
  }
  
  // STAGE 2: Token-normalized match (Jaccard similarity)
  const inputTokens = tokenize(normalized);
  let bestTokenMatch = { masterId: null, score: 0 };
  
  for (const [id, masterTokens] of tokenIndex.entries()) {
    const score = jaccardSimilarity(inputTokens, masterTokens);
    if (score > bestTokenMatch.score) {
      bestTokenMatch = { masterId: id, score };
    }
  }
  
  if (bestTokenMatch.score >= 0.6) {
    const ingredient = ingredientMaster[bestTokenMatch.masterId];
    
    // State bonus/penalty
    let confidence = bestTokenMatch.score;
    if (ingredient.state === state) {
      confidence = Math.min(1.0, confidence + 0.1);
    } else {
      confidence = confidence * 0.9;
    }
    
    return { 
      masterId: bestTokenMatch.masterId, 
      confidence,
      matchedAlias: `token_match (${bestTokenMatch.score.toFixed(2)})`
    };
  }
  
  // STAGE 3: Fuzzy match (Levenshtein distance)
  let bestFuzzy = { masterId: null, distance: Infinity, alias: null };
  
  for (const [alias, masterId] of aliasIndex.entries()) {
    const distance = levenshteinDistance(normalized, alias);
    if (distance < bestFuzzy.distance) {
      bestFuzzy = { masterId, distance, alias };
    }
  }
  
  // Accept fuzzy match if distance is small relative to string length
  const maxDistance = Math.max(2, Math.floor(normalized.length * 0.2));
  
  if (bestFuzzy.distance <= maxDistance) {
    const ingredient = ingredientMaster[bestFuzzy.masterId];
    let confidence = 1.0 - (bestFuzzy.distance / normalized.length);
    
    // State bonus/penalty
    if (ingredient.state === state) {
      confidence = Math.min(1.0, confidence + 0.05);
    }
    
    return {
      masterId: bestFuzzy.masterId,
      confidence: Math.max(0.5, confidence),
      matchedAlias: `fuzzy_match: "${bestFuzzy.alias}" (distance: ${bestFuzzy.distance})`
    };
  }
  
  // STAGE 4: No match found
  return { masterId: null, confidence: 0 };
}

/**
 * Batch match multiple ingredients
 * @param {Array<{identityText: string, state: string}>} ingredients - Ingredients to match
 * @returns {Promise<Array>} Array of match results
 */
export async function batchMatchIngredients(ingredients) {
  await ensureIndexes();
  
  return Promise.all(ingredients.map(async ing => ({
    input: ing.identityText,
    state: ing.state,
    ...await matchIngredient(ing.identityText, ing.state)
  })));
}

/**
 * Get match statistics for diagnostics
 * @param {Array} matches - Array of match results
 * @returns {Object} Statistics
 */
export function getMatchStats(matches) {
  const matched = matches.filter(m => m.masterId !== null);
  const highConfidence = matched.filter(m => m.confidence >= 0.9);
  const mediumConfidence = matched.filter(m => m.confidence >= 0.7 && m.confidence < 0.9);
  const lowConfidence = matched.filter(m => m.confidence < 0.7 && m.confidence > 0);
  
  return {
    total: matches.length,
    matched: matched.length,
    unmatched: matches.length - matched.length,
    matchRate: (matched.length / matches.length * 100).toFixed(1) + '%',
    highConfidence: highConfidence.length,
    mediumConfidence: mediumConfidence.length,
    lowConfidence: lowConfidence.length
  };
}

export default {
  matchIngredient,
  batchMatchIngredients,
  getMatchStats
};
