/**
 * Expand Ingredient Master Dictionary
 * 
 * Adds common ingredients from catalog that are currently unmatched.
 * Uses generic density defaults by category when specific data unavailable.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load current dictionary and diagnostics
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const diagnosticsPath = path.join(__dirname, '../tmp/normalization_diagnostics.json');

const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8'));

console.log('📚 Expanding Ingredient Master Dictionary\n');
console.log(`Current entries: ${masterData._totalEntries}`);
console.log(`Unmatched ingredient types: ${diagnostics.unmatchedIngredients.length}\n`);

// Generic density defaults by category
const DENSITY_DEFAULTS = {
  // Spices (ground)
  spice: { gPerCup: 100, gPerTbsp: 6.3, gPerTsp: 2.1 },
  
  // Herbs (fresh, leafy)
  herb_leafy: { gPerCup: 20, gPerTbsp: 1.3, gPerTsp: 0.4 },
  
  // Vegetables (chopped)
  vegetable_chopped: { gPerCup: 150, gPerTbsp: 9.4, gPerTsp: 3.1 },
  
  // Leafy greens
  leafy_green: { gPerCup: 30, gPerTbsp: 1.9, gPerTsp: 0.6 },
  
  // Liquids (water-like)
  liquid: { gPerCup: 240, gPerTbsp: 15, gPerTsp: 5 },
  
  // Oils
  oil: { gPerCup: 216, gPerTbsp: 13.5, gPerTsp: 4.5 },
  
  // Cheese (grated/shredded)
  cheese: { gPerCup: 113, gPerTbsp: 7, gPerTsp: 2.3 },
  
  // Nuts (chopped)
  nuts: { gPerCup: 120, gPerTbsp: 7.5, gPerTsp: 2.5 },
  
  // Grains (dry)
  grain: { gPerCup: 185, gPerTbsp: 11.6, gPerTsp: 3.9 }
};

// New ingredients to add (top ~75 from unmatched list)
const newIngredients = [
  // Spices
  { id: 'cumin', name: 'cumin', category: 'spice', state: 'other', aliases: ['cumin', 'ground cumin', 'cumin powder'] },
  { id: 'oregano', name: 'oregano', category: 'herb_leafy', state: 'other', aliases: ['oregano', 'dried oregano', 'oregano leaves'] },
  { id: 'paprika', name: 'paprika', category: 'spice', state: 'other', aliases: ['paprika', 'sweet paprika', 'smoked paprika'] },
  { id: 'turmeric', name: 'turmeric', category: 'spice', state: 'other', aliases: ['turmeric', 'turmeric powder', 'ground turmeric'] },
  { id: 'coriander', name: 'coriander', category: 'spice', state: 'other', aliases: ['coriander', 'ground coriander', 'coriander powder'] },
  { id: 'thyme', name: 'thyme', category: 'herb_leafy', state: 'other', aliases: ['thyme', 'dried thyme', 'fresh thyme', 'thyme leaves'] },
  { id: 'cayenne', name: 'cayenne pepper', category: 'spice', state: 'other', aliases: ['cayenne', 'cayenne pepper', 'ground cayenne'] },
  { id: 'cinnamon', name: 'cinnamon', category: 'spice', state: 'other', aliases: ['cinnamon', 'ground cinnamon', 'cinnamon powder'] },
  { id: 'chili_powder', name: 'chili powder', category: 'spice', state: 'other', aliases: ['chili powder', 'chilli powder', 'chile powder'] },
  
  // Oils & liquids
  { id: 'sesame_oil', name: 'sesame oil', category: 'oil', state: 'other', aliases: ['sesame oil', 'toasted sesame oil', 'asian sesame oil'] },
  { id: 'vegetable_oil', name: 'vegetable oil', category: 'oil', state: 'other', aliases: ['vegetable oil', 'cooking oil', 'canola oil'] },
  { id: 'coconut_milk', name: 'coconut milk', category: 'liquid', state: 'canned', aliases: ['coconut milk', 'canned coconut milk'] },
  { id: 'cream', name: 'cream', category: 'liquid', state: 'fresh', aliases: ['cream', 'heavy cream', 'whipping cream', 'double cream'] },
  { id: 'vinegar', name: 'vinegar', category: 'liquid', state: 'other', aliases: ['vinegar', 'white vinegar', 'apple cider vinegar'] },
  
  // Vegetables
  { id: 'spinach', name: 'spinach', category: 'leafy_green', state: 'fresh', aliases: ['spinach', 'fresh spinach', 'baby spinach'] },
  { id: 'zucchini', name: 'zucchini', category: 'vegetable_chopped', state: 'fresh', aliases: ['zucchini', 'courgette'] },
  { id: 'celery', name: 'celery', category: 'vegetable_chopped', state: 'fresh', aliases: ['celery', 'celery stalks', 'celery sticks'] },
  { id: 'mushrooms', name: 'mushrooms', category: 'vegetable_chopped', state: 'fresh', aliases: ['mushrooms', 'mushroom', 'button mushrooms', 'white mushrooms'] },
  { id: 'green_onions', name: 'green onions', category: 'herb_leafy', state: 'fresh', aliases: ['green onions', 'green onion', 'scallions', 'spring onions'] },
  { id: 'red_onion', name: 'red onion', category: 'vegetable_chopped', state: 'fresh', aliases: ['red onion', 'red onions', 'purple onion'] },
  { id: 'cucumber', name: 'cucumber', category: 'vegetable_chopped', state: 'fresh', aliases: ['cucumber', 'cucumbers', 'english cucumber'] },
  { id: 'broccoli', name: 'broccoli', category: 'vegetable_chopped', state: 'fresh', aliases: ['broccoli', 'broccoli florets'] },
  { id: 'cauliflower', name: 'cauliflower', category: 'vegetable_chopped', state: 'fresh', aliases: ['cauliflower', 'cauliflower florets'] },
  { id: 'eggplant', name: 'eggplant', category: 'vegetable_chopped', state: 'fresh', aliases: ['eggplant', 'aubergine'] },
  { id: 'cabbage', name: 'cabbage', category: 'vegetable_chopped', state: 'fresh', aliases: ['cabbage', 'green cabbage', 'red cabbage'] },
  { id: 'kale', name: 'kale', category: 'leafy_green', state: 'fresh', aliases: ['kale', 'curly kale', 'lacinato kale', 'tuscan kale'] },
  
  // Sweeteners
  { id: 'honey', name: 'honey', category: 'liquid', state: 'other', aliases: ['honey', 'raw honey', 'pure honey'] },
  { id: 'maple_syrup', name: 'maple syrup', category: 'liquid', state: 'other', aliases: ['maple syrup', 'pure maple syrup'] },
  
  // Cheese varieties
  { id: 'parmesan_cheese', name: 'parmesan cheese', category: 'cheese', state: 'other', aliases: ['parmesan cheese', 'parmesan', 'parmigiano', 'grated parmesan'] },
  { id: 'feta_cheese', name: 'feta cheese', category: 'cheese', state: 'fresh', aliases: ['feta cheese', 'feta', 'crumbled feta'] },
  { id: 'mozzarella_cheese', name: 'mozzarella cheese', category: 'cheese', state: 'fresh', aliases: ['mozzarella cheese', 'mozzarella', 'shredded mozzarella'] },
  { id: 'cheddar_cheese', name: 'cheddar cheese', category: 'cheese', state: 'fresh', aliases: ['cheddar cheese', 'cheddar', 'sharp cheddar'] },
  
  // Citrus
  { id: 'lemon_zest', name: 'lemon zest', category: 'herb_leafy', state: 'fresh', aliases: ['lemon zest', 'zest of lemon', 'lemon rind'] },
  { id: 'lime_juice', name: 'lime juice', category: 'liquid', state: 'fresh', aliases: ['lime juice', 'fresh lime juice', 'juice of lime'] },
  { id: 'lime_zest', name: 'lime zest', category: 'herb_leafy', state: 'fresh', aliases: ['lime zest', 'zest of lime', 'lime rind'] },
  
  // Proteins
  { id: 'chicken_thighs', name: 'chicken thighs', category: 'protein', state: 'fresh', aliases: ['chicken thighs', 'chicken thigh', 'bone-in chicken thighs'] },
  { id: 'ground_beef', name: 'ground beef', category: 'protein', state: 'fresh', aliases: ['ground beef', 'minced beef', 'beef mince'] },
  { id: 'shrimp', name: 'shrimp', category: 'protein', state: 'fresh', aliases: ['shrimp', 'prawns', 'large shrimp'] },
  { id: 'salmon', name: 'salmon', category: 'protein', state: 'fresh', aliases: ['salmon', 'salmon fillet', 'salmon fillets'] },
  { id: 'tofu', name: 'tofu', category: 'protein', state: 'fresh', aliases: ['tofu', 'firm tofu', 'extra firm tofu'] },
  
  // Beans & legumes
  { id: 'chickpeas', name: 'chickpeas', category: 'legume', state: 'canned', aliases: ['chickpeas', 'garbanzo beans', 'canned chickpeas'] },
  { id: 'black_beans', name: 'black beans', category: 'legume', state: 'canned', aliases: ['black beans', 'canned black beans'] },
  { id: 'lentils', name: 'lentils', category: 'legume', state: 'dried', aliases: ['lentils', 'red lentils', 'green lentils', 'brown lentils'] },
  
  // Nuts & seeds
  { id: 'almonds', name: 'almonds', category: 'nuts', state: 'other', aliases: ['almonds', 'sliced almonds', 'slivered almonds'] },
  { id: 'walnuts', name: 'walnuts', category: 'nuts', state: 'other', aliases: ['walnuts', 'walnut halves', 'chopped walnuts'] },
  { id: 'sesame_seeds', name: 'sesame seeds', category: 'nuts', state: 'other', aliases: ['sesame seeds', 'toasted sesame seeds'] },
  
  // Additional common ingredients
  { id: 'yogurt', name: 'yogurt', category: 'dairy', state: 'fresh', aliases: ['yogurt', 'plain yogurt', 'greek yogurt'] },
  { id: 'sour_cream', name: 'sour cream', category: 'dairy', state: 'fresh', aliases: ['sour cream', 'soured cream'] },
  { id: 'cornstarch', name: 'cornstarch', category: 'grain', state: 'other', aliases: ['cornstarch', 'corn starch', 'cornflour'] },
  { id: 'baking_powder', name: 'baking powder', category: 'other', state: 'other', aliases: ['baking powder'] },
  { id: 'baking_soda', name: 'baking soda', category: 'other', state: 'other', aliases: ['baking soda', 'bicarbonate of soda'] },
  { id: 'vanilla_extract', name: 'vanilla extract', category: 'liquid', state: 'other', aliases: ['vanilla extract', 'vanilla', 'pure vanilla extract'] },
  { id: 'brown_sugar', name: 'brown sugar', category: 'sweetener', state: 'other', aliases: ['brown sugar', 'light brown sugar', 'dark brown sugar'] },
  { id: 'powdered_sugar', name: 'powdered sugar', category: 'sweetener', state: 'other', aliases: ['powdered sugar', 'confectioners sugar', 'icing sugar'] }
];

console.log(`Adding ${newIngredients.length} new ingredients...\n`);

// Add to dictionary with density defaults
newIngredients.forEach(ing => {
  const density = DENSITY_DEFAULTS[ing.category] || DENSITY_DEFAULTS.spice;
  
  const entry = {
    id: ing.id,
    displayName: ing.name,
    canonicalUnit: ing.category.includes('liquid') || ing.category === 'oil' ? 'ml' : 'g',
    state: ing.state,
    density: { ...density },
    aliases: ing.aliases,
    tags: [ing.category]
  };
  
  // Special case: proteins often don't have meaningful volume densities
  if (ing.category === 'protein') {
    entry.density = null;
  }
  
  // Special case: whole items
  if (ing.id === 'eggs') {
    entry.canonicalUnit = 'whole';
    entry.density = null;
  }
  
  masterData.ingredients[ing.id] = entry;
  console.log(`   ✅ Added: ${ing.id} (${ing.name})`);
});

// Update metadata
masterData._totalEntries = Object.keys(masterData.ingredients).length;
masterData._lastUpdated = new Date().toISOString();
masterData._version = '1.1.0';
masterData._coverage = `${masterData._totalEntries} ingredients for improved match rate`;

// Save
fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2));

console.log(`\n✅ Dictionary expanded!`);
console.log(`   Previous: ${masterData._totalEntries - newIngredients.length} entries`);
console.log(`   Current: ${masterData._totalEntries} entries`);
console.log(`   Added: ${newIngredients.length} entries\n`);

console.log('💡 Next step: Re-run normalization script to see improved match rate:\n');
console.log('   node scripts/normalizeExistingCatalog.js\n');
