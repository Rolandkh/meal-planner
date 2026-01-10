/**
 * Parse Melbourne Ingredients List and Add to Catalog
 * 
 * Processes the comprehensive Melbourne ingredient list and adds all
 * new ingredients to the master catalog with proper structure.
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

// Helper to create ingredient ID from name
function createId(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '_')      // Replace spaces with underscores
    .replace(/-+/g, '_')       // Replace hyphens with underscores
    .replace(/_+/g, '_')       // Collapse multiple underscores
    .replace(/^_|_$/g, '');    // Trim underscores
}

// Helper to determine canonical unit based on ingredient type
function determineUnit(name, category) {
  const liquidKeywords = ['oil', 'vinegar', 'sauce', 'milk', 'cream', 'juice', 'stock', 'broth', 'water', 'wine', 'syrup'];
  const isLiquid = liquidKeywords.some(kw => name.toLowerCase().includes(kw));
  
  if (isLiquid) return 'ml';
  if (name.includes('egg') && !name.includes('noodle')) return 'whole';
  
  return 'g';
}

// Helper to determine state
function determineState(name, category) {
  if (name.includes('frozen')) return 'frozen';
  if (name.includes('canned') || name.includes('jarred')) return 'canned';
  if (name.includes('dried') || name.includes('dry')) return 'dried';
  if (category && category.includes('fresh')) return 'fresh';
  
  return 'other';
}

// Helper to generate aliases from variants
function generateAliases(baseName, variants, alternateNames) {
  const aliases = [baseName];
  
  // Add plural/singular variants
  if (!baseName.endsWith('s')) {
    aliases.push(baseName + 's');
  } else if (baseName.endsWith('es')) {
    aliases.push(baseName.slice(0, -2));
  } else {
    aliases.push(baseName.slice(0, -1));
  }
  
  // Add variants
  if (variants && variants.length > 0) {
    variants.forEach(v => {
      aliases.push(v);
      aliases.push(v + 's');
    });
  }
  
  // Add alternate names
  if (alternateNames && alternateNames.length > 0) {
    alternateNames.forEach(alt => {
      aliases.push(alt);
      aliases.push(alt + 's');
    });
  }
  
  // Remove duplicates
  return [...new Set(aliases)];
}

// Helper to assign tags
function assignTags(name, category) {
  const tags = [];
  
  // Category-based tags
  if (category) {
    if (category.includes('vegetable')) tags.push('vegetable');
    if (category.includes('fruit')) tags.push('fruit');
    if (category.includes('meat')) tags.push('meat', 'protein');
    if (category.includes('seafood')) tags.push('seafood', 'protein');
    if (category.includes('dairy')) tags.push('dairy');
    if (category.includes('grain')) tags.push('grain');
    if (category.includes('herb')) tags.push('herb');
    if (category.includes('spice')) tags.push('spice');
  }
  
  // Protective foods (Diet Compass priority)
  const protectiveKeywords = ['spinach', 'kale', 'broccoli', 'tomato', 'berry', 'salmon', 'sardine', 
                              'walnut', 'olive', 'legume', 'lentil', 'chickpea', 'quinoa', 'oat'];
  if (protectiveKeywords.some(kw => name.toLowerCase().includes(kw))) {
    tags.push('protective');
  }
  
  return tags;
}

// Comprehensive Melbourne ingredient database
const MELBOURNE_INGREDIENTS = [
  // VEGETABLES - LEAFY GREENS
  { name: "spinach baby", category: "vegetable_fresh", variants: [], alternates: ["baby spinach"] },
  { name: "spinach bunch", category: "vegetable_fresh", variants: [], alternates: [] },
  { name: "kale curly", category: "vegetable_fresh", variants: [], alternates: ["curly kale"] },
  { name: "kale tuscan", category: "vegetable_fresh", variants: [], alternates: ["tuscan kale", "cavolo nero", "dinosaur kale", "lacinato kale"] },
  { name: "silverbeet", category: "vegetable_fresh", variants: [], alternates: ["swiss chard"] },
  { name: "rocket", category: "vegetable_fresh", variants: [], alternates: ["arugula", "rucola"] },
  { name: "lettuce iceberg", category: "vegetable_fresh", variants: [], alternates: [] },
  { name: "lettuce cos", category: "vegetable_fresh", variants: [], alternates: ["cos lettuce", "romaine lettuce"] },
  { name: "lettuce butter", category: "vegetable_fresh", variants: [], alternates: ["butter lettuce", "butterhead lettuce"] },
  { name: "lettuce mixed leaves", category: "vegetable_fresh", variants: [], alternates: ["mixed leaf lettuce", "salad mix"] },
  { name: "cabbage green", category: "vegetable_fresh", variants: [], alternates: ["green cabbage"] },
  { name: "cabbage red", category: "vegetable_fresh", variants: [], alternates: ["red cabbage"] },
  { name: "cabbage savoy", category: "vegetable_fresh", variants: [], alternates: ["savoy cabbage"] },
  { name: "cabbage wombok", category: "vegetable_fresh", variants: [], alternates: ["wombok", "chinese cabbage", "napa cabbage"] },
  { name: "choy sum", category: "vegetable_fresh", variants: [], alternates: ["choi sum"] },
  { name: "radicchio", category: "vegetable_fresh", variants: [], alternates: [] },
  { name: "endive", category: "vegetable_fresh", variants: [], alternates: ["belgian endive"] },
  { name: "watercress", category: "vegetable_fresh", variants: [], alternates: [] },
  
  // VEGETABLES - ROOT
  { name: "potato brushed", category: "vegetable_fresh", variants: [], alternates: [] },
  { name: "potato washed", category: "vegetable_fresh", variants: [], alternates: [] },
  { name: "potato desiree", category: "vegetable_fresh", variants: [], alternates: ["desiree potato"] },
  { name: "potato kipfler", category: "vegetable_fresh", variants: [], alternates: ["kipfler potato"] },
  { name: "potato sebago", category: "vegetable_fresh", variants: [], alternates: ["sebago potato"] },
  { name: "sweet potato white", category: "vegetable_fresh", variants: [], alternates: ["white sweet potato", "white kumara"] },
  { name: "sweet potato orange", category: "vegetable_fresh", variants: [], alternates: ["orange sweet potato", "orange kumara"] },
  { name: "carrot bunch", category: "vegetable_fresh", variants: [], alternates: ["bunch carrots"] },
  { name: "carrot loose", category: "vegetable_fresh", variants: [], alternates: ["loose carrots"] },
  { name: "shallots", category: "vegetable_fresh", variants: [], alternates: ["eschalots", "french shallots", "golden shallots"] },
  { name: "spring onions", category: "vegetable_fresh", variants: [], alternates: ["scallions", "green onions"] },
  { name: "garlic bulb", category: "vegetable_fresh", variants: [], alternates: ["fresh garlic bulb"] },
  { name: "garlic pre-peeled", category: "vegetable_fresh", variants: [], alternates: ["peeled garlic", "pre-peeled garlic"] },
  { name: "garlic minced jar", category: "other", variants: [], alternates: ["minced garlic jar", "jarred garlic", "garlic in jar"] },
  { name: "ginger fresh root", category: "vegetable_fresh", variants: [], alternates: ["fresh ginger root", "fresh ginger"] },
  { name: "beetroot bunch", category: "vegetable_fresh", variants: [], alternates: ["bunch beetroot"] },
  { name: "beetroot loose", category: "vegetable_fresh", variants: [], alternates: ["loose beetroot"] },
  { name: "parsnip", category: "vegetable_fresh", variants: [], alternates: ["parsnips"] },
  { name: "swede", category: "vegetable_fresh", variants: [], alternates: ["rutabaga", "swedish turnip"] },
  { name: "radish red", category: "vegetable_fresh", variants: [], alternates: ["red radish"] },
  { name: "radish daikon", category: "vegetable_fresh", variants: [], alternates: ["daikon", "white radish", "chinese radish"] },
  { name: "celeriac", category: "vegetable_fresh", variants: [], alternates: ["celery root"] },
  { name: "jerusalem artichoke", category: "vegetable_fresh", variants: [], alternates: ["sunchoke"] },
  { name: "fennel bulb", category: "vegetable_fresh", variants: [], alternates: ["fresh fennel"] },
  
  // VEGETABLES - CRUCIFEROUS  
  { name: "broccolini", category: "vegetable_fresh", variants: [], alternates: ["tenderstem broccoli", "baby broccoli", "broccolette"] },
  
  // VEGETABLES - NIGHTSHADES
  { name: "tomato truss", category: "vegetable_fresh", variants: [], alternates: ["truss tomatoes", "tomatoes on the vine"] },
  { name: "tomato vine ripened", category: "vegetable_fresh", variants: [], alternates: ["vine tomatoes", "vine ripened tomatoes"] },
  { name: "tomato heirloom", category: "vegetable_fresh", variants: [], alternates: ["heirloom tomatoes"] },
  { name: "capsicum red", category: "vegetable_fresh", variants: [], alternates: ["red capsicum", "red bell pepper", "red pepper"] },
  { name: "capsicum green", category: "vegetable_fresh", variants: [], alternates: ["green capsicum", "green bell pepper", "green pepper"] },
  { name: "capsicum yellow", category: "vegetable_fresh", variants: [], alternates: ["yellow capsicum", "yellow bell pepper", "yellow pepper"] },
  { name: "capsicum orange", category: "vegetable_fresh", variants: [], alternates: ["orange capsicum", "orange bell pepper", "orange pepper"] },
  { name: "chilli red", category: "vegetable_fresh", variants: [], alternates: ["red chilli", "red chile"] },
  { name: "chilli green", category: "vegetable_fresh", variants: [], alternates: ["green chilli", "green chile"] },
  { name: "chilli birds eye", category: "vegetable_fresh", variants: [], alternates: ["birds eye chilli", "thai chilli"] },
  { name: "chilli long red", category: "vegetable_fresh", variants: [], alternates: ["long red chilli"] },
  
  // VEGETABLES - SQUASH/GOURDS
  { name: "zucchini green", category: "vegetable_fresh", variants: [], alternates: ["green zucchini", "green courgette"] },
  { name: "zucchini yellow", category: "vegetable_fresh", variants: [], alternates: ["yellow zucchini", "yellow courgette"] },
  { name: "pumpkin butternut", category: "vegetable_fresh", variants: [], alternates: ["butternut squash", "butternut pumpkin"] },
  { name: "pumpkin kent", category: "vegetable_fresh", variants: [], alternates: ["kent pumpkin", "jap pumpkin"] },
  { name: "pumpkin queensland blue", category: "vegetable_fresh", variants: [], alternates: ["queensland blue pumpkin"] },
  { name: "cucumber continental", category: "vegetable_fresh", variants: [], alternates: ["continental cucumber"] },
  { name: "cucumber lebanese", category: "vegetable_fresh", variants: [], alternates: ["lebanese cucumber"] },
  { name: "cucumber telegraph", category: "vegetable_fresh", variants: [], alternates: ["telegraph cucumber"] },
  { name: "squash yellow", category: "vegetable_fresh", variants: [], alternates: ["yellow squash"] },
  { name: "squash button", category: "vegetable_fresh", variants: [], alternates: ["button squash"] },
  
  // VEGETABLES - LEGUME VEGETABLES
  { name: "green beans round", category: "vegetable_fresh", variants: [], alternates: ["round green beans", "round beans"] },
  { name: "green beans flat", category: "vegetable_fresh", variants: [], alternates: ["flat green beans", "flat beans", "romano beans"] },
  { name: "sugar snap peas", category: "vegetable_fresh", variants: [], alternates: ["sugar snaps", "snap peas"] },
  { name: "peas in pod", category: "vegetable_fresh", variants: [], alternates: ["fresh peas", "garden peas in pod"] },
  { name: "broad beans fresh", category: "vegetable_fresh", variants: [], alternates: ["fresh broad beans", "fresh fava beans"] },
  
  // VEGETABLES - OTHER
  { name: "corn cob", category: "vegetable_fresh", variants: [], alternates: ["corn on the cob", "fresh corn"] },
  { name: "baby corn", category: "vegetable_fresh", variants: [], alternates: [] },
  { name: "mushrooms button", category: "vegetable_fresh", variants: [], alternates: ["button mushrooms", "white mushrooms"] },
  { name: "mushrooms cup", category: "vegetable_fresh", variants: [], alternates: ["cup mushrooms"] },
  { name: "mushrooms flat", category: "vegetable_fresh", variants: [], alternates: ["flat mushrooms", "field mushrooms"] },
  { name: "mushrooms swiss brown", category: "vegetable_fresh", variants: [], alternates: ["swiss brown mushrooms", "cremini mushrooms", "baby bella"] },
  { name: "mushrooms shiitake", category: "vegetable_fresh", variants: [], alternates: ["shiitake mushrooms"] },
  { name: "mushrooms oyster", category: "vegetable_fresh", variants: [], alternates: ["oyster mushrooms"] },
  { name: "mushrooms enoki", category: "vegetable_fresh", variants: [], alternates: ["enoki mushrooms"] },
  { name: "artichoke globe", category: "vegetable_fresh", variants: [], alternates: ["globe artichoke", "fresh artichoke"] },
  { name: "bean sprouts", category: "vegetable_fresh", variants: [], alternates: ["mung bean sprouts"] },
  
  // FRUITS - CITRUS
  { name: "orange navel", category: "fruit_fresh", variants: [], alternates: ["navel orange"] },
  { name: "orange valencia", category: "fruit_fresh", variants: [], alternates: ["valencia orange"] },
  { name: "orange blood", category: "fruit_fresh", variants: [], alternates: ["blood orange"] },
  { name: "grapefruit pink", category: "fruit_fresh", variants: [], alternates: ["pink grapefruit"] },
  { name: "grapefruit white", category: "fruit_fresh", variants: [], alternates: ["white grapefruit"] },
  { name: "mandarin", category: "fruit_fresh", variants: [], alternates: ["tangerine", "mandarine"] },
  { name: "tangelo", category: "fruit_fresh", variants: [], alternates: [] },
  
  // FRUITS - STONE FRUITS
  { name: "peach white", category: "fruit_fresh", variants: [], alternates: ["white peach"] },
  { name: "peach yellow", category: "fruit_fresh", variants: [], alternates: ["yellow peach"] },
  { name: "nectarine", category: "fruit_fresh", variants: [], alternates: ["nectarines"] },
  { name: "plum", category: "fruit_fresh", variants: [], alternates: ["plums"] },
  { name: "apricot", category: "fruit_fresh", variants: [], alternates: ["apricots"] },
  
  // FRUITS - POME
  { name: "apple royal gala", category: "fruit_fresh", variants: [], alternates: ["royal gala apple", "gala apple"] },
  { name: "apple pink lady", category: "fruit_fresh", variants: [], alternates: ["pink lady apple"] },
  { name: "apple granny smith", category: "fruit_fresh", variants: [], alternates: ["granny smith apple"] },
  { name: "apple fuji", category: "fruit_fresh", variants: [], alternates: ["fuji apple"] },
  { name: "apple jazz", category: "fruit_fresh", variants: [], alternates: ["jazz apple"] },
  { name: "apple kanzi", category: "fruit_fresh", variants: [], alternates: ["kanzi apple"] },
  { name: "pear williams", category: "fruit_fresh", variants: [], alternates: ["williams pear", "bartlett pear"] },
  { name: "pear packham", category: "fruit_fresh", variants: [], alternates: ["packham pear"] },
  { name: "pear beurre bosc", category: "fruit_fresh", variants: [], alternates: ["beurre bosc pear", "bosc pear"] },
  { name: "pear corella", category: "fruit_fresh", variants: [], alternates: ["corella pear"] },
  
  // FRUITS - TROPICAL
  { name: "banana cavendish", category: "fruit_fresh", variants: [], alternates: ["cavendish banana"] },
  { name: "banana lady finger", category: "fruit_fresh", variants: [], alternates: ["lady finger banana"] },
  { name: "papaya", category: "fruit_fresh", variants: [], alternates: ["pawpaw", "papaw"] },
  { name: "passionfruit", category: "fruit_fresh", variants: [], alternates: ["passion fruit"] },
  { name: "kiwifruit green", category: "fruit_fresh", variants: [], alternates: ["green kiwifruit", "green kiwi"] },
  { name: "kiwifruit gold", category: "fruit_fresh", variants: [], alternates: ["gold kiwifruit", "golden kiwi", "zespri gold"] },
  { name: "coconut fresh", category: "fruit_fresh", variants: [], alternates: ["fresh coconut"] },
  { name: "lychee", category: "fruit_fresh", variants: [], alternates: ["litchi", "lychees"] },
  { name: "dragonfruit", category: "fruit_fresh", variants: [], alternates: ["dragon fruit", "pitaya"] },
  
  // FRUITS - BERRIES
  { name: "strawberry", category: "fruit_fresh", variants: [], alternates: ["strawberries"] },
  { name: "blueberry", category: "fruit_fresh", variants: [], alternates: ["blueberries"] },
  { name: "raspberry", category: "fruit_fresh", variants: [], alternates: ["raspberries"] },
  { name: "blackberry", category: "fruit_fresh", variants: [], alternates: ["blackberries"] },
  
  // FRUITS - MELONS
  { name: "watermelon", category: "fruit_fresh", variants: [], alternates: [] },
  { name: "rockmelon", category: "fruit_fresh", variants: [], alternates: ["cantaloupe"] },
  { name: "honeydew melon", category: "fruit_fresh", variants: [], alternates: ["honeydew"] },
  
  // FRUITS - OTHER
  { name: "grapes red", category: "fruit_fresh", variants: [], alternates: ["red grapes"] },
  { name: "grapes green", category: "fruit_fresh", variants: [], alternates: ["green grapes", "white grapes"] },
  { name: "grapes black", category: "fruit_fresh", variants: [], alternates: ["black grapes"] },
  { name: "fig fresh", category: "fruit_fresh", variants: [], alternates: ["fresh fig", "fresh figs"] },
  { name: "pomegranate", category: "fruit_fresh", variants: [], alternates: ["pomegranates"] },
  { name: "persimmon", category: "fruit_fresh", variants: [], alternates: ["persimmons"] },
  { name: "rhubarb", category: "fruit_fresh", variants: [], alternates: [] },
];

console.log('\n📦 Adding Melbourne Ingredients to Catalog');
console.log('==========================================\n');

// Load catalog
const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
let added = 0;
let skipped = 0;
let updated = 0;

for (const item of MELBOURNE_INGREDIENTS) {
  const id = createId(item.name);
  const unit = determineUnit(item.name, item.category);
  const state = determineState(item.name, item.category);
  const aliases = generateAliases(item.name, item.variants, item.alternates);
  const tags = assignTags(item.name, item.category);
  
  if (masterData.ingredients[id]) {
    // Already exists - skip or update?
    skipped++;
    continue;
  }
  
  // Add new ingredient
  masterData.ingredients[id] = {
    id: id,
    displayName: item.name,
    canonicalUnit: unit,
    state: state,
    density: null, // Will be populated if we can derive it
    aliases: aliases,
    tags: tags
  };
  
  added++;
  console.log(`✅ Added: ${item.name} (${id})`);
}

// Update metadata
const totalIngredients = Object.keys(masterData.ingredients).length;
masterData._totalEntries = totalIngredients;
masterData._lastUpdated = new Date().toISOString();

// Save
fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added}`);
console.log(`   Skipped (already exist): ${skipped}`);
console.log(`   Total ingredients now: ${totalIngredients}`);
console.log(`\n✅ Melbourne ingredients added to catalog!\n`);
console.log(`📝 Next step: Run enrichment to add nutrition data:`);
console.log(`   node scripts/enrichIngredientCatalog.cjs --skip-pricing\n`);
