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
 * @param {Function} onProgress - Callback for progress updates: (percent, section) => void
 * @param {number} shoppingDay - Day of week for shopping (0=Sunday, 6=Saturday)
 * @returns {Promise<Object>} Generated meal plan data
 */
export async function generateMealPlan(_apiKey, userPrompt, budgetTarget, store, feedbackHistory = [], onProgress = null, shoppingDay = 6) {
  // Simulated progress with section names
  let progressInterval = null;
  let progress = 0;
  
  if (onProgress) {
    const sections = [
      'Connecting to AI...',
      'Planning shopping list...',
      'Creating Sunday meals...',
      'Creating Monday meals...',
      'Creating Tuesday meals...',
      'Creating Wednesday meals...',
      'Creating Thursday meals...',
      'Creating Friday meals...',
      'Creating Saturday meals...',
      'Adding recipes...',
      'Finalizing plan...'
    ];
    let sectionIndex = 0;
    
    progressInterval = setInterval(() => {
      // Progress more slowly at first, then speed up
      const increment = progress < 30 ? 2 : progress < 60 ? 3 : progress < 80 ? 2 : 1;
      progress = Math.min(92, progress + increment + Math.random() * 2);
      
      // Update section based on progress
      const newSectionIndex = Math.min(sections.length - 1, Math.floor(progress / 9));
      if (newSectionIndex > sectionIndex) {
        sectionIndex = newSectionIndex;
      }
      
      onProgress(Math.round(progress), sections[sectionIndex]);
    }, 500);
  }

  try {
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, budgetTarget, store, feedbackHistory, shoppingDay })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `API error: ${response.status}` }));
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    const mealPlan = await response.json();
    if (onProgress) onProgress(100, 'Complete!');
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
