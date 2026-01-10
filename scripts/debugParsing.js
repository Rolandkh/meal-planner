import { parseIngredient } from '../src/utils/ingredientParsing.js';
import { matchIngredient } from '../src/utils/ingredientMatcher.js';

const testIngredients = [
  'cumin',
  'oregano',
  'honey',
  'green onions',
  'spinach',
  'thyme',
  'paprika',
  'coriander',
  'turmeric'
];

console.log('🔍 Debug Parsing and Matching\n');

testIngredients.forEach(raw => {
  const parsed = parseIngredient(raw);
  const match = matchIngredient(parsed.identityText, parsed.state);
  
  console.log(`"${raw}"`);
  console.log(`   Parsed identity: "${parsed.identityText}", state: "${parsed.state}"`);
  console.log(`   Match: ${match.masterId || 'NONE'} (confidence: ${match.confidence.toFixed(2)})`);
  console.log('');
});
