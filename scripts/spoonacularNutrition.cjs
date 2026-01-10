/**
 * Spoonacular Nutrition Data Fetcher (Node.js version)
 * 
 * CommonJS module for use in Node.js scripts
 * Same functionality as src/utils/spoonacularNutrition.js but using require/module.exports
 */

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

/**
 * Search for ingredient by name to get Spoonacular ID
 */
async function searchIngredient(ingredientName, apiKey) {
  const url = new URL(`${SPOONACULAR_BASE_URL}/food/ingredients/search`);
  url.searchParams.set('query', ingredientName);
  url.searchParams.set('number', '5');
  url.searchParams.set('apiKey', apiKey);
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Spoonacular search failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
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
 */
async function getIngredientNutrition(ingredientId, apiKey, amount = 100) {
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
    return transformNutritionData(data);
  } catch (error) {
    console.error(`Error fetching nutrition for ingredient ${ingredientId}:`, error.message);
    return null;
  }
}

/**
 * Transform Spoonacular nutrition data to our internal schema
 */
function transformNutritionData(spData) {
  const nutrients = spData.nutrition?.nutrients || [];
  const find = (name) => {
    const nutrient = nutrients.find(n => n.name === name);
    return nutrient ? nutrient.amount : 0;
  };
  
  return {
    per100g: {
      calories: find('Calories'),
      protein: find('Protein'),
      carbs: find('Carbohydrates'),
      fat: find('Fat'),
      fiber: find('Fiber'),
      sugar: find('Sugar'),
      saturatedFat: find('Saturated Fat'),
      sodium: find('Sodium'),
      cholesterol: find('Cholesterol'),
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
 */
async function getNutritionByName(ingredientName, apiKey) {
  const searchResult = await searchIngredient(ingredientName, apiKey);
  
  if (!searchResult) {
    console.warn(`Could not find Spoonacular ID for "${ingredientName}"`);
    return null;
  }
  
  console.log(`   Found Spoonacular ID ${searchResult.id} for "${ingredientName}"`);
  
  const nutrition = await getIngredientNutrition(searchResult.id, apiKey);
  return nutrition;
}

/**
 * Batch fetch nutrition for multiple ingredients
 */
async function batchFetchNutrition(ingredientNames, apiKey, progressCallback = null, delayMs = 1000) {
  const results = {};
  const total = ingredientNames.length;
  
  for (let i = 0; i < ingredientNames.length; i++) {
    const name = ingredientNames[i];
    
    if (progressCallback) {
      progressCallback(i + 1, total, name);
    }
    
    console.log(`\n[${i + 1}/${total}] Fetching nutrition for: ${name}`);
    
    try {
      const nutrition = await getNutritionByName(name, apiKey);
      results[name] = nutrition;
      
      if (i < ingredientNames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results[name] = null;
    }
  }
  
  return results;
}

/**
 * Test API key
 */
async function testApiKey(apiKey) {
  try {
    const result = await searchIngredient('chicken', apiKey);
    return result !== null;
  } catch (error) {
    return false;
  }
}

module.exports = {
  searchIngredient,
  getIngredientNutrition,
  getNutritionByName,
  batchFetchNutrition,
  testApiKey
};
