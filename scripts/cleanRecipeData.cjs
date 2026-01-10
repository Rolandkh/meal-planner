/**
 * Clean Recipe Catalog Data
 * 
 * Fixes common data quality issues in the recipe catalog:
 * - Remove invalid "serving or" entries
 * - Fix typos (basil& → basil &)
 * - Fix incomplete entries
 * - Standardize ingredient names
 * - Remove brand names from ingredients
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const BACKUP_PATH = path.join(__dirname, '../src/data/vanessa_recipe_catalog.backup.json');

console.log('\n🧹 Cleaning Recipe Catalog Data');
console.log('================================\n');

// Load catalog
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Create backup
fs.writeFileSync(BACKUP_PATH, JSON.stringify(catalog, null, 2));
console.log(`💾 Backup created: ${BACKUP_PATH}\n`);

let totalRecipes = catalog.recipes.length;
let totalIngredients = 0;
let removed = 0;
let fixed = 0;
let split = 0;

const fixLog = [];

for (const recipe of catalog.recipes) {
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) continue;
  
  const originalCount = recipe.ingredients.length;
  totalIngredients += originalCount;
  
  const cleanedIngredients = [];
  
  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i];
    let name = typeof ing === 'string' ? ing : (ing.name || ing.ingredient || '');
    
    if (!name || name.trim().length === 0) {
      removed++;
      fixLog.push({ recipe: recipe.name, issue: 'Empty ingredient', original: ing });
      continue;
    }
    
    // Fix 1: Remove "serving or" / "servings or" entries
    if (name.toLowerCase().includes('serving') && name.toLowerCase().includes('or')) {
      removed++;
      fixLog.push({ recipe: recipe.name, issue: 'Invalid "serving or"', original: name });
      continue;
    }
    
    // Fix 2: Fix missing spaces before symbols
    if (name.includes('&')) {
      const oldName = name;
      name = name.replace(/(\w)&(\w)/g, '$1 & $2');
      
      // If it contains "and" or "&", split into multiple ingredients
      if (name.includes(' & ') || name.includes(' and ')) {
        const parts = name.split(/\s+(?:&|and)\s+/);
        if (parts.length === 2 && parts[0].length > 2 && parts[1].length > 2) {
          // Split into two ingredients
          const ing1 = typeof ing === 'string' ? parts[0] : { ...ing, name: parts[0] };
          const ing2 = typeof ing === 'string' ? parts[1] : { ...ing, name: parts[1] };
          cleanedIngredients.push(ing1, ing2);
          split++;
          fixLog.push({ 
            recipe: recipe.name, 
            issue: 'Split compound ingredient', 
            original: oldName,
            result: [parts[0], parts[1]]
          });
          continue;
        }
      }
      
      if (oldName !== name) {
        fixed++;
        fixLog.push({ recipe: recipe.name, issue: 'Fixed spacing', original: oldName, fixed: name });
      }
    }
    
    // Fix 3: Remove "equivalent amount" descriptions
    if (name.toLowerCase().includes('equivalent')) {
      const oldName = name;
      name = name.replace(/equivalent\s+amount\s+of\s+(?:a\s+)?/gi, '');
      name = name.replace(/\s+/g, ' ').trim();
      fixed++;
      fixLog.push({ recipe: recipe.name, issue: 'Removed "equivalent"', original: oldName, fixed: name });
    }
    
    // Fix 4: Remove brand names
    const brandNames = ['goya', 'ronzoni', 'barilla', 'botticelli', 'ener-g', 'montery', 'monterey'];
    for (const brand of brandNames) {
      if (name.toLowerCase().includes(brand)) {
        const oldName = name;
        name = name.replace(new RegExp(brand, 'gi'), '').replace(/\s+/g, ' ').trim();
        fixed++;
        fixLog.push({ recipe: recipe.name, issue: `Removed brand "${brand}"`, original: oldName, fixed: name });
        break;
      }
    }
    
    // Fix 5: Standardize specific varieties to generic
    const varietyMappings = {
      'russet potatoes': 'potatoes',
      'golden beets': 'beetroot',
      'brown mushrooms': 'mushrooms',
      'whole-milk mozzarella': 'mozzarella',
      'milk mozzarella': 'mozzarella',
      'curd cottage cheese': 'cottage cheese',
      'club soda': 'soda water',
      'no boil lasagna noodles': 'lasagna sheets',
      'curly edge lasagna': 'lasagna sheets',
      'wonton wrappers': 'wonton wrapper',
      'manchego cheese': 'cheese',
      'graviera': 'cheese',
      'round steak': 'beef steak',
      'style cheese': 'cheese',
      'several parsley sprigs': 'parsley',
      'oregano flakes': 'oregano dried',
      'marjoram leaves': 'marjoram',
      'pastry flour': 'plain flour'
    };
    
    const nameLower = name.toLowerCase();
    for (const [variety, generic] of Object.entries(varietyMappings)) {
      if (nameLower.includes(variety)) {
        const oldName = name;
        name = name.replace(new RegExp(variety, 'gi'), generic);
        fixed++;
        fixLog.push({ recipe: recipe.name, issue: `Standardized variety`, original: oldName, fixed: name });
        break;
      }
    }
    
    // Update ingredient
    if (typeof ing === 'string') {
      cleanedIngredients.push(name);
    } else {
      cleanedIngredients.push({ ...ing, name });
    }
  }
  
  recipe.ingredients = cleanedIngredients;
}

// Save cleaned catalog
fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

console.log('📊 Cleaning Summary:');
console.log(`   Recipes processed:      ${totalRecipes}`);
console.log(`   Total ingredients:      ${totalIngredients}`);
console.log(`   ❌ Removed (invalid):    ${removed}`);
console.log(`   ✏️  Fixed (typos/errors): ${fixed}`);
console.log(`   ➗ Split (compound):      ${split}`);
console.log('');

// Save detailed log
const logPath = path.join(__dirname, '../tmp/recipe-cleaning-log.json');
fs.writeFileSync(logPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: { totalRecipes, totalIngredients, removed, fixed, split },
  fixes: fixLog
}, null, 2));

console.log(`📄 Detailed log: ${logPath}`);
console.log('');
console.log('✅ Recipe catalog cleaned!');
console.log('');
console.log('💡 Next: Re-run normalization test to see improvements\n');
