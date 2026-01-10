/**
 * Expand Ingredient Dictionary
 * 
 * Adds high-priority ingredients based on unmatched analysis
 * Targets: pasta, cheese, mushroom, vegetable varieties
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load current dictionary
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

console.log('=== INGREDIENT DICTIONARY EXPANSION ===\n');
console.log('Current version:', master._version);
console.log('Current entries:', master._totalEntries);
console.log();

// High-priority additions based on analysis
const newIngredients = {
  // TOFU VARIETIES
  'block_tofu': {
    id: 'block_tofu',
    displayName: 'block tofu',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 252, gPerTbsp: 15.8, gPerTsp: 5.3 },
    aliases: ['block tofu', 'firm tofu', 'extra firm tofu', 'tofu block'],
    category: 'protein',
    subCategory: 'plant-based',
    tags: ['vegan', 'vegetarian', 'protein-rich']
  },
  
  // MUSHROOM VARIETIES
  'portobello_mushroom': {
    id: 'portobello_mushroom',
    displayName: 'portobello mushroom',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 86, gPerTbsp: null, gPerTsp: null },
    aliases: [
      'portobello mushroom', 'portobello mushrooms',
      'portabella mushroom', 'portabella mushrooms',
      'bella mushroom', 'bella mushrooms',
      'portobello', 'portabella',
      'pack portobello mushrooms',
      'roasted portobello mushrooms'
    ],
    category: 'vegetable',
    subCategory: 'mushroom',
    tags: ['protective']
  },
  
  'porcini_mushroom': {
    id: 'porcini_mushroom',
    displayName: 'porcini mushroom',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 90, gPerTbsp: null, gPerTsp: null },
    aliases: ['porcini mushroom', 'porcini mushrooms', 'porcini'],
    category: 'vegetable',
    subCategory: 'mushroom',
    tags: ['protective']
  },
  
  'enoki_mushroom': {
    id: 'enoki_mushroom',
    displayName: 'enoki mushroom',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 65, gPerTbsp: null, gPerTsp: null },
    aliases: ['enoki mushroom', 'enoki mushrooms', 'enoki'],
    category: 'vegetable',
    subCategory: 'mushroom',
    tags: ['protective']
  },
  
  // PASTA VARIETIES
  'orzo_pasta': {
    id: 'orzo_pasta',
    displayName: 'orzo pasta',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 180, gPerTbsp: 11.3, gPerTsp: 3.8 },
    aliases: ['orzo pasta', 'orzo'],
    category: 'grain',
    subCategory: 'pasta',
    tags: []
  },
  
  'fusilli_pasta': {
    id: 'fusilli_pasta',
    displayName: 'fusilli pasta',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 120, gPerTbsp: 7.5, gPerTsp: 2.5 },
    aliases: ['fusilli pasta', 'fusilli'],
    category: 'grain',
    subCategory: 'pasta',
    tags: []
  },
  
  'lasagna_noodles': {
    id: 'lasagna_noodles',
    displayName: 'lasagna noodles',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: null, gPerTbsp: null, gPerTsp: null },
    aliases: ['lasagna noodles', 'lasagne noodles', 'lasagna', 'lasagne', 'no boil lasagna noodles'],
    category: 'grain',
    subCategory: 'pasta',
    tags: []
  },
  
  // VEGETABLES
  'fennel': {
    id: 'fennel',
    displayName: 'fennel',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 87, gPerTbsp: 5.4, gPerTsp: 1.8 },
    aliases: ['fennel', 'fennel bulb'],
    category: 'vegetable',
    subCategory: 'aromatic',
    tags: ['protective']
  },
  
  'plantain': {
    id: 'plantain',
    displayName: 'plantain',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 150, gPerTbsp: null, gPerTsp: null },
    aliases: ['plantain', 'plantains', 'over-ripe plantain', 'ripe plantain'],
    category: 'vegetable',
    subCategory: 'starchy',
    tags: []
  },
  
  'flaxseed': {
    id: 'flaxseed',
    displayName: 'flaxseed',
    canonicalUnit: 'g',
    state: 'other',
    density: { gPerCup: 168, gPerTbsp: 10.5, gPerTsp: 3.5 },
    aliases: ['flaxseed', 'flax seed', 'flax seeds', 'ground flaxseed'],
    category: 'grain',
    subCategory: 'seed',
    tags: ['protective', 'omega-3']
  },
  
  // CHEESE VARIETIES
  'mascarpone': {
    id: 'mascarpone',
    displayName: 'mascarpone',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 227, gPerTbsp: 14.2, gPerTsp: 4.7 },
    aliases: ['mascarpone', 'mascarpone cheese'],
    category: 'dairy',
    subCategory: 'cheese',
    tags: []
  },
  
  'pecorino': {
    id: 'pecorino',
    displayName: 'pecorino',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 100, gPerTbsp: 6.3, gPerTsp: 2.1 },
    aliases: ['pecorino', 'pecorino cheese', 'cube pecorino cheese', 'pecorino romano'],
    category: 'dairy',
    subCategory: 'cheese',
    tags: []
  },
  
  'cottage_cheese': {
    id: 'cottage_cheese',
    displayName: 'cottage cheese',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 225, gPerTbsp: 14, gPerTsp: null },
    aliases: ['cottage cheese', 'curd cottage cheese'],
    category: 'dairy',
    subCategory: 'cheese',
    tags: ['protein-rich']
  },
  
  'manchego': {
    id: 'manchego',
    displayName: 'manchego',
    canonicalUnit: 'g',
    state: 'fresh',
    density: { gPerCup: 113, gPerTbsp: 7, gPerTsp: null },
    aliases: ['manchego', 'manchego cheese'],
    category: 'dairy',
    subCategory: 'cheese',
    tags: []
  },
  
  // SPECIAL ENTRY: Unknown ingredient placeholder
  'unknown_ingredient': {
    id: 'unknown_ingredient',
    displayName: 'unknown ingredient',
    canonicalUnit: 'g',
    state: 'other',
    density: null,
    aliases: ['unknown', 'unrecognized'],
    category: 'other',
    tags: ['placeholder'],
    metadata: {
      notes: 'Fallback for unrecognized ingredients - prevents system crashes'
    }
  }
};

// Add new ingredients
let added = 0;
for (const [id, ingredient] of Object.entries(newIngredients)) {
  if (master.ingredients[id]) {
    console.log(`⏭️  Skipping ${id} (already exists)`);
  } else {
    master.ingredients[id] = ingredient;
    added++;
    console.log(`✅ Added ${id}`);
  }
}

// Update metadata
const newTotal = Object.keys(master.ingredients).length;
master._version = '3.0.0';
master._lastUpdated = new Date().toISOString();
master._totalEntries = newTotal;
master._coverage = 'Enhanced coverage with compound support and high-priority varieties';

// Save updated dictionary
fs.writeFileSync(masterPath, JSON.stringify(master, null, 2));

console.log(`\n=== EXPANSION COMPLETE ===`);
console.log(`Added: ${added} new ingredients`);
console.log(`Total entries: ${master._totalEntries}`);
console.log(`New version: ${master._version}`);
console.log(`\nUpdated: ${masterPath}`);

// Calculate expected improvement
console.log(`\n=== PROJECTED IMPACT ===`);
console.log(`Previous match rate: 87.5% (6,287/7,183)`);
console.log(`Expected improvement: +${added} ingredient types covered`);
console.log(`Target match rate: 92-95% (with compound splitting)`);
