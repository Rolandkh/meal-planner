/**
 * Normalize Existing Catalog Script
 * 
 * One-time migration to normalize all 622 recipes in the catalog.
 * Adds normalizedIngredients array to each recipe.
 * 
 * IDEMPOTENT: Safe to run multiple times
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { batchNormalizeRecipes } from '../src/pipelines/normalizeRecipeIngredients.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const backupPath = path.join(__dirname, '../tmp/vanessa_recipe_catalog_backup.json');
const diagnosticsPath = path.join(__dirname, '../tmp/normalization_diagnostics.json');

console.log('🔧 Normalizing Existing Recipe Catalog\n');
console.log('=' .repeat(80));

// Load catalog
console.log('\n📂 Loading catalog...');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const recipes = catalogData.recipes;

console.log(`   Loaded ${recipes.length} recipes`);
console.log(`   Catalog version: ${catalogData._catalogVersion}`);
console.log(`   Last updated: ${catalogData._lastUpdated}\n`);

// Create backup
console.log('💾 Creating backup...');
fs.writeFileSync(backupPath, JSON.stringify(catalogData, null, 2));
console.log(`   Backup saved to: tmp/vanessa_recipe_catalog_backup.json\n`);

// Normalize recipes
console.log('⚙️  Normalizing recipes...\n');

const progressCallback = (current, total, recipe) => {
  if (current % 50 === 0 || current === total) {
    const percent = ((current / total) * 100).toFixed(1);
    console.log(`   Progress: ${current}/${total} (${percent}%) - "${recipe.name}"`);
  }
};

const { recipes: normalizedRecipes, stats } = batchNormalizeRecipes(
  recipes,
  progressCallback
);

console.log('\n' + '=' .repeat(80));
console.log('\n📊 NORMALIZATION RESULTS\n');
console.log(`Total recipes: ${stats.total}`);
console.log(`Complete: ${stats.complete} (${(stats.complete / stats.total * 100).toFixed(1)}%)`);
console.log(`Partial: ${stats.partial} (${(stats.partial / stats.total * 100).toFixed(1)}%)`);
console.log(`Skipped: ${stats.skipped}\n`);

console.log(`Total ingredients: ${stats.totalIngredients}`);
console.log(`Matched: ${stats.totalMatched} (${(stats.totalMatched / stats.totalIngredients * 100).toFixed(1)}%)`);
console.log(`Unmatched: ${stats.totalUnmatched} (${(stats.totalUnmatched / stats.totalIngredients * 100).toFixed(1)}%)\n`);

// Collect unmatched ingredients for analysis
const allUnmatched = [];
normalizedRecipes.forEach(recipe => {
  if (recipe.normalizationDiagnostics && 
      recipe.normalizationDiagnostics.unmatchedIngredients) {
    allUnmatched.push(...recipe.normalizationDiagnostics.unmatchedIngredients.map(ing => ({
      ...ing,
      recipeId: recipe.recipeId,
      recipeName: recipe.name
    })));
  }
});

// Find most common unmatched ingredients
const unmatchedFrequency = new Map();
allUnmatched.forEach(ing => {
  const key = `${ing.identityText}|${ing.state}`;
  if (!unmatchedFrequency.has(key)) {
    unmatchedFrequency.set(key, {
      identityText: ing.identityText,
      state: ing.state,
      count: 0,
      recipes: []
    });
  }
  const entry = unmatchedFrequency.get(key);
  entry.count++;
  if (entry.recipes.length < 5) {
    entry.recipes.push(ing.recipeName);
  }
});

const unmatchedSorted = Array.from(unmatchedFrequency.values())
  .sort((a, b) => b.count - a.count);

console.log('🔍 Top 20 Unmatched Ingredients:\n');
unmatchedSorted.slice(0, 20).forEach((item, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. "${item.identityText}" (${item.state}) - ${item.count} occurrences`);
  if (item.recipes.length > 0) {
    console.log(`    In: ${item.recipes.slice(0, 3).join(', ')}${item.recipes.length > 3 ? ', ...' : ''}`);
  }
});

// Save diagnostics
const diagnostics = {
  timestamp: new Date().toISOString(),
  summary: stats,
  unmatchedIngredients: unmatchedSorted,
  sampleNormalizedRecipes: normalizedRecipes.slice(0, 5).map(r => ({
    recipeId: r.recipeId,
    name: r.name,
    originalIngredientCount: r.ingredients?.length || 0,
    normalizedIngredientCount: r.normalizedIngredients?.length || 0,
    status: r.normalizationStatus,
    diagnostics: r.normalizationDiagnostics
  }))
};

fs.writeFileSync(diagnosticsPath, JSON.stringify(diagnostics, null, 2));
console.log(`\n📁 Diagnostics saved to: tmp/normalization_diagnostics.json\n`);

// Update catalog
console.log('💾 Saving normalized catalog...');

const updatedCatalog = {
  ...catalogData,
  _lastUpdated: new Date().toISOString(),
  _normalization: {
    version: '1.0.0',
    date: new Date().toISOString(),
    stats: {
      recipesProcessed: stats.total,
      ingredientsMatched: stats.totalMatched,
      ingredientsUnmatched: stats.totalUnmatched,
      matchRate: (stats.totalMatched / stats.totalIngredients * 100).toFixed(1) + '%'
    }
  },
  recipes: normalizedRecipes
};

fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2));
console.log('   ✅ Catalog saved!\n');

console.log('=' .repeat(80));
console.log('\n✨ NORMALIZATION COMPLETE!\n');
console.log('📋 Summary:');
console.log(`   - ${stats.complete} recipes fully normalized`);
console.log(`   - ${stats.partial} recipes partially normalized`);
console.log(`   - ${stats.totalMatched}/${stats.totalIngredients} ingredients matched (${(stats.totalMatched / stats.totalIngredients * 100).toFixed(1)}%)`);
console.log(`   - ${unmatchedSorted.length} unique unmatched ingredient types\n`);

if (stats.totalUnmatched > 0) {
  console.log('💡 Next Steps:');
  console.log('   - Review tmp/normalization_diagnostics.json for unmatched ingredients');
  console.log('   - Add high-frequency unmatched ingredients to ingredientMaster.json');
  console.log('   - Re-run this script to improve match rate\n');
}

console.log('📁 Files:');
console.log(`   - Catalog: ${catalogPath}`);
console.log(`   - Backup: ${backupPath}`);
console.log(`   - Diagnostics: ${diagnosticsPath}\n`);
