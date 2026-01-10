/**
 * Fix Specific Formatting Errors Found in Testing
 * Enhances ingredient catalog to handle all discovered edge cases
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

console.log('\n🔧 Fixing Formatting Errors & Adding Aliases');
console.log('============================================\n');

let added = 0;
let aliasesAdded = 0;

// 1. Handle temperature variants (warm/cold milk)
if (catalog.ingredients['milk']) {
  const warmAliases = ['warm milk', 'cold milk', 'room temperature milk', 'heated milk'];
  warmAliases.forEach(alias => {
    if (!catalog.ingredients['milk'].aliases.includes(alias)) {
      catalog.ingredients['milk'].aliases.push(alias);
      aliasesAdded++;
    }
  });
}

// 2. Handle soy milk variants
if (catalog.ingredients['soy_milk']) {
  if (!catalog.ingredients['soy_milk'].aliases.includes('soy milk')) {
    catalog.ingredients['soy_milk'].aliases.push('soy milk');
    aliasesAdded++;
  }
} else if (catalog.ingredients['soy_milk_original']) {
  catalog.ingredients['soy_milk_original'].aliases.push('soy milk');
  aliasesAdded++;
}

// 3. Add monterey jack cheese
if (!catalog.ingredients['monterey_jack']) {
  catalog.ingredients['monterey_jack'] = {
    id: 'monterey_jack',
    displayName: 'monterey jack',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 112, gPerTbsp: 7, gPerTsp: 2.3 },
    aliases: ['monterey jack', 'monterey jack cheese', 'montery jack', 'monteray jack'],
    tags: ['dairy', 'cheese']
  };
  added++;
}

// 4. Add cheese blends
if (!catalog.ingredients['cheese_blend']) {
  catalog.ingredients['cheese_blend'] = {
    id: 'cheese_blend',
    displayName: 'cheese blend',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 112, gPerTbsp: 7, gPerTsp: 2.3 },
    aliases: ['cheese blend', 'cheese mix', 'mixed cheese', 'cheddar mozzarella', 'monterey jack cheddar', 'cheddar monterey jack'],
    tags: ['dairy', 'cheese']
  };
  added++;
}

// 5. Add seafood stock
if (!catalog.ingredients['seafood_stock']) {
  catalog.ingredients['seafood_stock'] = {
    id: 'seafood_stock',
    displayName: 'seafood stock',
    canonicalUnit: 'ml',
    state: 'other',
    density: null,
    aliases: ['seafood stock', 'fish stock', 'shellfish stock', 'seafood broth'],
    tags: ['stock', 'seafood']
  };
  added++;
}

// 6. Handle "slice" as unit for bread/cheese
if (catalog.ingredients['bread']) {
  const sliceAliases = ['slice bread', 'slices bread', 'bread slice', 'crusty bread', 'multigrain bread'];
  sliceAliases.forEach(alias => {
    if (!catalog.ingredients['bread'].aliases.includes(alias)) {
      catalog.ingredients['bread'].aliases.push(alias);
      aliasesAdded++;
    }
  });
}

// 7. Add genoa salami
if (!catalog.ingredients['salami'].aliases.includes('genoa salami')) {
  catalog.ingredients['salami'].aliases.push('genoa salami', 'genoa');
  aliasesAdded++;
}

// 8. Handle pasta varieties
if (catalog.ingredients['pasta']) {
  const pastaAliases = ['noodles', 'pasta noodles', 'egg noodles pasta', 'farfalle pasta', 'piccolini farfalle'];
  pastaAliases.forEach(alias => {
    if (!catalog.ingredients['pasta'].aliases.includes(alias)) {
      catalog.ingredients['pasta'].aliases.push(alias);
      aliasesAdded++;
    }
  });
}

// 9. Add egg substitute
if (!catalog.ingredients['egg_substitute']) {
  catalog.ingredients['egg_substitute'] = {
    id: 'egg_substitute',
    displayName: 'egg substitute',
    canonicalUnit: 'ml',
    state: 'other',
    density: null,
    aliases: ['egg substitute', 'egg replacer', 'vegan egg', 'ener-g egg substitute'],
    tags: ['baking', 'vegan']
  };
  added++;
}

// 10. Handle compound meat descriptions
if (catalog.ingredients['chicken_thigh']) {
  if (!catalog.ingredients['chicken_thigh'].aliases.includes('chicken thighs and legs')) {
    catalog.ingredients['chicken_thigh'].aliases.push('chicken thighs and legs', 'chicken legs and thighs', 'chicken thigh and leg');
    aliasesAdded++;
  }
}

// 11. Add spice blends
if (!catalog.ingredients['spice_blend']) {
  catalog.ingredients['spice_blend'] = {
    id: 'spice_blend',
    displayName: 'spice blend',
    canonicalUnit: 'g',
    state: 'dried',
    density: { gPerCup: 112, gPerTbsp: 7, gPerTsp: 2.5 },
    aliases: ['spice blend', 'spice mix', 'seasoning blend', 'four seasons blend', 'mixed spices'],
    tags: ['spice', 'seasoning']
  };
  added++;
}

// 12. Handle "herbs" generic
if (!catalog.ingredients['herbs']) {
  catalog.ingredients['herbs'] = {
    id: 'herbs',
    displayName: 'herbs',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 20, gPerTbsp: 1.3, gPerTsp: 0.4 },
    aliases: ['herbs', 'fresh herbs', 'mixed herbs fresh', 'herb blend'],
    tags: ['herb']
  };
  added++;
}

// 13. Handle cooking oils with descriptors
if (catalog.ingredients['vegetable_oil']) {
  if (!catalog.ingredients['vegetable_oil'].aliases.includes('vegetable cooking oil')) {
    catalog.ingredients['vegetable_oil'].aliases.push('vegetable cooking oil', 'cooking oil vegetable');
    aliasesAdded++;
  }
}

// 14. Add red wine (not vinegar!)
if (!catalog.ingredients['red_wine']) {
  catalog.ingredients['red_wine'] = {
    id: 'red_wine',
    displayName: 'red wine',
    canonicalUnit: 'ml',
    state: 'other',
    density: null,
    aliases: ['red wine', 'dry red wine', 'red cooking wine'],
    tags: ['alcohol', 'cooking']
  };
  added++;
}

// 15. Handle pie crust
if (!catalog.ingredients['pie_crust']) {
  catalog.ingredients['pie_crust'] = {
    id: 'pie_crust',
    displayName: 'pie crust',
    canonicalUnit: 'g',
    state: 'other',
    density: null,
    aliases: ['pie crust', 'crust', 'pastry crust', 'tart crust'],
    tags: ['baking']
  };
  added++;
}

catalog._totalEntries = Object.keys(catalog.ingredients).length;
catalog._lastUpdated = new Date().toISOString();

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

console.log('✅ Fixes Applied:');
console.log(`   New ingredients added:   ${added}`);
console.log(`   Aliases added:           ${aliasesAdded}`);
console.log(`   Total ingredients:       ${catalog._totalEntries}`);
console.log('');
console.log('🎯 Ready for re-test!\n');
