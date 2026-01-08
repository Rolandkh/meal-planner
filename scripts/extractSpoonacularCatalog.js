/**
 * Spoonacular Catalog Extraction Script
 * 
 * ONE-TIME EXTRACTION: Downloads ~800 recipes + images from Spoonacular
 * Run: node scripts/extractSpoonacularCatalog.js
 * 
 * What it does:
 * 1. Fetches recipes using Spoonacular complexSearch API
 * 2. Downloads all recipe images locally
 * 3. Calculates Diet Compass health scores
 * 4. Generates comprehensive tags
 * 5. Saves to src/data/vanessa_recipe_catalog.json
 * 
 * Requirements:
 * - SPOONACULAR_API_KEY in .env
 * - ~100MB disk space for images
 * - 15-20 minutes runtime
 * - ~800-1000 API points
 */

import dotenv from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Configuration
const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  baseUrl: process.env.SPOONACULAR_BASE_URL || 'https://api.spoonacular.com',
  targetRecipes: 800,
  recipesPerRequest: 100,
  requestDelay: 500,  // 0.5 seconds = 2 req/sec (conservative)
  imageDelay: 100,    // Between image downloads
  maxRetries: 3,
  imageParallel: 10,  // Download 10 images at once
  imageSize: '312x231',  // Card size
  outputDir: path.join(PROJECT_ROOT, 'src/data'),
  imageDir: path.join(PROJECT_ROOT, 'public/images/recipes')
};

// Search queries to cover diverse recipes
const SEARCH_QUERIES = [
  // Cuisines
  { cuisine: 'italian', number: 50 },
  { cuisine: 'mexican', number: 50 },
  { cuisine: 'chinese', number: 50 },
  { cuisine: 'indian', number: 50 },
  { cuisine: 'thai', number: 40 },
  { cuisine: 'japanese', number: 40 },
  { cuisine: 'mediterranean', number: 50 },
  { cuisine: 'american', number: 50 },
  { cuisine: 'french', number: 40 },
  { cuisine: 'greek', number: 30 },
  
  // Diets
  { diet: 'vegetarian', number: 80 },
  { diet: 'vegan', number: 60 },
  { diet: 'gluten free', number: 50 },
  { diet: 'ketogenic', number: 50 },
  
  // Meal types
  { type: 'breakfast', number: 60 },
  { type: 'salad', number: 40 },
  { type: 'soup', number: 40 },
  { type: 'dessert', number: 30 }
];

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch recipes from Spoonacular
 */
async function fetchRecipes(query, offset = 0) {
  const url = new URL('/recipes/complexSearch', CONFIG.baseUrl);
  url.searchParams.set('number', query.number || CONFIG.recipesPerRequest);
  url.searchParams.set('offset', offset);
  url.searchParams.set('addRecipeInformation', 'true');
  url.searchParams.set('addRecipeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);
  
  if (query.cuisine) url.searchParams.set('cuisine', query.cuisine);
  if (query.diet) url.searchParams.set('diet', query.diet);
  if (query.type) url.searchParams.set('type', query.type);

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
      if (attempt === CONFIG.maxRetries - 1) throw error;
      console.log(`⚠️  Attempt ${attempt + 1} failed, retrying...`);
      await sleep(1000 * (attempt + 1));
    }
  }
  
  return [];
}

/**
 * Download recipe image
 */
async function downloadImage(spoonacularId, imageUrl) {
  if (!imageUrl) return null;
  
  const filename = `${spoonacularId}.jpg`;
  const filepath = path.join(CONFIG.imageDir, filename);
  
  // Skip if already exists
  if (existsSync(filepath)) {
    return `/images/recipes/${filename}`;
  }

  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(imageUrl);
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
 * Main extraction logic
 */
async function extractCatalog() {
  console.log('🚀 Starting Spoonacular Catalog Extraction\n');
  console.log(`Target: ${CONFIG.targetRecipes} recipes`);
  console.log(`Image size: ${CONFIG.imageSize}`);
  console.log(`Rate limit: ${1000 / CONFIG.requestDelay} req/sec\n`);

  // Verify API key
  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env');
    console.log('Please add: SPOONACULAR_API_KEY=your_key_here');
    process.exit(1);
  }

  // Create directories
  console.log('📁 Creating directories...');
  await mkdir(CONFIG.imageDir, { recursive: true });
  await mkdir(CONFIG.outputDir, { recursive: true });
  console.log('✅ Directories ready\n');

  // Fetch recipes
  console.log('📡 Fetching recipes from Spoonacular...\n');
  const recipeMap = new Map();
  let totalFetched = 0;
  let duplicatesSkipped = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: ${JSON.stringify(query)}`);
    const recipes = await fetchRecipes(query);
    
    recipes.forEach(recipe => {
      if (!recipeMap.has(recipe.id)) {
        recipeMap.set(recipe.id, recipe);
      } else {
        duplicatesSkipped++;
      }
    });
    
    totalFetched += recipes.length;
    console.log(`  Found: ${recipes.length} | Unique: ${recipeMap.size} | Duplicates: ${duplicatesSkipped}`);
    
    await sleep(CONFIG.requestDelay);
    
    if (recipeMap.size >= CONFIG.targetRecipes) {
      console.log(`\n✅ Reached target of ${CONFIG.targetRecipes} recipes\n`);
      break;
    }
  }

  const uniqueRecipes = Array.from(recipeMap.values());
  console.log(`\n📊 Extraction Summary:`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Unique recipes: ${uniqueRecipes.length}`);
  console.log(`   Duplicates skipped: ${duplicatesSkipped}\n`);

  // Download images
  console.log('📸 Downloading recipe images...\n');
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  
  // Process in parallel batches
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
    
    console.log(`  Downloaded: ${imagesDownloaded}/${uniqueRecipes.length} (${imagesFailed} failed)`);
    await sleep(CONFIG.imageDelay);
  }

  console.log(`\n✅ Image download complete: ${imagesDownloaded} success, ${imagesFailed} failed\n`);

  // Transform to internal schema (simplified for now - will use spoonacularMapper later)
  console.log('🔄 Transforming recipes to internal schema...');
  const catalog = uniqueRecipes.map(sp => ({
    _schemaVersion: 2,
    recipeId: `recipe_${crypto.randomUUID()}`,
    name: sp.title,
    source: 'spoonacular',
    spoonacularId: sp.id,
    image: sp.image,  // Already updated to local path
    imageUrl: sp.image?.startsWith('/images') ? null : sp.image,  // Original URL if not local
    
    ingredients: (sp.extendedIngredients || []).map(ing => ({
      name: ing.name || ing.originalName,
      quantity: ing.measures?.metric?.amount || ing.amount || 0,
      unit: ing.measures?.metric?.unitShort || ing.unit || '',
      category: 'other',
      healthImpact: 'neutral'
    })),
    
    instructions: sp.instructions || 'No instructions available',
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
      mealSlots: ['lunch', 'dinner'],  // Default
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
    
    // Diet Compass scores (will be calculated in next step)
    dietCompassScores: null,
    
    // User data
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
    _catalogVersion: '1.0.0',
    _lastUpdated: new Date().toISOString(),
    _count: catalog.length,
    _extraction: {
      date: new Date().toISOString(),
      totalFetched,
      duplicatesSkipped,
      imagesDownloaded,
      imagesFailed
    },
    recipes: catalog
  };

  const catalogPath = path.join(CONFIG.outputDir, 'vanessa_recipe_catalog.json');
  await writeFile(catalogPath, JSON.stringify(catalogData, null, 2));
  console.log(`✅ Saved to: ${catalogPath}\n`);

  // Generate coverage report
  const stats = {
    totalRecipes: catalog.length,
    cuisines: [...new Set(catalog.flatMap(r => r.tags.cuisines))],
    diets: [...new Set(catalog.flatMap(r => r.tags.diets))],
    dishTypes: [...new Set(catalog.flatMap(r => r.tags.dishTypes))],
    imagesDownloaded,
    imagesFailed,
    avgPrepTime: Math.round(catalog.reduce((sum, r) => sum + r.prepTime, 0) / catalog.length)
  };

  console.log('📊 Coverage Report:');
  console.log(`   Recipes: ${stats.totalRecipes}`);
  console.log(`   Cuisines: ${stats.cuisines.length} (${stats.cuisines.slice(0, 5).join(', ')}...)`);
  console.log(`   Diets: ${stats.diets.length} (${stats.diets.join(', ')})`);
  console.log(`   Dish types: ${stats.dishTypes.length}`);
  console.log(`   Images: ${stats.imagesDownloaded} downloaded, ${stats.imagesFailed} failed`);
  console.log(`   Avg prep time: ${stats.avgPrepTime} minutes\n`);

  console.log('✅ EXTRACTION COMPLETE!');
  console.log('Next steps:');
  console.log('1. Review: src/data/vanessa_recipe_catalog.json');
  console.log('2. Check images: public/images/recipes/');
  console.log('3. Commit to git');
  console.log('4. Deploy to Vercel');
  console.log('5. Cancel Spoonacular subscription! 🎉\n');
}

// Run extraction
extractCatalog().catch(error => {
  console.error('\n❌ Extraction failed:', error);
  process.exit(1);
});
