/**
 * Test what image sizes are available from Spoonacular
 * Tests different size parameters to find the largest available
 */

import dotenv from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const CONFIG = {
  apiKey: process.env.SPOONACULAR_API_KEY,
  outputDir: path.join(PROJECT_ROOT, 'test-output/image-sizes')
};

// Test these image size patterns
const IMAGE_SIZES = [
  '90x90',
  '240x150',
  '312x231',
  '480x360',
  '556x370',
  '636x393',
  '1200x800',  // Test larger sizes
  '1920x1080',
  'original'    // Test if original is available
];

async function testImageSizes() {
  console.log('🖼️  Testing Spoonacular Image Sizes\n');
  
  if (!CONFIG.apiKey) {
    console.error('❌ SPOONACULAR_API_KEY not found');
    process.exit(1);
  }
  
  await mkdir(CONFIG.outputDir, { recursive: true });
  
  // Get a test recipe
  console.log('📡 Fetching a test recipe...\n');
  const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?number=1&apiKey=${CONFIG.apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const recipeId = searchData.results[0].id;
  
  console.log(`Testing with recipe ID: ${recipeId}\n`);
  console.log('Size          | Status | File Size | Download');
  console.log('-'.repeat(60));
  
  const results = [];
  
  for (const size of IMAGE_SIZES) {
    const url = `https://img.spoonacular.com/recipes/${recipeId}-${size}.jpg`;
    
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(3);
      const sizeKB = (buffer.byteLength / 1024).toFixed(1);
      
      if (response.ok && buffer.byteLength > 1000) {
        // Save the image
        const filename = `test-${recipeId}-${size}.jpg`;
        const filepath = path.join(CONFIG.outputDir, filename);
        await writeFile(filepath, Buffer.from(buffer));
        
        results.push({ size, sizeKB, sizeMB, url, status: '✅' });
        console.log(`${size.padEnd(13)} | ✅     | ${sizeKB.padStart(7)} KB | ${filepath}`);
      } else {
        results.push({ size, status: '❌', reason: 'Not available' });
        console.log(`${size.padEnd(13)} | ❌     | N/A       | Not available`);
      }
    } catch (error) {
      results.push({ size, status: '❌', reason: error.message });
      console.log(`${size.padEnd(13)} | ❌     | N/A       | Error: ${error.message}`);
    }
    
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  
  const available = results.filter(r => r.status === '✅');
  if (available.length > 0) {
    const largest = available.reduce((max, curr) => 
      parseFloat(curr.sizeKB) > parseFloat(max.sizeKB) ? curr : max
    );
    
    console.log(`✅ ${available.length} sizes available`);
    console.log(`📏 Largest size: ${largest.size} (${largest.sizeKB} KB)`);
    console.log(`🔗 Best URL pattern: https://img.spoonacular.com/recipes/{id}-${largest.size}.jpg\n`);
    
    console.log('📁 All test images saved in: test-output/image-sizes/\n');
  } else {
    console.log('❌ No images were successfully downloaded\n');
  }
}

testImageSizes().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
