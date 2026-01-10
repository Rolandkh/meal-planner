/**
 * Test Normalization on NEW Batch of Recipes
 * Tests on recipes we haven't tested yet (51-70)
 */

const fs = require('fs');
const path = require('path');

const { parseIngredient } = require('../src/utils/ingredientParsing.js');
const { matchIngredient } = require('../src/utils/ingredientMatcher.js');
const { getMasterIngredient } = require('../src/utils/ingredientMaster.js');

const CATALOG_PATH = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const recipeCatalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

const startIndex = parseInt(process.argv[2]) || 50;
const count = parseInt(process.argv[3]) || 20;

console.log('\n🧪 Testing NEW Batch of Recipes');
console.log('================================\n');
console.log(`Testing recipes ${startIndex + 1} to ${startIndex + count}\n`);

const recipes = recipeCatalog.recipes.slice(startIndex, startIndex + count);
const stats = {
  totalRecipes: recipes.length,
  totalIngredients: 0,
  matched: 0,
  highConfidence: 0,
  mediumConfidence: 0,
  lowConfidence: 0,
  noMatch: 0,
  perfectRecipes: 0
};

const detailedResults = [];

for (let i = 0; i < recipes.length; i++) {
  const recipe = recipes[i];
  console.log(`[${i + 1}/${recipes.length}] ${recipe.name}`);
  console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    console.log('   ⚠️  No ingredients');
    continue;
  }
  
  const recipeResults = {
    recipeName: recipe.name,
    totalIngredients: recipe.ingredients.length,
    matched: 0,
    unmatched: [],
    lowConfidence: []
  };
  
  stats.totalIngredients += recipe.ingredients.length;
  
  for (const ing of recipe.ingredients) {
    const rawText = typeof ing === 'string' 
      ? ing 
      : `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ''}`.trim();
    
    const parsed = parseIngredient(rawText);
    const match = matchIngredient(parsed.identityText, parsed.state);
    
    if (match.masterId) {
      const master = getMasterIngredient(match.masterId);
      stats.matched++;
      recipeResults.matched++;
      
      if (match.confidence >= 0.9) stats.highConfidence++;
      else if (match.confidence >= 0.7) stats.mediumConfidence++;
      else {
        stats.lowConfidence++;
        recipeResults.lowConfidence.push({
          original: rawText,
          matched: master.displayName,
          confidence: match.confidence
        });
      }
    } else {
      stats.noMatch++;
      recipeResults.unmatched.push(rawText);
    }
  }
  
  detailedResults.push(recipeResults);
  
  const matchRate = Math.round((recipeResults.matched / recipeResults.totalIngredients) * 100);
  console.log(`   ✅ Matched: ${recipeResults.matched}/${recipeResults.totalIngredients} (${matchRate}%)`);
  
  if (matchRate === 100) stats.perfectRecipes++;
  
  if (recipeResults.unmatched.length > 0) {
    console.log(`   ⚠️  Unmatched (${recipeResults.unmatched.length}):`);
    recipeResults.unmatched.slice(0, 3).forEach(u => console.log(`      - ${u}`));
    if (recipeResults.unmatched.length > 3) {
      console.log(`      ... and ${recipeResults.unmatched.length - 3} more`);
    }
  }
}

const matchRate = stats.totalIngredients > 0
  ? Math.round((stats.matched / stats.totalIngredients) * 100)
  : 0;

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                                                          ║');
console.log('║           📊 NEW BATCH TEST RESULTS                       ║');
console.log('║                                                          ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Recipes Tested:          ${stats.totalRecipes}`);
console.log(`Total Ingredients:       ${stats.totalIngredients}`);
console.log('');
console.log(`✅ Matched:              ${stats.matched} (${matchRate}%)`);
console.log(`   - High confidence:    ${stats.highConfidence} (≥90%)`);
console.log(`   - Medium confidence:  ${stats.mediumConfidence} (70-90%)`);
console.log(`   - Low confidence:     ${stats.lowConfidence} (50-70%)`);
console.log(`❌ No match:             ${stats.noMatch}`);
console.log(`🎯 Perfect recipes:      ${stats.perfectRecipes}/${stats.totalRecipes} (${Math.round(stats.perfectRecipes/stats.totalRecipes*100)}%)`);
console.log('');

if (matchRate >= 95) {
  console.log('🎉 EXCELLENT: Match rate ≥95% - Production ready!');
} else if (matchRate >= 85) {
  console.log('✅ GOOD: Match rate ≥85% - Minor improvements needed');
} else {
  console.log('⚠️  FAIR: Match rate <85% - More work needed');
}
console.log('');
