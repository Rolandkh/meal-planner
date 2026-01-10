/**
 * Fix Dictionary Duplicates - Comprehensive
 * 
 * The Spoonacular integration created too many specific IDs.
 * This consolidates them aggressively to ~30-40 shopping list items.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== FIX DICTIONARY DUPLICATES (COMPREHENSIVE) ===\n');

// Load dictionary
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

console.log('Current entries:', master._totalEntries);

// Backup
const backupPath = path.join(__dirname, '../tmp/dictionary_before_comprehensive_fix.json');
fs.writeFileSync(backupPath, JSON.stringify(master, null, 2));
console.log('✅ Backup created\n');

// Comprehensive consolidation rules
const fixes = [
  // CRITICAL: Remove "salt_and_pepper" entirely - compounds should be split, not stored
  { removeIds: ['salt_and_pepper', 'salt_pepper'], reason: 'Compound ingredient - should be split at parse time' },
  
  // Garlic consolidation
  { canonical: 'garlic', removeIds: ['garlic_cloves', 'garlic_clove'], addAliases: ['garlic cloves', 'garlic clove', 'cloves of garlic'] },
  
  // Lemon juice (reversed word order)
  { canonical: 'lemon_juice', removeIds: ['juice_lemon'], addAliases: ['juice of lemon', 'juice lemon'] },
  
  // Eggs (plural/singular)
  { canonical: 'eggs', removeIds: ['egg'], addAliases: ['egg', 'whole egg', 'whole eggs'] },
  
  // Salt variations
  { canonical: 'salt', removeIds: ['sea_salt', 'kosher_salt', 'table_salt', 'coarse_salt'], addAliases: ['sea salt', 'kosher salt', 'table salt', 'coarse salt', 'fine salt'] },
  
  // Generic "seasoning" - remove (too vague)
  { removeIds: ['seasoning', 'seasoning_mix', 'seasoning_cube'], reason: 'Too vague - not a shoppable item' },
  
  // "Ore" - likely malformed
  { removeIds: ['ore'], reason: 'Malformed/unknown' },
  
  // Onion cuts (specific cuts should just be "onion")
  { canonical: 'onion', removeIds: ['onion_cut_pieces'], addAliases: ['onion pieces', 'cut onion'] },
  
  // Zucchini
  { canonical: 'zucchini', removeIds: ['zucchini_cut'], addAliases: ['cut zucchini'] },
  
  // Broth variations
  { canonical: 'chicken_broth', removeIds: ['chicken_stock'], addAliases: ['chicken stock'] },
  { canonical: 'vegetable_broth', removeIds: ['veggie_broth', 'vegetable_stock'], addAliases: ['veggie broth', 'vegetable stock', 'veggie stock'] },
  
  // Pasta types - consolidate similar
  { canonical: 'pasta', removeIds: ['pasta_shells', 'fusilli_pasta', 'tubular_pasta'], addAliases: ['pasta shells', 'fusilli', 'tubular pasta', 'penne', 'rigatoni'] },
  
  // Mushrooms
  { canonical: 'mushrooms', removeIds: ['button_mushrooms', 'packages_portabella_mushrooms'], addAliases: ['button mushrooms', 'white mushrooms'] }
];

let removed = 0;
let aliasesAdded = 0;

fixes.forEach(rule => {
  if (!rule.canonical) {
    // Just remove these IDs
    rule.removeIds.forEach(id => {
      if (master.ingredients[id]) {
        console.log(`❌ Removing: "${id}" (${rule.reason})`);
        delete master.ingredients[id];
        removed++;
      }
    });
    return;
  }
  
  const canonical = master.ingredients[rule.canonical];
  
  if (!canonical) {
    console.warn(`  ⚠️  Canonical "${rule.canonical}" not found - skipping`);
    return;
  }
  
  console.log(`📦 Consolidating into "${rule.canonical}"`);
  
  // Remove duplicates
  rule.removeIds.forEach(dupId => {
    const dup = master.ingredients[dupId];
    
    if (dup) {
      console.log(`   ❌ Removing: "${dupId}"`);
      
      // Absorb aliases
      if (dup.aliases) {
        dup.aliases.forEach(alias => {
          if (!canonical.aliases.includes(alias)) {
            canonical.aliases.push(alias);
            aliasesAdded++;
          }
        });
      }
      
      delete master.ingredients[dupId];
      removed++;
    }
  });
  
  // Add new aliases
  if (rule.addAliases) {
    rule.addAliases.forEach(alias => {
      if (!canonical.aliases.includes(alias)) {
        canonical.aliases.push(alias);
        aliasesAdded++;
      }
    });
  }
});

console.log();
console.log('=== FIX COMPLETE ===\n');
console.log(`Removed: ${removed}`);
console.log(`Aliases added: ${aliasesAdded}`);
console.log(`Total entries: ${Object.keys(master.ingredients).length} (was ${master._totalEntries})`);

// Update metadata
master._version = '3.3.0';
master._lastUpdated = new Date().toISOString();
master._totalEntries = Object.keys(master.ingredients).length;
master._coverage = 'Aggressively consolidated for clean shopping lists';

fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));

console.log('\\n✅ Dictionary updated to v3.3.0');
console.log('\\nNext: Re-normalize catalog');
