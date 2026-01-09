/**
 * Fix Breakfast Tags in Catalog
 * Detects and tags breakfast-suitable recipes based on dishTypes and names
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Breakfast indicators
const BREAKFAST_DISH_TYPES = [
  'breakfast',
  'brunch',
  'morning meal',
];

const BREAKFAST_KEYWORDS = [
  'pancake', 'waffle', 'french toast', 'toast', 'bagel',
  'cereal', 'oatmeal', 'porridge', 'granola', 'muesli',
  'yogurt', 'parfait', 
  'egg', 'omelette', 'omelet', 'frittata', 'scrambled', 'poached',
  'bacon', 'sausage', 'breakfast',
  'smoothie', 'juice',
  'muffin', 'scone', 'danish', 'croissant',
  'hash brown', 'breakfast burrito'
];

async function fixBreakfastTags() {
  console.log('🍳 Fixing breakfast tags in catalog...\n');

  // Load catalog
  const catalogPath = path.join(PROJECT_ROOT, 'src/data/vanessa_recipe_catalog.json');
  const catalogData = JSON.parse(await readFile(catalogPath, 'utf-8'));
  const recipes = catalogData.recipes || [];
  
  console.log(`📖 Loaded ${recipes.length} recipes\n`);

  let breakfastCount = 0;
  let lunchDinnerCount = 0;

  for (const recipe of recipes) {
    const isBreakfast = isBreakfastRecipe(recipe);
    
    if (isBreakfast) {
      // Add breakfast to mealSlots if not already there
      if (!recipe.tags.mealSlots.includes('breakfast')) {
        recipe.tags.mealSlots.unshift('breakfast');
        breakfastCount++;
      }
    }
    
    // All recipes can be lunch/dinner
    if (!recipe.tags.mealSlots.includes('lunch')) {
      recipe.tags.mealSlots.push('lunch');
    }
    if (!recipe.tags.mealSlots.includes('dinner')) {
      recipe.tags.mealSlots.push('dinner');
    }
    
    lunchDinnerCount++;
  }

  console.log(`✅ Tagged ${breakfastCount} recipes as breakfast-suitable\n`);
  console.log(`📊 Final breakdown:`);
  console.log(`   - Breakfast: ${recipes.filter(r => r.tags.mealSlots.includes('breakfast')).length}`);
  console.log(`   - Lunch: ${recipes.filter(r => r.tags.mealSlots.includes('lunch')).length}`);
  console.log(`   - Dinner: ${recipes.filter(r => r.tags.mealSlots.includes('dinner')).length}\n`);

  // Update metadata
  catalogData._lastUpdated = new Date().toISOString();
  catalogData._notes = (catalogData._notes || '') + ` | Breakfast tags fixed on ${new Date().toISOString()}`;

  // Save updated catalog
  await writeFile(catalogPath, JSON.stringify(catalogData, null, 2));
  console.log(`💾 Saved updated catalog to: ${catalogPath}\n`);
  
  // Show sample breakfast recipes
  const breakfastRecipes = recipes.filter(r => r.tags.mealSlots.includes('breakfast'));
  console.log(`🍳 Sample breakfast recipes (showing first 15):`);
  breakfastRecipes.slice(0, 15).forEach(r => {
    console.log(`   • ${r.name}`);
  });
  
  console.log('\n✅ BREAKFAST TAGS FIXED!');
  console.log('   Reload the app and generate a new meal plan to see breakfast catalog recipes.');
}

/**
 * Determine if a recipe is suitable for breakfast
 */
function isBreakfastRecipe(recipe) {
  const name = (recipe.name || '').toLowerCase();
  const dishTypes = (recipe.tags?.dishTypes || []).map(d => d.toLowerCase());
  
  // Check dish types
  for (const type of dishTypes) {
    if (BREAKFAST_DISH_TYPES.some(bt => type.includes(bt))) {
      return true;
    }
  }
  
  // Check recipe name
  for (const keyword of BREAKFAST_KEYWORDS) {
    if (name.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

// Run the fix
fixBreakfastTags().catch(error => {
  console.error('\n❌ Fix failed:', error);
  process.exit(1);
});
