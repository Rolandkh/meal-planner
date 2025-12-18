/**
 * Claude API Service
 * Handles communication with the serverless API for meal plan generation
 * Supports streaming for real-time progress updates
 */

/**
 * Generate a meal plan using the serverless API with streaming
 * @param {string} _apiKey - Deprecated, not used (API key is stored server-side)
 * @param {string} userPrompt - User's weekly preferences
 * @param {number} budgetTarget - Budget target in dollars
 * @param {string} store - Store identifier
 * @param {Array} feedbackHistory - Previous feedback (last 8 weeks)
 * @param {Function} onProgress - Callback for progress updates (chars generated)
 * @returns {Promise<Object>} Generated meal plan data
 */
export async function generateMealPlan(_apiKey, userPrompt, budgetTarget, store, feedbackHistory = [], onProgress = null) {
  const response = await fetch('/api/generate-meal-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      userPrompt, 
      budgetTarget, 
      store, 
      feedbackHistory,
      stream: !!onProgress  // Request streaming if progress callback provided
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `API error: ${response.status}` }));
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
  }

  // If streaming, read the event stream
  if (onProgress && response.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let mealPlan = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              onProgress(data.length);
            } else if (data.type === 'complete') {
              mealPlan = data.data;
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e;
          }
        }
      }
    }

    if (!mealPlan) {
      throw new Error('No meal plan received from stream');
    }

    return addBudgetInfo(mealPlan, budgetTarget);
  }

  // Non-streaming response
  const mealPlan = await response.json();
  return addBudgetInfo(mealPlan, budgetTarget);
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
