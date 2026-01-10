/**
 * Research Pricing for ALL Remaining Ingredients
 * Uses AI to estimate Melbourne supermarket prices for complete coverage
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

/**
 * Research Melbourne pricing for an ingredient
 */
async function researchPrice(ingredientName, state, canonicalUnit) {
  const prompt = 'Estimate typical Melbourne, Australia supermarket price (Coles/Woolworths) for: "' + ingredientName + '" (state: ' + state + ', unit: ' + canonicalUnit + ')\n\nReturn ONLY a JSON object (no markdown, no explanation):\n{\n  "averagePrice": <number in AUD>,\n  "unit": "<kg, L, pack, bunch, jar, can, bottle, or box>",\n  "unitSize": "<like 1kg, 500g, 1L, 250ml>",\n  "typicalWeight": <grams if not kg/L>,\n  "notes": "<brief note>"\n}\n\nBe realistic. If uncertain, estimate conservatively based on similar items.';
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
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

/**
 * Main research process
 */
async function researchAllPricing() {
  console.log('\n💰 Researching ALL Remaining Ingredient Pricing');
  console.log('================================================\n');
  
  const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
  const allIngredients = Object.values(masterData.ingredients);
  
  const needsPricing = allIngredients.filter(i => !i.pricing);
  
  console.log('Total ingredients: ' + allIngredients.length);
  console.log('Missing pricing: ' + needsPricing.length);
  console.log('');
  console.log('⏱️  Estimated time: ~' + Math.round(needsPricing.length * 0.8 / 60) + ' minutes');
  console.log('💳 API calls: ' + needsPricing.length + ' (within paid tier limit)');
  console.log('');
  
  const stats = {
    total: needsPricing.length,
    success: 0,
    failed: 0,
    failedList: []
  };
  
  for (let i = 0; i < needsPricing.length; i++) {
    const ing = needsPricing[i];
    
    if (i % 50 === 0 || i === 0) {
      console.log('\n[' + (i + 1) + '/' + needsPricing.length + '] Progress: ' + Math.round((i / needsPricing.length) * 100) + '%');
    }
    
    console.log('  ' + ing.displayName + '...');
    
    const pricing = await researchPrice(ing.displayName, ing.state, ing.canonicalUnit);
    
    if (pricing) {
      masterData.ingredients[ing.id].pricing = {
        averagePrice: pricing.averagePrice,
        unit: pricing.unit,
        unitSize: pricing.unitSize,
        typicalWeight: pricing.typicalWeight || null,
        typicalWeightUnit: pricing.typicalWeight ? 'g' : null,
        currency: "AUD",
        region: "Melbourne, VIC, Australia",
        lastUpdated: new Date().toISOString().split('T')[0],
        source: "ai_research",
        notes: pricing.notes || "AI-estimated Melbourne price"
      };
      
      // Calculate pricePerKg if we have weight
      if (pricing.typicalWeight && pricing.unit !== 'kg' && pricing.unit !== 'L') {
        const pricePerKg = (pricing.averagePrice / pricing.typicalWeight) * 1000;
        masterData.ingredients[ing.id].pricing.pricePerKg = Math.round(pricePerKg * 100) / 100;
      } else if (pricing.unit === 'kg') {
        masterData.ingredients[ing.id].pricing.pricePerKg = pricing.averagePrice;
      } else if (pricing.unit === 'L') {
        masterData.ingredients[ing.id].pricing.pricePerL = pricing.averagePrice;
      }
      
      stats.success++;
      console.log('    ✅ $' + pricing.averagePrice + '/' + pricing.unit);
    } else {
      stats.failed++;
      stats.failedList.push(ing.displayName);
      console.log('    ⚠️  Failed');
    }
    
    // Rate limiting (800ms = 75 requests/min)
    if (i < needsPricing.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Save progress every 100 items
    if ((i + 1) % 100 === 0) {
      masterData._lastUpdated = new Date().toISOString();
      fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
      console.log('\n💾 Progress saved (' + (i + 1) + '/' + needsPricing.length + ')\n');
    }
  }
  
  // Final save
  masterData._lastUpdated = new Date().toISOString();
  fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║              🎊 PRICING RESEARCH COMPLETE! 🎊                  ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Research Summary:');
  console.log('  Total researched: ' + stats.total);
  console.log('  ✅ Success: ' + stats.success + ' (' + Math.round(stats.success/stats.total*100) + '%)');
  console.log('  ❌ Failed: ' + stats.failed);
  console.log('');
  
  const final = Object.values(masterData.ingredients);
  const withPricing = final.filter(i => i.pricing).length;
  const coverage = Math.round(withPricing / final.length * 100);
  
  console.log('📈 Final Coverage:');
  console.log('  Ingredients with pricing: ' + withPricing + '/' + final.length + ' (' + coverage + '%)');
  console.log('');
  
  if (coverage >= 95) {
    console.log('🎉 COMPLETE: ' + coverage + '% coverage achieved!');
  }
  console.log('');
  
  // Save failed list
  if (stats.failedList.length > 0) {
    fs.writeFileSync(
      path.join(__dirname, '../tmp/pricing-research-failed.json'),
      JSON.stringify(stats.failedList, null, 2)
    );
    console.log('📄 Failed items saved to tmp/pricing-research-failed.json\n');
  }
}

researchAllPricing().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
