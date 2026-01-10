#!/usr/bin/env node

/**
 * Phase 3: Batch Recipe Conversion
 * Converts all recipes to component-based schema with process graphs
 * 
 * Features:
 * - Progress tracking and resume capability
 * - Incremental saving (every 10 recipes)
 * - Error collection and analysis
 * - Cost/nutrition statistics across all recipes
 * - Pattern identification for rule extraction
 * 
 * Usage: node scripts/batch-convert-recipes.js [options]
 *   --start N     Start from recipe index N (default: 0)
 *   --limit N     Only process N recipes (default: all)
 *   --resume      Resume from last saved progress
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
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function saveJSON(filePath, data) {
  const fullPath = path.resolve(projectRoot, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

// Progress tracking
const PROGRESS_FILE = 'test-output/batch-conversion-progress.json';
const OUTPUT_DIR = 'test-output/converted-recipes';
const STATS_FILE = 'test-output/batch-conversion-stats.json';

function loadProgress() {
  const progressPath = path.join(projectRoot, PROGRESS_FILE);
  if (fs.existsSync(progressPath)) {
    return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  }
  return {
    lastProcessed: -1,
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: null
  };
}

function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  saveJSON(PROGRESS_FILE, progress);
}

async function batchConvertRecipes() {
  log('\n' + '='.repeat(80), 'cyan');
  log('🏭 PHASE 3: BATCH RECIPE CONVERSION', 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  // Parse command line args
  const args = process.argv.slice(2);
  const startArg = args.find(a => a.startsWith('--start='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const resume = args.includes('--resume');
  
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
  
  // Load or initialize progress
  let progress = resume ? loadProgress() : {
    lastProcessed: -1,
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: null,
    errors: [],
    warnings: []
  };
  
  const startIndex = startArg ? parseInt(startArg.split('=')[1]) : (resume ? progress.lastProcessed + 1 : 0);
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : recipeCatalog.recipes.length;
  const endIndex = Math.min(startIndex + limit, recipeCatalog.recipes.length);
  
  log('⚙️  Configuration:', 'bright');
  log(`   Start index: ${startIndex}`, 'cyan');
  log(`   End index: ${endIndex}`, 'cyan');
  log(`   Total to process: ${endIndex - startIndex}`, 'cyan');
  if (resume) {
    log(`   Resuming from: ${progress.lastProcessed + 1}`, 'yellow');
    log(`   Already processed: ${progress.totalProcessed}`, 'yellow');
  }
  log('', 'reset');
  
  // Create output directory
  const outputDir = path.join(projectRoot, OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Statistics tracking
  const stats = {
    totalRecipes: endIndex - startIndex,
    processed: 0,
    successful: 0,
    failed: 0,
    
    // Cost stats
    costs: [],
    avgCost: 0,
    medianCost: 0,
    
    // Nutrition stats
    nutritionAccuracy: [],
    
    // Process stats
    processesUsed: {},
    avgComponentsPerRecipe: 0,
    avgReusablePerRecipe: 0,
    
    // Errors
    errors: [],
    parseErrors: [],
    componentErrors: [],
    
    // Timing
    startTime: Date.now(),
    estimatedCompletion: null
  };
  
  log('🚀 Starting batch conversion...\n', 'bright');
  log(`[${'='.repeat(50)}] 0%\n`, 'cyan');
  
  // Process recipes
  for (let i = startIndex; i < endIndex; i++) {
    const recipe = recipeCatalog.recipes[i];
    if (!recipe) {
      log(`⚠️  Recipe ${i} not found, skipping`, 'yellow');
      continue;
    }
    
    const recipeNum = i - startIndex + 1;
    const totalRecipes = endIndex - startIndex;
    const percentComplete = (recipeNum / totalRecipes * 100).toFixed(1);
    
    // Progress bar
    const barWidth = 50;
    const filled = Math.floor((recipeNum / totalRecipes) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    
    process.stdout.write(`\r[${bar}] ${percentComplete}% | Recipe ${recipeNum}/${totalRecipes}: ${recipe.name.substring(0, 40).padEnd(40)}`);
    
    try {
      // Parse processes
      const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
      
      if (!parseResult.success) {
        stats.failed++;
        stats.parseErrors.push({
          index: i,
          recipeName: recipe.name,
          error: parseResult.error
        });
        progress.errors.push({ index: i, stage: 'parse', error: parseResult.error });
        continue;
      }
      
      // Generate components
      const componentResult = generateComponents(
        parseResult.data,
        recipe,
        processMaster,
        ingredientMaster
      );
      
      if (componentResult.errors.length > 0) {
        stats.componentErrors.push({
          index: i,
          recipeName: recipe.name,
          errors: componentResult.errors
        });
        progress.warnings.push({ index: i, errors: componentResult.errors });
      }
      
      // Track statistics
      stats.successful++;
      stats.costs.push(componentResult.recipeMetrics.costPerServing);
      
      if (recipe.nutrition?.calories) {
        const calcCal = componentResult.recipeMetrics.nutritionPerServing.calories;
        const origCal = recipe.nutrition.calories;
        const accuracy = Math.abs(calcCal - origCal) / origCal;
        stats.nutritionAccuracy.push(accuracy);
      }
      
      // Track process usage
      parseResult.data.processSteps.forEach(step => {
        step.processes.forEach(proc => {
          stats.processesUsed[proc.processId] = (stats.processesUsed[proc.processId] || 0) + 1;
        });
      });
      
      stats.avgComponentsPerRecipe += componentResult.components.length;
      stats.avgReusablePerRecipe += componentResult.recipeMetrics.reusableComponents.length;
      
      // Save converted recipe
      const convertedRecipe = {
        ...recipe,
        _schemaVersion: 3,
        _convertedAt: new Date().toISOString(),
        processGraph: parseResult.data,
        components: componentResult.components,
        calculated: {
          totalCost: componentResult.recipeMetrics.totalCost,
          costPerServing: componentResult.recipeMetrics.costPerServing,
          totalPrepTime: componentResult.recipeMetrics.totalPrepTime,
          nutritionPerServing: componentResult.recipeMetrics.nutritionPerServing
        },
        prepAhead: {
          components: componentResult.recipeMetrics.prepAheadComponents.map(c => ({
            id: c.id,
            name: c.name,
            shelfLifeHours: c.prepAhead.shelfLifeHours
          }))
        },
        reusable: componentResult.recipeMetrics.reusableComponents
      };
      
      const recipeFile = path.join(outputDir, `recipe-${i}-${recipe.spoonacularId}.json`);
      saveJSON(recipeFile, convertedRecipe);
      
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        index: i,
        recipeName: recipe.name,
        error: error.message,
        stack: error.stack
      });
      progress.errors.push({ index: i, stage: 'unknown', error: error.message });
    }
    
    stats.processed++;
    progress.lastProcessed = i;
    progress.totalProcessed++;
    progress.successful = stats.successful;
    progress.failed = stats.failed;
    
    // Save progress every 10 recipes
    if (stats.processed % 10 === 0) {
      saveProgress(progress);
    }
    
    // Delay between API calls (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Clear progress line
  console.log('\n');
  
  // Calculate final statistics
  if (stats.costs.length > 0) {
    stats.avgCost = stats.costs.reduce((sum, c) => sum + c, 0) / stats.costs.length;
    stats.medianCost = [...stats.costs].sort((a, b) => a - b)[Math.floor(stats.costs.length / 2)];
  }
  
  if (stats.successful > 0) {
    stats.avgComponentsPerRecipe = stats.avgComponentsPerRecipe / stats.successful;
    stats.avgReusablePerRecipe = stats.avgReusablePerRecipe / stats.successful;
  }
  
  // Calculate nutrition accuracy percentages
  const within20pct = stats.nutritionAccuracy.filter(a => a <= 0.20).length;
  const within30pct = stats.nutritionAccuracy.filter(a => a <= 0.30).length;
  
  stats.nutritionWithin20pct = within20pct;
  stats.nutritionWithin30pct = within30pct;
  
  // Estimate completion time
  const elapsed = Date.now() - stats.startTime;
  stats.totalTimeMinutes = (elapsed / 1000 / 60).toFixed(1);
  
  // Final report
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 BATCH CONVERSION COMPLETE', 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  log('✅ Results:', 'bright');
  log(`   Processed: ${stats.processed}/${stats.totalRecipes}`, 'cyan');
  log(`   Successful: ${stats.successful} (${(stats.successful/stats.processed*100).toFixed(1)}%)`, 'green');
  log(`   Failed: ${stats.failed} (${(stats.failed/stats.processed*100).toFixed(1)}%)`, stats.failed > 0 ? 'red' : 'green');
  
  log('\n💰 Cost Statistics:', 'bright');
  log(`   Average: $${stats.avgCost.toFixed(2)}/serving`, 'cyan');
  log(`   Median: $${stats.medianCost.toFixed(2)}/serving`, 'cyan');
  log(`   Min: $${Math.min(...stats.costs).toFixed(2)}`, 'cyan');
  log(`   Max: $${Math.max(...stats.costs).toFixed(2)}`, 'cyan');
  
  log('\n🥗 Nutrition Accuracy:', 'bright');
  log(`   Within ±20%: ${within20pct}/${stats.nutritionAccuracy.length} (${(within20pct/stats.nutritionAccuracy.length*100).toFixed(0)}%)`, 'green');
  log(`   Within ±30%: ${within30pct}/${stats.nutritionAccuracy.length} (${(within30pct/stats.nutritionAccuracy.length*100).toFixed(0)}%)`, 'green');
  
  log('\n⚙️  Component Analysis:', 'bright');
  log(`   Avg components/recipe: ${stats.avgComponentsPerRecipe.toFixed(1)}`, 'cyan');
  log(`   Avg reusable/recipe: ${stats.avgReusablePerRecipe.toFixed(1)}`, 'cyan');
  
  log('\n🔧 Most Used Processes:', 'bright');
  const topProcesses = Object.entries(stats.processesUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  topProcesses.forEach(([processId, count]) => {
    const processData = processMaster.processes[processId];
    log(`   ${processData.displayName.padEnd(20)} ${count.toString().padStart(4)} times (${(count/stats.successful*100).toFixed(0)}% of recipes)`, 'cyan');
  });
  
  if (stats.errors.length > 0) {
    log('\n⚠️  Errors:', 'yellow');
    log(`   Parse errors: ${stats.parseErrors.length}`, 'red');
    log(`   Component errors: ${stats.componentErrors.length}`, 'yellow');
    log(`   Other errors: ${stats.errors.length - stats.parseErrors.length - stats.componentErrors.length}`, 'red');
  }
  
  log('\n⏱️  Timing:', 'bright');
  log(`   Total time: ${stats.totalTimeMinutes} minutes`, 'cyan');
  log(`   Avg time/recipe: ${(stats.totalTimeMinutes / stats.processed).toFixed(1)} seconds`, 'cyan');
  
  // Save final statistics
  saveJSON(STATS_FILE, stats);
  log(`\n💾 Statistics saved to: ${STATS_FILE}`, 'green');
  log(`💾 Converted recipes in: ${OUTPUT_DIR}/`, 'green');
  
  // Save final progress
  saveProgress(progress);
  
  log('\n' + '='.repeat(80), 'cyan');
  log('✅ Batch conversion complete!', 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  // Recommendations
  if (stats.successful >= 50) {
    log('📈 Next Steps:', 'bright');
    log('   1. Review error patterns in batch-conversion-stats.json', 'cyan');
    log('   2. Identify common missing ingredients', 'cyan');
    log('   3. Extract process parsing rules from successful conversions', 'cyan');
    log('   4. Move to Phase 4: Meal Planning Engine\n', 'cyan');
  }
}

// Run
batchConvertRecipes().catch(error => {
  log(`\n❌ Batch conversion failed:\n`, 'red');
  console.error(error);
  process.exit(1);
});
