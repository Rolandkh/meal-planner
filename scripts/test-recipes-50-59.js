#!/usr/bin/env node

/**
 * Test recipes 50-59 for validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseRecipeProcesses } from '../src/utils/processParser.js';
import { generateComponents } from '../src/utils/componentGenerator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

async function testRecipes() {
  log('\n🧪 Testing Recipes 50-59\n', 'bright');
  
  const processMaster = loadJSON('src/data/processMaster.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  const results = [];
  
  for (let index = 50; index < 60; index++) {
    const recipe = recipeCatalog.recipes[index];
    if (!recipe) continue;
    
    log(`${index - 49}/10: "${recipe.name}"`, 'cyan');
    log(`     Servings: ${recipe.servings} | Ingredients: ${recipe.ingredients.length}`, 'cyan');
    
    try {
      const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
      if (!parseResult.success) {
        log(`     ❌ Parse failed\n`, 'red');
        continue;
      }
      
      const componentResult = generateComponents(
        parseResult.data,
        recipe,
        processMaster,
        ingredientMaster
      );
      
      const result = {
        index,
        recipeName: recipe.name,
        servings: recipe.servings,
        calculatedCostPerServing: componentResult.recipeMetrics.costPerServing,
        calculatedNutrition: componentResult.recipeMetrics.nutritionPerServing,
        originalNutrition: recipe.nutrition
      };
      
      results.push(result);
      
      log(`     ✓ $${result.calculatedCostPerServing.toFixed(2)}/serving | ${result.calculatedNutrition.calories.toFixed(0)} cal`, 'green');
      log('', 'reset');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      log(`     ❌ Error: ${error.message}\n`, 'red');
    }
  }
  
  // Summary
  log('\n📊 Results Summary\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  const costsInRange = results.filter(r => r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 10);
  const nutritionAccurate = results.filter(r => {
    if (!r.originalNutrition?.calories) return false;
    const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
    const percent = diff / r.originalNutrition.calories;
    return percent <= 0.30; // Within 30%
  });
  
  log(`\n💰 Cost Accuracy: ${costsInRange.length}/${results.length} in $1-10 range`, 'green');
  log(`🥗 Nutrition Accuracy: ${nutritionAccurate.length}/${results.length} within ±30%\n`, 'green');
  
  log('Cost Distribution:', 'yellow');
  results.sort((a, b) => a.calculatedCostPerServing - b.calculatedCostPerServing);
  results.forEach((r, i) => {
    const inRange = r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 10;
    log(`  ${i + 1}. $${r.calculatedCostPerServing.toFixed(2)} - ${r.recipeName.substring(0, 50)}`, inRange ? 'green' : 'yellow');
  });
  
  const avgCost = results.reduce((sum, r) => sum + r.calculatedCostPerServing, 0) / results.length;
  log(`\nAverage: $${avgCost.toFixed(2)}/serving`, 'cyan');
  
  const outputFile = path.join(projectRoot, 'test-output', 'recipes-50-59-results.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  log(`\n💾 Results saved to: ${outputFile}\n`, 'green');
}

testRecipes().catch(console.error);
