/**
 * Integrate Shelf Life Data into Ingredient Master
 * 
 * Adds storage and expiry information from the shelf life database
 * to enable pantry management with automatic expiry tracking.
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const SHELF_LIFE_PATH = path.join(__dirname, '../references/ingredient_shelve_life_database.json');

console.log('\n📦 Integrating Shelf Life Data');
console.log('==============================\n');

// Load data
const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
const shelfLifeData = JSON.parse(fs.readFileSync(SHELF_LIFE_PATH, 'utf8'));

console.log('Shelf life database: ' + shelfLifeData.ingredients.length + ' items');
console.log('Ingredient master: ' + Object.keys(masterData.ingredients).length + ' items\n');

let matched = 0;
let unmatched = 0;

// Match by name and add shelf life data
for (const shelfItem of shelfLifeData.ingredients) {
  const name = shelfItem.name.toLowerCase();
  
  // Try to find matching ingredient in master
  let matchedId = null;
  
  // Direct name search
  for (const [id, ing] of Object.entries(masterData.ingredients)) {
    const displayLower = ing.displayName.toLowerCase();
    
    if (displayLower === name || name.includes(displayLower) || displayLower.includes(name)) {
      matchedId = id;
      break;
    }
    
    // Check aliases
    if (ing.aliases) {
      for (const alias of ing.aliases) {
        if (alias.toLowerCase() === name || name.includes(alias.toLowerCase())) {
          matchedId = id;
          break;
        }
      }
    }
    
    if (matchedId) break;
  }
  
  if (matchedId) {
    // Add shelf life data to ingredient
    masterData.ingredients[matchedId].storage = {
      location: shelfItem.storage,
      shelfLife: shelfItem.shelfLife,
      shelfLifeFrozen: shelfItem.shelfLifeFrozen,
      notes: shelfItem.notes
    };
    
    matched++;
    
    if (matched % 50 === 0) {
      console.log('  Progress: ' + matched + ' matched...');
    }
  } else {
    unmatched++;
  }
}

// Update schema to include storage field
if (masterData._schema) {
  masterData._schema.storage = {
    location: "Storage location: Fridge | Counter/Shelf | Pantry/Shelf | Pantry/Cool | Freezer",
    shelfLife: "How long item lasts at storage location (e.g., '3-7 days', '2-4 weeks', '1-5 years')",
    shelfLifeFrozen: "Shelf life if frozen (e.g., '8-12 months', 'Not needed', 'Not applicable')",
    notes: "Additional storage notes and category information"
  };
}

// Save
masterData._lastUpdated = new Date().toISOString();
fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log('\n📊 Summary:');
console.log('===========');
console.log('  Matched: ' + matched);
console.log('  Unmatched: ' + unmatched);
console.log('');

const withStorage = Object.values(masterData.ingredients).filter(i => i.storage).length;
console.log('📈 Storage data coverage: ' + withStorage + '/' + Object.keys(masterData.ingredients).length + ' (' + Math.round(withStorage/Object.keys(masterData.ingredients).length*100) + '%)');
console.log('');
console.log('✅ Shelf life data integrated!');
console.log('');
console.log('💡 Pantry features now enabled:');
console.log('   • Track ingredient purchase dates');
console.log('   • Calculate expiry dates automatically');
console.log('   • Alert when items expiring');
console.log('   • Optimize storage location');
console.log('');
