/**
 * Test script to extract a single recipe from Spoonacular
 * Tests: API access, recipe details, instructions, and high-res image download
 * 
 * Usage: node scripts/test-single-recipe.js [recipeId]
 * Example: node scripts/test-single-recipe.js 715538
 * 
 * If no recipeId provided, searches for a random healthy recipe
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

const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  baseUrl: 'https://api.spoonacular.com',
  imageSize: '636x393',  // High-res
  outputDir: path.join(PROJECT_ROOT, 'test-output'),
};

/**
 * Extract and format instructions
 */
function extractInstructions(recipe) {
  // Try simple instructions first
  if (recipe.instructions && typeof recipe.instructions === 'string') {
    const cleaned = recipe.instructions.trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }
  
  // Parse analyzedInstructions
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
 * Search for a random recipe
 */
async function searchRandomRecipe() {
  const url = new URL('/recipes/complexSearch', CONFIG.baseUrl);
  url.searchParams.set('number', '1');
  url.searchParams.set('sort', 'random');
  url.searchParams.set('addRecipeInformation', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);

  console.log('🔍 Searching for a random recipe...\n');
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error('No recipes found');
  }
  
  return data.results[0].id;
}

/**
 * Fetch full recipe details
 */
async function fetchRecipeDetails(recipeId) {
  const url = new URL(`/recipes/${recipeId}/information`, CONFIG.baseUrl);
  url.searchParams.set('includeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);

  console.log(`📡 Fetching recipe ${recipeId} with full details...\n`);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fetch failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // Log API quota info
  console.log('📊 API Quota:');
  console.log(`   Points used: ${response.headers.get('X-API-Quota-Used') || 'unknown'}`);
  console.log(`   Points limit: ${response.headers.get('X-API-Quota-Limit') || 'unknown'}`);
  console.log(`   Request count: ${response.headers.get('X-API-Quota-Request') || 'unknown'}\n`);
  
  return data;
}

/**
 * Download high-res image
 */
async function downloadImage(recipeId, imageUrl) {
  if (!imageUrl) {
    console.log('⚠️  No image URL provided\n');
    return null;
  }
  
  console.log('📸 Downloading high-res image...');
  console.log(`   URL: ${imageUrl}\n`);
  
  const filename = `${recipeId}.jpg`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    
    const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
    console.log(`✅ Image downloaded: ${filename} (${sizeMB} MB)\n`);
    
    return filepath;
    
  } catch (error) {
    console.error(`❌ Image download failed: ${error.message}\n`);
    return null;
  }
}

/**
 * Format recipe data for display
 */
function formatRecipe(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    source: recipe.sourceName || 'Spoonacular',
    sourceUrl: recipe.sourceUrl,
    image: recipe.image,
    
    timing: {
      prepMinutes: recipe.preparationMinutes,
      cookMinutes: recipe.cookingMinutes,
      totalMinutes: recipe.readyInMinutes,
      servings: recipe.servings
    },
    
    ingredients: (recipe.extendedIngredients || []).map(ing => ({
      name: ing.nameClean || ing.name || ing.originalName,
      amount: ing.measures?.metric?.amount || ing.amount,
      unit: ing.measures?.metric?.unitShort || ing.unit || '',
      original: ing.original
    })),
    
    instructions: extractInstructions(recipe),
    
    nutrition: recipe.nutrition ? {
      calories: recipe.nutrition.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
      protein: recipe.nutrition.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
      fat: recipe.nutrition.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
      carbs: recipe.nutrition.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
      fiber: recipe.nutrition.nutrients?.find(n => n.name === 'Fiber')?.amount || 0,
      sugar: recipe.nutrition.nutrients?.find(n => n.name === 'Sugar')?.amount || 0,
      saturatedFat: recipe.nutrition.nutrients?.find(n => n.name === 'Saturated Fat')?.amount || 0,
      sodium: recipe.nutrition.nutrients?.find(n => n.name === 'Sodium')?.amount || 0
    } : null,
    
    tags: {
      cuisines: recipe.cuisines || [],
      diets: recipe.diets || [],
      dishTypes: recipe.dishTypes || [],
      occasions: recipe.occasions || []
    },
    
    properties: {
      vegetarian: recipe.vegetarian,
      vegan: recipe.vegan,
      glutenFree: recipe.glutenFree,
      dairyFree: recipe.dairyFree,
      veryHealthy: recipe.veryHealthy,
      cheap: recipe.cheap,
      veryPopular: recipe.veryPopular,
      sustainable: recipe.sustainable
    },
    
    raw: recipe  // Include full raw response for inspection
  };
}

/**
 * Main test function
 */
async function testRecipeExtraction() {
  console.log('🧪 Spoonacular Single Recipe Extraction Test\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Check API key
  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env');
    console.log('Please add: SPOONACULAR_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  console.log('✅ API key found\n');

  // Create output directory
  await mkdir(CONFIG.outputDir, { recursive: true });
  console.log('✅ Output directory ready\n');

  try {
    // Get recipe ID (from args or search)
    let recipeId = process.argv[2];
    
    if (!recipeId) {
      recipeId = await searchRandomRecipe();
      console.log(`✅ Found random recipe: ${recipeId}\n`);
    } else {
      console.log(`📝 Using provided recipe ID: ${recipeId}\n`);
    }
    
    // Fetch full details
    const rawRecipe = await fetchRecipeDetails(recipeId);
    console.log('✅ Recipe details fetched\n');
    
    // Download image
    const imagePath = await downloadImage(recipeId, rawRecipe.image);
    
    // Format recipe
    const recipe = formatRecipe(rawRecipe);
    
    // Save JSON
    const jsonPath = path.join(CONFIG.outputDir, `recipe-${recipeId}.json`);
    await writeFile(jsonPath, JSON.stringify(recipe, null, 2));
    console.log(`✅ Recipe JSON saved: ${jsonPath}\n`);
    
    // Display summary
    console.log('='.repeat(60));
    console.log('📋 RECIPE SUMMARY\n');
    console.log(`Title: ${recipe.title}`);
    console.log(`ID: ${recipe.id}`);
    console.log(`Source: ${recipe.source}`);
    console.log(`URL: ${recipe.sourceUrl || 'N/A'}\n`);
    
    console.log('⏱️  Timing:');
    console.log(`   Prep: ${recipe.timing.prepMinutes || 'N/A'} min`);
    console.log(`   Cook: ${recipe.timing.cookMinutes || 'N/A'} min`);
    console.log(`   Total: ${recipe.timing.totalMinutes || 'N/A'} min`);
    console.log(`   Servings: ${recipe.timing.servings}\n`);
    
    console.log('🥗 Ingredients:');
    recipe.ingredients.slice(0, 5).forEach(ing => {
      console.log(`   - ${ing.original}`);
    });
    if (recipe.ingredients.length > 5) {
      console.log(`   ... and ${recipe.ingredients.length - 5} more\n`);
    } else {
      console.log('');
    }
    
    console.log('📝 Instructions:');
    const instructionLines = recipe.instructions.split('\n');
    instructionLines.slice(0, 3).forEach(line => {
      console.log(`   ${line.trim()}`);
    });
    if (instructionLines.length > 3) {
      console.log(`   ... (${instructionLines.length} total steps)\n`);
    } else {
      console.log('');
    }
    
    if (recipe.nutrition) {
      console.log('📊 Nutrition (per serving):');
      console.log(`   Calories: ${Math.round(recipe.nutrition.calories)} kcal`);
      console.log(`   Protein: ${Math.round(recipe.nutrition.protein)}g`);
      console.log(`   Carbs: ${Math.round(recipe.nutrition.carbs)}g`);
      console.log(`   Fat: ${Math.round(recipe.nutrition.fat)}g`);
      console.log(`   Fiber: ${Math.round(recipe.nutrition.fiber)}g\n`);
    }
    
    console.log('🏷️  Tags:');
    console.log(`   Cuisines: ${recipe.tags.cuisines.join(', ') || 'none'}`);
    console.log(`   Diets: ${recipe.tags.diets.join(', ') || 'none'}`);
    console.log(`   Dish Types: ${recipe.tags.dishTypes.join(', ') || 'none'}\n`);
    
    console.log('✨ Properties:');
    Object.entries(recipe.properties).forEach(([key, value]) => {
      if (value) console.log(`   ✓ ${key}`);
    });
    console.log('');
    
    if (imagePath) {
      console.log(`📸 Image: ${imagePath}\n`);
    }
    
    console.log('='.repeat(60));
    console.log('\n✅ TEST COMPLETE!\n');
    console.log('📁 Files saved in: test-output/');
    console.log(`   - recipe-${recipeId}.json`);
    if (imagePath) console.log(`   - ${recipeId}.jpg`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    if (error.stack) console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run test
testRecipeExtraction();
