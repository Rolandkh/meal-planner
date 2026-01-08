/**
 * Meal Plan History Page Component
 * Lists all past meal plans
 * Slice 4: Task 52
 */

import { loadMealPlanHistory } from '../utils/storage.js';

export class MealPlanHistoryPage {
  constructor() {
    this.state = {
      history: [],
      loading: true
    };
  }

  beforeRender() {
    this.loadHistory();
  }

  loadHistory() {
    const history = loadMealPlanHistory();
    
    // Sort by archivedAt (newest first)
    history.sort((a, b) => {
      const dateA = new Date(b.archivedAt || b.createdAt);
      const dateB = new Date(a.archivedAt || a.createdAt);
      return dateA - dateB;
    });
    
    this.state.history = history;
    this.state.loading = false;
  }

  formatDateRange(weekOf, weekEnd) {
    const startDate = new Date(weekOf);
    const endDate = new Date(weekEnd);
    
    const options = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    
    return `${start} - ${end}`;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  render() {
    const container = document.createElement('div');
    container.className = 'history-page container mx-auto px-4 py-8 max-w-6xl';
    
    // Header
    const header = document.createElement('div');
    header.className = 'mb-8';
    header.innerHTML = `
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Meal Plan History</h1>
      <p class="text-gray-600">View your past meal plans</p>
    `;
    container.appendChild(header);
    
    if (this.state.loading) {
      container.innerHTML += `
        <div class="flex items-center justify-center py-16">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading history...</p>
          </div>
        </div>
      `;
      return container;
    }
    
    // Empty state
    if (this.state.history.length === 0) {
      container.innerHTML += `
        <div class="text-center py-16">
          <div class="text-6xl mb-4">📅</div>
          <h2 class="text-2xl font-semibold text-gray-700 mb-2">No History Yet</h2>
          <p class="text-gray-500 mb-6">Your past meal plans will appear here after you generate a new plan.</p>
          <button
            onclick="window.location.hash='#/'"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      `;
      return container;
    }
    
    // History Grid
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    this.state.history.forEach(plan => {
      const card = this.renderPlanCard(plan);
      grid.appendChild(card);
    });
    
    container.appendChild(grid);
    
    return container;
  }

  /**
   * Task 59: Generate AI summary for a meal plan
   * Client-side analysis of recipes and meals
   */
  generateSummary(plan) {
    if (!plan.recipesSnapshot || plan.recipesSnapshot.length === 0) {
      return 'Weekly meal plan with variety of dishes';
    }
    
    const recipes = plan.recipesSnapshot;
    
    // Extract common ingredients and patterns
    const allIngredients = recipes.flatMap(r => r.ingredients || []).map(i => i.name.toLowerCase());
    const ingredientCounts = {};
    allIngredients.forEach(ing => {
      ingredientCounts[ing] = (ingredientCounts[ing] || 0) + 1;
    });
    
    // Find most common ingredients (appearing in 3+ recipes)
    const commonIngredients = Object.entries(ingredientCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ing, _]) => ing);
    
    // Analyze tags
    const allTags = recipes.flatMap(r => r.tags || []).map(t => t.toLowerCase());
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag, _]) => tag);
    
    // Build natural summary
    const summaryParts = [];
    
    if (topTags.length > 0) {
      const tagsStr = topTags.join(' and ');
      summaryParts.push(`Featuring ${tagsStr} dishes`);
    }
    
    if (commonIngredients.length > 0) {
      const ingsStr = commonIngredients.slice(0, 2).join(' and ');
      summaryParts.push(`lots of ${ingsStr}`);
    }
    
    // Fallback
    if (summaryParts.length === 0) {
      return `${recipes.length} unique recipes with diverse flavors`;
    }
    
    return summaryParts.join(' with ');
  }

  renderPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden';
    card.onclick = () => {
      window.location.hash = `#/history/${plan.mealPlanId}`;
    };
    
    // Task 59: Generate summary if not present
    const summary = plan.summary || this.generateSummary(plan);
    
    card.innerHTML = `
      <div class="bg-gradient-to-r from-purple-400 to-pink-400 px-6 py-4">
        <h3 class="text-white font-bold text-lg">
          ${this.formatDateRange(plan.weekOf, plan.weekEnd)}
        </h3>
        <p class="text-purple-100 text-sm">
          Archived ${this.formatDate(plan.archivedAt || plan.createdAt)}
        </p>
      </div>
      
      <div class="p-6">
        <div class="mb-4">
          <p class="text-base text-gray-700 italic leading-relaxed">
            ${summary}
          </p>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div class="bg-blue-50 rounded-lg p-3">
            <p class="text-blue-900 font-semibold">Budget</p>
            <p class="text-blue-700 text-lg">$${plan.budget?.estimated || 0}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <p class="text-green-900 font-semibold">Meals</p>
            <p class="text-green-700 text-lg">${plan.mealsSnapshot?.length || 21}</p>
          </div>
        </div>
        
        <div class="mt-4 flex items-center justify-between text-sm">
          <span class="text-blue-600 font-medium hover:text-blue-700">Click to view →</span>
          <span class="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            Archived
          </span>
        </div>
      </div>
    `;
    
    return card;
  }

  afterRender() {
    // No special after-render logic needed
  }

  beforeUnload() {
    // No cleanup needed
  }
}





