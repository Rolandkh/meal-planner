/**
 * Fix Catalog - Add Missing Ingredients
 * Fetches detailed recipe info for each catalog recipe to get ingredients
 * 
 * Run: node scripts/fix-catalog-ingredients.js
 * 
 * This fetches ONLY the ingredient/nutrition data we're missing
 * Uses: ~607 API points (1 per recipe)
 * Time: ~10-15 minutes
 */

import dotenv from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  baseUrl: 'https://api.spoonacular.com',
  requestDelay: 500,  // 2 req/sec
  batchSize: 10,
  maxRetries: 3
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchRecipeDetails(spoonacularId) {
  const url = new URL(`/recipes/${spoonacularId}/information`, CONFIG.baseUrl);
  url.searchParams.set('includeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString());
      
      if (response.status === 429) {
        const waitTime = 2000 * Math.pow(2, attempt);
        console.log(`  ⚠️  Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) throw error;
      await sleep(1000);
    }
  }
}

async function fixCatalog() {
  console.log('🔧 Fixing catalog - adding missing ingredients\n');

  // Load catalog
  const catalogPath = path.join(PROJECT_ROOT, 'src/data/vanessa_recipe_catalog.json');
  const catalogData = JSON.parse(await readFile(catalogPath, 'utf-8'));
  const recipes = catalogData.recipes || [];
  
  console.log(`📖 Loaded ${recipes.length} recipes\n`);

  // Process in batches
  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    
    try {
      // Skip if already has ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        continue;
      }

      // Fetch full recipe details
      const details = await fetchRecipeDetails(recipe.spoonacularId);
      
      // Map ingredients
      recipe.ingredients = (details.extendedIngredients || []).map(ing => ({
        name: ing.nameClean || ing.name || ing.originalName || 'unknown',
        quantity: parseFloat(ing.measures?.metric?.amount || ing.amount || 0),
        unit: ing.measures?.metric?.unitShort || ing.unit || '',
        category: mapCategory(ing.aisle),
        healthImpact: 'neutral'
      })).filter(ing => ing.name !== 'unknown');

      // Map nutrition if available
      if (details.nutrition) {
        recipe.nutrition = mapNutrition(details.nutrition);
      }

      fixed++;
      
      if ((i + 1) % CONFIG.batchSize === 0 || i === recipes.length - 1) {
        console.log(`  Progress: ${i + 1}/${recipes.length} (${fixed} fixed, ${failed} failed)`);
      }
      
      await sleep(CONFIG.requestDelay);
      
    } catch (error) {
      console.error(`  ❌ Failed ${recipe.spoonacularId}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Processing complete: ${fixed} fixed, ${failed} failed\n`);

  // Save updated catalog
  await writeFile(catalogPath, JSON.stringify(catalogData, null, 2));
  console.log(`💾 Saved updated catalog\n`);
  
  console.log('✅ CATALOG FIXED!');
  console.log(`Next: Run scoring script to add health scores`);
  console.log(`  node scripts/scoreCatalog.js\n`);
}

function mapCategory(aisle) {
  if (!aisle) return 'other';
  const lower = aisle.toLowerCase();
  
  if (lower.includes('produce') || lower.includes('vegetable') || lower.includes('fruit')) return 'produce';
  if (lower.includes('meat') || lower.includes('seafood') || lower.includes('poultry')) return 'meat';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese')) return 'dairy';
  if (lower.includes('baking') || lower.includes('spice') || lower.includes('condiment')) return 'pantry';
  
  return 'other';
}

function mapNutrition(nutrition) {
  const nutrients = nutrition.nutrients || [];
  const find = (name) => nutrients.find(n => n.name === name)?.amount || 0;

  return {
    calories: find('Calories'),
    protein: find('Protein'),
    fat: find('Fat'),
    carbs: find('Carbohydrates'),
    fiber: find('Fiber'),
    sugar: find('Sugar'),
    saturatedFat: find('Saturated Fat'),
    omega3: 0,
    omega6: 0,
    sodium: find('Sodium'),
    cholesterol: find('Cholesterol'),
    vitaminA: find('Vitamin A'),
    vitaminC: find('Vitamin C'),
    calcium: find('Calcium'),
    iron: find('Iron')
  };
}

fixCatalog().catch(error => {
  console.error('\n❌ Fix failed:', error);
  process.exit(1);
});
