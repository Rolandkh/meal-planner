/**
 * DayView Component
 * Displays meals for a specific day of the week
 */

import { loadCurrentMealPlan, loadMeals, loadRecipes, loadEaters } from '../utils/storage.js';

export class DayView {
  constructor(params = {}) {
    this.dayName = params.day || '';
    this.mealPlan = null;
    this.meals = [];
    this.recipes = [];
    this.eaters = [];
  }

  /**
   * Load data from storage
   */
  loadData() {
    this.mealPlan = loadCurrentMealPlan();
    this.meals = loadMeals();
    this.recipes = loadRecipes();
    this.eaters = loadEaters();
  }

  /**
   * Find recipe by ID
   */
  getRecipe(recipeId) {
    return this.recipes.find(r => r.recipeId === recipeId);
  }

  /**
   * Get the date for this day of the week from the meal plan
   */
  getDateForDay() {
    if (!this.mealPlan) return null;

    // Get all unique dates from meals
    const dates = [...new Set(this.meals.map(m => m.date))].sort();
    
    // Find the date that matches this day name
    const targetDay = this.dayName.toLowerCase();
    for (const date of dates) {
      const dateObj = new Date(date + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (dayName === targetDay) {
        return date;
      }
    }
    
    return null;
  }

  /**
   * Get meals for a specific date
   */
  getMealsForDate(date) {
    return this.meals.filter(m => m.date === date);
  }

  /**
   * Render the day view
   */
  render() {
    this.loadData();

    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8';

    // No meal plan - redirect to home
    if (!this.mealPlan) {
      container.innerHTML = `
        <div class="max-w-4xl mx-auto text-center py-20">
          <div class="text-6xl mb-6">🍽️</div>
          <h1 class="text-3xl font-bold text-gray-800 mb-4">No Meal Plan Yet</h1>
          <p class="text-gray-600 mb-8">Generate a meal plan to get started!</p>
          <button 
            onclick="window.location.hash='#/'" 
            class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      `;
      return container;
    }

    // Get the date for this day
    const date = this.getDateForDay();
    
    if (!date) {
      container.innerHTML = `
        <div class="max-w-4xl mx-auto text-center py-20">
          <div class="text-6xl mb-6">📅</div>
          <h1 class="text-3xl font-bold text-gray-800 mb-4">Day Not Found</h1>
          <p class="text-gray-600 mb-8">Couldn't find ${this.dayName} in your meal plan.</p>
          <button 
            onclick="window.location.hash='#/'" 
            class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      `;
      return container;
    }

    // Get meals for this date
    const dayMeals = this.getMealsForDate(date);

    // Main content
    const content = document.createElement('div');
    content.className = 'max-w-4xl mx-auto';

    // Header
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });

    const header = document.createElement('div');
    header.className = 'mb-8 text-center';
    header.innerHTML = `
      <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
        ${this.dayName.charAt(0).toUpperCase() + this.dayName.slice(1)}
      </h1>
      <p class="text-xl text-gray-600 mb-6">${formattedDate}</p>
    `;

    // Action buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex items-center justify-center space-x-4';
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = `
      bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg
      transition-colors font-semibold
    `.trim().replace(/\s+/g, ' ');
    backButton.textContent = '← Back to Home';
    backButton.addEventListener('click', () => {
      window.location.hash = '#/';
    });
    buttonsContainer.appendChild(backButton);
    
    // Task 58: Make Changes button (opens conversational workflow)
    const makeChangesButton = document.createElement('button');
    makeChangesButton.id = 'make-changes-btn';
    makeChangesButton.className = `
      bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg
      transition-colors font-semibold flex items-center space-x-2
    `.trim().replace(/\s+/g, ' ');
    makeChangesButton.innerHTML = `
      <span>✏️</span>
      <span>Make Changes</span>
    `;
    makeChangesButton.addEventListener('click', () => {
      this.openChatForDayChanges(date);
    });
    buttonsContainer.appendChild(makeChangesButton);
    
    header.appendChild(buttonsContainer);

    // Day card
    const dayCard = document.createElement('div');
    dayCard.className = 'bg-white rounded-2xl shadow-xl overflow-hidden mt-8';

    // Meals container
    const mealsContainer = document.createElement('div');
    mealsContainer.className = 'p-6 space-y-6';

    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const mealEmojis = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙'
    };
    const mealLabels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner'
    };

    // Render each meal
    mealTypes.forEach(mealType => {
      const meal = dayMeals.find(m => m.mealType === mealType);
      if (meal) {
        const recipe = this.getRecipe(meal.recipeId);
        const mealSection = this.renderMealSection(mealType, recipe, mealEmojis[mealType], mealLabels[mealType]);
        mealsContainer.appendChild(mealSection);
      } else {
        // Show placeholder if no meal planned
        const placeholder = document.createElement('div');
        placeholder.className = 'border-l-4 border-gray-300 pl-4 py-4 bg-gray-50 rounded';
        placeholder.innerHTML = `
          <div class="flex items-center gap-2 text-gray-400">
            <span class="text-2xl">${mealEmojis[mealType]}</span>
            <span class="text-lg font-semibold">${mealLabels[mealType]}</span>
            <span class="text-sm ml-auto">No meal planned</span>
          </div>
        `;
        mealsContainer.appendChild(placeholder);
      }
    });

    dayCard.appendChild(mealsContainer);

    // Assemble
    content.appendChild(header);
    content.appendChild(dayCard);
    container.appendChild(content);

    return container;
  }

  /**
   * Render a single meal section with full details
   */
  renderMealSection(mealType, recipe, emoji, label) {
    if (!recipe) {
      return document.createElement('div');
    }

    const section = document.createElement('div');
    section.className = 'border-l-4 border-blue-500 pl-4 py-4 bg-blue-50/30 rounded';

    // Meal header
    const header = document.createElement('div');
    header.className = 'flex items-start justify-between mb-4';

    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-3xl">${emoji}</span>
        <span class="text-lg font-semibold text-gray-700">${label}</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">${recipe.name}</h2>
    `;

    const timeInfo = document.createElement('div');
    timeInfo.className = 'text-right text-sm text-gray-600';
    timeInfo.innerHTML = `
      <div class="mb-1">⏱️ ${recipe.prepTime + recipe.cookTime} min</div>
      <div>🍽️ ${recipe.servings} servings</div>
    `;

    header.appendChild(titleSection);
    header.appendChild(timeInfo);

    // Ingredients
    const ingredientsSection = document.createElement('div');
    ingredientsSection.className = 'mb-4';
    ingredientsSection.innerHTML = `
      <h3 class="font-semibold text-gray-700 mb-3 text-lg">Ingredients:</h3>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
        ${recipe.ingredients.map(ing => 
          `<li class="flex items-start">
            <span class="text-blue-500 mr-2">•</span>
            <span>${ing.quantity} ${ing.unit} ${ing.name}</span>
          </li>`
        ).join('')}
      </ul>
    `;

    // Instructions
    const instructionsSection = document.createElement('div');
    instructionsSection.className = 'mb-4';
    instructionsSection.innerHTML = `
      <h3 class="font-semibold text-gray-700 mb-3 text-lg">Instructions:</h3>
      <p class="text-gray-700 leading-relaxed">${recipe.instructions}</p>
    `;

    // Tags
    if (recipe.tags && recipe.tags.length > 0) {
      const tagsSection = document.createElement('div');
      tagsSection.className = 'flex flex-wrap gap-2 mt-4';
      recipe.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full';
        tagSpan.textContent = tag;
        tagsSection.appendChild(tagSpan);
      });
      section.appendChild(tagsSection);
    }

    section.appendChild(header);
    section.appendChild(ingredientsSection);
    section.appendChild(instructionsSection);

    return section;
  }

  /**
   * Show regenerate day confirmation modal (Slice 4: Task 50)
   */
  /**
   * Task 58: Open chat with day-specific context for conversational changes
   * @param {string} date - Date in YYYY-MM-DD format
   */
  openChatForDayChanges(date) {
    const dayNameCap = this.dayName.charAt(0).toUpperCase() + this.dayName.slice(1);
    const meals = this.getMealsForDate(date);
    
    // Build context about current meals
    const mealsContext = meals.map(m => {
      const recipe = this.getRecipe(m.recipeId);
      return `${m.mealType.charAt(0).toUpperCase() + m.mealType.slice(1)}: ${recipe?.name || 'Unknown'}`;
    }).join(', ');
    
    // Dispatch event to open chat with day context
    document.dispatchEvent(new CustomEvent('toggle-chat', {
      detail: {
        open: true,
        dayContext: {
          dayName: this.dayName,
          dayNameCapitalized: dayNameCap,
          date: date,
          meals: meals,
          mealsContext: mealsContext
        }
      }
    }));
  }
  
  // Old modal-based regeneration removed - now using conversational approach via ChatWidget

  /**
   * Cleanup
   */
  destroy() {
    // Clean up if needed
  }
}


