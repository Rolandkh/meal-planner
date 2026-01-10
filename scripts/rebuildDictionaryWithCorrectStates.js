/**
 * Rebuild Dictionary with Correct States
 * 
 * Fixes state assignments by using smarter categorization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const current = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

console.log('🔧 Fixing state assignments in dictionary\n');
console.log(`Current entries: ${current._totalEntries}`);
console.log(`Current state distribution:`, current.ingredients ? Object.values(current.ingredients).reduce((acc, ing) => {
  acc[ing.state] = (acc[ing.state] || 0) + 1;
  return acc;
}, {}) : 'N/A');

let fixed = 0;
let unchanged = 0;

// Fix each ingredient's state based on its content
Object.values(current.ingredients).forEach(ing => {
  const name = ing.displayName.toLowerCase();
  const originalState = ing.state;
  let newState = originalState;
  
  // Spices (always "other" - sold dried/ground)
  const spices = ['cumin', 'oregano', 'paprika', 'turmeric', 'coriander', 'thyme',
                  'cayenne', 'cinnamon', 'nutmeg', 'cardamom', 'cloves', 'curry',
                  'chili', 'garam masala', 'allspice', 'bay', 'sage', 'dill',
                  'tarragon', 'marjoram', 'rosemary', 'fennel'];
  
  const isSpice = spices.some(s => name.includes(s) && !name.includes('oil'));
  
  // Oils (always "other")
  const isOil = name.includes('oil');
  
  // Sauces & condiments (always "other")
  const isSauce = name.includes('sauce') || name.includes('paste') || name.includes('vinegar');
  
  // Sweeteners (always "other")
  const isSweetener = name.includes('sugar') || name.includes('honey') || 
                       name.includes('syrup') || name.includes('molasses');
  
  // Grains & dry goods (always "other")  
  const isGrain = name.includes('flour') || name.includes('rice') || name.includes('pasta') ||
                  name.includes('quinoa') || name.includes('oat') || name.includes('bread') ||
                  name.includes('couscous') || name.includes('bulgur') || name.includes('noodle');
  
  // Baking items (always "other")
  const isBaking = name.includes('baking') || name.includes('yeast') || name.includes('cornstarch');
  
  // Nuts & seeds (always "other")
  const isNut = name.includes('almond') || name.includes('walnut') || name.includes('cashew') ||
                name.includes('pecan') || name.includes('pistachio') || name.includes('peanut') ||
                name.includes('seed') || name.includes('nut');
  
  // Pantry staples (always "other")
  const isPantry = name === 'salt' || name === 'pepper' || name === 'water' ||
                   name.includes('broth') || name.includes('stock');
  
  // Determine correct state
  if (isSpice || isOil || isSauce || isSweetener || isGrain || isBaking || isNut || isPantry) {
    newState = 'other';
  }
  // Explicitly canned items
  else if (name.includes('canned') || name.includes('tinned') ||
           (name.includes('bean') && !name.includes('green')) ||
           (name.includes('chickpea') || name.includes('garbanzo'))) {
    newState = 'canned';
  }
  // Explicitly frozen
  else if (name.includes('frozen')) {
    newState = 'frozen';
  }
  // Explicitly dried
  else if (name.includes('dried') && !isSpice) {
    newState = 'dried';
  }
  // Fresh produce, herbs, proteins, dairy
  else {
    newState = 'fresh';
  }
  
  // Update if changed
  if (newState !== originalState) {
    ing.state = newState;
    fixed++;
    console.log(`   Fixed: ${ing.id} (${originalState} → ${newState})`);
  } else {
    unchanged++;
  }
});

console.log(`\n✅ State corrections complete`);
console.log(`   Fixed: ${fixed} ingredients`);
console.log(`   Unchanged: ${unchanged} ingredients\n`);

// Show new distribution
const newDistribution = Object.values(current.ingredients).reduce((acc, ing) => {
  acc[ing.state] = (acc[ing.state] || 0) + 1;
  return acc;
}, {});

console.log('📊 New state distribution:', newDistribution);

// Save
current._version = '2.1.0';
current._lastUpdated = new Date().toISOString();

fs.writeFileSync(masterPath, JSON.stringify(current, null, 2));

console.log(`\n💾 Dictionary saved with corrected states!`);
console.log('   Version: 2.1.0\n');

console.log('=' .repeat(80));
console.log('\n🎯 NEXT: Re-normalize catalog\n');
console.log('   cp tmp/vanessa_recipe_catalog_backup.json src/data/vanessa_recipe_catalog.json');
console.log('   node scripts/normalizeExistingCatalog.js\n');
