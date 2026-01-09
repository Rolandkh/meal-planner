#!/usr/bin/env node
/**
 * Re-download images at higher resolution
 * Uses existing recipe IDs from catalog, doesn't need API calls
 */

import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const imageDir = path.join(__dirname, '../public/images/recipes');

const IMAGE_SIZE = '636x393';  // High-res size
const PARALLEL = 10;  // Download 10 at a time
const DELAY = 100;    // ms between batches

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(spoonacularId) {
  const filename = `${spoonacularId}.jpg`;
  const filepath = path.join(imageDir, filename);
  
  // Delete old image
  try {
    await unlink(filepath);
  } catch (e) {
    // File might not exist, that's ok
  }
  
  // Construct Spoonacular image URL
  const imageUrl = `https://spoonacular.com/recipeImages/${spoonacularId}-${IMAGE_SIZE}.jpg`;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));
      
      return true;
      
    } catch (error) {
      if (attempt === 2) {
        console.error(`❌ Failed ${spoonacularId}:`, error.message);
        return false;
      }
      await sleep(500);
    }
  }
  
  return false;
}

async function main() {
  console.log('📸 Re-downloading images at HIGH RESOLUTION');
  console.log(`Size: ${IMAGE_SIZE}\n`);
  
  // Load catalog
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const recipes = catalog.recipes || [];
  
  console.log(`Total recipes: ${recipes.length}\n`);
  
  let downloaded = 0;
  let failed = 0;
  
  // Process in batches
  for (let i = 0; i < recipes.length; i += PARALLEL) {
    const batch = recipes.slice(i, i + PARALLEL);
    
    await Promise.all(
      batch.map(async (recipe) => {
        const success = await downloadImage(recipe.spoonacularId);
        if (success) {
          downloaded++;
        } else {
          failed++;
        }
      })
    );
    
    console.log(`  Downloaded: ${downloaded}/${recipes.length} (${failed} failed)`);
    await sleep(DELAY);
  }
  
  console.log('\n✅ HIGH-RES IMAGE DOWNLOAD COMPLETE!');
  console.log(`Success: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log('\n🎨 All images are now 636x393 resolution!');
}

main().catch(console.error);
