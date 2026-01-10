/**
 * Add Melbourne Ingredients - Part 2
 * Herbs, Meat, Seafood, Dairy, Grains
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

function createId(name) {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function determineUnit(name, category) {
  const liquidKeywords = ['oil', 'vinegar', 'sauce', 'milk', 'cream', 'juice', 'stock', 'broth', 'water', 'wine', 'syrup', 'extract'];
  if (liquidKeywords.some(kw => name.toLowerCase().includes(kw))) return 'ml';
  if (name.includes('egg') && !name.includes('noodle') && !name.includes('plant')) return 'whole';
  return 'g';
}

function determineState(name, category) {
  if (name.includes('frozen')) return 'frozen';
  if (name.includes('canned') || name.includes('jarred')) return 'canned';
  if (name.includes('dried') || name.includes('dry')) return 'dried';
  if (category && category.includes('fresh')) return 'fresh';
  return 'other';
}

function generateAliases(baseName, alternates) {
  const aliases = [baseName];
  if (!baseName.endsWith('s')) aliases.push(baseName + 's');
  else if (baseName.endsWith('es')) aliases.push(baseName.slice(0, -2));
  else aliases.push(baseName.slice(0, -1));
  if (alternates) alternates.forEach(alt => { aliases.push(alt); if (!alt.endsWith('s')) aliases.push(alt + 's'); });
  return [...new Set(aliases)];
}

function assignTags(name, category) {
  const tags = [];
  if (category) {
    if (category.includes('herb')) tags.push('herb');
    if (category.includes('meat')) tags.push('meat', 'protein');
    if (category.includes('seafood')) tags.push('seafood', 'protein');
    if (category.includes('dairy')) tags.push('dairy');
    if (category.includes('grain')) tags.push('grain');
  }
  const protectiveKeywords = ['salmon', 'sardine', 'mackerel', 'yoghurt', 'yogurt', 'kefir', 'walnut', 'quinoa', 'oat', 'lentil', 'chickpea'];
  if (protectiveKeywords.some(kw => name.toLowerCase().includes(kw))) tags.push('protective');
  return tags;
}

const NEW_INGREDIENTS = [
  // FRESH HERBS
  { name: "basil", category: "herb_fresh", alternates: ["fresh basil", "basil leaves"] },
  { name: "parsley flat leaf", category: "herb_fresh", alternates: ["flat leaf parsley", "italian parsley"] },
  { name: "parsley curly", category: "herb_fresh", alternates: ["curly parsley"] },
  { name: "coriander", category: "herb_fresh", alternates: ["cilantro", "fresh coriander", "coriander leaves"] },
  { name: "mint", category: "herb_fresh", alternates: ["fresh mint", "mint leaves"] },
  { name: "thyme", category: "herb_fresh", alternates: ["fresh thyme"] },
  { name: "rosemary", category: "herb_fresh", alternates: ["fresh rosemary"] },
  { name: "oregano fresh", category: "herb_fresh", alternates: ["fresh oregano"] },
  { name: "sage", category: "herb_fresh", alternates: ["fresh sage"] },
  { name: "dill", category: "herb_fresh", alternates: ["fresh dill", "dill weed"] },
  { name: "chives", category: "herb_fresh", alternates: ["fresh chives"] },
  { name: "tarragon", category: "herb_fresh", alternates: ["fresh tarragon"] },
  { name: "bay leaves", category: "herb_fresh", alternates: ["fresh bay leaves", "bay leaf"] },
  { name: "lemongrass", category: "herb_fresh", alternates: ["lemon grass"] },
  { name: "kaffir lime leaves", category: "herb_fresh", alternates: ["makrut lime leaves", "lime leaves"] },
  { name: "vietnamese mint", category: "herb_fresh", alternates: [] },
  { name: "thai basil", category: "herb_fresh", alternates: ["holy basil"] },
  { name: "curry leaves", category: "herb_fresh", alternates: [] },
  
  // MEAT - BEEF
  { name: "beef mince regular", category: "meat_fresh", alternates: ["regular beef mince", "ground beef"] },
  { name: "beef mince lean", category: "meat_fresh", alternates: ["lean beef mince"] },
  { name: "beef mince extra lean", category: "meat_fresh", alternates: ["extra lean beef mince"] },
  { name: "beef mince premium", category: "meat_fresh", alternates: ["premium beef mince"] },
  { name: "beef steak rump", category: "meat_fresh", alternates: ["rump steak"] },
  { name: "beef steak sirloin", category: "meat_fresh", alternates: ["sirloin steak", "porterhouse steak"] },
  { name: "beef steak scotch fillet", category: "meat_fresh", alternates: ["scotch fillet", "ribeye steak"] },
  { name: "beef steak eye fillet", category: "meat_fresh", alternates: ["eye fillet", "tenderloin steak", "fillet steak"] },
  { name: "beef steak t-bone", category: "meat_fresh", alternates: ["t-bone steak", "tbone steak"] },
  { name: "beef steak flank", category: "meat_fresh", alternates: ["flank steak"] },
  { name: "beef steak skirt", category: "meat_fresh", alternates: ["skirt steak"] },
  { name: "beef roast topside", category: "meat_fresh", alternates: ["topside roast"] },
  { name: "beef roast silverside", category: "meat_fresh", alternates: ["silverside roast"] },
  { name: "beef roast blade", category: "meat_fresh", alternates: ["blade roast"] },
  { name: "beef roast chuck", category: "meat_fresh", alternates: ["chuck roast"] },
  { name: "beef brisket", category: "meat_fresh", alternates: ["beef brisket joint"] },
  { name: "beef stir fry strips", category: "meat_fresh", alternates: ["beef strips"] },
  { name: "beef diced", category: "meat_fresh", alternates: ["diced beef", "beef casserole"] },
  { name: "beef corned", category: "meat_fresh", alternates: ["corned beef", "corned silverside"] },
  { name: "beef osso bucco", category: "meat_fresh", alternates: ["osso bucco"] },
  { name: "beef cheeks", category: "meat_fresh", alternates: [] },
  { name: "beef oxtail", category: "meat_fresh", alternates: ["oxtail"] },
  
  // MEAT - LAMB
  { name: "lamb mince", category: "meat_fresh", alternates: ["ground lamb"] },
  { name: "lamb chops loin", category: "meat_fresh", alternates: ["loin lamb chops", "lamb loin chops"] },
  { name: "lamb chops forequarter", category: "meat_fresh", alternates: ["forequarter chops"] },
  { name: "lamb cutlets", category: "meat_fresh", alternates: ["lamb cutlet", "lamb rib chops"] },
  { name: "lamb leg bone in", category: "meat_fresh", alternates: ["leg of lamb bone in"] },
  { name: "lamb leg boneless", category: "meat_fresh", alternates: ["boneless leg of lamb"] },
  { name: "lamb leg butterflied", category: "meat_fresh", alternates: ["butterflied leg of lamb"] },
  { name: "lamb shoulder bone in", category: "meat_fresh", alternates: ["lamb shoulder roast"] },
  { name: "lamb shoulder boneless", category: "meat_fresh", alternates: ["boneless lamb shoulder"] },
  { name: "lamb rack", category: "meat_fresh", alternates: ["rack of lamb"] },
  { name: "lamb shanks", category: "meat_fresh", alternates: ["lamb shank"] },
  { name: "lamb backstrap", category: "meat_fresh", alternates: ["lamb loin", "lamb backstraps"] },
  { name: "lamb diced", category: "meat_fresh", alternates: ["diced lamb"] },
  { name: "lamb neck", category: "meat_fresh", alternates: ["lamb neck chops"] },
  
  // MEAT - PORK
  { name: "pork mince", category: "meat_fresh", alternates: ["ground pork"] },
  { name: "pork chops loin", category: "meat_fresh", alternates: ["pork loin chops"] },
  { name: "pork chops forequarter", category: "meat_fresh", alternates: ["pork forequarter chops"] },
  { name: "pork roast leg", category: "meat_fresh", alternates: ["leg of pork"] },
  { name: "pork roast shoulder", category: "meat_fresh", alternates: ["pork shoulder", "pork butt"] },
  { name: "pork roast loin", category: "meat_fresh", alternates: ["loin of pork"] },
  { name: "pork belly", category: "meat_fresh", alternates: ["pork belly roast"] },
  { name: "pork belly sliced", category: "meat_fresh", alternates: ["sliced pork belly"] },
  { name: "pork steaks leg", category: "meat_fresh", alternates: ["pork leg steaks"] },
  { name: "pork steaks loin", category: "meat_fresh", alternates: ["pork loin steaks"] },
  { name: "pork steaks scotch", category: "meat_fresh", alternates: ["pork scotch steaks", "pork collar"] },
  { name: "pork ribs spare", category: "meat_fresh", alternates: ["pork spare ribs"] },
  { name: "pork ribs baby back", category: "meat_fresh", alternates: ["baby back ribs"] },
  { name: "pork fillet", category: "meat_fresh", alternates: ["pork tenderloin", "pork fillet tenderloin"] },
  { name: "pork diced", category: "meat_fresh", alternates: ["diced pork"] },
  
  // POULTRY - CHICKEN
  { name: "chicken whole", category: "meat_fresh", alternates: ["whole chicken"] },
  { name: "chicken breast skin on bone in", category: "meat_fresh", alternates: ["chicken breast on bone"] },
  { name: "chicken breast skinless boneless", category: "meat_fresh", alternates: ["chicken breast fillet", "skinless chicken breast"] },
  { name: "chicken thigh skin on bone in", category: "meat_fresh", alternates: ["chicken thighs on bone"] },
  { name: "chicken thigh skinless boneless", category: "meat_fresh", alternates: ["chicken thigh fillet"] },
  { name: "chicken drumsticks", category: "meat_fresh", alternates: ["chicken drumstick"] },
  { name: "chicken wings", category: "meat_fresh", alternates: ["chicken wing"] },
  { name: "chicken wings nibbles", category: "meat_fresh", alternates: ["chicken nibbles", "wingettes"] },
  { name: "chicken tenderloin", category: "meat_fresh", alternates: ["chicken tenderloins", "chicken tenders"] },
  { name: "chicken mince", category: "meat_fresh", alternates: ["ground chicken", "minced chicken"] },
  { name: "chicken maryland", category: "meat_fresh", alternates: ["chicken leg quarter"] },
  { name: "chicken lovely legs", category: "meat_fresh", alternates: [] },
  { name: "chicken bbq rotisserie", category: "meat_fresh", alternates: ["rotisserie chicken", "bbq chicken cooked"] },
  
  // POULTRY - TURKEY & DUCK  
  { name: "turkey breast whole", category: "meat_fresh", alternates: ["whole turkey breast"] },
  { name: "turkey breast steaks", category: "meat_fresh", alternates: ["turkey steaks"] },
  { name: "turkey mince", category: "meat_fresh", alternates: ["ground turkey"] },
  { name: "turkey whole bird", category: "meat_fresh", alternates: ["whole turkey"] },
  { name: "duck breast", category: "meat_fresh", alternates: ["duck breast fillet"] },
  { name: "duck whole bird", category: "meat_fresh", alternates: ["whole duck"] },
  { name: "duck legs", category: "meat_fresh", alternates: ["duck leg"] },
  
  // PROCESSED MEATS
  { name: "bacon middle", category: "meat_processed", alternates: ["middle bacon", "bacon rashers"] },
  { name: "bacon streaky", category: "meat_processed", alternates: ["streaky bacon"] },
  { name: "bacon short cut", category: "meat_processed", alternates: ["short cut bacon"] },
  { name: "bacon smoked", category: "meat_processed", alternates: ["smoked bacon"] },
  { name: "ham leg", category: "meat_processed", alternates: ["leg ham", "ham off the bone"] },
  { name: "ham shoulder", category: "meat_processed", alternates: ["shoulder ham"] },
  { name: "ham sliced deli", category: "meat_processed", alternates: ["deli ham", "sliced ham"] },
  { name: "prosciutto", category: "meat_processed", alternates: [] },
  { name: "pancetta", category: "meat_processed", alternates: [] },
  { name: "salami", category: "meat_processed", alternates: [] },
  { name: "chorizo", category: "meat_processed", alternates: [] },
  { name: "kransky", category: "meat_processed", alternates: ["kranskys"] },
  { name: "sausages beef", category: "meat_processed", alternates: ["beef sausages"] },
  { name: "sausages pork", category: "meat_processed", alternates: ["pork sausages"] },
  { name: "sausages chicken", category: "meat_processed", alternates: ["chicken sausages"] },
  { name: "sausages lamb", category: "meat_processed", alternates: ["lamb sausages"] },
  { name: "sausages italian", category: "meat_processed", alternates: ["italian sausages"] },
  { name: "sausages cumberland", category: "meat_processed", alternates: ["cumberland sausages"] },
  { name: "sausages chipolata", category: "meat_processed", alternates: ["chipolata sausages"] },
  { name: "hot dogs", category: "meat_processed", alternates: ["frankfurts", "franks"] },
  { name: "kabana", category: "meat_processed", alternates: [] },
  
  // SEAFOOD - FRESH FISH
  { name: "salmon atlantic fillets", category: "seafood_fresh", alternates: ["atlantic salmon fillets", "salmon fillets"] },
  { name: "salmon portions", category: "seafood_fresh", alternates: ["salmon portion"] },
  { name: "salmon whole side", category: "seafood_fresh", alternates: ["side of salmon", "whole salmon side"] },
  { name: "barramundi fillets", category: "seafood_fresh", alternates: ["barramundi fillet", "barra fillets"] },
  { name: "flathead fillets", category: "seafood_fresh", alternates: ["flathead fillet"] },
  { name: "snapper", category: "seafood_fresh", alternates: ["snapper fillet", "snapper fillets"] },
  { name: "bream", category: "seafood_fresh", alternates: ["bream fillet", "bream fillets"] },
  { name: "dory", category: "seafood_fresh", alternates: ["basa", "dory fillets", "john dory"] },
  { name: "whiting", category: "seafood_fresh", alternates: ["whiting fillets"] },
  { name: "perch", category: "seafood_fresh", alternates: ["nile perch", "perch fillets"] },
  { name: "tuna steaks", category: "seafood_fresh", alternates: ["fresh tuna steaks"] },
  { name: "swordfish steaks", category: "seafood_fresh", alternates: ["swordfish steak"] },
  { name: "mackerel", category: "seafood_fresh", alternates: ["mackerel whole", "mackerel fillet"] },
  { name: "sardines fresh", category: "seafood_fresh", alternates: ["fresh sardines"] },
  { name: "trout", category: "seafood_fresh", alternates: ["rainbow trout", "trout fillet"] },
  
  // CANNED/PRESERVED FISH
  { name: "tuna canned in oil", category: "seafood_canned", alternates: ["canned tuna in oil"] },
  { name: "tuna canned in springwater", category: "seafood_canned", alternates: ["canned tuna in springwater"] },
  { name: "tuna canned flavoured", category: "seafood_canned", alternates: ["flavoured tuna"] },
  { name: "salmon canned pink", category: "seafood_canned", alternates: ["pink salmon canned"] },
  { name: "salmon canned red", category: "seafood_canned", alternates: ["red salmon canned"] },
  { name: "sardines canned", category: "seafood_canned", alternates: ["canned sardines"] },
  { name: "anchovies canned", category: "seafood_canned", alternates: ["canned anchovies"] },
  { name: "mackerel canned", category: "seafood_canned", alternates: ["canned mackerel"] },
  { name: "smoked salmon cold", category: "seafood_preserved", alternates: ["cold smoked salmon"] },
  { name: "smoked salmon hot", category: "seafood_preserved", alternates: ["hot smoked salmon"] },
  { name: "smoked trout", category: "seafood_preserved", alternates: [] },
  
  // SHELLFISH & CRUSTACEANS
  { name: "prawns green raw", category: "seafood_fresh", alternates: ["green prawns", "raw prawns"] },
  { name: "prawns cooked", category: "seafood_fresh", alternates: ["cooked prawns"] },
  { name: "prawns king", category: "seafood_fresh", alternates: ["king prawns"] },
  { name: "prawns tiger", category: "seafood_fresh", alternates: ["tiger prawns"] },
  { name: "prawns banana", category: "seafood_fresh", alternates: ["banana prawns"] },
  { name: "shrimp", category: "seafood_fresh", alternates: ["shrimps"] },
  { name: "calamari tubes", category: "seafood_fresh", alternates: ["squid tubes"] },
  { name: "calamari rings", category: "seafood_fresh", alternates: ["squid rings"] },
  { name: "mussels", category: "seafood_fresh", alternates: ["fresh mussels"] },
  { name: "oysters", category: "seafood_fresh", alternates: ["fresh oysters"] },
  { name: "scallops", category: "seafood_fresh", alternates: ["fresh scallops"] },
  { name: "crab blue swimmer", category: "seafood_fresh", alternates: ["blue swimmer crab"] },
  { name: "crab mud", category: "seafood_fresh", alternates: ["mud crab"] },
  { name: "crab meat", category: "seafood_fresh", alternates: ["fresh crab meat"] },
  { name: "lobster", category: "seafood_fresh", alternates: ["crayfish", "rock lobster"] },
  { name: "octopus", category: "seafood_fresh", alternates: ["fresh octopus"] },
  { name: "clams", category: "seafood_fresh", alternates: ["vongole"] },
];

console.log('\n📦 Adding Melbourne Ingredients - Part 2');
console.log('========================================\n');

const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
let added = 0;
let skipped = 0;

for (const item of NEW_INGREDIENTS) {
  const id = createId(item.name);
  const unit = determineUnit(item.name, item.category);
  const state = determineState(item.name, item.category);
  const aliases = generateAliases(item.name, item.alternates);
  const tags = assignTags(item.name, item.category);
  
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

fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));

console.log(`\n📊 Summary:`);
console.log(`   Added: ${added}`);
console.log(`   Skipped: ${skipped}`);
console.log(`   Total ingredients: ${totalIngredients}`);
console.log(`\n✅ Part 2 complete!\n`);
