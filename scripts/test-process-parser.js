#!/usr/bin/env node

/**
 * Test script for Process Parser
 * Tests the AI process extraction on sample recipes
 * 
 * Usage: node scripts/test-process-parser.js [recipeIndex]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  extractStepsFromHTML,
  parseRecipeProcesses,
  validateParsedProcesses
} from '../src/utils/processParser.js';

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

async function testProcessParser() {
  log('\n🧪 Testing Process Parser\n', 'bright');
  
  // Load data
  log('📚 Loading data files...', 'cyan');
  const processMaster = loadJSON('src/data/processMaster.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  
  log(`✓ Loaded ${Object.keys(processMaster.processes).length} processes`, 'green');
  log(`✓ Loaded ${recipeCatalog.recipes.length} recipes\n`, 'green');
  
  // Get recipe index from command line or use first recipe
  const recipeIndex = parseInt(process.argv[2]) || 0;
  const recipe = recipeCatalog.recipes[recipeIndex];
  
  if (!recipe) {
    log(`❌ Recipe at index ${recipeIndex} not found`, 'red');
    process.exit(1);
  }
  
  log(`📖 Testing with recipe: "${recipe.name}"`, 'bright');
  log(`   Servings: ${recipe.servings}`, 'cyan');
  log(`   Prep: ${recipe.prepTime}min | Cook: ${recipe.cookTime}min\n`, 'cyan');
  
  // Extract steps
  log('1️⃣  Extracting instruction steps...', 'yellow');
  const steps = extractStepsFromHTML(recipe.instructions);
  log(`   Found ${steps.length} steps:\n`, 'green');
  steps.forEach((step, i) => {
    const preview = step.length > 80 ? step.substring(0, 77) + '...' : step;
    log(`   ${i + 1}. ${preview}`, 'cyan');
  });
  
  // Check for API key
  log('\n2️⃣  Checking Anthropic API key...', 'yellow');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('   ❌ ANTHROPIC_API_KEY not found in environment', 'red');
    log('   💡 Add your API key to .env file:', 'yellow');
    log('      ANTHROPIC_API_KEY=your_key_here\n', 'yellow');
    process.exit(1);
  }
  log('   ✓ API key found\n', 'green');
  
  // Parse processes
  log('3️⃣  Calling Claude AI to parse processes...', 'yellow');
  log('   (This may take 10-30 seconds)\n', 'cyan');
  
  const startTime = Date.now();
  const result = await parseRecipeProcesses(recipe, processMaster, apiKey);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  if (!result.success) {
    log(`   ❌ Parsing failed: ${result.error}\n`, 'red');
    if (result.rawResponse) {
      log('Raw response:', 'yellow');
      console.log(result.rawResponse);
    }
    process.exit(1);
  }
  
  log(`   ✓ Parsing completed in ${duration}s\n`, 'green');
  
  // Display results
  log('4️⃣  Parsing Results:', 'bright');
  log('─'.repeat(80), 'cyan');
  
  const parsed = result.data;
  
  // Summary
  log('\n📊 Summary:', 'bright');
  log(`   Total Steps: ${parsed.processSteps.length}`, 'cyan');
  log(`   Total Processes: ${result.validation.stats.totalProcesses}`, 'cyan');
  log(`   Unique Processes: ${result.validation.stats.uniqueProcesses}`, 'cyan');
  if (parsed.processSummary?.estimatedTotalTime) {
    log(`   Estimated Time: ${parsed.processSummary.estimatedTotalTime} minutes`, 'cyan');
  }
  
  // Process breakdown
  log('\n📋 Process Breakdown:', 'bright');
  parsed.processSteps.forEach((step, i) => {
    log(`\n   Step ${step.stepNumber}:`, 'yellow');
    log(`   "${step.originalInstruction.substring(0, 100)}${step.originalInstruction.length > 100 ? '...' : ''}"`, 'cyan');
    
    step.processes.forEach((proc, j) => {
      const processData = processMaster.processes[proc.processId];
      const processName = processData ? processData.displayName : proc.processId;
      
      log(`\n     ${j + 1}. ${processName} (${proc.processId})`, 'magenta');
      log(`        Ingredients: ${proc.ingredients.join(', ')}`, 'cyan');
      if (proc.durationMinutes) {
        log(`        Duration: ${proc.durationMinutes} minutes`, 'cyan');
      }
      if (proc.notes) {
        log(`        Notes: ${proc.notes}`, 'cyan');
      }
    });
    
    if (step.outputDescription) {
      log(`\n     → Output: ${step.outputDescription}`, 'green');
    }
  });
  
  // Validation results
  log('\n\n5️⃣  Validation:', 'bright');
  if (result.validation.valid) {
    log('   ✅ All processes are valid!\n', 'green');
  } else {
    log('   ⚠️  Validation warnings:\n', 'yellow');
    result.validation.warnings.forEach(warning => {
      log(`   • ${warning}`, 'yellow');
    });
    log('', 'reset');
  }
  
  // Save result
  const outputDir = path.resolve(projectRoot, 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `parsed-recipe-${recipeIndex}.json`);
  fs.writeFileSync(
    outputFile,
    JSON.stringify({
      recipe: {
        name: recipe.name,
        spoonacularId: recipe.spoonacularId,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions
      },
      parsed: result.data,
      validation: result.validation,
      metadata: {
        parsedAt: new Date().toISOString(),
        duration: duration + 's',
        model: 'claude-sonnet-4-20250514'
      }
    }, null, 2)
  );
  
  log(`💾 Full results saved to: ${outputFile}\n`, 'green');
  
  // Summary stats
  log('─'.repeat(80), 'cyan');
  log('✅ Test complete!\n', 'bright');
}

// Run test
testProcessParser().catch(error => {
  log(`\n❌ Test failed with error:\n`, 'red');
  console.error(error);
  process.exit(1);
});
