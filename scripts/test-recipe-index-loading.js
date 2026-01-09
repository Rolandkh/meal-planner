/**
 * Test Recipe Index Loading
 * Verifies the recipe_index.json can be loaded and contains correct data
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

async function testRecipeIndex() {
  console.log('🧪 Testing Recipe Index\n');
  console.log('='.repeat(60));
  
  try {
    // Load recipe index
    const indexPath = path.join(PROJECT_ROOT, 'src/data/recipe_index.json');
    console.log('\n📂 Loading:', indexPath);
    const indexData = JSON.parse(await readFile(indexPath, 'utf8'));
    
    console.log('\n✅ Recipe Index Loaded');
    console.log(`   Version: ${indexData._version}`);
    console.log(`   Last Updated: ${indexData._lastUpdated}`);
    console.log(`   Total Recipes: ${indexData._count}`);
    console.log(`   Description: ${indexData._description}`);
    
    // Load full catalog for comparison
    const catalogPath = path.join(PROJECT_ROOT, 'src/data/vanessa_recipe_catalog.json');
    const catalogData = JSON.parse(await readFile(catalogPath, 'utf8'));
    
    console.log('\n📊 Comparison:');
    console.log(`   Full Catalog Size: ${(JSON.stringify(catalogData).length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Recipe Index Size: ${(JSON.stringify(indexData).length / 1024 / 1024).toFixed(2)} MB`);
    
    const savings = ((1 - (JSON.stringify(indexData).length / JSON.stringify(catalogData).length)) * 100).toFixed(1);
    console.log(`   Size Reduction: ${savings}% smaller`);
    
    // Validate index structure
    console.log('\n🔍 Validating Index Structure...');
    const recipe = indexData.recipes[0];
    const requiredFields = [
      'recipeId', 'name', 'prepTime', 'cookTime', 'servings',
      'calories', 'protein', 'carbs', 'fat', 'fiber',
      'cuisines', 'diets', 'dishTypes', 'mealSlots', 'mainIngredients',
      'vegetarian', 'vegan', 'pescatarian', 'glutenFree', 'dairyFree',
      'effortLevel'
    ];
    
    const missing = requiredFields.filter(field => !(field in recipe));
    
    if (missing.length === 0) {
      console.log('   ✅ All required fields present');
    } else {
      console.log('   ❌ Missing fields:', missing.join(', '));
    }
    
    // Sample recipes
    console.log('\n📋 Sample Recipes from Index:\n');
    indexData.recipes.slice(0, 3).forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}`);
      console.log(`   Timing: ${r.prepTime + r.cookTime} min total | ${r.servings} servings`);
      console.log(`   Nutrition: ${r.calories} cal | ${r.protein}g protein | ${r.carbs}g carbs | ${r.fat}g fat`);
      console.log(`   Cuisines: ${r.cuisines.join(', ') || 'none'}`);
      console.log(`   Diets: ${r.diets.join(', ') || 'none'}`);
      console.log(`   Main Ingredients: ${r.mainIngredients.slice(0, 3).join(', ')}...`);
      console.log('');
    });
    
    // Statistics
    console.log('='.repeat(60));
    console.log('📊 INDEX STATISTICS\n');
    
    const stats = {
      total: indexData.recipes.length,
      vegetarian: indexData.recipes.filter(r => r.vegetarian).length,
      vegan: indexData.recipes.filter(r => r.vegan).length,
      pescatarian: indexData.recipes.filter(r => r.pescatarian).length,
      glutenFree: indexData.recipes.filter(r => r.glutenFree).length,
      dairyFree: indexData.recipes.filter(r => r.dairyFree).length,
      quickMeals: indexData.recipes.filter(r => (r.prepTime + r.cookTime) <= 30).length,
      avgCalories: Math.round(indexData.recipes.reduce((sum, r) => sum + r.calories, 0) / indexData.recipes.length),
      avgProtein: Math.round(indexData.recipes.reduce((sum, r) => sum + r.protein, 0) / indexData.recipes.length),
      avgTime: Math.round(indexData.recipes.reduce((sum, r) => sum + r.prepTime + r.cookTime, 0) / indexData.recipes.length),
      cuisines: [...new Set(indexData.recipes.flatMap(r => r.cuisines))].sort(),
      diets: [...new Set(indexData.recipes.flatMap(r => r.diets))].sort()
    };
    
    console.log(`Total Recipes: ${stats.total}`);
    console.log(`\nDiet Options:`);
    console.log(`  Vegetarian: ${stats.vegetarian} (${((stats.vegetarian/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Vegan: ${stats.vegan} (${((stats.vegan/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Pescatarian: ${stats.pescatarian} (${((stats.pescatarian/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Gluten Free: ${stats.glutenFree} (${((stats.glutenFree/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Dairy Free: ${stats.dairyFree} (${((stats.dairyFree/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Quick Meals (≤30min): ${stats.quickMeals} (${((stats.quickMeals/stats.total)*100).toFixed(1)}%)`);
    
    console.log(`\nAverages:`);
    console.log(`  Calories: ${stats.avgCalories} kcal/serving`);
    console.log(`  Protein: ${stats.avgProtein}g/serving`);
    console.log(`  Total Time: ${stats.avgTime} minutes`);
    
    console.log(`\nCuisines (${stats.cuisines.length}): ${stats.cuisines.join(', ')}`);
    console.log(`\nDiets (${stats.diets.length}): ${stats.diets.join(', ')}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TEST COMPLETE - Recipe Index is ready!\n');
    console.log('📁 Files:');
    console.log('   - Full catalog: src/data/vanessa_recipe_catalog.json (browsing, details)');
    console.log('   - Recipe index: src/data/recipe_index.json (meal plan generation)');
    console.log('\n🎯 Next: Test in the app by generating a meal plan\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRecipeIndex();
