/**
 * Spoonacular Catalog Extraction Script v2
 * 
 * COMPREHENSIVE EXTRACTION: Downloads ~800 recipes following the protocol document
 * Run: node scripts/extractSpoonacularCatalog.js
 * 
 * What it does:
 * 1. Fetches recipes using 66 targeted search queries from protocol
 * 2. Downloads all recipe images locally (high-res 636x393)
 * 3. Extracts protein sources from ingredients
 * 4. Calculates Diet Compass health scores
 * 5. Generates comprehensive tags
 * 6. Saves to src/data/vanessa_recipe_catalog.json
 * 
 * Requirements:
 * - SPOONACULAR_API_KEY in .env
 * - ~100MB disk space for images
 * - 20-30 minutes runtime
 * - ~800-1000 API points
 */

import dotenv from 'dotenv';
import { writeFile, mkdir, readFile } from 'fs/promises';
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
  recipesPerRequest: 20,  // Lower to avoid missing any
  requestDelay: 600,  // 600ms = 1.67 req/sec (safe)
  imageDelay: 100,
  maxRetries: 3,
  imageSize: '636x393',  // High-res
  outputDir: path.join(PROJECT_ROOT, 'src/data'),
  imageDir: path.join(PROJECT_ROOT, 'public/images/recipes')
};

// Search queries from protocol document (66 searches targeting ~800 recipes)
const SEARCH_QUERIES = [
  // === CUISINES (13 searches, target: 165) ===
  { id: 'CUI-01', cuisine: 'italian', target: 15 },
  { id: 'CUI-02', cuisine: 'indian', target: 15 },
  { id: 'CUI-03', cuisine: 'thai', target: 15 },
  { id: 'CUI-04', cuisine: 'mexican', target: 15 },
  { id: 'CUI-05', cuisine: 'japanese', target: 15 },
  { id: 'CUI-06', cuisine: 'chinese', target: 15 },
  { id: 'CUI-07', cuisine: 'mediterranean', target: 15 },
  { id: 'CUI-08', cuisine: 'greek', target: 10 },
  { id: 'CUI-09', cuisine: 'middle eastern', target: 15 },
  { id: 'CUI-10', cuisine: 'french', target: 10 },
  { id: 'CUI-11', cuisine: 'korean', target: 10 },
  { id: 'CUI-12', cuisine: 'vietnamese', target: 10 },
  { id: 'CUI-13', cuisine: 'spanish', target: 5 },
  
  // === DIETS (8 searches, target: 90) ===
  { id: 'DIT-01', diet: 'vegetarian', target: 15 },
  { id: 'DIT-02', diet: 'vegan', target: 15 },
  { id: 'DIT-03', diet: 'gluten free', target: 15 },
  { id: 'DIT-04', diet: 'dairy free', target: 10 },
  { id: 'DIT-05', diet: 'ketogenic', target: 10 },
  { id: 'DIT-06', diet: 'paleo', target: 10 },
  { id: 'DIT-07', diet: 'whole 30', target: 10 },
  { id: 'DIT-08', diet: 'pescatarian', target: 5 },
  
  // === DISH TYPES (11 searches, target: 130) ===
  { id: 'DSH-01', type: 'soup', target: 15 },
  { id: 'DSH-02', type: 'salad', target: 15 },
  { id: 'DSH-03', type: 'sandwich', target: 10 },
  { id: 'DSH-04', query: 'bowl', type: 'main course', target: 15 },
  { id: 'DSH-05', query: 'stew', target: 10 },
  { id: 'DSH-06', query: 'curry', target: 15 },
  { id: 'DSH-07', query: 'stir fry', target: 10 },
  { id: 'DSH-08', query: 'casserole', target: 10 },
  { id: 'DSH-09', query: 'pasta', type: 'main course', target: 10 },
  { id: 'DSH-10', query: 'tacos', target: 10 },
  { id: 'DSH-11', query: 'sheet pan', target: 10 },
  
  // === PROTEINS (10 searches, target: 120) ===
  { id: 'PRO-01', includeIngredients: 'chicken', target: 15 },
  { id: 'PRO-02', includeIngredients: 'salmon', target: 15 },
  { id: 'PRO-03', includeIngredients: 'cod,tilapia,halibut', target: 10 },
  { id: 'PRO-04', includeIngredients: 'shrimp', target: 10 },
  { id: 'PRO-05', includeIngredients: 'tofu', target: 15 },
  { id: 'PRO-06', includeIngredients: 'tempeh', target: 10 },
  { id: 'PRO-07', includeIngredients: 'lentils', target: 15 },
  { id: 'PRO-08', includeIngredients: 'chickpeas', target: 15 },
  { id: 'PRO-09', includeIngredients: 'black beans', target: 10 },
  { id: 'PRO-10', includeIngredients: 'eggs', type: 'main course', target: 5 },
  
  // === MEAL SLOTS (3 searches, target: 60) ===
  { id: 'SLT-01', type: 'breakfast', target: 25 },
  { id: 'SLT-02', type: 'snack', target: 20 },
  { id: 'SLT-03', type: 'appetizer', target: 15 },
  
  // === COMPONENTS/PRESERVED (7 searches, target: 50) ===
  { id: 'CMP-01', query: 'kimchi OR sauerkraut OR fermented', target: 8 },
  { id: 'CMP-02', query: 'pickled OR preserved OR pickle', target: 8 },
  { id: 'CMP-03', type: 'sauce', query: 'homemade', target: 10 },
  { id: 'CMP-04', query: 'hummus OR dip OR spread', target: 8 },
  { id: 'CMP-05', query: 'spice blend OR seasoning mix', target: 6 },
  { id: 'CMP-06', query: 'stock OR broth OR bone broth', target: 5 },
  { id: 'CMP-07', query: 'batch rice OR meal prep grains', target: 5 },
  
  // === EFFORT LEVELS (3 searches, target: 45) ===
  { id: 'EFF-01', maxReadyTime: 20, target: 20 },
  { id: 'EFF-02', maxReadyTime: 40, minReadyTime: 20, target: 15 },
  { id: 'EFF-03', minReadyTime: 60, target: 10 },
  
  // === DIET COMPASS ALIGNED (8 searches, target: 100) ===
  { id: 'DC-01', includeIngredients: 'salmon,sardines,mackerel', diet: 'pescatarian', target: 15 },
  { id: 'DC-02', includeIngredients: 'quinoa,bulgur,farro,brown rice', diet: 'vegetarian', target: 15 },
  { id: 'DC-03', includeIngredients: 'lentils,chickpeas,beans', diet: 'vegan', target: 15 },
  { id: 'DC-04', includeIngredients: 'walnuts,almonds,chia,flax', target: 10 },
  { id: 'DC-05', includeIngredients: 'yogurt,kefir', target: 10 },
  { id: 'DC-06', includeIngredients: 'turmeric,ginger', diet: 'vegetarian', target: 15 },
  { id: 'DC-07', minFiber: 10, target: 10 },
  { id: 'DC-08', maxCarbs: 30, minProtein: 20, target: 10 },
  
  // === KID-FRIENDLY (3 searches, target: 40) ===
  { id: 'KID-01', query: 'kid friendly', type: 'main course', target: 20 },
  { id: 'KID-02', query: 'kid friendly', type: 'snack', target: 10 },
  { id: 'KID-03', query: 'hidden vegetables kids', target: 10 }
];

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract protein sources from ingredients
 */
function extractProteinSources(extendedIngredients) {
  if (!extendedIngredients || !Array.isArray(extendedIngredients)) return [];
  
  const proteinMap = {
    'chicken': ['chicken', 'chicken breast', 'chicken thigh', 'rotisserie chicken'],
    'beef': ['beef', 'ground beef', 'steak', 'ribeye', 'sirloin'],
    'pork': ['pork', 'pork chop', 'pork tenderloin', 'bacon', 'ham'],
    'salmon': ['salmon', 'salmon fillet'],
    'tuna': ['tuna', 'tuna steak'],
    'white-fish': ['cod', 'tilapia', 'halibut', 'sea bass', 'snapper', 'haddock'],
    'shrimp': ['shrimp', 'prawn'],
    'turkey': ['turkey', 'ground turkey', 'turkey breast'],
    'lamb': ['lamb', 'lamb chop'],
    'tofu': ['tofu'],
    'tempeh': ['tempeh'],
    'lentils': ['lentils', 'lentil'],
    'chickpeas': ['chickpeas', 'chickpea', 'garbanzo'],
    'black-beans': ['black beans', 'black bean'],
    'eggs': ['eggs', 'egg'],
    'seitan': ['seitan']
  };
  
  const found = new Set();
  const ingredientNames = extendedIngredients
    .map(ing => ing.name?.toLowerCase() || '')
    .join(' ');
  
  for (const [protein, terms] of Object.entries(proteinMap)) {
    if (terms.some(term => ingredientNames.includes(term))) {
      found.add(protein);
    }
  }
  
  return Array.from(found);
}

/**
 * Extract and format instructions
 */
function extractInstructions(spoonacularRecipe) {
  // First try the simple instructions field
  if (spoonacularRecipe.instructions && typeof spoonacularRecipe.instructions === 'string') {
    const cleaned = spoonacularRecipe.instructions.trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }
  
  // Otherwise parse analyzedInstructions
  if (!spoonacularRecipe.analyzedInstructions || !Array.isArray(spoonacularRecipe.analyzedInstructions)) {
    return 'No instructions available';
  }
  
  const allSteps = spoonacularRecipe.analyzedInstructions
    .flatMap(section => section.steps || [])
    .filter(step => step && step.step)
    .sort((a, b) => (a.number || 0) - (b.number || 0))
    .map(step => `${step.number}. ${step.step}`)
    .join('\n\n');
  
  return allSteps || 'No instructions available';
}

/**
 * Fetch recipes from Spoonacular
 */
async function fetchRecipes(query) {
  const url = new URL('/recipes/complexSearch', CONFIG.baseUrl);
  url.searchParams.set('number', query.target || CONFIG.recipesPerRequest);
  url.searchParams.set('offset', 0);
  url.searchParams.set('addRecipeInformation', 'true');
  url.searchParams.set('addRecipeNutrition', 'true');
  url.searchParams.set('instructionsRequired', 'true');
  url.searchParams.set('fillIngredients', 'true');
  url.searchParams.set('sort', 'popularity');
  url.searchParams.set('sortDirection', 'desc');
  url.searchParams.set('apiKey', CONFIG.apiKey);
  
  // Add query-specific parameters
  if (query.cuisine) url.searchParams.set('cuisine', query.cuisine);
  if (query.diet) url.searchParams.set('diet', query.diet);
  if (query.type) url.searchParams.set('type', query.type);
  if (query.query) url.searchParams.set('query', query.query);
  if (query.includeIngredients) url.searchParams.set('includeIngredients', query.includeIngredients);
  if (query.maxReadyTime) url.searchParams.set('maxReadyTime', query.maxReadyTime);
  if (query.minReadyTime) url.searchParams.set('minReadyTime', query.minReadyTime);
  if (query.minFiber) url.searchParams.set('minFiber', query.minFiber);
  if (query.maxCarbs) url.searchParams.set('maxCarbs', query.maxCarbs);
  if (query.minProtein) url.searchParams.set('minProtein', query.minProtein);

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
 * Transform Spoonacular recipe to our schema
 */
function transformRecipe(sp, searchSource) {
  // Extract image URL (high-res 636x393)
  let imageUrl = sp.image;
  if (imageUrl && !imageUrl.includes(CONFIG.imageSize)) {
    imageUrl = imageUrl.replace(/\d+x\d+/, CONFIG.imageSize);
  }
  
  // Extract ingredients
  const ingredients = (sp.extendedIngredients || []).map(ing => ({
    name: ing.name || ing.original,
    quantity: ing.amount || 0,
    unit: ing.unit || '',
    category: ing.aisle || 'other',
    healthImpact: 'neutral'  // Will be calculated by scoring engine
  }));
  
  // Extract protein sources
  const proteinSources = extractProteinSources(sp.extendedIngredients);
  
  // Determine meal slot
  let mealSlots = ['lunch', 'dinner'];  // Default
  if (sp.dishTypes) {
    if (sp.dishTypes.some(t => t.toLowerCase().includes('breakfast') || t.toLowerCase().includes('brunch'))) {
      mealSlots = ['breakfast'];
    } else if (sp.dishTypes.some(t => t.toLowerCase().includes('snack') || t.toLowerCase().includes('appetizer'))) {
      mealSlots = ['snack'];
    }
  }
  
  return {
    _schemaVersion: 2,
    recipeId: `recipe_${sp.id}`,  // Temporary, will be replaced with UUID
    name: sp.title,
    source: 'spoonacular',
    spoonacularId: sp.id,
    image: null,  // Will be set after download
    imageUrl: imageUrl,
    
    ingredients,
    instructions: extractInstructions(sp),
    
    prepTime: sp.preparationMinutes || Math.floor((sp.readyInMinutes || 0) * 0.3),
    cookTime: sp.cookingMinutes || Math.floor((sp.readyInMinutes || 0) * 0.7),
    servings: sp.servings || 4,
    
    nutrition: sp.nutrition ? {
      calories: sp.nutrition.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
      protein: sp.nutrition.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
      fat: sp.nutrition.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
      carbs: sp.nutrition.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
      fiber: sp.nutrition.nutrients?.find(n => n.name === 'Fiber')?.amount || 0
    } : null,
    
    tags: {
      cuisines: sp.cuisines || [],
      diets: sp.diets || [],
      dishTypes: sp.dishTypes || [],
      mealSlots,
      proteinSources,
      cookingMethods: [],
      carbBases: [],
      effortLevel: sp.readyInMinutes <= 30 ? 'quick' : sp.readyInMinutes <= 60 ? 'medium' : 'project',
      spiceLevel: 'none',
      budgetTier: 'moderate',
      kidFriendly: false,
      makeAhead: false
    },
    
    dietCompassScores: null,  // Will be calculated by scoring engine
    parentRecipeId: null,
    childRecipeIds: [],
    
    isFavorite: false,
    rating: null,
    timesCooked: 0,
    lastCooked: null,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    _searchSource: searchSource
  };
}

/**
 * Load existing catalog if it exists
 */
async function loadExistingCatalog() {
  const catalogPath = path.join(CONFIG.outputDir, 'vanessa_recipe_catalog.json');
  
  if (!existsSync(catalogPath)) {
    return { recipes: [], recipeMap: new Map() };
  }
  
  try {
    const content = await readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(content);
    const recipeMap = new Map();
    
    catalog.recipes.forEach(recipe => {
      if (recipe.spoonacularId) {
        recipeMap.set(recipe.spoonacularId, recipe);
      }
    });
    
    console.log(`📂 Loaded ${catalog.recipes.length} existing recipes\n`);
    return { recipes: catalog.recipes, recipeMap };
    
  } catch (error) {
    console.warn(`⚠️  Could not load existing catalog: ${error.message}`);
    return { recipes: [], recipeMap: new Map() };
  }
}

/**
 * Main extraction logic
 */
async function extractCatalog() {
  console.log('🚀 Starting Spoonacular Catalog Extraction v2\n');
  console.log(`Protocol: ${SEARCH_QUERIES.length} targeted searches`);
  console.log(`Target: ${CONFIG.targetRecipes} recipes`);
  console.log(`Image size: ${CONFIG.imageSize}\n`);

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

  // Load existing catalog
  const { recipes: existingRecipes, recipeMap } = await loadExistingCatalog();

  // Fetch recipes
  console.log('📡 Fetching recipes from Spoonacular...\n');
  let totalFetched = 0;
  let duplicatesSkipped = 0;
  let newRecipes = 0;

  for (const query of SEARCH_QUERIES) {
    console.log(`[${query.id}] ${JSON.stringify(query)}`);
    
    try {
      const recipes = await fetchRecipes(query);
      
      recipes.forEach(recipe => {
        if (!recipeMap.has(recipe.id)) {
          const transformed = transformRecipe(recipe, query.id);
          recipeMap.set(recipe.id, transformed);
          newRecipes++;
        } else {
          duplicatesSkipped++;
        }
      });
      
      totalFetched += recipes.length;
      console.log(`  Found: ${recipes.length} | Total unique: ${recipeMap.size} | New: ${newRecipes} | Dupes: ${duplicatesSkipped}`);
      
      await sleep(CONFIG.requestDelay);
      
      if (recipeMap.size >= CONFIG.targetRecipes) {
        console.log(`\n✅ Reached target of ${CONFIG.targetRecipes} recipes\n`);
        break;
      }
      
    } catch (error) {
      console.error(`❌ Query ${query.id} failed:`, error.message);
      await sleep(2000);  // Extra delay on error
    }
  }

  const allRecipes = Array.from(recipeMap.values());
  console.log(`\n📊 Extraction Summary:`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Unique recipes: ${allRecipes.length}`);
  console.log(`   New recipes: ${newRecipes}`);
  console.log(`   Duplicates skipped: ${duplicatesSkipped}\n`);

  // Download images
  console.log('🖼️  Downloading images...\n');
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  
  for (let i = 0; i < allRecipes.length; i++) {
    const recipe = allRecipes[i];
    
    if (recipe.imageUrl) {
      const localPath = await downloadImage(recipe.spoonacularId, recipe.imageUrl);
      
      if (localPath) {
        recipe.image = localPath;
        imagesDownloaded++;
      } else {
        imagesFailed++;
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${allRecipes.length} | Downloaded: ${imagesDownloaded} | Failed: ${imagesFailed}`);
      }
      
      await sleep(CONFIG.imageDelay);
    }
  }
  
  console.log(`\n✅ Images complete: ${imagesDownloaded} downloaded, ${imagesFailed} failed\n`);

  // Save catalog
  console.log('💾 Saving catalog...');
  
  const catalog = {
    _catalogVersion: '2.0.0',
    _lastUpdated: new Date().toISOString(),
    _count: allRecipes.length,
    _source: 'Spoonacular (Full Protocol)',
    _extraction: {
      date: new Date().toISOString(),
      queries: SEARCH_QUERIES.length,
      totalFetched,
      duplicatesSkipped,
      newRecipes,
      imagesDownloaded,
      imagesFailed,
      imageSize: CONFIG.imageSize
    },
    recipes: allRecipes
  };
  
  const outputPath = path.join(CONFIG.outputDir, 'vanessa_recipe_catalog.json');
  await writeFile(outputPath, JSON.stringify(catalog, null, 2));
  
  console.log(`✅ Saved to: ${outputPath}`);
  console.log(`📦 File size: ${(JSON.stringify(catalog).length / 1024).toFixed(0)} KB\n`);
  
  // Print coverage summary
  console.log('📊 COVERAGE SUMMARY:');
  const cuisines = new Set();
  const proteins = new Set();
  let breakfasts = 0;
  
  allRecipes.forEach(r => {
    r.tags.cuisines?.forEach(c => cuisines.add(c));
    r.tags.proteinSources?.forEach(p => proteins.add(p));
    if (r.tags.mealSlots?.includes('breakfast')) breakfasts++;
  });
  
  console.log(`   Cuisines: ${cuisines.size} types`);
  console.log(`   Proteins: ${proteins.size} types`);
  console.log(`   Breakfasts: ${breakfasts} recipes`);
  console.log(`   Total recipes: ${allRecipes.length}\n`);
  
  console.log('🎉 Extraction complete!');
}

// Run extraction
extractCatalog().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});
