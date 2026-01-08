/**
 * Spoonacular to Internal Recipe Schema Mapper
 * Transforms Spoonacular API data into our internal Recipe format
 */

import { classifyIngredientHealthImpact } from './dietCompassScoring.js';

/**
 * Map Spoonacular recipe to internal Recipe schema
 * @param {Object} spRecipe - Spoonacular recipe object
 * @returns {Object} Internal Recipe object
 */
export function mapSpoonacularToRecipe(spRecipe) {
  const recipeId = `recipe_${crypto.randomUUID()}`;
  
  return {
    _schemaVersion: 2,
    recipeId,
    name: spRecipe.title || 'Untitled Recipe',
    
    // Source & IDs
    source: 'spoonacular',
    spoonacularId: spRecipe.id,
    imageUrl: spRecipe.image || null,  // Original Spoonacular URL
    image: spRecipe.image ? `/images/recipes/${spRecipe.id}.jpg` : null,  // Local path (will be set after download)
    
    // Ingredients
    ingredients: mapIngredients(spRecipe.extendedIngredients || []),
    
    // Instructions
    instructions: mapInstructions(spRecipe.analyzedInstructions || spRecipe.instructions),
    
    // Times
    prepTime: spRecipe.preparationMinutes || Math.round((spRecipe.readyInMinutes || 30) * 0.3),
    cookTime: spRecipe.cookingMinutes || Math.round((spRecipe.readyInMinutes || 30) * 0.7),
    servings: spRecipe.servings || 4,
    
    // Nutrition
    nutrition: mapNutrition(spRecipe.nutrition),
    
    // Tags
    tags: mapTags(spRecipe),
    
    // Relationships (default)
    parentRecipeId: null,
    childRecipeIds: [],
    variationNote: null,
    
    // Diet Compass scores (will be calculated after ingredient health impact is set)
    dietCompassScores: null,
    
    // User data
    isFavorite: false,
    rating: null,
    timesCooked: 0,
    lastCooked: null,
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Map Spoonacular ingredients to internal format
 * @param {Array} spIngredients
 * @returns {Array}
 */
function mapIngredients(spIngredients) {
  return spIngredients.map(ing => ({
    name: ing.name || ing.originalName || 'Unknown',
    quantity: ing.amount || ing.measures?.metric?.amount || 0,
    unit: ing.unit || ing.measures?.metric?.unitShort || '',
    category: mapIngredientCategory(ing.aisle),
    healthImpact: classifyIngredientHealthImpact(ing.name || ing.originalName)
  }));
}

/**
 * Map Spoonacular aisle to our category
 * @param {string} aisle
 * @returns {string}
 */
function mapIngredientCategory(aisle) {
  if (!aisle) return 'other';
  
  const lower = aisle.toLowerCase();
  
  if (lower.includes('produce') || lower.includes('vegetable') || lower.includes('fruit')) return 'produce';
  if (lower.includes('meat') || lower.includes('seafood') || lower.includes('poultry')) return 'meat';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese')) return 'dairy';
  if (lower.includes('baking') || lower.includes('spice') || lower.includes('condiment') || lower.includes('oil')) return 'pantry';
  
  return 'other';
}

/**
 * Map Spoonacular instructions to text
 * @param {Array|string} instructions
 * @returns {string}
 */
function mapInstructions(instructions) {
  if (typeof instructions === 'string') {
    return instructions;
  }

  if (Array.isArray(instructions) && instructions.length > 0) {
    // analyzedInstructions format
    const steps = instructions[0]?.steps || [];
    return steps.map((step, i) => `${i + 1}. ${step.step}`).join('\n\n');
  }

  return 'No instructions available';
}

/**
 * Map Spoonacular nutrition data
 * @param {Object} nutrition
 * @returns {Object|null}
 */
function mapNutrition(nutrition) {
  if (!nutrition || !nutrition.nutrients) return null;

  const nutrients = nutrition.nutrients;
  const find = (name) => nutrients.find(n => n.name === name)?.amount || 0;

  return {
    calories: find('Calories'),
    protein: find('Protein'),
    fat: find('Fat'),
    carbs: find('Carbohydrates'),
    fiber: find('Fiber'),
    sugar: find('Sugar'),
    saturatedFat: find('Saturated Fat'),
    omega3: 0,  // Not always available
    omega6: 0,  // Not always available
    sodium: find('Sodium'),
    cholesterol: find('Cholesterol'),
    vitaminA: find('Vitamin A'),
    vitaminC: find('Vitamin C'),
    calcium: find('Calcium'),
    iron: find('Iron')
  };
}

/**
 * Map Spoonacular properties to internal tags
 * @param {Object} spRecipe
 * @returns {Object}
 */
function mapTags(spRecipe) {
  return {
    cuisines: spRecipe.cuisines || [],
    diets: spRecipe.diets || [],
    dishTypes: spRecipe.dishTypes || [],
    mealSlots: deriveMealSlots(spRecipe.dishTypes),
    proteinSources: deriveProteinSources(spRecipe.extendedIngredients),
    cookingMethods: deriveCookingMethods(spRecipe.dishTypes),
    carbBases: deriveCarbBases(spRecipe.extendedIngredients),
    effortLevel: deriveEffortLevel(spRecipe.readyInMinutes, spRecipe.analyzedInstructions),
    spiceLevel: deriveSpiceLevel(spRecipe.cuisines),
    budgetTier: 'moderate',  // Default
    kidFriendly: spRecipe.veryPopular || false,
    makeAhead: deriveMakeAhead(spRecipe.dishTypes),
    protectiveFoods: []  // Will be filled by Diet Compass scoring
  };
}

/**
 * Derive meal slots from dish types
 * @param {Array} dishTypes
 * @returns {Array}
 */
function deriveMealSlots(dishTypes = []) {
  const slots = [];
  const types = dishTypes.map(d => d.toLowerCase());
  
  if (types.some(t => t.includes('breakfast') || t.includes('brunch'))) slots.push('breakfast');
  if (types.some(t => t.includes('lunch') || t.includes('main') || t.includes('dinner'))) slots.push('lunch', 'dinner');
  if (types.some(t => t.includes('snack') || t.includes('appetizer'))) slots.push('snack');
  
  // Default to lunch/dinner if unclear
  if (slots.length === 0) slots.push('lunch', 'dinner');
  
  return [...new Set(slots)];
}

/**
 * Derive protein sources from ingredients
 * @param {Array} ingredients
 * @returns {Array}
 */
function deriveProteinSources(ingredients = []) {
  const proteins = [];
  const names = ingredients.map(i => (i.name || '').toLowerCase());
  
  if (names.some(n => n.includes('chicken'))) proteins.push('chicken');
  if (names.some(n => n.includes('beef'))) proteins.push('beef');
  if (names.some(n => n.includes('pork'))) proteins.push('pork');
  if (names.some(n => n.includes('fish') || n.includes('salmon') || n.includes('tuna'))) proteins.push('fish');
  if (names.some(n => n.includes('tofu') || n.includes('tempeh'))) proteins.push('tofu');
  if (names.some(n => n.includes('beans') || n.includes('lentils') || n.includes('chickpeas'))) proteins.push('legumes');
  if (names.some(n => n.includes('egg'))) proteins.push('eggs');
  
  return proteins;
}

/**
 * Derive cooking methods
 * @param {Array} dishTypes
 * @returns {Array}
 */
function deriveCookingMethods(dishTypes = []) {
  const methods = [];
  const types = dishTypes.map(d => d.toLowerCase()).join(' ');
  
  if (types.includes('baked') || types.includes('roasted')) methods.push('baking');
  if (types.includes('grilled')) methods.push('grilling');
  if (types.includes('fried')) methods.push('frying');
  if (types.includes('soup') || types.includes('stew')) methods.push('simmering');
  if (types.includes('salad')) methods.push('raw');
  
  return methods;
}

/**
 * Derive carb bases
 * @param {Array} ingredients
 * @returns {Array}
 */
function deriveCarbBases(ingredients = []) {
  const carbs = [];
  const names = ingredients.map(i => (i.name || '').toLowerCase());
  
  if (names.some(n => n.includes('rice'))) carbs.push('rice');
  if (names.some(n => n.includes('pasta') || n.includes('noodle'))) carbs.push('pasta');
  if (names.some(n => n.includes('potato'))) carbs.push('potatoes');
  if (names.some(n => n.includes('bread') || n.includes('tortilla'))) carbs.push('bread');
  if (names.some(n => n.includes('quinoa'))) carbs.push('quinoa');
  
  return carbs;
}

/**
 * Derive effort level from time and steps
 * @param {number} readyInMinutes
 * @param {Array} analyzedInstructions
 * @returns {string}
 */
function deriveEffortLevel(readyInMinutes, analyzedInstructions) {
  const time = readyInMinutes || 30;
  const steps = analyzedInstructions?.[0]?.steps?.length || 5;
  
  if (time <= 15 && steps <= 3) return 'quick';
  if (time <= 30 && steps <= 6) return 'easy';
  if (time <= 60 && steps <= 10) return 'medium';
  return 'project';
}

/**
 * Derive spice level from cuisines
 * @param {Array} cuisines
 * @returns {string}
 */
function deriveSpiceLevel(cuisines = []) {
  const spicy = ['indian', 'thai', 'mexican', 'cajun', 'korean'];
  const mild = ['italian', 'french', 'american', 'japanese'];
  
  const cuisineSet = cuisines.map(c => c.toLowerCase());
  
  if (cuisineSet.some(c => spicy.includes(c))) return 'hot';
  if (cuisineSet.some(c => mild.includes(c))) return 'mild';
  
  return 'none';
}

/**
 * Derive if recipe is make-ahead friendly
 * @param {Array} dishTypes
 * @returns {boolean}
 */
function deriveMakeAhead(dishTypes = []) {
  const makeAheadTypes = ['soup', 'stew', 'casserole', 'sauce'];
  const types = dishTypes.map(d => d.toLowerCase()).join(' ');
  
  return makeAheadTypes.some(type => types.includes(type));
}
