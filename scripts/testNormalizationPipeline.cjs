/**
 * Test Normalization Pipeline on Existing Recipes
 * 
 * Tests the ingredient normalization pipeline on a batch of existing
 * recipes from the catalog to validate matching quality.
 * 
 * Usage: node scripts/testNormalizationPipeline.cjs [count]
 */

const fs = require('fs');
const path = require('path');

// Import normalization logic
const { parseIngredient } = require('../src/utils/ingredientParsing.js');
const { matchIngredient } = require('../src/utils/ingredientMatcher.js');
const { getMasterIngredient } = require('../src/utils/ingredientMaster.js');

const CATALOG_PATH = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');

// Load recipe catalog
const recipeCatalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Get count from command line (default 10)
const count = parseInt(process.argv[2]) || 10;

console.log('\n🧪 Testing Normalization Pipeline');
console.log('==================================\n');
console.log(`Testing on ${count} recipes from catalog\n`);

const recipes = recipeCatalog.recipes.slice(0, count);
const overallStats = {
  totalRecipes: recipes.length,
  totalIngredients: 0,
  matched: 0,
  highConfidence: 0,  // >= 0.9
  mediumConfidence: 0, // 0.7 - 0.9
  lowConfidence: 0,    // 0.5 - 0.7
  noMatch: 0,
  matchRate: 0
};

const detailedResults = [];

for (let i = 0; i < recipes.length; i++) {
  const recipe = recipes[i];
  console.log(`\n[${ i + 1}/${recipes.length}] ${recipe.name}`);
  console.log(`   Ingredients: ${recipe.ingredients?.length || 0}`);
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    console.log('   ⚠️  No ingredients to normalize');
    continue;
  }
  
  const recipeResults = {
    recipeName: recipe.name,
    totalIngredients: recipe.ingredients.length,
    matched: 0,
    unmatched: [],
    lowConfidence: []
  };
  
  overallStats.totalIngredients += recipe.ingredients.length;
  
  for (const ing of recipe.ingredients) {
    // Reconstruct ingredient text
    const rawText = typeof ing === 'string' 
      ? ing 
      : `${ing.quantity || ''} ${ing.unit || ''} ${ing.name || ''}`.trim();
    
    // Parse
    const parsed = parseIngredient(rawText);
    
    // Match
    const match = matchIngredient(parsed.identityText, parsed.state);
    
    if (match.masterId) {
      const master = getMasterIngredient(match.masterId);
      overallStats.matched++;
      recipeResults.matched++;
      
      // Track confidence levels
      if (match.confidence >= 0.9) {
        overallStats.highConfidence++;
      } else if (match.confidence >= 0.7) {
        overallStats.mediumConfidence++;
      } else {
        overallStats.lowConfidence++;
        recipeResults.lowConfidence.push({
          original: rawText,
          matched: master.displayName,
          confidence: match.confidence
        });
      }
    } else {
      overallStats.noMatch++;
      recipeResults.unmatched.push(rawText);
    }
  }
  
  detailedResults.push(recipeResults);
  
  // Print recipe results
  const matchRate = Math.round((recipeResults.matched / recipeResults.totalIngredients) * 100);
  console.log(`   ✅ Matched: ${recipeResults.matched}/${recipeResults.totalIngredients} (${matchRate}%)`);
  
  if (recipeResults.unmatched.length > 0) {
    console.log(`   ⚠️  Unmatched (${recipeResults.unmatched.length}):`);
    recipeResults.unmatched.forEach(u => console.log(`      - ${u}`));
  }
  
  if (recipeResults.lowConfidence.length > 0) {
    console.log(`   ⚠️  Low confidence (${recipeResults.lowConfidence.length}):`);
    recipeResults.lowConfidence.forEach(lc => {
      console.log(`      - "${lc.original}" → "${lc.matched}" (${Math.round(lc.confidence * 100)}%)`);
    });
  }
}

// Calculate overall match rate
overallStats.matchRate = overallStats.totalIngredients > 0
  ? Math.round((overallStats.matched / overallStats.totalIngredients) * 100)
  : 0;

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                                                          ║');
console.log('║              📊 NORMALIZATION TEST RESULTS                ║');
console.log('║                                                          ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Recipes Tested:          ${overallStats.totalRecipes}`);
console.log(`Total Ingredients:       ${overallStats.totalIngredients}`);
console.log('');
console.log(`✅ Matched:              ${overallStats.matched} (${overallStats.matchRate}%)`);
console.log(`   - High confidence:    ${overallStats.highConfidence} (≥90%)`);
console.log(`   - Medium confidence:  ${overallStats.mediumConfidence} (70-90%)`);
console.log(`   - Low confidence:     ${overallStats.lowConfidence} (50-70%)`);
console.log(`❌ No match:             ${overallStats.noMatch}`);
console.log('');

// Save detailed report
const reportPath = path.join(__dirname, '../tmp/normalization-test-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  testParams: {
    recipesCount: count,
    catalogVersion: recipeCatalog._catalogVersion,
    ingredientCatalogSize: Object.keys(require('../src/data/ingredientMaster.json').ingredients).length
  },
  summary: overallStats,
  detailedResults: detailedResults
}, null, 2));

console.log(`📄 Detailed report: ${reportPath}`);
console.log('');

// Overall assessment
if (overallStats.matchRate >= 95) {
  console.log('🎉 EXCELLENT: Match rate ≥95% - Production ready!');
} else if (overallStats.matchRate >= 85) {
  console.log('✅ GOOD: Match rate ≥85% - Minor improvements needed');
} else if (overallStats.matchRate >= 75) {
  console.log('⚠️  FAIR: Match rate ≥75% - Significant improvements needed');
} else {
  console.log('❌ POOR: Match rate <75% - Major improvements required');
}
console.log('');
