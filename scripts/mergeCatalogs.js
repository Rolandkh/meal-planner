#!/usr/bin/env node
/**
 * Merge old catalog (with ingredients) + new catalog (with high-res images)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔄 Merging catalog versions...\n');

// Load both versions
const oldCatalog = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../src/data/vanessa_recipe_catalog_OLD.json'),
  'utf8'
));

const newCatalog = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../src/data/vanessa_recipe_catalog.json'),
  'utf8'
));

console.log('Old catalog recipes:', oldCatalog.recipes.length);
console.log('New catalog recipes:', newCatalog.recipes.length);
console.log();

// Create a map of old recipes by spoonacularId
const oldRecipeMap = new Map();
oldCatalog.recipes.forEach(recipe => {
  oldRecipeMap.set(recipe.spoonacularId, recipe);
});

// Merge: Take new recipe data but inject old ingredients
let merged = 0;
let ingredientsAdded = 0;

newCatalog.recipes.forEach(newRecipe => {
  const oldRecipe = oldRecipeMap.get(newRecipe.spoonacularId);
  
  if (oldRecipe && oldRecipe.ingredients && oldRecipe.ingredients.length > 0) {
    // Copy ingredients from old version
    newRecipe.ingredients = oldRecipe.ingredients;
    ingredientsAdded += oldRecipe.ingredients.length;
    merged++;
  }
});

console.log('✅ Merged ingredients for', merged, 'recipes');
console.log('📊 Total ingredients added:', ingredientsAdded);
console.log();

// Update metadata
newCatalog._lastUpdated = new Date().toISOString();
newCatalog._extraction.merged = {
  date: new Date().toISOString(),
  recipesWithIngredients: merged,
  totalIngredients: ingredientsAdded
};

// Save merged catalog
fs.writeFileSync(
  path.join(__dirname, '../src/data/vanessa_recipe_catalog.json'),
  JSON.stringify(newCatalog, null, 2)
);

console.log('💾 Saved merged catalog!');
console.log();
console.log('📊 Final Status:');
console.log('  ✅ High-res images: Yes');
console.log('  ✅ Ingredients: ' + merged + '/607');
console.log('  ⏳ Instructions: Tomorrow');
console.log();
console.log('🎉 Ready to deploy with ingredients!');
console.log('🌅 Just need instructions tomorrow.');
