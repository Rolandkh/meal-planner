/**
 * Test file for eater grouping utility
 * Demonstrates multi-profile household functionality
 */

import { groupEatersByCompatibleProfiles, needsMultiProfileGeneration, formatEaterNames } from '../eaterGrouping.js';

// Test data
const mockEaters = {
  ketoMom: { eaterId: '1', name: 'Mom', dietProfile: 'keto' },
  veganDad: { eaterId: '2', name: 'Dad', dietProfile: 'vegan' },
  flexiKids: { eaterId: '3', name: 'Kids', dietProfile: 'kid-friendly' },
  vegetarianGrandma: { eaterId: '4', name: 'Grandma', dietProfile: 'vegetarian' }
};

console.log('🧪 Testing Eater Grouping Utility\n');

// Test 1: Keto + Vegan conflict
console.log('Test 1: Keto + Vegan (should conflict)');
const test1 = [mockEaters.ketoMom, mockEaters.veganDad];
const groups1 = groupEatersByCompatibleProfiles(test1);
console.log('Groups:', groups1);
console.log('Needs multi-profile?', needsMultiProfileGeneration(test1));
console.log('Expected: 2 groups (Mom alone, Dad alone)\n');

// Test 2: Keto + Vegan + Kid-Friendly
console.log('Test 2: Keto + Vegan + Kid-Friendly');
const test2 = [mockEaters.ketoMom, mockEaters.veganDad, mockEaters.flexiKids];
const groups2 = groupEatersByCompatibleProfiles(test2);
console.log('Groups:', groups2);
console.log('Expected: 2 groups, Kids in both\n');

// Test 3: All Mediterranean (no conflict)
console.log('Test 3: All Mediterranean (no conflict)');
const test3 = [
  { eaterId: '1', name: 'Mom', dietProfile: 'mediterranean' },
  { eaterId: '2', name: 'Dad', dietProfile: 'mediterranean' }
];
const groups3 = groupEatersByCompatibleProfiles(test3);
console.log('Groups:', groups3);
console.log('Needs multi-profile?', needsMultiProfileGeneration(test3));
console.log('Expected: 1 group (all together)\n');

// Test 4: Format eater names
console.log('Test 4: Format eater names');
const allEaters = Object.values(mockEaters);
const formatted = formatEaterNames(['1', '3'], allEaters);
console.log('Result:', formatted);
console.log('Expected: "Mom, Kids"\n');

console.log('✅ All tests complete!');
