/**
 * Add Melbourne Ingredients - Part 4 (FINAL)
 * Spices, Baking, Canned Goods, Frozen, Beverages
 */

const fs = require('fs');
const path = require('path');
const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

function createId(name) {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function determineUnit(name) {
  const liquidKeywords = ['oil', 'vinegar', 'sauce', 'milk', 'cream', 'juice', 'stock', 'broth', 'water', 'wine', 'syrup', 'extract', 'essence'];
  if (liquidKeywords.some(kw => name.toLowerCase().includes(kw))) return 'ml';
  if (name.includes('egg') && !name.includes('noodle') && !name.includes('plant')) return 'whole';
  return 'g';
}

function determineState(name) {
  if (name.includes('frozen')) return 'frozen';
  if (name.includes('canned')) return 'canned';
  if (name.includes('dried') || name.includes('dry')) return 'dried';
  return 'other';
}

function generateAliases(baseName, alternates) {
  const aliases = [baseName];
  if (!baseName.endsWith('s')) aliases.push(baseName + 's');
  else aliases.push(baseName.slice(0, -1));
  if (alternates) alternates.forEach(alt => { aliases.push(alt); if (!alt.endsWith('s')) aliases.push(alt + 's'); });
  return [...new Set(aliases)];
}

function assignTags(name) {
  const tags = [];
  const lower = name.toLowerCase();
  if (lower.includes('spice') || lower.includes('pepper') || lower.includes('cumin') || lower.includes('cinnamon')) tags.push('spice');
  if (lower.includes('flour') || lower.includes('sugar') || lower.includes('baking')) tags.push('baking');
  if (lower.includes('canned')) tags.push('canned');
  if (lower.includes('frozen')) tags.push('frozen');
  return tags.length > 0 ? tags : ['other'];
}

const NEW_INGREDIENTS = [
  // SPICES - GROUND
  { name: "white pepper ground", alternates: ["ground white pepper"] },
  { name: "paprika sweet", alternates: ["sweet paprika"] },
  { name: "paprika smoked", alternates: ["smoked paprika", "pimenton"] },
  { name: "paprika hot", alternates: ["hot paprika"] },
  { name: "cayenne pepper", alternates: ["cayenne"] },
  { name: "chilli powder", alternates: ["chili powder"] },
  { name: "chilli flakes", alternates: ["chili flakes", "red pepper flakes", "crushed red pepper"] },
  { name: "cumin ground", alternates: ["ground cumin"] },
  { name: "coriander ground", alternates: ["ground coriander"] },
  { name: "turmeric ground", alternates: ["ground turmeric"] },
  { name: "ginger ground", alternates: ["ground ginger"] },
  { name: "cinnamon ground", alternates: ["ground cinnamon"] },
  { name: "nutmeg ground", alternates: ["ground nutmeg"] },
  { name: "allspice ground", alternates: ["ground allspice"] },
  { name: "cloves ground", alternates: ["ground cloves"] },
  { name: "cardamom ground", alternates: ["ground cardamom"] },
  { name: "garam masala", alternates: [] },
  { name: "curry powder", alternates: [] },
  { name: "chinese five spice", alternates: ["five spice powder"] },
  { name: "mixed spice", alternates: [] },
  { name: "sumac", alternates: [] },
  { name: "zaatar", alternates: ["za'atar"] },
  { name: "ras el hanout", alternates: [] },
  
  // SPICES - WHOLE
  { name: "black peppercorns", alternates: ["whole black pepper"] },
  { name: "cumin seeds", alternates: [] },
  { name: "coriander seeds", alternates: [] },
  { name: "fennel seeds", alternates: [] },
  { name: "mustard seeds yellow", alternates: ["yellow mustard seeds"] },
  { name: "mustard seeds brown", alternates: ["brown mustard seeds"] },
  { name: "mustard seeds black", alternates: ["black mustard seeds"] },
  { name: "cardamom pods", alternates: [] },
  { name: "cinnamon sticks", alternates: ["cinnamon quills"] },
  { name: "cloves whole", alternates: ["whole cloves"] },
  { name: "star anise", alternates: [] },
  { name: "sichuan peppercorns", alternates: ["szechuan peppercorns"] },
  { name: "juniper berries", alternates: [] },
  { name: "caraway seeds", alternates: [] },
  { name: "celery seeds", alternates: [] },
  { name: "fenugreek seeds", alternates: [] },
  
  // DRIED HERBS
  { name: "oregano dried", alternates: ["dried oregano"] },
  { name: "basil dried", alternates: ["dried basil"] },
  { name: "thyme dried", alternates: ["dried thyme"] },
  { name: "rosemary dried", alternates: ["dried rosemary"] },
  { name: "sage dried", alternates: ["dried sage"] },
  { name: "parsley dried", alternates: ["dried parsley"] },
  { name: "dill dried", alternates: ["dried dill", "dill weed dried"] },
  { name: "tarragon dried", alternates: ["dried tarragon"] },
  { name: "marjoram dried", alternates: ["dried marjoram"] },
  { name: "bay leaves dried", alternates: ["dried bay leaves"] },
  { name: "chives dried", alternates: ["dried chives"] },
  { name: "mixed herbs", alternates: ["dried mixed herbs"] },
  { name: "italian herbs", alternates: ["italian seasoning"] },
  { name: "herbes de provence", alternates: [] },
  
  // SEASONINGS & EXTRACTS
  { name: "salt table", alternates: ["table salt"] },
  { name: "salt sea", alternates: ["sea salt"] },
  { name: "salt kosher", alternates: ["kosher salt"] },
  { name: "salt pink himalayan", alternates: ["pink salt", "himalayan salt"] },
  { name: "salt flaky", alternates: ["flaky salt", "maldon salt"] },
  { name: "garlic powder", alternates: [] },
  { name: "onion powder", alternates: [] },
  { name: "chicken salt", alternates: [] },
  { name: "vegetable stock powder", alternates: ["vegetable bouillon"] },
  { name: "beef stock powder", alternates: ["beef bouillon"] },
  { name: "msg", alternates: ["monosodium glutamate"] },
  { name: "liquid smoke", alternates: [] },
  { name: "vanilla extract", alternates: ["vanilla essence"] },
  { name: "vanilla bean paste", alternates: [] },
  { name: "almond extract", alternates: ["almond essence"] },
  { name: "rosewater", alternates: ["rose water"] },
  { name: "orange blossom water", alternates: [] },
  
  // SPICE BLENDS
  { name: "cajun seasoning", alternates: ["cajun spice"] },
  { name: "mexican seasoning", alternates: ["mexican spice", "taco seasoning"] },
  { name: "italian seasoning", alternates: [] },
  { name: "moroccan seasoning", alternates: ["moroccan spice"] },
  { name: "bbq rub", alternates: ["bbq seasoning"] },
  { name: "steak seasoning", alternates: [] },
  { name: "garlic and herb seasoning", alternates: [] },
  { name: "dukkah", alternates: [] },
  
  // BAKING - FLOURS
  { name: "flour plain", alternates: ["plain flour", "all purpose flour"] },
  { name: "flour self raising", alternates: ["self raising flour", "self rising flour"] },
  { name: "flour bread", alternates: ["bread flour", "strong flour"] },
  { name: "flour wholemeal", alternates: ["wholemeal flour", "whole wheat flour"] },
  { name: "cornflour", alternates: ["corn flour", "cornstarch"] },
  { name: "rice flour", alternates: [] },
  { name: "coconut flour", alternates: [] },
  { name: "chickpea flour", alternates: ["besan", "gram flour"] },
  { name: "spelt flour", alternates: [] },
  { name: "gluten free flour blend", alternates: ["gluten free flour", "gf flour"] },
  
  // BAKING - SUGARS
  { name: "sugar white caster", alternates: ["caster sugar", "superfine sugar"] },
  { name: "sugar white granulated", alternates: ["granulated sugar", "white sugar"] },
  { name: "sugar brown light", alternates: ["light brown sugar"] },
  { name: "sugar brown dark", alternates: ["dark brown sugar"] },
  { name: "sugar raw", alternates: ["raw sugar"] },
  { name: "icing sugar", alternates: ["powdered sugar", "confectioners sugar"] },
  { name: "demerara sugar", alternates: [] },
  { name: "coconut sugar", alternates: [] },
  { name: "agave syrup", alternates: ["agave nectar"] },
  { name: "rice malt syrup", alternates: [] },
  { name: "stevia", alternates: [] },
  
  // BAKING - LEAVENERS
  { name: "baking powder", alternates: [] },
  { name: "bicarbonate of soda", alternates: ["baking soda", "bicarb soda"] },
  { name: "cream of tartar", alternates: [] },
  { name: "yeast dried", alternates: ["dried yeast"] },
  { name: "yeast instant", alternates: ["instant yeast"] },
  
  // BAKING - CHOCOLATE
  { name: "cocoa powder dutch", alternates: ["dutch process cocoa", "dutch cocoa"] },
  { name: "cocoa powder natural", alternates: ["natural cocoa powder"] },
  { name: "dark chocolate 70", alternates: ["70% dark chocolate"] },
  { name: "dark chocolate baking", alternates: ["baking chocolate", "cooking chocolate"] },
  { name: "milk chocolate", alternates: [] },
  { name: "white chocolate", alternates: [] },
  { name: "chocolate chips", alternates: ["chocolate buttons"] },
  { name: "cacao nibs", alternates: [] },
  { name: "drinking chocolate", alternates: ["hot chocolate powder"] },
  
  // BAKING - DRIED FRUITS
  { name: "sultanas", alternates: ["golden raisins"] },
  { name: "currants dried", alternates: ["dried currants"] },
  { name: "apricots dried", alternates: ["dried apricots"] },
  { name: "dates dried", alternates: ["dried dates"] },
  { name: "dates medjool", alternates: ["medjool dates"] },
  { name: "prunes", alternates: ["dried plums"] },
  { name: "figs dried", alternates: ["dried figs"] },
  { name: "cranberries dried", alternates: ["dried cranberries"] },
  { name: "mango dried", alternates: ["dried mango"] },
  { name: "apple dried", alternates: ["dried apple"] },
  { name: "mixed dried fruit", alternates: [] },
  { name: "glace cherries", alternates: ["glacé cherries", "candied cherries"] },
  { name: "glace ginger", alternates: ["glacé ginger", "candied ginger"] },
  { name: "mixed peel", alternates: ["candied peel"] },
  
  // BAKING - OTHER
  { name: "coconut desiccated", alternates: ["desiccated coconut"] },
  { name: "coconut shredded", alternates: ["shredded coconut"] },
  { name: "coconut flaked", alternates: ["flaked coconut", "coconut flakes"] },
  { name: "gelatine sheets", alternates: ["gelatin sheets"] },
  { name: "gelatine powder", alternates: ["gelatin powder"] },
  { name: "agar agar", alternates: [] },
  { name: "condensed milk", alternates: [] },
  { name: "evaporated milk", alternates: [] },
  { name: "cream of coconut", alternates: [] },
  { name: "food colouring", alternates: ["food coloring"] },
  { name: "vanilla pods", alternates: ["vanilla beans"] },
  { name: "peppermint essence", alternates: ["peppermint extract"] },
  { name: "arrowroot", alternates: ["arrowroot powder", "arrowroot starch"] },
  
  // CANNED VEGETABLES
  { name: "tomatoes diced canned", alternates: ["canned diced tomatoes"] },
  { name: "tomatoes whole canned", alternates: ["canned whole tomatoes"] },
  { name: "tomatoes crushed canned", alternates: ["canned crushed tomatoes"] },
  { name: "corn kernels canned", alternates: ["canned corn"] },
  { name: "beetroot canned sliced", alternates: ["canned sliced beetroot"] },
  { name: "beetroot canned whole baby", alternates: ["canned baby beetroot"] },
  { name: "peas canned", alternates: ["canned peas"] },
  { name: "carrots canned", alternates: ["canned carrots"] },
  { name: "asparagus canned", alternates: ["canned asparagus"] },
  { name: "hearts of palm canned", alternates: ["canned hearts of palm"] },
  { name: "bamboo shoots canned", alternates: ["canned bamboo shoots"] },
  { name: "water chestnuts canned", alternates: ["canned water chestnuts"] },
  { name: "mushrooms canned", alternates: ["canned mushrooms"] },
  
  // CANNED FRUITS
  { name: "pineapple rings canned", alternates: ["canned pineapple rings"] },
  { name: "pineapple pieces canned", alternates: ["canned pineapple pieces"] },
  { name: "pineapple crushed canned", alternates: ["canned crushed pineapple"] },
  { name: "peaches canned", alternates: ["canned peaches"] },
  { name: "pears canned", alternates: ["canned pears"] },
  { name: "apricots canned", alternates: ["canned apricots"] },
  { name: "mandarin segments canned", alternates: ["canned mandarin segments"] },
  { name: "fruit salad canned", alternates: ["canned fruit salad"] },
  { name: "cherries canned", alternates: ["canned cherries"] },
  { name: "mango canned", alternates: ["canned mango"] },
  { name: "lychees canned", alternates: ["canned lychees"] },
  { name: "coconut milk canned", alternates: ["canned coconut milk"] },
  { name: "coconut cream canned", alternates: ["canned coconut cream"] },
  
  // STOCK & BROTH
  { name: "chicken stock liquid", alternates: ["liquid chicken stock", "chicken broth"] },
  { name: "chicken stock cubes", alternates: ["chicken bouillon cubes"] },
  { name: "chicken stock powder", alternates: ["chicken bouillon powder"] },
  { name: "beef stock liquid", alternates: ["liquid beef stock", "beef broth"] },
  { name: "beef stock cubes", alternates: ["beef bouillon cubes"] },
  { name: "beef stock powder", alternates: ["beef bouillon powder"] },
  { name: "vegetable stock liquid", alternates: ["liquid vegetable stock", "vegetable broth"] },
  { name: "vegetable stock cubes", alternates: ["vegetable bouillon cubes"] },
  { name: "vegetable stock powder", alternates: ["vegetable bouillon powder"] },
  { name: "fish stock", alternates: ["fish broth"] },
  { name: "bone broth", alternates: [] },
  { name: "dashi", alternates: ["japanese stock"] },
  
  // FROZEN VEGETABLES
  { name: "peas frozen", alternates: ["frozen peas"] },
  { name: "corn frozen", alternates: ["frozen corn"] },
  { name: "beans frozen green", alternates: ["frozen green beans"] },
  { name: "mixed vegetables frozen", alternates: ["frozen mixed vegetables"] },
  { name: "spinach frozen", alternates: ["frozen spinach"] },
  { name: "broccoli frozen", alternates: ["frozen broccoli"] },
  { name: "cauliflower frozen", alternates: ["frozen cauliflower"] },
  { name: "stir fry vegetables frozen", alternates: ["frozen stir fry vegetables"] },
  { name: "edamame frozen", alternates: ["frozen edamame"] },
  { name: "broad beans frozen", alternates: ["frozen broad beans"] },
  
  // FROZEN FRUITS
  { name: "berries mixed frozen", alternates: ["frozen mixed berries"] },
  { name: "strawberries frozen", alternates: ["frozen strawberries"] },
  { name: "blueberries frozen", alternates: ["frozen blueberries"] },
  { name: "raspberries frozen", alternates: ["frozen raspberries"] },
  { name: "mango frozen", alternates: ["frozen mango"] },
  { name: "banana frozen", alternates: ["frozen banana"] },
  { name: "pineapple frozen", alternates: ["frozen pineapple"] },
  
  // FROZEN PASTRY
  { name: "puff pastry frozen", alternates: ["frozen puff pastry"] },
  { name: "shortcrust pastry frozen", alternates: ["frozen shortcrust pastry"] },
  { name: "filo pastry frozen", alternates: ["frozen filo pastry", "phyllo pastry"] },
  { name: "pie shells frozen", alternates: ["frozen pie shells"] },
  { name: "pizza bases frozen", alternates: ["frozen pizza bases"] },
  
  // BEVERAGES (for cooking)
  { name: "red wine cooking", alternates: ["cooking red wine"] },
  { name: "white wine cooking", alternates: ["cooking white wine"] },
  { name: "marsala", alternates: [] },
  { name: "sherry dry", alternates: ["dry sherry"] },
  { name: "sherry sweet", alternates: ["sweet sherry", "cream sherry"] },
  { name: "port", alternates: [] },
  { name: "vermouth", alternates: [] },
  { name: "beer", alternates: [] },
  { name: "rice wine", alternates: ["shaoxing wine", "chinese cooking wine"] },
  { name: "mirin", alternates: [] },
  { name: "sake", alternates: [] },
  { name: "brandy", alternates: [] },
  { name: "rum", alternates: [] },
  { name: "coffee instant", alternates: ["instant coffee"] },
  { name: "coffee ground", alternates: ["ground coffee"] },
  { name: "coffee beans", alternates: [] },
  { name: "tea black", alternates: ["black tea"] },
  { name: "tea green", alternates: ["green tea"] },
  { name: "coconut water", alternates: [] },
  { name: "vegetable juice", alternates: ["v8 juice"] },
  { name: "apple juice cooking", alternates: ["cooking apple juice"] },
];

console.log('\n📦 Adding Melbourne Ingredients - Part 4 (FINAL)');
console.log('==============================================\n');

const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
let added = 0;
let skipped = 0;

for (const item of NEW_INGREDIENTS) {
  const id = createId(item.name);
  const unit = determineUnit(item.name);
  const state = determineState(item.name);
  const aliases = generateAliases(item.name, item.alternates);
  const tags = assignTags(item.name);
  
  if (masterData.ingredients[id]) {
    skipped++;
    continue;
  }
  
  masterData.ingredients[id] = {
    id: id,
    displayName: item.name,
    canonicalUnit: unit,
    state: state,
    density: null,
    aliases: aliases,
    tags: tags
  };
  
  added++;
  console.log(`✅ Added: ${item.name} (${id})`);
}

const totalIngredients = Object.keys(masterData.ingredients).length;
masterData._totalEntries = totalIngredients;
masterData._lastUpdated = new Date().toISOString();
masterData._coverage = "Comprehensive Melbourne supermarket database with ~" + totalIngredients + " ingredients";

fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added}`);
console.log(`   Skipped: ${skipped}`);
console.log(`   Total ingredients: ${totalIngredients}`);
console.log(`\n🎉 ALL MELBOURNE INGREDIENTS ADDED!\n`);
console.log(`📝 Next: Run enrichment to add nutrition data to new ingredients\n`);
