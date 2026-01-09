/**
 * Development Presets
 * Pre-configured data for testing without going through onboarding
 */

import { 
  saveEaters, 
  saveBaseSpecification,
  saveChatHistory
} from './storage.js';

/**
 * Realistic onboarding conversation history
 */
const ONBOARDING_CONVERSATION = [
  { role: 'assistant', content: "Hi! I'm Vanessa, your meal planning assistant. 🍳\n\nLet's set up your profile together. What are your main dietary goals? (e.g., lose weight, eat healthier, follow a specific diet)" },
  { role: 'user', content: "I want to follow a Mediterranean diet focused on weight loss and anti-inflammatory foods. I'm following the Food Compass guidelines." },
  { role: 'assistant', content: "That sounds like a great, science-backed approach! I can certainly help with that. Are there any foods you don't eat or want to avoid?" },
  { role: 'user', content: "I don't drink caffeine. I limit dairy - yogurt is fine, but I don't really like milk or cream. Also, I want to keep red meat to a minimum. Oh, and I really dislike passion fruit and kiwi." },
  { role: 'assistant', content: "Got it. No caffeine, limited dairy, minimal red meat, and definitely no passion fruit or kiwi. Do you cook for anyone else, like family members with different preferences?" },
  { role: 'user', content: "Yes, I have my daughter Maya (she's 4) with me from Sunday afternoon through Wednesday morning. She likes simple, kid-friendly foods. Also, my friend Cathie visits every Tuesday evening for dinner." },
  { role: 'assistant', content: "Understood! I'll make sure Sunday to Wednesday has kid-friendly options for Maya, and we'll plan a nice Mediterranean dinner for when Cathie visits on Tuesdays. What's your weekly grocery budget?" },
  { role: 'user', content: "About $120 per week. I like to reuse ingredients mid-week to keep costs down." },
  { role: 'assistant', content: "Budgeting and ingredient reuse are my specialties! Which day do you usually do your grocery shopping?" },
  { role: 'user', content: "Saturdays. I also like to do some simple meal prep on Saturdays to get ahead." },
  { role: 'assistant', content: "Perfect. I've noted everything down: Mediterranean/Anti-inflammatory goals, specific exclusions for you, kid-friendly meals for Maya, and a guest for Tuesday dinners, all within a $120 budget with Saturday shopping and prep. Does this all look correct?" },
  { role: 'user', content: "Yes, this all looks perfect! Let's generate the first week." },
  { role: 'assistant', content: "Excellent! You're all set up. 🎉\n\nI've created profiles for your household members and mapped out your weekly meal schedule. Whenever you're ready, I'll create your first personalized meal plan!" }
];

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
      updatedAt: '2025-12-26T00:00:00.000Z',
      dietProfile: 'mediterranean',
      excludeIngredients: ['passion fruit', 'kiwi', 'caffeine', 'red meat'],
      preferIngredients: ['fish', 'vegetables', 'legumes', 'yogurt'],
      personalPreferences: 'Follows Food Compass guidelines. Prefers simple Saturday meal prep.'
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
      updatedAt: '2025-12-26T00:00:00.000Z',
      dietProfile: 'kid-friendly',
      excludeIngredients: [],
      preferIngredients: ['pasta', 'chicken', 'fruit'],
      personalPreferences: 'Likes simple, familiar textures.'
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
      updatedAt: '2025-12-26T00:00:00.000Z',
      dietProfile: 'mediterranean',
      excludeIngredients: [],
      preferIngredients: [],
      personalPreferences: 'Visits for Tuesday dinner.'
    }
  ],

  baseSpecification: {
    _schemaVersion: 2,
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
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] },
        dinner: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] }
      },
      monday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] },
        dinner: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] }
      },
      tuesday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] },
        lunch: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] },
        dinner: { servings: 3, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7', 'eater_c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'], requirements: ['family-dinner', 'special'] }
      },
      wednesday: {
        breakfast: { servings: 2, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6', 'eater_b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'], requirements: ['kid-friendly'] },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] }
      },
      thursday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] }
      },
      friday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] }
      },
      saturday: {
        breakfast: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        lunch: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] },
        dinner: { servings: 1, eaterIds: ['eater_a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'], requirements: [] }
      }
    },
    mealPrepSettings: {
      batchPrepDays: [6],
      prepLevels: {
        monday: { breakfast: 'minimal', lunch: 'medium', dinner: 'medium' },
        tuesday: { breakfast: 'minimal', lunch: 'medium', dinner: 'full' },
        wednesday: { breakfast: 'minimal', lunch: 'minimal', dinner: 'medium' },
        thursday: { breakfast: 'minimal', lunch: 'minimal', dinner: 'medium' },
        friday: { breakfast: 'minimal', lunch: 'minimal', dinner: 'medium' },
        saturday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' },
        sunday: { breakfast: 'medium', lunch: 'medium', dinner: 'medium' }
      }
    },
    chatPreferences: {
      personality: 'friendly',
      communicationStyle: 'concise'
    },
    historyRetentionWeeks: 4,
    createdAt: '2025-12-26T00:00:00.000Z',
    updatedAt: '2025-12-26T00:00:00.000Z'
  }
};

/**
 * Import development preset data
 * Slice 5 UPDATE: Loads conversation + structured data with proper schedule
 * @returns {Object} Result object with success status
 */
export function importDevPreset() {
  try {
    console.log('🔧 Importing development preset (CONVERSATION + DATA + SCHEDULE)...');
    
    // 1. Clear existing relevant data
    localStorage.removeItem('vanessa_meals');
    localStorage.removeItem('vanessa_current_meal_plan');
    localStorage.removeItem('vanessa_recipes');
    
    // 2. Import conversation history
    saveChatHistory(ONBOARDING_CONVERSATION);
    console.log('✓ Imported conversation history (8 messages)');
    
    // 3. Import eaters (with Slice 5 fields including diet profiles)
    const eatersResult = saveEaters(DEV_PRESET.eaters);
    if (!eatersResult.success) {
      throw new Error('Failed to save eaters: ' + eatersResult.error);
    }
    console.log('✓ Imported 3 eaters with diet profiles:');
    console.log('  - Roland (mediterranean profile)');
    console.log('  - Maya (kid-friendly profile)');
    console.log('  - Cathie (mediterranean profile)');
    
    // 4. Import base specification (v2 with weeklySchedule)
    const baseSpecResult = saveBaseSpecification(DEV_PRESET.baseSpecification);
    if (!baseSpecResult.success) {
      throw new Error('Failed to save base specification: ' + baseSpecResult.error);
    }
    console.log('✓ Imported base specification with:');
    console.log('  - Weekly schedule (Maya: Sun afternoon-Wed morning, Cathie: Tue dinner)');
    console.log('  - Meal prep settings (Saturday batch prep)');
    console.log('  - Chat preferences & dietary goals');
    
    console.log('✅ Development preset imported successfully!');
    console.log('   Ready to generate first meal plan with proper household schedule.');
    
    return {
      success: true,
      message: '✅ Setup complete! All profiles, schedules, and preferences loaded.',
      shouldRedirect: true
    };
    
  } catch (error) {
    console.error('❌ Error importing development preset:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
