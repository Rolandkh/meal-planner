#!/usr/bin/env node

/**
 * Test script for Component Generator
 * Tests the full pipeline: Parse → Generate Components → Calculate Yields/Costs/Nutrition
 * 
 * Usage: node scripts/test-component-generator.js [recipeIndex]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseRecipeProcesses } from '../src/utils/processParser.js';
import { generateComponents } from '../src/utils/componentGenerator.js';
import { calculateYieldChain } from '../src/utils/yieldCalculator.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

async function testComponentGenerator() {
  log('\n🧪 Testing Component Generator - Full Pipeline\n', 'bright');
  
  // Load data
  log('📚 Loading data files...', 'cyan');
  const processMaster = loadJSON('src/data/processMaster.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  const nutritionMultipliers = loadJSON('references/nutrition-multipliers.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  
  log(`✓ Loaded ${Object.keys(processMaster.processes).length} processes`, 'green');
  log(`✓ Loaded ${Object.keys(ingredientMaster).length} ingredients`, 'green');
  log(`✓ Loaded ${recipeCatalog.recipes.length} recipes\n`, 'green');
  
  // Get recipe
  const recipeIndex = parseInt(process.argv[2]) || 9; // Default to lasagna
  const recipe = recipeCatalog.recipes[recipeIndex];
  
  if (!recipe) {
    log(`❌ Recipe at index ${recipeIndex} not found`, 'red');
    process.exit(1);
  }
  
  log(`📖 Testing with recipe: "${recipe.name}"`, 'bright');
  log(`   Servings: ${recipe.servings} | Prep: ${recipe.prepTime}min | Cook: ${recipe.cookTime}min`, 'cyan');
  log(`   Ingredients: ${recipe.ingredients.length}\n`, 'cyan');
  
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('❌ ANTHROPIC_API_KEY not found in environment', 'red');
    process.exit(1);
  }
  
  // Step 1: Parse processes
  log('1️⃣  Parsing recipe processes with AI...', 'yellow');
  const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
  
  if (!parseResult.success) {
    log(`   ❌ Parsing failed: ${parseResult.error}`, 'red');
    process.exit(1);
  }
  
  log(`   ✓ Identified ${parseResult.validation.stats.uniqueProcesses} unique processes`, 'green');
  log(`   ✓ Total: ${parseResult.validation.stats.totalProcesses} processes across ${parseResult.data.processSteps.length} steps\n`, 'green');
  
  // Step 2: Generate components
  log('2️⃣  Generating components...', 'yellow');
  const componentResult = generateComponents(
    parseResult.data,
    recipe,
    processMaster,
    ingredientMaster
  );
  
  if (!componentResult.success) {
    log(`   ⚠️  Generated with ${componentResult.errors.length} error(s)`, 'yellow');
    componentResult.errors.forEach(err => {
      log(`      Step ${err.stepNumber}: ${err.error}`, 'red');
    });
  } else {
    log(`   ✓ Generated successfully`, 'green');
  }
  
  log(`   ✓ Created ${componentResult.components.length} components`, 'green');
  log(`   ✓ Identified ${componentResult.recipeMetrics.reusableComponents.length} reusable components\n`, 'green');
  
  // Step 3: Display component details
  log('3️⃣  Component Analysis:', 'bright');
  log('─'.repeat(80), 'cyan');
  
  componentResult.components.forEach((comp, i) => {
    log(`\n   Component ${i + 1}: ${comp.name}`, 'magenta');
    log(`   ID: ${comp.id}`, 'cyan');
    
    // Source ingredients
    log(`\n   📦 Source Ingredients:`, 'yellow');
    comp.sourceIngredients.forEach(src => {
      log(`      • ${src.name}: ${src.quantityG.toFixed(0)}g`, 'cyan');
    });
    
    // Processes applied
    log(`\n   ⚙️  Processes Applied:`, 'yellow');
    comp.processes.forEach((proc, j) => {
      log(`      ${j + 1}. ${proc.processName} (yield: ${(proc.yieldFactor * 100).toFixed(0)}%)`, 'cyan');
    });
    
    // Output
    log(`\n   📊 Output:`, 'yellow');
    log(`      Quantity: ${comp.output.quantityG.toFixed(0)}g`, 'cyan');
    log(`      Cost: $${comp.calculated.costAUD.toFixed(2)} AUD`, 'cyan');
    log(`      Cost/g: $${comp.calculated.costPerG.toFixed(4)}/g`, 'cyan');
    log(`      Prep Time: ${comp.calculated.prepTimeMin} minutes`, 'cyan');
    
    // Nutrition
    log(`\n   🥗 Nutrition (total):`, 'yellow');
    const nutr = comp.calculated.nutrition;
    log(`      Calories: ${nutr.calories.toFixed(0)} kcal`, 'cyan');
    log(`      Protein: ${nutr.protein.toFixed(1)}g | Fat: ${nutr.fat.toFixed(1)}g | Carbs: ${nutr.carbs.toFixed(1)}g`, 'cyan');
    
    // Prep ahead
    if (comp.prepAhead.canStore) {
      log(`\n   📅 Prep Ahead:`, 'yellow');
      log(`      Can store: ${comp.prepAhead.shelfLifeHours}h in ${comp.prepAhead.storageLocation}`, 'green');
    }
    
    log('', 'reset');
  });
  
  // Step 4: Recipe metrics
  log('\n4️⃣  Recipe Metrics:', 'bright');
  log('─'.repeat(80), 'cyan');
  
  const metrics = componentResult.recipeMetrics;
  
  log(`\n   💰 Cost Analysis:`, 'yellow');
  log(`      Total Cost: $${metrics.totalCost.toFixed(2)} AUD`, 'cyan');
  log(`      Cost per Serving: $${metrics.costPerServing.toFixed(2)} AUD`, 'green');
  log(`      Servings: ${recipe.servings}`, 'cyan');
  
  log(`\n   ⏱️  Time Analysis:`, 'yellow');
  log(`      Total Prep Time: ${metrics.totalPrepTime} minutes`, 'cyan');
  log(`      Original Estimate: ${recipe.prepTime + recipe.cookTime} minutes`, 'cyan');
  
  log(`\n   🥗 Nutrition per Serving:`, 'yellow');
  const nutPerServing = metrics.nutritionPerServing;
  log(`      Calories: ${nutPerServing.calories.toFixed(0)} kcal`, 'cyan');
  log(`      Protein: ${nutPerServing.protein.toFixed(1)}g`, 'cyan');
  log(`      Fat: ${nutPerServing.fat.toFixed(1)}g`, 'cyan');
  log(`      Carbs: ${nutPerServing.carbs.toFixed(1)}g`, 'cyan');
  log(`      Fiber: ${nutPerServing.fiber.toFixed(1)}g`, 'cyan');
  
  if (metrics.prepAheadComponents.length > 0) {
    log(`\n   📅 Prep-Ahead Opportunities:`, 'yellow');
    metrics.prepAheadComponents.forEach(comp => {
      log(`      • ${comp.name} (${comp.prepAhead.shelfLifeHours}h shelf life)`, 'green');
    });
  }
  
  if (metrics.reusableComponents.length > 0) {
    log(`\n   ♻️  Reusable Components:`, 'yellow');
    metrics.reusableComponents.forEach(comp => {
      log(`      • ${comp.name}`, 'green');
      log(`        Shelf life: ${comp.shelfLifeHours}h`, 'cyan');
      log(`        Processes: ${comp.processes.join(' → ')}`, 'cyan');
    });
  }
  
  // Comparison with original nutrition data
  if (recipe.nutrition) {
    log(`\n   🔬 Comparison with Original Data:`, 'yellow');
    const orig = recipe.nutrition;
    const calc = nutPerServing;
    
    const diff = (field) => {
      const original = orig[field] || 0;
      const calculated = calc[field] || 0;
      const percent = original > 0 ? ((calculated - original) / original * 100).toFixed(0) : 'N/A';
      const symbol = calculated > original ? '+' : '';
      return `${symbol}${percent}%`;
    };
    
    log(`      Calories: Original ${orig.calories?.toFixed(0) || 'N/A'} → Calculated ${calc.calories.toFixed(0)} (${diff('calories')})`, 'cyan');
    log(`      Protein:  Original ${orig.protein?.toFixed(1) || 'N/A'}g → Calculated ${calc.protein.toFixed(1)}g (${diff('protein')})`, 'cyan');
    log(`      Fat:      Original ${orig.fat?.toFixed(1) || 'N/A'}g → Calculated ${calc.fat.toFixed(1)}g (${diff('fat')})`, 'cyan');
    log(`      Carbs:    Original ${orig.carbs?.toFixed(1) || 'N/A'}g → Calculated ${calc.carbs.toFixed(1)}g (${diff('carbs')})`, 'cyan');
  }
  
  // Save result
  const outputDir = path.resolve(projectRoot, 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `component-analysis-${recipeIndex}.json`);
  fs.writeFileSync(
    outputFile,
    JSON.stringify({
      recipe: {
        name: recipe.name,
        spoonacularId: recipe.spoonacularId,
        servings: recipe.servings,
        ingredients: recipe.ingredients
      },
      parsed: parseResult.data,
      components: componentResult.components,
      metrics: componentResult.recipeMetrics,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: componentResult.components.length,
        totalCost: componentResult.recipeMetrics.totalCost,
        costPerServing: componentResult.recipeMetrics.costPerServing
      }
    }, null, 2)
  );
  
  log(`\n💾 Full analysis saved to: ${outputFile}\n`, 'green');
  log('─'.repeat(80), 'cyan');
  log('✅ Component generation test complete!\n', 'bright');
}

// Run test
testComponentGenerator().catch(error => {
  log(`\n❌ Test failed with error:\n`, 'red');
  console.error(error);
  process.exit(1);
});
