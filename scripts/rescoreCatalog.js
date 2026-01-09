#!/usr/bin/env node
/**
 * Re-score all recipes in the catalog with updated Diet Compass scoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');

// Import scoring functions (need to mock localStorage for Node)
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  }
};

// Load ingredient health data into mock localStorage
const healthDataPath = path.join(__dirname, '../src/data/ingredientHealthData.json');
const healthData = JSON.parse(fs.readFileSync(healthDataPath, 'utf8'));
global.localStorage.setItem('vanessa_ingredient_health', JSON.stringify(healthData));

// Now we can import the scoring module
const { calculateRecipeScores } = await import('../src/utils/dietCompassScoring.js');

console.log('📊 Re-scoring catalog recipes...\n');

// Load catalog
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const recipes = catalogData.recipes || [];

console.log(`Total recipes to score: ${recipes.length}\n`);

let scoredCount = 0;
let unchangedCount = 0;
let improvedCount = 0;

// Score each recipe
recipes.forEach((recipe, index) => {
  const oldScore = recipe.dietCompassScores?.overall || null;
  const newScores = calculateRecipeScores(recipe);
  
  recipe.dietCompassScores = newScores;
  
  if (newScores.overall !== null) {
    scoredCount++;
    
    if (oldScore !== null && newScores.overall > oldScore) {
      improvedCount++;
    }
    
    if (index < 5) {
      console.log(`${index + 1}. ${recipe.name}`);
      console.log(`   Old: ${oldScore} → New: ${newScores.overall}`);
      console.log(`   Metrics: ND=${newScores.nutrientDensity}, AA=${newScores.antiAging}, WL=${newScores.weightLoss}, HH=${newScores.heartHealth}`);
      console.log();
    }
  } else {
    unchangedCount++;
  }
  
  // Progress indicator every 100 recipes
  if ((index + 1) % 100 === 0) {
    console.log(`Progress: ${index + 1}/${recipes.length} recipes processed...`);
  }
});

// Calculate score distribution
const scoreRanges = {
  '80-100 (Excellent)': 0,
  '60-79 (Good)': 0,
  '40-59 (Moderate)': 0,
  '20-39 (Fair)': 0,
  '0-19 (Poor)': 0,
  'Null (No Data)': 0
};

recipes.forEach(recipe => {
  const score = recipe.dietCompassScores?.overall;
  if (score === null || score === undefined) {
    scoreRanges['Null (No Data)']++;
  } else if (score >= 80) {
    scoreRanges['80-100 (Excellent)']++;
  } else if (score >= 60) {
    scoreRanges['60-79 (Good)']++;
  } else if (score >= 40) {
    scoreRanges['40-59 (Moderate)']++;
  } else if (score >= 20) {
    scoreRanges['20-39 (Fair)']++;
  } else {
    scoreRanges['0-19 (Poor)']++;
  }
});

// Update catalog metadata
catalogData._lastUpdated = new Date().toISOString();
catalogData._extraction.lastScored = new Date().toISOString();

// Save updated catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2));

// Report
console.log('\n' + '='.repeat(60));
console.log('✅ RE-SCORING COMPLETE');
console.log('='.repeat(60));
console.log(`Total recipes: ${recipes.length}`);
console.log(`Successfully scored: ${scoredCount}`);
console.log(`Improved scores: ${improvedCount}`);
console.log(`Unchanged (no data): ${unchangedCount}`);
console.log('\nScore Distribution:');
Object.entries(scoreRanges).forEach(([range, count]) => {
  const percentage = ((count / recipes.length) * 100).toFixed(1);
  console.log(`  ${range}: ${count} (${percentage}%)`);
});
console.log('\n📁 Catalog saved to:', catalogPath);
console.log('\n🎉 Done! Please restart the app to see updated scores.');
