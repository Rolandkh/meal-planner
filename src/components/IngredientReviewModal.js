/**
 * Ingredient Review Modal Component
 * 
 * Displays a modal for reviewing unmatched ingredients during recipe import.
 * Allows user to:
 * - Search and select from existing ingredients
 * - View smart suggestions
 * - Add new ingredient to catalog
 * - Skip ingredient
 */

import { getAllMasterIngredients } from '../utils/ingredientMaster.js';

export class IngredientReviewModal {
  constructor() {
    this.unresolvedIngredients = [];
    this.currentIndex = 0;
    this.onResolveCallback = null;
    this.onCompleteCallback = null;
    this.searchResults = [];
  }
  
  /**
   * Show the modal and start review process
   * @param {Array} unresolvedIngredients - Array of unmatched ingredients
   * @param {Function} onResolve - Callback for each resolution (ingredient, resolution)
   * @param {Function} onComplete - Callback when all reviewed
   */
  show(unresolvedIngredients, onResolve, onComplete) {
    this.unresolvedIngredients = unresolvedIngredients;
    this.currentIndex = 0;
    this.onResolveCallback = onResolve;
    this.onCompleteCallback = onComplete;
    
    if (unresolvedIngredients.length === 0) {
      if (onComplete) onComplete([]);
      return;
    }
    
    this.render();
    this.showCurrentIngredient();
  }
  
  /**
   * Render the modal HTML
   */
  render() {
    const modalHTML = `
      <div id="ingredientReviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-lg">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold">❓ Ingredient Not Recognized</h2>
              <span id="reviewProgress" class="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                1 of ${this.unresolvedIngredients.length}
              </span>
            </div>
          </div>
          
          <!-- Body -->
          <div class="p-6">
            <!-- Original Ingredient Display -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-600 mb-1">Recipe mentions:</p>
              <p id="originalIngredient" class="text-lg font-semibold text-gray-900"></p>
            </div>
            
            <!-- Search Box -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Search existing ingredients:
              </label>
              <input 
                type="text" 
                id="ingredientSearch"
                placeholder="Type to search..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <!-- Suggestions -->
            <div id="suggestionsContainer" class="mb-6">
              <p class="text-sm font-medium text-gray-700 mb-3">Suggestions:</p>
              <div id="suggestionsList" class="space-y-2 max-h-64 overflow-y-auto">
                <!-- Suggestions will be inserted here -->
              </div>
            </div>
            
            <!-- Add New Option -->
            <div class="mb-6">
              <label class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-colors">
                <input type="radio" name="ingredientChoice" value="add_new" class="mr-3 h-4 w-4 text-orange-600" />
                <div>
                  <span class="font-medium text-gray-900">➕ Add as new ingredient</span>
                  <p class="text-sm text-gray-500">Research and add to catalog</p>
                </div>
              </label>
            </div>
            
            <!-- Skip Option -->
            <div class="mb-6">
              <label class="flex items-center p-4 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="radio" name="ingredientChoice" value="skip" class="mr-3 h-4 w-4 text-gray-600" />
                <div>
                  <span class="font-medium text-gray-700">⏭️ Skip this ingredient</span>
                  <p class="text-sm text-gray-500">Continue without matching</p>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
            <button 
              id="skipAllBtn"
              class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Skip All Remaining
            </button>
            <div class="space-x-3">
              <button 
                id="cancelBtn"
                class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel Import
              </button>
              <button 
                id="confirmBtn"
                class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled
              >
                Confirm Choice
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Insert modal into DOM
    const existingModal = document.getElementById('ingredientReviewModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Attach event listeners
    this.attachEventListeners();
  }
  
  /**
   * Show the current ingredient for review
   */
  showCurrentIngredient() {
    if (this.currentIndex >= this.unresolvedIngredients.length) {
      // All done!
      this.close();
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return;
    }
    
    const current = this.unresolvedIngredients[this.currentIndex];
    
    // Update progress
    document.getElementById('reviewProgress').textContent = 
      `${this.currentIndex + 1} of ${this.unresolvedIngredients.length}`;
    
    // Update original ingredient display
    document.getElementById('originalIngredient').textContent = current.original.rawText;
    
    // Render suggestions
    this.renderSuggestions(current.suggestions || []);
    
    // Reset search
    document.getElementById('ingredientSearch').value = '';
    
    // Reset selection
    const radios = document.querySelectorAll('input[name="ingredientChoice"]');
    radios.forEach(r => r.checked = false);
    document.getElementById('confirmBtn').disabled = true;
  }
  
  /**
   * Render suggestion list
   */
  renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsList');
    
    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm italic">No suggestions available</p>';
      return;
    }
    
    container.innerHTML = suggestions.map(sug => `
      <label class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-colors">
        <div class="flex items-center flex-1">
          <input 
            type="radio" 
            name="ingredientChoice" 
            value="match_${sug.id}"
            class="mr-3 h-4 w-4 text-orange-600" 
          />
          <div>
            <span class="font-medium text-gray-900">${sug.displayName}</span>
            <p class="text-xs text-gray-500">
              ${sug.state} • ${sug.canonicalUnit} • confidence: ${Math.round(sug.score / 10)}%
            </p>
          </div>
        </div>
      </label>
    `).join('');
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const modal = document.getElementById('ingredientReviewModal');
    
    // Search functionality
    const searchInput = document.getElementById('ingredientSearch');
    searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    // Radio button selection
    const radios = document.querySelectorAll('input[name="ingredientChoice"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        document.getElementById('confirmBtn').disabled = false;
      });
    });
    
    // Confirm button
    document.getElementById('confirmBtn').addEventListener('click', () => {
      this.handleConfirm();
    });
    
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.handleCancel();
    });
    
    // Skip all button
    document.getElementById('skipAllBtn').addEventListener('click', () => {
      this.handleSkipAll();
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'ingredientReviewModal') {
        this.handleCancel();
      }
    });
  }
  
  /**
   * Handle search input
   */
  handleSearch(query) {
    if (query.trim().length < 2) {
      // Show original suggestions
      const current = this.unresolvedIngredients[this.currentIndex];
      this.renderSuggestions(current.suggestions || []);
      return;
    }
    
    // Get all ingredients and filter
    const allIngredients = getAllMasterIngredients();
    const queryLower = query.toLowerCase();
    
    const matches = allIngredients
      .filter(ing => {
        const nameLower = ing.displayName.toLowerCase();
        const aliasMatch = ing.aliases && ing.aliases.some(a => a.toLowerCase().includes(queryLower));
        return nameLower.includes(queryLower) || aliasMatch;
      })
      .slice(0, 10)
      .map(ing => ({
        id: ing.id,
        displayName: ing.displayName,
        state: ing.state,
        canonicalUnit: ing.canonicalUnit,
        score: 800 // High score for search results
      }));
    
    this.renderSuggestions(matches);
  }
  
  /**
   * Handle confirm button click
   */
  handleConfirm() {
    const selected = document.querySelector('input[name="ingredientChoice"]:checked');
    
    if (!selected) {
      alert('Please select an option');
      return;
    }
    
    const value = selected.value;
    const current = this.unresolvedIngredients[this.currentIndex];
    
    let resolution;
    
    if (value.startsWith('match_')) {
      // User selected an existing ingredient
      const ingredientId = value.replace('match_', '');
      resolution = {
        action: 'match',
        ingredientId: ingredientId,
        originalIngredient: current
      };
    } else if (value === 'add_new') {
      // User wants to add new ingredient
      resolution = {
        action: 'add_new',
        originalIngredient: current
      };
    } else if (value === 'skip') {
      // User wants to skip
      resolution = {
        action: 'skip',
        originalIngredient: current
      };
    }
    
    // Call resolution callback
    if (this.onResolveCallback) {
      this.onResolveCallback(current, resolution);
    }
    
    // Move to next ingredient
    this.currentIndex++;
    this.showCurrentIngredient();
  }
  
  /**
   * Handle cancel button
   */
  handleCancel() {
    const confirm = window.confirm('Cancel recipe import? All progress will be lost.');
    if (confirm) {
      this.close();
      // Trigger complete callback with null to indicate cancellation
      if (this.onCompleteCallback) {
        this.onCompleteCallback(null);
      }
    }
  }
  
  /**
   * Handle skip all remaining
   */
  handleSkipAll() {
    const confirm = window.confirm(`Skip all ${this.unresolvedIngredients.length - this.currentIndex} remaining ingredients?`);
    if (confirm) {
      // Skip all remaining
      while (this.currentIndex < this.unresolvedIngredients.length) {
        const current = this.unresolvedIngredients[this.currentIndex];
        if (this.onResolveCallback) {
          this.onResolveCallback(current, { action: 'skip', originalIngredient: current });
        }
        this.currentIndex++;
      }
      
      this.close();
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }
  }
  
  /**
   * Close the modal
   */
  close() {
    const modal = document.getElementById('ingredientReviewModal');
    if (modal) {
      modal.remove();
    }
  }
}

export default IngredientReviewModal;
