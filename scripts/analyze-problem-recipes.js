#!/usr/bin/env node

/**
 * Detailed analysis of recipes with high cost/nutrition variance
 * Identifies specific ingredients causing issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertToGrams } from '../src/utils/unitConversion.js';
import { calculateIngredientCost } from '../src/utils/costCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

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

function analyzeRecipe(recipeIndex, recipeCatalog, ingredientMaster) {
  const recipe = recipeCatalog.recipes[recipeIndex];
  if (!recipe) {
    log(`Recipe ${recipeIndex} not found`, 'red');
    return null;
  }
  
  const ingredients = ingredientMaster.ingredients;
  
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Recipe: ${recipe.name}`, 'bright');
  log(`Servings: ${recipe.servings} | Original Nutrition: ${recipe.nutrition?.calories || 'N/A'} cal`, 'cyan');
  log(`${'='.repeat(80)}\n`, 'cyan');
  
  const analysis = {
    recipeName: recipe.name,
    recipeIndex,
    servings: recipe.servings,
    totalCost: 0,
    totalCalories: 0,
    ingredientDetails: [],
    issues: []
  };
  
  recipe.ingredients.forEach((ing, idx) => {
    // Find in master
    const normalized = ing.name.toLowerCase().trim();
    let ingData = ingredients[normalized];
    
    if (!ingData) {
      // Search by aliases
      for (const [id, data] of Object.entries(ingredients)) {
        if (id.startsWith('_')) continue;
        if (data.aliases?.some(alias => alias.toLowerCase() === normalized)) {
          ingData = { id, ...data };
          break;
        }
      }
    } else {
      ingData = { id: normalized, ...ingData };
    }
    
    if (!ingData) {
      log(`  ${idx + 1}. ❌ NOT FOUND: ${ing.quantity}${ing.unit} ${ing.name}`, 'red');
      analysis.issues.push({ ingredient: ing.name, issue: 'Not found in master database' });
      return;
    }
    
    // Convert to grams
    const quantityG = convertToGrams(ing.quantity, ing.unit, ing.name, ingData);
    
    // Calculate cost
    const cost = calculateIngredientCost(quantityG, ingData);
    analysis.totalCost += cost;
    
    // Calculate calories
    const caloriesPer100g = ingData.nutritionBase?.per100g?.calories || 0;
    const calories = (quantityG / 100) * caloriesPer100g;
    analysis.totalCalories += calories;
    
    // Get pricing details
    const pricePerKg = ingData.pricing?.pricePerKg || 0;
    const costPerG = pricePerKg / 1000;
    
    const detail = {
      name: ing.name,
      originalQty: ing.quantity,
      originalUnit: ing.unit,
      convertedG: quantityG,
      pricePerKg,
      cost,
      calories
    };
    
    analysis.ingredientDetails.push(detail);
    
    // Flag expensive or problematic items
    const costPerServing = cost / recipe.servings;
    const isExpensive = costPerServing > 5;
    const hasWeirdConversion = quantityG > 1000 && (ing.unit === '' || !ing.unit);
    const hasNoPricing = pricePerKg === 0;
    
    const color = isExpensive ? 'red' : hasWeirdConversion ? 'yellow' : hasNoPricing ? 'yellow' : 'green';
    const flags = [];
    if (isExpensive) flags.push('💰 EXPENSIVE');
    if (hasWeirdConversion) flags.push('⚠️ CONVERSION');
    if (hasNoPricing) flags.push('📭 NO PRICE');
    
    const flagStr = flags.length > 0 ? ' [' + flags.join(' ') + ']' : '';
    
    log(
      `  ${(idx + 1).toString().padStart(2)}. ${ing.quantity}${ing.unit} ${ing.name.padEnd(30)} → ` +
      `${quantityG.toFixed(0).padStart(5)}g × $${pricePerKg.toFixed(2).padStart(6)}/kg = ` +
      `$${cost.toFixed(2).padStart(7)} (${calories.toFixed(0).padStart(4)} cal)${flagStr}`,
      color
    );
    
    if (isExpensive || hasWeirdConversion || hasNoPricing) {
      analysis.issues.push({
        ingredient: ing.name,
        issue: flags.join(', '),
        details: {
          convertedG: quantityG,
          pricePerKg,
          cost,
          costPerServing: costPerServing.toFixed(2)
        }
      });
    }
  });
  
  log(`\n${'─'.repeat(80)}`, 'cyan');
  log(`TOTALS:`, 'bright');
  log(`  Cost: $${analysis.totalCost.toFixed(2)} ($${(analysis.totalCost / recipe.servings).toFixed(2)}/serving)`, 'cyan');
  log(`  Calories: ${analysis.totalCalories.toFixed(0)} (${(analysis.totalCalories / recipe.servings).toFixed(0)}/serving)`, 'cyan');
  
  if (recipe.nutrition?.calories) {
    const calcCalPerServing = analysis.totalCalories / recipe.servings;
    const origCalPerServing = recipe.nutrition.calories;
    const diff = ((calcCalPerServing - origCalPerServing) / origCalPerServing * 100).toFixed(0);
    const diffColor = Math.abs(parseFloat(diff)) > 30 ? 'red' : Math.abs(parseFloat(diff)) > 15 ? 'yellow' : 'green';
    log(`  Accuracy: ${diff > 0 ? '+' : ''}${diff}% vs original`, diffColor);
  }
  
  if (analysis.issues.length > 0) {
    log(`\n⚠️  Issues Found (${analysis.issues.length}):`, 'yellow');
    analysis.issues.forEach((issue, i) => {
      log(`  ${i + 1}. ${issue.ingredient}: ${issue.issue}`, 'yellow');
      if (issue.details) {
        log(`     Details: ${JSON.stringify(issue.details)}`, 'cyan');
      }
    });
  }
  
  return analysis;
}

async function main() {
  log('\n🔍 Analyzing Problem Recipes\n', 'bright');
  
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  
  // Recipes with high variance from batch test
  const problemRecipes = [
    { index: 5, name: 'Mushroom Hummus Crostini', costIssue: true, nutritionIssue: true },
    { index: 35, name: 'Lasagna Spinach Rolls', costIssue: true, nutritionIssue: true },
    { index: 15, name: 'Italian Seafood Stew', nutritionIssue: true }
  ];
  
  const analyses = [];
  
  for (const problem of problemRecipes) {
    const analysis = analyzeRecipe(problem.index, recipeCatalog, ingredientMaster);
    if (analysis) {
      analyses.push(analysis);
    }
  }
  
  // Summary
  log('\n\n📊 Cross-Recipe Issue Summary\n', 'bright');
  log('='.repeat(80), 'cyan');
  
  const allIssues = analyses.flatMap(a => a.issues);
  const issueTypes = {};
  
  allIssues.forEach(issue => {
    if (!issueTypes[issue.issue]) {
      issueTypes[issue.issue] = [];
    }
    issueTypes[issue.issue].push(issue.ingredient);
  });
  
  log('\nCommon Issues Across Recipes:\n', 'yellow');
  Object.entries(issueTypes).forEach(([issueType, ingredients]) => {
    log(`  ${issueType} (${ingredients.length} occurrences)`, 'yellow');
    log(`    Ingredients: ${ingredients.slice(0, 5).join(', ')}${ingredients.length > 5 ? '...' : ''}`, 'cyan');
  });
  
  // Save detailed analysis
  const outputFile = path.join(projectRoot, 'test-output', 'problem-recipe-analysis.json');
  fs.writeFileSync(outputFile, JSON.stringify(analyses, null, 2));
  log(`\n💾 Detailed analysis saved to: ${outputFile}\n`, 'green');
}

main().catch(console.error);
