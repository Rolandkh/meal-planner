/**
 * Recipe Import Modal Component
 * Multi-step modal for importing recipes from text
 * Slice 4: Task 56
 */

import { loadRecipes, saveRecipes } from '../utils/storage.js';

export class RecipeImportModal {
  constructor(onSuccess, onClose) {
    this.onSuccess = onSuccess;
    this.onClose = onClose;
    this.state = {
      step: 1, // 1: Method, 2: Paste, 3: Preview/Edit
      method: 'import', // 'import' or 'manual'
      text: '',
      loading: false,
      extractedRecipe: null,
      editedRecipe: null,
      error: null,
      confidence: null
    };
  }

  render() {
    const overlay = document.createElement('div');
    overlay.id = 'recipe-import-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto';
    modal.onclick = (e) => e.stopPropagation(); // Prevent close on modal click
    
    // Render appropriate step
    if (this.state.step === 1) {
      modal.appendChild(this.renderMethodSelection());
    } else if (this.state.step === 2) {
      modal.appendChild(this.renderPasteText());
    } else if (this.state.step === 3) {
      modal.appendChild(this.renderPreviewEdit());
    }
    
    overlay.appendChild(modal);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.handleClose();
      }
    });
    
    return overlay;
  }

  renderMethodSelection() {
    const container = document.createElement('div');
    container.className = 'p-6';
    
    container.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Add Recipe</h2>
      
      <p class="text-gray-600 mb-6">Choose how you'd like to add a recipe:</p>
      
      <div class="space-y-4 mb-8">
        <label class="flex items-start p-4 border-2 border-blue-500 rounded-lg cursor-pointer bg-blue-50">
          <input 
            type="radio" 
            name="import-method" 
            value="import" 
            checked 
            class="mt-1 mr-3"
          />
          <div>
            <div class="font-semibold text-gray-900">Import from Text</div>
            <div class="text-sm text-gray-600">Paste recipe text from blogs, emails, or messages. AI will extract the structure.</div>
          </div>
        </label>
        
        <label class="flex items-start p-4 border-2 border-gray-300 rounded-lg cursor-not-allowed opacity-50">
          <input 
            type="radio" 
            name="import-method" 
            value="manual" 
            disabled 
            class="mt-1 mr-3"
          />
          <div>
            <div class="font-semibold text-gray-900">Create Manually</div>
            <div class="text-sm text-gray-600">Fill in recipe details yourself (coming in Slice 5)</div>
          </div>
        </label>
      </div>
      
      <div class="flex items-center justify-end space-x-4">
        <button
          id="modal-close-btn"
          class="px-6 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium"
        >
          Cancel
        </button>
        <button
          id="modal-next-btn"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Next
        </button>
      </div>
    `;
    
    return container;
  }

  renderPasteText() {
    const container = document.createElement('div');
    container.className = 'p-6';
    
    const charCount = this.state.text.length;
    const maxChars = 5000;
    
    container.innerHTML = `
      <div class="mb-4">
        <button
          id="modal-back-btn"
          class="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>←</span>
          <span>Back</span>
        </button>
      </div>
      
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Paste Recipe Text</h2>
      
      <p class="text-gray-600 mb-4">
        Copy and paste a recipe from a blog, email, or message. The AI will extract the structure for you.
      </p>
      
      ${this.state.error ? `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p class="text-red-700">${this.state.error}</p>
        </div>
      ` : ''}
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Recipe Text
        </label>
        <textarea
          id="recipe-text-input"
          rows="10"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="Paste your recipe here...

Example:
Chicken Stir Fry

Ingredients:
- 500g chicken breast
- 2 whole bell peppers
- 200g broccoli
- 3 tbsp soy sauce

Instructions:
1. Cut chicken into strips
2. Stir-fry in hot wok with oil
3. Add vegetables and sauce
4. Cook until tender"
        >${this.state.text}</textarea>
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm ${charCount < 50 ? 'text-red-500' : charCount > 4000 ? 'text-amber-500' : 'text-gray-500'}">
            ${charCount} / ${maxChars} characters
            ${charCount < 50 ? '(minimum 50)' : ''}
            ${charCount > maxChars ? '(too long!)' : ''}
          </span>
        </div>
      </div>
      
      <div class="flex items-center justify-end space-x-4">
        <button
          id="modal-cancel-btn"
          class="px-6 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium"
          ${this.state.loading ? 'disabled' : ''}
        >
          Cancel
        </button>
        <button
          id="modal-import-btn"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 ${this.state.loading ? 'opacity-50 cursor-not-allowed' : ''}"
          ${this.state.loading ? 'disabled' : ''}
        >
          ${this.state.loading ? `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Extracting...</span>
          ` : '<span>Import Recipe</span>'}
        </button>
      </div>
    `;
    
    return container;
  }

  renderPreviewEdit() {
    const container = document.createElement('div');
    container.className = 'p-6';
    
    const recipe = this.state.editedRecipe || this.state.extractedRecipe;
    if (!recipe) {
      container.innerHTML = '<p class="text-red-500">No recipe data available</p>';
      return container;
    }
    
    const confidence = this.state.confidence || 0;
    const isLowConfidence = confidence < 70;
    
    container.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Preview & Edit Recipe</h2>
      
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">Extraction confidence:</span>
          <span class="text-sm font-semibold ${confidence >= 80 ? 'text-green-600' : confidence >= 70 ? 'text-amber-600' : 'text-red-600'}">
            ${confidence}%
          </span>
        </div>
        ${isLowConfidence ? `
          <div class="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            ⚠️ Low confidence - Please review carefully
          </div>
        ` : ''}
      </div>
      
      ${this.state.error ? `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p class="text-red-700">${this.state.error}</p>
        </div>
      ` : ''}
      
      <div class="space-y-4 mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
        <!-- Recipe Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
          <input
            type="text"
            id="preview-name"
            value="${recipe.name || ''}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <!-- Ingredients -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Ingredients (${(recipe.ingredients || []).length})
          </label>
          <div class="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
            ${(recipe.ingredients || []).map((ing, i) => `
              <div class="flex items-center space-x-2">
                <span class="text-gray-700">${ing.quantity} ${ing.unit} ${ing.name}</span>
                <span class="text-xs text-gray-500">(${ing.category})</span>
              </div>
            `).join('')}
          </div>
          <p class="text-xs text-gray-500 mt-1">You can edit ingredients after saving to your library</p>
        </div>
        
        <!-- Instructions -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
          <textarea
            id="preview-instructions"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >${recipe.instructions || ''}</textarea>
        </div>
        
        <!-- Times and Servings -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Prep (min)</label>
            <input
              type="number"
              id="preview-prep-time"
              value="${recipe.prepTime || 15}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cook (min)</label>
            <input
              type="number"
              id="preview-cook-time"
              value="${recipe.cookTime || 20}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Servings</label>
            <input
              type="number"
              id="preview-servings"
              value="${recipe.servings || 4}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="1"
              max="20"
            />
          </div>
        </div>
        
        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <input
            type="text"
            id="preview-tags"
            value="${(recipe.tags || []).join(', ')}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="italian, quick, healthy"
          />
        </div>
      </div>
      
      <div class="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          id="modal-discard-btn"
          class="px-6 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium"
        >
          Discard
        </button>
        <button
          id="modal-save-btn"
          class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
        >
          Save to Library
        </button>
      </div>
    `;
    
    return container;
  }

  attachEventListeners(overlay) {
    if (this.state.step === 1) {
      this.attachMethodSelectionListeners(overlay);
    } else if (this.state.step === 2) {
      this.attachPasteTextListeners(overlay);
    } else if (this.state.step === 3) {
      this.attachPreviewEditListeners(overlay);
    }
  }

  attachMethodSelectionListeners(overlay) {
    const closeBtn = overlay.querySelector('#modal-close-btn');
    const nextBtn = overlay.querySelector('#modal-next-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.handleClose();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.state.step = 2;
        this.updateModal(overlay);
      });
    }
  }

  attachPasteTextListeners(overlay) {
    const backBtn = overlay.querySelector('#modal-back-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');
    const importBtn = overlay.querySelector('#modal-import-btn');
    const textInput = overlay.querySelector('#recipe-text-input');
    
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.state.step = 1;
        this.state.error = null;
        this.updateModal(overlay);
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.handleClose();
      });
    }
    
    if (textInput) {
      textInput.addEventListener('input', (e) => {
        this.state.text = e.target.value;
        this.updateCharCount();
      });
    }
    
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.handleImport();
      });
    }
  }

  attachPreviewEditListeners(overlay) {
    const discardBtn = overlay.querySelector('#modal-discard-btn');
    const saveBtn = overlay.querySelector('#modal-save-btn');
    
    // Form inputs
    const nameInput = overlay.querySelector('#preview-name');
    const instructionsInput = overlay.querySelector('#preview-instructions');
    const prepTimeInput = overlay.querySelector('#preview-prep-time');
    const cookTimeInput = overlay.querySelector('#preview-cook-time');
    const servingsInput = overlay.querySelector('#preview-servings');
    const tagsInput = overlay.querySelector('#preview-tags');
    
    // Update editedRecipe on input changes
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.state.editedRecipe.name = e.target.value;
      });
    }
    
    if (instructionsInput) {
      instructionsInput.addEventListener('input', (e) => {
        this.state.editedRecipe.instructions = e.target.value;
      });
    }
    
    if (prepTimeInput) {
      prepTimeInput.addEventListener('input', (e) => {
        this.state.editedRecipe.prepTime = parseInt(e.target.value) || 0;
      });
    }
    
    if (cookTimeInput) {
      cookTimeInput.addEventListener('input', (e) => {
        this.state.editedRecipe.cookTime = parseInt(e.target.value) || 0;
      });
    }
    
    if (servingsInput) {
      servingsInput.addEventListener('input', (e) => {
        this.state.editedRecipe.servings = parseInt(e.target.value) || 4;
      });
    }
    
    if (tagsInput) {
      tagsInput.addEventListener('input', (e) => {
        this.state.editedRecipe.tags = e.target.value
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
      });
    }
    
    if (discardBtn) {
      discardBtn.addEventListener('click', () => {
        this.handleClose();
      });
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.handleSave();
      });
    }
  }

  updateCharCount() {
    const charCountEl = document.querySelector('#recipe-text-input + div span');
    if (charCountEl) {
      const charCount = this.state.text.length;
      const maxChars = 5000;
      charCountEl.textContent = `${charCount} / ${maxChars} characters${charCount < 50 ? ' (minimum 50)' : ''}${charCount > maxChars ? ' (too long!)' : ''}`;
      charCountEl.className = `text-sm ${charCount < 50 ? 'text-red-500' : charCount > 4000 ? 'text-amber-500' : 'text-gray-500'}`;
    }
  }

  updateModal(overlay) {
    const modal = overlay.querySelector('.bg-white');
    if (modal) {
      modal.innerHTML = '';
      
      if (this.state.step === 1) {
        modal.appendChild(this.renderMethodSelection());
      } else if (this.state.step === 2) {
        modal.appendChild(this.renderPasteText());
      } else if (this.state.step === 3) {
        modal.appendChild(this.renderPreviewEdit());
      }
      
      this.attachEventListeners(overlay);
    }
  }

  async handleImport() {
    const { text } = this.state;
    
    // Validate text length
    if (text.length < 50) {
      this.state.error = 'Please provide a complete recipe (at least 50 characters)';
      this.updateModal(document.getElementById('recipe-import-modal-overlay'));
      return;
    }
    
    if (text.length > 5000) {
      this.state.error = 'Text is too long. Please paste one recipe at a time (max 5000 characters).';
      this.updateModal(document.getElementById('recipe-import-modal-overlay'));
      return;
    }
    
    this.state.loading = true;
    this.state.error = null;
    this.updateModal(document.getElementById('recipe-import-modal-overlay'));
    
    try {
      const response = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.state.extractedRecipe = data.recipe;
        this.state.editedRecipe = JSON.parse(JSON.stringify(data.recipe)); // Deep clone
        this.state.confidence = data.recipe.confidence;
        this.state.loading = false;
        this.state.step = 3;
        this.updateModal(document.getElementById('recipe-import-modal-overlay'));
      } else {
        this.state.loading = false;
        this.state.error = data.message || 'Failed to extract recipe';
        this.updateModal(document.getElementById('recipe-import-modal-overlay'));
      }
    } catch (error) {
      console.error('Import error:', error);
      this.state.loading = false;
      this.state.error = 'Connection error. Please check your internet and try again.';
      this.updateModal(document.getElementById('recipe-import-modal-overlay'));
    }
  }

  handleSave() {
    const recipe = this.state.editedRecipe;
    
    // Create recipe object
    const newRecipe = {
      recipeId: `recipe_${crypto.randomUUID()}`,
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      tags: recipe.tags || [],
      source: 'imported',
      isFavorite: false,
      rating: null,
      timesCooked: 0,
      lastCooked: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to storage
    const recipes = loadRecipes();
    recipes.push(newRecipe);
    const result = saveRecipes(recipes);
    
    if (result.success) {
      this.showToast('Recipe added to library!', 'success');
      
      if (this.onSuccess) {
        this.onSuccess(newRecipe);
      }
      
      // Navigate to recipe detail page
      setTimeout(() => {
        window.location.hash = `#/recipe/${newRecipe.recipeId}`;
      }, 500);
      
      this.handleClose();
    } else {
      this.state.error = result.message || 'Failed to save recipe';
      this.updateModal(document.getElementById('recipe-import-modal-overlay'));
    }
  }

  handleClose() {
    const overlay = document.getElementById('recipe-import-modal-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    if (this.onClose) {
      this.onClose();
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

  show() {
    const modal = this.render();
    document.body.appendChild(modal);
    this.attachEventListeners(modal);
  }
}


