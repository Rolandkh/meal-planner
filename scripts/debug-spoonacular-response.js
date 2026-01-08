/**
 * Debug Spoonacular API Response
 * Fetches 1 recipe and shows the complete raw response
 */

import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.SPOONACULAR_API_KEY;

async function debugResponse() {
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch');
  url.searchParams.set('number', '1');
  url.searchParams.set('addRecipeInformation', 'true');
  url.searchParams.set('addRecipeNutrition', 'true');
  url.searchParams.set('fillIngredients', 'true');
  url.searchParams.set('apiKey', apiKey);

  console.log('📡 Fetching with all parameters...\n');
  const response = await fetch(url.toString());
  const data = await response.json();
  
  const recipe = data.results[0];
  console.log('Recipe ID:', recipe.id);
  console.log('Title:', recipe.title);
  console.log('\nExtendedIngredients:', recipe.extendedIngredients?.length || 0);
  
  if (recipe.extendedIngredients?.[0]) {
    console.log('\nSample ingredient structure:');
    console.log(JSON.stringify(recipe.extendedIngredients[0], null, 2));
  }
  
  console.log('\n\nFull recipe keys:', Object.keys(recipe));
}

debugResponse();
