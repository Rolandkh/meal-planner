import { convertToGrams } from '../src/utils/unitConversion.js';
import { calculateIngredientCost } from '../src/utils/costCalculator.js';

const catalog = JSON.parse(await import('fs').then(fs => fs.promises.readFile('./src/data/vanessa_recipe_catalog.json', 'utf8')));
const ingredientMaster = JSON.parse(await import('fs').then(fs => fs.promises.readFile('./src/data/ingredientMaster.json', 'utf8')));

const recipe = catalog.recipes[15]; // Italian Seafood Stew
const ingredients = ingredientMaster.ingredients;

console.log(`\n${recipe.name} - Detailed Cost Breakdown\n`);
console.log('='.repeat(80));

let totalCost = 0;

recipe.ingredients.forEach((ing, idx) => {
  // Find ingredient
  const normalized = ing.name.toLowerCase().trim().replace(/\s+/g, '_');
  let ingData = ingredients[normalized] || ingredients[ing.name.toLowerCase().trim()];
  
  if (!ingData) {
    // Search by aliases
    for (const [id, data] of Object.entries(ingredients)) {
      if (id.startsWith('_')) continue;
      if (data.aliases?.some(alias => alias.toLowerCase() === ing.name.toLowerCase().trim())) {
        ingData = { id, ...data };
        break;
      }
    }
  } else {
    ingData = { id: normalized, ...ingData };
  }
  
  if (!ingData) {
    console.log(`  ${idx + 1}. ❌ ${ing.name}: NOT FOUND`);
    return;
  }
  
  // Convert to grams
  const quantityG = convertToGrams(ing.quantity, ing.unit, ing.name, ingData);
  
  // Calculate cost
  const cost = calculateIngredientCost(quantityG, ingData);
  totalCost += cost;
  
  const pricePerKg = ingData.pricing?.pricePerKg || 0;
  const costPerServing = cost / recipe.servings;
  
  const flag = costPerServing > 5 ? ' 💰' : '';
  
  console.log(`  ${(idx + 1).toString().padStart(2)}. ${ing.quantity}${ing.unit} ${ing.name.padEnd(35)} → ${quantityG.toFixed(0).padStart(5)}g × $${pricePerKg.toFixed(2).padStart(6)}/kg = $${cost.toFixed(2).padStart(6)} ($${costPerServing.toFixed(2)}/serving)${flag}`);
});

console.log('='.repeat(80));
console.log(`TOTAL: $${totalCost.toFixed(2)} ($${(totalCost/recipe.servings).toFixed(2)}/serving)`);
console.log(`Expected seafood stew: $10-25/serving (seafood is expensive)`);
