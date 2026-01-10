import { initializeIngredientState } from '../src/utils/componentGenerator.js';

const ingredientMaster = JSON.parse(
  await import('fs').then(fs => fs.promises.readFile('./src/data/ingredientMaster.json', 'utf8'))
);

const testIngredients = [
  { name: 'mushrooms', quantity: 100, unit: 'g' },
  { name: 'spinach', quantity: 100, unit: 'g' }
];

const state = initializeIngredientState(testIngredients, ingredientMaster);

state.forEach((s, name) => {
  console.log(`${name}:`);
  console.log(`  Matched ID: ${s.ingredientId}`);
  console.log(`  Cost: $${s.costAUD.toFixed(2)}`);
  console.log(`  Expected: mushrooms_button ($0.45), spinach_bunch ($2.92)`);
});
