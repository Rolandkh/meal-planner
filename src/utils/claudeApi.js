/**
 * Claude API Service
 * Handles communication with Anthropic's Claude API for meal plan generation
 */

/**
 * Generate a meal plan using Claude API
 * Now uses serverless function to keep API key secure
 * @param {string} apiKey - Not used anymore (kept for backward compatibility)
 * @param {string} userPrompt - User's weekly preferences
 * @param {number} budgetTarget - Budget target in dollars
 * @param {string} store - Store identifier
 * @param {Array} feedbackHistory - Previous feedback (last 8 weeks)
 * @returns {Promise<Object>} Generated meal plan data
 */
export async function generateMealPlan(apiKey, userPrompt, budgetTarget, store, feedbackHistory = []) {
  try {
    // Call our serverless function instead of Claude directly
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userPrompt,
        budgetTarget,
        store,
        feedbackHistory
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const mealPlan = await response.json();

    // Transform the response
    return transformMealPlanResponse(mealPlan, budgetTarget);
  } catch (error) {
    console.error('Meal plan generation error:', error);
    throw error;
  }
}

/**
 * Load base specification from the spec file
 */
async function loadBaseSpecification() {
  try {
    const response = await fetch('/meal-planner-app-spec.md');
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    console.warn('Could not load spec file, using embedded version');
  }
  
  // Fallback: return key parts of the spec
  return `Meal Planner App Specification

## ROLAND'S MEAL PLAN
- Breakfast: 8:00 AM (Protein bar)
- Lunch: 12:30 PM (Protein bar + ~600 cal meal)
- Dinner: 5:30 PM (Protein + vegetables, NO carbs)
- Thursday: Fast day (last meal 12:00 PM, no dinner)
- Friday: Post-fast (coffee only, light meal at 1:00 PM)

## MAIA'S MEAL PLAN
- Sunday: Lunch and dinner with Roland
- Monday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Tuesday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Wednesday: Breakfast (crumpet), Lunch with Roland, At mum's for dinner
- Thursday-Saturday: No meals scheduled

## INGREDIENT EFFICIENCY
Maximize shared ingredients between Roland and Maia's meals.`;
}

/**
 * Build feedback summary from history
 */
function buildFeedbackSummary(feedbackHistory) {
  if (!feedbackHistory || feedbackHistory.length === 0) {
    return null;
  }

  const loved = [];
  const didntWork = [];
  const notes = [];

  feedbackHistory.forEach(feedback => {
    if (feedback.loved) loved.push(feedback.loved);
    if (feedback.didntWork) didntWork.push(feedback.didntWork);
    if (feedback.notes) notes.push(feedback.notes);
  });

  let summary = '';
  if (loved.length > 0) {
    summary += `Loved meals: ${loved.join(', ')}\n`;
  }
  if (didntWork.length > 0) {
    summary += `Didn't work: ${didntWork.join(', ')}\n`;
  }
  if (notes.length > 0) {
    summary += `Notes: ${notes.join(' ')}\n`;
  }

  return summary || null;
}

/**
 * Get next week's date range
 */
function getNextWeekDate() {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()));
  
  const nextSaturday = new Date(nextSunday);
  nextSaturday.setDate(nextSunday.getDate() + 6);
  
  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  return `${formatDate(nextSunday)} - ${formatDate(nextSaturday)}, ${nextSunday.getFullYear()}`;
}

/**
 * Transform Claude's response to match our data structure
 */
function transformMealPlanResponse(response, budgetTarget) {
  // This function transforms the Claude response to match MEAL_PLAN_DATA structure
  // For now, return the response as-is and let the component handle transformation
  return {
    ...response,
    budget: {
      target: budgetTarget,
      estimated: response.budget_estimate || 0,
      status: (response.budget_estimate || 0) <= budgetTarget ? 'under' : 'over'
    }
  };
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(apiKey) {
  try {
    localStorage.setItem('claudeApiKey', apiKey);
  } catch (e) {
    console.error('Error saving API key:', e);
  }
}

/**
 * Get API key from localStorage
 */
export function getApiKey() {
  try {
    return localStorage.getItem('claudeApiKey');
  } catch (e) {
    return null;
  }
}
