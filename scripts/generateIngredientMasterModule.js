#!/usr/bin/env node
/**
 * Generate ingredientMaster.js from ingredientMaster.json
 * Converts JSON to a plain JavaScript module for browser compatibility
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../src/data/ingredientMaster.json');
const jsPath = path.join(__dirname, '../src/data/ingredientMaster.js');

console.log('Reading ingredientMaster.json...');
const data = fs.readFileSync(jsonPath, 'utf8');

console.log('Generating ingredientMaster.js...');
const output = `/**
 * Ingredient Master Dictionary Data
 * Browser-compatible ES module export
 * 
 * This file is auto-generated from ingredientMaster.json
 * DO NOT EDIT MANUALLY - regenerate using: node scripts/generateIngredientMasterModule.js
 */

const masterData = ${data};

export default masterData;
`;

fs.writeFileSync(jsPath, output);
console.log('✅ Generated src/data/ingredientMaster.js');
