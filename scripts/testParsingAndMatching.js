/**
 * Test script for ingredient parsing and matching
 * Validates that preparation is separated from identity
 */

import { parseIngredient } from '../src/utils/ingredientParsing.js';
import { matchIngredient, getMatchStats } from '../src/utils/ingredientMatcher.js';

console.log('🧪 Testing Ingredient Parsing and Matching\n');

// Test cases designed to validate key requirements
const testCases = [
  // Basic parsing
  { raw: '1 cup chopped onion', expected: { identity: 'onion', prep: ['chopped'], state: 'fresh' } },
  { raw: '2 cups diced tomatoes', expected: { identity: 'tomatoes', prep: ['diced'], state: 'fresh' } },
  { raw: '3 cloves garlic, minced', expected: { identity: 'garlic', prep: ['minced'], state: 'fresh' } },
  
  // Fractions
  { raw: '½ tsp salt', expected: { identity: 'salt', prep: [], state: 'other' } },
  { raw: '1 1/2 tbsp olive oil', expected: { identity: 'olive oil', prep: [], state: 'other' } },
  
  // State variations (CRITICAL: canned/frozen are different products)
  { raw: '1 can canned tomatoes', expected: { identity: 'canned tomatoes', prep: [], state: 'canned' } },
  { raw: '2 cups frozen spinach', expected: { identity: 'frozen spinach', prep: [], state: 'frozen' } },
  { raw: '1 cup fresh basil', expected: { identity: 'basil', prep: [], state: 'fresh' } },
  
  // Complex preparation (should be in prep, not identity)
  { raw: '1 large onion, finely chopped', expected: { identity: 'onion', prep: ['finely', 'chopped'], state: 'fresh' } },
  { raw: '3 cups parsley, roughly chopped', expected: { identity: 'parsley', prep: ['roughly', 'chopped'], state: 'fresh' } },
  
  // No quantity
  { raw: 'salt and pepper', expected: { identity: 'salt pepper', prep: [], state: 'other' } },
  
  // Metric units
  { raw: '150g chicken breast', expected: { identity: 'chicken breast', prep: [], state: 'fresh' } },
  { raw: '500ml water', expected: { identity: 'water', prep: [], state: 'other' } }
];

console.log('📋 STAGE 1: PARSING TESTS\n');
console.log('=' .repeat(80));

let parsePassCount = 0;
let parseFailCount = 0;

testCases.forEach((test, index) => {
  const parsed = parseIngredient(test.raw);
  
  console.log(`\nTest ${index + 1}: "${test.raw}"`);
  console.log(`   Identity: "${parsed.identityText}" (expected: "${test.expected.identity}")`);
  console.log(`   State: "${parsed.state}" (expected: "${test.expected.state}")`);
  console.log(`   Preparation: [${parsed.preparation.join(', ')}] (expected: [${test.expected.prep.join(', ')}])`);
  console.log(`   Quantity: ${parsed.quantity} ${parsed.unit || ''}`);
  
  // Check if identity matches (case-insensitive)
  const identityMatch = parsed.identityText.toLowerCase() === test.expected.identity.toLowerCase();
  const stateMatch = parsed.state === test.expected.state;
  const prepMatch = JSON.stringify(parsed.preparation.sort()) === JSON.stringify(test.expected.prep.sort());
  
  if (identityMatch && stateMatch && prepMatch) {
    console.log(`   ✅ PASS`);
    parsePassCount++;
  } else {
    console.log(`   ❌ FAIL`);
    if (!identityMatch) console.log(`      - Identity mismatch`);
    if (!stateMatch) console.log(`      - State mismatch`);
    if (!prepMatch) console.log(`      - Preparation mismatch`);
    parseFailCount++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Parsing Results: ${parsePassCount}/${testCases.length} passed\n`);

// Stage 2: Matching tests
console.log('\n📋 STAGE 2: MATCHING TESTS\n');
console.log('=' .repeat(80));

const matchTestCases = [
  // Exact matches
  { identity: 'onion', state: 'fresh', expectedId: 'onion', minConfidence: 0.95 },
  { identity: 'garlic', state: 'fresh', expectedId: 'garlic', minConfidence: 0.95 },
  { identity: 'olive oil', state: 'other', expectedId: 'olive_oil', minConfidence: 0.95 },
  
  // Alias matches
  { identity: 'yellow onion', state: 'fresh', expectedId: 'onion', minConfidence: 0.9 },
  { identity: 'garlic cloves', state: 'fresh', expectedId: 'garlic', minConfidence: 0.9 },
  { identity: 'fresh parsley', state: 'fresh', expectedId: 'parsley', minConfidence: 0.9 },
  
  // Plural/singular
  { identity: 'onions', state: 'fresh', expectedId: 'onion', minConfidence: 0.9 },
  { identity: 'tomatoes', state: 'fresh', expectedId: 'tomatoes', minConfidence: 0.9 },
  
  // State-aware matching
  { identity: 'canned tomatoes', state: 'canned', expectedId: 'tomatoes_canned', minConfidence: 0.9 },
  
  // Token-based matching
  { identity: 'bell peppers', state: 'fresh', expectedId: 'bell_pepper', minConfidence: 0.7 },
  
  // Should NOT match (unrelated)
  { identity: 'dragon fruit', state: 'fresh', expectedId: null, minConfidence: 0 }
];

let matchPassCount = 0;
let matchFailCount = 0;

matchTestCases.forEach((test, index) => {
  const result = matchIngredient(test.identity, test.state);
  
  console.log(`\nTest ${index + 1}: "${test.identity}" (state: ${test.state})`);
  console.log(`   Matched: ${result.masterId || 'NONE'} (confidence: ${result.confidence.toFixed(2)})`);
  console.log(`   Expected: ${test.expectedId || 'NONE'} (min confidence: ${test.minConfidence})`);
  
  const idMatch = result.masterId === test.expectedId;
  const confidenceOk = result.confidence >= test.minConfidence;
  
  if (idMatch && confidenceOk) {
    console.log(`   ✅ PASS`);
    matchPassCount++;
  } else {
    console.log(`   ❌ FAIL`);
    if (!idMatch) console.log(`      - ID mismatch`);
    if (!confidenceOk) console.log(`      - Confidence too low (${result.confidence.toFixed(2)} < ${test.minConfidence})`);
    matchFailCount++;
  }
  
  if (result.matchedAlias) {
    console.log(`   Info: Matched via "${result.matchedAlias}"`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Matching Results: ${matchPassCount}/${matchTestCases.length} passed\n`);

// Stage 3: Batch matching stats
console.log('\n📋 STAGE 3: BATCH MATCHING STATISTICS\n');
console.log('=' .repeat(80));

const batchTest = [
  { identityText: 'onion', state: 'fresh' },
  { identityText: 'garlic', state: 'fresh' },
  { identityText: 'tomatoes', state: 'fresh' },
  { identityText: 'canned tomatoes', state: 'canned' },
  { identityText: 'bell pepper', state: 'fresh' },
  { identityText: 'mystery ingredient', state: 'other' }
];

const matches = batchTest.map(ing => ({
  input: ing.identityText,
  ...matchIngredient(ing.identityText, ing.state)
}));

const stats = getMatchStats(matches);
console.log('\nBatch Results:');
console.log(`   Total: ${stats.total}`);
console.log(`   Matched: ${stats.matched} (${stats.matchRate})`);
console.log(`   Unmatched: ${stats.unmatched}`);
console.log(`   High confidence (≥0.9): ${stats.highConfidence}`);
console.log(`   Medium confidence (0.7-0.9): ${stats.mediumConfidence}`);
console.log(`   Low confidence (<0.7): ${stats.lowConfidence}\n`);

console.log('=' .repeat(80));

// Final summary
const totalTests = testCases.length + matchTestCases.length;
const totalPass = parsePassCount + matchPassCount;
const totalFail = parseFailCount + matchFailCount;

console.log(`\n🎯 OVERALL RESULTS: ${totalPass}/${totalTests} tests passed`);

if (totalFail === 0) {
  console.log('✅ All tests passed! Parsing and matching utilities are working correctly.\n');
  process.exit(0);
} else {
  console.log(`❌ ${totalFail} test(s) failed. Review implementation.\n`);
  process.exit(1);
}
