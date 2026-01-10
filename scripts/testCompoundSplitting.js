/**
 * Test Compound Ingredient Splitting
 * 
 * Validates that the compound splitting utility works correctly
 * for various edge cases and patterns.
 */

import { splitCompoundIngredient, getCompoundStats } from '../src/utils/ingredientCompoundSplit.js';

console.log('=== COMPOUND INGREDIENT SPLITTING TESTS ===\n');

// Test cases: [input, expected_isCompound, expected_components]
const testCases = [
  // TRUE POSITIVES: Should split
  {
    input: 'salt and pepper',
    shouldSplit: true,
    expected: ['salt', 'pepper'],
    connector: 'and'
  },
  {
    input: 'onion & garlic',
    shouldSplit: true,
    expected: ['onion', 'garlic'],
    connector: 'and'
  },
  {
    input: 'carrots, peas and corn',
    shouldSplit: true,
    expected: ['carrots', 'peas', 'corn'],
    connector: 'and' // Mixed comma+and pattern - 'and' takes precedence
  },
  {
    input: 'chicken thighs and legs',
    shouldSplit: true,
    expected: ['chicken thighs', 'legs'],
    connector: 'and'
  },
  {
    input: 'basil and basil sprig',
    shouldSplit: true,
    expected: ['basil', 'basil sprig'],
    connector: 'and'
  },
  {
    input: 'rosemary and thyme',
    shouldSplit: true,
    expected: ['rosemary', 'thyme'],
    connector: 'and'
  },
  {
    input: 'flour and 3 tbsp',
    shouldSplit: true,
    expected: ['flour', '3 tbsp'],
    connector: 'and'
  },
  {
    input: 'monterey jack and cheddar',
    shouldSplit: true,
    expected: ['monterey jack', 'cheddar'],
    connector: 'and'
  },
  
  // FALSE POSITIVES: Should NOT split (product names)
  {
    input: 'sweet and sour sauce',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: 'cookies and cream ice cream',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: 'mac and cheese',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: 'pork and beans',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: 'fish and chips',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: 'cream sauce',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  
  // EDGE CASES
  {
    input: 'garlic',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: 'a',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: '',
    shouldSplit: false,
    expected: null,
    connector: null
  },
  {
    input: '1 and 2',
    shouldSplit: false,
    expected: null,
    connector: null
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = splitCompoundIngredient(test.input);
  
  const isCorrect = 
    result.isCompound === test.shouldSplit &&
    result.connectorType === test.connector &&
    (test.shouldSplit ? 
      JSON.stringify(result.components) === JSON.stringify(test.expected) :
      result.components === null);
  
  if (isCorrect) {
    passed++;
    console.log(`✅ Test ${index + 1}: "${test.input}"`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: "${test.input}"`);
    console.log(`   Expected: ${test.shouldSplit ? JSON.stringify(test.expected) : 'no split'}`);
    console.log(`   Got:      ${result.isCompound ? JSON.stringify(result.components) : 'no split'}`);
    console.log(`   Connector: expected=${test.connector}, got=${result.connectorType}`);
  }
});

console.log(`\n=== TEST RESULTS ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log(`Pass Rate: ${(passed / testCases.length * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Review compound splitting logic.');
}

// Test with real unmatched data
console.log('\n=== REAL DATA TEST (Sample from diagnostics) ===\n');

const realExamples = [
  'chicken thighs and legs',
  'basil and basil sprig',
  'chicken stock and 2 cups water',
  'water and 2 packets chicken boullion',
  'rosemary and thyme',
  'pepper and liquid aminos',
  'montery jack & cheddar cheese mix',
  'habanero sauce and chile',
  'flour and 3 tbsp'
];

const stats = getCompoundStats(realExamples);
console.log('Real Examples Statistics:');
console.log(`Total: ${stats.total}`);
console.log(`Compounds detected: ${stats.compounds}`);
console.log(`Simple ingredients: ${stats.simple}`);
console.log(`Compound rate: ${stats.compoundRate}`);
console.log();
console.log('Examples:');
stats.examples.forEach(ex => {
  console.log(`  "${ex.raw}" → [${ex.components.map(c => `"${c}"`).join(', ')}] (${ex.connectorType})`);
});

console.log('\n=== TEST COMPLETE ===');
