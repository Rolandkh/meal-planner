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
 * @param {Function} onProgress - Callback for progress simulation
 * @returns {Promise<Object>} Generated meal plan data
 */
export async function generateMealPlan(_apiKey, userPrompt, budgetTarget, store, feedbackHistory = [], onProgress = null) {
  // Start progress simulation if callback provided
  let progressInterval = null;
  let simulatedProgress = 0;
  
  if (onProgress) {
    progressInterval = setInterval(() => {
      // Simulate progress up to 90% (never reach 100 until complete)
      simulatedProgress = Math.min(90, simulatedProgress + Math.random() * 8);
      onProgress(simulatedProgress);
    }, 500);
  }

  try {
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
    
    // Signal completion
    if (onProgress) onProgress(100);
    
    return addBudgetInfo(mealPlan, budgetTarget);
  } finally {
    if (progressInterval) clearInterval(progressInterval);
  }
}

/**
 * Add budget info to meal plan if not present
 */
function addBudgetInfo(mealPlan, budgetTarget) {
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
