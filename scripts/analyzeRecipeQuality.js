/**
 * Analyze Recipe Quality Based on Ingredient Normalization
 * 
 * Identifies recipes with problematic ingredients:
 * - Unmatched/unknown ingredients
 * - Malformed ingredient strings
 * - Ultra-rare specialty items
 * 
 * Recommends which recipes to keep vs remove from catalog.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseIngredient } from '../src/utils/ingredientParsing.js';
import { matchIngredientEnhanced } from '../src/utils/ingredientMatcherEnhanced.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== RECIPE QUALITY ANALYSIS ===\n');

// Load catalog
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Analyzing', catalog.recipes.length, 'recipes...\n');

// Analyze each recipe
const analysis = catalog.recipes.map(recipe => {
  const ingredientResults = [];
  let totalIngredients = 0;
  let matched = 0;
  let compounds = 0;
  let unknown = 0;
  let malformed = 0;
  
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach(rawIng => {
      const rawText = typeof rawIng === 'string' ? rawIng : (rawIng.name || rawIng.ingredient || '');
      
      if (!rawText || rawText.trim().length < 2) {
        malformed++;
        totalIngredients++;
        ingredientResults.push({
          raw: rawText,
          status: 'malformed',
          issue: 'empty_or_too_short'
        });
        return;
      }
      
      totalIngredients++;
      
      // Parse and match
      const parsed = parseIngredient(rawText);
      const match = matchIngredientEnhanced(parsed.identityText, parsed.state);
      
      if (match.status === 'matched') {
        matched++;
        ingredientResults.push({
          raw: rawText,
          identity: parsed.identityText,
          status: 'matched',
          masterId: match.matches[0]?.masterId,
          confidence: match.matches[0]?.confidence
        });
      } else if (match.status === 'compound') {
        compounds++;
        ingredientResults.push({
          raw: rawText,
          identity: parsed.identityText,
          status: 'compound',
          components: match.matches.map(m => m.masterId)
        });
      } else if (match.status === 'partial_compound') {
        unknown++;
        ingredientResults.push({
          raw: rawText,
          identity: parsed.identityText,
          status: 'partial_compound',
          issue: 'some_components_unknown',
          matched: match.matches.filter(m => m.masterId).length,
          total: match.matches.length
        });
      } else {
        unknown++;
        ingredientResults.push({
          raw: rawText,
          identity: parsed.identityText,
          status: 'unknown',
          issue: 'no_match_found'
        });
      }
    });
  }
  
  // Calculate match rate for this recipe
  const matchRate = totalIngredients > 0 ? 
    ((matched + compounds) / totalIngredients * 100).toFixed(1) : 
    0;
  
  // Determine recipe quality
  let quality = 'excellent';
  let recommendation = 'keep';
  let reason = '';
  
  if (malformed > 0) {
    quality = 'poor';
    recommendation = 'review';
    reason = `${malformed} malformed ingredient(s)`;
  } else if (unknown >= 3) {
    quality = 'poor';
    recommendation = 'remove';
    reason = `${unknown} unknown ingredients (too many gaps)`;
  } else if (unknown >= 1 && totalIngredients <= 5) {
    quality = 'questionable';
    recommendation = 'review';
    reason = `${unknown} unknown in short recipe (high impact)`;
  } else if (unknown >= 1) {
    quality = 'good';
    recommendation = 'flag';
    reason = `${unknown} unknown ingredient(s) - flag for user`;
  } else if (parseFloat(matchRate) === 100) {
    quality = 'excellent';
    recommendation = 'keep';
    reason = '100% matched - production ready';
  }
  
  return {
    recipeId: recipe.recipeId,
    name: recipe.name,
    source: recipe.source || 'unknown',
    totalIngredients,
    matched,
    compounds,
    unknown,
    malformed,
    matchRate: parseFloat(matchRate),
    quality,
    recommendation,
    reason,
    problematicIngredients: ingredientResults.filter(i => 
      i.status === 'unknown' || i.status === 'malformed' || i.status === 'partial_compound'
    )
  };
});

// Generate statistics
const stats = {
  total: analysis.length,
  excellent: analysis.filter(r => r.quality === 'excellent').length,
  good: analysis.filter(r => r.quality === 'good').length,
  questionable: analysis.filter(r => r.quality === 'questionable').length,
  poor: analysis.filter(r => r.quality === 'poor').length,
  recommendations: {
    keep: analysis.filter(r => r.recommendation === 'keep').length,
    flag: analysis.filter(r => r.recommendation === 'flag').length,
    review: analysis.filter(r => r.recommendation === 'review').length,
    remove: analysis.filter(r => r.recommendation === 'remove').length
  }
};

console.log('=== QUALITY BREAKDOWN ===\n');
console.log('Total recipes:', stats.total);
console.log();
console.log('Quality tiers:');
console.log(`  Excellent (100% matched): ${stats.excellent} (${(stats.excellent / stats.total * 100).toFixed(1)}%)`);
console.log(`  Good (1-2 unknowns):      ${stats.good} (${(stats.good / stats.total * 100).toFixed(1)}%)`);
console.log(`  Questionable:             ${stats.questionable} (${(stats.questionable / stats.total * 100).toFixed(1)}%)`);
console.log(`  Poor (3+ unknowns):       ${stats.poor} (${(stats.poor / stats.total * 100).toFixed(1)}%)`);
console.log();

console.log('=== RECOMMENDATIONS ===\n');
console.log(`✅ KEEP (production ready):     ${stats.recommendations.keep} recipes`);
console.log(`⚠️  FLAG (minor issues):        ${stats.recommendations.flag} recipes`);
console.log(`🔍 REVIEW (needs attention):   ${stats.recommendations.review} recipes`);
console.log(`❌ REMOVE (too problematic):   ${stats.recommendations.remove} recipes`);
console.log();

// Show examples of each category
console.log('=== EXAMPLES BY CATEGORY ===\n');

const toRemove = analysis.filter(r => r.recommendation === 'remove').slice(0, 10);
if (toRemove.length > 0) {
  console.log('❌ RECOMMENDED FOR REMOVAL:');
  toRemove.forEach(r => {
    console.log(`   "${r.name}"`);
    console.log(`      Reason: ${r.reason}`);
    console.log(`      Unknown: ${r.problematicIngredients.map(i => i.identity || i.raw).join(', ')}`);
    console.log();
  });
}

const toReview = analysis.filter(r => r.recommendation === 'review').slice(0, 5);
if (toReview.length > 0) {
  console.log('🔍 NEEDS REVIEW:');
  toReview.forEach(r => {
    console.log(`   "${r.name}"`);
    console.log(`      Reason: ${r.reason}`);
    console.log(`      Issues: ${r.problematicIngredients.map(i => i.identity || i.raw).join(', ')}`);
    console.log();
  });
}

const toFlag = analysis.filter(r => r.recommendation === 'flag').slice(0, 5);
if (toFlag.length > 0) {
  console.log('⚠️  FLAG FOR USER NOTIFICATION:');
  toFlag.forEach(r => {
    console.log(`   "${r.name}"`);
    console.log(`      Reason: ${r.reason}`);
    console.log(`      Unknown: ${r.problematicIngredients.map(i => i.identity || i.raw).join(', ')}`);
    console.log();
  });
}

// Save detailed report
const reportPath = path.join(__dirname, '../tmp/recipe_quality_report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: stats,
  recipes: analysis
}, null, 2));

console.log('=== ANALYSIS COMPLETE ===');
console.log(`\nDetailed report: ${reportPath}`);
console.log();

// Impact summary
console.log('📊 IMPACT SUMMARY:');
console.log();
console.log('If we remove problematic recipes:');
console.log(`   Before: ${stats.total} recipes`);
console.log(`   After:  ${stats.recommendations.keep + stats.recommendations.flag} recipes (${((stats.recommendations.keep + stats.recommendations.flag) / stats.total * 100).toFixed(1)}%)`);
console.log(`   Removed: ${stats.recommendations.remove} recipes (${(stats.recommendations.remove / stats.total * 100).toFixed(1)}%)`);
console.log();
console.log('🎯 Catalog quality improvement:');
console.log(`   Match rate would improve from 89.4% to ${((stats.recommendations.keep + stats.recommendations.flag) / stats.total * 89.4 / (stats.recommendations.keep + stats.recommendations.flag + stats.recommendations.remove) * 100).toFixed(1)}%`);
