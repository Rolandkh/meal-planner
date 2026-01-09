/**
 * GenerationStatusPage Component
 * Displays progress during meal plan generation with SSE streaming
 */

import { ErrorHandler } from '../utils/errorHandler.js';
import { loadEaters, loadBaseSpecification, loadMeals, loadRecipes, saveRecipes, saveMeals, saveNewMealPlan, saveCurrentMealPlan } from '../utils/storage.js';
import { transformGeneratedPlan } from '../utils/mealPlanTransformer.js';

export class GenerationStatusPage {
  constructor() {
    this.progress = 0;
    this.status = 'generating'; // 'generating' | 'complete' | 'failed'
    this.message = 'Initializing meal plan generation...';
    this.abortController = null;
    this.container = null;
    this.isSingleDayRegeneration = false; // Track if regenerating single day
    this.regeneratingDate = null; // Store the date being regenerated
    
    console.log('GenerationStatusPage initialized');
  }

  /**
   * Render the component
   * @returns {HTMLElement} Page element
   */
  render() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4';

    // Create content card
    const card = document.createElement('div');
    card.className = 'max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12';

    // Header
    const header = document.createElement('div');
    header.className = 'text-center mb-8';
    
    const icon = document.createElement('div');
    icon.className = 'text-6xl mb-4 animate-bounce';
    icon.textContent = '🍳';
    
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-gray-800 mb-2';
    title.textContent = 'Preparing Your Meal Plan';
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600';
    subtitle.textContent = 'Vanessa is planning your meals...';
    
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(subtitle);

    // Progress section
    const progressSection = document.createElement('div');
    progressSection.className = 'mb-8';
    progressSection.id = 'progress-section';

    // Progress bar container
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.className = 'bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500 ease-out';
    progressBar.style.width = '0%';
    
    progressBarContainer.appendChild(progressBar);

    // Progress text
    const progressText = document.createElement('div');
    progressText.id = 'progress-text';
    progressText.className = 'text-center text-sm font-medium text-gray-700';
    progressText.textContent = '0%';

    // Status message
    const statusMessage = document.createElement('div');
    statusMessage.id = 'status-message';
    statusMessage.className = 'text-center text-gray-600 mt-4';
    statusMessage.textContent = this.message;

    progressSection.appendChild(progressBarContainer);
    progressSection.appendChild(progressText);
    progressSection.appendChild(statusMessage);

    // Error buttons container (hidden initially)
    const errorButtons = document.createElement('div');
    errorButtons.id = 'error-buttons';
    errorButtons.className = 'hidden mt-6 space-y-3';

    // Retry button
    const retryButton = document.createElement('button');
    retryButton.id = 'retry-button';
    retryButton.className = `
      w-full bg-gradient-to-r from-blue-400 to-indigo-400
      hover:from-blue-500 hover:to-indigo-500
      text-white font-semibold py-4 px-6 rounded-lg
      transition-all transform hover:scale-105
      shadow-md hover:shadow-lg
    `.trim().replace(/\s+/g, ' ');
    retryButton.textContent = 'Retry Generation';
    retryButton.addEventListener('click', () => this.retry());

    // Start Over button
    const startOverButton = document.createElement('button');
    startOverButton.id = 'start-over-button';
    startOverButton.className = `
      w-full bg-gray-500 hover:bg-gray-600
      text-white font-semibold py-3 px-6 rounded-lg
      transition-all transform hover:scale-105
      shadow-md hover:shadow-lg
    `.trim().replace(/\s+/g, ' ');
    startOverButton.textContent = 'Start Over';
    startOverButton.addEventListener('click', () => this.startOver());

    errorButtons.appendChild(retryButton);
    errorButtons.appendChild(startOverButton);

    // Assemble card
    card.appendChild(header);
    card.appendChild(progressSection);
    card.appendChild(errorButtons);

    this.container.appendChild(card);

    return this.container;
  }

  /**
   * Lifecycle hook called after render
   */
  afterRender() {
    // Start SSE connection
    this.startGeneration();
  }

  /**
   * Start meal plan generation with SSE
   */
  async startGeneration() {
    const generationStartTime = performance.now();
    console.log('🚀 Starting meal plan generation...');
    console.log(`⏱️ Start time: ${new Date().toLocaleTimeString()}`);

    // Create new AbortController for this request
    this.abortController = new AbortController();

    try {
      // Load eaters from storage (or use default)
      const t1 = performance.now();
      const eaters = loadEaters();
      const defaultEaters = eaters.length > 0 ? eaters : [
        { name: 'User', preferences: 'no restrictions', schedule: 'home for dinner' }
      ];
      console.log(`  ⏱️ Loaded ${defaultEaters.length} eater(s) in ${Math.round(performance.now() - t1)}ms`);

      // Load chat history and base specification
      const t2 = performance.now();
      const chatHistory = this.loadChatHistory();
      const baseSpecification = loadBaseSpecification();
      console.log(`  ⏱️ Loaded chat history (${chatHistory.length} messages) and base spec in ${Math.round(performance.now() - t2)}ms`);
      
      // Slice 5: Load lightweight recipe index for meal plan generation
      const t3 = performance.now();
      const { getRecipeIndexSync } = await import('../utils/catalogStorage.js');
      const catalog = getRecipeIndexSync();
      console.log(`  ⏱️ Loaded recipe index: ${catalog.length} recipes in ${Math.round(performance.now() - t3)}ms`);
      
      // Slice 4: Check for single-day regeneration parameters (Task 50)
      const regenerateDay = sessionStorage.getItem('regenerate_day');
      const regenerateDate = sessionStorage.getItem('regenerate_date');
      
      let requestBody = {
        chatHistory,
        eaters: defaultEaters,
        baseSpecification,
        catalogSlice: catalog  // Slice 5: Pass catalog to API
      };
      
      // If regenerating a single day, add parameters and get existing meals
      if (regenerateDay && regenerateDate) {
        console.log(`Regenerating single day: ${regenerateDay} (${regenerateDate})`);
        
        // Store for later use in handleComplete
        this.isSingleDayRegeneration = true;
        this.regeneratingDate = regenerateDate;
        
        const meals = loadMeals();
        const existingMeals = meals.filter(m => m.date !== regenerateDate);
        
        requestBody.regenerateDay = regenerateDay;
        requestBody.dateForDay = regenerateDate;
        requestBody.existingMeals = existingMeals;
        
        // Update heading text
        const heading = document.getElementById('generation-heading');
        if (heading) {
          const dayNameCap = regenerateDay.charAt(0).toUpperCase() + regenerateDay.slice(1);
          heading.textContent = `Regenerating ${dayNameCap}...`;
        }
        
        // Clear session storage after reading
        sessionStorage.removeItem('regenerate_day');
        sessionStorage.removeItem('regenerate_date');
      }

      // Make POST request with SSE
      const apiStartTime = performance.now();
      console.log('  📡 Sending request to API...');
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`  ⏱️ API connection established in ${Math.round(performance.now() - apiStartTime)}ms`);

      // Process SSE stream
      const streamStartTime = performance.now();
      await this.processStream(response);
      console.log(`  ⏱️ Stream processing completed in ${Math.round(performance.now() - streamStartTime)}ms`);
      
      const totalTime = Math.round(performance.now() - generationStartTime);
      console.log(`✅ Total generation time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
      console.log(`⏱️ End time: ${new Date().toLocaleTimeString()}`);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation aborted');
        return;
      }

      ErrorHandler.logError(error, 'GenerationStatusPage.startGeneration');
      this.handleError(error.message || 'Generation failed');
    }
  }

  /**
   * Process SSE stream from API
   */
  async processStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.log('Stream completed');
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) {
            continue;
          }

          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.type === 'progress') {
              this.updateProgress(data.progress, data.message);
            } else if (data.type === 'complete') {
              this.handleComplete(data.data);
            } else if (data.type === 'error') {
              this.handleError(data.error);
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, 'Line:', line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Update progress bar and message
   */
  updateProgress(progress, message) {
    this.progress = Math.min(100, Math.max(0, progress));
    this.message = message || this.message;

    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const statusMessage = document.getElementById('status-message');

    if (progressBar) {
      progressBar.style.width = `${this.progress}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(this.progress)}%`;
    }

    if (statusMessage && message) {
      statusMessage.textContent = message;
    }

    console.log(`Progress: ${this.progress}% - ${this.message}`);
  }

  /**
   * Handle generation complete
   */
  handleComplete(data) {
    const completeStartTime = performance.now();
    console.log('📦 Generation complete! Processing data...', data);
    
    this.status = 'complete';
    this.progress = 100;
    this.updateProgress(100, 'Complete! Saving your meal plan...');

    try {
      // Save raw AI output for debugging (before transformation)
      const t1 = performance.now();
      try {
        localStorage.setItem('debug_raw_ai_output', JSON.stringify({
          timestamp: new Date().toISOString(),
          rawData: data
        }));
        console.log(`  ⏱️ Saved raw AI output in ${Math.round(performance.now() - t1)}ms`);
      } catch (e) {
        console.warn('Could not save debug output:', e);
      }

      // Transform Claude's output to normalized format
      const t2 = performance.now();
      const transformed = transformGeneratedPlan(data);
      console.log(`  ⏱️ Transformed data in ${Math.round(performance.now() - t2)}ms:`, {
        recipes: transformed.recipes.length,
        meals: transformed.meals.length,
        mealPlanId: transformed.mealPlan.mealPlanId
      });

      // CRITICAL FIX: For single-day regeneration, merge with existing meals
      let mealsToSave = transformed.meals;
      let recipesToSave = transformed.recipes;
      
      if (this.isSingleDayRegeneration && this.regeneratingDate) {
        console.log(`🔄 Single-day regeneration: merging with existing meals`);
        
        // Load existing meals and filter out the regenerated day
        const existingMeals = loadMeals();
        const otherDayMeals = existingMeals.filter(m => m.date !== this.regeneratingDate);
        
        // Merge: keep other days + new day
        mealsToSave = [...otherDayMeals, ...transformed.meals];
        
        console.log(`✅ Preserved ${otherDayMeals.length} meals from other days, added ${transformed.meals.length} new meals`);
        
        // Also merge recipes (avoid duplicates)
        const existingRecipes = loadRecipes();
        const recipeMap = new Map();
        
        // Add existing recipes first
        existingRecipes.forEach(r => {
          recipeMap.set(r.recipeId, r);
        });
        
        // Add new recipes (may override if same ID)
        transformed.recipes.forEach(r => {
          recipeMap.set(r.recipeId, r);
        });
        
        recipesToSave = Array.from(recipeMap.values());
      }

      // Update meal plan mealIds to include all meals (for single-day regen)
      if (this.isSingleDayRegeneration) {
        // Update mealIds to include all meals (old + new)
        transformed.mealPlan.mealIds = mealsToSave.map(m => m.mealId);
        console.log(`📝 Updated meal plan with ${transformed.mealPlan.mealIds.length} total meal IDs`);
      }

      // Save to localStorage
      const t3 = performance.now();
      const saveResults = {
        recipes: saveRecipes(recipesToSave),
        meals: saveMeals(mealsToSave),
        mealPlan: this.isSingleDayRegeneration 
          ? saveCurrentMealPlan(transformed.mealPlan) // Update existing plan
          : saveNewMealPlan(transformed.mealPlan) // Create new plan (archives old)
      };
      console.log(`  ⏱️ Saved data to localStorage in ${Math.round(performance.now() - t3)}ms`);

      // Check for any save failures
      if (!saveResults.recipes.success || !saveResults.meals.success || !saveResults.mealPlan.success) {
        console.error('Some data failed to save:', saveResults);
        
        // Handle quota errors
        if (saveResults.recipes.error === 'QUOTA_EXCEEDED' || 
            saveResults.meals.error === 'QUOTA_EXCEEDED' || 
            saveResults.mealPlan.error === 'QUOTA_EXCEEDED') {
          ErrorHandler.handleStorageError(new Error('QUOTA_EXCEEDED'), document.body);
        }
      } else {
        const totalProcessingTime = Math.round(performance.now() - completeStartTime);
        console.log(`✅ All data saved successfully in ${totalProcessingTime}ms`);
      }

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('plan-generated', {
        detail: transformed
      }));

      // Update progress message
      this.updateProgress(100, 'Complete! Redirecting...');

      // Navigate to home after short delay
      setTimeout(() => {
        window.location.hash = '#/';
      }, 1500);

    } catch (error) {
      console.error('Error processing complete data:', error);
      this.handleError('Failed to save meal plan: ' + error.message);
    }
  }

  /**
   * Handle generation error
   */
  handleError(errorMessage) {
    console.error('Generation failed:', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      status: this.status
    });
    
    this.status = 'failed';
    this.message = errorMessage || 'Generation failed. Please try again.';

    const statusMessage = document.getElementById('status-message');
    const errorButtons = document.getElementById('error-buttons');
    const progressSection = document.getElementById('progress-section');

    if (statusMessage) {
      statusMessage.textContent = this.message;
      statusMessage.className = 'text-center text-red-600 font-semibold mt-4';
    }

    if (errorButtons) {
      errorButtons.classList.remove('hidden');
    }

    if (progressSection) {
      // Add red styling to progress bar on error
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.className = 'bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500 ease-out';
      }
    }
  }

  /**
   * Retry generation
   */
  retry() {
    console.log('Retrying generation...', {
      timestamp: new Date().toISOString()
    });

    // Reset state
    this.progress = 0;
    this.status = 'generating';
    this.message = 'Initializing meal plan generation...';

    // Reset UI
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const statusMessage = document.getElementById('status-message');
    const errorButtons = document.getElementById('error-buttons');

    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.className = 'bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500 ease-out';
    }

    if (progressText) {
      progressText.textContent = '0%';
    }

    if (statusMessage) {
      statusMessage.textContent = this.message;
      statusMessage.className = 'text-center text-gray-600 mt-4';
    }

    if (errorButtons) {
      errorButtons.classList.add('hidden');
    }

    // Restart generation
    this.startGeneration();
  }

  /**
   * Start over - clear state and return to home
   */
  startOver() {
    console.log('Starting over...', {
      timestamp: new Date().toISOString()
    });

    // Abort any ongoing generation
    if (this.abortController) {
      this.abortController.abort();
    }

    // Clear state
    this.progress = 0;
    this.status = 'generating';
    this.message = '';

    // Navigate to home
    window.location.hash = '#/';
  }

  /**
   * Load chat history from localStorage
   */
  loadChatHistory() {
    try {
      const saved = localStorage.getItem('vanessa-chat-history');
      if (saved) {
        const messages = JSON.parse(saved);
        // Return last 10 messages for context
        return Array.isArray(messages) ? messages.slice(-10) : [];
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return [];
  }

  /**
   * Cleanup on component unmount
   */
  beforeUnload() {
    if (this.abortController) {
      this.abortController.abort();
      console.log('Generation aborted on unmount');
    }
  }
}




