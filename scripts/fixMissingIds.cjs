/**
 * Fix Missing ID Fields in Ingredient Master
 * Adds the "id" field to all ingredients that are missing it
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

console.log('🔧 Fixing Missing ID Fields...\n');

// Load catalog
const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
const ingredients = masterData.ingredients;

let fixed = 0;
let alreadyOk = 0;

for (const [key, ingredient] of Object.entries(ingredients)) {
  if (!ingredient.id) {
    // Add missing ID field
    ingredient.id = key;
    fixed++;
    console.log(`✅ Fixed: ${key} → id: "${key}"`);
  } else {
    alreadyOk++;
  }
}

// Save updated catalog
fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixed}`);
console.log(`   Already OK: ${alreadyOk}`);
console.log(`   Total: ${fixed + alreadyOk}`);
console.log(`\n✅ Done! All ingredients now have ID fields.\n`);
