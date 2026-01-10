#!/usr/bin/env node
/**
 * Dictionary Consolidation Script
 * 
 * Consolidates duplicate ingredient IDs and adds missing common ingredients.
 * This addresses the root cause of shopping list bloat: too many separate IDs
 * for what should be the same ingredient.
 * 
 * Key fixes:
 * 1. Merge plural/singular variations (tomato/tomatoes, onion/onions)
 * 2. Merge preparation variations (basil/basil_leaves)
 * 3. Add missing common ingredients (banana, peach, pistachio, etc.)
 * 4. Update aliases for better matching
 */

const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');

// Read current dictionary
const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

console.log('=== DICTIONARY CONSOLIDATION ===');
console.log(`Starting with ${master._totalEntries} entries (v${master._version})`);
console.log('');

// Track changes
const changes = {
  merged: [],
  added: [],
  aliasesAdded: []
};

// STEP 1: Define which IDs should be MERGED into a canonical ID
// Format: { canonicalId: [idsToMerge] }
const mergeMap = {
  // Singular/plural - keep singular as canonical
  'tomato': ['tomatoes'],
  'onion': ['onions'],
  'carrot': ['carrots'],
  'shallot': ['shallots'],
  
  // Keep the more specific form as canonical
  'greek_yogurt': ['yogurt'],  // Most yogurt in recipes is Greek yogurt
  'chicken_breast': ['chicken_breasts', 'chicken'],  // Consolidate chicken varieties
  
  // Herb variations - keep simple name
  'basil': ['basil_leaves'],
  'parsley': ['flat_leaf_parsley'],
  'cilantro': ['cilantro_leaves'],
  'coriander': ['coriander_powder', 'coriander_leaves'],
  'thyme': ['thyme_leaves'],
  'mint': ['mint_leaves'],
  
  // Allium variations
  'green_onions': ['scallions', 'scallion', 'green_onion'],
  
  // Cumin variations
  'cumin': ['cumin_seeds', 'cumin_powder'],
  
  // Cayenne
  'cayenne': ['cayenne_pepper'],
  
  // Cheese variations
  'mozzarella_cheese': ['mozzarella'],
  
  // Breadcrumbs
  'breadcrumbs': ['bread_crumbs'],
  
  // Salmon
  'salmon': ['salmon_fillet', 'salmon_fillets'],
  
  // Ground meats
  'ground_beef': ['beef'],
  
  // Lime juice variations
  'lime_juice': ['juice_lime']
};

// STEP 2: Missing common ingredients to add
const missingIngredients = {
  'banana': {
    displayName: 'banana',
    canonicalUnit: 'whole',
    state: 'fresh',
    density: { gPerCup: 225, gPerTbsp: 14, gPerTsp: 4.7 },
    aliases: ['banana', 'bananas', 'ripe banana', 'ripe bananas'],
    tags: ['fruit', 'produce']
  },
  'peach': {
    displayName: 'peach',
    canonicalUnit: 'whole',
    state: 'fresh',
    density: { gPerCup: 154, gPerTbsp: 9.6, gPerTsp: 3.2 },
    aliases: ['peach', 'peaches', 'fresh peach', 'fresh peaches', 'canned peaches'],
    tags: ['fruit', 'produce']
  },
  'pistachio': {
    displayName: 'pistachios',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 123, gPerTbsp: 7.7, gPerTsp: 2.6 },
    aliases: ['pistachio', 'pistachios', 'shelled pistachios', 'roasted pistachios'],
    tags: ['nuts']
  },
  'tuna': {
    displayName: 'tuna',
    canonicalUnit: 'g',
    state: 'canned',
    density: { gPerCup: 182, gPerTbsp: 11.4, gPerTsp: 3.8 },
    aliases: ['tuna', 'canned tuna', 'tuna fish', 'chunk light tuna', 'albacore tuna'],
    tags: ['protein', 'seafood']
  },
  'orzo': {
    displayName: 'orzo',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 160, gPerTbsp: 10, gPerTsp: 3.3 },
    aliases: ['orzo', 'orzo pasta', 'risoni'],
    tags: ['grain', 'pasta']
  },
  'pizza_sauce': {
    displayName: 'pizza sauce',
    canonicalUnit: 'g',
    state: 'canned',
    density: { gPerCup: 240, gPerTbsp: 15, gPerTsp: 5 },
    aliases: ['pizza sauce', 'pizza marinara', 'pizza topping sauce'],
    tags: ['sauce']
  },
  'kalamata_olives': {
    displayName: 'kalamata olives',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 180, gPerTbsp: 11.3, gPerTsp: 3.8 },
    aliases: ['kalamata olives', 'kalamata', 'greek olives', 'black olives'],
    tags: ['produce', 'mediterranean']
  },
  'capers': {
    displayName: 'capers',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 144, gPerTbsp: 9, gPerTsp: 3 },
    aliases: ['capers', 'caperberries'],
    tags: ['condiment', 'mediterranean']
  },
  'artichoke_hearts': {
    displayName: 'artichoke hearts',
    canonicalUnit: 'g',
    state: 'canned',
    density: { gPerCup: 168, gPerTbsp: 10.5, gPerTsp: 3.5 },
    aliases: ['artichoke hearts', 'artichokes', 'canned artichokes', 'marinated artichoke hearts'],
    tags: ['vegetable']
  },
  'pepperoni': {
    displayName: 'pepperoni',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 135, gPerTbsp: 8.4, gPerTsp: 2.8 },
    aliases: ['pepperoni', 'pepperoni slices', 'mini pepperoni'],
    tags: ['meat', 'protein']
  },
  'lettuce': {
    displayName: 'lettuce',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 47, gPerTbsp: 3, gPerTsp: 1 },
    aliases: ['lettuce', 'romaine lettuce', 'iceberg lettuce', 'mixed greens', 'salad greens'],
    tags: ['vegetable', 'leafy_green']
  },
  'white_fish': {
    displayName: 'white fish',
    canonicalUnit: 'g',
    state: 'fresh',
    density: null,
    aliases: ['white fish', 'white fish fillet', 'cod', 'tilapia', 'halibut', 'sea bass', 'snapper'],
    tags: ['protein', 'seafood']
  }
};

// STEP 3: Execute merges
console.log('--- Merging duplicate IDs ---');
for (const [canonicalId, idsToMerge] of Object.entries(mergeMap)) {
  const canonical = master.ingredients[canonicalId];
  
  if (!canonical) {
    console.log(`⚠️ Canonical ID not found: ${canonicalId}`);
    continue;
  }
  
  for (const mergeId of idsToMerge) {
    const toMerge = master.ingredients[mergeId];
    if (!toMerge) continue;
    
    // Add all aliases from merged ingredient to canonical
    const newAliases = toMerge.aliases || [];
    const existingAliases = new Set(canonical.aliases || []);
    
    // Add the ID itself as an alias
    existingAliases.add(mergeId.replace(/_/g, ' '));
    
    // Add all aliases
    newAliases.forEach(alias => existingAliases.add(alias));
    
    canonical.aliases = Array.from(existingAliases);
    
    // Add frequency if present
    if (toMerge._frequency) {
      canonical._frequency = (canonical._frequency || 0) + toMerge._frequency;
    }
    
    // Delete the merged ingredient
    delete master.ingredients[mergeId];
    changes.merged.push(`${mergeId} → ${canonicalId}`);
    console.log(`✓ Merged ${mergeId} → ${canonicalId}`);
  }
}

// STEP 4: Add missing ingredients
console.log('');
console.log('--- Adding missing ingredients ---');
for (const [id, ingredient] of Object.entries(missingIngredients)) {
  if (!master.ingredients[id]) {
    master.ingredients[id] = {
      id,
      ...ingredient
    };
    changes.added.push(id);
    console.log(`✓ Added ${id}`);
  } else {
    console.log(`⏭️ ${id} already exists`);
  }
}

// STEP 5: Add additional aliases to existing ingredients for better matching
console.log('');
console.log('--- Adding additional aliases ---');
const additionalAliases = {
  'olive_oil': ['olive oil', 'extra virgin olive oil', 'evoo', 'virgin olive oil', 'extra-virgin olive oil', 'cooking oil'],
  'tomato': ['tomato', 'tomatoes', 'fresh tomato', 'fresh tomatoes', 'ripe tomato', 'ripe tomatoes'],
  'onion': ['onion', 'onions', 'yellow onion', 'yellow onions', 'white onion', 'white onions', 'sweet onion'],
  'garlic': ['garlic', 'garlic cloves', 'clove garlic', 'cloves garlic', 'fresh garlic', 'garlic clove', 'minced garlic'],
  'chicken_breast': ['chicken breast', 'chicken breasts', 'boneless chicken breast', 'skinless chicken breast', 'chicken', 'boneless skinless chicken breast'],
  'greek_yogurt': ['greek yogurt', 'yogurt', 'plain greek yogurt', 'nonfat greek yogurt', 'lowfat greek yogurt', 'fat-free greek yogurt', 'plain yogurt'],
  'feta_cheese': ['feta cheese', 'feta', 'crumbled feta', 'feta crumbles', 'greek feta'],
  'parmesan_cheese': ['parmesan cheese', 'parmesan', 'parmigiano', 'grated parmesan', 'parmigiano reggiano', 'parm'],
  'lemon_juice': ['lemon juice', 'fresh lemon juice', 'juice of lemon', 'lemon', 'juice lemon'],
  'cherry_tomatoes': ['cherry tomatoes', 'cherry tomato', 'grape tomatoes', 'grape tomato', 'small tomatoes'],
  'green_beans': ['green beans', 'string beans', 'french beans', 'haricots verts'],
  'quinoa': ['quinoa', 'cooked quinoa', 'white quinoa', 'red quinoa'],
  'honey': ['honey', 'raw honey', 'pure honey', 'local honey'],
  'salt': ['salt', 'sea salt', 'kosher salt', 'table salt', 'fine salt', 'coarse salt'],
  'pepper': ['pepper', 'black pepper', 'ground pepper', 'ground black pepper', 'cracked pepper', 'freshly ground pepper']
};

for (const [id, newAliases] of Object.entries(additionalAliases)) {
  const ingredient = master.ingredients[id];
  if (!ingredient) {
    console.log(`⚠️ Cannot add aliases, ID not found: ${id}`);
    continue;
  }
  
  const existingAliases = new Set(ingredient.aliases || []);
  let added = 0;
  
  newAliases.forEach(alias => {
    if (!existingAliases.has(alias)) {
      existingAliases.add(alias);
      added++;
    }
  });
  
  ingredient.aliases = Array.from(existingAliases);
  
  if (added > 0) {
    changes.aliasesAdded.push(`${id} (+${added} aliases)`);
    console.log(`✓ ${id}: added ${added} new aliases`);
  }
}

// STEP 6: Update metadata
const newCount = Object.keys(master.ingredients).length;
master._totalEntries = newCount;
master._version = '5.0.0';  // Major version bump for consolidation
master._lastUpdated = new Date().toISOString();
master._coverage = 'Consolidated dictionary with merged variations and common ingredients';

// STEP 7: Save updated dictionary
fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));

// Summary
console.log('');
console.log('=== SUMMARY ===');
console.log(`Merged: ${changes.merged.length} entries`);
console.log(`Added: ${changes.added.length} entries`);
console.log(`Aliases updated: ${changes.aliasesAdded.length} entries`);
console.log('');
console.log(`Final count: ${newCount} entries (v${master._version})`);
console.log('');
console.log('✅ Dictionary consolidated successfully!');
console.log('');
console.log('Next steps:');
console.log('1. Run: node scripts/reNormalizeCatalog.js');
console.log('2. Test the shopping list in browser');
