/**
 * Enrich Only New Ingredients (without nutrition data)
 * Processes only ingredients that don't have nutritionBase yet
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { getNutritionByName } = require('./spoonacularNutrition.cjs');

const multipliersData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../references/nutrition-multipliers.json'), 'utf8')
);

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

function determineIngredientType(ingredient) {
  const tags = ingredient.tags || [];
  const tagsStr = tags.join(' ').toLowerCase();
  const displayName = ingredient.displayName.toLowerCase();
  
  if (tagsStr.includes('meat') || tagsStr.includes('poultry') || displayName.includes('chicken') || displayName.includes('beef') || displayName.includes('pork') || displayName.includes('lamb')) {
    return 'meat';
  }
  if (tagsStr.includes('fish') || tagsStr.includes('seafood') || displayName.includes('fish') || displayName.includes('salmon')) {
    return 'fish';
  }
  if (tagsStr.includes('vegetable') || tagsStr.includes('produce')) {
    return 'vegetables';
  }
  return null;
}

function generatePreparationVariants(ingredientType = null) {
  const methods = ['raw', 'grilled', 'baked', 'fried', 'boiled', 'steamed', 'air-fried'];
  const variants = {};
  
  for (const method of methods) {
    const methodData = multipliersData.defaultMultipliers[method];
    if (!methodData) continue;
    
    variants[method] = {
      multipliers: { ...methodData.multipliers },
      notes: methodData.notes
    };
    
    if (methodData.oilAbsorption) {
      variants[method].oilAbsorption = methodData.oilAbsorption;
    }
    
    if (ingredientType && multipliersData.ingredientSpecificAdjustments[ingredientType]) {
      const adjustments = multipliersData.ingredientSpecificAdjustments[ingredientType][method];
      if (adjustments) {
        variants[method].multipliers = { ...variants[method].multipliers, ...adjustments };
        if (adjustments.notes) {
          variants[method].notes += ' | ' + adjustments.notes;
        }
      }
    }
  }
  
  return variants;
}

async function enrichNewIngredients() {
  console.log('\n🔧 Enriching New Ingredients');
  console.log('============================\n');
  
  const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
  const allIngredients = Object.values(masterData.ingredients);
  
  // Filter to only ingredients without nutrition
  const needEnrichment = allIngredients.filter(ing => !ing.nutritionBase);
  
  console.log(`📊 Status:`);
  console.log(`   Total ingredients: ${allIngredients.length}`);
  console.log(`   Already enriched: ${allIngredients.length - needEnrichment.length}`);
  console.log(`   Need enrichment: ${needEnrichment.length}\n`);
  
  if (!SPOONACULAR_API_KEY) {
    console.error('❌ SPOONACULAR_API_KEY not found');
    process.exit(1);
  }
  
  console.log(`🔑 API key found. Starting enrichment...\n`);
  console.log(`⏱️  Estimated time: ~${Math.round(needEnrichment.length * 1.2 / 60)} minutes\n`);
  
  const stats = {
    total: needEnrichment.length,
    success: 0,
    failed: 0,
    failedList: []
  };
  
  for (let i = 0; i < needEnrichment.length; i++) {
    const ingredient = needEnrichment[i];
    
    console.log(`[${i + 1}/${needEnrichment.length}] ${ingredient.displayName} (${ingredient.id})`);
    
    // Fetch nutrition
    try {
      const nutrition = await getNutritionByName(ingredient.displayName, SPOONACULAR_API_KEY);
      
      if (nutrition) {
        masterData.ingredients[ingredient.id].nutritionBase = nutrition;
        console.log(`   ✅ Nutrition added`);
        stats.success++;
      } else {
        console.log(`   ⚠️  Not found in Spoonacular`);
        stats.failed++;
        stats.failedList.push(ingredient.displayName);
      }
      
      // Add preparation variants regardless
      if (!ingredient.nutritionByPreparation) {
        const ingredientType = determineIngredientType(ingredient);
        const variants = generatePreparationVariants(ingredientType);
        masterData.ingredients[ingredient.id].nutritionByPreparation = variants;
        console.log(`   🍳 Preparation variants added`);
      }
      
      // Rate limiting (800ms per request = ~75 requests/minute)
      if (i < needEnrichment.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      stats.failed++;
      stats.failedList.push(ingredient.displayName);
    }
  }
  
  // Save
  masterData._lastUpdated = new Date().toISOString();
  fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
  
  console.log(`\n📊 Final Summary:`);
  console.log(`=================`);
  console.log(`Total processed: ${stats.total}`);
  console.log(`✅ Success: ${stats.success} (${Math.round(stats.success/stats.total*100)}%)`);
  console.log(`⚠️  Failed: ${stats.failed}`);
  
  if (stats.failedList.length > 0 && stats.failedList.length < 50) {
    console.log(`\n⚠️  Failed ingredients:`);
    stats.failedList.forEach(name => console.log(`   - ${name}`));
  }
  
  console.log(`\n✅ Enrichment complete!\n`);
}

enrichNewIngredients().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
