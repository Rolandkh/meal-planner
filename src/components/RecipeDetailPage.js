/**
 * RecipeDetailPage Component
 * Detailed view of a recipe with rating, favorite toggle, and full information
 * Slice 3 - Task 41
 */

import {
  loadRecipes,
  toggleFavorite,
  updateRating,
  incrementTimesCooked
} from '../utils/storage.js';
import { getRecipeCatalog } from '../utils/catalogStorage.js';

export class RecipeDetailPage {
  constructor(params) {
    this.recipeId = params.id;
    this.state = {
      recipe: null,
      loading: true,
      error: null,
      isCatalogRecipe: false
    };
  }

  /**
   * Load recipe data before rendering
   */
  beforeRender() {
    // Try user recipes first
    let recipes = loadRecipes();
    this.state.recipe = recipes.find(r => r.recipeId === this.recipeId);
    
    // If not found, try catalog
    if (!this.state.recipe) {
      const catalog = getRecipeCatalog();
      this.state.recipe = catalog.find(r => r.recipeId === this.recipeId);
      this.state.isCatalogRecipe = !!this.state.recipe;
    }
    
    this.state.loading = false;
    
    if (!this.state.recipe) {
      this.state.error = 'Recipe not found';
      console.error('Recipe not found:', this.recipeId);
    } else {
      console.log('Recipe loaded:', this.state.recipe.name, this.state.isCatalogRecipe ? '(from catalog)' : '(user recipe)');
    }
  }

  /**
   * Main render method
   */
  render() {
    const container = document.createElement('div');
    container.className = 'recipe-detail min-h-screen bg-gray-50';
    container.id = 'recipe-detail-container';
    
    if (this.state.loading) {
      container.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="text-xl text-gray-600">Loading recipe...</div></div>';
      return container;
    }
    
    if (this.state.error) {
      container.appendChild(this.renderError());
      return container;
    }
    
    // Header
    const header = this.renderHeader();
    container.appendChild(header);

    // Main content
    const main = document.createElement('div');
    main.className = 'container mx-auto px-4 py-8 max-w-4xl';

    // Recipe hero section
    const hero = this.renderHeroSection();
    main.appendChild(hero);

    // Meta information
    const metaInfo = this.renderMetaInfo();
    main.appendChild(metaInfo);

    // Health scores section (Slice 5)
    if (this.state.recipe.dietCompassScores) {
      const healthScores = this.renderHealthScoresSection();
      main.appendChild(healthScores);
    }

    // Ingredients section
    const ingredients = this.renderIngredientsSection();
    main.appendChild(ingredients);

    // Instructions section
    const instructions = this.renderInstructionsSection();
    main.appendChild(instructions);

    // Tags section
    if (this.state.recipe.tags && this.state.recipe.tags.length > 0) {
      const tags = this.renderTagsSection();
      main.appendChild(tags);
    }

    // Usage history section
    const usage = this.renderUsageSection();
    main.appendChild(usage);

    container.appendChild(main);

    return container;
  }

  /**
   * Render error state
   */
  renderError() {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'min-h-screen flex items-center justify-center bg-gray-50';

    const errorCard = document.createElement('div');
    errorCard.className = 'max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center';

    const icon = document.createElement('div');
    icon.className = 'text-6xl mb-4';
    icon.textContent = '😕';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-gray-900 mb-4';
    title.textContent = 'Recipe Not Found';

    const message = document.createElement('p');
    message.className = 'text-gray-600 mb-6';
    message.textContent = 'This recipe doesn\'t exist or may have been deleted.';

    const backBtn = document.createElement('button');
    backBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors';
    backBtn.textContent = 'Back to Recipe Library';
    backBtn.onclick = () => window.location.hash = '#/recipes';

    errorCard.appendChild(icon);
    errorCard.appendChild(title);
    errorCard.appendChild(message);
    errorCard.appendChild(backBtn);
    errorContainer.appendChild(errorCard);

    return errorContainer;
  }

  /**
   * Render page header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'bg-white shadow-sm border-b border-gray-200';

    const inner = document.createElement('div');
    inner.className = 'container mx-auto px-4 py-4 max-w-4xl';
    
    // Slice 4: Add flex container for multiple buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex items-center justify-between';

    const backBtn = document.createElement('button');
    backBtn.className = 'text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2';
    backBtn.innerHTML = '← Back to Recipes';
    backBtn.onclick = () => window.location.hash = '#/recipes';
    
    // Slice 4: Edit button (Task 47)
    const editBtn = document.createElement('button');
    editBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors';
    editBtn.innerHTML = `
      <span>✏️</span>
      <span>Edit Recipe</span>
    `;
    editBtn.onclick = () => window.location.hash = `#/recipe/${this.recipeId}/edit`;

    buttonContainer.appendChild(backBtn);
    buttonContainer.appendChild(editBtn);
    inner.appendChild(buttonContainer);
    header.appendChild(inner);

    return header;
  }

  /**
   * Render hero section with title, rating, and favorite
   */
  renderHeroSection() {
    const hero = document.createElement('div');
    hero.className = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6';

    // Image placeholder
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.className = 'h-64 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-8xl';
    imagePlaceholder.textContent = this.getRecipeEmoji(this.state.recipe);

    // Content
    const content = document.createElement('div');
    content.className = 'p-6';

    // Title row
    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-start justify-between mb-4';

    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold text-gray-900 flex-1';
    title.textContent = this.state.recipe.name;

    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'text-4xl transition-transform hover:scale-110';
    favoriteBtn.textContent = this.state.recipe.isFavorite ? '❤️' : '🤍';
    favoriteBtn.id = 'favorite-btn';
    favoriteBtn.onclick = () => this.handleToggleFavorite();

    titleRow.appendChild(title);
    titleRow.appendChild(favoriteBtn);

    // Star rating
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'flex items-center gap-1';
    ratingContainer.id = 'star-rating-container';
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('button');
      star.className = 'text-3xl transition-transform hover:scale-110 focus:outline-none';
      star.textContent = i <= (this.state.recipe.rating || 0) ? '⭐' : '☆';
      star.dataset.value = i;
      star.onclick = () => this.handleUpdateRating(i);
      ratingContainer.appendChild(star);
    }

    content.appendChild(titleRow);
    content.appendChild(ratingContainer);

    hero.appendChild(imagePlaceholder);
    hero.appendChild(content);

    return hero;
  }

  /**
   * Render meta information card
   */
  renderMetaInfo() {
    const card = this.createCard('Recipe Information', this.renderMetaContent());
    return card;
  }

  /**
   * Render meta content (prep time, cook time, servings, etc.)
   */
  renderMetaContent() {
    const content = document.createElement('div');
    content.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';

    const metaItems = [
      { label: 'Prep Time', value: `${this.state.recipe.prepTime || 0} min`, icon: '⏱️' },
      { label: 'Cook Time', value: `${this.state.recipe.cookTime || 0} min`, icon: '🔥' },
      { label: 'Total Time', value: `${(this.state.recipe.prepTime || 0) + (this.state.recipe.cookTime || 0)} min`, icon: '⌚' },
      { label: 'Servings', value: this.state.recipe.servings || 0, icon: '🍽️' }
    ];

    metaItems.forEach(item => {
      const metaItem = document.createElement('div');
      metaItem.className = 'text-center';
      metaItem.innerHTML = `
        <div class="text-3xl mb-2">${item.icon}</div>
        <div class="text-2xl font-bold text-gray-900 mb-1">${item.value}</div>
        <div class="text-sm text-gray-600">${item.label}</div>
      `;
      content.appendChild(metaItem);
    });

    return content;
  }

  /**
   * Render health scores section (Slice 5)
   */
  renderHealthScoresSection() {
    const section = document.createElement('div');
    section.className = 'bg-white rounded-lg p-6 shadow-sm mb-6 border border-gray-200';

    const scores = this.state.recipe.dietCompassScores;

    section.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-900 mb-4">🏥 Diet Compass Health Score</h2>
      
      <div class="mb-6 pb-6 border-b border-gray-200">
        <div class="flex items-baseline gap-3">
          <span class="text-5xl font-bold ${scores.overall >= 60 ? 'text-green-600' : scores.overall >= 40 ? 'text-yellow-600' : 'text-gray-500'}">${scores.overall}</span>
          <span class="text-gray-400 text-xl">/100</span>
          <span class="ml-3 px-3 py-1 rounded-lg text-sm font-semibold ${
            scores.overall >= 80 ? 'bg-green-100 text-green-800' :
            scores.overall >= 60 ? 'bg-green-50 text-green-700' :
            scores.overall >= 40 ? 'bg-yellow-100 text-yellow-800' :
            'bg-orange-100 text-orange-800'
          }">
            ${scores.overall >= 80 ? 'Excellent' : scores.overall >= 60 ? 'Good' : scores.overall >= 40 ? 'Moderate' : 'Fair'}
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-2">Overall health rating based on ingredients and nutritional profile</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🥗</span>
            <span class="text-sm font-medium text-gray-700">Nutrient Density</span>
          </div>
          <span class="text-2xl font-bold ${scores.nutrientDensity >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.nutrientDensity}</span>
        </div>
        
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⏳</span>
            <span class="text-sm font-medium text-gray-700">Anti-Aging</span>
          </div>
          <span class="text-2xl font-bold ${scores.antiAging >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.antiAging}</span>
        </div>
        
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚖️</span>
            <span class="text-sm font-medium text-gray-700">Weight Loss</span>
          </div>
          <span class="text-2xl font-bold ${scores.weightLoss >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.weightLoss}</span>
        </div>
        
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">❤️</span>
            <span class="text-sm font-medium text-gray-700">Heart Health</span>
          </div>
          <span class="text-2xl font-bold ${scores.heartHealth >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.heartHealth}</span>
        </div>
      </div>
      
      ${this.state.recipe.source === 'spoonacular' ? `
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs text-blue-700">
            <strong>📊 From Spoonacular Catalog</strong> - Professional recipe with verified nutrition data
          </p>
        </div>
      ` : ''}
    `;

    return section;
  }

  /**
   * Render health scores section (Slice 5)
   */
  renderHealthScoresSection() {
    const section = document.createElement('div');
    section.className = 'bg-white rounded-lg p-6 shadow-sm mb-6 border border-gray-200';

    const scores = this.state.recipe.dietCompassScores;

    section.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-900 mb-4">🏥 Diet Compass Health Score</h2>
      
      <div class="mb-6 pb-6 border-b border-gray-200">
        <div class="flex items-baseline gap-3">
          <span class="text-5xl font-bold ${scores.overall >= 60 ? 'text-green-600' : scores.overall >= 40 ? 'text-yellow-600' : 'text-gray-500'}">${scores.overall}</span>
          <span class="text-gray-400 text-xl">/100</span>
          <span class="ml-3 px-3 py-1 rounded-lg text-sm font-semibold ${
            scores.overall >= 80 ? 'bg-green-100 text-green-800' :
            scores.overall >= 60 ? 'bg-green-50 text-green-700' :
            scores.overall >= 40 ? 'bg-yellow-100 text-yellow-800' :
            'bg-orange-100 text-orange-800'
          }">
            ${scores.overall >= 80 ? 'Excellent' : scores.overall >= 60 ? 'Good' : scores.overall >= 40 ? 'Moderate' : 'Fair'}
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-2">Overall health rating based on ingredients and nutritional profile</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🥗</span>
            <span class="text-sm font-medium text-gray-700">Nutrient Density</span>
          </div>
          <span class="text-2xl font-bold ${scores.nutrientDensity >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.nutrientDensity}</span>
        </div>
        
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⏳</span>
            <span class="text-sm font-medium text-gray-700">Anti-Aging</span>
          </div>
          <span class="text-2xl font-bold ${scores.antiAging >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.antiAging}</span>
        </div>
        
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚖️</span>
            <span class="text-sm font-medium text-gray-700">Weight Loss</span>
          </div>
          <span class="text-2xl font-bold ${scores.weightLoss >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.weightLoss}</span>
        </div>
        
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">❤️</span>
            <span class="text-sm font-medium text-gray-700">Heart Health</span>
          </div>
          <span class="text-2xl font-bold ${scores.heartHealth >= 60 ? 'text-green-600' : 'text-gray-500'}">${scores.heartHealth}</span>
        </div>
      </div>
      
      ${this.state.recipe.source === 'spoonacular' ? `
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs text-blue-700">
            <strong>📊 From Spoonacular Catalog</strong> - Professional recipe with verified nutrition data
          </p>
        </div>
      ` : ''}
    `;

    return section;
  }

  /**
   * Render ingredients section
   */
  renderIngredientsSection() {
    const card = this.createCard('Ingredients', this.renderIngredients());
    return card;
  }

  /**
   * Render ingredients list
   */
  renderIngredients() {
    const content = document.createElement('div');
    
    if (!this.state.recipe.ingredients || this.state.recipe.ingredients.length === 0) {
      content.className = 'text-gray-500 text-center py-4';
      content.textContent = 'No ingredients listed';
      return content;
    }

    // Group ingredients by category if they exist
    const grouped = {};
    this.state.recipe.ingredients.forEach(ing => {
      const category = ing.category || 'Ingredients';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(ing);
    });

    Object.keys(grouped).forEach(category => {
      if (Object.keys(grouped).length > 1) {
        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'font-semibold text-gray-900 mb-3 mt-4 first:mt-0';
        categoryTitle.textContent = category;
        content.appendChild(categoryTitle);
      }

      const list = document.createElement('ul');
      list.className = 'space-y-2';

      grouped[category].forEach(ing => {
        const item = document.createElement('li');
        item.className = 'flex items-start';
        
        const bullet = document.createElement('span');
        bullet.className = 'text-blue-500 mr-3 mt-1';
        bullet.textContent = '•';
        
        const text = document.createElement('span');
        text.className = 'text-gray-700';
        text.textContent = `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim();
        
        item.appendChild(bullet);
        item.appendChild(text);
        list.appendChild(item);
      });

      content.appendChild(list);
    });

    return content;
  }

  /**
   * Render instructions section
   */
  renderInstructionsSection() {
    const card = this.createCard('Instructions', this.renderInstructions());
    return card;
  }

  /**
   * Render instructions
   */
  renderInstructions() {
    const content = document.createElement('div');
    
    if (!this.state.recipe.instructions) {
      content.className = 'text-gray-500 text-center py-4';
      content.textContent = 'No instructions provided';
      return content;
    }

    content.className = 'prose prose-gray max-w-none';
    
    // If instructions are a string with line breaks, convert to numbered list
    const instructions = this.state.recipe.instructions;
    
    if (typeof instructions === 'string') {
      const steps = instructions.split('\n').filter(s => s.trim());
      
      if (steps.length > 1) {
        const ol = document.createElement('ol');
        ol.className = 'space-y-3 list-decimal list-inside';
        
        steps.forEach(step => {
          const li = document.createElement('li');
          li.className = 'text-gray-700';
          li.textContent = step.trim();
          ol.appendChild(li);
        });
        
        content.appendChild(ol);
      } else {
        const p = document.createElement('p');
        p.className = 'text-gray-700 whitespace-pre-wrap';
        p.textContent = instructions;
        content.appendChild(p);
      }
    } else if (Array.isArray(instructions)) {
      const ol = document.createElement('ol');
      ol.className = 'space-y-3 list-decimal list-inside';
      
      instructions.forEach(step => {
        const li = document.createElement('li');
        li.className = 'text-gray-700';
        li.textContent = step;
        ol.appendChild(li);
      });
      
      content.appendChild(ol);
    }

    return content;
  }

  /**
   * Render tags section
   */
  renderTagsSection() {
    const card = this.createCard('Tags', this.renderTags());
    return card;
  }

  /**
   * Render tags
   */
  renderTags() {
    const content = document.createElement('div');
    content.className = 'flex flex-wrap gap-2';

    this.state.recipe.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors';
      tagEl.textContent = tag;
      tagEl.onclick = () => {
        window.location.hash = '#/recipes';
        // Future: pre-filter by this tag
      };
      content.appendChild(tagEl);
    });

    return content;
  }

  /**
   * Render usage history section
   */
  renderUsageSection() {
    const card = this.createCard('Cooking History', this.renderUsageContent());
    return card;
  }

  /**
   * Render usage content
   */
  renderUsageContent() {
    const content = document.createElement('div');
    content.className = 'space-y-4';

    const timesCooked = this.state.recipe.timesCooked || 0;
    const lastCooked = this.state.recipe.lastCooked;

    // Times cooked
    const cookedDiv = document.createElement('div');
    cookedDiv.className = 'flex items-center justify-between';
    
    const cookedLabel = document.createElement('span');
    cookedLabel.className = 'text-gray-700';
    cookedLabel.textContent = 'Times Cooked:';
    
    const cookedValue = document.createElement('span');
    cookedValue.className = 'text-xl font-semibold text-gray-900';
    cookedValue.textContent = timesCooked;
    
    cookedDiv.appendChild(cookedLabel);
    cookedDiv.appendChild(cookedValue);
    content.appendChild(cookedDiv);

    // Last cooked
    if (lastCooked) {
      const lastCookedDiv = document.createElement('div');
      lastCookedDiv.className = 'flex items-center justify-between';
      
      const lastCookedLabel = document.createElement('span');
      lastCookedLabel.className = 'text-gray-700';
      lastCookedLabel.textContent = 'Last Cooked:';
      
      const lastCookedValue = document.createElement('span');
      lastCookedValue.className = 'text-gray-900';
      lastCookedValue.textContent = new Date(lastCooked).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      lastCookedDiv.appendChild(lastCookedLabel);
      lastCookedDiv.appendChild(lastCookedValue);
      content.appendChild(lastCookedDiv);
    }

    // Mark as cooked button
    const markCookedBtn = document.createElement('button');
    markCookedBtn.className = 'w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2';
    markCookedBtn.innerHTML = '✅ Mark as Cooked';
    markCookedBtn.onclick = () => this.handleMarkCooked();
    content.appendChild(markCookedBtn);

    return content;
  }

  /**
   * Helper: Create a card container
   */
  createCard(title, content) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6';

    const header = document.createElement('div');
    header.className = 'px-6 py-4 border-b border-gray-200 bg-gray-50';
    const h2 = document.createElement('h2');
    h2.className = 'text-xl font-semibold text-gray-900';
    h2.textContent = title;
    header.appendChild(h2);

    const body = document.createElement('div');
    body.className = 'px-6 py-6';
    body.appendChild(content);

    card.appendChild(header);
    card.appendChild(body);

    return card;
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
   * Event Handlers
   */

  handleToggleFavorite() {
    const result = toggleFavorite(this.recipeId);
    
    if (result.success) {
      this.state.recipe.isFavorite = !this.state.recipe.isFavorite;
      
      // Update favorite button
      const favoriteBtn = document.getElementById('favorite-btn');
      if (favoriteBtn) {
        favoriteBtn.textContent = this.state.recipe.isFavorite ? '❤️' : '🤍';
      }
      
      this.showToast(
        this.state.recipe.isFavorite ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } else {
      this.showToast('Error updating favorite status', 'error');
    }
  }

  handleUpdateRating(rating) {
    const result = updateRating(this.recipeId, rating);
    
    if (result.success) {
      this.state.recipe.rating = rating;
      
      // Update star display
      const container = document.getElementById('star-rating-container');
      if (container) {
        const stars = container.querySelectorAll('button');
        stars.forEach((star, index) => {
          star.textContent = (index + 1) <= rating ? '⭐' : '☆';
        });
      }
      
      this.showToast(`Rated ${rating} star${rating !== 1 ? 's' : ''}`, 'success');
    } else {
      this.showToast('Error updating rating', 'error');
    }
  }

  handleMarkCooked() {
    const result = incrementTimesCooked(this.recipeId);
    
    if (result.success) {
      this.showToast('Marked as cooked!', 'success');
      
      // Reload recipe data and rerender
      setTimeout(() => {
        this.beforeRender();
        this.rerender();
      }, 1000);
    } else {
      this.showToast('Error marking as cooked', 'error');
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `
      fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium
      transition-all transform translate-y-0 opacity-100 z-50
      ${type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'}
    `.trim().replace(/\s+/g, ' ');
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Re-render the page
   */
  rerender() {
    const currentContainer = document.getElementById('recipe-detail-container');
    if (!currentContainer) {
      console.error('Recipe detail container not found');
      return;
    }

    const newContainer = this.render();
    currentContainer.replaceWith(newContainer);
  }

  /**
   * Lifecycle hook
   */
  afterRender() {
    console.log('Recipe detail page rendered');
  }
}

