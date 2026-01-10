/**
 * Build Comprehensive Ingredient Dictionary
 * 
 * Automatically generates dictionary entries for top 600 ingredients
 * from catalog analysis using smart categorization and density defaults.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseIngredient } from '../src/utils/ingredientParsing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️  Building Comprehensive Ingredient Dictionary (Top 600)\n');
console.log('=' .repeat(80));

// Load analysis data
const analysisPath = path.join(__dirname, '../tmp/catalogUniqueIngredients.json');
const uniqueIngredients = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

console.log(`\n📊 Loaded ${uniqueIngredients.length} unique ingredient strings`);
console.log(`   Target: Top 600 ingredients\n`);

// Load current dictionary to preserve existing entries
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const currentMaster = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const existingIds = new Set(Object.keys(currentMaster.ingredients));

console.log(`📚 Current dictionary: ${existingIds.size} ingredients`);
console.log(`   Preserving existing entries...\n`);

// Category detection patterns
const CATEGORY_PATTERNS = {
  // Spices & dried herbs
  spice: ['cumin', 'oregano', 'paprika', 'turmeric', 'coriander', 'thyme', 'cayenne', 
          'cinnamon', 'nutmeg', 'cardamom', 'cloves', 'curry', 'chili', 'pepper',
          'bay leaf', 'sage', 'rosemary', 'basil', 'dill', 'tarragon', 'marjoram',
          'allspice', 'garam masala', 'za\'atar', 'sumac', 'fennel seed'],
  
  // Fresh herbs (leafy)
  herb_leafy: ['parsley', 'cilantro', 'mint', 'dill', 'chives', 'tarragon',
               'basil', 'arugula', 'watercress', 'sorrel'],
  
  // Vegetables (chopped)
  vegetable: ['onion', 'tomato', 'pepper', 'carrot', 'celery', 'zucchini', 'cucumber',
              'broccoli', 'cauliflower', 'eggplant', 'cabbage', 'radish', 'turnip',
              'beet', 'asparagus', 'artichoke', 'leek', 'shallot', 'scallion'],
  
  // Leafy greens
  leafy_green: ['spinach', 'kale', 'chard', 'lettuce', 'arugula', 'collard'],
  
  // Proteins
  protein: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon',
            'tuna', 'cod', 'shrimp', 'prawns', 'scallop', 'crab', 'lobster',
            'tofu', 'tempeh', 'seitan'],
  
  // Dairy
  dairy: ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream', 'ricotta',
          'cottage cheese', 'cream cheese', 'mascarpone', 'creme fraiche'],
  
  // Grains & starches
  grain: ['rice', 'pasta', 'quinoa', 'couscous', 'bulgur', 'farro', 'barley',
          'oats', 'flour', 'cornmeal', 'polenta', 'bread', 'noodle'],
  
  // Beans & legumes
  legume: ['beans', 'lentils', 'chickpeas', 'peas', 'garbanzo'],
  
  // Nuts & seeds
  nuts: ['almonds', 'walnuts', 'pecans', 'cashews', 'pistachios', 'peanuts',
         'pine nuts', 'hazelnuts', 'sesame seeds', 'sunflower seeds', 'pumpkin seeds'],
  
  // Oils
  oil: ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil',
        'coconut oil', 'avocado oil', 'peanut oil'],
  
  // Liquids
  liquid: ['water', 'broth', 'stock', 'juice', 'wine', 'vinegar', 'milk'],
  
  // Sweeteners
  sweetener: ['sugar', 'honey', 'maple syrup', 'agave', 'molasses', 'corn syrup'],
  
  // Sauces & condiments
  sauce: ['soy sauce', 'worcestershire', 'hot sauce', 'sriracha', 'ketchup',
          'mustard', 'mayonnaise', 'tahini', 'miso', 'fish sauce', 'hoisin']
};

// Density defaults by category
const DENSITY_DEFAULTS = {
  spice: { gPerCup: 100, gPerTbsp: 6.3, gPerTsp: 2.1 },
  herb_leafy: { gPerCup: 20, gPerTbsp: 1.3, gPerTsp: 0.4 },
  vegetable: { gPerCup: 150, gPerTbsp: 9.4, gPerTsp: 3.1 },
  leafy_green: { gPerCup: 30, gPerTbsp: 1.9, gPerTsp: 0.6 },
  protein: null, // No volume-based density for proteins
  dairy: { gPerCup: 240, gPerTbsp: 15, gPerTsp: 5 },
  grain: { gPerCup: 185, gPerTbsp: 11.6, gPerTsp: 3.9 },
  legume: { gPerCup: 180, gPerTbsp: 11.3, gPerTsp: 3.8 },
  nuts: { gPerCup: 120, gPerTbsp: 7.5, gPerTsp: 2.5 },
  oil: { gPerCup: 216, gPerTbsp: 13.5, gPerTsp: 4.5 },
  liquid: { gPerCup: 240, gPerTbsp: 15, gPerTsp: 5 },
  sweetener: { gPerCup: 200, gPerTbsp: 12.5, gPerTsp: 4.2 },
  sauce: { gPerCup: 240, gPerTbsp: 15, gPerTsp: 5 }
};

/**
 * Detect category from identity text
 */
function detectCategory(identityText) {
  const lower = identityText.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_PATTERNS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * Convert identity text to stable ID
 */
function textToId(identityText) {
  return identityText
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Determine product state based on explicit keywords and category
 */
function determineState(rawText, category) {
  const lower = rawText.toLowerCase();
  
  // Explicit state keywords
  if (lower.includes('canned') || lower.includes('tinned')) return 'canned';
  if (lower.includes('frozen')) return 'frozen';
  if (lower.includes('dried') || lower.includes('dry ')) return 'dried';
  
  // Category-based defaults
  if (category === 'spice') return 'other'; // Spices are dried/ground
  if (category === 'oil') return 'other';   // Oils are shelf-stable
  if (category === 'sauce') return 'other'; // Sauces are bottled
  if (category === 'sweetener') return 'other'; // Sugar, honey, etc.
  if (category === 'grain') return 'other'; // Dried grains
  if (category === 'legume') return 'canned'; // Default to canned (most common)
  if (category === 'nuts') return 'other'; // Shelf-stable
  if (category === 'dairy') return 'fresh'; // Refrigerated
  if (category === 'protein') return 'fresh'; // Fresh meats
  if (category === 'herb_leafy') return 'fresh'; // Fresh herbs
  if (category === 'vegetable') return 'fresh'; // Fresh produce
  if (category === 'leafy_green') return 'fresh'; // Fresh greens
  
  return 'other'; // Safe default for pantry items
}

// Process top 600 ingredients
console.log('🔧 Processing top 600 ingredients...\n');

const newEntries = {};
const identitySeen = new Set();
const skippedDuplicates = [];
let added = 0;
let skipped = 0;

for (let i = 0; i < Math.min(600, uniqueIngredients.length); i++) {
  const item = uniqueIngredients[i];
  const rawText = item.rawText;
  
  // Parse to get clean identity
  const parsed = parseIngredient(rawText);
  const identityText = parsed.identityText || rawText.toLowerCase();
  
  // Create stable ID
  const id = textToId(identityText);
  
  // Skip if already exists or duplicate identity
  if (existingIds.has(id) || identitySeen.has(id)) {
    if (!existingIds.has(id)) {
      skippedDuplicates.push({ id, originalRaw: rawText, count: item.count });
    }
    skipped++;
    continue;
  }
  
  identitySeen.add(id);
  
  // Detect category
  const category = detectCategory(identityText);
  
  // Determine state (category-aware)
  const state = determineState(rawText, category);
  
  // Get density defaults
  const density = DENSITY_DEFAULTS[category] || DENSITY_DEFAULTS.liquid;
  
  // Determine canonical unit
  let canonicalUnit = 'g';
  if (category === 'oil' || category === 'liquid' || category === 'sauce') {
    canonicalUnit = 'ml';
  }
  if (category === 'protein' && !parsed.unit) {
    canonicalUnit = 'whole';
  }
  
  // Create entry
  const entry = {
    id,
    displayName: identityText,
    canonicalUnit,
    state,
    density,
    aliases: [identityText, rawText.toLowerCase()].filter((v, i, a) => a.indexOf(v) === i),
    tags: [category],
    _frequency: item.count,
    _recipeCount: item.recipeCount
  };
  
  newEntries[id] = entry;
  added++;
  
  if ((added % 100) === 0) {
    console.log(`   Processed ${added} ingredients...`);
  }
}

console.log(`\n✅ Processed ${added + skipped} ingredients`);
console.log(`   Added: ${added} new entries`);
console.log(`   Skipped: ${skipped} (${existingIds.size} existing, ${skippedDuplicates.length} duplicates)\n`);

// Merge with existing dictionary
console.log('🔀 Merging with existing dictionary...');

const mergedIngredients = {
  ...currentMaster.ingredients,
  ...newEntries
};

const finalDictionary = {
  _version: '2.0.0',
  _lastUpdated: new Date().toISOString(),
  _totalEntries: Object.keys(mergedIngredients).length,
  _coverage: `Top 600 ingredients from catalog analysis (comprehensive coverage)`,
  _schema: currentMaster._schema,
  ingredients: mergedIngredients
};

// Save
fs.writeFileSync(masterPath, JSON.stringify(finalDictionary, null, 2));

console.log(`\n✅ Dictionary saved!`);
console.log(`   Total entries: ${finalDictionary._totalEntries}`);
console.log(`   Previous: ${existingIds.size}`);
console.log(`   New: ${added}`);
console.log(`   Version: ${finalDictionary._version}\n`);

// Save duplicate analysis
if (skippedDuplicates.length > 0) {
  const dupPath = path.join(__dirname, '../tmp/skipped_duplicates.json');
  fs.writeFileSync(dupPath, JSON.stringify(skippedDuplicates, null, 2));
  console.log(`📋 Skipped ${skippedDuplicates.length} duplicate identities (saved to tmp/skipped_duplicates.json)\n`);
}

console.log('=' .repeat(80));
console.log('\n🎯 NEXT STEP: Re-normalize catalog with expanded dictionary\n');
console.log('   node scripts/normalizeExistingCatalog.js\n');
console.log('   Expected improvement: 39.2% → 70-80% match rate\n');
