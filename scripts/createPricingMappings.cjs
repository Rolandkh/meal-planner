/**
 * Create manual ID mappings for unmatched pricing entries
 * Analyzes unmatched items and suggests or creates mappings
 */

const fs = require('fs');
const path = require('path');

// Manual mappings for common mismatches
const MANUAL_MAPPINGS = {
  "Potato (brushed/washed)": "potato",
  "Beetroot (loose)": "beetroot",
  "Berry mix (frozen)": "berries_mixed_frozen",
  "Kiwifruit (green)": "kiwifruit_green",
  "Grapes (red or green)": "grapes",
  "Pear (Packham/Bosc)": "pear",
  "Grapefruit (pink)": "grapefruit_pink",
  "Sardines (canned, in oil)": "sardines_canned",
  "Calamari (fresh rings)": "calamari_rings",
  "Fish fingers (frozen, crumbed)": "fish_fingers",
  "Ham (leg, sliced deli)": "ham",
  "Natural/plain yoghurt": "yoghurt_natural_full_fat",
  "Noodles (egg, fresh)": "egg_noodles",
  "Beetroot (canned)": "beetroot_canned_sliced",
  "Cloves (ground)": "cloves_ground",
  "Frozen berries (mixed)": "berries_mixed_frozen",
  "Coffee (instant)": "coffee_instant",
  "Coffee (ground)": "coffee_ground",
  "Tea (black, box)": "tea_black",
  "Tea (green, box)": "tea_green",
  "Herbal tea (chamomile)": "tea",
  "Gelatin (powder)": "gelatine_powder",
  "Masala paste (Panang)": "curry_paste_panang",
  "Ponzu sauce": "soy_sauce",
  "Wok oil": "vegetable_oil",
  "Currants (dried)": "currants_dried",
  "Dates (Medjool, pitted)": "dates_medjool",
  "Goji berries (dried)": "raisins",
  "Coffee (instant, decaf)": "coffee_instant",
  "Espresso powder": "coffee_ground",
  // Add more mappings as needed
};

// Read report
const reportPath = path.join(__dirname, '../tmp/pricing-integration-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('\n🔍 Analyzing Unmatched Pricing Entries');
console.log('======================================\n');
console.log(`Total unmatched: ${report.unmatched.length}\n`);

// Load catalog
const masterPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

// Generate mapping suggestions
const suggestions = [];
for (const item of report.unmatched) {
  const manual = MANUAL_MAPPINGS[item.name];
  
  if (manual && masterData.ingredients[manual]) {
    suggestions.push({
      name: item.name,
      num: item.num,
      suggestedId: manual,
      found: true
    });
  } else {
    suggestions.push({
      name: item.name,
      num: item.num,
      suggestedId: null,
      found: false
    });
  }
}

const canMap = suggestions.filter(s => s.found).length;
const needsWork = suggestions.filter(s => !s.found).length;

console.log(`📊 Analysis:`);
console.log(`   Can be mapped: ${canMap}`);
console.log(`   Need manual review: ${needsWork}\n`);

// Save mapping file
const mappingPath = path.join(__dirname, '../references/pricing-id-mappings.json');
fs.writeFileSync(mappingPath, JSON.stringify({
  _description: "Manual ID mappings for pricing entries that don't auto-match",
  _totalMappings: Object.keys(MANUAL_MAPPINGS).length,
  mappings: MANUAL_MAPPINGS,
  suggestions: suggestions
}, null, 2));

console.log(`✅ Mapping file saved: ${mappingPath}\n`);
console.log(`💡 To apply these mappings, add them to parsePricingMarkdown.cjs\n`);

// Show needsWork items
if (needsWork > 0 && needsWork <= 30) {
  console.log(`⚠️  Items needing manual review:`);
  suggestions.filter(s => !s.found).forEach(s => {
    console.log(`   ${s.num}. ${s.name}`);
  });
}
