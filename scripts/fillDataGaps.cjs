/**
 * Fill Data Gaps with AI Research
 * 
 * Uses AI to research and fill missing:
 * 1. Nutrition data (fallback to similar ingredients)
 * 2. Pricing data (research Melbourne prices)
 * 
 * Strategy:
 * - For specific varieties: Use generic equivalent nutrition
 * - For missing items: Research with Claude
 * - For pricing: Estimate based on similar items or research
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Generic ingredient mappings for nutrition fallbacks
const NUTRITION_FALLBACKS = {
  // Potato varieties → generic potato
  'potato_brushed': 'potatoes',
  'potato_washed': 'potatoes',
  'potato_desiree': 'potatoes',
  'potato_kipfler': 'potatoes',
  'potato_sebago': 'potatoes',
  
  // Kale varieties → generic kale
  'kale_curly': 'kale',
  'kale_tuscan': 'kale',
  
  // Cabbage varieties → generic cabbage
  'cabbage_wombok': 'cabbage',
  'cabbage_savoy': 'cabbage_red',  // Similar
  
  // Lettuce varieties → generic lettuce
  'lettuce_mixed_leaves': 'lettuce',
  'lettuce_iceberg': 'lettuce',
  'lettuce_cos': 'lettuce',
  'lettuce_butter': 'lettuce',
  
  // Spinach varieties → generic spinach
  'spinach_baby': 'spinach',
  'spinach_bunch': 'spinach',
  
  // Sweet potato varieties → generic sweet potato
  'sweet_potato_white': 'sweet_potatoes',
  'sweet_potato_orange': 'sweet_potatoes',
  
  // Tomato varieties → generic tomato
  'tomato_truss': 'tomato',
  'tomato_roma': 'tomato',
  'tomato_vine_ripened': 'tomato',
  'tomato_heirloom': 'tomato',
  
  // Capsicum varieties → generic bell pepper
  'capsicum_red': 'bell_pepper',
  'capsicum_green': 'bell_pepper',
  'capsicum_yellow': 'bell_pepper',
  'capsicum_orange': 'bell_pepper',
  
  // Mushroom varieties
  'mushrooms_button': 'mushrooms',
  'mushrooms_cup': 'mushrooms',
  'mushrooms_flat': 'portobello_mushroom',
  'mushrooms_swiss_brown': 'mushrooms',
  'mushrooms_enoki': 'mushrooms',
  
  // Cucumber varieties
  'cucumber_continental': 'cucumber',
  'cucumber_lebanese': 'cucumber',
  'cucumber_telegraph': 'cucumber',
  
  // Zucchini varieties
  'zucchini_green': 'zucchini',
  'zucchini_yellow': 'zucchini',
  
  // Pumpkin varieties
  'pumpkin_butternut': 'pumpkin',
  'pumpkin_kent': 'pumpkin',
  'pumpkin_queensland_blue': 'pumpkin',
  
  // Carrot varieties
  'carrot_bunch': 'carrot',
  'carrot_loose': 'carrot',
  
  // Beetroot varieties
  'beetroot_bunch': 'beetroot',
  'beetroot_loose': 'beetroot',
  
  // Onion varieties
  'spring_onions': 'green_onions',
  
  // Garlic varieties
  'garlic_bulb': 'garlic',
  'garlic_pre_peeled': 'garlic',
  'garlic_minced_jar': 'garlic_powder',
  
  // Ginger varieties
  'ginger_fresh_root': 'ginger',
  
  // Chilli varieties
  'chilli_red': 'chili_pepper',
  'chilli_green': 'chili_pepper',
  'chilli_birds_eye': 'chili_pepper',
  'chilli_jalapeno': 'jalapeno_pepper',
  'chilli_long_red': 'chili_pepper',
};

/**
 * Copy nutrition from generic equivalent
 */
function copyNutritionFromFallback(catalog, ingredientId, fallbackId) {
  const ingredient = catalog.ingredients[ingredientId];
  const fallback = catalog.ingredients[fallbackId];
  
  if (!fallback || !fallback.nutritionBase) {
    return false;
  }
  
  // Deep copy nutrition data
  ingredient.nutritionBase = JSON.parse(JSON.stringify(fallback.nutritionBase));
  ingredient.nutritionBase.source += ' (copied from ' + fallbackId + ')';
  ingredient.nutritionBase.lastUpdated = new Date().toISOString().split('T')[0];
  
  // Copy preparation variants too
  if (fallback.nutritionByPreparation && !ingredient.nutritionByPreparation) {
    ingredient.nutritionByPreparation = JSON.parse(JSON.stringify(fallback.nutritionByPreparation));
  }
  
  return true;
}

/**
 * Research pricing using AI
 */
async function researchPricing(ingredientName, state, canonicalUnit) {
  if (!ANTHROPIC_API_KEY) {
    return null;
  }
  
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  const prompt = 'Research the typical Melbourne, Australia supermarket price for: "' + ingredientName + '" (state: ' + state + ')\n\nProvide a JSON response with estimated pricing:\n{\n  "averagePrice": <number in AUD>,\n  "unit": "<typical retail unit: kg, L, pack, bunch, etc>",\n  "unitSize": "<description like \'1kg bag\', \'500g pack\'>",\n  "notes": "<brief note about pricing>"\n}\n\nConsider Coles and Woolworths pricing. Be realistic and conservative.';
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[^}]+\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('  Error researching ' + ingredientName + ':', error.message);
  }
  
  return null;
}

/**
 * Main gap filling process
 */
async function fillGaps() {
  console.log('\n🔍 Filling Data Gaps with AI Research');
  console.log('====================================\n');
  
  const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
  const ingredients = Object.values(masterData.ingredients);
  
  const missingNutrition = ingredients.filter(i => !i.nutritionBase);
  const missingPricing = ingredients.filter(i => !i.pricing);
  
  console.log('Gaps identified:');
  console.log('  Missing nutrition: ' + missingNutrition.length);
  console.log('  Missing pricing: ' + missingPricing.length + '\n');
  
  let nutritionFilled = 0;
  let pricingFilled = 0;
  
  // STEP 1: Fill nutrition using fallbacks
  console.log('STEP 1: Filling nutrition with variety fallbacks...\n');
  
  for (const [varietyId, genericId] of Object.entries(NUTRITION_FALLBACKS)) {
    if (masterData.ingredients[varietyId] && !masterData.ingredients[varietyId].nutritionBase) {
      if (copyNutritionFromFallback(masterData, varietyId, genericId)) {
        nutritionFilled++;
        console.log('  ✅ ' + varietyId + ' ← ' + genericId);
      }
    }
  }
  
  console.log('\n  Filled via fallbacks: ' + nutritionFilled + '\n');
  
  // STEP 2: Research pricing for missing items (batch process)
  console.log('STEP 2: Researching Melbourne pricing...\n');
  console.log('⏱️  This will take ~5-10 minutes for AI research\n');
  
  const priorityIngredients = missingPricing
    .filter(i => i.state !== 'other')  // Skip generic items
    .filter(i => !i.displayName.includes('several'))  // Skip vague items
    .slice(0, 50);  // Process first 50 as demo
  
  console.log('  Researching ' + priorityIngredients.length + ' priority ingredients...\n');
  
  for (let i = 0; i < priorityIngredients.length; i++) {
    const ing = priorityIngredients[i];
    
    console.log('  [' + (i+1) + '/' + priorityIngredients.length + '] Researching: ' + ing.displayName);
    
    const pricing = await researchPricing(ing.displayName, ing.state, ing.canonicalUnit);
    
    if (pricing) {
      masterData.ingredients[ing.id].pricing = {
        ...pricing,
        currency: "AUD",
        region: "Melbourne, VIC, Australia",
        lastUpdated: new Date().toISOString().split('T')[0],
        source: "ai_research"
      };
      pricingFilled++;
      console.log('    ✅ $' + pricing.averagePrice + ' per ' + pricing.unit);
    } else {
      console.log('    ⚠️  Could not estimate');
    }
    
    // Rate limiting
    if (i < priorityIngredients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  
  // Save
  masterData._lastUpdated = new Date().toISOString();
  fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
  
  console.log('\n📊 Final Summary:');
  console.log('=================');
  console.log('  Nutrition filled: ' + nutritionFilled);
  console.log('  Pricing researched: ' + pricingFilled);
  console.log('\n✅ Data gaps filled!\n');
  
  // Final stats
  const updated = Object.values(masterData.ingredients);
  console.log('📈 Updated Coverage:');
  const withNutrition = updated.filter(i => i.nutritionBase).length;
  const withPricing = updated.filter(i => i.pricing).length;
  console.log('  With nutrition: ' + withNutrition + '/' + updated.length + ' (' + Math.round(withNutrition/updated.length*100) + '%)');
  console.log('  With pricing: ' + withPricing + '/' + updated.length + ' (' + Math.round(withPricing/updated.length*100) + '%)');
  console.log('');
}

fillGaps().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
