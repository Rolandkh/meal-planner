/**
 * Evaluate Normalization Improvements
 * 
 * Re-runs normalization across catalog with enhanced features:
 * - Updated dictionary (598 entries)
 * - Compound splitting
 * - Pattern matching
 * - Fallback handling
 * 
 * Compares against baseline (87.5% match rate)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { matchIngredientEnhanced } from '../src/utils/ingredientMatcherEnhanced.js';
import { parseIngredient } from '../src/utils/ingredientParsing.js';
import { splitCompoundIngredient } from '../src/utils/ingredientCompoundSplit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== NORMALIZATION IMPROVEMENT EVALUATION ===\n');

// Load catalog
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Catalog loaded:', catalog.recipes.length, 'recipes');
console.log();

// Collect all ingredients
const allIngredients = [];
catalog.recipes.forEach(recipe => {
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach(rawIng => {
      const rawText = typeof rawIng === 'string' ? rawIng : (rawIng.name || rawIng.ingredient || '');
      if (rawText) {
        allIngredients.push({
          rawText,
          recipeName: recipe.name
        });
      }
    });
  }
});

console.log('Total ingredients:', allIngredients.length);
console.log();

// Parse and match all ingredients with enhanced matcher
console.log('Processing ingredients with enhanced matching...\n');

const results = [];
let matched = 0;
let compoundFull = 0;
let compoundPartial = 0;
let unknown = 0;

allIngredients.forEach((item, index) => {
  if (index % 500 === 0 && index > 0) {
    console.log(`  Processed ${index}/${allIngredients.length}...`);
  }
  
  // Parse ingredient
  const parsed = parseIngredient(item.rawText);
  
  // Enhanced matching
  const match = matchIngredientEnhanced(parsed.identityText, parsed.state);
  
  // Track statistics
  if (match.status === 'matched') {
    matched++;
  } else if (match.status === 'compound') {
    compoundFull++;
  } else if (match.status === 'partial_compound') {
    compoundPartial++;
  } else {
    unknown++;
  }
  
  results.push({
    raw: item.rawText,
    recipe: item.recipeName,
    identityText: parsed.identityText,
    state: parsed.state,
    status: match.status,
    matches: match.matches,
    connectorType: match.connectorType
  });
});

console.log('  Complete!\n');

// Calculate statistics
const totalProcessed = results.length;
const totalMatched = matched + compoundFull;
const matchRate = (totalMatched / totalProcessed * 100).toFixed(1);

console.log('=== RESULTS ===\n');
console.log('Total ingredients:', totalProcessed);
console.log();
console.log('Status breakdown:');
console.log(`  Simple matched: ${matched} (${(matched / totalProcessed * 100).toFixed(1)}%)`);
console.log(`  Compound (full): ${compoundFull} (${(compoundFull / totalProcessed * 100).toFixed(1)}%)`);
console.log(`  Compound (partial): ${compoundPartial} (${(compoundPartial / totalProcessed * 100).toFixed(1)}%)`);
console.log(`  Unknown: ${unknown} (${(unknown / totalProcessed * 100).toFixed(1)}%)`);
console.log();
console.log(`✅ TOTAL MATCH RATE: ${matchRate}%`);
console.log();

// Compare with baseline
const baselineRate = 87.5;
const improvement = parseFloat(matchRate) - baselineRate;

console.log('=== COMPARISON WITH BASELINE ===\n');
console.log(`Baseline: 87.5% (6,287/7,183)`);
console.log(`Enhanced: ${matchRate}% (${totalMatched}/${totalProcessed})`);
console.log(`Improvement: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%`);
console.log();

// Target assessment
const targetMin = 95.0;
const targetMax = 98.0;

if (parseFloat(matchRate) >= targetMin) {
  console.log(`🎯 TARGET ACHIEVED! (≥${targetMin}%)`);
} else {
  const gap = targetMin - parseFloat(matchRate);
  console.log(`⚠️  Gap to target: ${gap.toFixed(1)}% (need ${Math.ceil(gap / 100 * totalProcessed)} more matches)`);
}
console.log();

// Analyze unmatched
const unknownResults = results.filter(r => r.status === 'unknown');
const partialResults = results.filter(r => r.status === 'partial_compound');

console.log('=== UNMATCHED ANALYSIS ===\n');
console.log(`Unknown ingredients: ${unknownResults.length}`);
console.log(`Partial compounds: ${partialResults.length}`);
console.log();

// Count unique unmatched identities
const uniqueUnknown = new Map();
unknownResults.forEach(r => {
  const key = `${r.identityText}|${r.state}`;
  if (!uniqueUnknown.has(key)) {
    uniqueUnknown.set(key, { count: 0, examples: [] });
  }
  const entry = uniqueUnknown.get(key);
  entry.count++;
  if (entry.examples.length < 2) {
    entry.examples.push(r.recipe);
  }
});

// Sort by frequency
const sortedUnknown = Array.from(uniqueUnknown.entries())
  .map(([key, data]) => {
    const [identity, state] = key.split('|');
    return { identity, state, ...data };
  })
  .sort((a, b) => b.count - a.count);

console.log('Top 20 remaining unmatched:');
sortedUnknown.slice(0, 20).forEach((item, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${item.identity.padEnd(40)} - ${item.count}× (${item.state})`);
});
console.log();

// Compound impact
console.log('=== COMPOUND SPLITTING IMPACT ===\n');
const compoundCount = compoundFull + compoundPartial;
console.log(`Total compounds detected: ${compoundCount}`);
console.log(`  Fully matched: ${compoundFull} (${(compoundFull / compoundCount * 100).toFixed(1)}%)`);
console.log(`  Partially matched: ${compoundPartial} (${(compoundPartial / compoundCount * 100).toFixed(1)}%)`);
console.log();

// Example compounds
const exampleCompounds = results.filter(r => r.status === 'compound').slice(0, 5);
if (exampleCompounds.length > 0) {
  console.log('Example compound splits:');
  exampleCompounds.forEach(ex => {
    console.log(`  "${ex.identityText}" →`);
    ex.matches.forEach(m => {
      console.log(`    - "${m.componentText}" → ${m.masterId || 'unknown'} (${m.confidence.toFixed(2)})`);
    });
  });
  console.log();
}

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalIngredients: totalProcessed,
    matched: totalMatched,
    matchRate: matchRate + '%',
    baselineRate: baselineRate + '%',
    improvement: improvement.toFixed(1) + '%',
    targetAchieved: parseFloat(matchRate) >= targetMin
  },
  breakdown: {
    simpleMatched: matched,
    compoundFull: compoundFull,
    compoundPartial: compoundPartial,
    unknown: unknown
  },
  compoundImpact: {
    totalDetected: compoundCount,
    fullyMatched: compoundFull,
    partiallyMatched: compoundPartial
  },
  remainingUnmatched: sortedUnknown.slice(0, 100).map(u => ({
    identity: u.identity,
    state: u.state,
    count: u.count,
    examples: u.examples
  }))
};

const reportPath = path.join(__dirname, '../tmp/normalization_evaluation_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('=== EVALUATION COMPLETE ===');
console.log(`\nDetailed report saved to: ${reportPath}`);
console.log();

// Summary
console.log('📊 FINAL ASSESSMENT:');
console.log(`   Match Rate: ${matchRate}% (was 87.5%)`);
console.log(`   Improvement: +${improvement.toFixed(1)}%`);
console.log(`   Dictionary: 598 entries (was 584)`);
console.log(`   Compounds: ${compoundCount} detected`);
console.log(`   Status: ${parseFloat(matchRate) >= targetMin ? '🎯 Target Achieved!' : '⚠️  More work needed'}`);
