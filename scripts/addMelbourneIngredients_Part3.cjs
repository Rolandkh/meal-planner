/**
 * Add Melbourne Ingredients - Part 3
 * Dairy, Grains, Legumes, Nuts, Oils, Condiments, Spices
 */

const fs = require('fs');
const path = require('path');
const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

function createId(name) {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function determineUnit(name) {
  const liquidKeywords = ['oil', 'vinegar', 'sauce', 'milk', 'cream', 'juice', 'stock', 'broth', 'water', 'wine', 'syrup', 'extract'];
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
  if (lower.includes('milk') || lower.includes('cream') || lower.includes('cheese') || lower.includes('yoghurt') || lower.includes('yogurt')) tags.push('dairy');
  if (lower.includes('rice') || lower.includes('pasta') || lower.includes('noodle') || lower.includes('bread') || lower.includes('flour')) tags.push('grain');
  if (lower.includes('lentil') || lower.includes('bean') || lower.includes('chickpea')) tags.push('legume', 'protein', 'protective');
  if (lower.includes('walnut') || lower.includes('almond') || lower.includes('nut')) tags.push('nut', 'protective');
  if (lower.includes('seed') || lower.includes('chia') || lower.includes('flax')) tags.push('seed', 'protective');
  if (lower.includes('oil') || lower.includes('vinegar')) tags.push('condiment');
  if (lower.includes('spice') || lower.includes('pepper') || lower.includes('cumin') || lower.includes('coriander') || lower.includes('turmeric')) tags.push('spice');
  if (lower.includes('yogurt') || lower.includes('yoghurt') || lower.includes('kefir')) tags.push('protective');
  return tags;
}

const NEW_INGREDIENTS = [
  // DAIRY - MILK
  { name: "milk full cream", alternates: ["full cream milk", "whole milk"] },
  { name: "milk reduced fat", alternates: ["reduced fat milk", "lite milk", "low fat milk"] },
  { name: "milk skim", alternates: ["skim milk", "fat free milk"] },
  { name: "milk lactose free", alternates: ["lactose free milk"] },
  { name: "milk a2", alternates: ["a2 milk"] },
  { name: "milk uht", alternates: ["uht milk", "long life milk"] },
  { name: "buttermilk", alternates: [] },
  
  // PLANT MILKS
  { name: "soy milk original", alternates: ["original soy milk"] },
  { name: "soy milk unsweetened", alternates: ["unsweetened soy milk"] },
  { name: "almond milk", alternates: [] },
  { name: "oat milk", alternates: [] },
  { name: "coconut milk beverage", alternates: ["coconut milk drink"] },
  { name: "rice milk", alternates: [] },
  { name: "macadamia milk", alternates: [] },
  
  // DAIRY - CREAM
  { name: "thickened cream", alternates: ["heavy cream", "whipping cream"] },
  { name: "pure cream", alternates: ["pouring cream", "light cream"] },
  { name: "double cream", alternates: [] },
  { name: "sour cream", alternates: [] },
  { name: "creme fraiche", alternates: ["crème fraîche"] },
  
  // DAIRY - CHEESE FRESH
  { name: "ricotta", alternates: [] },
  { name: "cottage cheese", alternates: [] },
  { name: "cream cheese", alternates: [] },
  { name: "goat cheese", alternates: ["chevre", "goat's cheese"] },
  { name: "bocconcini", alternates: [] },
  { name: "mozzarella fresh", alternates: ["fresh mozzarella"] },
  { name: "halloumi", alternates: [] },
  { name: "feta", alternates: ["feta cheese"] },
  { name: "paneer", alternates: [] },
  
  // DAIRY - CHEESE HARD
  { name: "cheddar mild", alternates: ["mild cheddar"] },
  { name: "cheddar tasty", alternates: ["tasty cheddar"] },
  { name: "cheddar vintage", alternates: ["vintage cheddar", "aged cheddar"] },
  { name: "cheddar extra sharp", alternates: ["extra sharp cheddar"] },
  { name: "parmesan", alternates: ["parmigiano reggiano", "parmesan cheese"] },
  { name: "pecorino romano", alternates: ["pecorino"] },
  { name: "gruyere", alternates: ["gruyère"] },
  { name: "swiss cheese", alternates: [] },
  { name: "gouda", alternates: [] },
  { name: "edam", alternates: [] },
  { name: "colby", alternates: [] },
  
  // DAIRY - CHEESE BLUE
  { name: "blue cheese", alternates: [] },
  { name: "gorgonzola", alternates: [] },
  { name: "stilton", alternates: [] },
  { name: "roquefort", alternates: [] },
  
  // DAIRY - CHEESE OTHER
  { name: "brie", alternates: [] },
  { name: "camembert", alternates: [] },
  { name: "havarti", alternates: [] },
  { name: "provolone", alternates: [] },
  { name: "emmental", alternates: [] },
  { name: "manchego", alternates: [] },
  { name: "jarlsberg", alternates: [] },
  
  // DAIRY - BUTTER
  { name: "butter salted", alternates: ["salted butter"] },
  { name: "butter unsalted", alternates: ["unsalted butter"] },
  { name: "butter spreadable", alternates: ["spreadable butter", "soft butter"] },
  { name: "margarine", alternates: [] },
  { name: "butter cultured", alternates: ["cultured butter", "european style butter"] },
  
  // DAIRY - YOGHURT
  { name: "yoghurt natural full fat", alternates: ["full fat natural yoghurt", "natural yoghurt"] },
  { name: "yoghurt natural low fat", alternates: ["low fat natural yoghurt"] },
  { name: "greek yoghurt", alternates: ["greek yogurt", "greek style yoghurt"] },
  { name: "yoghurt flavoured", alternates: ["flavoured yoghurt", "fruit yoghurt"] },
  { name: "coconut yoghurt", alternates: ["coconut yogurt"] },
  { name: "soy yoghurt", alternates: ["soy yogurt"] },
  { name: "kefir", alternates: [] },
  
  // EGGS
  { name: "chicken eggs cage", alternates: ["cage eggs"] },
  { name: "chicken eggs barn", alternates: ["barn laid eggs"] },
  { name: "chicken eggs free range", alternates: ["free range eggs"] },
  { name: "chicken eggs organic", alternates: ["organic eggs"] },
  { name: "duck eggs", alternates: [] },
  { name: "quail eggs", alternates: [] },
  
  // TOFU & PLANT PROTEINS
  { name: "tofu firm", alternates: ["firm tofu"] },
  { name: "tofu silken", alternates: ["silken tofu", "soft tofu"] },
  { name: "tofu smoked", alternates: ["smoked tofu"] },
  { name: "tofu fried", alternates: ["fried tofu"] },
  
  // GRAINS - RICE
  { name: "rice white long grain", alternates: ["long grain white rice"] },
  { name: "rice white medium grain", alternates: ["medium grain white rice"] },
  { name: "rice white short grain", alternates: ["short grain white rice"] },
  { name: "rice jasmine", alternates: ["jasmine rice", "thai fragrant rice"] },
  { name: "rice basmati", alternates: ["basmati rice"] },
  { name: "rice brown", alternates: ["brown rice"] },
  { name: "rice arborio", alternates: ["arborio rice", "risotto rice"] },
  { name: "rice sushi", alternates: ["sushi rice"] },
  { name: "rice wild", alternates: ["wild rice"] },
  { name: "rice black", alternates: ["black rice", "forbidden rice"] },
  
  // PASTA - DRIED
  { name: "spaghetti", alternates: [] },
  { name: "penne", alternates: [] },
  { name: "fettuccine", alternates: [] },
  { name: "linguine", alternates: [] },
  { name: "rigatoni", alternates: [] },
  { name: "fusilli", alternates: [] },
  { name: "farfalle", alternates: ["bow tie pasta"] },
  { name: "macaroni", alternates: [] },
  { name: "orzo", alternates: [] },
  { name: "lasagne sheets", alternates: ["lasagna sheets"] },
  { name: "cannelloni tubes", alternates: ["cannelloni"] },
  
  // PASTA - FRESH & ASIAN NOODLES
  { name: "pasta fresh sheets", alternates: ["fresh pasta sheets"] },
  { name: "ravioli fresh", alternates: ["fresh ravioli"] },
  { name: "gnocchi fresh", alternates: ["fresh gnocchi"] },
  { name: "rice noodles flat", alternates: ["flat rice noodles", "pad thai noodles"] },
  { name: "rice vermicelli", alternates: ["rice vermicelli noodles"] },
  { name: "egg noodles", alternates: [] },
  { name: "hokkien noodles", alternates: [] },
  { name: "udon noodles", alternates: [] },
  { name: "soba noodles", alternates: ["buckwheat noodles"] },
  { name: "ramen noodles", alternates: [] },
  { name: "rice paper", alternates: ["banh trang", "spring roll wrappers"] },
  { name: "glass noodles", alternates: ["mung bean noodles", "cellophane noodles"] },
  
  // OTHER GRAINS
  { name: "oats rolled", alternates: ["rolled oats"] },
  { name: "oats quick", alternates: ["quick oats", "instant oats"] },
  { name: "oats steel cut", alternates: ["steel cut oats"] },
  { name: "quinoa white", alternates: ["white quinoa"] },
  { name: "quinoa red", alternates: ["red quinoa"] },
  { name: "quinoa black", alternates: ["black quinoa"] },
  { name: "quinoa tricolour", alternates: ["tri-colour quinoa", "mixed quinoa"] },
  { name: "couscous regular", alternates: ["couscous"] },
  { name: "couscous israeli", alternates: ["israeli couscous", "pearl couscous"] },
  { name: "bulgur wheat", alternates: ["bulgur", "burghul"] },
  { name: "barley pearl", alternates: ["pearl barley"] },
  { name: "freekeh", alternates: [] },
  { name: "semolina", alternates: [] },
  { name: "buckwheat", alternates: [] },
  
  // CEREALS
  { name: "muesli", alternates: [] },
  { name: "granola", alternates: [] },
  { name: "wheat biscuits", alternates: ["weetbix", "weet-bix"] },
  { name: "cornflakes", alternates: ["corn flakes"] },
  { name: "bran flakes", alternates: ["all bran"] },
  
  // BREAD (Fresh common ones)
  { name: "bread white sliced", alternates: ["white bread sliced"] },
  { name: "bread wholemeal sliced", alternates: ["wholemeal bread", "whole wheat bread"] },
  { name: "bread multigrain sliced", alternates: ["multigrain bread"] },
  { name: "bread sourdough loaf", alternates: ["sourdough bread", "sourdough"] },
  { name: "baguette", alternates: ["french bread"] },
  { name: "ciabatta", alternates: [] },
  { name: "turkish bread", alternates: ["pide"] },
  { name: "wraps flour", alternates: ["flour tortillas", "flour wraps"] },
  { name: "wraps corn", alternates: ["corn tortillas", "corn wraps"] },
  { name: "wraps wholemeal", alternates: ["wholemeal wraps", "whole wheat wraps"] },
  { name: "flatbread", alternates: [] },
  { name: "crumpets", alternates: [] },
  { name: "english muffins", alternates: [] },
  { name: "breadcrumbs fresh", alternates: ["fresh breadcrumbs"] },
  { name: "croissants", alternates: ["croissant"] },
  
  // LEGUMES - CANNED
  { name: "chickpeas canned", alternates: ["canned chickpeas", "garbanzo beans canned"] },
  { name: "lentils canned brown", alternates: ["canned brown lentils"] },
  { name: "lentils canned green", alternates: ["canned green lentils"] },
  { name: "red kidney beans canned", alternates: ["canned kidney beans"] },
  { name: "cannellini beans canned", alternates: ["canned cannellini beans", "white beans canned"] },
  { name: "black beans canned", alternates: ["canned black beans"] },
  { name: "butter beans canned", alternates: ["canned butter beans", "lima beans canned"] },
  { name: "borlotti beans canned", alternates: ["canned borlotti beans"] },
  { name: "four bean mix canned", alternates: ["canned four bean mix"] },
  { name: "baked beans canned", alternates: ["canned baked beans"] },
  
  // LEGUMES - DRIED
  { name: "lentils red dried", alternates: ["dried red lentils", "red lentils"] },
  { name: "lentils green dried", alternates: ["dried green lentils", "green lentils"] },
  { name: "lentils brown dried", alternates: ["dried brown lentils", "brown lentils"] },
  { name: "lentils french dried", alternates: ["dried french lentils", "puy lentils"] },
  { name: "chickpeas dried", alternates: ["dried chickpeas", "dried garbanzo beans"] },
  { name: "split peas green", alternates: ["green split peas"] },
  { name: "split peas yellow", alternates: ["yellow split peas"] },
  { name: "black beans dried", alternates: ["dried black beans"] },
  { name: "kidney beans dried", alternates: ["dried kidney beans"] },
  { name: "mung beans", alternates: ["mung beans dried"] },
  
  // NUTS
  { name: "almonds whole", alternates: ["whole almonds"] },
  { name: "almonds slivered", alternates: ["slivered almonds", "sliced almonds"] },
  { name: "almonds flaked", alternates: ["flaked almonds"] },
  { name: "almond meal", alternates: ["almond flour"] },
  { name: "walnuts", alternates: ["walnut halves", "walnut pieces"] },
  { name: "cashews", alternates: ["cashew nuts"] },
  { name: "peanuts raw", alternates: ["raw peanuts"] },
  { name: "peanuts roasted", alternates: ["roasted peanuts"] },
  { name: "macadamias", alternates: ["macadamia nuts"] },
  { name: "hazelnuts", alternates: [] },
  { name: "pecans", alternates: ["pecan nuts", "pecan halves"] },
  { name: "brazil nuts", alternates: [] },
  { name: "pistachios", alternates: ["pistachio nuts"] },
  { name: "mixed nuts", alternates: [] },
  
  // SEEDS
  { name: "chia seeds", alternates: [] },
  { name: "flaxseeds", alternates: ["flax seeds", "linseeds"] },
  { name: "sunflower seeds", alternates: [] },
  { name: "pumpkin seeds", alternates: ["pepitas"] },
  { name: "sesame seeds white", alternates: ["white sesame seeds"] },
  { name: "sesame seeds black", alternates: ["black sesame seeds"] },
  { name: "poppy seeds", alternates: [] },
  { name: "hemp seeds", alternates: [] },
  
  // NUT BUTTERS
  { name: "peanut butter smooth", alternates: ["smooth peanut butter"] },
  { name: "peanut butter crunchy", alternates: ["crunchy peanut butter"] },
  { name: "almond butter", alternates: [] },
  { name: "tahini", alternates: ["sesame paste", "tahina"] },
  { name: "abc butter", alternates: ["almond brazil cashew butter"] },
  { name: "hazelnut spread", alternates: ["nutella"] },
  
  // COOKING OILS
  { name: "vegetable oil", alternates: [] },
  { name: "canola oil", alternates: [] },
  { name: "rice bran oil", alternates: [] },
  { name: "coconut oil virgin", alternates: ["virgin coconut oil"] },
  { name: "coconut oil refined", alternates: ["refined coconut oil"] },
  { name: "avocado oil", alternates: [] },
  { name: "peanut oil", alternates: [] },
  { name: "sesame oil", alternates: [] },
  { name: "truffle oil", alternates: [] },
  { name: "walnut oil", alternates: [] },
  { name: "macadamia oil", alternates: [] },
  
  // SOLID FATS
  { name: "ghee", alternates: ["clarified butter"] },
  { name: "copha", alternates: ["vegetable shortening"] },
  { name: "lard", alternates: [] },
  { name: "dripping", alternates: ["beef dripping"] },
  
  // VINEGARS
  { name: "vinegar white", alternates: ["white vinegar", "distilled vinegar"] },
  { name: "vinegar red wine", alternates: ["red wine vinegar"] },
  { name: "vinegar white wine", alternates: ["white wine vinegar"] },
  { name: "vinegar apple cider", alternates: ["apple cider vinegar", "acv"] },
  { name: "vinegar balsamic", alternates: ["balsamic vinegar"] },
  { name: "vinegar malt", alternates: ["malt vinegar"] },
  { name: "vinegar sherry", alternates: ["sherry vinegar"] },
  
  // SOY-BASED SAUCES
  { name: "soy sauce light", alternates: ["light soy sauce"] },
  { name: "soy sauce dark", alternates: ["dark soy sauce"] },
  { name: "soy sauce low sodium", alternates: ["low sodium soy sauce", "reduced salt soy sauce"] },
  { name: "tamari", alternates: ["tamari sauce"] },
  { name: "kecap manis", alternates: ["sweet soy sauce"] },
  { name: "teriyaki sauce", alternates: [] },
  
  // ASIAN SAUCES
  { name: "fish sauce", alternates: ["nam pla"] },
  { name: "sweet chilli sauce", alternates: ["sweet chili sauce"] },
  { name: "sambal oelek", alternates: ["sambal"] },
  { name: "black bean sauce", alternates: [] },
  { name: "plum sauce", alternates: [] },
  { name: "satay sauce", alternates: [] },
  { name: "curry paste red", alternates: ["red curry paste", "thai red curry paste"] },
  { name: "curry paste green", alternates: ["green curry paste", "thai green curry paste"] },
  { name: "curry paste yellow", alternates: ["yellow curry paste"] },
  { name: "curry paste massaman", alternates: ["massaman curry paste"] },
  { name: "curry paste panang", alternates: ["panang curry paste"] },
  { name: "laksa paste", alternates: [] },
  
  // WESTERN SAUCES
  { name: "tomato sauce", alternates: ["ketchup", "tomato ketchup"] },
  { name: "bbq sauce", alternates: ["barbecue sauce"] },
  { name: "hp sauce", alternates: [] },
  { name: "tabasco", alternates: ["tabasco sauce"] },
  { name: "mustard dijon", alternates: ["dijon mustard"] },
  { name: "mustard wholegrain", alternates: ["wholegrain mustard", "whole grain mustard"] },
  { name: "mustard american yellow", alternates: ["yellow mustard", "american mustard"] },
  { name: "mustard english", alternates: ["english mustard"] },
  { name: "mayonnaise", alternates: ["mayo"] },
  { name: "aioli", alternates: ["garlic aioli"] },
  { name: "tartare sauce", alternates: ["tartar sauce"] },
  { name: "hollandaise sauce", alternates: [] },
  
  // COOKING PASTES & SAUCES
  { name: "tomato paste", alternates: ["tomato puree concentrate"] },
  { name: "passata", alternates: ["tomato puree", "sieved tomatoes"] },
  { name: "harissa paste", alternates: ["harissa"] },
  { name: "chimichurri", alternates: [] },
  { name: "salsa", alternates: [] },
  { name: "enchilada sauce", alternates: [] },
  { name: "taco sauce", alternates: [] },
  { name: "peri peri sauce", alternates: ["piri piri sauce"] },
  
  // PICKLES & PRESERVES
  { name: "pickled gherkins", alternates: ["gherkins", "pickled cucumbers", "dill pickles"] },
  { name: "pickled onions", alternates: ["pickled pearl onions"] },
  { name: "olives black", alternates: ["black olives"] },
  { name: "olives green", alternates: ["green olives"] },
  { name: "sun dried tomatoes", alternates: ["sundried tomatoes"] },
  { name: "roasted capsicums jarred", alternates: ["roasted red peppers jarred", "roasted capsicum in jar"] },
  { name: "artichoke hearts jarred", alternates: ["jarred artichoke hearts"] },
  { name: "jalapenos pickled", alternates: ["pickled jalapeños", "pickled jalapeno"] },
  { name: "sauerkraut", alternates: [] },
  { name: "kimchi", alternates: [] },
  
  // SPREADS
  { name: "vegemite", alternates: [] },
  { name: "marmite", alternates: [] },
  { name: "jam strawberry", alternates: ["strawberry jam"] },
  { name: "jam raspberry", alternates: ["raspberry jam"] },
  { name: "jam apricot", alternates: ["apricot jam"] },
  { name: "marmalade", alternates: ["orange marmalade"] },
  { name: "honey", alternates: [] },
  { name: "maple syrup", alternates: [] },
  { name: "golden syrup", alternates: [] },
  { name: "treacle", alternates: ["molasses"] },
  { name: "lemon curd", alternates: [] },
  
  // DIPS
  { name: "baba ganoush", alternates: ["baba ghanoush"] },
  { name: "taramasalata", alternates: [] },
  { name: "pesto basil", alternates: ["basil pesto"] },
  { name: "pesto sun dried tomato", alternates: ["sun-dried tomato pesto"] },
];

console.log('\n📦 Adding Melbourne Ingredients - Part 3');
console.log('========================================\n');

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
    tags: tags.length > 0 ? tags : ['other']
  };
  
  added++;
  console.log(`✅ Added: ${item.name} (${id})`);
}

const totalIngredients = Object.keys(masterData.ingredients).length;
masterData._totalEntries = totalIngredients;
masterData._lastUpdated = new Date().toISOString();

fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added}`);
console.log(`   Skipped: ${skipped}`);
console.log(`   Total ingredients: ${totalIngredients}`);
console.log(`\n✅ Part 3 complete!\n`);
