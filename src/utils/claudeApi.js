/**
 * Claude API Service
 * Handles communication with the serverless API for meal plan generation
 * Supports streaming with automatic fallback to non-streaming
 */

/**
 * Generate a meal plan using the serverless API
 * Tries streaming first, falls back to non-streaming if it fails
 * @param {string} _apiKey - Deprecated, not used (API key is stored server-side)
 * @param {string} userPrompt - User's weekly preferences
 * @param {number} budgetTarget - Budget target in dollars
 * @param {string} store - Store identifier
 * @param {Array} feedbackHistory - Previous feedback (last 8 weeks)
 * @param {Function} onProgress - Callback for progress updates: (percent, section) => void
 * @returns {Promise<Object>} Generated meal plan data
 */
export async function generateMealPlan(_apiKey, userPrompt, budgetTarget, store, feedbackHistory = [], onProgress = null) {
  // Try streaming first if progress callback provided
  if (onProgress) {
    try {
      const result = await generateWithStreaming(userPrompt, budgetTarget, store, feedbackHistory, onProgress);
      if (result) return addBudgetInfo(result, budgetTarget);
    } catch (streamError) {
      console.warn('Streaming failed, falling back to non-streaming:', streamError.message);
      // Fall through to non-streaming
    }
  }

  // Non-streaming fallback (or if no progress callback)
  return generateWithoutStreaming(userPrompt, budgetTarget, store, feedbackHistory, onProgress);
}

/**
 * Generate with streaming (real-time progress)
 */
async function generateWithStreaming(userPrompt, budgetTarget, store, feedbackHistory, onProgress) {
  const response = await fetch('/api/generate-meal-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPrompt, budgetTarget, store, feedbackHistory, stream: true })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `API error: ${response.status}` }));
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  
  // If not SSE, return null to trigger fallback
  if (!contentType.includes('text/event-stream')) {
    // It's a JSON response, parse and return it
    const mealPlan = await response.json();
    onProgress(100, 'Complete!');
    return mealPlan;
  }

  // Read the SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let mealPlan = null;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'progress') {
            onProgress(data.percent, data.section);
          } else if (data.type === 'complete') {
            mealPlan = data.data;
            onProgress(100, 'Complete!');
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        } catch (e) {
          // Only rethrow if it's not a JSON parse error
          if (e.message && !e.message.includes('JSON') && !e.message.includes('Unexpected')) {
            throw e;
          }
        }
      }
    }
  }

  return mealPlan;
}

/**
 * Generate without streaming (simulated progress)
 */
async function generateWithoutStreaming(userPrompt, budgetTarget, store, feedbackHistory, onProgress) {
  // Start simulated progress if callback provided
  let progressInterval = null;
  let simulatedProgress = 0;
  
  if (onProgress) {
    const sections = ['Starting...', 'Shopping list...', 'Sunday meals...', 'Monday meals...', 
                      'Tuesday meals...', 'Wednesday meals...', 'Thursday meals...', 
                      'Friday meals...', 'Saturday meals...', 'Finalizing...'];
    let sectionIndex = 0;
    
    progressInterval = setInterval(() => {
      simulatedProgress = Math.min(90, simulatedProgress + Math.random() * 6);
      if (simulatedProgress > (sectionIndex + 1) * 9 && sectionIndex < sections.length - 1) {
        sectionIndex++;
      }
      onProgress(simulatedProgress, sections[sectionIndex]);
    }, 600);
  }

  try {
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, budgetTarget, store, feedbackHistory, stream: false })
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
