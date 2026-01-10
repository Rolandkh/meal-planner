/**
 * Fix Corrupted Recipe Data
 * Handles OCR errors, mixed units, abbreviations, and data corruption
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

console.log('\n🔧 Fixing Corrupted Recipe Data');
console.log('=================================\n');

let fixed = 0;
let removed = 0;

for (const recipe of catalog.recipes) {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) continue;
  
  const cleanedIngredients = [];
  
  for (const ing of recipe.ingredients) {
    let name = typeof ing === 'string' ? ing : (ing.name || '');
    if (!name) continue;
    
    const original = name;
    let shouldRemove = false;
    
    // Fix 1: Handle "gr oz." mixed units (OCR error)
    if (name.match(/\d+\s*gr\s+oz\./i)) {
      name = name.replace(/\s*gr\s+oz\./gi, 'g');
      fixed++;
    }
    
    // Fix 2: Handle "pch" abbreviation for "pinch"
    if (name.match(/\bpch\b/i)) {
      name = name.replace(/\bpch\b/gi, 'pinch');
      fixed++;
    }
    
    // Fix 3: Fix "pts" abbreviation for "pints"
    if (name.match(/\bpts\b/i)) {
      name = name.replace(/\bpts\b/gi, 'ml');
      name = name.replace(/1\s*ml/i, '473ml');  // 1 pint = 473ml
      fixed++;
    }
    
    // Fix 4: Remove corrupt entries with fractions in wrong place
    if (name.match(/tsp\s+½|ml\s+¼|cup\s+⅓/i)) {
      // Fraction appears after unit (OCR error)
      shouldRemove = true;
      removed++;
    }
    
    // Fix 5: Remove entries that are just units
    if (name.match(/^(teaspoon|tablespoon|cup|oz|gram)s?$/i)) {
      shouldRemove = true;
      removed++;
    }
    
    // Fix 6: Handle "box" as unit for packaged items
    if (name.match(/\d+\s+box\s+/i)) {
      name = name.replace(/\d+\s+box\s+/gi, '');
      fixed++;
    }
    
    // Fix 7: Handle "pack package" duplication
    if (name.includes('pack package')) {
      name = name.replace(/pack package/gi, '');
      fixed++;
    }
    
    // Fix 8: Handle "from a" descriptors
    if (name.includes('from a')) {
      name = name.replace(/from a .+$/i, '').trim();
      fixed++;
    }
    
    // Fix 9: Remove "natrel" and other brand names
    const brands = ['natrel', 'lactose free', 'dutch', 'baby'];
    brands.forEach(brand => {
      if (name.toLowerCase().includes(brand)) {
        name = name.replace(new RegExp(brand, 'gi'), '').trim();
        fixed++;
      }
    });
    
    if (shouldRemove) continue;
    
    // Clean up spacing
    name = name.replace(/\s+/g, ' ').trim();
    
    if (original !== name && name.length > 0) {
      console.log('  Fixed: "' + original + '" → "' + name + '"');
    }
    
    if (typeof ing === 'string') {
      cleanedIngredients.push(name);
    } else {
      cleanedIngredients.push({ ...ing, name });
    }
  }
  
  recipe.ingredients = cleanedIngredients;
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

console.log('\n📊 Summary:');
console.log('   Fixed: ' + fixed);
console.log('   Removed: ' + removed);
console.log('\n✅ Recipe data cleaned!\n');
