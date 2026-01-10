/**
 * Add Missing Common Ingredients to Dictionary
 * 
 * Based on analysis of unmatched ingredients, add common items
 * that appear frequently but aren't in the dictionary.
 */

const fs = require('fs');
const path = require('path');

console.log('=== ADD MISSING INGREDIENTS TO DICTIONARY ===\n');

// Load dictionary
const dictPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

const ingredients = dict.ingredients;
let addedCount = 0;
let aliasCount = 0;

// Missing ingredients based on unmatched analysis
const missingIngredients = {
  // High frequency missing (10+ occurrences after parsing fix)
  seasoning: {
    displayName: "Seasoning blend",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 2.5 },
    aliases: ["seasoning", "all purpose seasoning", "mixed seasoning", "house seasoning"]
  },
  
  // Medium frequency (4-9 occurrences)
  pumpkin: {
    displayName: "Pumpkin",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.75 },
    aliases: ["pumpkin", "butternut pumpkin", "kent pumpkin"]
  },
  romano_cheese: {
    displayName: "Romano cheese",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 1.1 },
    aliases: ["romano cheese", "romano", "pecorino romano"]
  },
  almond_milk: {
    displayName: "Almond milk",
    canonicalUnit: "ml",
    state: "other",
    density: { ml_to_g: 1.02 },
    aliases: ["almond milk", "unsweetened almond milk", "vanilla almond milk"]
  },
  egg_white: {
    displayName: "Egg whites",
    canonicalUnit: "ml",
    state: "fresh",
    density: { ml_to_g: 1.04 },
    aliases: ["egg whites", "egg white", "whites only"]
  },
  hamburger_buns: {
    displayName: "Hamburger buns",
    canonicalUnit: "whole",
    state: "other",
    aliases: ["hamburger buns", "burger buns", "brioche buns", "slider buns"]
  },
  tofu: {
    displayName: "Tofu",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 1.05 },
    aliases: ["tofu", "firm tofu", "extra firm tofu", "silken tofu", "soft tofu", "extra tofu"]
  },
  hoisin_sauce: {
    displayName: "Hoisin sauce",
    canonicalUnit: "tbsp",
    state: "other",
    density: { ml_to_g: 1.3 },
    aliases: ["hoisin sauce", "hoisin"]
  },
  sriracha: {
    displayName: "Sriracha",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 1.1 },
    aliases: ["sriracha", "sriracha sauce", "hot chili sauce"]
  },
  oyster_sauce: {
    displayName: "Oyster sauce",
    canonicalUnit: "tbsp",
    state: "other",
    density: { ml_to_g: 1.25 },
    aliases: ["oyster sauce", "vegetarian oyster sauce"]
  },
  coconut: {
    displayName: "Coconut",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.4 },
    aliases: ["coconut", "shredded coconut", "desiccated coconut", "coconut flakes"]
  },
  blueberry: {
    displayName: "Blueberries",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.6 },
    aliases: ["blueberries", "blueberry", "fresh blueberries", "frozen blueberries"]
  },
  
  // Medium-low frequency (3 occurrences)
  buttermilk: {
    displayName: "Buttermilk",
    canonicalUnit: "ml",
    state: "other",
    density: { ml_to_g: 1.03 },
    aliases: ["buttermilk", "low fat buttermilk"]
  },
  asparagus: {
    displayName: "Asparagus",
    canonicalUnit: "g",
    state: "fresh",
    aliases: ["asparagus", "asparagus spears", "green asparagus", "white asparagus"]
  },
  radish: {
    displayName: "Radish",
    canonicalUnit: "whole",
    state: "fresh",
    aliases: ["radish", "radishes", "red radish", "daikon radish", "daikon"]
  },
  persian_cucumber: {
    displayName: "Persian cucumber",
    canonicalUnit: "whole",
    state: "fresh",
    aliases: ["persian cucumber", "persian cucumbers", "mini cucumber"]
  },
  asafoetida: {
    displayName: "Asafoetida",
    canonicalUnit: "pinch",
    state: "other",
    aliases: ["asafoetida", "asafetida", "hing"]
  },
  bread_loaf: {
    displayName: "Bread",
    canonicalUnit: "whole",
    state: "other",
    aliases: ["loaf bread", "bread loaf", "sourdough loaf", "crusty bread"]
  },
  garlic_salt: {
    displayName: "Garlic salt",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 2.2 },
    aliases: ["garlic salt"]
  },
  tomato_puree: {
    displayName: "Tomato purée",
    canonicalUnit: "tbsp",
    state: "canned",
    density: { ml_to_g: 1.1 },
    aliases: ["tomato puree", "tomato purée", "passata"]
  },
  
  // Sauces & condiments
  fish_sauce: {
    displayName: "Fish sauce",
    canonicalUnit: "tbsp",
    state: "other",
    density: { ml_to_g: 1.15 },
    aliases: ["fish sauce", "nam pla", "nuoc mam"]
  },
  tahini: {
    displayName: "Tahini",
    canonicalUnit: "tbsp",
    state: "other",
    density: { ml_to_g: 0.95 },
    aliases: ["tahini", "tahini paste", "sesame paste"]
  },
  
  // Dairy alternatives
  coconut_milk: {
    displayName: "Coconut milk",
    canonicalUnit: "ml",
    state: "canned",
    density: { ml_to_g: 1.0 },
    aliases: ["coconut milk", "full fat coconut milk", "light coconut milk", "canned coconut milk"]
  },
  coconut_cream: {
    displayName: "Coconut cream",
    canonicalUnit: "ml",
    state: "canned",
    density: { ml_to_g: 1.05 },
    aliases: ["coconut cream", "thick coconut cream"]
  },
  
  // Fruits
  raspberry: {
    displayName: "Raspberries",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.55 },
    aliases: ["raspberries", "raspberry", "fresh raspberries", "frozen raspberries"]
  },
  blackberry: {
    displayName: "Blackberries",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.6 },
    aliases: ["blackberries", "blackberry", "fresh blackberries"]
  },
  mango: {
    displayName: "Mango",
    canonicalUnit: "whole",
    state: "fresh",
    aliases: ["mango", "mangoes", "fresh mango", "frozen mango"]
  },
  pineapple: {
    displayName: "Pineapple",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.7 },
    aliases: ["pineapple", "fresh pineapple", "canned pineapple", "pineapple chunks"]
  },
  cranberry: {
    displayName: "Cranberries",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.5 },
    aliases: ["cranberries", "cranberry", "fresh cranberries", "dried cranberries"]
  },
  
  // Vegetables
  kale: {
    displayName: "Kale",
    canonicalUnit: "g",
    state: "fresh",
    density: { ml_to_g: 0.3 },
    aliases: ["kale", "curly kale", "lacinato kale", "baby kale", "tuscan kale"]
  },
  bok_choy: {
    displayName: "Bok choy",
    canonicalUnit: "g",
    state: "fresh",
    aliases: ["bok choy", "baby bok choy", "pak choi", "chinese cabbage"]
  },
  artichoke: {
    displayName: "Artichoke",
    canonicalUnit: "whole",
    state: "fresh",
    aliases: ["artichoke", "artichokes", "artichoke hearts", "canned artichoke", "marinated artichoke"]
  },
  fennel: {
    displayName: "Fennel",
    canonicalUnit: "whole",
    state: "fresh",
    aliases: ["fennel", "fennel bulb", "fresh fennel"]
  },
  leek: {
    displayName: "Leek",
    canonicalUnit: "whole",
    state: "fresh",
    aliases: ["leek", "leeks", "baby leeks"]
  },
  
  // Grains
  couscous: {
    displayName: "Couscous",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.75 },
    aliases: ["couscous", "pearl couscous", "israeli couscous", "moroccan couscous"]
  },
  polenta: {
    displayName: "Polenta",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.8 },
    aliases: ["polenta", "cornmeal polenta", "instant polenta"]
  },
  bulgur: {
    displayName: "Bulgur wheat",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.75 },
    aliases: ["bulgur", "bulgur wheat", "cracked wheat"]
  },
  
  // Nuts & Seeds
  pine_nut: {
    displayName: "Pine nuts",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.6 },
    aliases: ["pine nuts", "pine nut", "pignoli", "pinon nuts"]
  },
  macadamia: {
    displayName: "Macadamia nuts",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.55 },
    aliases: ["macadamia nuts", "macadamia", "macadamias"]
  },
  pepita: {
    displayName: "Pepitas",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.55 },
    aliases: ["pepitas", "pumpkin seeds", "pepita seeds"]
  },
  chia_seeds: {
    displayName: "Chia seeds",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.7 },
    aliases: ["chia seeds", "chia"]
  },
  flax_seeds: {
    displayName: "Flax seeds",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 0.6 },
    aliases: ["flax seeds", "flaxseed", "linseed", "ground flax"]
  },
  
  // Proteins
  tempeh: {
    displayName: "Tempeh",
    canonicalUnit: "g",
    state: "fresh",
    aliases: ["tempeh", "soy tempeh"]
  },
  seitan: {
    displayName: "Seitan",
    canonicalUnit: "g",
    state: "fresh",
    aliases: ["seitan", "wheat meat", "vital wheat gluten"]
  },
  
  // Cheese varieties
  ricotta: {
    displayName: "Ricotta cheese",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 1.0 },
    aliases: ["ricotta", "ricotta cheese", "part skim ricotta", "whole milk ricotta"]
  },
  mascarpone: {
    displayName: "Mascarpone",
    canonicalUnit: "g",
    state: "other",
    density: { ml_to_g: 1.0 },
    aliases: ["mascarpone", "mascarpone cheese"]
  },
  
  // Herbs (fresh)
  dill: {
    displayName: "Dill",
    canonicalUnit: "g",
    state: "fresh",
    aliases: ["dill", "fresh dill", "dill weed", "dill fronds"]
  },
  tarragon: {
    displayName: "Tarragon",
    canonicalUnit: "g",
    state: "fresh",
    aliases: ["tarragon", "fresh tarragon"]
  },
  
  // Spices
  cardamom: {
    displayName: "Cardamom",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 2.0 },
    aliases: ["cardamom", "cardamom pods", "ground cardamom", "green cardamom"]
  },
  turmeric: {
    displayName: "Turmeric",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 2.5 },
    aliases: ["turmeric", "ground turmeric", "turmeric powder", "fresh turmeric"]
  },
  
  // Baking
  baking_powder: {
    displayName: "Baking powder",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 2.3 },
    aliases: ["baking powder"]
  },
  baking_soda: {
    displayName: "Baking soda",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 2.2 },
    aliases: ["baking soda", "bicarbonate of soda", "bicarb"]
  },
  cornstarch: {
    displayName: "Cornstarch",
    canonicalUnit: "tbsp",
    state: "other",
    density: { ml_to_g: 0.55 },
    aliases: ["cornstarch", "cornflour", "corn starch"]
  },
  yeast: {
    displayName: "Yeast",
    canonicalUnit: "tsp",
    state: "other",
    aliases: ["yeast", "active dry yeast", "instant yeast", "dried yeast", "fresh yeast"]
  },
  vanilla_extract: {
    displayName: "Vanilla extract",
    canonicalUnit: "tsp",
    state: "other",
    density: { ml_to_g: 1.0 },
    aliases: ["vanilla extract", "vanilla", "pure vanilla extract", "vanilla essence"]
  },
  cocoa_powder: {
    displayName: "Cocoa powder",
    canonicalUnit: "tbsp",
    state: "other",
    density: { ml_to_g: 0.45 },
    aliases: ["cocoa powder", "cocoa", "unsweetened cocoa", "dutch process cocoa"]
  }
};

// Add aliases to existing ingredients
const aliasUpdates = {
  // Bacon - add "slices bacon" alias
  bacon: ["slices bacon", "bacon slices", "streaky bacon", "turkey bacon"],
  
  // Ginger - add "inch ginger" format
  ginger: ["inch ginger", "fresh ginger root", "ginger root", "gingerroot"],
  
  // Orange - add zest aliases
  orange: ["orange zest", "zest of orange", "orange rind"],
  
  // Lemon - add meyer lemon and zest
  lemon: ["meyer lemon", "meyer lemon juice", "lemon zest", "zest of lemon"],
  
  // Butter - add stick format
  butter: ["stick butter", "butter stick", "salted butter", "unsalted butter", "european butter"],
  
  // Bell pepper - add color variations
  bell_pepper: ["orange pepper", "yellow pepper", "red pepper", "green pepper", "mixed peppers"],
  
  // Parsley - add "tbs parsley" format
  parsley: ["tbs parsley", "flat leaf parsley", "curly parsley", "italian parsley", "parsley leaves"],
  
  // Cream - general cream alias
  cream: ["heavy whipping cream", "double cream", "single cream", "light cream", "pouring cream"],
  
  // Olive oil - virgin variants
  olive_oil: ["virgin olive oil", "extra virgin olive oil", "evoo", "light olive oil"],
  
  // Oil - general oils
  vegetable_oil: ["vegetable oil", "canola oil", "rapeseed oil", "neutral oil"],
  
  // Cilantro
  cilantro: ["cilantro leaves", "coriander leaves", "fresh coriander"],
  
  // Basil
  basil: ["basil leaves", "fresh basil leaves", "thai basil", "holy basil"],
  
  // Tomato - raw variants
  tomato: ["vine tomato", "plum tomato", "roma tomato", "beefsteak tomato", "vine ripened tomato"],
  
  // Onion - size variants  
  onion: ["size onion", "medium onion", "large onion", "small onion", "yellow onion", "white onion", "spanish onion"],
  
  // Parmesan
  parmesan: ["parmesan cheese", "parmigiano reggiano", "parm", "grana padano"],
  
  // Salt - variants
  salt: ["sea salt", "kosher salt", "table salt", "flaky salt", "finishing salt"],
  
  // Cucumber - add persian
  cucumber: ["english cucumber", "seedless cucumber", "lebanese cucumber"],
  
  // Rice - more variants
  rice: ["jasmine rice", "basmati rice", "long grain rice", "short grain rice", "arborio rice", "sushi rice"],
  
  // Chicken - more cuts
  chicken_breast: ["boneless chicken breast", "skinless chicken breast"],
  chicken: ["whole chicken", "roast chicken", "rotisserie chicken"]
};

// Process missing ingredients
for (const [id, data] of Object.entries(missingIngredients)) {
  if (!ingredients[id]) {
    ingredients[id] = data;
    addedCount++;
    console.log(`✅ Added: ${id} (${data.displayName})`);
  } else {
    console.log(`⏭️ Skipped: ${id} (already exists)`);
  }
}

console.log();

// Process alias updates
for (const [id, newAliases] of Object.entries(aliasUpdates)) {
  if (ingredients[id]) {
    const existing = new Set(ingredients[id].aliases || []);
    let added = 0;
    for (const alias of newAliases) {
      if (!existing.has(alias)) {
        existing.add(alias);
        added++;
      }
    }
    ingredients[id].aliases = Array.from(existing);
    if (added > 0) {
      aliasCount += added;
      console.log(`📝 Added ${added} aliases to ${id}`);
    }
  } else {
    console.log(`⚠️ Cannot add aliases: ${id} not found`);
  }
}

// Update metadata
dict._version = "6.0.0";
dict._lastUpdated = new Date().toISOString();

// Save
fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2));

console.log();
console.log('=== SUMMARY ===');
console.log(`Added ingredients: ${addedCount}`);
console.log(`Added aliases: ${aliasCount}`);
console.log(`Total ingredients: ${Object.keys(ingredients).length}`);
console.log(`Version: ${dict._version}`);
console.log();
console.log('✅ Dictionary updated!');
console.log('Next: Run node scripts/reNormalizeCatalog.js');
