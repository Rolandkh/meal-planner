import { calculateIngredientCost } from '../src/utils/costCalculator.js';

const ricottaData = {
  pricing: {
    averagePrice: 3,
    unit: 'g',
    unitSize: '250-500g',
    pricePerKg: 6,
    typicalWeight: 500
  }
};

const cost = calculateIngredientCost(453.592, ricottaData);
console.log('Ricotta (453.592g) at $6/kg:');
console.log('  Calculated: $' + cost.toFixed(2));
console.log('  Expected:   $2.72');
console.log('  Match:', Math.abs(cost - 2.72) < 0.01 ? '✓' : '✗');
