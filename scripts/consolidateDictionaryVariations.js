/**
 * Consolidate Dictionary Variations
 * 
 * Fixes the core problem: variations of the same ingredient have different IDs
 * Example: "olive_oil" vs "virgin_olive_oil" vs "oil"
 * 
 * Solution: Map variations to canonical ingredients as aliases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== CONSOLIDATE DICTIONARY VARIATIONS ===\n');

// Load dictionary
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

console.log('Current entries:', master._totalEntries);
console.log();

// Backup
const backupPath = path.join(__dirname, '../tmp/dictionary_before_consolidation.json');
fs.writeFileSync(backupPath, JSON.stringify(master, null, 2));
console.log('✅ Backup created');
console.log();

// Define consolidation rules
const consolidations = {
  // Keep "olive_oil" as canonical, add others as aliases
  'olive_oil': {
    removeIds: ['virgin_olive_oil', 'oil', 'your_best_olive_oil', 'tbsp_olive_oil', 'basilinfused_olive_oil'],
    addAliases: ['virgin olive oil', 'extra virgin olive oil', 'evoo', 'oil', 'cooking oil (olive)']
  },
  
  // Yogurt consolidation
  'greek_yogurt': {
    removeIds: ['nonfat_greek_yogurt', 'fl_lowfat_yogurt'],
    addAliases: ['non-fat greek yogurt', 'nonfat greek yogurt', 'lowfat greek yogurt', 'low-fat greek yogurt', 'fat-free greek yogurt']
  },
  
  // Cheese consolidation  
  'parmesan_cheese': {
    removeIds: ['parmesan', 'additional_parmesan_cheese', 'herbed_parmesan_drop_biscuits'],
    addAliases: ['parmesan', 'parmigiano', 'parmigiano reggiano', 'parmigiano-reggiano', 'additional parmesan']
  },
  
  'ricotta': {
    removeIds: ['ricotta_cheese', 'partskim_ricotta'],
    addAliases: ['ricotta cheese', 'part-skim ricotta', 'partskim ricotta', 'low-fat ricotta']
  },
  
  // Sesame oil
  'sesame_oil': {
    removeIds: ['sesame_seed_oil'],
    addAliases: ['sesame seed oil', 'toasted sesame oil']
  },
  
  // Grape seed oil
  'grapeseed_oil': {
    removeIds: ['grape_seed_oil'],
    addAliases: ['grape seed oil', 'grape-seed oil']
  }
};

console.log('Applying consolidation rules...\n');

let removed = 0;
let aliasesAdded = 0;

Object.entries(consolidations).forEach(([canonicalId, rules]) => {
  const canonical = master.ingredients[canonicalId];
  
  if (!canonical) {
    console.warn(`  ⚠️  Canonical ingredient "${canonicalId}" not found - skipping`);
    return;
  }
  
  console.log(`📦 Consolidating into "${canonicalId}"`);
  
  // Remove duplicate entries and absorb their aliases
  rules.removeIds.forEach(dupId => {
    const dup = master.ingredients[dupId];
    
    if (dup) {
      console.log(`   ❌ Removing duplicate: "${dupId}"`);
      
      // Absorb aliases from duplicate before removing
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
  rules.addAliases.forEach(alias => {
    if (!canonical.aliases.includes(alias)) {
      canonical.aliases.push(alias);
      aliasesAdded++;
      console.log(`   ✅ Added alias: "${alias}"`);
    }
  });
  
  console.log();
});

// Update metadata
const newTotal = Object.keys(master.ingredients).length;
master._version = '3.2.0';
master._lastUpdated = new Date().toISOString();
master._totalEntries = newTotal;
master._coverage = 'Consolidated variations with canonical aliases';

// Save
fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));

console.log('=== CONSOLIDATION COMPLETE ===\n');
console.log(`Removed duplicates: ${removed}`);
console.log(`Aliases added/absorbed: ${aliasesAdded}`);
console.log(`Total entries: ${master._totalEntries} (was ${master._totalEntries + removed})`);
console.log(`New version: ${master._version}`);
console.log();
console.log('✅ Dictionary updated');
console.log();
console.log('Next: Re-normalize catalog again with consolidated dictionary');
