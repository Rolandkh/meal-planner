/**
 * Parse Ingredients via Spoonacular API
 * 
 * Takes unmatched ingredients and batch-parses them using
 * Spoonacular's /recipes/parseIngredients endpoint.
 * 
 * Handles rate limiting and quota management.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
config({ path: path.join(__dirname, '../.env') });

// Load API key from environment
const API_KEY = process.env.SPOONACULAR_API_KEY;

if (!API_KEY) {
  console.error('❌ ERROR: SPOONACULAR_API_KEY not found in environment');
  console.error('   Please set it in .env file or export it:');
  console.error('   export SPOONACULAR_API_KEY=your_key_here');
  process.exit(1);
}

console.log('=== SPOONACULAR BATCH INGREDIENT PARSER ===\n');
console.log('✅ API Key loaded');
console.log();

// Load unmatched ingredients
const inputPath = path.join(__dirname, '../tmp/unmatched_for_spoonacular.json');
const unmatchedList = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log('Loaded:', unmatchedList.length, 'ingredients to parse');
console.log();

// Configuration
const BATCH_SIZE = 100; // Spoonacular supports up to 100 per request
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay
const MAX_BATCHES = 10; // Safety limit (can adjust)

// Helper: Make API request
function parseIngredients(ingredientLines) {
  return new Promise((resolve, reject) => {
    // Spoonacular expects form data, not JSON
    const ingredientList = ingredientLines.join('\n');
    const servings = '1';
    
    const formData = `ingredientList=${encodeURIComponent(ingredientList)}&servings=${servings}`;
    
    const options = {
      hostname: 'api.spoonacular.com',
      path: `/recipes/parseIngredients?apiKey=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${error.message}`));
          }
        } else if (res.statusCode === 402) {
          reject(new Error('Quota exceeded - upgrade plan or wait for reset'));
        } else if (res.statusCode === 429) {
          reject(new Error('Rate limit exceeded - slow down requests'));
        } else {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(formData);
    req.end();
  });
}

// Helper: Delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Process in batches
async function processBatches() {
  const results = [];
  const totalBatches = Math.min(
    Math.ceil(unmatchedList.length / BATCH_SIZE),
    MAX_BATCHES
  );
  
  console.log(`Processing ${unmatchedList.length} ingredients in ${totalBatches} batch(es)...\n`);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, unmatchedList.length);
    const batch = unmatchedList.slice(start, end);
    
    console.log(`Batch ${i + 1}/${totalBatches}: Processing ${batch.length} ingredients (${start + 1}-${end})...`);
    
    try {
      const ingredientLines = batch.map(item => item.ingredientLine);
      const parsed = await parseIngredients(ingredientLines);
      
      // Combine with original metadata
      parsed.forEach((spoonResult, idx) => {
        results.push({
          original: batch[idx],
          spoonacular: spoonResult
        });
      });
      
      console.log(`  ✅ Success - parsed ${parsed.length} ingredients`);
      
      // Check quota info if available
      if (parsed.length > 0 && parsed[0].quotaUsed !== undefined) {
        console.log(`  📊 Quota used: ${parsed[0].quotaUsed}`);
      }
      
    } catch (error) {
      console.error(`  ❌ Batch ${i + 1} failed:`, error.message);
      
      // Save partial results
      if (results.length > 0) {
        console.log(`  💾 Saving ${results.length} partial results...`);
        const partialPath = path.join(__dirname, '../tmp/spoonacular_matches_partial.json');
        fs.writeFileSync(partialPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          totalProcessed: results.length,
          totalRequested: unmatchedList.length,
          results
        }, null, 2));
      }
      
      // Exit if quota or rate limit
      if (error.message.includes('Quota') || error.message.includes('Rate limit')) {
        console.log('\n⚠️  Stopping due to API limits');
        process.exit(1);
      }
      
      // Otherwise continue with next batch
      console.log('  ⏭️  Continuing to next batch...');
    }
    
    // Delay between batches (respect rate limits)
    if (i < totalBatches - 1) {
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
  
  return results;
}

// Run
console.log('Starting batch processing...\n');
console.log('⏳ This may take a few minutes depending on API rate limits\n');

processBatches().then(results => {
  console.log('\n=== PARSING COMPLETE ===\n');
  
  // Analyze results
  const successful = results.filter(r => r.spoonacular && r.spoonacular.name);
  const failed = results.filter(r => !r.spoonacular || !r.spoonacular.name);
  
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed.length}`);
  console.log();
  
  // Save results
  const outputPath = path.join(__dirname, '../tmp/spoonacular_matches.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalProcessed: results.length,
    successful: successful.length,
    failed: failed.length,
    results
  }, null, 2));
  
  console.log(`Results saved to: ${outputPath}`);
  console.log();
  
  // Show examples
  if (successful.length > 0) {
    console.log('✅ Example successful matches:');
    successful.slice(0, 10).forEach(item => {
      console.log(`   "${item.original.identity}" → "${item.spoonacular.name}" (ID: ${item.spoonacular.id || 'N/A'})`);
    });
    console.log();
  }
  
  if (failed.length > 0 && failed.length <= 10) {
    console.log('❌ Failed to parse:');
    failed.forEach(item => {
      console.log(`   "${item.original.identity}"`);
    });
    console.log();
  }
  
  console.log('Next step: node scripts/integrateSpoonacularMatches.js');
  
}).catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  process.exit(1);
});
