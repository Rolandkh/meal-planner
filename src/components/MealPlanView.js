/**
 * MealPlanView Component
 * Displays the generated weekly meal plan with all meals and recipes
 */

import { loadCurrentMealPlan, loadMeals, loadRecipes } from '../utils/storage.js';

export class MealPlanView {
  constructor() {
    this.mealPlan = null;
    this.meals = [];
    this.recipes = [];
  }

  /**
   * Load meal plan data from storage
   */
  loadData() {
    this.mealPlan = loadCurrentMealPlan();
    this.meals = loadMeals();
    this.recipes = loadRecipes();

    if (!this.mealPlan) {
      console.warn('No meal plan found');
    } else {
      console.log('Loaded meal plan:', {
        weekOf: this.mealPlan.weekOf,
        mealsCount: this.meals.length,
        recipesCount: this.recipes.length
      });
    }
  }

  /**
   * Find recipe by ID
   */
  getRecipe(recipeId) {
    return this.recipes.find(r => r.recipeId === recipeId);
  }

  /**
   * Get meals for a specific date
   */
  getMealsForDate(date) {
    return this.meals.filter(m => m.date === date);
  }

  /**
   * Render the meal plan view
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

    // Main content
    const content = document.createElement('div');
    content.className = 'max-w-6xl mx-auto';

    // Header
    const header = document.createElement('div');
    header.className = 'mb-8 text-center';

    const weekOf = new Date(this.mealPlan.weekOf);
    const weekEnd = new Date(this.mealPlan.weekEnd);
    const formattedWeek = `${weekOf.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    header.innerHTML = `
      <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Your Meal Plan</h1>
      <p class="text-xl text-gray-600 mb-6">${formattedWeek}</p>
      <div class="flex justify-center gap-4 flex-wrap">
        <div class="bg-white rounded-lg px-6 py-3 shadow-md">
          <span class="text-2xl font-bold text-blue-600">${this.meals.length}</span>
          <span class="text-gray-600 ml-2">Meals</span>
        </div>
        <div class="bg-white rounded-lg px-6 py-3 shadow-md">
          <span class="text-2xl font-bold text-green-600">${this.recipes.length}</span>
          <span class="text-gray-600 ml-2">Recipes</span>
        </div>
        <div class="bg-white rounded-lg px-6 py-3 shadow-md">
          <span class="text-2xl font-bold text-purple-600">$${this.mealPlan.budget.estimated}</span>
          <span class="text-gray-600 ml-2">Budget</span>
        </div>
      </div>
    `;

    // Back button
    const backButton = document.createElement('button');
    backButton.className = `
      mt-6 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg
      transition-colors font-semibold
    `.trim().replace(/\s+/g, ' ');
    backButton.textContent = '← Back to Home';
    backButton.addEventListener('click', () => {
      window.location.hash = '#/';
    });
    header.appendChild(backButton);

    // Days section
    const daysContainer = document.createElement('div');
    daysContainer.className = 'space-y-6 mt-8';

    // Get unique dates and sort them
    const dates = [...new Set(this.meals.map(m => m.date))].sort();

    dates.forEach(date => {
      const dayCard = this.renderDayCard(date);
      daysContainer.appendChild(dayCard);
    });

    // Assemble
    content.appendChild(header);
    content.appendChild(daysContainer);
    container.appendChild(content);

    return container;
  }

  /**
   * Render a single day card
   */
  renderDayCard(date) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-xl overflow-hidden';

    // Day header
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white p-6';
    header.innerHTML = `
      <h2 class="text-2xl font-bold">${dayName}</h2>
      <p class="text-blue-100">${dayDate}</p>
    `;

    // Meals for this day
    const mealsContainer = document.createElement('div');
    mealsContainer.className = 'p-6 space-y-4';

    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const mealEmojis = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙'
    };

    mealTypes.forEach(mealType => {
      const meal = this.meals.find(m => m.date === date && m.mealType === mealType);
      if (meal) {
        const recipe = this.getRecipe(meal.recipeId);
        const mealCard = this.renderMealCard(mealType, recipe, mealEmojis[mealType]);
        mealsContainer.appendChild(mealCard);
      }
    });

    card.appendChild(header);
    card.appendChild(mealsContainer);

    return card;
  }

  /**
   * Render a single meal card
   */
  renderMealCard(mealType, recipe, emoji) {
    if (!recipe) {
      return document.createElement('div');
    }

    const card = document.createElement('div');
    card.className = 'border-l-4 border-blue-500 pl-4 py-2';

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between mb-2';

    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <span class="text-2xl">${emoji}</span>
        <span class="text-sm font-semibold text-gray-500 uppercase">${mealType}</span>
      </div>
      <h3 class="text-xl font-bold text-gray-800">${recipe.name}</h3>
    `;

    const timeInfo = document.createElement('div');
    timeInfo.className = 'text-right text-sm text-gray-600';
    timeInfo.innerHTML = `
      <div>⏱️ ${recipe.prepTime + recipe.cookTime} min</div>
      <div>🍽️ ${recipe.servings} servings</div>
    `;

    header.appendChild(titleSection);
    header.appendChild(timeInfo);

    // Collapsible details
    const detailsToggle = document.createElement('button');
    detailsToggle.className = 'text-blue-600 hover:text-blue-800 text-sm font-medium mt-2';
    detailsToggle.textContent = 'Show Details ▼';

    const detailsContent = document.createElement('div');
    detailsContent.className = 'hidden mt-4 space-y-3';

    // Ingredients
    const ingredientsList = document.createElement('div');
    ingredientsList.innerHTML = `
      <h4 class="font-semibold text-gray-700 mb-2">Ingredients:</h4>
      <ul class="list-disc list-inside text-gray-600 space-y-1">
        ${recipe.ingredients.map(ing => 
          `<li>${ing.quantity} ${ing.unit} ${ing.name}</li>`
        ).join('')}
      </ul>
    `;

    // Instructions
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <h4 class="font-semibold text-gray-700 mb-2">Instructions:</h4>
      <p class="text-gray-600">${recipe.instructions}</p>
    `;

    // Tags
    if (recipe.tags && recipe.tags.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'flex flex-wrap gap-2';
      recipe.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded';
        tagSpan.textContent = tag;
        tags.appendChild(tagSpan);
      });
      detailsContent.appendChild(tags);
    }

    detailsContent.appendChild(ingredientsList);
    detailsContent.appendChild(instructions);

    // Toggle functionality
    let isOpen = false;
    detailsToggle.addEventListener('click', () => {
      isOpen = !isOpen;
      detailsContent.classList.toggle('hidden');
      detailsToggle.textContent = isOpen ? 'Hide Details ▲' : 'Show Details ▼';
    });

    card.appendChild(header);
    card.appendChild(detailsToggle);
    card.appendChild(detailsContent);

    return card;
  }

  /**
   * Cleanup
   */
  destroy() {
    // Clean up if needed
  }
}
