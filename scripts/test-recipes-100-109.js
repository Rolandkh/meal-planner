#!/usr/bin/env node

/**
 * Test recipes 100-109 for final validation
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
  log('\n🧪 Testing NEW Recipes 100-109 (Final Validation)\n', 'bright');
  
  const processMaster = loadJSON('src/data/processMaster.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  const results = [];
  let errorCount = 0;
  
  for (let index = 100; index < 110; index++) {
    const recipe = recipeCatalog.recipes[index];
    if (!recipe) {
      log(`${index - 99}/10: Recipe ${index} not found, skipping`, 'yellow');
      continue;
    }
    
    log(`${index - 99}/10: "${recipe.name}"`, 'cyan');
    log(`     Servings: ${recipe.servings} | Ingredients: ${recipe.ingredients.length}`, 'cyan');
    
    try {
      const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
      if (!parseResult.success) {
        log(`     ❌ Parse failed\n`, 'red');
        errorCount++;
        continue;
      }
      
      const componentResult = generateComponents(
        parseResult.data,
        recipe,
        processMaster,
        ingredientMaster
      );
      
      const cost = componentResult.recipeMetrics.costPerServing;
      const calcCal = componentResult.recipeMetrics.nutritionPerServing.calories;
      const origCal = recipe.nutrition?.calories || 0;
      
      const result = {
        index,
        recipeName: recipe.name,
        servings: recipe.servings,
        calculatedCostPerServing: cost,
        calculatedNutrition: componentResult.recipeMetrics.nutritionPerServing,
        originalNutrition: recipe.nutrition,
        components: componentResult.components.length,
        reusable: componentResult.recipeMetrics.reusableComponents.length
      };
      
      results.push(result);
      
      const costColor = (cost >= 1 && cost <= 10) ? 'green' : 'yellow';
      const calDiff = origCal > 0 ? ((calcCal - origCal) / origCal * 100).toFixed(0) : 'N/A';
      const calColor = origCal > 0 && Math.abs(parseFloat(calDiff)) <= 20 ? 'green' : 'yellow';
      
      log(`     ✓ $${cost.toFixed(2)}/serving | ${calcCal.toFixed(0)} cal (${calDiff > 0 ? '+' : ''}${calDiff}%)`, costColor);
      log('', 'reset');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      log(`     ❌ Error: ${error.message}\n`, 'red');
      errorCount++;
    }
  }
  
  // Analysis
  log('\n📊 Final Validation Results\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  const inRange = results.filter(r => r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 10);
  const nutritionGood = results.filter(r => {
    if (!r.originalNutrition?.calories) return false;
    const diff = Math.abs(r.calculatedNutrition.calories - r.originalNutrition.calories);
    return (diff / r.originalNutrition.calories) <= 0.20;
  });
  
  log(`\n✅ Successful: ${results.length}/${10 - errorCount + results.length}`, 'green');
  log(`💰 Cost in Range: ${inRange.length}/${results.length} (${(inRange.length/results.length*100).toFixed(0)}%)`, 'green');
  log(`🥗 Nutrition ±20%: ${nutritionGood.length}/${results.length} (${(nutritionGood.length/results.length*100).toFixed(0)}%)`, 'green');
  
  const avgCost = results.reduce((sum, r) => sum + r.calculatedCostPerServing, 0) / results.length;
  log(`\nAverage Cost: $${avgCost.toFixed(2)}/serving`, 'cyan');
  
  log('\n📋 Cost Distribution:\n', 'yellow');
  results.sort((a, b) => a.calculatedCostPerServing - b.calculatedCostPerServing);
  results.forEach((r, i) => {
    const inRange = r.calculatedCostPerServing >= 1 && r.calculatedCostPerServing <= 10;
    log(`  ${i + 1}. $${r.calculatedCostPerServing.toFixed(2)} - ${r.recipeName.substring(0, 50)}`, inRange ? 'green' : 'yellow');
  });
  
  const outputFile = path.join(projectRoot, 'test-output', 'recipes-100-109-results.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  log(`\n💾 Results saved to: ${outputFile}\n`, 'green');
}

testRecipes().catch(console.error);
