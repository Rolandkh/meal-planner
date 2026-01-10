/**
 * Extract Unmatched Ingredients for Spoonacular Parsing
 * 
 * Loads evaluation report and extracts unmatched ingredients
 * for batch processing via Spoonacular API.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== EXTRACT UNMATCHED FOR SPOONACULAR ===\n');

// Load evaluation report
const reportPath = path.join(__dirname, '../tmp/normalization_evaluation_report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log('Loaded evaluation report');
console.log('Total unmatched:', report.breakdown.unknown);
console.log('Remaining unmatched types:', report.remainingUnmatched.length);
console.log();

// Filter for quality
const filtered = report.remainingUnmatched.filter(item => {
  // Remove empty/malformed
  if (!item.identity || item.identity.trim().length < 2) {
    return false;
  }
  
  // Remove obviously malformed
  if (item.identity.includes('=') || item.identity.includes('equivalent')) {
    return false;
  }
  
  // Remove entries that are just numbers
  if (/^\d+$/.test(item.identity)) {
    return false;
  }
  
  return true;
});

console.log('After filtering:', filtered.length, 'valid entries');
console.log();

// Prepare for Spoonacular parsing
const forSpoonacular = filtered.map(item => ({
  identity: item.identity,
  state: item.state,
  count: item.count,
  examples: item.examples,
  // Create a "best guess" ingredient string for Spoonacular
  ingredientLine: `1 cup ${item.identity}`
}));

// Save as JSON for batch processing
const outputPath = path.join(__dirname, '../tmp/unmatched_for_spoonacular.json');
fs.writeFileSync(outputPath, JSON.stringify(forSpoonacular, null, 2));

console.log('=== EXTRACTION COMPLETE ===');
console.log(`Saved ${forSpoonacular.length} ingredients to: ${outputPath}`);
console.log();

// Also save as simple text list
const textPath = path.join(__dirname, '../tmp/unmatched_for_spoonacular.txt');
const textContent = forSpoonacular.map(item => item.ingredientLine).join('\n');
fs.writeFileSync(textPath, textContent);

console.log(`Also saved as text: ${textPath}`);
console.log();

// Show preview
console.log('Preview (first 20):');
forSpoonacular.slice(0, 20).forEach((item, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${item.ingredientLine.padEnd(50)} (${item.count}× uses, ${item.state})`);
});

console.log();
console.log('📊 SUMMARY:');
console.log(`   Input: ${report.remainingUnmatched.length} unmatched`);
console.log(`   Filtered: ${filtered.length} valid`);
console.log(`   Ready for Spoonacular: ${forSpoonacular.length}`);
console.log();
console.log('Next step: node scripts/parseViaSpoonacular.js');
