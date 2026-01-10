/**
 * Research Shelf Life Data for All Ingredients
 * 
 * Uses AI to research:
 * - Optimal storage location (Fridge/Pantry/Counter/Freezer)
 * - Shelf life at each storage location
 * - Freezer shelf life (if applicable)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

/**
 * Research storage and shelf life for an ingredient
 */
async function researchStorage(ingredientName, state, canonicalUnit) {
  const prompt = 'Research storage and shelf life for: "' + ingredientName + '" (state: ' + state + ', unit: ' + canonicalUnit + ')\\n\\nReturn ONLY a JSON object:\\n{\\n  "primaryStorage": "Fridge" | "Pantry/Shelf" | "Counter/Shelf" | "Freezer",\\n  "shelfLife": "time range (e.g., 3-7 days, 2-4 weeks, 6-12 months)",\\n  "shelfLifeFrozen": "time range or Not needed or Not applicable",\\n  "alternateStorage": [\\n    {"location": "Freezer", "shelfLife": "8-12 months"}\\n  ],\\n  "notes": "storage tips"\\n}\\n\\nBe specific and practical for home storage.';
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('  ❌ Error: ' + error.message);
  }
  
  return null;
}

async function researchAllShelfLife() {
  console.log('\\n🔬 Researching Shelf Life for All Ingredients');
  console.log('==============================================\\n');
  
  const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
  const allIngredients = Object.values(masterData.ingredients);
  
  const needsShelfLife = allIngredients.filter(i => !i.storage);
  
  console.log('Total ingredients: ' + allIngredients.length);
  console.log('Missing shelf life: ' + needsShelfLife.length);
  console.log('');
  console.log('⏱️  Estimated time: ~' + Math.round(needsShelfLife.length * 0.8 / 60) + ' minutes');
  console.log('💳 API calls: ' + needsShelfLife.length);
  console.log('');
  
  const stats = {
    total: needsShelfLife.length,
    success: 0,
    failed: 0
  };
  
  for (let i = 0; i < needsShelfLife.length; i++) {
    const ing = needsShelfLife[i];
    
    if (i % 50 === 0 || i === 0) {
      console.log('[' + (i + 1) + '/' + needsShelfLife.length + '] Progress: ' + Math.round((i / needsShelfLife.length) * 100) + '%');
    }
    
    console.log('  ' + ing.displayName + '...');
    
    const storage = await researchStorage(ing.displayName, ing.state, ing.canonicalUnit);
    
    if (storage) {
      masterData.ingredients[ing.id].storage = {
        location: storage.primaryStorage,
        shelfLife: storage.shelfLife,
        shelfLifeFrozen: storage.shelfLifeFrozen,
        alternateStorage: storage.alternateStorage || [],
        notes: storage.notes || ''
      };
      
      stats.success++;
      console.log('    ✅ ' + storage.primaryStorage + ': ' + storage.shelfLife);
    } else {
      stats.failed++;
      console.log('    ⚠️  Failed');
    }
    
    // Rate limiting
    if (i < needsShelfLife.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Save progress every 100 items
    if ((i + 1) % 100 === 0) {
      masterData._lastUpdated = new Date().toISOString();
      fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
      console.log('\\n💾 Progress saved (' + (i + 1) + '/' + needsShelfLife.length + ')\\n');
    }
  }
  
  // Final save
  masterData._lastUpdated = new Date().toISOString();
  fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
  
  console.log('\\n==============================================================');
  console.log('\\n📊 Research Complete:\\n');
  console.log('  Total researched: ' + stats.total);
  console.log('  Success: ' + stats.success + ' (' + Math.round(stats.success/stats.total*100) + '%)');
  console.log('  Failed: ' + stats.failed);
  console.log('');
  
  const final = Object.values(masterData.ingredients);
  const withStorage = final.filter(i => i.storage).length;
  console.log('📈 Final shelf life coverage: ' + withStorage + '/' + final.length + ' (' + Math.round(withStorage/final.length*100) + '%)');
  console.log('');
  console.log('✅ COMPLETE!\\n');
}

researchAllShelfLife().catch(error => {
  console.error('\\n❌ Fatal error:', error);
  process.exit(1);
});
