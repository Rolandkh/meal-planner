/**
 * TEST EXTRACTION - Downloads just 10 recipes for testing
 * Run: node scripts/test-extraction.js
 * 
 * This is a safe way to test the extraction without using many API points
 */

import dotenv from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  baseUrl: 'https://api.spoonacular.com',
  targetRecipes: 10,  // JUST 10 FOR TESTING
  imageDir: path.join(PROJECT_ROOT, 'public/images/recipes'),
  outputFile: path.join(PROJECT_ROOT, 'test-catalog.json')
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testExtraction() {
  console.log('🧪 TEST EXTRACTION - 10 Recipes Only\n');

  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found');
    process.exit(1);
  }

  // Create image directory
  await mkdir(CONFIG.imageDir, { recursive: true });

  // Fetch 10 recipes
  const url = new URL('/recipes/complexSearch', CONFIG.baseUrl);
  url.searchParams.set('number', '10');
  url.searchParams.set('addRecipeInformation', 'true');
  url.searchParams.set('addRecipeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);

  console.log('📡 Fetching 10 recipes...');
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    console.error(`❌ API Error: ${response.status}`);
    process.exit(1);
  }

  const data = await response.json();
  const recipes = data.results || [];
  console.log(`✅ Fetched ${recipes.length} recipes\n`);

  // Download images
  console.log('📸 Downloading images...');
  let downloaded = 0;
  let failed = 0;

  for (const recipe of recipes) {
    if (!recipe.image) continue;
    
    try {
      const filename = `${recipe.id}.jpg`;
      const filepath = path.join(CONFIG.imageDir, filename);
      
      const imgResponse = await fetch(recipe.image);
      if (imgResponse.ok) {
        const buffer = await imgResponse.arrayBuffer();
        await writeFile(filepath, Buffer.from(buffer));
        recipe.image = `/images/recipes/${filename}`;
        downloaded++;
        console.log(`  ✅ ${recipe.title.substring(0, 40)}...`);
      } else {
        failed++;
        console.log(`  ❌ Failed: ${recipe.title.substring(0, 40)}...`);
      }
      
      await sleep(100);
    } catch (error) {
      failed++;
      console.log(`  ❌ Error: ${recipe.title.substring(0, 40)}...`);
    }
  }

  console.log(`\n✅ Images: ${downloaded} downloaded, ${failed} failed\n`);

  // Transform to internal schema
  const catalog = recipes.map(sp => ({
    _schemaVersion: 2,
    recipeId: `recipe_${crypto.randomUUID()}`,
    name: sp.title,
    source: 'spoonacular',
    spoonacularId: sp.id,
    image: sp.image,
    
    ingredients: (sp.extendedIngredients || []).slice(0, 10).map(ing => ({
      name: ing.name || ing.originalName,
      quantity: ing.measures?.metric?.amount || 0,
      unit: ing.measures?.metric?.unitShort || '',
      category: 'other',
      healthImpact: 'neutral'
    })),
    
    instructions: sp.instructions || 'No instructions',
    prepTime: sp.readyInMinutes || 30,
    cookTime: 0,
    servings: sp.servings || 4,
    
    tags: {
      cuisines: sp.cuisines || [],
      diets: sp.diets || [],
      dishTypes: sp.dishTypes || [],
      mealSlots: ['lunch', 'dinner'],
      proteinSources: [],
      cookingMethods: [],
      carbBases: [],
      effortLevel: 'medium',
      spiceLevel: 'none',
      budgetTier: 'moderate',
      kidFriendly: false,
      makeAhead: false,
      protectiveFoods: []
    },
    
    dietCompassScores: null,
    nutrition: null,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // Save test catalog
  await writeFile(CONFIG.outputFile, JSON.stringify({ recipes: catalog }, null, 2));
  console.log(`💾 Saved to: ${CONFIG.outputFile}`);
  console.log(`📊 File size: ${(JSON.stringify(catalog).length / 1024).toFixed(1)} KB\n`);

  console.log('✅ TEST EXTRACTION COMPLETE!\n');
  console.log('Review:');
  console.log(`  - Test catalog: ${CONFIG.outputFile}`);
  console.log(`  - Images: ${CONFIG.imageDir}/`);
  console.log('\nIf this looks good, run the full extraction:');
  console.log('  npm run extract-catalog\n');
}

testExtraction().catch(error => {
  console.error('\n❌ Test extraction failed:', error);
  process.exit(1);
});
