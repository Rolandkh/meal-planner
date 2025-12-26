/**
 * Development Presets
 * Pre-configured data for testing without going through onboarding
 */

import { 
  saveEaters, 
  saveBaseSpecification, 
  saveRecipes, 
  saveMeals, 
  saveCurrentMealPlan 
} from './storage.js';

/**
 * Development preset: Base specification and sample meal plan
 * Based on user's actual preferences from previous conversations
 */
export const DEV_PRESET = {
  eaters: [
    {
      eaterId: 'eater_dev_001',
      name: 'Roland',
      preferences: 'Varied diet, enjoys trying new recipes',
      allergies: [],
      dietaryRestrictions: [],
      schedule: 'Works from home, flexible meal times',
      isDefault: true,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      eaterId: 'eater_dev_002',
      name: 'Maya',
      preferences: 'Likes simple, familiar foods',
      allergies: [],
      dietaryRestrictions: [],
      schedule: 'School days, dinner at home',
      isDefault: false,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      eaterId: 'eater_dev_003',
      name: 'Cathie',
      preferences: 'Healthy options, Mediterranean style',
      allergies: [],
      dietaryRestrictions: [],
      schedule: 'Variable, not always home for meals',
      isDefault: false,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    }
  ],

  baseSpecification: {
    _schemaVersion: 1,
    ownerEaterId: 'eater_dev_001',
    weeklyBudget: 150,
    shoppingDay: 6, // Saturday
    preferredStore: 'Coles Caulfield',
    maxShoppingListItems: 30,
    householdEaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'],
    dietaryGoals: 'Balanced diet with variety, keep it practical and budget-friendly',
    onboardingComplete: true,
    weeklySchedule: {
      sunday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: '' },
        lunch: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      },
      monday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_dev_001'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      },
      tuesday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_dev_001'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      },
      wednesday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_dev_001'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      },
      thursday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_dev_001'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      },
      friday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_dev_001'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      },
      saturday: {
        breakfast: { servings: 2, eaterIds: ['eater_dev_001', 'eater_dev_002'], requirements: '' },
        lunch: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], requirements: '' }
      }
    },
    chatPreferences: {
      personality: 'friendly',
      communicationStyle: 'concise'
    },
    conversation: {
      startedAt: '2025-12-26T00:00:00.000Z',
      messages: []
    },
    createdAt: '2025-12-26T00:00:00.000Z',
    updatedAt: '2025-12-26T00:00:00.000Z'
  },

  recipes: [
    {
      recipeId: 'recipe_dev_001',
      name: 'Quick Scrambled Eggs',
      ingredients: [
        { name: 'eggs', quantity: 4, unit: 'whole', category: 'dairy' },
        { name: 'butter', quantity: 15, unit: 'g', category: 'dairy' },
        { name: 'milk', quantity: 50, unit: 'ml', category: 'dairy' },
        { name: 'salt', quantity: 2, unit: 'g', category: 'pantry' }
      ],
      instructions: 'Beat eggs with milk. Melt butter in pan over medium heat. Pour in eggs, stir gently until just set. Season with salt.',
      prepTime: 3,
      cookTime: 5,
      servings: 2,
      tags: ['quick', 'breakfast', 'vegetarian'],
      source: 'generated',
      isFavorite: false,
      rating: null,
      timesCooked: 0,
      lastCooked: null,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_dev_002',
      name: 'Chicken Stir Fry',
      ingredients: [
        { name: 'chicken breast', quantity: 500, unit: 'g', category: 'meat' },
        { name: 'mixed vegetables', quantity: 400, unit: 'g', category: 'produce' },
        { name: 'soy sauce', quantity: 30, unit: 'ml', category: 'pantry' },
        { name: 'garlic', quantity: 3, unit: 'whole', category: 'produce' },
        { name: 'ginger', quantity: 15, unit: 'g', category: 'produce' },
        { name: 'rice', quantity: 300, unit: 'g', category: 'pantry' }
      ],
      instructions: 'Cook rice. Slice chicken and stir-fry until golden. Add vegetables, garlic, ginger. Stir-fry 5 minutes. Add soy sauce, toss well. Serve over rice.',
      prepTime: 10,
      cookTime: 15,
      servings: 3,
      tags: ['quick', 'dinner', 'healthy'],
      source: 'generated',
      isFavorite: true,
      rating: 5,
      timesCooked: 3,
      lastCooked: '2025-12-20T00:00:00.000Z',
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_dev_003',
      name: 'Greek Salad',
      ingredients: [
        { name: 'cucumber', quantity: 200, unit: 'g', category: 'produce' },
        { name: 'tomatoes', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'feta cheese', quantity: 150, unit: 'g', category: 'dairy' },
        { name: 'olives', quantity: 100, unit: 'g', category: 'pantry' },
        { name: 'red onion', quantity: 1, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 40, unit: 'ml', category: 'pantry' },
        { name: 'lemon juice', quantity: 20, unit: 'ml', category: 'pantry' }
      ],
      instructions: 'Chop cucumber, tomatoes, and onion. Combine in bowl. Add olives and crumbled feta. Drizzle with olive oil and lemon juice. Toss gently.',
      prepTime: 10,
      cookTime: 0,
      servings: 2,
      tags: ['quick', 'vegetarian', 'lunch', 'healthy'],
      source: 'generated',
      isFavorite: false,
      rating: 4,
      timesCooked: 1,
      lastCooked: null,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_dev_004',
      name: 'Spaghetti Bolognese',
      ingredients: [
        { name: 'ground beef', quantity: 500, unit: 'g', category: 'meat' },
        { name: 'spaghetti', quantity: 400, unit: 'g', category: 'pantry' },
        { name: 'tomato sauce', quantity: 500, unit: 'ml', category: 'pantry' },
        { name: 'onion', quantity: 1, unit: 'whole', category: 'produce' },
        { name: 'garlic', quantity: 3, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 20, unit: 'ml', category: 'pantry' }
      ],
      instructions: 'Cook spaghetti. Sauté onion and garlic in oil. Add beef, brown well. Pour in tomato sauce, simmer 20 minutes. Season to taste. Serve over spaghetti.',
      prepTime: 10,
      cookTime: 30,
      servings: 3,
      tags: ['dinner', 'pasta', 'family-favorite'],
      source: 'generated',
      isFavorite: true,
      rating: 5,
      timesCooked: 5,
      lastCooked: '2025-12-18T00:00:00.000Z',
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_dev_005',
      name: 'Avocado Toast',
      ingredients: [
        { name: 'bread', quantity: 4, unit: 'slices', category: 'pantry' },
        { name: 'avocado', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'lemon juice', quantity: 10, unit: 'ml', category: 'pantry' },
        { name: 'salt', quantity: 2, unit: 'g', category: 'pantry' },
        { name: 'pepper', quantity: 1, unit: 'g', category: 'pantry' }
      ],
      instructions: 'Toast bread. Mash avocado with lemon juice, salt, and pepper. Spread generously on toast. Optional: top with cherry tomatoes or eggs.',
      prepTime: 5,
      cookTime: 2,
      servings: 2,
      tags: ['quick', 'breakfast', 'vegetarian', 'healthy'],
      source: 'generated',
      isFavorite: false,
      rating: 4,
      timesCooked: 2,
      lastCooked: null,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    }
  ],

  meals: [
    // Saturday
    { mealId: 'meal_dev_001', recipeId: 'recipe_dev_001', mealType: 'breakfast', date: '2025-12-28', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_002', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2025-12-28', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    { mealId: 'meal_dev_003', recipeId: 'recipe_dev_002', mealType: 'dinner', date: '2025-12-28', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    
    // Sunday
    { mealId: 'meal_dev_004', recipeId: 'recipe_dev_005', mealType: 'breakfast', date: '2025-12-29', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_005', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2025-12-29', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_006', recipeId: 'recipe_dev_004', mealType: 'dinner', date: '2025-12-29', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    
    // Monday
    { mealId: 'meal_dev_007', recipeId: 'recipe_dev_001', mealType: 'breakfast', date: '2025-12-30', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_008', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2025-12-30', eaterIds: ['eater_dev_001'], servings: 1, notes: '' },
    { mealId: 'meal_dev_009', recipeId: 'recipe_dev_002', mealType: 'dinner', date: '2025-12-30', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    
    // Tuesday
    { mealId: 'meal_dev_010', recipeId: 'recipe_dev_005', mealType: 'breakfast', date: '2025-12-31', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_011', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2025-12-31', eaterIds: ['eater_dev_001'], servings: 1, notes: '' },
    { mealId: 'meal_dev_012', recipeId: 'recipe_dev_004', mealType: 'dinner', date: '2025-12-31', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    
    // Wednesday
    { mealId: 'meal_dev_013', recipeId: 'recipe_dev_001', mealType: 'breakfast', date: '2026-01-01', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_014', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2026-01-01', eaterIds: ['eater_dev_001'], servings: 1, notes: '' },
    { mealId: 'meal_dev_015', recipeId: 'recipe_dev_002', mealType: 'dinner', date: '2026-01-01', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    
    // Thursday
    { mealId: 'meal_dev_016', recipeId: 'recipe_dev_005', mealType: 'breakfast', date: '2026-01-02', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_017', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2026-01-02', eaterIds: ['eater_dev_001'], servings: 1, notes: '' },
    { mealId: 'meal_dev_018', recipeId: 'recipe_dev_004', mealType: 'dinner', date: '2026-01-02', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' },
    
    // Friday
    { mealId: 'meal_dev_019', recipeId: 'recipe_dev_001', mealType: 'breakfast', date: '2026-01-03', eaterIds: ['eater_dev_001', 'eater_dev_002'], servings: 2, notes: '' },
    { mealId: 'meal_dev_020', recipeId: 'recipe_dev_003', mealType: 'lunch', date: '2026-01-03', eaterIds: ['eater_dev_001'], servings: 1, notes: '' },
    { mealId: 'meal_dev_021', recipeId: 'recipe_dev_002', mealType: 'dinner', date: '2026-01-03', eaterIds: ['eater_dev_001', 'eater_dev_002', 'eater_dev_003'], servings: 3, notes: '' }
  ],

  mealPlan: {
    _schemaVersion: 1,
    mealPlanId: 'plan_20251228',
    weekOf: '2025-12-28', // Saturday
    weekEnd: '2026-01-03', // Friday
    createdAt: '2025-12-26T00:00:00.000Z',
    mealIds: [
      'meal_dev_001', 'meal_dev_002', 'meal_dev_003',
      'meal_dev_004', 'meal_dev_005', 'meal_dev_006',
      'meal_dev_007', 'meal_dev_008', 'meal_dev_009',
      'meal_dev_010', 'meal_dev_011', 'meal_dev_012',
      'meal_dev_013', 'meal_dev_014', 'meal_dev_015',
      'meal_dev_016', 'meal_dev_017', 'meal_dev_018',
      'meal_dev_019', 'meal_dev_020', 'meal_dev_021'
    ],
    budget: {
      target: 150,
      estimated: 145
    },
    weeklyPreferences: 'Balanced diet with variety, practical and budget-friendly',
    conversation: {
      messages: []
    }
  }
};

/**
 * Import development preset data
 * Loads pre-configured base spec, eaters, recipes, meals, and meal plan
 * @returns {Object} Result object with success status
 */
export function importDevPreset() {
  try {
    console.log('🔧 Importing development preset...');
    
    // Import eaters
    const eatersResult = saveEaters(DEV_PRESET.eaters);
    if (!eatersResult.success) {
      throw new Error('Failed to save eaters: ' + eatersResult.error);
    }
    console.log('✓ Imported 3 eaters');
    
    // Import base specification
    const baseSpecResult = saveBaseSpecification(DEV_PRESET.baseSpecification);
    if (!baseSpecResult.success) {
      throw new Error('Failed to save base specification: ' + baseSpecResult.error);
    }
    console.log('✓ Imported base specification');
    
    // Import recipes
    const recipesResult = saveRecipes(DEV_PRESET.recipes);
    if (!recipesResult.success) {
      throw new Error('Failed to save recipes: ' + recipesResult.error);
    }
    console.log('✓ Imported 5 recipes');
    
    // Import meals
    const mealsResult = saveMeals(DEV_PRESET.meals);
    if (!mealsResult.success) {
      throw new Error('Failed to save meals: ' + mealsResult.error);
    }
    console.log('✓ Imported 21 meals');
    
    // Import meal plan
    const mealPlanResult = saveCurrentMealPlan(DEV_PRESET.mealPlan);
    if (!mealPlanResult.success) {
      throw new Error('Failed to save meal plan: ' + mealPlanResult.error);
    }
    console.log('✓ Imported meal plan');
    
    console.log('✅ Development preset imported successfully');
    
    return {
      success: true,
      message: 'Development preset loaded: 3 eaters, 5 recipes, 21 meals, 1 week meal plan'
    };
    
  } catch (error) {
    console.error('❌ Error importing development preset:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

