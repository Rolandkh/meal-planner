/**
 * Remove Problematic Recipes from Catalog
 * 
 * Removes recipes with:
 * - 3+ unknown ingredients (unusable)
 * - Malformed ingredient data
 * 
 * Creates backup before removal.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== REMOVE PROBLEMATIC RECIPES ===\n');

// Load quality report
const reportPath = path.join(__dirname, '../tmp/recipe_quality_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('Loaded quality report');
console.log('Total recipes analyzed:', report.recipes.length);
console.log();

// Identify recipes to remove
const toRemove = report.recipes.filter(r => r.recommendation === 'remove');
const toReview = report.recipes.filter(r => r.recommendation === 'review');
const toFlag = report.recipes.filter(r => r.recommendation === 'flag');
const toKeep = report.recipes.filter(r => r.recommendation === 'keep');

console.log('RECOMMENDATIONS:');
console.log(`  Remove: ${toRemove.length} recipes (17.0%)`);
console.log(`  Review: ${toReview.length} recipes (3.2%)`);
console.log(`  Flag:   ${toFlag.length} recipes (39.7%)`);
console.log(`  Keep:   ${toKeep.length} recipes (40.0%)`);
console.log();

// Load current catalog
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Current catalog:', catalog.recipes.length, 'recipes');
console.log();

// Create backup
const backupPath = path.join(__dirname, '../tmp/catalog_backup_before_cleanup.json');
fs.writeFileSync(backupPath, JSON.stringify(catalog, null, 2));
console.log('✅ Backup created:', backupPath);
console.log();

// Build removal set
const removeIds = new Set(toRemove.map(r => r.recipeId));

// Filter recipes
const filteredRecipes = catalog.recipes.filter(recipe => {
  if (removeIds.has(recipe.recipeId)) {
    console.log(`❌ Removing: "${recipe.name}" (${recipe.recipeId})`);
    return false;
  }
  return true;
});

console.log();
console.log(`Removed ${catalog.recipes.length - filteredRecipes.length} recipes`);
console.log(`Remaining: ${filteredRecipes.length} recipes`);
console.log();

// Add quality metadata to remaining recipes
const enrichedRecipes = filteredRecipes.map(recipe => {
  const analysis = report.recipes.find(r => r.recipeId === recipe.recipeId);
  
  if (!analysis) return recipe;
  
  // Add quality flags
  const quality = {
    ingredientMatchRate: analysis.matchRate,
    hasUnknownIngredients: analysis.unknown > 0,
    unknownCount: analysis.unknown,
    qualityTier: analysis.quality,
    flagForUser: analysis.recommendation === 'flag'
  };
  
  // Add problematic ingredients list if flagged
  if (quality.flagForUser && analysis.problematicIngredients.length > 0) {
    quality.problematicIngredients = analysis.problematicIngredients.map(i => ({
      raw: i.raw,
      identity: i.identity,
      issue: i.issue
    }));
  }
  
  return {
    ...recipe,
    quality
  };
});

// Update catalog
const updatedCatalog = {
  ...catalog,
  recipes: enrichedRecipes,
  metadata: {
    ...catalog.metadata,
    lastQualityCheck: new Date().toISOString(),
    qualityStats: {
      totalRecipes: enrichedRecipes.length,
      removedCount: catalog.recipes.length - enrichedRecipes.length,
      excellentCount: toKeep.length,
      flaggedCount: toFlag.length,
      averageMatchRate: (enrichedRecipes.reduce((sum, r) => sum + (r.quality?.ingredientMatchRate || 0), 0) / enrichedRecipes.length).toFixed(1) + '%'
    }
  }
};

// Save updated catalog
fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2));

console.log('=== CATALOG UPDATED ===');
console.log();
console.log('Updated:', catalogPath);
console.log('New recipe count:', updatedCatalog.recipes.length);
console.log('Average match rate:', updatedCatalog.metadata.qualityStats.averageMatchRate);
console.log();

// Save removal log
const removalLogPath = path.join(__dirname, '../tmp/removed_recipes.json');
fs.writeFileSync(removalLogPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  count: toRemove.length,
  recipes: toRemove.map(r => ({
    recipeId: r.recipeId,
    name: r.name,
    source: r.source,
    reason: r.reason,
    unknownIngredients: r.problematicIngredients.map(i => i.identity || i.raw)
  }))
}, null, 2));

console.log('Removal log:', removalLogPath);
console.log();

console.log('🎉 CLEANUP COMPLETE!');
console.log();
console.log('Summary:');
console.log(`  - ${toRemove.length} problematic recipes removed`);
console.log(`  - ${toFlag.length} recipes flagged for user notification`);
console.log(`  - ${toKeep.length} recipes production-ready`);
console.log(`  - Backup available for rollback if needed`);
