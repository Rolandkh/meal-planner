#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const batch1 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'test-output/batch-test-summary.json'), 'utf8'));
const batch2 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'test-output/recipes-50-59-results.json'), 'utf8'));
const batch3 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'test-output/recipes-100-109-results.json'), 'utf8'));

const all = [
  ...batch1.results.filter(r => !r.error),
  ...batch2,
  ...batch3
];

console.log('\n' + '='.repeat(80));
console.log('📊 FINAL COMPREHENSIVE ANALYSIS - 30 RECIPES');
console.log('='.repeat(80) + '\n');

// Cost analysis
const inRange1_10 = all.filter(r => r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 10);
const inRange2_8 = all.filter(r => r.calculatedCostPerServing >= 2 && r.calculatedCostPerServing <= 8);
const inRange1_15 = all.filter(r => r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 15);

const avgCost = all.reduce((sum, r) => sum + r.calculatedCostPerServing, 0) / all.length;
const medianCost = [...all].sort((a, b) => a.calculatedCostPerServing - b.calculatedCostPerServing)[Math.floor(all.length / 2)].calculatedCostPerServing;
const minCost = Math.min(...all.map(r => r.calculatedCostPerServing));
const maxCost = Math.max(...all.map(r => r.calculatedCostPerServing));

console.log('💰 COST ACCURACY:\n');
console.log(`  Excellent ($1-10):  ${inRange1_10.length}/30 (${(inRange1_10.length/30*100).toFixed(0)}%)`);
console.log(`  Good ($2-8):        ${inRange2_8.length}/30 (${(inRange2_8.length/30*100).toFixed(0)}%)`);
console.log(`  Acceptable ($1-15): ${inRange1_15.length}/30 (${(inRange1_15.length/30*100).toFixed(0)}%)`);
console.log(`\n  Average:  $${avgCost.toFixed(2)}/serving`);
console.log(`  Median:   $${medianCost.toFixed(2)}/serving`);
console.log(`  Range:    $${minCost.toFixed(2)} - $${maxCost.toFixed(2)}`);

// Nutrition analysis
const within5pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  return (diff / r.originalNutrition.calories) <= 0.05;
});

const within10pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  return (diff / r.originalNutrition.calories) <= 0.10;
});

const within20pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  return (diff / r.originalNutrition.calories) <= 0.20;
});

const within30pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  return (diff / r.originalNutrition.calories) <= 0.30;
});

console.log('\n🥗 NUTRITION ACCURACY:\n');
console.log(`  Excellent (±5%):  ${within5pct.length}/30 (${(within5pct.length/30*100).toFixed(0)}%)`);
console.log(`  Very Good (±10%): ${within10pct.length}/30 (${(within10pct.length/30*100).toFixed(0)}%)`);
console.log(`  Good (±20%):      ${within20pct.length}/30 (${(within20pct.length/30*100).toFixed(0)}%)`);
console.log(`  Acceptable (±30%): ${within30pct.length}/30 (${(within30pct.length/30*100).toFixed(0)}%)`);

// Category breakdown
console.log('\n\n📈 PERFORMANCE BY RECIPE TYPE:\n');

const costByRange = {
  'under_5': all.filter(r => r.calculatedCostPerServing < 5).length,
  '5_to_8': all.filter(r => r.calculatedCostPerServing >= 5 && r.calculatedCostPerServing <= 8).length,
  '8_to_15': all.filter(r => r.calculatedCostPerServing > 8 && r.calculatedCostPerServing <= 15).length,
  'over_15': all.filter(r => r.calculatedCostPerServing > 15).length
};

console.log('Cost Distribution:');
console.log(`  Under $5:    ${costByRange.under_5} recipes (${(costByRange.under_5/30*100).toFixed(0)}%)`);
console.log(`  $5-8:        ${costByRange['5_to_8']} recipes (${(costByRange['5_to_8']/30*100).toFixed(0)}%)`);
console.log(`  $8-15:       ${costByRange['8_to_15']} recipes (${(costByRange['8_to_15']/30*100).toFixed(0)}%)`);
console.log(`  Over $15:    ${costByRange.over_15} recipes (${(costByRange.over_15/30*100).toFixed(0)}%)`);

// Top/bottom performers
console.log('\n\n⭐ TOP 5 MOST ACCURATE (Nutrition):\n');
const nutritionSorted = all
  .filter(r => r.originalNutrition?.calories)
  .map(r => ({
    name: r.recipeName,
    calc: r.calculatedNutrition.calories,
    orig: r.originalNutrition.calories,
    diff: Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories) / r.originalNutrition.calories
  }))
  .sort((a, b) => a.diff - b.diff)
  .slice(0, 5);

nutritionSorted.forEach((r, i) => {
  const diffPct = (r.diff * 100).toFixed(1);
  console.log(`  ${i + 1}. ${r.name.substring(0, 45).padEnd(45)} | ±${diffPct}%`);
});

console.log('\n\n⚠️  OUTLIERS STILL NEEDING ATTENTION:\n');

const costOutliers = all.filter(r => r.calculatedCostPerServing > 15 || r.calculatedCostPerServing < 1);
const nutritionOutliers = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  return (diff / r.originalNutrition.calories) > 0.30;
});

if (costOutliers.length > 0) {
  console.log(`Cost Outliers (${costOutliers.length}):`);
  costOutliers.forEach(r => {
    console.log(`  • $${r.calculatedCostPerServing.toFixed(2)} - ${r.recipeName.substring(0, 50)}`);
  });
}

if (nutritionOutliers.length > 0) {
  console.log(`\nNutrition Outliers (${nutritionOutliers.length}):`);
  nutritionOutliers.forEach(r => {
    const diff = ((r.calculatedNutrition.calories - r.originalNutrition.calories) / r.originalNutrition.calories * 100).toFixed(0);
    console.log(`  • ${diff > 0 ? '+' : ''}${diff}% - ${r.recipeName.substring(0, 50)}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('✅ Analysis Complete');
console.log('='.repeat(80) + '\n');
