const { parseIngredient } = require('../src/utils/ingredientParsing.js');
const { matchIngredient } = require('../src/utils/ingredientMatcher.js');

const testCases = [
  '283.495 g poached salmon',
  '8 sheets lasagna',
  '28 oz can san marzano tomatoes',
  '1 tsp basil& oregano'
];

console.log('\n🔍 Debugging Unmatched Items:\n');

testCases.forEach(rawText => {
  console.log(`Input: "${rawText}"`);
  const parsed = parseIngredient(rawText);
  console.log(`  Parsed identity: "${parsed.identityText}"`);
  console.log(`  State: ${parsed.state}`);
  
  const match = matchIngredient(parsed.identityText, parsed.state);
  console.log(`  Match: ${match.masterId || 'NO MATCH'} (${Math.round(match.confidence * 100)}%)`);
  console.log('');
});
