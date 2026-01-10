/**
 * Pricing Data Collection Helper
 * 
 * Interactive script to help collect pricing data for all ingredients
 * in the master catalog from Coles and Woolworths online stores.
 * 
 * Usage: node scripts/collectPricingData.cjs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const PRICING_CSV_PATH = path.join(__dirname, '../references/pricing-data.csv');

// Melbourne, VIC pricing region
const REGION = 'Melbourne, VIC, Australia';
const CURRENCY = 'AUD';

// Load ingredient master
const ingredientMaster = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
const ingredients = Object.values(ingredientMaster.ingredients);

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Collect pricing for a single ingredient
 */
async function collectPricingForIngredient(ingredient) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Ingredient: ${ingredient.displayName} (${ingredient.id})`);
  console.log(`State: ${ingredient.state}`);
  console.log(`Canonical Unit: ${ingredient.canonicalUnit}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Check if already has pricing
  if (ingredient.pricing) {
    console.log(`⚠️  Already has pricing data:`);
    console.log(`   Price: $${ingredient.pricing.averagePrice} per ${ingredient.pricing.unit}`);
    console.log(`   Last updated: ${ingredient.pricing.lastUpdated}`);
    
    const update = await prompt('Update this pricing? (y/n): ');
    if (update.toLowerCase() !== 'y') {
      return null;
    }
  }
  
  console.log(`\n📋 Check Coles and Woolworths online for "${ingredient.displayName}"`);
  console.log(`   Coles: https://www.coles.com.au/search?q=${encodeURIComponent(ingredient.displayName)}`);
  console.log(`   Woolworths: https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(ingredient.displayName)}\n`);
  
  // Get Coles price
  const colesPrice = await prompt('Coles price ($/unit, or "skip"): ');
  if (colesPrice.toLowerCase() === 'skip') {
    console.log('⏭️  Skipping this ingredient\n');
    return null;
  }
  
  // Get Woolworths price
  const woolworthsPrice = await prompt('Woolworths price ($/unit, or same as Coles if not checked): ');
  
  // Get unit information
  const unit = await prompt(`Unit (kg/L/pack/bunch/etc, or press Enter for "${ingredient.canonicalUnit}"): `) || ingredient.canonicalUnit;
  const unitSize = await prompt('Unit size (e.g., "1kg", "500g bag", "6-pack"): ');
  
  // Optional notes
  const notes = await prompt('Notes (optional, press Enter to skip): ');
  
  // Calculate average
  const coles = parseFloat(colesPrice);
  const woolies = woolworthsPrice.toLowerCase() === 'skip' || woolworthsPrice === '' 
    ? coles 
    : parseFloat(woolworthsPrice);
  
  if (isNaN(coles) || isNaN(woolies)) {
    console.log('❌ Invalid prices entered. Skipping.\n');
    return null;
  }
  
  const averagePrice = Math.round(((coles + woolies) / 2) * 100) / 100;
  
  console.log(`\n✅ Average price: $${averagePrice} per ${unit}`);
  
  return {
    averagePrice,
    unit,
    unitSize,
    currency: CURRENCY,
    region: REGION,
    lastUpdated: new Date().toISOString().split('T')[0],
    source: 'manual',
    notes: notes || `Average of Coles ($${coles}) and Woolworths ($${woolies})`,
    _colesPrice: coles,
    _woolworthsPrice: woolies
  };
}

/**
 * Main collection process
 */
async function main() {
  console.log('\n🛒 Pricing Data Collection Tool');
  console.log('================================\n');
  console.log(`Total ingredients to price: ${ingredients.length}`);
  console.log(`Region: ${REGION}`);
  console.log(`Currency: ${CURRENCY}\n`);
  
  const startFrom = await prompt('Start from ingredient # (1-' + ingredients.length + ', or Enter for 1): ');
  const startIndex = startFrom ? parseInt(startFrom) - 1 : 0;
  
  console.log(`\nStarting from ingredient #${startIndex + 1}\n`);
  
  const pricingData = [];
  let collected = 0;
  let skipped = 0;
  
  for (let i = startIndex; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    
    console.log(`\n[${i + 1}/${ingredients.length}] Progress: ${Math.round((i / ingredients.length) * 100)}%`);
    
    const pricing = await collectPricingForIngredient(ingredient);
    
    if (pricing) {
      pricingData.push({
        id: ingredient.id,
        displayName: ingredient.displayName,
        ...pricing
      });
      collected++;
    } else {
      skipped++;
    }
    
    // Ask if user wants to continue
    if ((i + 1) < ingredients.length) {
      const continuePrompt = await prompt('\nContinue to next ingredient? (y/n/save): ');
      if (continuePrompt.toLowerCase() === 'n') {
        console.log('\n⏸️  Pausing collection...');
        break;
      } else if (continuePrompt.toLowerCase() === 'save') {
        console.log('\n💾 Saving progress...');
        break;
      }
    }
  }
  
  // Save collected data
  if (pricingData.length > 0) {
    const csvPath = path.join(__dirname, '../tmp/pricing-data-' + Date.now() + '.json');
    fs.writeFileSync(csvPath, JSON.stringify(pricingData, null, 2));
    
    console.log(`\n✅ Saved ${pricingData.length} pricing entries to: ${csvPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Collected: ${collected}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${collected + skipped}`);
    console.log(`\n💡 Next step: Run enrichIngredientCatalog.cjs to apply this pricing data\n`);
  } else {
    console.log('\n⚠️  No pricing data collected.\n');
  }
  
  rl.close();
}

// Run
main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
