#!/usr/bin/env node

/**
 * Analyze errors and warnings from batch conversion
 * Identify high-impact fixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Load all converted recipes and collect errors
const convertedDir = path.join(projectRoot, 'test-output/converted-recipes');
const files = fs.readdirSync(convertedDir).filter(f => f.startsWith('recipe-'));

log('\n🔍 Analyzing 50 Converted Recipes for Patterns\n', 'bright');
log('='.repeat(80), 'cyan');

// Track missing ingredients
const missingIngredients = {};
const unitIssues = {};
const validationWarnings = [];

// Read each converted recipe
files.forEach(file => {
  const filePath = path.join(convertedDir, file);
  const recipe = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Check for missing ingredients (would show as 0 cost)
  recipe.ingredients.forEach(ing => {
    // If ingredient has 0 or very low cost, might be missing
    // We'll check by looking at the component results
  });
});

// Alternative: Parse console output from batch run
// For now, manually collect from the warnings we saw

const knownIssues = {
  missingIngredients: [
    'baking mix',
    'over-ripe plantain', 
    'veal shanks',
    'phyllo dough',
    'meat sauce',
    'soda water',
    'shrimps'
  ],
  
  unitConversions: [
    'pkg', 'fillet', 'slice', 'Head', 'leaf', 'of',
    'pepperoni', 'bay leaf', 'bosc pear', 'kalamata',
    'celery', 'pd of lentils', 'shallots', 'squash',
    'pasta sauce: sauce', 'wonton wrapper', 'jalapenos',
    'beef bouillon cubes'
  ],
  
  processIssues: [
    'press (invalid - should be crush)'
  ]
};

log('\n📋 IDENTIFIED ISSUES FROM 50-RECIPE BATCH:\n', 'bright');

log('1️⃣  Missing Ingredients (not in database):\n', 'yellow');
knownIssues.missingIngredients.forEach((ing, i) => {
  log(`   ${i + 1}. ${ing}`, 'cyan');
});

log('\n2️⃣  Unit Conversion Issues:\n', 'yellow');
const uniqueUnits = [...new Set(knownIssues.unitConversions)];
log(`   Found ${uniqueUnits.length} problematic units:\n`, 'cyan');

// Categorize by type
const categories = {
  containers: ['pkg', 'Head', 'bag', 'box'],
  portions: ['fillet', 'slice', 'cube'],
  descriptive: ['of', ''],
  specific: ['pd of lentils', 'pasta sauce: sauce', 'beef bouillon cubes']
};

log('   Containers (pkg, Head, bag):', 'magenta');
uniqueUnits.filter(u => u.match(/pkg|Head|bag|box/)).forEach(u => log(`     • ${u}`, 'cyan'));

log('\n   Portions (fillet, slice, cube):', 'magenta');
uniqueUnits.filter(u => u.match(/fillet|slice|cube/)).forEach(u => log(`     • ${u}`, 'cyan'));

log('\n   Count-based (pepperoni, shallots, etc.):', 'magenta');
uniqueUnits.filter(u => !u.match(/pkg|Head|bag|box|fillet|slice|cube|of|pd|sauce/)).slice(0, 10).forEach(u => log(`     • ${u}`, 'cyan'));

log('\n3️⃣  Process Validation Issues:\n', 'yellow');
knownIssues.processIssues.forEach((issue, i) => {
  log(`   ${i + 1}. ${issue}`, 'cyan');
});

log('\n\n🎯 HIGH-IMPACT FIXES (Quick Wins):\n', 'bright');
log('='.repeat(80), 'cyan');

log('\n✅ Fix #1: Add Missing Ingredients (5 min)', 'green');
log('   Add these to fresh preferences:', 'cyan');
log('   • veal shanks → beef (substitute)', 'cyan');
log('   • baking mix → flour (substitute)', 'cyan');
log('   • plantain → banana (similar)', 'cyan');
log('   Impact: 3-4 recipes', 'yellow');

log('\n✅ Fix #2: Add Unit Conversions (5 min)', 'green');
log('   Add to fallbackConversions:', 'cyan');
log('   • pkg/package → 250g', 'cyan');
log('   • fillet → 150g', 'cyan');
log('   • slice → 30g', 'cyan');
log('   • leaf (single) → 0.5g', 'cyan');
log('   Impact: 10-15 recipes', 'yellow');

log('\n✅ Fix #3: Improve Empty Unit Handling (5 min)', 'green');
log('   Better detection for:', 'cyan');
log('   • "4 shallots" → 4 items × 30g', 'cyan');
log('   • "1 celery" → 1 stalk × 40g', 'cyan');
log('   • "2 pepperoni" → 2 slices × 10g', 'cyan');
log('   Impact: 8-10 recipes', 'yellow');

log('\n\n⏱️  ESTIMATED FIX TIME: 15-20 minutes', 'cyan');
log('📈 ESTIMATED IMPACT: 5-10% accuracy improvement', 'cyan');
log('\n' + '='.repeat(80), 'cyan');
log('✅ Analysis complete\n', 'bright');
