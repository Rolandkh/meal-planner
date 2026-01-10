/**
 * Spoonacular Nutrition Data Fetcher
 * 
 * Fetches comprehensive nutrition data from Spoonacular API
 * for ingredient catalog enrichment.
 * 
 * API Documentation: https://spoonacular.com/food-api/docs
 */

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

/**
 * Search for ingredient by name to get Spoonacular ID
 * @param {string} ingredientName - Name of ingredient to search
 * @param {string} apiKey - Spoonacular API key
 * @returns {Promise<Object|null>} First matching ingredient or null
 */
export async function searchIngredient(ingredientName, apiKey) {
  const url = new URL(`${SPOONACULAR_BASE_URL}/food/ingredients/search`);
  url.searchParams.set('query', ingredientName);
  url.searchParams.set('number', '5'); // Get top 5 results
  url.searchParams.set('apiKey', apiKey);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Spoonacular search failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return first result (best match)
      return {
        id: data.results[0].id,
        name: data.results[0].name,
        image: data.results[0].image
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching ingredient "${ingredientName}":`, error.message);
    return null;
  }
}

/**
 * Get detailed nutrition information for an ingredient
 * @param {number} ingredientId - Spoonacular ingredient ID
 * @param {string} apiKey - Spoonacular API key
 * @param {number} amount - Amount in grams (default: 100)
 * @returns {Promise<Object|null>} Nutrition data or null
 */
export async function getIngredientNutrition(ingredientId, apiKey, amount = 100) {
  const url = new URL(`${SPOONACULAR_BASE_URL}/food/ingredients/${ingredientId}/information`);
  url.searchParams.set('amount', amount.toString());
  url.searchParams.set('unit', 'grams');
  url.searchParams.set('apiKey', apiKey);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Spoonacular nutrition fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Transform to our schema
    return transformNutritionData(data);
  } catch (error) {
    console.error(`Error fetching nutrition for ingredient ${ingredientId}:`, error.message);
    return null;
  }
}

/**
 * Transform Spoonacular nutrition data to our internal schema
 * @param {Object} spData - Raw Spoonacular ingredient data
 * @returns {Object} Transformed nutrition data
 */
function transformNutritionData(spData) {
  const nutrients = spData.nutrition?.nutrients || [];
  const find = (name) => {
    const nutrient = nutrients.find(n => n.name === name);
    return nutrient ? nutrient.amount : 0;
  };
  
  return {
    per100g: {
      // Macronutrients
      calories: find('Calories'),
      protein: find('Protein'),
      carbs: find('Carbohydrates'),
      fat: find('Fat'),
      fiber: find('Fiber'),
      sugar: find('Sugar'),
      saturatedFat: find('Saturated Fat'),
      
      // Other
      sodium: find('Sodium'),
      cholesterol: find('Cholesterol'),
      
      // Vitamins
      vitamins: {
        vitaminA: find('Vitamin A'),
        vitaminC: find('Vitamin C'),
        vitaminD: find('Vitamin D'),
        vitaminE: find('Vitamin E'),
        vitaminK: find('Vitamin K'),
        thiamin: find('Thiamin'),
        riboflavin: find('Riboflavin'),
        niacin: find('Niacin'),
        b6: find('Vitamin B6'),
        folate: find('Folate'),
        b12: find('Vitamin B12'),
        pantothenicAcid: find('Pantothenic Acid'),
        biotin: find('Biotin'),
        choline: find('Choline')
      },
      
      // Minerals
      minerals: {
        calcium: find('Calcium'),
        iron: find('Iron'),
        magnesium: find('Magnesium'),
        phosphorus: find('Phosphorus'),
        potassium: find('Potassium'),
        zinc: find('Zinc'),
        copper: find('Copper'),
        manganese: find('Manganese'),
        selenium: find('Selenium'),
        fluoride: find('Fluoride'),
        iodine: find('Iodine')
      }
    },
    source: 'spoonacular',
    spoonacularId: spData.id,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

/**
 * Get nutrition data by searching for ingredient name
 * Combines search + fetch in one convenient function
 * @param {string} ingredientName - Name of ingredient
 * @param {string} apiKey - Spoonacular API key
 * @returns {Promise<Object|null>} Nutrition data or null
 */
export async function getNutritionByName(ingredientName, apiKey) {
  // Step 1: Search for ingredient
  const searchResult = await searchIngredient(ingredientName, apiKey);
  
  if (!searchResult) {
    console.warn(`Could not find Spoonacular ID for "${ingredientName}"`);
    return null;
  }
  
  console.log(`Found Spoonacular ID ${searchResult.id} for "${ingredientName}"`);
  
  // Step 2: Fetch nutrition data
  const nutrition = await getIngredientNutrition(searchResult.id, apiKey);
  
  return nutrition;
}

/**
 * Get cooking method variants for an ingredient
 * Searches for both raw and cooked versions to calculate multipliers
 * @param {string} ingredientName - Base ingredient name
 * @param {string} apiKey - Spoonacular API key
 * @returns {Promise<Object>} Object with raw and cooked nutrition data
 */
export async function getCookingMethodVariants(ingredientName, apiKey) {
  const variants = {
    raw: null,
    grilled: null,
    baked: null,
    fried: null,
    boiled: null,
    steamed: null
  };
  
  // Get raw version
  variants.raw = await getNutritionByName(ingredientName, apiKey);
  
  // Try to find cooked versions
  const cookingMethods = [
    { key: 'grilled', search: `${ingredientName}, grilled` },
    { key: 'baked', search: `${ingredientName}, baked` },
    { key: 'fried', search: `${ingredientName}, fried` },
    { key: 'boiled', search: `${ingredientName}, boiled` },
    { key: 'steamed', search: `${ingredientName}, steamed` }
  ];
  
  for (const method of cookingMethods) {
    const result = await getNutritionByName(method.search, apiKey);
    if (result) {
      variants[method.key] = result;
    }
  }
  
  return variants;
}

/**
 * Calculate multipliers between raw and cooked nutrition
 * @param {Object} rawNutrition - Nutrition data for raw ingredient
 * @param {Object} cookedNutrition - Nutrition data for cooked ingredient
 * @returns {Object} Multipliers object
 */
export function calculateMultipliers(rawNutrition, cookedNutrition) {
  if (!rawNutrition || !cookedNutrition) return null;
  
  const raw = rawNutrition.per100g;
  const cooked = cookedNutrition.per100g;
  
  const safeRatio = (cookedVal, rawVal) => {
    if (rawVal === 0) return 1.0;
    return Math.round((cookedVal / rawVal) * 100) / 100;
  };
  
  return {
    calories: safeRatio(cooked.calories, raw.calories),
    protein: safeRatio(cooked.protein, raw.protein),
    carbs: safeRatio(cooked.carbs, raw.carbs),
    fat: safeRatio(cooked.fat, raw.fat),
    fiber: safeRatio(cooked.fiber, raw.fiber),
    sugar: safeRatio(cooked.sugar, raw.sugar),
    sodium: safeRatio(cooked.sodium, raw.sodium),
    cholesterol: safeRatio(cooked.cholesterol, raw.cholesterol),
    
    // Calculate vitamin multipliers
    vitamins: Object.keys(raw.vitamins).reduce((acc, key) => {
      acc[key] = safeRatio(cooked.vitamins[key], raw.vitamins[key]);
      return acc;
    }, {}),
    
    // Calculate mineral multipliers
    minerals: Object.keys(raw.minerals).reduce((acc, key) => {
      acc[key] = safeRatio(cooked.minerals[key], raw.minerals[key]);
      return acc;
    }, {})
  };
}

/**
 * Batch fetch nutrition for multiple ingredients
 * Includes rate limiting to respect API quotas
 * @param {Array<string>} ingredientNames - Array of ingredient names
 * @param {string} apiKey - Spoonacular API key
 * @param {Function} progressCallback - Optional callback(current, total, name)
 * @param {number} delayMs - Delay between requests (default: 1000ms)
 * @returns {Promise<Object>} Map of ingredient names to nutrition data
 */
export async function batchFetchNutrition(ingredientNames, apiKey, progressCallback = null, delayMs = 1000) {
  const results = {};
  const total = ingredientNames.length;
  
  for (let i = 0; i < ingredientNames.length; i++) {
    const name = ingredientNames[i];
    
    if (progressCallback) {
      progressCallback(i + 1, total, name);
    }
    
    console.log(`[${i + 1}/${total}] Fetching nutrition for: ${name}`);
    
    try {
      const nutrition = await getNutritionByName(name, apiKey);
      results[name] = nutrition;
      
      // Rate limiting delay (except for last item)
      if (i < ingredientNames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to fetch nutrition for ${name}:`, error.message);
      results[name] = null;
    }
  }
  
  return results;
}

/**
 * Test API key and connection
 * @param {string} apiKey - Spoonacular API key to test
 * @returns {Promise<boolean>} True if API key is valid
 */
export async function testApiKey(apiKey) {
  try {
    const result = await searchIngredient('chicken', apiKey);
    return result !== null;
  } catch (error) {
    return false;
  }
}

export default {
  searchIngredient,
  getIngredientNutrition,
  getNutritionByName,
  getCookingMethodVariants,
  calculateMultipliers,
  batchFetchNutrition,
  testApiKey
};
