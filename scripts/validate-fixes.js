#!/usr/bin/env node

/**
 * Validate that our quick fixes improved accuracy
 * Re-test a sample of recipes that had issues
 */

import dotenv from 'dotenv';
import { parseRecipeProcesses } from '../src/utils/processParser.js';
import { generateComponents } from '../src/utils/componentGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateFixes() {
  log('\n🔍 Validating Quick Fixes\n', 'bright');
  
  const processMaster = loadJSON('src/data/processMaster.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Test recipes that had issues
  const testCases = [
    { index: 8, name: 'Plantain Pizza', issue: 'Missing: over-ripe plantain' },
    { index: 12, name: 'Osso Buco', issue: 'Missing: veal shanks' },
    { index: 23, name: 'Heart Shaped Ravioli', issue: 'Unit: pkg wonton wrapper' },
    { index: 16, name: 'Italian Seafood Stew', issue: 'Missing: shrimps' },
    { index: 3, name: 'Italian Tuna Pasta', issue: 'Unit: chillies' }
  ];
  
  log('Testing recipes that previously had issues:\\n', 'cyan');
  
  let improved = 0;
  let warnings = 0;
  
  for (const testCase of testCases) {
    const recipe = recipeCatalog.recipes[testCase.index];
    
    log(`${testCase.index}. ${recipe.name}`, 'bright');
    log(`   Previous issue: ${testCase.issue}`, 'yellow');
    
    // Capture console warnings
    const oldWarn = console.warn;
    const capturedWarnings = [];
    console.warn = (...args) => capturedWarnings.push(args.join(' '));
    
    try {
      const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
      const componentResult = generateComponents(
        parseResult.data,
        recipe,
        processMaster,
        ingredientMaster
      );
      
      console.warn = oldWarn;
      
      const cost = componentResult.recipeMetrics.costPerServing;
      const hasWarnings = capturedWarnings.some(w => 
        w.includes('not found') || w.includes('Unable to convert')
      );
      
      if (hasWarnings) {
        log(`   ⚠️  Still has warnings`, 'yellow');
        warnings++;
        capturedWarnings.slice(0, 2).forEach(w => log(`      ${w}`, 'yellow'));
      } else {
        log(`   ✅ No warnings! Fixed!`, 'green');
        improved++;
      }
      
      log(`   Cost: $${cost.toFixed(2)}/serving\\n`, 'cyan');
      
    } catch (error) {
      console.warn = oldWarn;
      log(`   ❌ Error: ${error.message}\\n`, 'red');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  log('='.repeat(80), 'cyan');
  log(`\\n📊 Fix Validation Results:`, 'bright');
  log(`   Fully fixed: ${improved}/${testCases.length}`, improved > 0 ? 'green' : 'yellow');
  log(`   Still have warnings: ${warnings}/${testCases.length}`, warnings < testCases.length ? 'green' : 'yellow');
  log('\\n='.repeat(80) + '\\n', 'cyan');
}

validateFixes().catch(console.error);
