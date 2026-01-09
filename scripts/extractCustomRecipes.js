/**
 * Custom Recipe Extraction Script
 * 
 * Extracts ~100 recipes matching user preferences:
 * - Mediterranean, Middle Eastern, Lebanese, Moroccan
 * - Roasted veggies, chickpeas, lentils
 * - Simple fish dishes
 * - Protein-packed salads
 * - Kid-friendly recipes
 * 
 * Run: node scripts/extractCustomRecipes.js
 */

import dotenv from 'dotenv';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  baseUrl: process.env.SPOONACULAR_BASE_URL || 'https://api.spoonacular.com',
  targetRecipes: 120,  // Higher target to account for duplicates
  recipesPerRequest: 20,
  requestDelay: 600,
  imageDelay: 100,
  maxRetries: 3,
  imageSize: '636x393',
  outputDir: path.join(PROJECT_ROOT, 'src/data'),
  imageDir: path.join(PROJECT_ROOT, 'public/images/recipes')
};

// Custom search queries based on user preferences
const SEARCH_QUERIES = [
  // === MEDITERRANEAN DISHES ===
  { id: 'MED-01', cuisine: 'mediterranean', includeIngredients: 'eggplant', target: 8 },
  { id: 'MED-02', cuisine: 'mediterranean', includeIngredients: 'zucchini', target: 8 },
  { id: 'MED-03', cuisine: 'mediterranean', includeIngredients: 'peppers', target: 8 },
  { id: 'MED-04', cuisine: 'mediterranean', includeIngredients: 'tomatoes,olives', target: 8 },
  { id: 'MED-05', cuisine: 'mediterranean', type: 'appetizer', target: 8 },
  { id: 'MED-06', cuisine: 'mediterranean', type: 'side dish', target: 8 },
  
  // === MIDDLE EASTERN DISHES ===
  { id: 'ME-01', cuisine: 'middle eastern', includeIngredients: 'yogurt', target: 8 },
  { id: 'ME-02', cuisine: 'middle eastern', includeIngredients: 'cucumber', target: 8 },
  { id: 'ME-03', cuisine: 'middle eastern', type: 'appetizer', target: 8 },
  { id: 'ME-04', cuisine: 'middle eastern', type: 'side dish', target: 8 },
  
  // === AFRICAN CUISINES ===
  { id: 'AFR-01', cuisine: 'african', target: 10 },
  { id: 'AFR-02', cuisine: 'african', includeIngredients: 'chickpeas', target: 8 },
  
  // === SPANISH ===
  { id: 'ESP-01', cuisine: 'spanish', target: 10 },
  { id: 'ESP-02', cuisine: 'spanish', includeIngredients: 'chickpeas', target: 8 },
  
  // === LEGUMES & GRAINS ===
  { id: 'LEG-01', includeIngredients: 'lentils', type: 'main course', target: 10 },
  { id: 'LEG-02', includeIngredients: 'chickpeas', type: 'main course', target: 10 },
  { id: 'LEG-03', includeIngredients: 'white beans', type: 'main course', target: 8 },
  { id: 'LEG-04', includeIngredients: 'black beans', diet: 'vegetarian', target: 8 },
  { id: 'LEG-05', includeIngredients: 'quinoa', diet: 'vegetarian', target: 8 },
  { id: 'LEG-06', includeIngredients: 'farro', target: 6 },
  
  // === SIMPLE FISH ===
  { id: 'FSH-01', includeIngredients: 'tilapia', target: 8 },
  { id: 'FSH-02', includeIngredients: 'cod', target: 8 },
  { id: 'FSH-03', includeIngredients: 'halibut', target: 6 },
  { id: 'FSH-04', includeIngredients: 'sea bass', target: 6 },
  { id: 'FSH-05', type: 'main course', query: 'fish', maxReadyTime: 30, target: 8 },
  
  // === PROTEIN SALADS ===
  { id: 'SAL-01', type: 'salad', includeIngredients: 'grilled chicken', target: 8 },
  { id: 'SAL-02', type: 'salad', includeIngredients: 'shrimp', target: 8 },
  { id: 'SAL-03', type: 'salad', includeIngredients: 'salmon', target: 6 },
  { id: 'SAL-04', type: 'salad', includeIngredients: 'steak', target: 6 },
  { id: 'SAL-05', type: 'salad', includeIngredients: 'chickpeas', target: 6 },
  
  // === KID-FRIENDLY ===
  { id: 'KID-01', query: 'kid friendly', type: 'breakfast', target: 8 },
  { id: 'KID-02', query: 'kid friendly', type: 'lunch', target: 8 },
  { id: 'KID-03', query: 'kid friendly', type: 'dinner', target: 8 },
  { id: 'KID-04', query: 'kid friendly', includeIngredients: 'chicken', target: 8 },
  { id: 'KID-05', query: 'kid friendly', includeIngredients: 'pasta', target: 8 },
  { id: 'KID-06', query: 'kid friendly', diet: 'vegetarian', target: 8 },
  { id: 'KID-07', query: 'toddler', target: 6 },
  { id: 'KID-08', query: 'baby led weaning', target: 6 },
  { id: 'KID-09', query: 'finger foods', target: 6 },
  { id: 'KID-10', query: 'lunch box', target: 6 }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

function extractInstructions(spoonacularRecipe) {
  if (spoonacularRecipe.instructions && typeof spoonacularRecipe.instructions === 'string') {
    const cleaned = spoonacularRecipe.instructions.trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }
  
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
  
  if (query.cuisine) url.searchParams.set('cuisine', query.cuisine);
  if (query.diet) url.searchParams.set('diet', query.diet);
  if (query.type) url.searchParams.set('type', query.type);
  if (query.query) url.searchParams.set('query', query.query);
  if (query.includeIngredients) url.searchParams.set('includeIngredients', query.includeIngredients);
  if (query.maxReadyTime) url.searchParams.set('maxReadyTime', query.maxReadyTime);
  if (query.minReadyTime) url.searchParams.set('minReadyTime', query.minReadyTime);

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

async function downloadImage(spoonacularId, imageUrl) {
  if (!imageUrl) return null;
  
  const filename = `${spoonacularId}.jpg`;
  const filepath = path.join(CONFIG.imageDir, filename);
  
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

function transformRecipe(sp, searchSource) {
  let imageUrl = sp.image;
  if (imageUrl && !imageUrl.includes(CONFIG.imageSize)) {
    imageUrl = imageUrl.replace(/\d+x\d+/, CONFIG.imageSize);
  }
  
  const ingredients = (sp.extendedIngredients || []).map(ing => ({
    name: ing.name || ing.original,
    quantity: ing.amount || 0,
    unit: ing.unit || '',
    category: ing.aisle || 'other',
    healthImpact: 'neutral'
  }));
  
  const proteinSources = extractProteinSources(sp.extendedIngredients);
  
  let mealSlots = ['lunch', 'dinner'];
  if (sp.dishTypes) {
    if (sp.dishTypes.some(t => t.toLowerCase().includes('breakfast') || t.toLowerCase().includes('brunch'))) {
      mealSlots = ['breakfast'];
    } else if (sp.dishTypes.some(t => t.toLowerCase().includes('snack') || t.toLowerCase().includes('appetizer'))) {
      mealSlots = ['snack'];
    }
  }
  
  return {
    _schemaVersion: 2,
    recipeId: `recipe_${sp.id}`,
    name: sp.title,
    source: 'spoonacular',
    spoonacularId: sp.id,
    image: null,
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
    
    dietCompassScores: null,
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

async function loadExistingCatalog() {
  const catalogPath = path.join(CONFIG.outputDir, 'vanessa_recipe_catalog.json');
  
  if (!existsSync(catalogPath)) {
    console.log('⚠️  No existing catalog found - will create new one');
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
    
    console.log(`📂 Loaded ${catalog.recipes.length} existing recipes`);
    console.log(`   Will avoid duplicating these Spoonacular IDs\n`);
    return { recipes: catalog.recipes, recipeMap };
    
  } catch (error) {
    console.error(`❌ Could not load existing catalog: ${error.message}`);
    return { recipes: [], recipeMap: new Map() };
  }
}

async function extractCustomRecipes() {
  console.log('🚀 Custom Recipe Extraction (Round 3 - Broader Searches)\n');
  console.log('📋 Searching by cuisine + ingredient combinations:');
  console.log('   - Mediterranean with specific veggies');
  console.log('   - Middle Eastern with yogurt/cucumber');
  console.log('   - African & Spanish cuisines');
  console.log('   - Legume & grain main courses');
  console.log('   - Simple fish by type (tilapia, cod, halibut)');
  console.log('   - Protein salads with different proteins');
  console.log('   - Kid-friendly by meal type & ingredient\n');
  console.log(`🎯 Target: ~100 total new recipes (${CONFIG.targetRecipes} with buffer)\n`);

  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env');
    console.log('Please add: SPOONACULAR_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log('📁 Creating directories...');
  await mkdir(CONFIG.imageDir, { recursive: true });
  await mkdir(CONFIG.outputDir, { recursive: true });
  console.log('✅ Directories ready\n');

  const { recipes: existingRecipes, recipeMap } = await loadExistingCatalog();
  const initialCount = recipeMap.size;

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
      console.log(`  Found: ${recipes.length} | New: ${newRecipes} | Dupes: ${duplicatesSkipped}`);
      
      await sleep(CONFIG.requestDelay);
      
      if (newRecipes >= CONFIG.targetRecipes) {
        console.log(`\n✅ Reached target of ${CONFIG.targetRecipes} new recipes\n`);
        break;
      }
      
    } catch (error) {
      console.error(`❌ Query ${query.id} failed:`, error.message);
      await sleep(2000);
    }
  }

  const allRecipes = Array.from(recipeMap.values());
  console.log(`\n📊 Extraction Summary:`);
  console.log(`   Starting catalog: ${initialCount} recipes`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   New recipes added: ${newRecipes}`);
  console.log(`   Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`   Final catalog: ${allRecipes.length} recipes\n`);

  console.log('🖼️  Downloading images...\n');
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  let imagesSkipped = 0;
  
  for (let i = 0; i < allRecipes.length; i++) {
    const recipe = allRecipes[i];
    
    // Skip if already has local image
    if (recipe.image && existsSync(path.join(PROJECT_ROOT, 'public', recipe.image))) {
      imagesSkipped++;
      continue;
    }
    
    if (recipe.imageUrl) {
      const localPath = await downloadImage(recipe.spoonacularId, recipe.imageUrl);
      
      if (localPath) {
        recipe.image = localPath;
        imagesDownloaded++;
      } else {
        imagesFailed++;
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${allRecipes.length} | Downloaded: ${imagesDownloaded} | Skipped: ${imagesSkipped} | Failed: ${imagesFailed}`);
      }
      
      await sleep(CONFIG.imageDelay);
    }
  }
  
  console.log(`\n✅ Images complete: ${imagesDownloaded} downloaded, ${imagesSkipped} skipped, ${imagesFailed} failed\n`);

  console.log('💾 Saving catalog...');
  
  const catalog = {
    _catalogVersion: '2.0.0',
    _lastUpdated: new Date().toISOString(),
    _count: allRecipes.length,
    _source: 'Spoonacular (Custom Extraction)',
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
  
  console.log('📊 FINAL CATALOG:');
  const cuisines = new Set();
  const proteins = new Set();
  let mediterranean = 0;
  let middleEastern = 0;
  let salads = 0;
  let kidFriendly = 0;
  
  allRecipes.forEach(r => {
    r.tags.cuisines?.forEach(c => {
      cuisines.add(c);
      if (c.toLowerCase().includes('mediterranean')) mediterranean++;
      if (c.toLowerCase().includes('middle eastern')) middleEastern++;
    });
    r.tags.proteinSources?.forEach(p => proteins.add(p));
    if (r.tags.dishTypes?.includes('salad')) salads++;
    if (r.name.toLowerCase().includes('kid') || r._searchSource?.includes('KID-')) kidFriendly++;
  });
  
  console.log(`   Total recipes: ${allRecipes.length}`);
  console.log(`   Mediterranean: ${mediterranean} recipes`);
  console.log(`   Middle Eastern: ${middleEastern} recipes`);
  console.log(`   Salads: ${salads} recipes`);
  console.log(`   Kid-friendly: ${kidFriendly} recipes`);
  console.log(`   Unique cuisines: ${cuisines.size}`);
  console.log(`   Unique proteins: ${proteins.size}\n`);
  
  console.log('🎉 Extraction complete!');
}

extractCustomRecipes().catch(error => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});
