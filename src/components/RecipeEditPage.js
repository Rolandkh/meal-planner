/**
 * Recipe Edit Page Component
 * Allows editing existing recipes with full form validation and auto-save
 * Slice 4: Task 47 (5 subtasks)
 */

import { loadRecipes, updateRecipe } from '../utils/storage.js';

export class RecipeEditPage {
  constructor(params) {
    this.recipeId = params.id;
    this.state = {
      recipe: null,
      originalRecipe: null, // For discard changes
      loading: true,
      errors: {},
      isDirty: false,
      lastSaved: null,
      saving: false
    };
    this.autoSaveInterval = null;
    this.draftKey = `recipe_draft_${this.recipeId}`;
  }

  // Subtask 1: Component setup and routing
  beforeRender() {
    this.loadRecipe();
  }

  // Subtask 2: Recipe loading and data pre-population
  loadRecipe() {
    const recipes = loadRecipes();
    const recipe = recipes.find(r => r.recipeId === this.recipeId);
    
    if (recipe) {
      // Deep clone to avoid mutating original
      this.state.recipe = JSON.parse(JSON.stringify(recipe));
      this.state.originalRecipe = JSON.parse(JSON.stringify(recipe));
      this.state.loading = false;
      
      // Check for existing draft
      const draft = this.loadDraft();
      if (draft) {
        const useDraft = confirm('You have unsaved changes. Would you like to restore them?');
        if (useDraft) {
          this.state.recipe = draft;
          this.state.isDirty = true;
        } else {
          this.clearDraft();
        }
      }
    } else {
      this.state.error = 'Recipe not found';
      this.state.loading = false;
    }
  }

  loadDraft() {
    try {
      const saved = localStorage.getItem(this.draftKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }

  saveDraft() {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(this.state.recipe));
      this.state.lastSaved = new Date();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }

  clearDraft() {
    try {
      localStorage.removeItem(this.draftKey);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }

  // Subtask 4: Auto-save functionality
  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.state.isDirty && !this.state.saving) {
        this.saveDraft();
        this.showAutoSaveIndicator();
      }
    }, 30000); // 30 seconds
  }

  showAutoSaveIndicator() {
    const indicator = document.getElementById('autosave-indicator');
    if (indicator) {
      indicator.textContent = `Draft saved at ${new Date().toLocaleTimeString()}`;
      indicator.classList.remove('opacity-0');
      setTimeout(() => {
        indicator.classList.add('opacity-0');
      }, 3000);
    }
  }

  // Subtask 3: Form validation
  validateForm() {
    const errors = {};
    const { recipe } = this.state;
    
    // Validate name
    if (!recipe.name || recipe.name.trim().length < 3) {
      errors.name = 'Recipe name must be at least 3 characters';
    } else if (recipe.name.length > 100) {
      errors.name = 'Recipe name must be 100 characters or less';
    }
    
    // Validate ingredients
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length < 1) {
      errors.ingredients = 'At least one ingredient is required';
    } else if (recipe.ingredients.length > 30) {
      errors.ingredients = 'Maximum 30 ingredients allowed';
    } else {
      // Validate each ingredient
      recipe.ingredients.forEach((ing, index) => {
        if (!ing.name || ing.name.trim().length < 1) {
          errors[`ingredient_${index}_name`] = 'Ingredient name required';
        }
        if (typeof ing.quantity !== 'number' || ing.quantity <= 0) {
          errors[`ingredient_${index}_quantity`] = 'Valid quantity required';
        }
        if (!ing.unit || ing.unit.trim().length < 1) {
          errors[`ingredient_${index}_unit`] = 'Unit required';
        }
      });
    }
    
    // Validate instructions
    if (!recipe.instructions || recipe.instructions.trim().length < 10) {
      errors.instructions = 'Instructions must be at least 10 characters';
    }
    
    // Validate times
    if (typeof recipe.prepTime !== 'number' || recipe.prepTime < 0) {
      errors.prepTime = 'Prep time must be a non-negative number';
    }
    
    if (typeof recipe.cookTime !== 'number' || recipe.cookTime < 0) {
      errors.cookTime = 'Cook time must be a non-negative number';
    }
    
    // Validate servings
    if (typeof recipe.servings !== 'number' || recipe.servings < 1 || recipe.servings > 20) {
      errors.servings = 'Servings must be between 1 and 20';
    }
    
    return errors;
  }

  // Subtask 5: Form submission and recipe update
  handleSubmit(e) {
    e.preventDefault();
    
    const errors = this.validateForm();
    
    if (Object.keys(errors).length > 0) {
      this.state.errors = errors;
      this.render();
      return;
    }
    
    this.state.saving = true;
    this.state.errors = {};
    
    // Update recipe
    const result = updateRecipe(this.recipeId, this.state.recipe);
    
    if (result.success) {
      // Clear draft
      this.clearDraft();
      this.state.isDirty = false;
      
      // Show success message
      this.showToast('Recipe updated successfully!', 'success');
      
      // Navigate back to recipe detail
      setTimeout(() => {
        window.location.hash = `#/recipe/${this.recipeId}`;
      }, 1000);
    } else {
      this.state.saving = false;
      this.showToast(result.message || 'Failed to update recipe', 'error');
      this.render();
    }
  }

  handleDiscard() {
    if (this.state.isDirty) {
      const confirmed = confirm('Discard all changes? This cannot be undone.');
      if (confirmed) {
        this.clearDraft();
        window.location.hash = `#/recipe/${this.recipeId}`;
      }
    } else {
      window.location.hash = `#/recipe/${this.recipeId}`;
    }
  }

  handleFieldChange(field, value) {
    this.state.recipe[field] = value;
    this.state.isDirty = true;
    
    // Clear error for this field
    if (this.state.errors[field]) {
      delete this.state.errors[field];
    }
  }

  handleIngredientChange(index, field, value) {
    if (!this.state.recipe.ingredients[index]) {
      this.state.recipe.ingredients[index] = { name: '', quantity: 0, unit: 'g', category: 'other' };
    }
    
    this.state.recipe.ingredients[index][field] = field === 'quantity' ? parseFloat(value) || 0 : value;
    this.state.isDirty = true;
    
    // Clear error for this ingredient field
    const errorKey = `ingredient_${index}_${field}`;
    if (this.state.errors[errorKey]) {
      delete this.state.errors[errorKey];
    }
  }

  addIngredient() {
    if (!this.state.recipe.ingredients) {
      this.state.recipe.ingredients = [];
    }
    
    this.state.recipe.ingredients.push({
      name: '',
      quantity: 0,
      unit: 'g',
      category: 'other'
    });
    
    this.state.isDirty = true;
    this.render();
  }

  removeIngredient(index) {
    if (this.state.recipe.ingredients.length > 1) {
      this.state.recipe.ingredients.splice(index, 1);
      this.state.isDirty = true;
      this.render();
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  render() {
    const container = document.createElement('div');
    container.className = 'recipe-edit-page container mx-auto px-4 py-8 max-w-4xl';
    
    if (this.state.loading) {
      container.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading recipe...</p>
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
              onclick="window.location.hash='#/recipes'" 
              class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Back to Recipes
            </button>
          </div>
        </div>
      `;
      return container;
    }
    
    const { recipe, errors, isDirty, lastSaved, saving } = this.state;
    
    // Header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-8';
    header.innerHTML = `
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Edit Recipe</h1>
        <p class="text-gray-600 mt-1">Make changes to your recipe</p>
      </div>
      <div class="flex items-center space-x-4">
        <div id="autosave-indicator" class="text-sm text-gray-500 opacity-0 transition-opacity">
          ${lastSaved ? `Draft saved at ${lastSaved.toLocaleTimeString()}` : ''}
        </div>
        ${isDirty ? '<span class="text-sm text-amber-600 font-medium">● Unsaved changes</span>' : ''}
      </div>
    `;
    container.appendChild(header);
    
    // Form
    const form = document.createElement('form');
    form.className = 'bg-white rounded-lg shadow-md p-8';
    form.onsubmit = (e) => this.handleSubmit(e);
    
    // Recipe Name
    form.innerHTML += `
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Recipe Name <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="recipe-name"
          value="${recipe.name || ''}"
          class="w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Grilled Chicken Salad"
        />
        ${errors.name ? `<p class="text-red-500 text-sm mt-1">${errors.name}</p>` : ''}
      </div>
    `;
    
    // Ingredients Section
    const ingredientsSection = document.createElement('div');
    ingredientsSection.className = 'mb-6';
    ingredientsSection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Ingredients <span class="text-red-500">*</span>
      </label>
      ${errors.ingredients ? `<p class="text-red-500 text-sm mb-2">${errors.ingredients}</p>` : ''}
      <div id="ingredients-container" class="space-y-3"></div>
      <button
        type="button"
        id="add-ingredient-btn"
        class="mt-3 px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors"
      >
        + Add Ingredient
      </button>
    `;
    form.appendChild(ingredientsSection);
    
    // Instructions
    form.innerHTML += `
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Instructions <span class="text-red-500">*</span>
        </label>
        <textarea
          id="recipe-instructions"
          rows="6"
          class="w-full px-4 py-2 border ${errors.instructions ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Step-by-step instructions..."
        >${recipe.instructions || ''}</textarea>
        ${errors.instructions ? `<p class="text-red-500 text-sm mt-1">${errors.instructions}</p>` : ''}
      </div>
    `;
    
    // Times and Servings Row
    form.innerHTML += `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Prep Time (min) <span class="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="recipe-prep-time"
            value="${recipe.prepTime || 0}"
            min="0"
            class="w-full px-4 py-2 border ${errors.prepTime ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          ${errors.prepTime ? `<p class="text-red-500 text-sm mt-1">${errors.prepTime}</p>` : ''}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Cook Time (min) <span class="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="recipe-cook-time"
            value="${recipe.cookTime || 0}"
            min="0"
            class="w-full px-4 py-2 border ${errors.cookTime ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          ${errors.cookTime ? `<p class="text-red-500 text-sm mt-1">${errors.cookTime}</p>` : ''}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Servings <span class="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="recipe-servings"
            value="${recipe.servings || 4}"
            min="1"
            max="20"
            class="w-full px-4 py-2 border ${errors.servings ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          ${errors.servings ? `<p class="text-red-500 text-sm mt-1">${errors.servings}</p>` : ''}
        </div>
      </div>
    `;
    
    // Tags
    form.innerHTML += `
      <div class="mb-8">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="recipe-tags"
          value="${(recipe.tags || []).join(', ')}"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., italian, quick, healthy"
        />
        <p class="text-sm text-gray-500 mt-1">Separate multiple tags with commas</p>
      </div>
    `;
    
    // Action Buttons
    const actions = document.createElement('div');
    actions.className = 'flex items-center justify-between pt-6 border-t';
    actions.innerHTML = `
      <button
        type="button"
        id="discard-btn"
        class="px-6 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
        ${saving ? 'disabled' : ''}
      >
        Discard Changes
      </button>
      
      <div class="flex items-center space-x-4">
        <button
          type="button"
          id="cancel-btn"
          class="px-6 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
          ${saving ? 'disabled' : ''}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium ${saving ? 'opacity-50 cursor-not-allowed' : ''}"
          ${saving ? 'disabled' : ''}
        >
          ${saving ? 'Saving...' : 'Save Recipe'}
        </button>
      </div>
    `;
    form.appendChild(actions);
    
    container.appendChild(form);
    
    return container;
  }

  renderIngredients() {
    const ingredientsContainer = document.getElementById('ingredients-container');
    if (!ingredientsContainer) return;
    
    ingredientsContainer.innerHTML = '';
    
    const { recipe, errors } = this.state;
    
    (recipe.ingredients || []).forEach((ingredient, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-start space-x-2';
      row.innerHTML = `
        <div class="flex-1">
          <input
            type="text"
            data-ing-index="${index}"
            data-field="name"
            value="${ingredient.name || ''}"
            class="w-full px-3 py-2 border ${errors[`ingredient_${index}_name`] ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm"
            placeholder="Ingredient name"
          />
          ${errors[`ingredient_${index}_name`] ? `<p class="text-red-500 text-xs mt-1">${errors[`ingredient_${index}_name`]}</p>` : ''}
        </div>
        
        <div class="w-24">
          <input
            type="number"
            data-ing-index="${index}"
            data-field="quantity"
            value="${ingredient.quantity || 0}"
            step="0.01"
            min="0"
            class="w-full px-3 py-2 border ${errors[`ingredient_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm"
            placeholder="Qty"
          />
          ${errors[`ingredient_${index}_quantity`] ? `<p class="text-red-500 text-xs mt-1">${errors[`ingredient_${index}_quantity`]}</p>` : ''}
        </div>
        
        <div class="w-20">
          <select
            data-ing-index="${index}"
            data-field="unit"
            class="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="g" ${ingredient.unit === 'g' ? 'selected' : ''}>g</option>
            <option value="kg" ${ingredient.unit === 'kg' ? 'selected' : ''}>kg</option>
            <option value="ml" ${ingredient.unit === 'ml' ? 'selected' : ''}>ml</option>
            <option value="l" ${ingredient.unit === 'l' ? 'selected' : ''}>l</option>
            <option value="whole" ${ingredient.unit === 'whole' ? 'selected' : ''}>whole</option>
          </select>
        </div>
        
        <div class="w-32">
          <select
            data-ing-index="${index}"
            data-field="category"
            class="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="produce" ${ingredient.category === 'produce' ? 'selected' : ''}>Produce</option>
            <option value="meat" ${ingredient.category === 'meat' ? 'selected' : ''}>Meat</option>
            <option value="dairy" ${ingredient.category === 'dairy' ? 'selected' : ''}>Dairy</option>
            <option value="pantry" ${ingredient.category === 'pantry' ? 'selected' : ''}>Pantry</option>
            <option value="other" ${ingredient.category === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        
        <button
          type="button"
          data-remove-index="${index}"
          class="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg text-sm ${recipe.ingredients.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}"
          ${recipe.ingredients.length <= 1 ? 'disabled' : ''}
          title="${recipe.ingredients.length <= 1 ? 'Cannot remove last ingredient' : 'Remove ingredient'}"
        >
          ✕
        </button>
      `;
      
      ingredientsContainer.appendChild(row);
    });
  }

  afterRender() {
    // Subtask 4: Setup auto-save
    this.setupAutoSave();
    
    // Attach event listeners
    const nameInput = document.getElementById('recipe-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.handleFieldChange('name', e.target.value);
      });
    }
    
    const instructionsInput = document.getElementById('recipe-instructions');
    if (instructionsInput) {
      instructionsInput.addEventListener('input', (e) => {
        this.handleFieldChange('instructions', e.target.value);
      });
    }
    
    const prepTimeInput = document.getElementById('recipe-prep-time');
    if (prepTimeInput) {
      prepTimeInput.addEventListener('input', (e) => {
        this.handleFieldChange('prepTime', parseInt(e.target.value) || 0);
      });
    }
    
    const cookTimeInput = document.getElementById('recipe-cook-time');
    if (cookTimeInput) {
      cookTimeInput.addEventListener('input', (e) => {
        this.handleFieldChange('cookTime', parseInt(e.target.value) || 0);
      });
    }
    
    const servingsInput = document.getElementById('recipe-servings');
    if (servingsInput) {
      servingsInput.addEventListener('input', (e) => {
        this.handleFieldChange('servings', parseInt(e.target.value) || 4);
      });
    }
    
    const tagsInput = document.getElementById('recipe-tags');
    if (tagsInput) {
      tagsInput.addEventListener('input', (e) => {
        const tagsArray = e.target.value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
        this.handleFieldChange('tags', tagsArray);
      });
    }
    
    // Render ingredients
    this.renderIngredients();
    
    // Ingredient change listeners
    const ingredientsContainer = document.getElementById('ingredients-container');
    if (ingredientsContainer) {
      ingredientsContainer.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.ingIndex);
        const field = e.target.dataset.field;
        if (index >= 0 && field) {
          this.handleIngredientChange(index, field, e.target.value);
        }
      });
      
      ingredientsContainer.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.ingIndex);
        const field = e.target.dataset.field;
        if (index >= 0 && field) {
          this.handleIngredientChange(index, field, e.target.value);
        }
      });
      
      ingredientsContainer.addEventListener('click', (e) => {
        if (e.target.dataset.removeIndex !== undefined) {
          const index = parseInt(e.target.dataset.removeIndex);
          this.removeIngredient(index);
        }
      });
    }
    
    // Add ingredient button
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    if (addIngredientBtn) {
      addIngredientBtn.addEventListener('click', () => this.addIngredient());
    }
    
    // Action buttons
    const discardBtn = document.getElementById('discard-btn');
    if (discardBtn) {
      discardBtn.addEventListener('click', () => this.handleDiscard());
    }
    
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.location.hash = `#/recipe/${this.recipeId}`;
      });
    }
    
    // Subtask 4: BeforeUnload handler
    this.beforeUnloadHandler = (e) => {
      if (this.state.isDirty && !this.state.saving) {
        this.saveDraft();
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  beforeUnload() {
    // Subtask 4: Cleanup
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
    
    // Save draft if dirty
    if (this.state.isDirty && !this.state.saving) {
      this.saveDraft();
    }
  }

  destroy() {
    this.beforeUnload();
  }
}

