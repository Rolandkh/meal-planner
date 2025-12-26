/**
 * Meal Plan History Detail Page Component
 * Read-only view of a specific archived meal plan
 * Slice 4: Task 52
 */

import { loadHistoricalPlan } from '../utils/storage.js';

export class MealPlanHistoryDetailPage {
  constructor(params) {
    this.planId = params.id;
    this.state = {
      plan: null,
      loading: true,
      error: null,
      activeTab: 'weekly' // 'weekly' or 'shopping'
    };
  }

  beforeRender() {
    this.loadPlan();
  }

  loadPlan() {
    const plan = loadHistoricalPlan(this.planId);
    
    if (plan) {
      this.state.plan = plan;
      this.state.loading = false;
    } else {
      this.state.error = 'Meal plan not found';
      this.state.loading = false;
    }
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  getMealsByDate(date) {
    if (!this.state.plan.mealsSnapshot) return [];
    return this.state.plan.mealsSnapshot.filter(m => m.date === date);
  }

  getRecipe(recipeId) {
    if (!this.state.plan.recipesSnapshot) return null;
    return this.state.plan.recipesSnapshot.find(r => r.recipeId === recipeId);
  }

  render() {
    const container = document.createElement('div');
    container.className = 'history-detail-page container mx-auto px-4 py-8 max-w-6xl';
    
    if (this.state.loading) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading meal plan...</p>
          </div>
        </div>
      `;
      return container;
    }
    
    if (this.state.error) {
      container.innerHTML = `
        <div class="max-w-2xl mx-auto mt-16">
          <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
            <h2 class="text-xl font-bold mb-2">Error</h2>
            <p>${this.state.error}</p>
            <button 
              onclick="window.location.hash='#/history'" 
              class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Back to History
            </button>
          </div>
        </div>
      `;
      return container;
    }
    
    const { plan } = this.state;
    
    // Header with archive badge
    const header = document.createElement('div');
    header.className = 'mb-8';
    header.innerHTML = `
      <button
        id="back-to-history-btn"
        class="mb-4 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
      >
        <span>←</span>
        <span>Back to History</span>
      </button>
      
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Week of ${this.formatDate(plan.weekOf)}
          </h1>
          <p class="text-gray-600 mt-1">
            ${this.formatDate(plan.weekOf)} - ${this.formatDate(plan.weekEnd)}
          </p>
        </div>
        <span class="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">
          📦 Archived
        </span>
      </div>
      
      <div class="mt-4 flex items-center space-x-6 text-sm text-gray-600">
        <div>
          <span class="font-medium">Created:</span> ${this.formatDate(plan.createdAt)}
        </div>
        <div>
          <span class="font-medium">Budget:</span> $${plan.budget?.estimated || 0}
        </div>
        <div>
          <span class="font-medium">Meals:</span> ${plan.mealsSnapshot?.length || 21}
        </div>
        <div>
          <span class="font-medium">Recipes:</span> ${plan.recipesSnapshot?.length || 0}
        </div>
      </div>
    `;
    container.appendChild(header);
    
    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'flex space-x-2 mb-6 border-b';
    tabs.innerHTML = `
      <button
        id="tab-weekly"
        class="px-6 py-3 font-medium transition-colors ${
          this.state.activeTab === 'weekly' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-blue-600'
        }"
      >
        Weekly View
      </button>
      <button
        id="tab-shopping"
        class="px-6 py-3 font-medium transition-colors ${
          this.state.activeTab === 'shopping' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-600 hover:text-blue-600'
        }"
      >
        Shopping List
      </button>
    `;
    container.appendChild(tabs);
    
    // Tab Content
    const content = document.createElement('div');
    content.id = 'tab-content';
    
    if (this.state.activeTab === 'weekly') {
      content.appendChild(this.renderWeeklyView());
    } else {
      content.appendChild(this.renderShoppingList());
    }
    
    container.appendChild(content);
    
    return container;
  }

  renderWeeklyView() {
    const weeklyView = document.createElement('div');
    weeklyView.className = 'space-y-6';
    
    if (!this.state.plan.mealsSnapshot || this.state.plan.mealsSnapshot.length === 0) {
      weeklyView.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p>No meal data available for this plan.</p>
        </div>
      `;
      return weeklyView;
    }
    
    // Get unique dates and sort
    const dates = [...new Set(this.state.plan.mealsSnapshot.map(m => m.date))].sort();
    
    dates.forEach(date => {
      const dayCard = this.renderDayCard(date);
      weeklyView.appendChild(dayCard);
    });
    
    return weeklyView;
  }

  renderDayCard(date) {
    const meals = this.getMealsByDate(date);
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden';
    
    // Header
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-blue-400 to-indigo-400 px-6 py-4';
    header.innerHTML = `
      <h2 class="text-white font-bold text-xl">${this.formatDate(date)}</h2>
    `;
    card.appendChild(header);
    
    // Meals
    const mealsContainer = document.createElement('div');
    mealsContainer.className = 'p-6 space-y-4';
    
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const meal = meals.find(m => m.mealType === mealType);
      if (meal) {
        const recipe = this.getRecipe(meal.recipeId);
        if (recipe) {
          const mealDiv = document.createElement('div');
          mealDiv.className = 'pb-4 border-b last:border-b-0 last:pb-0';
          mealDiv.innerHTML = `
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold text-gray-900 capitalize">${mealType}</h3>
              <span class="text-sm text-gray-500">${meal.servings} serving${meal.servings !== 1 ? 's' : ''}</span>
            </div>
            <p class="text-lg text-gray-800 mb-2">${recipe.name}</p>
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <span>⏱️ ${recipe.prepTime + recipe.cookTime} min</span>
              <span>🍽️ ${recipe.servings} servings</span>
            </div>
          `;
          mealsContainer.appendChild(mealDiv);
        }
      }
    });
    
    card.appendChild(mealsContainer);
    
    return card;
  }

  renderShoppingList() {
    const shoppingList = document.createElement('div');
    shoppingList.className = 'bg-white rounded-lg shadow-md p-6';
    
    if (!this.state.plan.recipesSnapshot || this.state.plan.recipesSnapshot.length === 0) {
      shoppingList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p>No shopping list data available for this plan.</p>
        </div>
      `;
      return shoppingList;
    }
    
    // Aggregate ingredients from all recipes
    const aggregated = this.aggregateIngredients();
    
    shoppingList.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Shopping List</h2>
      <p class="text-gray-600 mb-4">Total items: ${aggregated.length}</p>
    `;
    
    // Group by category
    const categories = ['produce', 'meat', 'dairy', 'pantry', 'other'];
    const categoryLabels = {
      produce: '🥬 Produce',
      meat: '🥩 Meat & Seafood',
      dairy: '🥛 Dairy',
      pantry: '🏺 Pantry',
      other: '📦 Other'
    };
    
    categories.forEach(category => {
      const items = aggregated.filter(item => item.category === category);
      if (items.length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-6';
        categoryDiv.innerHTML = `
          <h3 class="font-semibold text-gray-900 mb-3">${categoryLabels[category]}</h3>
          <ul class="space-y-2">
            ${items.map(item => `
              <li class="flex items-center justify-between">
                <span class="text-gray-800">${item.name}</span>
                <span class="text-gray-600">${item.quantity} ${item.unit}</span>
              </li>
            `).join('')}
          </ul>
        `;
        shoppingList.appendChild(categoryDiv);
      }
    });
    
    return shoppingList;
  }

  aggregateIngredients() {
    const ingredientMap = new Map();
    
    (this.state.plan.recipesSnapshot || []).forEach(recipe => {
      (recipe.ingredients || []).forEach(ing => {
        const key = `${ing.name.toLowerCase()}_${ing.unit}`;
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          existing.quantity += ing.quantity;
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category
          });
        }
      });
    });
    
    return Array.from(ingredientMap.values());
  }

  afterRender() {
    // Back button
    const backBtn = document.getElementById('back-to-history-btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#/history';
      });
    }
    
    // Tab buttons
    const weeklyTab = document.getElementById('tab-weekly');
    const shoppingTab = document.getElementById('tab-shopping');
    
    if (weeklyTab) {
      weeklyTab.addEventListener('click', () => {
        this.state.activeTab = 'weekly';
        this.updateTabContent();
      });
    }
    
    if (shoppingTab) {
      shoppingTab.addEventListener('click', () => {
        this.state.activeTab = 'shopping';
        this.updateTabContent();
      });
    }
  }

  updateTabContent() {
    const content = document.getElementById('tab-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    if (this.state.activeTab === 'weekly') {
      content.appendChild(this.renderWeeklyView());
    } else {
      content.appendChild(this.renderShoppingList());
    }
    
    // Update tab styles
    const weeklyTab = document.getElementById('tab-weekly');
    const shoppingTab = document.getElementById('tab-shopping');
    
    if (weeklyTab && shoppingTab) {
      if (this.state.activeTab === 'weekly') {
        weeklyTab.className = 'px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600 transition-colors';
        shoppingTab.className = 'px-6 py-3 font-medium text-gray-600 hover:text-blue-600 transition-colors';
      } else {
        weeklyTab.className = 'px-6 py-3 font-medium text-gray-600 hover:text-blue-600 transition-colors';
        shoppingTab.className = 'px-6 py-3 font-medium text-blue-600 border-b-2 border-blue-600 transition-colors';
      }
    }
  }

  beforeUnload() {
    // No cleanup needed
  }
}



