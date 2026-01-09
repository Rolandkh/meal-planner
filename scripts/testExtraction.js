#!/usr/bin/env node
/**
 * TEST EXTRACTION - Just 3 recipes
 * Verify high-res images and instructions work before full run
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const imageDir = path.join(__dirname, '../public/images/recipes');

const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  baseUrl: 'https://api.spoonacular.com',
  imageSize: '636x393',
  testCount: 3
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch recipe details with instructions
 */
async function fetchRecipeDetails(recipeId) {
  const url = new URL(`/recipes/${recipeId}/information`, CONFIG.baseUrl);
  url.searchParams.set('includeNutrition', 'true');
  url.searchParams.set('apiKey', CONFIG.apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`❌ Recipe ${recipeId}: HTTP ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ Recipe ${recipeId}:`, error.message);
    return null;
  }
}

/**
 * Download high-res image
 */
async function downloadImage(spoonacularId) {
  const filename = `${spoonacularId}.jpg`;
  const filepath = path.join(imageDir, filename);
  
  // Delete old low-res image
  try {
    await unlink(filepath);
    console.log(`  🗑️  Deleted old image: ${spoonacularId}`);
  } catch (e) {
    // File might not exist
  }
  
  // Download high-res
  const imageUrl = `https://spoonacular.com/recipeImages/${spoonacularId}-${CONFIG.imageSize}.jpg`;
  
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    
    console.log(`  ✅ Downloaded high-res: ${spoonacularId}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Image ${spoonacularId}:`, error.message);
    return false;
  }
}

/**
 * Extract instructions from Spoonacular data
 */
function extractInstructions(recipe) {
  // Try simple instructions first
  if (recipe.instructions && typeof recipe.instructions === 'string') {
    const cleaned = recipe.instructions.trim();
    if (cleaned.length > 20) {
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

async function main() {
  console.log('🧪 TEST EXTRACTION - 3 Recipes\n');
  console.log(`Image size: ${CONFIG.imageSize}`);
  console.log(`API key: ${CONFIG.apiKey ? '✅ Found' : '❌ Missing'}`);
  console.log();
  
  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env');
    process.exit(1);
  }
  
  // Load catalog
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const testRecipes = catalog.recipes.slice(0, CONFIG.testCount);
  
  console.log(`Testing with ${testRecipes.length} recipes:\n`);
  testRecipes.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (ID: ${r.spoonacularId})`);
  });
  console.log();
  
  // Process each test recipe
  for (let i = 0; i < testRecipes.length; i++) {
    const recipe = testRecipes[i];
    console.log(`\n📝 Processing: ${recipe.name}`);
    console.log('─'.repeat(60));
    
    // 1. Download high-res image
    console.log('📸 Downloading high-res image...');
    await downloadImage(recipe.spoonacularId);
    
    // 2. Fetch instructions
    console.log('📋 Fetching instructions...');
    const details = await fetchRecipeDetails(recipe.spoonacularId);
    
    if (details) {
      const instructions = extractInstructions(details);
      
      // Update in catalog
      const catalogRecipe = catalog.recipes.find(r => r.spoonacularId === recipe.spoonacularId);
      if (catalogRecipe) {
        catalogRecipe.instructions = instructions;
        console.log(`  ✅ Instructions: ${instructions.length} characters`);
        console.log(`  Preview: ${instructions.substring(0, 80)}...`);
      }
    }
    
    await sleep(600);  // Rate limit safety
  }
  
  // Save updated catalog
  console.log('\n💾 Saving test results to catalog...');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  
  // Verification
  console.log('\n🔍 VERIFICATION:\n');
  const updated = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  
  for (let i = 0; i < CONFIG.testCount; i++) {
    const r = updated.recipes[i];
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Ingredients: ${r.ingredients.length} ✅`);
    console.log(`   Instructions: ${r.instructions.substring(0, 60)}...`);
    console.log(`   Health Score: ${r.dietCompassScores?.overall || 'null'}`);
    console.log();
  }
  
  // Check image dimensions
  console.log('📏 Checking image dimensions...\n');
  const { execSync } = await import('child_process');
  for (let i = 0; i < CONFIG.testCount; i++) {
    const id = testRecipes[i].spoonacularId;
    try {
      const result = execSync(`sips -g pixelWidth -g pixelHeight public/images/recipes/${id}.jpg`).toString();
      console.log(`Image ${id}:`);
      console.log(result);
    } catch (e) {
      console.log(`Could not check dimensions for ${id}`);
    }
  }
  
  console.log('\n✅ TEST COMPLETE!\n');
  console.log('If everything looks good:');
  console.log('  → Images are 636x393');
  console.log('  → Instructions are present');
  console.log('  → Recipes display in app');
  console.log('\nThen run: node scripts/fullExtraction.js');
}

main().catch(console.error);
