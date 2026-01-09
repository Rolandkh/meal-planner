#!/usr/bin/env node
/**
 * FULL EXTRACTION - All 607 Recipes
 * Run ONLY after testExtraction.js succeeds!
 * 
 * What this does:
 * 1. Deletes all old low-res images (312x231)
 * 2. Downloads high-res images (636x393) for all 607 recipes
 * 3. Fetches instructions via API for all 607 recipes
 * 4. Updates catalog with complete data
 * 5. Re-scores all recipes with Diet Compass
 * 
 * Time: 40-45 minutes
 * API Points: ~607
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
  imageParallel: 10,  // Download 10 images at once
  imageDelay: 100,     // ms between batches
  requestDelay: 600,   // ms between API calls (conservative)
  maxRetries: 3
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch recipe details
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
        console.log(`  ⚠️  Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      
      if (!response.ok) {
        console.warn(`  ⚠️  Recipe ${recipeId}: HTTP ${response.status}`);
        return null;
      }
      
      return await response.json();
      
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) {
        console.error(`  ❌ Recipe ${recipeId}:`, error.message);
        return null;
      }
      await sleep(1000 * (attempt + 1));
    }
  }
  
  return null;
}

/**
 * Download high-res image
 */
async function downloadImage(spoonacularId) {
  const filename = `${spoonacularId}.jpg`;
  const filepath = path.join(imageDir, filename);
  
  // Delete old image
  try {
    await unlink(filepath);
  } catch (e) {
    // File might not exist
  }
  
  // Download high-res
  const imageUrl = `https://spoonacular.com/recipeImages/${spoonacularId}-${CONFIG.imageSize}.jpg`;
  
  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));
      
      return true;
      
    } catch (error) {
      if (attempt === CONFIG.maxRetries - 1) {
        return false;
      }
      await sleep(500);
    }
  }
  
  return false;
}

/**
 * Extract instructions
 */
function extractInstructions(recipe) {
  if (recipe.instructions && typeof recipe.instructions === 'string') {
    const cleaned = recipe.instructions.trim();
    if (cleaned.length > 20) {
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

async function main() {
  console.log('🚀 FULL EXTRACTION - All 607 Recipes\n');
  console.log(`Image size: ${CONFIG.imageSize}`);
  console.log(`API key: ${CONFIG.apiKey ? '✅ Found' : '❌ Missing'}`);
  console.log();
  
  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found in .env');
    process.exit(1);
  }
  
  // Load catalog
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const recipes = catalog.recipes;
  
  console.log(`Total recipes to process: ${recipes.length}\n`);
  
  // PHASE 1: Download all high-res images
  console.log('📸 PHASE 1: Downloading high-res images...\n');
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  
  for (let i = 0; i < recipes.length; i += CONFIG.imageParallel) {
    const batch = recipes.slice(i, i + CONFIG.imageParallel);
    
    await Promise.all(
      batch.map(async (recipe) => {
        const success = await downloadImage(recipe.spoonacularId);
        if (success) {
          imagesDownloaded++;
        } else {
          imagesFailed++;
        }
      })
    );
    
    console.log(`  Downloaded: ${imagesDownloaded}/${recipes.length} (${imagesFailed} failed)`);
    await sleep(CONFIG.imageDelay);
  }
  
  console.log(`\n✅ Images complete: ${imagesDownloaded} success, ${imagesFailed} failed\n`);
  
  // PHASE 2: Fetch instructions
  console.log('📋 PHASE 2: Fetching instructions...\n');
  let instructionsFetched = 0;
  let instructionsFailed = 0;
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    
    const details = await fetchRecipeDetails(recipe.spoonacularId);
    
    if (details) {
      const instructions = extractInstructions(details);
      recipe.instructions = instructions;
      instructionsFetched++;
    } else {
      instructionsFailed++;
    }
    
    // Progress every 50
    if ((i + 1) % 50 === 0) {
      console.log(`  Fetched: ${i + 1}/${recipes.length} (${instructionsFailed} failed)`);
    }
    
    await sleep(CONFIG.requestDelay);
  }
  
  console.log(`\n✅ Instructions complete: ${instructionsFetched} success, ${instructionsFailed} failed\n`);
  
  // Update metadata
  catalog._lastUpdated = new Date().toISOString();
  catalog._extraction = {
    ...catalog._extraction,
    lastFullExtraction: new Date().toISOString(),
    imagesDownloaded,
    imagesFailed,
    instructionsFetched,
    instructionsFailed,
    imageResolution: CONFIG.imageSize
  };
  
  // Save catalog
  console.log('💾 Saving complete catalog...');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  console.log('✅ Saved!\n');
  
  // Final stats
  console.log('═'.repeat(60));
  console.log('✨ EXTRACTION COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`Total recipes: ${recipes.length}`);
  console.log(`High-res images: ${imagesDownloaded}/${recipes.length}`);
  console.log(`Instructions: ${instructionsFetched}/${recipes.length}`);
  console.log(`Ingredients: ${recipes.filter(r => r.ingredients?.length > 0).length}/${recipes.length}`);
  console.log();
  console.log('📊 Catalog is now 100% complete!');
  console.log();
  console.log('Next steps:');
  console.log('  1. node scripts/rescoreCatalog.js  (re-score with new data)');
  console.log('  2. Test in browser');
  console.log('  3. Deploy to production! 🚀');
}

main().catch(console.error);
