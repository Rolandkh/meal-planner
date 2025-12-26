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
      eaterId: 'eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
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
      eaterId: 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
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
      eaterId: 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
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
    ownerEaterId: 'eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
    weeklyBudget: 150,
    shoppingDay: 6, // Saturday
    preferredStore: 'Coles Caulfield',
    maxShoppingListItems: 30,
    householdEaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'],
    dietaryGoals: 'Balanced diet with variety, keep it practical and budget-friendly',
    onboardingComplete: true,
    weeklySchedule: {
      sunday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: '' },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
      },
      monday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
      },
      tuesday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
      },
      wednesday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
      },
      thursday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
      },
      friday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
      },
      saturday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: '' },
        lunch: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: '' }
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
      recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9',
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
      recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
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
      recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
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
      recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2',
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
      recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3',
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
    { mealId: 'meal_c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2025-12-28', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2025-12-28', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    { mealId: 'meal_e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6', recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', mealType: 'dinner', date: '2025-12-28', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    
    // Sunday
    { mealId: 'meal_f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'breakfast', date: '2025-12-29', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2025-12-29', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9', recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', mealType: 'dinner', date: '2025-12-29', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    
    // Monday
    { mealId: 'meal_c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2025-12-30', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_d6e7f8a9-b0c1-42d3-e4f5-a6b7c8d9e0f1', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2025-12-30', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2', recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', mealType: 'dinner', date: '2025-12-30', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    
    // Tuesday
    { mealId: 'meal_f8a9b0c1-d2e3-44f5-a6b7-c8d9e0f1a2b3', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'breakfast', date: '2025-12-31', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_a9b0c1d2-e3f4-45a6-b7c8-d9e0f1a2b3c4', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2025-12-31', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_b0c1d2e3-f4a5-46b7-c8d9-e0f1a2b3c4d5', recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', mealType: 'dinner', date: '2025-12-31', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    
    // Wednesday
    { mealId: 'meal_c1d2e3f4-a5b6-47c8-d9e0-f1a2b3c4d5e6', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2026-01-01', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_d2e3f4a5-b6c7-48d9-e0f1-a2b3c4d5e6f7', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2026-01-01', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_e3f4a5b6-c7d8-49e0-f1a2-b3c4d5e6f7a8', recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', mealType: 'dinner', date: '2026-01-01', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    
    // Thursday
    { mealId: 'meal_f4a5b6c7-d8e9-40f1-a2b3-c4d5e6f7a8b9', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'breakfast', date: '2026-01-02', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_a5b6c7d8-e9f0-41a2-b3c4-d5e6f7a8b9c0', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2026-01-02', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_b6c7d8e9-f0a1-42b3-c4d5-e6f7a8b9c0d1', recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', mealType: 'dinner', date: '2026-01-02', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' },
    
    // Friday
    { mealId: 'meal_c7d8e9f0-a1b2-43c4-d5e6-f7a8b9c0d1e2', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2026-01-03', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: '' },
    { mealId: 'meal_d8e9f0a1-b2c3-44d5-e6f7-a8b9c0d1e2f3', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2026-01-03', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_e9f0a1b2-c3d4-45e6-f7a8-b9c0d1e2f3a4', recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', mealType: 'dinner', date: '2026-01-03', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: '' }
  ],

  mealPlan: {
    _schemaVersion: 1,
    mealPlanId: 'plan_20251228',
    weekOf: '2025-12-28', // Saturday
    weekEnd: '2026-01-03', // Friday
    createdAt: '2025-12-26T00:00:00.000Z',
    mealIds: [
      'meal_c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4', 'meal_d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5', 'meal_e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6',
      'meal_f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7', 'meal_a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8', 'meal_b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9',
      'meal_c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0', 'meal_d6e7f8a9-b0c1-42d3-e4f5-a6b7c8d9e0f1', 'meal_e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2',
      'meal_f8a9b0c1-d2e3-44f5-a6b7-c8d9e0f1a2b3', 'meal_a9b0c1d2-e3f4-45a6-b7c8-d9e0f1a2b3c4', 'meal_b0c1d2e3-f4a5-46b7-c8d9-e0f1a2b3c4d5',
      'meal_c1d2e3f4-a5b6-47c8-d9e0-f1a2b3c4d5e6', 'meal_d2e3f4a5-b6c7-48d9-e0f1-a2b3c4d5e6f7', 'meal_e3f4a5b6-c7d8-49e0-f1a2-b3c4d5e6f7a8',
      'meal_f4a5b6c7-d8e9-40f1-a2b3-c4d5e6f7a8b9', 'meal_a5b6c7d8-e9f0-41a2-b3c4-d5e6f7a8b9c0', 'meal_b6c7d8e9-f0a1-42b3-c4d5-e6f7a8b9c0d1',
      'meal_c7d8e9f0-a1b2-43c4-d5e6-f7a8b9c0d1e2', 'meal_d8e9f0a1-b2c3-44d5-e6f7-a8b9c0d1e2f3', 'meal_e9f0a1b2-c3d4-45e6-f7a8-b9c0d1e2f3a4'
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

