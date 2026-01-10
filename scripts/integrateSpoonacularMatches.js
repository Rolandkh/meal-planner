/**
 * Integrate Spoonacular Matches into Dictionary
 * 
 * Takes parsed Spoonacular results and adds validated ingredients
 * to ingredientMaster.json, following schema v3.0.0.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== INTEGRATE SPOONACULAR MATCHES ===\n');

// Load Spoonacular parse results
const matchesPath = path.join(__dirname, '../tmp/spoonacular_matches.json');

if (!fs.existsSync(matchesPath)) {
  console.error('❌ ERROR: spoonacular_matches.json not found');
  console.error('   Run: node scripts/parseViaSpoonacular.js first');
  process.exit(1);
}

const matchData = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
console.log('Loaded Spoonacular results');
console.log('Total processed:', matchData.totalProcessed);
console.log('Successful:', matchData.successful);
console.log();

// Load current dictionary
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

console.log('Current dictionary:', master._totalEntries, 'entries');
console.log();

// Process successful matches
const newIngredients = {};
const skipped = [];
let added = 0;

matchData.results
  .filter(r => r.spoonacular && r.spoonacular.name)
  .forEach(result => {
    const spoon = result.spoonacular;
    const original = result.original;
    
    // Create ingredient ID from Spoonacular name
    const id = spoon.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Skip if already exists
    if (master.ingredients[id]) {
      skipped.push({ id, reason: 'already_exists' });
      return;
    }
    
    // Skip if too similar to existing (simple check)
    const similarExists = Object.keys(master.ingredients).some(existingId => {
      const similarity = levenshteinDistance(id, existingId);
      return similarity <= 2; // Very similar ID
    });
    
    if (similarExists) {
      skipped.push({ id, reason: 'similar_exists' });
      return;
    }
    
    // Determine state from original
    let state = original.state || 'other';
    
    // Adjust based on Spoonacular category if available
    if (spoon.categoryPath) {
      const category = spoon.categoryPath[0]?.toLowerCase() || '';
      if (category.includes('fresh') || category.includes('produce')) {
        state = 'fresh';
      }
    }
    
    // Determine canonical unit
    let canonicalUnit = 'g';
    if (spoon.possibleUnits) {
      if (spoon.possibleUnits.includes('ml')) {
        canonicalUnit = 'ml';
      } else if (spoon.possibleUnits.includes('whole') || spoon.possibleUnits.includes('piece')) {
        canonicalUnit = 'whole';
      }
    }
    
    // Extract category
    let category = 'other';
    let subCategory = null;
    
    if (spoon.categoryPath && spoon.categoryPath.length > 0) {
      const mainCat = spoon.categoryPath[0].toLowerCase();
      
      if (mainCat.includes('vegetable') || mainCat.includes('produce')) {
        category = 'vegetable';
      } else if (mainCat.includes('meat') || mainCat.includes('poultry') || mainCat.includes('seafood')) {
        category = 'protein';
      } else if (mainCat.includes('dairy') || mainCat.includes('milk') || mainCat.includes('cheese')) {
        category = 'dairy';
      } else if (mainCat.includes('grain') || mainCat.includes('pasta') || mainCat.includes('bread')) {
        category = 'grain';
      } else if (mainCat.includes('spice') || mainCat.includes('herb')) {
        category = 'spice';
      }
      
      if (spoon.categoryPath.length > 1) {
        subCategory = spoon.categoryPath[1];
      }
    }
    
    // Build density from nutrition if available
    let density = { gPerCup: null, gPerTbsp: null, gPerTsp: null };
    
    // Spoonacular sometimes provides this in nutrition.weightPerServing
    // For now, leave null and we can enrich later
    
    // Create ingredient entry
    newIngredients[id] = {
      id,
      displayName: spoon.name,
      canonicalUnit,
      state,
      density,
      aliases: [
        spoon.name.toLowerCase(),
        original.identity.toLowerCase()
      ].filter((v, i, a) => a.indexOf(v) === i), // Unique
      category,
      subCategory,
      tags: [],
      metadata: {
        spoonacularId: spoon.id || null,
        source: 'spoonacular',
        usageCount: original.count,
        examples: original.examples
      }
    };
    
    added++;
  });

console.log('=== PROCESSING COMPLETE ===\n');
console.log(`New ingredients prepared: ${added}`);
console.log(`Skipped: ${skipped.length}`);
console.log();

if (skipped.length > 0 && skipped.length <= 20) {
  console.log('Skipped items:');
  skipped.forEach(item => {
    console.log(`  - ${item.id} (${item.reason})`);
  });
  console.log();
}

// Add to master dictionary
for (const [id, ingredient] of Object.entries(newIngredients)) {
  master.ingredients[id] = ingredient;
}

// Update metadata
const newTotal = Object.keys(master.ingredients).length;
master._version = '3.1.0';
master._lastUpdated = new Date().toISOString();
master._totalEntries = newTotal;
master._coverage = 'Enhanced with Spoonacular-validated ingredients';

// Save updated dictionary
fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));

console.log('=== DICTIONARY UPDATED ===');
console.log(`Added: ${added} new ingredients`);
console.log(`Total entries: ${newTotal} (was ${master._totalEntries - added})`);
console.log(`New version: ${master._version}`);
console.log();
console.log(`Updated: ${masterPath}`);
console.log();

// Save integration report
const reportPath = path.join(__dirname, '../tmp/spoonacular_integration_report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  added: added,
  skipped: skipped.length,
  previousTotal: master._totalEntries - added,
  newTotal: newTotal,
  newIngredients: Object.keys(newIngredients)
}, null, 2));

console.log(`Integration report: ${reportPath}`);
console.log();
console.log('Next step: node scripts/evaluateNormalizationImprovements.js');

// Helper: Simple Levenshtein for similarity check
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
