import { convertToGrams } from '../src/utils/unitConversion.js';
import { calculateIngredientCost } from '../src/utils/costCalculator.js';

const catalog = JSON.parse(await import('fs').then(fs => fs.promises.readFile('./src/data/vanessa_recipe_catalog.json', 'utf8')));
const ingredientMaster = JSON.parse(await import('fs').then(fs => fs.promises.readFile('./src/data/ingredientMaster.json', 'utf8')));

const recipe = catalog.recipes[9]; // Lasagna
const ingredients = ingredientMaster.ingredients;

console.log(`\nLasagna Ingredient Cost Breakdown:\n`);
console.log('='.repeat(80));

let totalCost = 0;

recipe.ingredients.forEach(ing => {
  // Find ingredient
  const normalized = ing.name.toLowerCase().trim();
  let ingData = ingredients[normalized];
  
  if (!ingData) {
    // Search by aliases
    for (const [id, data] of Object.entries(ingredients)) {
      if (id.startsWith('_')) continue;
      if (data.aliases?.some(alias => alias.toLowerCase() === normalized)) {
        ingData = { id, ...data };
        break;
      }
    }
  } else {
    ingData = { id: normalized, ...ingData };
  }
  
  if (!ingData) {
    console.log(`❌ ${ing.name}: NOT FOUND`);
    return;
  }
  
  // Convert to grams
  const quantityG = convertToGrams(ing.quantity, ing.unit, ing.name, ingData);
  
  // Calculate cost
  const cost = calculateIngredientCost(quantityG, ingData);
  totalCost += cost;
  
  const pricePerKg = ingData.pricing?.pricePerKg || 0;
  
  console.log(`${ing.quantity}${ing.unit} ${ing.name.padEnd(30)} → ${quantityG.toFixed(0).padStart(5)}g × $${pricePerKg.toFixed(2).padStart(6)}/kg = $${cost.toFixed(2).padStart(7)}`);
});

console.log('='.repeat(80));
console.log(`TOTAL: $${totalCost.toFixed(2)}`);
console.log(`Per Serving (6): $${(totalCost / 6).toFixed(2)}`);
console.log(`\nExpected range: $8-15 per serving`);
