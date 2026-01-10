import { calculateIngredientCost } from '../src/utils/costCalculator.js';

// Test pricing calculation
const walnutsData = {
  pricing: {
    averagePrice: 7,
    unit: 'g',
    unitSize: '200g',
    pricePerKg: 35
  }
};

const quinoaData = {
  pricing: {
    averagePrice: 6.5,
    unit: 'g',
    unitSize: '500g',
    pricePerKg: 13
  }
};

console.log('Testing Pricing Calculation:\n');

const walnutCost = calculateIngredientCost(56.7, walnutsData);
console.log('Walnuts (56.7g) at $35/kg:');
console.log('  Calculated: $' + walnutCost.toFixed(2));
console.log('  Expected:   $1.98');
console.log('  Match:', Math.abs(walnutCost - 1.98) < 0.01 ? '✓' : '✗\n');

const quinoaCost = calculateIngredientCost(170, quinoaData);
console.log('\nQuinoa (170g) at $13/kg:');
console.log('  Calculated: $' + quinoaCost.toFixed(2));
console.log('  Expected:   $2.21');
console.log('  Match:', Math.abs(quinoaCost - 2.21) < 0.01 ? '✓' : '✗');
