/**
 * Generate Handler
 * Handles the meal plan generation process
 */

import { generateMealPlan, saveApiKey } from './claudeApi.js';
import { transformClaudeResponse } from './mealPlanTransformer.js';

/**
 * Handle meal plan generation
 */
export async function handleGenerate() {
  const apiKey = document.getElementById('api-key-input')?.value.trim();
  const preferences = document.getElementById('preferences-input')?.value || '';
  const budget = parseFloat(document.getElementById('budget-input')?.value || '150');
  const store = document.getElementById('store-input')?.value || 'coles-caulfield';
  
  // Validate API key
  if (!apiKey) {
    showError('Please enter your Claude API key');
    return;
  }
  
  if (!apiKey.startsWith('sk-ant-')) {
    showError('Invalid API key format. Should start with "sk-ant-"');
    return;
  }
  
  // Save API key
  saveApiKey(apiKey);
  
  // Show loading state
  const generateBtn = document.getElementById('generate-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  
  if (generateBtn) generateBtn.style.display = 'none';
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
  
  try {
    // Load feedback history
    const feedbackHistory = JSON.parse(localStorage.getItem('mealPlannerFeedback') || '[]');
    
    // Generate meal plan
    const response = await generateMealPlan(apiKey, preferences, budget, store, feedbackHistory);
    
    // Transform response
    const transformedPlan = transformClaudeResponse(response);
    
    // Save to localStorage
    localStorage.setItem('currentMealPlan', JSON.stringify(transformedPlan));
    
    // Navigate to home (which will load the new plan)
    alert('Meal plan generated successfully!');
    navigateTo('home');
    
  } catch (error) {
    console.error('Generation error:', error);
    showError(error.message || 'Failed to generate meal plan. Please check your API key and try again.');
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
