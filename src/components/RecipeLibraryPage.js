/**
 * RecipeLibraryPage Component
 * Browse, search, and filter saved recipes
 * Slice 3 - Task 40
 */

import {
  loadRecipes
} from '../utils/storage.js';
import { RecipeImportModal } from './RecipeImportModal.js';
import { getRecipeCatalogSync } from '../utils/catalogStorage.js';

export class RecipeLibraryPage {
  constructor() {
    this.state = {
      recipes: [],
      filteredRecipes: [],
      searchQuery: '',
      activeFilter: 'all',
      searchTimeout: null,
      showCatalog: true  // Show catalog recipes by default
    };
  }

  /**
   * Load recipes before rendering
   */
  beforeRender() {
    // Load user recipes
    const userRecipes = loadRecipes();
    
    // Load catalog recipes (synchronous - catalog should be in localStorage by now)
    const catalogRecipes = this.state.showCatalog ? getRecipeCatalogSync() : [];
    
    // Combine both (catalog first, then user recipes)
    this.state.recipes = [...catalogRecipes, ...userRecipes];
    
    this.applyFilters();
    
    console.log('Recipe library loaded:', {
      catalog: catalogRecipes.length,
      user: userRecipes.length,
      total: this.state.recipes.length,
      filtered: this.state.filteredRecipes.length
    });
  }

  /**
   * Apply search and filter to recipes
   */
  applyFilters() {
    let filtered = [...this.state.recipes];
    
    // Apply search filter
    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(recipe => {
        // Search in recipe name
        if (recipe.name.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in ingredients
        if (recipe.ingredients && recipe.ingredients.some(i => 
          i.name.toLowerCase().includes(query)
        )) {
          return true;
        }
        
        // Search in tags
        if (recipe.tags && recipe.tags.some(tag => 
          tag.toLowerCase().includes(query)
        )) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply category filter
    const filters = {
      'all': (recipe) => true,
      'favorites': (recipe) => recipe.isFavorite === true,
      'high-rated': (recipe) => recipe.rating >= 4,
      'most-cooked': (recipe) => (recipe.timesCooked || 0) >= 3
    };
    
    const filterFn = filters[this.state.activeFilter] || filters.all;
    filtered = filtered.filter(filterFn);
    
    // Sort: most cooked first, then alphabetical
    filtered.sort((a, b) => {
      const aCooked = a.timesCooked || 0;
      const bCooked = b.timesCooked || 0;
      
      if (aCooked !== bCooked) {
        return bCooked - aCooked;
      }
      
      return a.name.localeCompare(b.name);
    });
    
    this.state.filteredRecipes = filtered;
  }

  /**
   * Main render method
   */
  render() {
    const container = document.createElement('div');
    container.className = 'recipe-library min-h-screen bg-gray-50';
    container.id = 'recipe-library-container';

    // Header
    const header = this.renderHeader();
    container.appendChild(header);

    // Main content
    const main = document.createElement('div');
    main.className = 'container mx-auto px-4 py-8 max-w-7xl';

    // Search bar
    const searchBar = this.renderSearchBar();
    main.appendChild(searchBar);

    // Filter tabs
    const filterTabs = this.renderFilterTabs();
    main.appendChild(filterTabs);

    // Recipe grid or empty state
    if (this.state.filteredRecipes.length === 0) {
      const emptyState = this.renderEmptyState();
      main.appendChild(emptyState);
    } else {
      const recipeGrid = this.renderRecipeGrid();
      main.appendChild(recipeGrid);
    }

    container.appendChild(main);

    return container;
  }

  /**
   * Render page header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'bg-white shadow-sm border-b border-gray-200';

    const inner = document.createElement('div');
    inner.className = 'container mx-auto px-4 py-6 max-w-7xl';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between';

    // Title
    const titleDiv = document.createElement('div');
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-gray-900';
    title.textContent = 'Recipe Library';
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600 mt-1';
    subtitle.textContent = `${this.state.recipes.length} recipe${this.state.recipes.length !== 1 ? 's' : ''} in your collection`;
    titleDiv.appendChild(title);
    titleDiv.appendChild(subtitle);

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flex items-center space-x-3';
    
    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2';
    backBtn.innerHTML = '← Back to Home';
    backBtn.onclick = () => window.location.hash = '#/';
    actionsDiv.appendChild(backBtn);
    
    // Slice 4: Add Recipe button (Task 56)
    const addBtn = document.createElement('button');
    addBtn.id = 'add-recipe-btn';
    addBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors';
    addBtn.innerHTML = `
      <span class="text-xl">+</span>
      <span>Add Recipe</span>
    `;
    actionsDiv.appendChild(addBtn);
    
    const backBtn_old = backBtn; // Keep reference for later insertion

    titleRow.appendChild(titleDiv);
    titleRow.appendChild(actionsDiv);
    inner.appendChild(titleRow);
    header.appendChild(inner);

    return header;
  }

  /**
   * Render search bar
   */
  renderSearchBar() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'mb-6';

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'relative';

    const searchIcon = document.createElement('div');
    searchIcon.className = 'absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400';
    searchIcon.innerHTML = '🔍';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
    searchInput.placeholder = 'Search recipes, ingredients, or tags...';
    searchInput.value = this.state.searchQuery;
    searchInput.id = 'recipe-search-input';
    searchInput.oninput = (e) => this.handleSearch(e.target.value);

    searchWrapper.appendChild(searchIcon);
    searchWrapper.appendChild(searchInput);
    searchContainer.appendChild(searchWrapper);

    return searchContainer;
  }

  /**
   * Render filter tabs
   */
  renderFilterTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'mb-6';

    const tabsList = document.createElement('div');
    tabsList.className = 'flex flex-wrap gap-2';

    const tabs = [
      { id: 'all', label: 'All Recipes', count: this.state.recipes.length },
      { id: 'favorites', label: '❤️ Favorites', count: this.state.recipes.filter(r => r.isFavorite).length },
      { id: 'high-rated', label: '⭐ Highly Rated', count: this.state.recipes.filter(r => r.rating >= 4).length },
      { id: 'most-cooked', label: '🔥 Most Cooked', count: this.state.recipes.filter(r => (r.timesCooked || 0) >= 3).length }
    ];

    tabs.forEach(tab => {
      const button = document.createElement('button');
      button.className = `
        px-4 py-2 rounded-lg font-medium transition-all
        ${this.state.activeFilter === tab.id
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }
      `.trim().replace(/\s+/g, ' ');
      button.textContent = `${tab.label} (${tab.count})`;
      button.onclick = () => this.handleFilterChange(tab.id);
      button.setAttribute('data-filter', tab.id);
      tabsList.appendChild(button);
    });

    tabsContainer.appendChild(tabsList);
    return tabsContainer;
  }

  /**
   * Render recipe grid
   */
  renderRecipeGrid() {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    grid.id = 'recipe-grid';

    this.state.filteredRecipes.forEach(recipe => {
      const card = this.renderRecipeCard(recipe);
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Render a recipe card
   */
  renderRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden';
    card.onclick = () => this.handleRecipeClick(recipe);

    // Image (use local image if available, otherwise placeholder)
    const imageContainer = document.createElement('div');
    imageContainer.className = 'h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden';
    
    if (recipe.image) {
      const img = document.createElement('img');
      img.src = recipe.image;
      img.alt = recipe.name;
      img.className = 'w-full h-full object-cover';
      img.onerror = () => {
        imageContainer.innerHTML = `<span class="text-6xl">${this.getRecipeEmoji(recipe)}</span>`;
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.innerHTML = `<span class="text-6xl">${this.getRecipeEmoji(recipe)}</span>`;
    }

    // Content
    const content = document.createElement('div');
    content.className = 'p-4';

    // Title row
    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-start justify-between mb-2';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900 flex-1 line-clamp-2';
    title.textContent = recipe.name;

    const favoriteIcon = document.createElement('span');
    favoriteIcon.className = 'text-xl ml-2';
    favoriteIcon.textContent = recipe.isFavorite ? '❤️' : '';

    titleRow.appendChild(title);
    titleRow.appendChild(favoriteIcon);

    // Meta info
    const meta = document.createElement('div');
    meta.className = 'flex items-center gap-3 text-sm text-gray-600 mb-3';

    const prepTime = document.createElement('span');
    prepTime.innerHTML = `⏱️ ${recipe.prepTime || 0}+${recipe.cookTime || 0}m`;
    
    const servings = document.createElement('span');
    servings.innerHTML = `🍽️ ${recipe.servings || 0}`;

    meta.appendChild(prepTime);
    meta.appendChild(servings);

    content.appendChild(titleRow);
    content.appendChild(meta);

    // Health scores (Slice 5)
    if (recipe.dietCompassScores) {
      const healthBars = document.createElement('div');
      healthBars.className = 'flex flex-wrap gap-2 items-center mb-3';
      
      const metrics = [
        { icon: '🥗', score: recipe.dietCompassScores.nutrientDensity },
        { icon: '⏳', score: recipe.dietCompassScores.antiAging },
        { icon: '⚖️', score: recipe.dietCompassScores.weightLoss },
        { icon: '❤️', score: recipe.dietCompassScores.heartHealth }
      ];
      
      metrics.forEach(({ icon, score }) => {
        const metricDiv = document.createElement('div');
        metricDiv.className = 'flex items-center gap-1';
        metricDiv.innerHTML = `
          <span class="text-xs">${icon}</span>
          ${this.renderMiniBar(score)}
        `;
        healthBars.appendChild(metricDiv);
      });
      
      content.appendChild(healthBars);
    }

    // Rating
    if (recipe.rating) {
      const rating = document.createElement('div');
      rating.className = 'flex items-center gap-1 mb-3';
      rating.innerHTML = this.renderStars(recipe.rating);
      content.appendChild(rating);
    }

    // Times cooked
    const timesCooked = document.createElement('div');
    timesCooked.className = 'text-xs text-gray-500';
    const cookedCount = recipe.timesCooked || 0;
    timesCooked.textContent = cookedCount > 0 ? `Cooked ${cookedCount} time${cookedCount !== 1 ? 's' : ''}` : 'Never cooked';
    content.appendChild(timesCooked);

    // Tags
    if (recipe.tags && recipe.tags.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'flex flex-wrap gap-1 mt-3';
      recipe.tags.slice(0, 3).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
      });
      content.appendChild(tags);
    }

    card.appendChild(imageContainer);
    card.appendChild(content);

    return card;
  }

  /**
   * Render mini health bar (5 segments)
   * @param {number} score - Health score (0-100)
   * @returns {string} HTML for mini bar
   */
  renderMiniBar(score) {
    const segments = score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1;
    const color = score >= 60 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-gray-400';
    
    let html = '<div class="flex gap-0.5">';
    for (let i = 1; i <= 5; i++) {
      html += `<div class="w-1.5 h-3 rounded-sm ${i <= segments ? color : 'bg-gray-200'}"></div>`;
    }
    html += '</div>';
    return html;
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    const container = document.createElement('div');
    container.className = 'text-center py-16';

    const icon = document.createElement('div');
    icon.className = 'text-6xl mb-4';
    
    let message = '';
    
    if (this.state.searchQuery) {
      icon.textContent = '🔍';
      message = `No recipes found for "${this.state.searchQuery}"`;
    } else if (this.state.activeFilter === 'favorites') {
      icon.textContent = '❤️';
      message = 'No favorite recipes yet. Mark recipes as favorites from their detail pages!';
    } else if (this.state.activeFilter === 'high-rated') {
      icon.textContent = '⭐';
      message = 'No highly-rated recipes yet. Rate recipes from their detail pages!';
    } else if (this.state.activeFilter === 'most-cooked') {
      icon.textContent = '🔥';
      message = 'No frequently cooked recipes yet. Cook some recipes to see them here!';
    } else {
      icon.textContent = '📖';
      message = 'No recipes in your library yet. Generate a meal plan to add recipes!';
    }

    const text = document.createElement('p');
    text.className = 'text-lg text-gray-600 mb-6';
    text.textContent = message;

    const actionBtn = document.createElement('button');
    actionBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors';
    actionBtn.textContent = 'Generate Meal Plan';
    actionBtn.onclick = () => window.location.hash = '#/generating';

    container.appendChild(icon);
    container.appendChild(text);
    if (this.state.recipes.length === 0) {
      container.appendChild(actionBtn);
    }

    return container;
  }

  /**
   * Helper: Get appropriate emoji for recipe
   */
  getRecipeEmoji(recipe) {
    const name = recipe.name.toLowerCase();
    
    if (name.includes('chicken')) return '🍗';
    if (name.includes('beef') || name.includes('steak')) return '🥩';
    if (name.includes('fish') || name.includes('salmon')) return '🐟';
    if (name.includes('pasta') || name.includes('spaghetti')) return '🍝';
    if (name.includes('salad')) return '🥗';
    if (name.includes('soup')) return '🍲';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('burger')) return '🍔';
    if (name.includes('taco')) return '🌮';
    if (name.includes('curry')) return '🍛';
    if (name.includes('rice')) return '🍚';
    if (name.includes('egg')) return '🥚';
    if (name.includes('breakfast')) return '🍳';
    if (name.includes('sandwich')) return '🥪';
    if (name.includes('vegetable') || name.includes('veggie')) return '🥦';
    
    return '🍽️';
  }

  /**
   * Helper: Render star rating
   */
  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= rating ? '⭐' : '☆';
    }
    return `<span class="text-yellow-500">${stars}</span>`;
  }

  /**
   * Event Handlers
   */

  handleSearch(value) {
    // Clear existing timeout
    if (this.state.searchTimeout) {
      clearTimeout(this.state.searchTimeout);
    }

    // Debounce search
    this.state.searchTimeout = setTimeout(() => {
      this.state.searchQuery = value;
      this.applyFilters();
      this.rerender();
    }, 300);
  }

  handleFilterChange(filterId) {
    this.state.activeFilter = filterId;
    this.applyFilters();
    this.rerender();
  }

  handleRecipeClick(recipe) {
    // Navigate to recipe detail page (Task 41)
    window.location.hash = `#/recipe/${recipe.recipeId}`;
  }

  /**
   * Re-render the page
   */
  rerender() {
    const currentContainer = document.getElementById('recipe-library-container');
    if (!currentContainer) {
      console.error('Recipe library container not found');
      return;
    }

    const newContainer = this.render();
    currentContainer.replaceWith(newContainer);
  }

  /**
   * Lifecycle hook
   */
  afterRender() {
    console.log('Recipe library page rendered');
    
    // Slice 4: Add event listener for Add Recipe button (Task 56)
    const addRecipeBtn = document.getElementById('add-recipe-btn');
    if (addRecipeBtn) {
      addRecipeBtn.addEventListener('click', () => {
        this.showImportModal();
      });
    }
  }
  
  /**
   * Show recipe import modal (Slice 4: Task 56)
   */
  showImportModal() {
    const modal = new RecipeImportModal(
      (recipe) => {
        // On success callback
        console.log('Recipe imported:', recipe);
        // Page will navigate to recipe detail, so no need to refresh here
      },
      () => {
        // On close callback
        console.log('Modal closed');
      }
    );
    
    modal.show();
  }
}

