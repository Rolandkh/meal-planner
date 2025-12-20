/**
 * ShoppingListView Component
 * Displays aggregated shopping list from all recipes in meal plan
 */

import { loadRecipes, loadCurrentMealPlan } from '../utils/storage.js';

export class ShoppingListView {
  constructor() {
    this.recipes = [];
    this.mealPlan = null;
    this.shoppingList = [];
  }

  /**
   * Load data and generate shopping list
   */
  loadData() {
    this.recipes = loadRecipes();
    this.mealPlan = loadCurrentMealPlan();

    if (this.recipes.length > 0) {
      this.shoppingList = this.generateShoppingList();
      console.log('Generated shopping list:', this.shoppingList.length, 'unique items');
    }
  }

  /**
   * Generate shopping list from all recipes
   * Aggregates ingredients and combines duplicates
   */
  generateShoppingList() {
    const ingredientMap = new Map();

    // Collect all ingredients from all recipes
    this.recipes.forEach(recipe => {
      if (!recipe.ingredients) return;

      recipe.ingredients.forEach(ing => {
        const key = `${ing.name.toLowerCase().trim()}::${ing.unit.toLowerCase().trim()}`;
        
        if (ingredientMap.has(key)) {
          // Add to existing quantity
          const existing = ingredientMap.get(key);
          existing.quantity += (ing.quantity || 0);
        } else {
          // New ingredient
          ingredientMap.set(key, {
            name: ing.name,
            quantity: ing.quantity || 0,
            unit: ing.unit,
            category: ing.category || 'other'
          });
        }
      });
    });

    // Convert to array and sort
    const list = Array.from(ingredientMap.values());
    
    // Sort by category, then by name
    list.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }

  /**
   * Group shopping list by category
   */
  groupByCategory() {
    const grouped = {};

    this.shoppingList.forEach(item => {
      const category = item.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }

  /**
   * Render the shopping list view
   */
  render() {
    this.loadData();

    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8';

    // No recipes - redirect to home
    if (this.recipes.length === 0) {
      container.innerHTML = `
        <div class="max-w-4xl mx-auto text-center py-20">
          <div class="text-6xl mb-6">🛒</div>
          <h1 class="text-3xl font-bold text-gray-800 mb-4">No Shopping List Yet</h1>
          <p class="text-gray-600 mb-8">Generate a meal plan to create your shopping list!</p>
          <button 
            onclick="window.location.hash='#/'" 
            class="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Go Home
          </button>
        </div>
      `;
      return container;
    }

    // Main content
    const content = document.createElement('div');
    content.className = 'max-w-4xl mx-auto';

    // Header
    const header = document.createElement('div');
    header.className = 'mb-8 text-center';

    const weekInfo = this.mealPlan ? 
      `Week of ${new Date(this.mealPlan.weekOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 
      'Your Shopping List';

    header.innerHTML = `
      <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2">🛒 Shopping List</h1>
      <p class="text-xl text-gray-600 mb-4">${weekInfo}</p>
      <div class="bg-white rounded-lg px-6 py-3 shadow-md inline-block">
        <span class="text-2xl font-bold text-green-600">${this.shoppingList.length}</span>
        <span class="text-gray-600 ml-2">Items</span>
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

    // Shopping list grouped by category
    const listContainer = document.createElement('div');
    listContainer.className = 'mt-8 space-y-6';

    const grouped = this.groupByCategory();
    const categoryEmojis = {
      produce: '🥬',
      meat: '🥩',
      dairy: '🥛',
      pantry: '🥫',
      other: '🛍️'
    };

    const categoryNames = {
      produce: 'Produce',
      meat: 'Meat & Seafood',
      dairy: 'Dairy & Eggs',
      pantry: 'Pantry & Staples',
      other: 'Other Items'
    };

    // Render each category
    Object.keys(grouped).sort().forEach(category => {
      const categoryCard = this.renderCategoryCard(
        category,
        grouped[category],
        categoryEmojis[category] || '🛍️',
        categoryNames[category] || category
      );
      listContainer.appendChild(categoryCard);
    });

    // Assemble
    content.appendChild(header);
    content.appendChild(listContainer);
    container.appendChild(content);

    return container;
  }

  /**
   * Render a category card with items
   */
  renderCategoryCard(category, items, emoji, displayName) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden';

    // Category header
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center gap-3';
    header.innerHTML = `
      <span class="text-3xl">${emoji}</span>
      <div>
        <h2 class="text-xl font-bold">${displayName}</h2>
        <p class="text-green-100 text-sm">${items.length} items</p>
      </div>
    `;

    // Items list
    const itemsList = document.createElement('div');
    itemsList.className = 'p-6';

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';

    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';

      // Checkbox (for future interactivity)
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'w-5 h-5 text-green-600 rounded';

      // Item details
      const details = document.createElement('div');
      details.className = 'flex-1';
      
      const quantity = item.quantity ? 
        `${Math.round(item.quantity * 10) / 10} ${item.unit}`.trim() : 
        '';

      details.innerHTML = `
        <div class="font-medium text-gray-800">${item.name}</div>
        ${quantity ? `<div class="text-sm text-gray-600">${quantity}</div>` : ''}
      `;

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(details);
      grid.appendChild(itemDiv);
    });

    itemsList.appendChild(grid);

    card.appendChild(header);
    card.appendChild(itemsList);

    return card;
  }

  /**
   * Cleanup
   */
  destroy() {
    // Clean up if needed
  }
}
