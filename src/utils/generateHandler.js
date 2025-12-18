/**
 * Generate Handler
 * Handles the meal plan generation process with progress indicator
 */

import { generateMealPlan } from './claudeApi.js';
import { transformClaudeResponse } from './mealPlanTransformer.js';

/**
 * Handle meal plan generation with progress indicator
 */
export async function handleGenerate() {
  const preferences = document.getElementById('preferences-input')?.value || '';
  const budget = parseFloat(document.getElementById('budget-input')?.value || '150');
  const store = document.getElementById('store-input')?.value || 'coles-caulfield';
  
  // Get UI elements
  const generateBtn = document.getElementById('generate-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');
  
  // Show loading state
  if (generateBtn) generateBtn.style.display = 'none';
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
  
  const startTime = Date.now();
  
  try {
    // Load feedback history
    const feedbackHistory = JSON.parse(localStorage.getItem('mealPlannerFeedback') || '[]');
    
    // Progress callback - receives percentage and current section
    const onProgress = (percent, section) => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (progressText) {
        progressText.textContent = section 
          ? `${section}... ${Math.round(percent)}% (${elapsed}s)`
          : `Generating... ${Math.round(percent)}% (${elapsed}s)`;
      }
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
    };
    
    // Generate meal plan
    const response = await generateMealPlan(null, preferences, budget, store, feedbackHistory, onProgress);
    
    // Update progress to 100%
    if (progressText) progressText.textContent = 'Processing...';
    if (progressBar) progressBar.style.width = '100%';
    
    // Transform response
    const transformedPlan = transformClaudeResponse(response);
    
    // Save to localStorage
    localStorage.setItem('currentMealPlan', JSON.stringify(transformedPlan));
    
    // Calculate total time
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    // Navigate to home (which will load the new plan)
    alert(`Meal plan generated in ${totalTime} seconds!`);
    navigateTo('home');
    
  } catch (error) {
    console.error('Generation error:', error);
    showError(error.message || 'Failed to generate meal plan. Please check that ANTHROPIC_API_KEY is set in Vercel environment variables.');
    if (generateBtn) generateBtn.style.display = 'flex';
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

function showError(message) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  } else {
    alert(message);
  }
}

// Make available globally
window.handleGenerate = handleGenerate;
