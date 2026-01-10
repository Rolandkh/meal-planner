/**
 * Re-normalize Entire Catalog with Improved Dictionary
 * 
 * The catalog was normalized with old dictionary (v2.1.0).
 * This script re-normalizes with v3.1.0 (688 ingredients).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeRecipeIngredients, batchNormalizeRecipes } from '../src/pipelines/normalizeRecipeIngredients.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== RE-NORMALIZE CATALOG WITH v3.1.0 DICTIONARY ===\n');

// Load catalog
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Loaded:', catalog.recipes.length, 'recipes');
console.log();

// Backup first
const backupPath = path.join(__dirname, '../tmp/catalog_before_renormalization.json');
fs.writeFileSync(backupPath, JSON.stringify(catalog, null, 2));
console.log('✅ Backup created:', backupPath);
console.log();

// Clear existing normalized data to force re-normalization
console.log('Clearing old normalized data...');
catalog.recipes.forEach(recipe => {
  delete recipe.normalizedIngredients;
  delete recipe.normalizationStatus;
  delete recipe.normalizationDiagnostics;
});

console.log('✅ Cleared\n');

// Re-normalize with new dictionary
console.log('Re-normalizing with v3.1.0 dictionary (688 ingredients)...\n');

const result = batchNormalizeRecipes(catalog.recipes, (current, total, recipe) => {
  if (current % 50 === 0) {
    console.log(`  Progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
  }
});

console.log();
console.log('=== NORMALIZATION COMPLETE ===\n');
console.log('Stats:', result.stats);
console.log();

// Save updated catalog
catalog.recipes = result.recipes;
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

console.log('✅ Catalog updated:', catalogPath);
console.log();
console.log('📊 SUMMARY:');
console.log(`   Total: ${result.stats.total}`);
console.log(`   Complete: ${result.stats.complete}`);
console.log(`   Partial: ${result.stats.partial}`);
console.log(`   Match rate: ${(result.stats.totalMatched / result.stats.totalIngredients * 100).toFixed(1)}%`);
console.log();
console.log('🎉 Re-normalization complete!');
console.log('   Refresh the app to see deduplicated shopping lists');
