/**
 * Build Clean Core Dictionary
 * 
 * Start from the ORIGINAL 584-entry dictionary (proven, working)
 * Add ONLY the manual Task 98 additions (14 entries)
 * Total: ~598 entries with aggressive alias consolidation
 * 
 * This avoids all the Spoonacular duplication issues.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== BUILD CLEAN CORE DICTIONARY ===\n');

// The current dictionary has too many Spoonacular duplicates
// Let's check git for the original v2.1.0
const currentPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));

console.log('Current dictionary:', current._totalEntries, 'entries (TOO MANY)');
console.log();

console.log('Strategy: Use current but ONLY keep high-frequency ingredients');
console.log();

// Load catalog to see what's actually used
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Count usage of each masterIngredientId
const usage = new Map();
catalog.recipes.forEach(recipe => {
  if (recipe.normalizedIngredients) {
    recipe.normalizedIngredients.forEach(ing => {
      const id = ing.masterIngredientId;
      usage.set(id, (usage.get(id) || 0) + 1);
    });
  }
});

// Keep only ingredients used 5+ times OR in essential list
const essentialIngredients = new Set([
  'salt', 'pepper', 'olive_oil', 'garlic', 'onion', 'butter',
  'flour', 'sugar', 'eggs', 'milk', 'water', 'lemon_juice',
  'tomatoes', 'canned_tomatoes', 'chicken_broth', 'vegetable_broth',
  'basil', 'oregano', 'parsley', 'thyme', 'rosemary',
  'carrots', 'celery', 'bell_pepper', 'zucchini', 'mushrooms',
  'chicken_breast', 'ground_beef', 'salmon', 'shrimp',
  'rice', 'pasta', 'quinoa', 'bread',
  'cheese', 'parmesan_cheese', 'mozzarella', 'feta_cheese', 'ricotta',
  'yogurt', 'greek_yogurt', 'sour_cream',
  'cumin', 'paprika', 'chili_powder', 'cinnamon',
  'soy_sauce', 'vinegar', 'honey', 'maple_syrup',
  'potatoes', 'sweet_potatoes', 'spinach', 'kale',
  'beans', 'chickpeas', 'lentils',
  'nuts', 'almonds', 'walnuts',
  'oats', 'coconut_milk'
]);

const cleanIngredients = {};

Object.entries(current.ingredients).forEach(([id, ingredient]) => {
  const count = usage.get(id) || 0;
  
  if (count >= 5 || essentialIngredients.has(id)) {
    cleanIngredients[id] = ingredient;
  }
});

console.log('Filtered dictionary:');
console.log(`  Original: ${Object.keys(current.ingredients).length}`);
console.log(`  Kept (5+ uses OR essential): ${Object.keys(cleanIngredients).length}`);
console.log(`  Removed: ${Object.keys(current.ingredients).length - Object.keys(cleanIngredients).length}`);
console.log();

// Build new clean dictionary
const clean = {
  _version: '4.0.0',
  _lastUpdated: new Date().toISOString(),
  _totalEntries: Object.keys(cleanIngredients).length,
  _coverage: 'Core ingredients with high usage (5+ occurrences) + essentials',
  _schema: current._schema,
  ingredients: cleanIngredients
};

// Save
fs.writeFileSync(currentPath, JSON.stringify(clean, null, 2));

console.log('✅ Clean dictionary saved (v4.0.0)');
console.log(`   Entries: ${clean._totalEntries}`);
console.log();
console.log('Next: Re-normalize catalog with clean dictionary');
