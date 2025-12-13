/**
 * Meal Plan Data Loader
 * Loads meal plan data, checking for generated plans first
 */

import { MEAL_PLAN_DATA as DEFAULT_DATA } from './mealPlanData.js';

/**
 * Get the current meal plan data
 * Checks localStorage for generated plans first, falls back to default
 */
export function getMealPlanData() {
  try {
    const saved = localStorage.getItem('currentMealPlan');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate it has the required structure
      if (parsed.days && parsed.shopping && parsed.budget) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading saved meal plan:', e);
  }
  
  // Return default data
  return DEFAULT_DATA;
}

/**
 * Clear the generated meal plan and use default
 */
export function clearGeneratedPlan() {
  localStorage.removeItem('currentMealPlan');
}
