/**
 * Test script for ingredient master dictionary loader
 */

import {
  getMasterIngredient,
  getAllMasterIngredients,
  getAllIngredientIds,
  findByAlias,
  getDictionaryStats,
  masterMetadata
} from '../src/utils/ingredientMaster.js';

console.log('📚 Testing Ingredient Master Dictionary Loader\n');

// Test 1: Load metadata
console.log('1️⃣  Metadata:');
console.log(`   Version: ${masterMetadata.version}`);
console.log(`   Last Updated: ${masterMetadata.lastUpdated}`);
console.log(`   Total Entries: ${masterMetadata.totalEntries}`);
console.log(`   Coverage: ${masterMetadata.coverage}\n`);

// Test 2: Get specific ingredients
console.log('2️⃣  Get specific ingredients:');
const onion = getMasterIngredient('onion');
const garlic = getMasterIngredient('garlic');
const missing = getMasterIngredient('unicorn_tears');

console.log(`   onion: ${onion ? '✅ Found' : '❌ Not found'} - ${onion?.displayName}`);
console.log(`   garlic: ${garlic ? '✅ Found' : '❌ Not found'} - ${garlic?.displayName}`);
console.log(`   unicorn_tears: ${missing ? '✅ Found' : '❌ Not found (expected)'}\n`);

// Test 3: Find by alias
console.log('3️⃣  Find by alias:');
const byAlias1 = findByAlias('yellow onion');
const byAlias2 = findByAlias('garlic cloves');
const byAlias3 = findByAlias('fresh basil');

console.log(`   "yellow onion" → ${byAlias1?.id || 'not found'}`);
console.log(`   "garlic cloves" → ${byAlias2?.id || 'not found'}`);
console.log(`   "fresh basil" → ${byAlias3?.id || 'not found'}\n`);

// Test 4: Get all IDs
console.log('4️⃣  All ingredient IDs (first 10):');
const allIds = getAllIngredientIds();
console.log(`   ${allIds.slice(0, 10).join(', ')}...\n`);

// Test 5: Check density data
console.log('5️⃣  Density data sample:');
console.log(`   onion: ${onion?.density?.gPerCup}g/cup, ${onion?.density?.gPerTbsp}g/tbsp`);
console.log(`   garlic: ${garlic?.density?.gPerCup}g/cup, ${garlic?.density?.gPerTbsp}g/tbsp\n`);

// Test 6: Get stats
console.log('6️⃣  Dictionary statistics:');
const stats = getDictionaryStats();
console.log(`   Total ingredients: ${stats.totalIngredients}`);
console.log(`   By state:`, stats.byState);
console.log(`   By unit:`, stats.byUnit);
console.log(`   With density data: ${stats.withDensity}\n`);

// Test 7: Validate required fields
console.log('7️⃣  Validating required fields:');
const all = getAllMasterIngredients();
let validationErrors = 0;

all.forEach(ing => {
  const errors = [];
  if (!ing.id) errors.push('missing id');
  if (!ing.displayName) errors.push('missing displayName');
  if (!ing.canonicalUnit) errors.push('missing canonicalUnit');
  if (!ing.state) errors.push('missing state');
  if (!Array.isArray(ing.aliases)) errors.push('missing/invalid aliases');
  
  if (errors.length > 0) {
    console.log(`   ❌ ${ing.id || 'unknown'}: ${errors.join(', ')}`);
    validationErrors++;
  }
});

if (validationErrors === 0) {
  console.log(`   ✅ All ${all.length} ingredients have required fields\n`);
} else {
  console.log(`   ❌ Found ${validationErrors} validation errors\n`);
}

console.log('✅ All tests complete!\n');
