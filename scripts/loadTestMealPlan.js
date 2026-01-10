/**
 * Load Test Meal Plan Script
 * 
 * This script loads a saved raw AI output and processes it through
 * the meal plan transformer to populate localStorage for testing.
 * 
 * Usage: Run this from the browser console after pasting the content
 */

import { transformMealPlan } from '../src/utils/mealPlanTransformer.js';
import { saveCurrentMealPlan, saveRecipes, saveMeals } from '../src/utils/storage.js';

// The raw AI output from a previous generation
const rawData = {
  "weekOf": "2026-01-17",
  "budget": { "estimated": 85 },
  "days": [
    {
      "date": "2026-01-17",
      "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
      "lunch": { "name": "Greek Yogurt Chicken Salad", "servings": 1, "fromCatalog": true },
      "dinner": { "name": "Greek-Style Baked Fish: Fresh, Simple, and Delicious", "servings": 1, "fromCatalog": true }
    },
    {
      "date": "2026-01-18",
      "breakfast": {
        "name": "Greek Yogurt with Banana",
        "servings": 1,
        "fromCatalog": false,
        "ingredients": [
          { "name": "greek yogurt", "quantity": 200, "unit": "g", "category": "dairy" },
          { "name": "banana", "quantity": 1, "unit": "whole", "category": "produce" },
          { "name": "honey", "quantity": 15, "unit": "ml", "category": "pantry" }
        ],
        "instructions": "Place yogurt in bowl, slice banana on top, drizzle with honey.",
        "prepTime": 2, "cookTime": 0,
        "tags": ["quick", "breakfast", "kid-friendly"]
      },
      "lunch": { "name": "Italian Tuna Pasta", "servings": 2, "fromCatalog": true },
      "dinner": {
        "name": "Simple Chicken with Vegetables",
        "servings": 2,
        "fromCatalog": false,
        "ingredients": [
          { "name": "chicken breast", "quantity": 300, "unit": "g", "category": "meat" },
          { "name": "zucchini", "quantity": 200, "unit": "g", "category": "produce" },
          { "name": "cherry tomatoes", "quantity": 150, "unit": "g", "category": "produce" },
          { "name": "olive oil", "quantity": 30, "unit": "ml", "category": "pantry" }
        ],
        "instructions": "Season chicken with salt and pepper, bake at 200°C for 20 minutes. Sauté vegetables in olive oil until tender.",
        "prepTime": 10, "cookTime": 20,
        "tags": ["kid-friendly", "simple", "dinner"]
      }
    },
    {
      "date": "2026-01-19",
      "breakfast": {
        "name": "Greek Yogurt with Banana",
        "servings": 2,
        "fromCatalog": false,
        "ingredients": [
          { "name": "greek yogurt", "quantity": 400, "unit": "g", "category": "dairy" },
          { "name": "banana", "quantity": 2, "unit": "whole", "category": "produce" },
          { "name": "honey", "quantity": 30, "unit": "ml", "category": "pantry" }
        ],
        "instructions": "Place yogurt in bowl, slice banana on top, drizzle with honey.",
        "prepTime": 2, "cookTime": 0,
        "tags": ["quick", "breakfast", "kid-friendly"]
      },
      "lunch": { "name": "Easy Cheesy Pizza Casserole", "servings": 2, "fromCatalog": true },
      "dinner": { "name": "Salmon Quinoa Risotto", "servings": 2, "fromCatalog": true }
    },
    {
      "date": "2026-01-20",
      "breakfast": {
        "name": "Greek Yogurt with Banana",
        "servings": 2,
        "fromCatalog": false,
        "ingredients": [
          { "name": "greek yogurt", "quantity": 400, "unit": "g", "category": "dairy" },
          { "name": "banana", "quantity": 2, "unit": "whole", "category": "produce" },
          { "name": "honey", "quantity": 30, "unit": "ml", "category": "pantry" }
        ],
        "instructions": "Place yogurt in bowl, slice banana on top, drizzle with honey.",
        "prepTime": 2, "cookTime": 0,
        "tags": ["quick", "breakfast", "kid-friendly"]
      },
      "lunch": { "name": "Italian Tuna Pasta", "servings": 2, "fromCatalog": true },
      "dinner": { "name": "Greek Chicken Sheet Pan Dinner with Green Beans and Feta", "servings": 3, "fromCatalog": true }
    },
    {
      "date": "2026-01-21",
      "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 2, "fromCatalog": true },
      "lunch": { "name": "Light Greek Lemon Chicken Orzo Soup", "servings": 1, "fromCatalog": true },
      "dinner": { "name": "Greek-Style Baked Fish: Fresh, Simple, and Delicious", "servings": 1, "fromCatalog": true }
    },
    {
      "date": "2026-01-22",
      "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
      "lunch": { "name": "Great Greek Salad", "servings": 1, "fromCatalog": true },
      "dinner": { "name": "Baked Ratatouille", "servings": 1, "fromCatalog": true }
    },
    {
      "date": "2026-01-23",
      "breakfast": { "name": "Peach and Pistachio Greek Yogurt Bowl", "servings": 1, "fromCatalog": true },
      "lunch": { "name": "Greek Yogurt Chicken Salad", "servings": 1, "fromCatalog": true },
      "dinner": { "name": "Salmon Quinoa Risotto", "servings": 1, "fromCatalog": true }
    }
  ]
};

async function loadTestData() {
  console.log('🚀 Loading test meal plan data...');
  
  try {
    // Transform the raw data
    const transformed = transformMealPlan(rawData);
    console.log('✅ Transformed:', transformed);
    
    // Save to localStorage
    saveCurrentMealPlan(transformed.mealPlan);
    saveRecipes(transformed.recipes);
    saveMeals(transformed.meals);
    
    console.log('✅ Test data loaded! Refresh the page and go to Shopping List');
    return transformed;
  } catch (error) {
    console.error('❌ Error loading test data:', error);
    throw error;
  }
}

// Export for browser use
window.loadTestData = loadTestData;

export { loadTestData, rawData };
