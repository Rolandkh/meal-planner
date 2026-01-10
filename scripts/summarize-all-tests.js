#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const batch1 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'test-output/batch-test-summary.json'), 'utf8'));
const batch2 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'test-output/recipes-50-59-results.json'), 'utf8'));

const all = [...batch1.results.filter(r => !r.error), ...batch2];

console.log('\n📊 COMBINED RESULTS (20 Recipes)\n');
console.log('='.repeat(80));

// Cost analysis
const inRange1_10 = all.filter(r => r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 10);
const inRange2_8 = all.filter(r => r.calculatedCostPerServing >= 2 && r.calculatedCostPerServing <= 8);
const avgCost = all.reduce((sum, r) => sum + r.calculatedCostPerServing, 0) / all.length;
const minCost = Math.min(...all.map(r => r.calculatedCostPerServing));
const maxCost = Math.max(...all.map(r => r.calculatedCostPerServing));

console.log('\n💰 COST ACCURACY:');
console.log(`  In Range ($1-10): ${inRange1_10.length}/${all.length} (${(inRange1_10.length/all.length*100).toFixed(0)}%)`);
console.log(`  In Range ($2-8): ${inRange2_8.length}/${all.length} (${(inRange2_8.length/all.length*100).toFixed(0)}%)`);
console.log(`  Average: $${avgCost.toFixed(2)}/serving`);
console.log(`  Range: $${minCost.toFixed(2)} - $${maxCost.toFixed(2)}`);

// Nutrition analysis
const within10pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  const percent = diff / r.originalNutrition.calories;
  return percent <= 0.10;
});

const within20pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  const percent = diff / r.originalNutrition.calories;
  return percent <= 0.20;
});

const within30pct = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  const percent = diff / r.originalNutrition.calories;
  return percent <= 0.30;
});

console.log('\n🥗 NUTRITION ACCURACY:');
console.log(`  Within ±10%: ${within10pct.length}/${all.length} (${(within10pct.length/all.length*100).toFixed(0)}%)`);
console.log(`  Within ±20%: ${within20pct.length}/${all.length} (${(within20pct.length/all.length*100).toFixed(0)}%)`);
console.log(`  Within ±30%: ${within30pct.length}/${all.length} (${(within30pct.length/all.length*100).toFixed(0)}%)`);

// Outliers
console.log('\n\n⚠️  OUTLIERS:\n');

const costOutliers = all.filter(r => r.calculatedCostPerServing > 10 || r.calculatedCostPerServing < 1);
if (costOutliers.length > 0) {
  console.log('Cost Outliers:');
  costOutliers.forEach(r => {
    console.log(`  • $${r.calculatedCostPerServing.toFixed(2)}/serving - ${r.recipeName} (${r.servings} servings)`);
  });
}

const nutritionOutliers = all.filter(r => {
  if (!r.originalNutrition?.calories) return false;
  const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
  const percent = diff / r.originalNutrition.calories;
  return percent > 0.30;
});

if (nutritionOutliers.length > 0) {
  console.log('\nNutrition Outliers (>±30%):');
  nutritionOutliers.forEach(r => {
    const diff = ((r.calculatedNutrition.calories - r.originalNutrition.calories) / r.originalNutrition.calories * 100).toFixed(0);
    console.log(`  • ${diff > 0 ? '+' : ''}${diff}% - ${r.recipeName}`);
    console.log(`    Calc: ${r.calculatedNutrition.calories.toFixed(0)} cal | Orig: ${r.originalNutrition.calories.toFixed(0)} cal`);
  });
}

console.log('\n' + '='.repeat(80) + '\n');
