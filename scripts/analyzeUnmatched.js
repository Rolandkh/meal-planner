/**
 * Analyze Unmatched Ingredients from Catalog
 * 
 * This script identifies the most common unmatched ingredients
 * so we can add appropriate aliases to the dictionary.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== ANALYZE UNMATCHED INGREDIENTS ===\n');

// Load catalog
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('Loaded:', catalog.recipes.length, 'recipes\n');

// Collect all unmatched ingredients
const unmatchedCounts = new Map();
let totalUnmatched = 0;
let totalMatched = 0;

for (const recipe of catalog.recipes) {
  if (!recipe.normalizationDiagnostics?.unmatchedIngredients) continue;
  
  for (const unmatched of recipe.normalizationDiagnostics.unmatchedIngredients) {
    const key = unmatched.identityText?.toLowerCase() || unmatched.rawText?.toLowerCase();
    if (!key) continue;
    
    const existing = unmatchedCounts.get(key) || { count: 0, examples: [] };
    existing.count++;
    if (existing.examples.length < 3) {
      existing.examples.push({
        recipe: recipe.title,
        raw: unmatched.rawText
      });
    }
    unmatchedCounts.set(key, existing);
    totalUnmatched++;
  }
  
  if (recipe.normalizationDiagnostics?.matched) {
    totalMatched += recipe.normalizationDiagnostics.matched;
  }
}

console.log('=== STATISTICS ===');
console.log(`Total matched: ${totalMatched}`);
console.log(`Total unmatched: ${totalUnmatched}`);
console.log(`Match rate: ${(totalMatched / (totalMatched + totalUnmatched) * 100).toFixed(1)}%`);
console.log();

// Sort by frequency
const sorted = Array.from(unmatchedCounts.entries())
  .sort((a, b) => b[1].count - a[1].count);

console.log('=== TOP 50 UNMATCHED INGREDIENTS ===\n');

for (let i = 0; i < Math.min(50, sorted.length); i++) {
  const [ingredient, data] = sorted[i];
  console.log(`${i + 1}. "${ingredient}" (${data.count} occurrences)`);
  if (data.examples.length > 0) {
    console.log(`   Example: "${data.examples[0].raw}" in "${data.examples[0].recipe}"`);
  }
}

console.log('\n=== FREQUENCY DISTRIBUTION ===');

// Count by frequency buckets
const buckets = {
  '10+': 0,
  '5-9': 0,
  '3-4': 0,
  '2': 0,
  '1': 0
};

for (const [, data] of sorted) {
  if (data.count >= 10) buckets['10+']++;
  else if (data.count >= 5) buckets['5-9']++;
  else if (data.count >= 3) buckets['3-4']++;
  else if (data.count >= 2) buckets['2']++;
  else buckets['1']++;
}

console.log(`10+ occurrences: ${buckets['10+']} ingredients`);
console.log(`5-9 occurrences: ${buckets['5-9']} ingredients`);
console.log(`3-4 occurrences: ${buckets['3-4']} ingredients`);
console.log(`2 occurrences: ${buckets['2']} ingredients`);
console.log(`1 occurrence: ${buckets['1']} ingredients`);

// Save full report
const report = {
  stats: {
    totalMatched,
    totalUnmatched,
    matchRate: (totalMatched / (totalMatched + totalUnmatched) * 100).toFixed(1) + '%'
  },
  topUnmatched: sorted.slice(0, 100).map(([ingredient, data]) => ({
    ingredient,
    count: data.count,
    examples: data.examples
  })),
  frequencyBuckets: buckets
};

const reportPath = path.join(__dirname, '../tmp/unmatched-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n✅ Full report saved to: ${reportPath}`);
