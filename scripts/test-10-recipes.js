#!/usr/bin/env node

/**
 * Batch test Component Generator with 10 diverse recipes
 * Analyzes patterns to identify calculation issues
 * 
 * Usage: node scripts/test-10-recipes.js
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

async function testMultipleRecipes() {
  log('\n🧪 Testing Component Generator with 10 Diverse Recipes\n', 'bright');
  
  // Load data
  log('📚 Loading data files...', 'cyan');
  const processMaster = loadJSON('src/data/processMaster.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  
  log(`✓ Loaded ${Object.keys(processMaster.processes).length} processes`, 'green');
  log(`✓ Loaded ${Object.keys(ingredientMaster.ingredients).length} ingredients`, 'green');
  log(`✓ Loaded ${recipeCatalog.recipes.length} recipes\n`, 'green');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('❌ ANTHROPIC_API_KEY not found', 'red');
    process.exit(1);
  }
  
  // Select 10 diverse recipes
  const testRecipes = [
    { index: 0, type: 'Simple grain bowl' },
    { index: 5, type: 'Medium complexity' },
    { index: 9, type: 'Complex (Lasagna)' },
    { index: 15, type: 'Different cuisine' },
    { index: 20, type: 'Quick meal' },
    { index: 25, type: 'Salad/No-cook' },
    { index: 30, type: 'Baking' },
    { index: 35, type: 'Slow cook' },
    { index: 40, type: 'Stir fry' },
    { index: 45, type: 'Soup/Stew' }
  ];
  
  const results = [];
  
  log('📊 Testing Recipes:\n', 'bright');
  
  for (let i = 0; i < testRecipes.length; i++) {
    const { index, type } = testRecipes[i];
    const recipe = recipeCatalog.recipes[index];
    
    if (!recipe) {
      log(`⚠️  Recipe ${index} not found, skipping`, 'yellow');
      continue;
    }
    
    log(`${i + 1}/10: "${recipe.name}"`, 'cyan');
    log(`     Type: ${type} | Servings: ${recipe.servings} | Ingredients: ${recipe.ingredients.length}`, 'cyan');
    
    try {
      // Parse processes
      log(`     ⏳ Parsing...`, 'yellow');
      const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
      
      if (!parseResult.success) {
        log(`     ❌ Parse failed: ${parseResult.error}\n`, 'red');
        results.push({ index, recipe, error: parseResult.error, stage: 'parse' });
        continue;
      }
      
      // Generate components
      const componentResult = generateComponents(
        parseResult.data,
        recipe,
        processMaster,
        ingredientMaster
      );
      
      // Collect metrics
      const result = {
        index,
        recipeName: recipe.name,
        recipeType: type,
        servings: recipe.servings,
        ingredientCount: recipe.ingredients.length,
        
        // Parsed data
        stepsFound: parseResult.data.processSteps.length,
        processesFound: parseResult.validation.stats.totalProcesses,
        uniqueProcesses: parseResult.validation.stats.uniqueProcesses,
        
        // Components
        componentsGenerated: componentResult.components.length,
        reusableComponents: componentResult.recipeMetrics.reusableComponents.length,
        
        // Calculated metrics
        calculatedCost: componentResult.recipeMetrics.totalCost,
        calculatedCostPerServing: componentResult.recipeMetrics.costPerServing,
        calculatedTime: componentResult.recipeMetrics.totalPrepTime,
        calculatedNutrition: componentResult.recipeMetrics.nutritionPerServing,
        
        // Original data (for comparison)
        originalTime: recipe.prepTime + recipe.cookTime,
        originalNutrition: recipe.nutrition,
        
        // Errors
        errors: componentResult.errors
      };
      
      results.push(result);
      
      log(`     ✓ ${result.componentsGenerated} components | ${result.uniqueProcesses} processes | $${result.calculatedCostPerServing.toFixed(2)}/serving`, 'green');
      log('', 'reset');
      
      // Delay between API calls
      if (i < testRecipes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
    } catch (error) {
      log(`     ❌ Error: ${error.message}\n`, 'red');
      results.push({ index, recipe, error: error.message, stage: 'component' });
    }
  }
  
  // Analysis
  log('\n📊 Batch Test Results\n', 'bright');
  log('═'.repeat(80), 'cyan');
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  log(`\n✅ Successful: ${successful.length}/${results.length}`, 'green');
  if (failed.length > 0) {
    log(`❌ Failed: ${failed.length}/${results.length}\n`, 'red');
    failed.forEach(f => {
      log(`   • Recipe ${f.index}: ${f.error} (${f.stage})`, 'red');
    });
  }
  
  if (successful.length === 0) {
    log('\n❌ No successful tests to analyze\n', 'red');
    process.exit(1);
  }
  
  // Cost analysis
  log('\n\n💰 Cost Analysis:\n', 'bright');
  log('─'.repeat(80), 'cyan');
  
  const costData = successful.map(r => ({
    name: r.recipeName.substring(0, 40),
    costPerServing: r.calculatedCostPerServing,
    servings: r.servings,
    ingredients: r.ingredientCount
  })).sort((a, b) => a.costPerServing - b.costPerServing);
  
  log('\nCost per Serving (sorted):\n', 'yellow');
  costData.forEach((r, i) => {
    const color = r.costPerServing > 50 ? 'red' : r.costPerServing > 10 ? 'yellow' : 'green';
    log(`${i + 1}. $${r.costPerServing.toFixed(2)} - ${r.name} (${r.servings} servings, ${r.ingredients} ingredients)`, color);
  });
  
  const avgCost = costData.reduce((sum, r) => sum + r.costPerServing, 0) / costData.length;
  const minCost = costData[0].costPerServing;
  const maxCost = costData[costData.length - 1].costPerServing;
  
  log(`\nStats:`, 'cyan');
  log(`  Average: $${avgCost.toFixed(2)} per serving`, 'cyan');
  log(`  Min: $${minCost.toFixed(2)}`, 'cyan');
  log(`  Max: $${maxCost.toFixed(2)}`, 'cyan');
  log(`  Expected range: $2-8 per serving`, maxCost > 20 ? 'red' : 'green');
  
  // Nutrition analysis
  log('\n\n🥗 Nutrition Analysis:\n', 'bright');
  log('─'.repeat(80), 'cyan');
  
  log('\nCalories per Serving (calculated vs original):\n', 'yellow');
  successful.forEach((r, i) => {
    const calc = r.calculatedNutrition.calories;
    const orig = r.originalNutrition?.calories || 0;
    const diff = orig > 0 ? ((calc - orig) / orig * 100).toFixed(0) : 'N/A';
    const diffSymbol = calc > orig ? '+' : '';
    
    const color = Math.abs(calc - orig) > orig * 0.5 ? 'red' : Math.abs(calc - orig) > orig * 0.2 ? 'yellow' : 'green';
    
    log(`${i + 1}. ${r.recipeName.substring(0, 35).padEnd(35)} | Calc: ${calc.toFixed(0).padStart(4)} | Orig: ${orig.toFixed(0).padStart(4)} | Diff: ${diffSymbol}${diff}%`, color);
  });
  
  // Process coverage
  log('\n\n⚙️  Process Coverage:\n', 'bright');
  log('─'.repeat(80), 'cyan');
  
  const allProcesses = new Set();
  successful.forEach(r => {
    // Extract unique processes from each result
    allProcesses.add(r.uniqueProcesses);
  });
  
  log(`\nUnique processes used across ${successful.length} recipes: ${[...new Set(successful.flatMap(r => r.uniqueProcesses))].length}`, 'cyan');
  
  // Component analysis
  log('\n\n🔧 Component Analysis:\n', 'bright');
  log('─'.repeat(80), 'cyan');
  
  const avgComponents = successful.reduce((sum, r) => sum + r.componentsGenerated, 0) / successful.length;
  const avgReusable = successful.reduce((sum, r) => sum + r.reusableComponents, 0) / successful.length;
  
  log(`\nAverage components per recipe: ${avgComponents.toFixed(1)}`, 'cyan');
  log(`Average reusable components: ${avgReusable.toFixed(1)}`, 'cyan');
  
  // Save comprehensive results
  const outputDir = path.resolve(projectRoot, 'test-output');
  const summaryFile = path.join(outputDir, 'batch-test-summary.json');
  
  fs.writeFileSync(
    summaryFile,
    JSON.stringify({
      testDate: new Date().toISOString(),
      recipesTest: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
      summary: {
        avgCostPerServing: avgCost,
        minCost,
        maxCost,
        avgComponents,
        avgReusable
      }
    }, null, 2)
  );
  
  log(`\n\n💾 Full results saved to: ${summaryFile}`, 'green');
  log('\n═'.repeat(80), 'cyan');
  log('✅ Batch test complete!\n', 'bright');
}

// Run
testMultipleRecipes().catch(error => {
  log(`\n❌ Batch test failed:\n`, 'red');
  console.error(error);
  process.exit(1);
});
