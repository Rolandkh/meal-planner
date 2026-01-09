/**
 * Diet Compass Scoring Engine
 * Calculates health scores for recipes across 4 key metrics
 * Based on "The Diet Compass" by Bas Kast
 * 
 * Metrics:
 * - Nutrient Density (0-100): Protective vs harmful foods
 * - Anti-Aging (0-100): mTOR, autophagy, inflammation
 * - Weight Loss (0-100): Glycemic impact, satiety, insulin
 * - Heart Health (0-100): Omega-3, healthy fats, blood pressure
 * - Overall (0-100): Weighted composite
 */

import { STORAGE_KEYS } from '../types/schemas.js';

// Metric weights for overall score
const METRIC_WEIGHTS = {
  nutrientDensity: 0.35,
  antiAging: 0.20,
  weightLoss: 0.20,
  heartHealth: 0.25
};

// Preparation terms to strip during ingredient normalization
const PREP_STOPWORDS = [
  'fresh', 'frozen', 'chopped', 'diced', 'sliced', 'minced',
  'grated', 'shredded', 'ground', 'whole', 'raw', 'cooked',
  'canned', 'dried', 'baby', 'large', 'small', 'medium'
];

/**
 * Normalize ingredient name for lookup
 * @param {string} rawName - Raw ingredient name
 * @returns {string} Normalized name
 */
function normalizeIngredientName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  
  let normalized = rawName.toLowerCase().trim();
  
  // Remove preparation terms
  for (const term of PREP_STOPWORDS) {
    normalized = normalized.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
  }
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Remove punctuation
  normalized = normalized.replace(/[,\.!?;:()]/g, '');
  
  return normalized;
}

/**
 * Get ingredient health data with fuzzy matching
 * @param {string} ingredientName - Ingredient name
 * @returns {Object|null} Health data or null
 */
export function getIngredientHealthData(ingredientName) {
  try {
    // Load ingredient health database from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.INGREDIENT_HEALTH);
    if (!stored) {
      console.warn('⚠️ Ingredient health data not loaded');
      return null;
    }

    const data = JSON.parse(stored);
    const ingredients = data.ingredients || {};
    
    // Normalize input
    const normalized = normalizeIngredientName(ingredientName);
    if (!normalized) return null;
    
    // Direct match
    if (ingredients[normalized]) {
      return ingredients[normalized];
    }
    
    // Try singular/plural variations
    const singular = normalized.endsWith('s') ? normalized.slice(0, -1) : normalized + 's';
    if (ingredients[singular]) {
      return ingredients[singular];
    }
    
    // Try matching last word (e.g., "baby spinach" → "spinach")
    const words = normalized.split(' ');
    if (words.length > 1) {
      const lastWord = words[words.length - 1];
      if (ingredients[lastWord]) {
        return ingredients[lastWord];
      }
    }
    
    // No match found
    return null;
    
  } catch (error) {
    console.error('Error getting ingredient health data:', error);
    return null;
  }
}

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate Diet Compass scores for a recipe
 * @param {Object} recipe - Recipe object with ingredients
 * @returns {Object} Scores object
 */
export function calculateRecipeScores(recipe) {
  // Default scores if recipe is invalid
  if (!recipe || !recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    return {
      overall: null,
      nutrientDensity: null,
      antiAging: null,
      weightLoss: null,
      heartHealth: null,
      breakdown: null
    };
  }

  // Initialize accumulators
  const agg = {
    nd: 0,  // Nutrient Density
    aa: 0,  // Anti-Aging
    wl: 0,  // Weight Loss
    hh: 0   // Heart Health
  };
  
  let totalWeight = 0;
  let hasData = false;
  const breakdown = {
    ingredientsScored: 0,
    ingredientsUnknown: 0,
    protectiveFoods: [],
    harmfulFoods: []
  };

  // Score each ingredient
  for (const ing of recipe.ingredients) {
    const healthData = getIngredientHealthData(ing.name);
    
    if (!healthData) {
      breakdown.ingredientsUnknown++;
      continue;
    }

    hasData = true;
    breakdown.ingredientsScored++;
    
    // Determine weight (prefer grams, fallback to count)
    const weight = (ing.quantity && ing.unit === 'g') ? ing.quantity : 1;
    totalWeight += weight;
    
    // Accumulate weighted points
    agg.nd += (healthData.nutrientDensityPoints || 0) * weight;
    agg.aa += (healthData.antiAgingPoints || 0) * weight;
    agg.wl += (healthData.weightLossPoints || 0) * weight;
    agg.hh += (healthData.heartHealthPoints || 0) * weight;
    
    // Track protective/harmful foods
    if (healthData.flags?.protectiveSuperfood) {
      breakdown.protectiveFoods.push(ing.name);
    }
    if (healthData.flags?.harmful) {
      breakdown.harmfulFoods.push(ing.name);
    }
  }

  // If no ingredients had health data, return null scores
  if (!hasData) {
    return {
      overall: null,
      nutrientDensity: null,
      antiAging: null,
      weightLoss: null,
      heartHealth: null,
      breakdown
    };
  }

  // Normalize by total weight
  const norm = totalWeight || 1;
  
  // Calculate individual metric scores (0-100)
  // Apply 2.5x scaling factor to bring scores into better range
  // (Base points of 15-35 * 2.5 = 37-87, which is more appropriate)
  const SCORE_SCALING = 2.5;
  const nd = clamp(Math.round((agg.nd / norm) * SCORE_SCALING), 0, 100);
  const aa = clamp(Math.round((agg.aa / norm) * SCORE_SCALING), 0, 100);
  const wl = clamp(Math.round((agg.wl / norm) * SCORE_SCALING), 0, 100);
  const hh = clamp(Math.round((agg.hh / norm) * SCORE_SCALING), 0, 100);
  
  // Calculate weighted overall score
  const overall = clamp(
    Math.round(
      nd * METRIC_WEIGHTS.nutrientDensity +
      aa * METRIC_WEIGHTS.antiAging +
      wl * METRIC_WEIGHTS.weightLoss +
      hh * METRIC_WEIGHTS.heartHealth
    ),
    0,
    100
  );

  return {
    overall,
    nutrientDensity: nd,
    antiAging: aa,
    weightLoss: wl,
    heartHealth: hh,
    breakdown
  };
}

/**
 * Convert score (0-100) to bar segments (1-5)
 * @param {number} score - Health score
 * @returns {number} Number of bars (1-5)
 */
export function scoreToBarSegments(score) {
  if (score == null || isNaN(score)) return 0;
  
  const clamped = clamp(score, 0, 100);
  
  if (clamped >= 80) return 5;
  if (clamped >= 60) return 4;
  if (clamped >= 40) return 3;
  if (clamped >= 20) return 2;
  return 1;
}

/**
 * Get qualitative rating from overall score
 * @param {number} score - Overall health score
 * @returns {string} Rating label
 */
export function getScoreRating(score) {
  if (score == null) return 'Not Rated';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Fair';
  return 'Poor';
}

/**
 * Classify ingredient health impact
 * @param {string} ingredientName
 * @returns {'protective'|'neutral'|'harmful'}
 */
export function classifyIngredientHealthImpact(ingredientName) {
  const healthData = getIngredientHealthData(ingredientName);
  
  if (!healthData) return 'neutral';
  
  // Check flags first
  if (healthData.flags?.protectiveSuperfood) return 'protective';
  if (healthData.flags?.harmful) return 'harmful';
  
  // Calculate average points
  const avg = (
    (healthData.nutrientDensityPoints || 0) +
    (healthData.antiAgingPoints || 0) +
    (healthData.weightLossPoints || 0) +
    (healthData.heartHealthPoints || 0)
  ) / 4;
  
  if (avg > 15) return 'protective';
  if (avg < -5) return 'harmful';
  return 'neutral';
}

/**
 * Debug recipe scoring with detailed breakdown
 * @param {Object} recipe - Recipe to analyze
 * @returns {Object} Score with detailed debug info
 */
export function debugRecipeScore(recipe) {
  console.log('\n=== DIET COMPASS SCORING DEBUG ===');
  console.log('Recipe:', recipe.name);
  console.log('Total ingredients:', recipe.ingredients?.length || 0);
  
  const agg = { nd: 0, aa: 0, wl: 0, hh: 0 };
  let totalWeight = 0;
  let scoredCount = 0;
  let unknownCount = 0;
  
  console.log('\nIngredient Analysis:');
  for (const ing of recipe.ingredients || []) {
    const healthData = getIngredientHealthData(ing.name);
    const weight = (ing.quantity && ing.unit === 'g') ? ing.quantity : 1;
    
    if (!healthData) {
      console.log(`  ❌ ${ing.name} (${ing.quantity} ${ing.unit}): NO DATA`);
      unknownCount++;
      continue;
    }
    
    console.log(`  ✅ ${ing.name} (weight: ${weight}):`, {
      nd: healthData.nutrientDensityPoints,
      aa: healthData.antiAgingPoints,
      wl: healthData.weightLossPoints,
      hh: healthData.heartHealthPoints
    });
    
    totalWeight += weight;
    scoredCount++;
    
    agg.nd += (healthData.nutrientDensityPoints || 0) * weight;
    agg.aa += (healthData.antiAgingPoints || 0) * weight;
    agg.wl += (healthData.weightLossPoints || 0) * weight;
    agg.hh += (healthData.heartHealthPoints || 0) * weight;
  }
  
  console.log('\nSummary:');
  console.log('  Ingredients scored:', scoredCount);
  console.log('  Ingredients unknown:', unknownCount);
  console.log('  Total weight:', totalWeight);
  console.log('  Raw totals:', agg);
  console.log('  Normalized (÷ weight):', {
    nd: (agg.nd / totalWeight).toFixed(2),
    aa: (agg.aa / totalWeight).toFixed(2),
    wl: (agg.wl / totalWeight).toFixed(2),
    hh: (agg.hh / totalWeight).toFixed(2)
  });
  
  const finalScore = calculateRecipeScores(recipe);
  console.log('  Final scores:', finalScore);
  console.log('================================\n');
  
  return finalScore;
}

/**
 * Get score color for UI display
 * @param {number} score
 * @returns {string} Tailwind color class
 */
export function getScoreColor(score) {
  if (score == null) return 'text-gray-400';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get bar fill color for UI display
 * @param {number} score
 * @returns {string} Tailwind bg color class
 */
export function getBarFillColor(score) {
  if (score == null) return 'bg-gray-300';
  if (score >= 60) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-orange-500';
}
