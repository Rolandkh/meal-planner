/**
 * Prepare Recipe Catalog for Production
 * 
 * 1. Remove incomplete recipes
 * 2. Update main catalog
 * 3. Create lightweight recipe index for meal plan generation
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Check if a recipe is complete
 */
function isRecipeComplete(recipe) {
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasInstructions = recipe.instructions && 
                         recipe.instructions !== 'No instructions available' &&
                         recipe.instructions.length > 20;
  const hasImage = recipe.image && recipe.image.length > 0;
  const hasNutrition = recipe.nutrition && recipe.nutrition.calories > 0;
  
  return hasIngredients && hasInstructions && hasImage && hasNutrition;
}

/**
 * Create lightweight recipe index for meal plan generation
 * Only includes essential info Claude needs to make decisions
 */
function createRecipeIndex(recipes) {
  return recipes.map(r => ({
    recipeId: r.recipeId,
    name: r.name,
    
    // Timing
    prepTime: r.prepTime,
    cookTime: r.cookTime,
    servings: r.servings,
    
    // Nutrition (key metrics)
    calories: Math.round(r.nutrition?.calories || 0),
    protein: Math.round(r.nutrition?.protein || 0),
    carbs: Math.round(r.nutrition?.carbs || 0),
    fat: Math.round(r.nutrition?.fat || 0),
    fiber: Math.round(r.nutrition?.fiber || 0),
    
    // Tags (for filtering/matching)
    cuisines: r.tags?.cuisines || [],
    diets: r.tags?.diets || [],
    dishTypes: r.tags?.dishTypes || [],
    mealSlots: r.tags?.mealSlots || ['lunch', 'dinner'],
    
    // Key ingredients (first 5 for variety)
    mainIngredients: (r.ingredients || [])
      .slice(0, 5)
      .map(ing => ing.name),
    
    // Properties
    vegetarian: r.tags?.diets?.includes('vegetarian') || 
                r.tags?.diets?.includes('lacto ovo vegetarian'),
    vegan: r.tags?.diets?.includes('vegan'),
    pescatarian: r.tags?.diets?.includes('pescatarian'),
    glutenFree: r.tags?.diets?.includes('gluten free'),
    dairyFree: r.tags?.diets?.includes('dairy free'),
    
    // Effort level
    effortLevel: r.tags?.effortLevel || 
                 (r.prepTime + r.cookTime <= 30 ? 'quick' : 'medium'),
    
    // Diet Compass score (if calculated)
    healthScore: r.dietCompassScores?.overall || null
  }));
}

/**
 * Main process
 */
async function prepareCatalog() {
  console.log('🔧 Preparing Recipe Catalog\n');
  console.log('='.repeat(60));
  
  try {
    // Load new catalog
    console.log('\n📖 Loading new catalog...');
    const newCatalogPath = path.join(PROJECT_ROOT, 'src/data/diet_compass_recipe_catalog.json');
    const newCatalog = JSON.parse(await readFile(newCatalogPath, 'utf8'));
    console.log(`✅ Loaded ${newCatalog.recipes.length} recipes`);
    
    // Filter complete recipes
    console.log('\n🔍 Filtering complete recipes...');
    const completeRecipes = newCatalog.recipes.filter(isRecipeComplete);
    const incompleteRecipes = newCatalog.recipes.filter(r => !isRecipeComplete(r));
    
    console.log(`✅ Complete: ${completeRecipes.length}`);
    console.log(`❌ Incomplete: ${incompleteRecipes.length}`);
    
    if (incompleteRecipes.length > 0) {
      console.log('\n⚠️  Removed incomplete recipes:');
      incompleteRecipes.forEach(r => {
        const issues = [];
        if (!r.ingredients || r.ingredients.length === 0) issues.push('no ingredients');
        if (!r.instructions || r.instructions === 'No instructions available' || r.instructions.length <= 20) {
          issues.push('no instructions');
        }
        if (!r.image) issues.push('no image');
        if (!r.nutrition || r.nutrition.calories === 0) issues.push('no nutrition');
        console.log(`   - ${r.name} (${issues.join(', ')})`);
      });
    }
    
    // Update main catalog
    console.log('\n💾 Updating main catalog...');
    const mainCatalogPath = path.join(PROJECT_ROOT, 'src/data/vanessa_recipe_catalog.json');
    const mainCatalog = {
      _catalogVersion: '2.0.0',
      _lastUpdated: new Date().toISOString(),
      _count: completeRecipes.length,
      _source: 'Spoonacular (Diet Compass & Mediterranean focus)',
      _extraction: newCatalog._extraction,
      recipes: completeRecipes
    };
    
    await writeFile(mainCatalogPath, JSON.stringify(mainCatalog, null, 2));
    console.log(`✅ Updated: ${mainCatalogPath}`);
    console.log(`   ${completeRecipes.length} complete recipes`);
    
    // Create lightweight recipe index
    console.log('\n📝 Creating lightweight recipe index for meal planning...');
    const recipeIndex = createRecipeIndex(completeRecipes);
    const indexPath = path.join(PROJECT_ROOT, 'src/data/recipe_index.json');
    
    const indexData = {
      _version: '1.0.0',
      _lastUpdated: new Date().toISOString(),
      _count: recipeIndex.length,
      _description: 'Lightweight recipe index for Claude meal plan generation',
      _usage: 'Contains only essential recipe info (no full ingredients/instructions)',
      recipes: recipeIndex
    };
    
    await writeFile(indexPath, JSON.stringify(indexData, null, 2));
    console.log(`✅ Created: ${indexPath}`);
    console.log(`   ${recipeIndex.length} recipe summaries`);
    
    // Calculate file sizes
    const mainSize = (JSON.stringify(mainCatalog).length / 1024 / 1024).toFixed(2);
    const indexSize = (JSON.stringify(indexData).length / 1024 / 1024).toFixed(2);
    const savings = ((1 - indexSize / mainSize) * 100).toFixed(1);
    
    console.log('\n📊 File Sizes:');
    console.log(`   Main catalog: ${mainSize} MB (full details)`);
    console.log(`   Recipe index: ${indexSize} MB (lightweight)`);
    console.log(`   Savings: ${savings}% smaller for meal planning`);
    
    // Generate statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 CATALOG STATISTICS\n');
    
    const stats = {
      totalRecipes: completeRecipes.length,
      cuisines: [...new Set(completeRecipes.flatMap(r => r.tags?.cuisines || []))].sort(),
      diets: [...new Set(completeRecipes.flatMap(r => r.tags?.diets || []))].sort(),
      dishTypes: [...new Set(completeRecipes.flatMap(r => r.tags?.dishTypes || []))].sort(),
      avgCalories: Math.round(completeRecipes.reduce((sum, r) => sum + (r.nutrition?.calories || 0), 0) / completeRecipes.length),
      avgPrepTime: Math.round(completeRecipes.reduce((sum, r) => sum + r.prepTime, 0) / completeRecipes.length),
      vegetarianCount: completeRecipes.filter(r => r.tags?.diets?.some(d => d.includes('vegetarian'))).length,
      veganCount: completeRecipes.filter(r => r.tags?.diets?.includes('vegan')).length,
      pescatarianCount: completeRecipes.filter(r => r.tags?.diets?.includes('pescatarian')).length,
      quickMeals: completeRecipes.filter(r => (r.prepTime + r.cookTime) <= 30).length
    };
    
    console.log(`✅ Total Recipes: ${stats.totalRecipes}`);
    console.log(`\n🌍 Cuisines (${stats.cuisines.length}):`);
    console.log(`   ${stats.cuisines.join(', ')}`);
    console.log(`\n🥗 Diets (${stats.diets.length}):`);
    console.log(`   ${stats.diets.join(', ')}`);
    console.log(`\n🍽️  Dish Types (${stats.dishTypes.length}):`);
    console.log(`   ${stats.dishTypes.slice(0, 15).join(', ')}${stats.dishTypes.length > 15 ? '...' : ''}`);
    console.log(`\n📊 Quick Stats:`);
    console.log(`   Avg Calories: ${stats.avgCalories} kcal/serving`);
    console.log(`   Avg Prep Time: ${stats.avgPrepTime} minutes`);
    console.log(`   Vegetarian: ${stats.vegetarianCount} (${((stats.vegetarianCount/stats.totalRecipes)*100).toFixed(1)}%)`);
    console.log(`   Vegan: ${stats.veganCount} (${((stats.veganCount/stats.totalRecipes)*100).toFixed(1)}%)`);
    console.log(`   Pescatarian: ${stats.pescatarianCount} (${((stats.pescatarianCount/stats.totalRecipes)*100).toFixed(1)}%)`);
    console.log(`   Quick Meals (≤30 min): ${stats.quickMeals} (${((stats.quickMeals/stats.totalRecipes)*100).toFixed(1)}%)`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ CATALOG PREPARATION COMPLETE!\n');
    
    console.log('📁 Files ready:');
    console.log('   1. Main catalog: src/data/vanessa_recipe_catalog.json');
    console.log('   2. Recipe index: src/data/recipe_index.json (for meal planning)');
    console.log('   3. Images: public/images/recipes/ (180 high-res images)\n');
    
    console.log('🎯 Next steps:');
    console.log('   1. Test recipe browsing in the app');
    console.log('   2. Update meal plan generator to use recipe_index.json');
    console.log('   3. Score recipes with Diet Compass algorithm (optional)\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
prepareCatalog();
