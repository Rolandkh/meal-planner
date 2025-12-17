/**
 * Claude API Service
 * Handles communication with the serverless API for meal plan generation
 */

/**
 * Generate a meal plan using the serverless API
 * @param {string} _apiKey - Deprecated, not used (API key is stored server-side)
 * @param {string} userPrompt - User's weekly preferences
 * @param {number} budgetTarget - Budget target in dollars
 * @param {string} store - Store identifier
 * @param {Array} feedbackHistory - Previous feedback (last 8 weeks)
 * @returns {Promise<Object>} Generated meal plan data
 */
export async function generateMealPlan(_apiKey, userPrompt, budgetTarget, store, feedbackHistory = []) {
  const response = await fetch('/api/generate-meal-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt, budgetTarget, store, feedbackHistory })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `API error: ${response.status}` }));
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
  }

  const mealPlan = await response.json();
  
  // Add budget info if not present
  return {
    ...mealPlan,
    budget: mealPlan.budget || {
      target: budgetTarget,
      estimated: mealPlan.budget_estimate || 0,
      status: (mealPlan.budget_estimate || 0) <= budgetTarget ? 'under' : 'over'
    }
  };
}

/**
 * Get API key from localStorage (deprecated - kept for backward compatibility)
 */
export function getApiKey() {
  return localStorage.getItem('claudeApiKey');
}

/**
 * Save API key to localStorage (deprecated - kept for backward compatibility)
 */
export function saveApiKey(apiKey) {
  localStorage.setItem('claudeApiKey', apiKey);
}
