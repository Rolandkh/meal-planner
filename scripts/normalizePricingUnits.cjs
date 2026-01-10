/**
 * Normalize Pricing Units to Scientific Measures
 * 
 * Converts all pricing from retail units (bunch, head, each, pack)
 * to scientific units (per kg, per L) for accurate calculations.
 * 
 * Adds:
 * - typicalWeight: grams per retail unit
 * - pricePerKg: normalized price
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const RETAIL_WEIGHTS_PATH = path.join(__dirname, '../references/retail-unit-weights.json');

console.log('\n📐 Normalizing Pricing Units to Scientific Measures');
console.log('===================================================\n');

// Load data
const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
const retailWeights = JSON.parse(fs.readFileSync(RETAIL_WEIGHTS_PATH, 'utf8'));

const ingredientsWithPricing = Object.values(masterData.ingredients).filter(i => i.pricing);

console.log('Ingredients with pricing: ' + ingredientsWithPricing.length);
console.log('');

let normalized = 0;
let alreadyNormalized = 0;
let failed = 0;

for (const ing of ingredientsWithPricing) {
  if (!ing.pricing) continue;
  
  // Skip if already normalized
  if (ing.pricing.pricePerKg || ing.pricing.pricePerL) {
    alreadyNormalized++;
    continue;
  }
  
  const pricing = ing.pricing;
  const unit = pricing.unit;
  
  // Already in scientific units
  if (unit === 'kg' || unit === 'L') {
    pricing.pricePerKg = unit === 'kg' ? pricing.averagePrice : null;
    pricing.pricePerL = unit === 'L' ? pricing.averagePrice : null;
    normalized++;
    continue;
  }
  
  // Extract weight from unitSize description if available
  let weightGrams = null;
  
  // Try to extract from description: "120-150g bag", "1kg", "500g pack"
  const sizeMatch = pricing.unitSize.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|L)/);
  if (sizeMatch) {
    const value = parseFloat(sizeMatch[1]);
    const extractedUnit = sizeMatch[2];
    
    if (extractedUnit === 'kg') {
      weightGrams = value * 1000;
    } else if (extractedUnit === 'g') {
      weightGrams = value;
    } else if (extractedUnit === 'L') {
      pricing.pricePerL = pricing.averagePrice / value;
      pricing.volumeL = value;
      normalized++;
      continue;
    } else if (extractedUnit === 'ml') {
      pricing.pricePerL = pricing.averagePrice / (value / 1000);
      pricing.volumeL = value / 1000;
      normalized++;
      continue;
    }
  }
  
  // If not extracted, look up typical weight
  if (!weightGrams && retailWeights.retailUnitWeights[unit]) {
    const unitData = retailWeights.retailUnitWeights[unit];
    
    // Try ingredient-specific weight
    if (unitData.byIngredient && unitData.byIngredient[ing.id]) {
      weightGrams = unitData.byIngredient[ing.id];
    } else if (unitData.default) {
      weightGrams = unitData.default;
    }
  }
  
  // Calculate price per kg
  if (weightGrams) {
    const pricePerKg = (pricing.averagePrice / weightGrams) * 1000;
    
    pricing.typicalWeight = weightGrams;
    pricing.typicalWeightUnit = 'g';
    pricing.pricePerKg = Math.round(pricePerKg * 100) / 100;
    
    console.log('  ✅ ' + ing.displayName + ': $' + pricing.averagePrice + '/' + unit + 
                ' → $' + pricing.pricePerKg + '/kg (' + weightGrams + 'g per ' + unit + ')');
    
    normalized++;
  } else {
    console.log('  ⚠️  ' + ing.displayName + ': Could not determine weight for ' + unit);
    failed++;
  }
}

// Save
masterData._lastUpdated = new Date().toISOString();
fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log('\n📊 Summary:');
console.log('===========');
console.log('  Normalized: ' + normalized);
console.log('  Already normalized: ' + alreadyNormalized);
console.log('  Failed (need manual weights): ' + failed);
console.log('');

const total = Object.values(masterData.ingredients).filter(i => i.pricing).length;
const withPerKg = Object.values(masterData.ingredients).filter(i => i.pricing && (i.pricing.pricePerKg || i.pricing.pricePerL)).length;

console.log('📈 Final Coverage:');
console.log('  Ingredients with pricing: ' + total);
console.log('  With normalized per-kg/L: ' + withPerKg + ' (' + Math.round(withPerKg/total*100) + '%)');
console.log('');
console.log('✅ Pricing units normalized!\n');
