/**
 * Extract ~200 Diet Compass & Mediterranean-Friendly Recipes
 * 
 * Focus: Recipes aligned with Diet Compass principles
 * - Mediterranean cuisine
 * - Whole foods, vegetables, legumes, fish
 * - Healthy, nutritious meals
 * - Maximum image quality (636x393)
 * 
 * Run: node scripts/extract-diet-compass-recipes.js
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
  targetRecipes: 200,
  recipesPerRequest: 50,
  requestDelay: 600,      // Conservative rate limiting
  imageDelay: 100,
  maxRetries: 3,
  imageParallel: 10,
  imageSize: '636x393',   // MAXIMUM available size
  outputDir: path.join(PROJECT_ROOT, 'src/data'),
  imageDir: path.join(PROJECT_ROOT, 'public/images/recipes')
};

// Search queries focused on Diet Compass & Mediterranean principles
const SEARCH_QUERIES = [
  // Mediterranean cuisine - core focus
  { cuisine: 'mediterranean', number: 50 },
  { cuisine: 'greek', number: 30 },
  { cuisine: 'italian', number: 25 },
  { cuisine: 'middle eastern', number: 20 },
  
  // Healthy meal types
  { type: 'salad', number: 20 },
  { type: 'soup', number: 20 },
  
  // Diet Compass-aligned diets
  { diet: 'pescatarian', number: 20 },  // Fish-focused
  { diet: 'vegetarian', number: 30 },   // Plant-based
  
  // Specific healthy keywords
  { query: 'legumes', number: 15 },
  { query: 'lentils', number: 10 },
  { query: 'chickpeas', number: 10 },
  { query: 'whole grains', number: 10 }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract instructions from Spoonacular format
 */
function extractInstructions(recipe) {
  if (recipe.instructions && typeof recipe.instructions === 'string') {
    const cleaned = recipe.instructions.trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }
  
  if (!recipe.analyzedInstructions || !Array.isArray(recipe.analyzedInstructions)) {
    return 'No instructions available';
  }
  
  const allSteps = recipe.analyzedInstructions
    .flatMap(section => section.steps || [])
    .filter(step => step && step.step)
    .sort((a, b) => (a.number || 0) - (b.number || 0))
    .map(step => `${step.number}. ${step.step}`)
    .join('\n\n');
  
  return allSteps || 'No instructions available';
}

/**
 * Fetch recipes from Spoonacular with retry logic
 */
async function fetchRecipes(query, offset = 0) {
  const url = new URL('/recipes/complexSearch', CONFIG.baseUrl);
  url.searchParams.set('number', query.number || CONFIG.recipesPerRequest);
  url.searchParams.set('offset', offset);
  url.searchParams.set('addRecipeInformation', 'true');
  url.searchParams.set('addRecipeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);
  
  // Set query parameters
  if (query.cuisine) url.searchParams.set('cuisine', query.cuisine);
  if (query.diet) url.searchParams.set('diet', query.diet);
  if (query.type) url.searchParams.set('type', query.type);
  if (query.query) url.searchParams.set('query', query.query);

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString());
      
      if (response.status === 429) {
        const waitTime = 2000 * Math.pow(2, attempt);
        console.log(`⚠️  Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
      
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) {
        console.error(`❌ Failed after ${CONFIG.maxRetries} attempts:`, error.message);
        return [];
      }
      console.log(`⚠️  Attempt ${attempt + 1} failed, retrying...`);
      await sleep(1000 * (attempt + 1));
    }
  }
  
  return [];
}

/**
 * Fetch full recipe details (ingredients + instructions)
 */
async function fetchRecipeDetails(recipeId) {
  const url = new URL(`/recipes/${recipeId}/information`, CONFIG.baseUrl);
  url.searchParams.set('includeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString());
      
      if (response.status === 429) {
        const waitTime = 2000 * Math.pow(2, attempt);
        console.log(`⚠️  Rate limited (recipe ${recipeId}), waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      
      if (!response.ok) {
        console.warn(`⚠️  Failed to fetch recipe ${recipeId}: HTTP ${response.status}`);
        return null;
      }
      
      return await response.json();
      
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) {
        console.error(`❌ Failed to fetch recipe ${recipeId}:`, error.message);
        return null;
      }
      await sleep(1000 * (attempt + 1));
    }
  }
  
  return null;
}

/**
 * Download high-res recipe image
 */
async function downloadImage(spoonacularId, imageUrl) {
  if (!imageUrl) return null;
  
  // Use maximum size
  const maxSizeUrl = imageUrl.replace(/-(90x90|240x150|312x231|480x360|556x370)\.jpg/, `-${CONFIG.imageSize}.jpg`);
  
  const filename = `${spoonacularId}.jpg`;
  const filepath = path.join(CONFIG.imageDir, filename);
  
  if (existsSync(filepath)) {
    return `/images/recipes/${filename}`;
  }

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(maxSizeUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));
      
      return `/images/recipes/${filename}`;
      
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) {
        console.error(`❌ Failed to download image ${spoonacularId}:`, error.message);
        return null;
      }
      await sleep(500);
    }
  }
  
  return null;
}

/**
 * Main extraction
 */
async function extractCatalog() {
  console.log('🌿 Diet Compass & Mediterranean Recipe Extraction\n');
  console.log('='.repeat(60));
  console.log(`Target: ${CONFIG.targetRecipes} recipes`);
  console.log(`Focus: Mediterranean & Diet Compass principles`);
  console.log(`Image size: ${CONFIG.imageSize} (MAXIMUM quality)`);
  console.log(`Rate limit: ${(1000 / CONFIG.requestDelay).toFixed(1)} req/sec`);
  console.log('='.repeat(60) + '\n');

  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env');
    process.exit(1);
  }

  // Create directories
  console.log('📁 Creating directories...');
  await mkdir(CONFIG.imageDir, { recursive: true });
  await mkdir(CONFIG.outputDir, { recursive: true });
  console.log('✅ Directories ready\n');

  // Fetch recipes
  console.log('📡 Fetching Diet Compass-aligned recipes...\n');
  const recipeMap = new Map();
  let totalFetched = 0;
  let duplicatesSkipped = 0;

  for (const query of SEARCH_QUERIES) {
    const queryStr = query.cuisine || query.diet || query.type || query.query;
    console.log(`🔍 Searching: ${queryStr} (${query.number} recipes)`);
    
    const recipes = await fetchRecipes(query);
    
    recipes.forEach(recipe => {
      if (!recipeMap.has(recipe.id)) {
        recipeMap.set(recipe.id, recipe);
      } else {
        duplicatesSkipped++;
      }
    });
    
    totalFetched += recipes.length;
    const progress = ((recipeMap.size / CONFIG.targetRecipes) * 100).toFixed(1);
    console.log(`   Found: ${recipes.length} | Unique: ${recipeMap.size}/${CONFIG.targetRecipes} (${progress}%) | Duplicates: ${duplicatesSkipped}`);
    
    await sleep(CONFIG.requestDelay);
    
    if (recipeMap.size >= CONFIG.targetRecipes) {
      console.log(`\n✅ Reached target of ${CONFIG.targetRecipes} recipes!\n`);
      break;
    }
  }

  const uniqueRecipes = Array.from(recipeMap.values()).slice(0, CONFIG.targetRecipes);
  
  console.log('📊 Fetch Summary:');
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Unique recipes: ${uniqueRecipes.length}`);
  console.log(`   Duplicates skipped: ${duplicatesSkipped}\n`);

  // Fetch full details
  console.log('📋 Fetching full recipe details (ingredients + instructions)...\n');
  let detailsFetched = 0;
  let detailsFailed = 0;
  
  for (let i = 0; i < uniqueRecipes.length; i++) {
    const recipe = uniqueRecipes[i];
    const details = await fetchRecipeDetails(recipe.id);
    
    if (details) {
      uniqueRecipes[i] = { ...recipe, ...details };
      detailsFetched++;
    } else {
      detailsFailed++;
    }
    
    if ((i + 1) % 25 === 0 || i === uniqueRecipes.length - 1) {
      const progress = ((i + 1) / uniqueRecipes.length * 100).toFixed(1);
      console.log(`   Progress: ${i + 1}/${uniqueRecipes.length} (${progress}%) | Failed: ${detailsFailed}`);
    }
    
    await sleep(CONFIG.requestDelay);
  }
  
  console.log(`\n✅ Details complete: ${detailsFetched} success, ${detailsFailed} failed\n`);

  // Download images at MAXIMUM size
  console.log(`📸 Downloading images at MAXIMUM quality (${CONFIG.imageSize})...\n`);
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  
  for (let i = 0; i < uniqueRecipes.length; i += CONFIG.imageParallel) {
    const batch = uniqueRecipes.slice(i, i + CONFIG.imageParallel);
    
    await Promise.all(
      batch.map(async (recipe) => {
        const localPath = await downloadImage(recipe.id, recipe.image);
        if (localPath) {
          recipe.image = localPath;
          imagesDownloaded++;
        } else {
          imagesFailed++;
        }
      })
    );
    
    const progress = ((imagesDownloaded + imagesFailed) / uniqueRecipes.length * 100).toFixed(1);
    console.log(`   Downloaded: ${imagesDownloaded}/${uniqueRecipes.length} (${progress}%) | Failed: ${imagesFailed}`);
    await sleep(CONFIG.imageDelay);
  }

  console.log(`\n✅ Images complete: ${imagesDownloaded} success, ${imagesFailed} failed\n`);

  // Transform to internal schema
  console.log('🔄 Transforming to internal schema...');
  const catalog = uniqueRecipes.map(sp => ({
    _schemaVersion: 2,
    recipeId: `recipe_${crypto.randomUUID()}`,
    name: sp.title,
    source: 'spoonacular',
    spoonacularId: sp.id,
    image: sp.image,
    imageUrl: sp.image?.startsWith('/images') ? null : sp.image,
    
    ingredients: (sp.extendedIngredients || []).map(ing => ({
      name: ing.nameClean || ing.name || ing.originalName || 'unknown',
      quantity: parseFloat(ing.measures?.metric?.amount || ing.amount || 0),
      unit: ing.measures?.metric?.unitShort || ing.measures?.metric?.unitLong || ing.unit || '',
      category: 'other',
      healthImpact: 'neutral'
    })).filter(ing => ing.name !== 'unknown'),
    
    instructions: extractInstructions(sp),
    prepTime: sp.preparationMinutes || Math.round((sp.readyInMinutes || 30) * 0.3),
    cookTime: sp.cookingMinutes || Math.round((sp.readyInMinutes || 30) * 0.7),
    servings: sp.servings || 4,
    
    nutrition: sp.nutrition ? {
      calories: sp.nutrition.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
      protein: sp.nutrition.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
      fat: sp.nutrition.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
      carbs: sp.nutrition.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
      fiber: sp.nutrition.nutrients?.find(n => n.name === 'Fiber')?.amount || 0,
      sugar: sp.nutrition.nutrients?.find(n => n.name === 'Sugar')?.amount || 0,
      saturatedFat: sp.nutrition.nutrients?.find(n => n.name === 'Saturated Fat')?.amount || 0,
      sodium: sp.nutrition.nutrients?.find(n => n.name === 'Sodium')?.amount || 0
    } : null,
    
    tags: {
      cuisines: sp.cuisines || [],
      diets: sp.diets || [],
      dishTypes: sp.dishTypes || [],
      mealSlots: ['lunch', 'dinner'],
      proteinSources: [],
      cookingMethods: [],
      carbBases: [],
      effortLevel: sp.readyInMinutes <= 30 ? 'quick' : 'medium',
      spiceLevel: 'none',
      budgetTier: 'moderate',
      kidFriendly: sp.veryPopular || false,
      makeAhead: false,
      protectiveFoods: []
    },
    
    dietCompassScores: null,
    
    isFavorite: false,
    rating: null,
    timesCooked: 0,
    lastCooked: null,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  console.log(`✅ Transformed ${catalog.length} recipes\n`);

  // Save catalog
  console.log('💾 Saving catalog...');
  const catalogData = {
    _catalogVersion: '1.0.0-diet-compass',
    _lastUpdated: new Date().toISOString(),
    _count: catalog.length,
    _extraction: {
      date: new Date().toISOString(),
      focus: 'Diet Compass & Mediterranean',
      totalFetched,
      duplicatesSkipped,
      imagesDownloaded,
      imagesFailed,
      imageSize: CONFIG.imageSize
    },
    recipes: catalog
  };

  const catalogPath = path.join(CONFIG.outputDir, 'diet_compass_recipe_catalog.json');
  await writeFile(catalogPath, JSON.stringify(catalogData, null, 2));
  console.log(`✅ Saved to: ${catalogPath}\n`);

  // Generate report
  const stats = {
    totalRecipes: catalog.length,
    cuisines: [...new Set(catalog.flatMap(r => r.tags.cuisines))].sort(),
    diets: [...new Set(catalog.flatMap(r => r.tags.diets))].sort(),
    dishTypes: [...new Set(catalog.flatMap(r => r.tags.dishTypes))].sort(),
    imagesDownloaded,
    imagesFailed,
    avgPrepTime: Math.round(catalog.reduce((sum, r) => sum + r.prepTime, 0) / catalog.length),
    avgCalories: Math.round(catalog.reduce((sum, r) => sum + (r.nutrition?.calories || 0), 0) / catalog.length)
  };

  console.log('='.repeat(60));
  console.log('📊 EXTRACTION REPORT\n');
  console.log(`✅ Total Recipes: ${stats.totalRecipes}`);
  console.log(`🌍 Cuisines (${stats.cuisines.length}): ${stats.cuisines.join(', ')}`);
  console.log(`🥗 Diets (${stats.diets.length}): ${stats.diets.join(', ')}`);
  console.log(`🍽️  Dish Types (${stats.dishTypes.length}): ${stats.dishTypes.slice(0, 10).join(', ')}${stats.dishTypes.length > 10 ? '...' : ''}`);
  console.log(`📸 Images: ${stats.imagesDownloaded} downloaded (${CONFIG.imageSize}), ${stats.imagesFailed} failed`);
  console.log(`⏱️  Avg Prep Time: ${stats.avgPrepTime} minutes`);
  console.log(`🍎 Avg Calories: ${stats.avgCalories} kcal/serving`);
  console.log('='.repeat(60));
  console.log('\n✅ EXTRACTION COMPLETE!\n');
  console.log('📁 Files saved:');
  console.log(`   - Recipe catalog: ${catalogPath}`);
  console.log(`   - Images: ${CONFIG.imageDir}`);
  console.log('\n🎉 Ready to test in your app!\n');
}

// Run
extractCatalog().catch(error => {
  console.error('\n❌ Extraction failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
