/**
 * Enrich Ingredient Catalog with Nutrition & Pricing Data
 * 
 * This script enriches the ingredient master catalog with:
 * 1. Base nutrition data from Spoonacular API
 * 2. Cooking method multipliers
 * 3. Pricing data (from collected pricing file or manual entry)
 * 
 * Usage:
 *   node scripts/enrichIngredientCatalog.cjs
 *   node scripts/enrichIngredientCatalog.cjs --pricing=tmp/pricing-data-123456.json
 *   node scripts/enrichIngredientCatalog.cjs --start=50 --end=100
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Spoonacular utilities
const { getNutritionByName, batchFetchNutrition } = require('./spoonacularNutrition.cjs');

// Load multipliers data
const multipliersData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../references/nutrition-multipliers.json'), 'utf8')
);

// Paths
const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const BACKUP_PATH = path.join(__dirname, '../src/data/ingredientMaster.v9.0.1.backup.json');

// API Key
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// Parse command line args
const args = process.argv.slice(2);
const options = {
  pricingFile: null,
  startIndex: 0,
  endIndex: null,
  skipNutrition: false,
  skipPricing: false,
  delay: 1000 // ms between API calls
};

for (const arg of args) {
  if (arg.startsWith('--pricing=')) {
    options.pricingFile = arg.split('=')[1];
  } else if (arg.startsWith('--start=')) {
    options.startIndex = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--end=')) {
    options.endIndex = parseInt(arg.split('=')[1]);
  } else if (arg === '--skip-nutrition') {
    options.skipNutrition = true;
  } else if (arg === '--skip-pricing') {
    options.skipPricing = true;
  } else if (arg.startsWith('--delay=')) {
    options.delay = parseInt(arg.split('=')[1]);
  }
}

/**
 * Generate preparation variants for an ingredient
 */
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
    
    // Add optional fields
    if (methodData.oilAbsorption) {
      variants[method].oilAbsorption = methodData.oilAbsorption;
    }
    
    // Apply ingredient-specific adjustments
    if (ingredientType && multipliersData.ingredientSpecificAdjustments[ingredientType]) {
      const adjustments = multipliersData.ingredientSpecificAdjustments[ingredientType][method];
      if (adjustments) {
        // Merge adjustments
        variants[method].multipliers = {
          ...variants[method].multipliers,
          ...adjustments
        };
        
        // Update notes if provided
        if (adjustments.notes) {
          variants[method].notes += ' | ' + adjustments.notes;
        }
      }
    }
  }
  
  return variants;
}

/**
 * Determine ingredient type for specific multipliers
 */
function determineIngredientType(ingredient) {
  const tags = ingredient.tags || [];
  const tagsStr = tags.join(' ').toLowerCase();
  const displayName = ingredient.displayName.toLowerCase();
  
  if (tagsStr.includes('meat') || tagsStr.includes('poultry') || displayName.includes('chicken') || displayName.includes('beef')) {
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

/**
 * Main enrichment process
 */
async function enrichCatalog() {
  console.log('\n🔧 Ingredient Catalog Enrichment Tool');
  console.log('======================================\n');
  
  // 1. Load ingredient master
  console.log('📖 Loading ingredient master...');
  const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
  const ingredients = Object.values(masterData.ingredients);
  
  console.log(`   Found ${ingredients.length} ingredients (version ${masterData._version})`);
  
  // 2. Create backup
  console.log('\n💾 Creating backup...');
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(masterData, null, 2));
  console.log(`   Backup saved: ${BACKUP_PATH}`);
  
  // 3. Load pricing data if provided
  let pricingMap = {};
  if (options.pricingFile && !options.skipPricing) {
    console.log(`\n💰 Loading pricing data from ${options.pricingFile}...`);
    const pricingData = JSON.parse(fs.readFileSync(options.pricingFile, 'utf8'));
    pricingMap = pricingData.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    console.log(`   Loaded pricing for ${Object.keys(pricingMap).length} ingredients`);
  }
  
  // 4. Determine range
  const startIdx = options.startIndex;
  const endIdx = options.endIndex || ingredients.length;
  const ingredientsToProcess = ingredients.slice(startIdx, endIdx);
  
  console.log(`\n📊 Processing ingredients ${startIdx + 1} to ${endIdx} (${ingredientsToProcess.length} total)`);
  
  // 5. Check API key
  if (!options.skipNutrition) {
    if (!SPOONACULAR_API_KEY) {
      console.error('\n❌ SPOONACULAR_API_KEY not found in environment variables');
      console.error('   Set it in .env file or use --skip-nutrition flag');
      process.exit(1);
    }
    console.log(`\n🔑 Spoonacular API key found (${SPOONACULAR_API_KEY.substring(0, 4)}...)`);
  }
  
  // 6. Process each ingredient
  const stats = {
    total: ingredientsToProcess.length,
    nutritionAdded: 0,
    nutritionFailed: 0,
    pricingAdded: 0,
    pricingMissing: 0,
    preparationVariantsAdded: 0,
    alreadyEnriched: 0
  };
  
  console.log('\n🚀 Starting enrichment process...\n');
  
  for (let i = 0; i < ingredientsToProcess.length; i++) {
    const ingredient = ingredientsToProcess[i];
    const globalIndex = startIdx + i;
    
    console.log(`[${i + 1}/${ingredientsToProcess.length}] ${ingredient.displayName} (${ingredient.id})`);
    
    let modified = false;
    
    // Check if already enriched
    if (ingredient.nutritionBase && ingredient.nutritionByPreparation && ingredient.pricing) {
      console.log(`   ✅ Already fully enriched, skipping`);
      stats.alreadyEnriched++;
      continue;
    }
    
    // Add nutrition data
    if (!options.skipNutrition && !ingredient.nutritionBase) {
      console.log(`   🔍 Fetching nutrition data...`);
      
      try {
        const nutrition = await getNutritionByName(ingredient.displayName, SPOONACULAR_API_KEY);
        
        if (nutrition) {
          masterData.ingredients[ingredient.id].nutritionBase = nutrition;
          console.log(`   ✅ Nutrition data added`);
          stats.nutritionAdded++;
          modified = true;
        } else {
          console.log(`   ⚠️  Could not find nutrition data`);
          stats.nutritionFailed++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, options.delay));
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        stats.nutritionFailed++;
      }
    } else if (ingredient.nutritionBase) {
      console.log(`   ⏭️  Nutrition data already exists`);
    }
    
    // Add preparation variants
    if (!ingredient.nutritionByPreparation) {
      console.log(`   🍳 Generating preparation variants...`);
      const ingredientType = determineIngredientType(ingredient);
      const variants = generatePreparationVariants(ingredientType);
      masterData.ingredients[ingredient.id].nutritionByPreparation = variants;
      console.log(`   ✅ Preparation variants added (${Object.keys(variants).length} methods)`);
      stats.preparationVariantsAdded++;
      modified = true;
    } else {
      console.log(`   ⏭️  Preparation variants already exist`);
    }
    
    // Add pricing data
    if (!options.skipPricing && !ingredient.pricing) {
      if (pricingMap[ingredient.id]) {
        console.log(`   💰 Adding pricing data...`);
        const pricing = pricingMap[ingredient.id];
        masterData.ingredients[ingredient.id].pricing = {
          averagePrice: pricing.averagePrice,
          unit: pricing.unit,
          unitSize: pricing.unitSize,
          currency: pricing.currency,
          region: pricing.region,
          lastUpdated: pricing.lastUpdated,
          source: pricing.source,
          notes: pricing.notes
        };
        console.log(`   ✅ Pricing added: $${pricing.averagePrice} per ${pricing.unit}`);
        stats.pricingAdded++;
        modified = true;
      } else {
        console.log(`   ⚠️  No pricing data available`);
        stats.pricingMissing++;
      }
    } else if (ingredient.pricing) {
      console.log(`   ⏭️  Pricing data already exists`);
    }
    
    console.log('');
  }
  
  // 7. Update metadata
  masterData._version = '10.0.0';
  masterData._lastUpdated = new Date().toISOString();
  
  // 8. Save enriched catalog
  console.log('\n💾 Saving enriched catalog...');
  fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
  console.log(`   ✅ Saved to: ${INGREDIENT_MASTER_PATH}`);
  
  // 9. Print summary
  console.log('\n📊 Enrichment Summary:');
  console.log('======================');
  console.log(`Total processed:        ${stats.total}`);
  console.log(`Already enriched:       ${stats.alreadyEnriched}`);
  console.log(`Nutrition added:        ${stats.nutritionAdded}`);
  console.log(`Nutrition failed:       ${stats.nutritionFailed}`);
  console.log(`Preparation variants:   ${stats.preparationVariantsAdded}`);
  console.log(`Pricing added:          ${stats.pricingAdded}`);
  console.log(`Pricing missing:        ${stats.pricingMissing}`);
  
  console.log('\n✅ Enrichment complete!\n');
  
  if (stats.nutritionFailed > 0 || stats.pricingMissing > 0) {
    console.log('⚠️  Some ingredients are missing data. Review logs above.\n');
  }
}

// Run
enrichCatalog().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
