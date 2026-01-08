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
      preferences: 'Mediterranean diet, anti-inflammatory foods, minimal red meat, loves fish and vegetables, prefers simple meal prep. Dislikes passion fruit and kiwi.',
      allergies: [],
      dietaryRestrictions: ['No caffeine', 'Limit dairy (yogurt ok, milk/cream not preferred)', 'Minimal red meat'],
      schedule: 'Has Maya Sun afternoon-Wed morning. Meal prep on Saturdays.',
      isDefault: true,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      eaterId: 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
      name: 'Maya',
      preferences: '4 years old, likes simple kid-friendly foods',
      allergies: [],
      dietaryRestrictions: [],
      schedule: 'With dad Sunday afternoon through Wednesday morning',
      isDefault: false,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      eaterId: 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8',
      name: 'Cathie',
      preferences: 'Mediterranean style, healthy options',
      allergies: [],
      dietaryRestrictions: [],
      schedule: 'Visits Tuesday evenings for dinner',
      isDefault: false,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    }
  ],

  baseSpecification: {
    _schemaVersion: 1,
    ownerEaterId: 'eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
    weeklyBudget: 120,
    shoppingDay: 6, // Saturday
    preferredStore: 'Coles Caulfield',
    maxShoppingListItems: 30,
    householdEaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'],
    dietaryGoals: 'Weight loss, anti-inflammatory Mediterranean diet following Food Compass guidelines. Focus on fish, vegetables, legumes, yogurt. Minimal red meat. No caffeine. Reuse ingredients mid-week to minimize cost. Simple Saturday meal prep.',
    onboardingComplete: true,
    weeklySchedule: {
      sunday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, Maya arrives for lunch' },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Kid-friendly' },
        dinner: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Kid-friendly' }
      },
      monday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick, easy, kid-friendly' },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Simple, kid-friendly' },
        dinner: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Kid-friendly' }
      },
      tuesday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick, easy, kid-friendly' },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Simple, kid-friendly' },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: 'Cathie visits, nice Mediterranean meal' }
      },
      wednesday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: 'Quick, easy, kid-friendly - Maya leaves after breakfast' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, use leftovers' },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland' }
      },
      thursday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, quick' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, use leftovers' },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland' }
      },
      friday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, quick' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, use leftovers' },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland' }
      },
      saturday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland, shopping and meal prep day' },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland' },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: 'Just Roland' }
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
      name: 'Greek Yogurt Breakfast Bowl',
      ingredients: [
        { name: 'Greek yogurt', quantity: 400, unit: 'g', category: 'dairy' },
        { name: 'honey', quantity: 20, unit: 'ml', category: 'pantry' },
        { name: 'mixed berries', quantity: 200, unit: 'g', category: 'produce' },
        { name: 'walnuts', quantity: 50, unit: 'g', category: 'pantry' },
        { name: 'chia seeds', quantity: 15, unit: 'g', category: 'pantry' }
      ],
      instructions: 'Divide Greek yogurt into bowls. Top with fresh berries, crushed walnuts, and chia seeds. Drizzle with honey. Mix before eating.',
      prepTime: 5,
      cookTime: 0,
      servings: 2,
      tags: ['quick', 'breakfast', 'vegetarian', 'mediterranean', 'kid-friendly'],
      source: 'generated',
      isFavorite: true,
      rating: 5,
      timesCooked: 8,
      lastCooked: '2025-12-22T00:00:00.000Z',
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0',
      name: 'Mediterranean Baked Salmon',
      ingredients: [
        { name: 'salmon fillets', quantity: 600, unit: 'g', category: 'seafood' },
        { name: 'cherry tomatoes', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'kalamata olives', quantity: 100, unit: 'g', category: 'pantry' },
        { name: 'lemon', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'garlic', quantity: 4, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 45, unit: 'ml', category: 'pantry' },
        { name: 'fresh dill', quantity: 10, unit: 'g', category: 'produce' },
        { name: 'baby potatoes', quantity: 500, unit: 'g', category: 'produce' }
      ],
      instructions: 'Preheat oven to 200°C. Place salmon in baking dish with halved baby potatoes. Top with cherry tomatoes, olives, sliced garlic, and lemon slices. Drizzle with olive oil, season with salt and pepper. Bake 20 minutes. Garnish with fresh dill.',
      prepTime: 10,
      cookTime: 20,
      servings: 3,
      tags: ['dinner', 'seafood', 'mediterranean', 'anti-inflammatory', 'prep-ahead'],
      source: 'generated',
      isFavorite: true,
      rating: 5,
      timesCooked: 6,
      lastCooked: '2025-12-19T00:00:00.000Z',
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1',
      name: 'Chickpea & Vegetable Stew',
      ingredients: [
        { name: 'chickpeas (canned)', quantity: 800, unit: 'g', category: 'pantry' },
        { name: 'diced tomatoes (canned)', quantity: 800, unit: 'g', category: 'pantry' },
        { name: 'carrots', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'zucchini', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'onion', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'garlic', quantity: 4, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 40, unit: 'ml', category: 'pantry' },
        { name: 'cumin', quantity: 5, unit: 'g', category: 'pantry' },
        { name: 'paprika', quantity: 5, unit: 'g', category: 'pantry' },
        { name: 'vegetable stock', quantity: 500, unit: 'ml', category: 'pantry' }
      ],
      instructions: 'Sauté diced onion and garlic in olive oil. Add diced carrots, cook 5 min. Add zucchini, cumin, paprika. Stir in chickpeas, tomatoes, and stock. Simmer 25 minutes until vegetables are tender. Season with salt and pepper. Serve with crusty bread.',
      prepTime: 15,
      cookTime: 30,
      servings: 6,
      tags: ['dinner', 'vegetarian', 'mediterranean', 'batch-cook', 'kid-friendly', 'legumes', 'anti-inflammatory'],
      source: 'generated',
      isFavorite: true,
      rating: 5,
      timesCooked: 4,
      lastCooked: '2025-12-15T00:00:00.000Z',
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2',
      name: 'Lemon Herb Chicken with Roasted Vegetables',
      ingredients: [
        { name: 'chicken breast', quantity: 500, unit: 'g', category: 'meat' },
        { name: 'bell peppers', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'red onion', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'zucchini', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'lemon', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'garlic', quantity: 4, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 40, unit: 'ml', category: 'pantry' },
        { name: 'dried oregano', quantity: 5, unit: 'g', category: 'pantry' },
        { name: 'fresh parsley', quantity: 15, unit: 'g', category: 'produce' }
      ],
      instructions: 'Marinate chicken in lemon juice, olive oil, oregano, and garlic for 30 min (or prep ahead). Chop vegetables into chunks. Preheat oven to 200°C. Arrange chicken and vegetables on baking tray. Roast 25-30 minutes until chicken is cooked through. Garnish with fresh parsley.',
      prepTime: 15,
      cookTime: 30,
      servings: 3,
      tags: ['dinner', 'mediterranean', 'anti-inflammatory', 'prep-ahead'],
      source: 'generated',
      isFavorite: false,
      rating: 4,
      timesCooked: 2,
      lastCooked: null,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3',
      name: 'Hummus Pasta with Cherry Tomatoes',
      ingredients: [
        { name: 'whole wheat pasta', quantity: 300, unit: 'g', category: 'pantry' },
        { name: 'hummus', quantity: 200, unit: 'g', category: 'pantry' },
        { name: 'cherry tomatoes', quantity: 300, unit: 'g', category: 'produce' },
        { name: 'baby spinach', quantity: 150, unit: 'g', category: 'produce' },
        { name: 'garlic', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 30, unit: 'ml', category: 'pantry' },
        { name: 'lemon juice', quantity: 20, unit: 'ml', category: 'pantry' },
        { name: 'pine nuts', quantity: 40, unit: 'g', category: 'pantry' }
      ],
      instructions: 'Cook pasta according to package directions. In a pan, sauté garlic and halved cherry tomatoes in olive oil until softened. Add spinach, wilt briefly. Drain pasta, reserving 1 cup pasta water. Toss pasta with hummus, adding pasta water to create creamy sauce. Mix in tomatoes and spinach. Top with toasted pine nuts and lemon juice.',
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      tags: ['quick', 'vegetarian', 'lunch', 'dinner', 'kid-friendly', 'mediterranean', 'legumes'],
      source: 'generated',
      isFavorite: true,
      rating: 5,
      timesCooked: 7,
      lastCooked: '2025-12-21T00:00:00.000Z',
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    },
    {
      recipeId: 'recipe_c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4',
      name: 'Mediterranean White Fish with Green Beans',
      ingredients: [
        { name: 'white fish fillets (cod or snapper)', quantity: 600, unit: 'g', category: 'seafood' },
        { name: 'green beans', quantity: 400, unit: 'g', category: 'produce' },
        { name: 'lemon', quantity: 2, unit: 'whole', category: 'produce' },
        { name: 'garlic', quantity: 3, unit: 'whole', category: 'produce' },
        { name: 'olive oil', quantity: 40, unit: 'ml', category: 'pantry' },
        { name: 'fresh parsley', quantity: 15, unit: 'g', category: 'produce' },
        { name: 'almonds (sliced)', quantity: 40, unit: 'g', category: 'pantry' }
      ],
      instructions: 'Steam green beans until tender-crisp, about 8 minutes. Pan-fry fish in olive oil with minced garlic, 4-5 minutes per side until flaky. Squeeze fresh lemon juice over fish. Toss green beans with olive oil, toasted almond slices, and parsley. Serve together.',
      prepTime: 10,
      cookTime: 12,
      servings: 3,
      tags: ['quick', 'dinner', 'seafood', 'mediterranean', 'anti-inflammatory'],
      source: 'generated',
      isFavorite: false,
      rating: null,
      timesCooked: 0,
      lastCooked: null,
      createdAt: '2025-12-26T00:00:00.000Z',
      updatedAt: '2025-12-26T00:00:00.000Z'
    }
  ],

  meals: [
    // Saturday (meal prep day, just Roland)
    { mealId: 'meal_sat1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2025-12-28', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Prep chickpea stew for the week' },
    { mealId: 'meal_sat2', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'lunch', date: '2025-12-28', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Quick lunch while prepping' },
    { mealId: 'meal_sat3', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'dinner', date: '2025-12-28', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 2, notes: 'Make 6 servings chickpea stew for week' },
    
    // Sunday (Maya arrives for lunch)
    { mealId: 'meal_sun1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2025-12-29', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Just Roland before Maya arrives' },
    { mealId: 'meal_sun2', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'lunch', date: '2025-12-29', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Maya-friendly quick lunch' },
    { mealId: 'meal_sun3', recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', mealType: 'dinner', date: '2025-12-29', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Healthy salmon dinner' },
    
    // Monday (all day with Maya)
    { mealId: 'meal_mon1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2025-12-30', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Quick breakfast' },
    { mealId: 'meal_mon2', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2025-12-30', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Leftover chickpea stew' },
    { mealId: 'meal_mon3', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'dinner', date: '2025-12-30', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Maya-friendly pasta' },
    
    // Tuesday (Maya all day, Cathie for dinner)
    { mealId: 'meal_tue1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2025-12-31', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Quick breakfast' },
    { mealId: 'meal_tue2', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2025-12-31', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Leftover chickpea stew' },
    { mealId: 'meal_tue3', recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', mealType: 'dinner', date: '2025-12-31', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], servings: 3, notes: 'Nice dinner with Cathie' },
    
    // Wednesday (Maya until breakfast, then just Roland)
    { mealId: 'meal_wed1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2026-01-01', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], servings: 2, notes: 'Last breakfast with Maya' },
    { mealId: 'meal_wed2', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2026-01-01', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Leftover chickpea stew' },
    { mealId: 'meal_wed3', recipeId: 'recipe_c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4', mealType: 'dinner', date: '2026-01-01', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Light fish dinner' },
    
    // Thursday (just Roland)
    { mealId: 'meal_thu1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2026-01-02', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_thu2', recipeId: 'recipe_f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1', mealType: 'lunch', date: '2026-01-02', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Leftover chickpea stew' },
    { mealId: 'meal_thu3', recipeId: 'recipe_a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2', mealType: 'dinner', date: '2026-01-02', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Leftover chicken' },
    
    // Friday (just Roland)
    { mealId: 'meal_fri1', recipeId: 'recipe_d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9', mealType: 'breakfast', date: '2026-01-03', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: '' },
    { mealId: 'meal_fri2', recipeId: 'recipe_b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3', mealType: 'lunch', date: '2026-01-03', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Quick pasta' },
    { mealId: 'meal_fri3', recipeId: 'recipe_e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0', mealType: 'dinner', date: '2026-01-03', eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], servings: 1, notes: 'Salmon dinner' }
  ],

  mealPlan: {
    _schemaVersion: 1,
    mealPlanId: 'plan_20251228',
    weekOf: '2025-12-28', // Saturday
    weekEnd: '2026-01-03', // Friday
    createdAt: '2025-12-26T00:00:00.000Z',
    mealIds: [
      'meal_sat1', 'meal_sat2', 'meal_sat3',
      'meal_sun1', 'meal_sun2', 'meal_sun3',
      'meal_mon1', 'meal_mon2', 'meal_mon3',
      'meal_tue1', 'meal_tue2', 'meal_tue3',
      'meal_wed1', 'meal_wed2', 'meal_wed3',
      'meal_thu1', 'meal_thu2', 'meal_thu3',
      'meal_fri1', 'meal_fri2', 'meal_fri3'
    ],
    budget: {
      target: 120,
      estimated: 115
    },
    summary: 'Mediterranean weight loss week',
    weeklyPreferences: 'Mediterranean diet focused on weight loss and anti-inflammatory foods. Following Food Compass guidelines with emphasis on fish, vegetables, legumes, and yogurt. Minimal red meat, no caffeine. Simple Saturday meal prep with ingredient reuse to minimize costs. Kid-friendly meals for Maya (4yo) Sun-Wed morning.',
    conversation: {
      messages: []
    }
  }
};

/**
 * Import development preset data
 * Slice 5 UPDATE: Only loads onboarding data (eaters + base spec)
 * Does NOT create recipes/meals - those will come from catalog when you generate!
 * @returns {Object} Result object with success status
 */
export function importDevPreset() {
  try {
    console.log('🔧 Importing development preset (ONBOARDING ONLY)...');
    
    // Import eaters
    const eatersResult = saveEaters(DEV_PRESET.eaters);
    if (!eatersResult.success) {
      throw new Error('Failed to save eaters: ' + eatersResult.error);
    }
    console.log('✓ Imported 3 eaters (Roland, Maya, Cathie)');
    
    // Import base specification
    const baseSpecResult = saveBaseSpecification(DEV_PRESET.baseSpecification);
    if (!baseSpecResult.success) {
      throw new Error('Failed to save base specification: ' + baseSpecResult.error);
    }
    console.log('✓ Imported base specification (preferences, schedule, budget)');
    
    // SLICE 5 CHANGE: Skip recipes, meals, and meal plan
    // User will generate fresh meal plan using the catalog!
    console.log('⏭️  Skipped recipes/meals (will use catalog when you generate)');
    
    console.log('✅ Development preset imported successfully');
    console.log('📋 Next step: Click "Generate Week" to create meal plan from catalog!');
    
    return {
      success: true,
      message: '✅ Onboarding complete! 3 eaters loaded (Roland, Maya, Cathie). Ready to generate meal plan from 607-recipe catalog!'
    };
    
  } catch (error) {
    console.error('❌ Error importing development preset:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

