#!/usr/bin/env node

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

function loadJSON(filePath) {
  const fullPath = path.resolve(projectRoot, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

async function debugIngredientState() {
  const processMaster = loadJSON('src/data/processMaster.json');
  const ingredientMaster = loadJSON('src/data/ingredientMaster.json');
  const recipeCatalog = loadJSON('src/data/vanessa_recipe_catalog.json');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  const recipe = recipeCatalog.recipes[9]; // Lasagna
  
  console.log(`\nRecipe: ${recipe.name}\n`);
  console.log('='.repeat(80));
  
  // Parse
  const parseResult = await parseRecipeProcesses(recipe, processMaster, apiKey);
  
  // Generate with modified version that returns ingredientState
  const { generateComponents: genComp } = await import('../src/utils/componentGenerator.js');
  
  // We need to intercept the ingredient state...
  // Actually, let me just manually create the ingredient state and check costs
  
  const { initializeIngredientState } = await import('../src/utils/componentGenerator.js');
  const ingredientState = initializeIngredientState(recipe.ingredients, ingredientMaster);
  
  console.log('\nIngredient State After Initialization:\n');
  
  let total = 0;
  ingredientState.forEach((state, name) => {
    console.log(`${name.padEnd(30)} | ${state.originalQuantityG.toFixed(0).padStart(5)}g | $${state.costAUD.toFixed(2).padStart(6)}`);
    total += state.costAUD;
  });
  
  console.log('='.repeat(80));
  console.log(`TOTAL COST: $${total.toFixed(2)}`);
  console.log(`Per Serving (6): $${(total / 6).toFixed(2)}`);
}

debugIngredientState().catch(console.error);
