/**
 * MealPlanView Component
 * Displays the generated weekly meal plan with all meals and recipes
 * Includes household schedule grid showing who's eating when
 * Slice 3 - Enhanced
 */

import { loadCurrentMealPlan, loadMeals, loadRecipes, loadEaters } from '../utils/storage.js';

export class MealPlanView {
  constructor() {
    this.mealPlan = null;
    this.meals = [];
    this.recipes = [];
    this.eaters = [];
    
    // Color palette for household members
    this.eaterColors = [
      '#3B82F6', // Blue
      '#10B981', // Green  
      '#EF4444', // Red
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316'  // Orange
    ];
  }

  /**
   * Load meal plan data from storage
   */
  loadData() {
    this.mealPlan = loadCurrentMealPlan();
    this.meals = loadMeals();
    this.recipes = loadRecipes();
    this.eaters = loadEaters();

    if (!this.mealPlan) {
      console.warn('No meal plan found');
    } else {
      console.log('Loaded meal plan:', {
        weekOf: this.mealPlan.weekOf,
        mealsCount: this.meals.length,
        recipesCount: this.recipes.length,
        eatersCount: this.eaters.length
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
    
    // Household Schedule Grid (after header, before days)
    if (this.eaters.length > 1) {
      const scheduleGrid = this.renderHouseholdScheduleGrid();
      content.appendChild(scheduleGrid);
    }
    
    content.appendChild(daysContainer);
    container.appendChild(content);

    return container;
  }

  /**
   * Render household schedule grid showing who's eating when
   */
  renderHouseholdScheduleGrid() {
    const container = document.createElement('div');
    container.className = 'bg-white rounded-xl shadow-lg p-6 mb-8';

    // Title
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900 mb-4';
    title.textContent = 'Household Schedule';

    // Get unique dates and sort
    const dates = [...new Set(this.meals.map(m => m.date))].sort();

    // Create grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'overflow-x-auto';

    const table = document.createElement('table');
    table.className = 'w-full border-collapse';

    // Header row (days of week)
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Empty corner cell
    const cornerCell = document.createElement('th');
    cornerCell.className = 'p-2 border border-gray-200 bg-gray-50';
    headerRow.appendChild(cornerCell);

    // Day headers
    dates.forEach(date => {
      const dateObj = new Date(date + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayDate = dateObj.getDate();
      
      const th = document.createElement('th');
      th.className = 'p-3 border border-gray-200 bg-gray-50 text-center font-medium text-gray-700 text-sm';
      th.innerHTML = `${dayName}<br><span class="text-xs text-gray-500">${dayDate}</span>`;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows (meal types)
    const tbody = document.createElement('tbody');
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const mealLabels = {
      breakfast: '🌅 Breakfast',
      lunch: '☀️ Lunch',
      dinner: '🌙 Dinner'
    };

    mealTypes.forEach(mealType => {
      const row = document.createElement('tr');
      
      // Meal type label
      const labelCell = document.createElement('td');
      labelCell.className = 'p-3 border border-gray-200 bg-gray-50 font-medium text-gray-700 text-sm whitespace-nowrap';
      labelCell.textContent = mealLabels[mealType];
      row.appendChild(labelCell);

      // Cells for each day
      dates.forEach(date => {
        const meal = this.meals.find(m => m.date === date && m.mealType === mealType);
        const cell = document.createElement('td');
        cell.className = 'p-3 border border-gray-200 text-center';

        if (meal && meal.eaterIds && meal.eaterIds.length > 0) {
          // Display colored dots for each eater
          const dotsContainer = document.createElement('div');
          dotsContainer.className = 'flex items-center justify-center gap-1 flex-wrap';

          meal.eaterIds.forEach(eaterId => {
            const eaterIndex = this.eaters.findIndex(e => e.eaterId === eaterId);
            if (eaterIndex !== -1) {
              const dot = document.createElement('div');
              dot.className = 'w-4 h-4 rounded-full';
              dot.style.backgroundColor = this.eaterColors[eaterIndex % this.eaterColors.length];
              dot.title = this.eaters[eaterIndex].name; // Tooltip
              dotsContainer.appendChild(dot);
            }
          });

          cell.appendChild(dotsContainer);
        } else {
          // No meal or no eaters specified
          const empty = document.createElement('span');
          empty.className = 'text-gray-300 text-xs';
          empty.textContent = '-';
          cell.appendChild(empty);
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    gridContainer.appendChild(table);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'mt-4 pt-4 border-t border-gray-200';
    
    const legendTitle = document.createElement('div');
    legendTitle.className = 'text-sm font-medium text-gray-700 mb-2';
    legendTitle.textContent = 'Household Members:';
    
    const legendItems = document.createElement('div');
    legendItems.className = 'flex flex-wrap gap-4';

    this.eaters.forEach((eater, index) => {
      const item = document.createElement('div');
      item.className = 'flex items-center gap-2';
      
      const dot = document.createElement('div');
      dot.className = 'w-4 h-4 rounded-full flex-shrink-0';
      dot.style.backgroundColor = this.eaterColors[index % this.eaterColors.length];
      
      const name = document.createElement('span');
      name.className = 'text-sm text-gray-700';
      name.textContent = eater.name;
      
      item.appendChild(dot);
      item.appendChild(name);
      legendItems.appendChild(item);
    });

    legend.appendChild(legendTitle);
    legend.appendChild(legendItems);

    // Assemble
    container.appendChild(title);
    container.appendChild(gridContainer);
    container.appendChild(legend);

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
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold">${dayName}</h2>
          <p class="text-blue-100">${dayDate}</p>
        </div>
        <button
          class="make-changes-btn bg-white hover:bg-gray-50 px-4 py-2 rounded-lg transition-all text-gray-900 font-semibold text-sm border border-gray-300 shadow-md"
          data-date="${date}"
          data-day-name="${dayName}"
          title="Make changes to this day"
        >
          Change ${dayName}
        </button>
      </div>
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
  /**
   * Attach event listeners after render (Task 58: Updated for conversational workflow)
   */
  afterRender() {
    // Add event listeners to all make changes buttons
    const makeChangesButtons = document.querySelectorAll('.make-changes-btn');
    makeChangesButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        const date = btn.dataset.date;
        const dayName = btn.dataset.dayName;
        this.openChatForDayChanges(date, dayName);
      });
    });
  }

  /**
   * Task 58: Open chat with day-specific context for conversational changes
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} dayName - Day name (e.g., "Monday")
   */
  openChatForDayChanges(date, dayName) {
    const meals = this.meals.filter(m => m.date === date);
    
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
          dayName: dayName.toLowerCase(),
          dayNameCapitalized: dayName,
          date: date,
          meals: meals,
          mealsContext: mealsContext
        }
      }
    }));
  }

  destroy() {
    // Clean up if needed
  }
}



