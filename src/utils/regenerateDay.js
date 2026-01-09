/**
 * Single Day Regeneration Utility
 * Handles regenerating meals for a single day while preserving the rest of the week
 * Slice 4: Task 51 (5 subtasks)
 */

import { 
  loadCurrentMealPlan, 
  loadMeals, 
  saveMeals, 
  saveCurrentMealPlan,
  loadEaters,
  loadBaseSpecification,
  loadRecipes,
  saveRecipes,
  loadChatHistory
} from './storage.js';

/**
 * Subtask 5: Delete orphaned recipes while preserving favorites
 * @returns {Object} Result with deleted count
 */
export function deleteOrphanedRecipes() {
  try {
    const meals = loadMeals();
    const recipes = loadRecipes();
    
    // Get all recipe IDs used by meals
    const usedRecipeIds = new Set(meals.map(m => m.recipeId));
    
    // Filter: keep recipes that are used OR are favorites
    const activeRecipes = recipes.filter(r => 
      usedRecipeIds.has(r.recipeId) || r.isFavorite === true
    );
    
    const deletedCount = recipes.length - activeRecipes.length;
    
    if (deletedCount > 0) {
      const result = saveRecipes(activeRecipes);
      if (result.success) {
        console.log(`Deleted ${deletedCount} orphaned recipe(s)`);
        return {
          success: true,
          deleted: deletedCount,
          remaining: activeRecipes.length
        };
      }
      return result;
    }
    
    return {
      success: true,
      deleted: 0,
      remaining: recipes.length,
      message: 'No orphaned recipes found'
    };
  } catch (error) {
    console.error('Error deleting orphaned recipes:', error);
    return {
      success: false,
      error: 'DELETE_ORPHANED_FAILED',
      message: error.message
    };
  }
}

/**
 * Subtask 3: Call API to generate meals for a single day
 * @param {string} dayName - Day name (e.g., 'tuesday')
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} existingMeals - Other meals in the week (for duplication avoidance)
 * @returns {Promise<Array>} Array of 3 new meal objects
 */
export async function generateDayMeals(dayName, date, existingMeals = []) {
  try {
    // Get context
    const eaters = loadEaters();
    const baseSpec = loadBaseSpecification();
    const chatHistory = loadChatHistory();
    
    // Slice 5: Load lightweight recipe index for meal plan generation
    const { getRecipeIndexSync } = await import('../utils/catalogStorage.js');
    const catalog = getRecipeIndexSync();
    console.log(`📚 Loaded recipe index for day regeneration: ${catalog.length} recipes (lightweight)`);
    
    // Extract recipe names from existing meals
    const recipes = loadRecipes();
    const existingMealsWithNames = existingMeals.map(meal => {
      const recipe = recipes.find(r => r.recipeId === meal.recipeId);
      return {
        ...meal,
        recipeName: recipe?.name || ''
      };
    });
    
    // Make API call
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatHistory: chatHistory.slice(-10),
        eaters,
        baseSpecification: baseSpec,
        catalogSlice: catalog,  // Slice 5: Pass catalog to API
        regenerateDay: dayName.toLowerCase(),
        dateForDay: date,
        existingMeals: existingMealsWithNames
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    // Process SSE stream
    const meals = await this.processGenerationStream(response, dayName);
    
    return meals;
  } catch (error) {
    console.error('Error generating day meals:', error);
    throw error;
  }
}

/**
 * Process SSE stream for single day generation
 * @param {Response} response - Fetch response
 * @param {string} dayName - Day being regenerated
 * @returns {Promise<Array>} Generated meals
 */
async function processGenerationStream(response, dayName) {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.type === 'progress') {
              // Emit progress event for UI to catch
              window.dispatchEvent(new CustomEvent('regeneration-progress', {
                detail: {
                  progress: data.progress,
                  message: data.message
                }
              }));
            } else if (data.type === 'complete') {
              // Parse the generated data
              const mealPlanData = data.data;
              
              // Extract meals from the single day
              if (mealPlanData.days && mealPlanData.days.length > 0) {
                const day = mealPlanData.days[0];
                const meals = [];
                
                ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                  if (day[mealType]) {
                    const recipe = day[mealType];
                    meals.push({
                      recipeData: recipe,
                      mealType,
                      date: day.date
                    });
                  }
                });
                
                resolve(meals);
              } else {
                reject(new Error('No meals generated'));
              }
            } else if (data.type === 'error') {
              reject(new Error(data.error || 'Generation failed'));
            }
          } catch (parseError) {
            console.error('Error parsing SSE line:', parseError);
          }
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Main function: Regenerate a single day's meals
 * Subtasks 1-5 all integrated here
 * @param {string} dayName - Day name (e.g., 'Tuesday')
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Result object
 */
export async function regenerateDay(dayName, date, onProgress = null) {
  try {
    // Subtask 1: Load current meal plan and meals
    const mealPlan = loadCurrentMealPlan();
    const meals = loadMeals();
    
    if (!mealPlan) {
      return {
        success: false,
        error: 'NO_MEAL_PLAN',
        message: 'No active meal plan found'
      };
    }
    
    // Subtask 2: Filter meals by date
    const dayMeals = meals.filter(m => m.date === date);
    const otherMeals = meals.filter(m => m.date !== date);
    
    console.log(`Regenerating ${dayName} (${date}): Found ${dayMeals.length} meals to replace, keeping ${otherMeals.length} meals`);
    
    if (dayMeals.length === 0) {
      return {
        success: false,
        error: 'NO_MEALS_FOR_DATE',
        message: `No meals found for ${date}`
      };
    }
    
    // Subtask 3: Generate new meals for this day
    if (onProgress) {
      onProgress({ progress: 10, message: 'Preparing to regenerate...' });
    }
    
    const newMealData = await generateDayMeals(dayName, date, otherMeals);
    
    if (!newMealData || newMealData.length === 0) {
      throw new Error('No meals generated');
    }
    
    // Transform meal data (similar to mealPlanTransformer.js pattern)
    const newMeals = newMealData.map(mealData => ({
      mealId: `meal_${crypto.randomUUID()}`,
      recipeId: `recipe_${crypto.randomUUID()}`, // Will be deduplicated
      mealType: mealData.mealType,
      date: mealData.date,
      eaterIds: [], // Will be set by schedule if available
      servings: mealData.recipeData.servings,
      notes: ''
    }));
    
    // Add new recipes
    const newRecipes = newMealData.map(mealData => ({
      recipeId: null, // Will be set after deduplication
      name: mealData.recipeData.name,
      ingredients: mealData.recipeData.ingredients,
      instructions: mealData.recipeData.instructions,
      prepTime: mealData.recipeData.prepTime,
      cookTime: mealData.recipeData.cookTime,
      servings: mealData.recipeData.servings,
      tags: mealData.recipeData.tags || [],
      source: 'generated',
      isFavorite: false,
      rating: null,
      timesCooked: 0,
      lastCooked: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Deduplicate and merge with existing recipes
    const existingRecipes = loadRecipes();
    const allRecipes = [...existingRecipes, ...newRecipes];
    
    // Simple deduplication by name
    const recipeMap = new Map();
    allRecipes.forEach(recipe => {
      const key = recipe.name.toLowerCase();
      if (!recipeMap.has(key)) {
        if (!recipe.recipeId) {
          recipe.recipeId = `recipe_${crypto.randomUUID()}`;
        }
        recipeMap.set(key, recipe);
      }
    });
    
    const deduplicatedRecipes = Array.from(recipeMap.values());
    
    // Update meal recipeIds
    newMeals.forEach((meal, index) => {
      const recipeName = newMealData[index].recipeData.name;
      const recipe = Array.from(recipeMap.values()).find(r => 
        r.name.toLowerCase() === recipeName.toLowerCase()
      );
      if (recipe) {
        meal.recipeId = recipe.recipeId;
      }
    });
    
    // Subtask 4: Replace day meals and update storage
    const updatedMeals = [...otherMeals, ...newMeals];
    const saveMealsResult = saveMeals(updatedMeals);
    
    if (!saveMealsResult.success) {
      throw new Error('Failed to save updated meals');
    }
    
    // Save deduplicated recipes
    const saveRecipesResult = saveRecipes(deduplicatedRecipes);
    if (!saveRecipesResult.success) {
      throw new Error('Failed to save recipes');
    }
    
    // Update meal plan
    mealPlan.mealIds = updatedMeals.map(m => m.mealId);
    mealPlan.updatedAt = new Date().toISOString();
    
    const savePlanResult = saveCurrentMealPlan(mealPlan);
    if (!savePlanResult.success) {
      throw new Error('Failed to update meal plan');
    }
    
    if (onProgress) {
      onProgress({ progress: 95, message: 'Cleaning up...' });
    }
    
    // Subtask 5: Cleanup orphaned recipes
    const cleanupResult = deleteOrphanedRecipes();
    console.log('Cleanup result:', cleanupResult);
    
    if (onProgress) {
      onProgress({ progress: 100, message: 'Complete!' });
    }
    
    return {
      success: true,
      message: `Successfully regenerated ${dayName}`,
      mealsReplaced: dayMeals.length,
      newMeals: newMeals.length
    };
    
  } catch (error) {
    console.error('Error regenerating day:', error);
    return {
      success: false,
      error: 'REGENERATION_FAILED',
      message: error.message || 'Failed to regenerate day'
    };
  }
}

/**
 * Get day name from date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Day name (e.g., 'monday')
 */
export function getDayName(date) {
  const dateObj = new Date(date + 'T00:00:00');
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[dateObj.getDay()];
}





