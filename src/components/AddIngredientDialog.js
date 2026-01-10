/**
 * Add Ingredient Dialog Component
 * 
 * Collects information from user and researches a new ingredient
 * to add to the master catalog with complete metadata.
 */

export class AddIngredientDialog {
  constructor() {
    this.currentIngredient = null;
    this.researchData = null;
    this.onCompleteCallback = null;
  }
  
  /**
   * Show dialog to add a new ingredient
   * @param {Object} ingredientData - Data about the ingredient to add
   * @param {Function} onComplete - Callback when ingredient is added (ingredient, data)
   */
  async show(ingredientData, onComplete) {
    this.currentIngredient = ingredientData;
    this.onCompleteCallback = onComplete;
    
    // Step 1: Ask clarifying questions
    await this.renderQuestions();
  }
  
  /**
   * Render clarifying questions form
   */
  renderQuestions() {
    const dialogHTML = `
      <div id="addIngredientDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-lg">
            <h2 class="text-2xl font-bold">➕ Add New Ingredient</h2>
            <p class="text-sm mt-1 text-green-100">${this.currentIngredient.original.name}</p>
          </div>
          
          <!-- Body -->
          <div class="p-6">
            <p class="text-gray-700 mb-6">Help us understand this ingredient so we can add it to the catalog with complete nutrition and pricing data.</p>
            
            <!-- Form -->
            <form id="addIngredientForm" class="space-y-6">
              <!-- Display Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span class="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="displayName"
                  value="${this.currentIngredient.original.name}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">How this ingredient should appear in recipes</p>
              </div>
              
              <!-- State -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Product State <span class="text-red-500">*</span>
                </label>
                <select 
                  id="ingredientState"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select...</option>
                  <option value="fresh">Fresh</option>
                  <option value="frozen">Frozen</option>
                  <option value="canned">Canned</option>
                  <option value="dried">Dried</option>
                  <option value="other">Other/Processed</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">How it's sold at the supermarket</p>
              </div>
              
              <!-- Canonical Unit -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Measurement Unit <span class="text-red-500">*</span>
                </label>
                <select 
                  id="canonicalUnit"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select...</option>
                  <option value="g">Grams (for solid ingredients)</option>
                  <option value="ml">Milliliters (for liquid ingredients)</option>
                  <option value="whole">Whole items (for countable items like eggs)</option>
                </select>
              </div>
              
              <!-- Substitutes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  What can this be substituted with?
                </label>
                <textarea 
                  id="substitutes"
                  rows="2"
                  placeholder="e.g., Greek yoghurt, sour cream, crème fraîche"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">This helps with future ingredient matching</p>
              </div>
              
              <!-- Additional Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea 
                  id="additionalNotes"
                  rows="2"
                  placeholder="Any other details that might help..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                ></textarea>
              </div>
            </form>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
            <button 
              id="cancelAddBtn"
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              id="researchBtn"
              class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
            >
              🔍 Research & Add
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Insert into DOM
    const existing = document.getElementById('addIngredientDialog');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // Attach listeners
    this.attachEventListeners();
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    document.getElementById('cancelAddBtn').addEventListener('click', () => {
      this.close();
      if (this.onCompleteCallback) {
        this.onCompleteCallback(null); // Cancelled
      }
    });
    
    document.getElementById('researchBtn').addEventListener('click', () => {
      this.handleResearch();
    });
  }
  
  /**
   * Handle research and add
   */
  async handleResearch() {
    const btn = document.getElementById('researchBtn');
    btn.disabled = true;
    btn.innerHTML = '🔄 Researching...';
    
    try {
      // Collect form data
      const displayName = document.getElementById('displayName').value.trim();
      const state = document.getElementById('ingredientState').value;
      const canonicalUnit = document.getElementById('canonicalUnit').value;
      const substitutes = document.getElementById('substitutes').value.trim();
      const notes = document.getElementById('additionalNotes').value.trim();
      
      // Validate
      if (!displayName || !state || !canonicalUnit) {
        alert('Please fill in all required fields');
        btn.disabled = false;
        btn.innerHTML = '🔍 Research & Add';
        return;
      }
      
      // Build user notes
      const userNotes = [];
      if (substitutes) userNotes.push(`Can be substituted with: ${substitutes}`);
      if (notes) userNotes.push(notes);
      
      // Call research API
      const response = await fetch('/api/research-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientName: displayName,
          userNotes: userNotes.join('. ')
        })
      });
      
      if (!response.ok) {
        throw new Error('Research API failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Research failed');
      }
      
      // Show confirmation with research results
      this.showConfirmation(data.research, { displayName, state, canonicalUnit, substitutes });
      
    } catch (error) {
      console.error('Research error:', error);
      alert('Failed to research ingredient: ' + error.message);
      btn.disabled = false;
      btn.innerHTML = '🔍 Research & Add';
    }
  }
  
  /**
   * Show confirmation screen with research results
   */
  showConfirmation(research, userInputs) {
    this.researchData = research;
    
    const confirmHTML = `
      <div id="addIngredientConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-lg">
            <h2 class="text-2xl font-bold">✅ Research Complete</h2>
            <p class="text-sm mt-1">Review and confirm before adding to catalog</p>
          </div>
          
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Display Name</p>
                <p class="font-medium">${userInputs.displayName}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">ID</p>
                <p class="font-mono text-sm">${research.suggestedId}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">State</p>
                <p class="font-medium">${userInputs.state}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Unit</p>
                <p class="font-medium">${userInputs.canonicalUnit}</p>
              </div>
            </div>
            
            ${research.densityEstimates ? `
              <div>
                <p class="text-sm text-gray-600 mb-1">Density Values</p>
                <div class="bg-gray-50 p-3 rounded text-sm">
                  <p>• 1 cup = ${research.densityEstimates.gPerCup}g</p>
                  <p>• 1 tbsp = ${research.densityEstimates.gPerTbsp}g</p>
                  <p>• 1 tsp = ${research.densityEstimates.gPerTsp}g</p>
                  <p class="text-xs text-gray-500 mt-1">Source: ${research.densityEstimates.source}</p>
                </div>
              </div>
            ` : ''}
            
            ${research.spoonacular ? `
              <div>
                <p class="text-sm text-gray-600 mb-1">✅ Found in Spoonacular</p>
                <div class="bg-green-50 p-3 rounded text-sm">
                  <p>ID: ${research.spoonacular.id}</p>
                  <p>Nutrition data will be automatically populated</p>
                </div>
              </div>
            ` : `
              <div>
                <p class="text-sm text-gray-600 mb-1">⚠️ Not in Spoonacular</p>
                <p class="text-sm text-gray-500">Nutrition data will need manual entry later</p>
              </div>
            `}
            
            ${research.retailInfo ? `
              <div>
                <p class="text-sm text-gray-600 mb-1">Retail Information</p>
                <div class="bg-gray-50 p-3 rounded text-sm">
                  <p>• Typical unit: ${research.retailInfo.typicalUnit}</p>
                  <p>• Pack size: ${research.retailInfo.typicalPackSize}</p>
                  ${research.retailInfo.estimatedPriceAUD ? `<p>• Est. price: $${research.retailInfo.estimatedPriceAUD} AUD</p>` : ''}
                </div>
              </div>
            ` : ''}
            
            ${research.notes ? `
              <div>
                <p class="text-sm text-gray-600 mb-1">Notes</p>
                <p class="text-sm text-gray-700 bg-blue-50 p-3 rounded">${research.notes}</p>
              </div>
            ` : ''}
          </div>
          
          <div class="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
            <button 
              id="cancelConfirmBtn"
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button 
              id="addToCatalogBtn"
              class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              ✅ Add to Catalog
            </button>
          </div>
        </div>
      </div>
    `;
    
    const existing = document.getElementById('addIngredientConfirm');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', confirmHTML);
    
    // Attach listeners
    document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
      this.closeConfirmation();
      this.close();
      if (this.onCompleteCallback) this.onCompleteCallback(null);
    });
    
    document.getElementById('addToCatalogBtn').addEventListener('click', () => {
      this.handleAddToCatalog();
    });
  }
  
  /**
   * Handle adding ingredient to catalog
   */
  async handleAddToCatalog() {
    const btn = document.getElementById('addToCatalogBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Adding...';
    
    try {
      // Prepare ingredient data
      const newIngredient = {
        id: this.researchData.suggestedId,
        displayName: document.getElementById('displayName')?.value || this.researchData.displayName,
        canonicalUnit: document.getElementById('canonicalUnit')?.value || this.researchData.canonicalUnit,
        state: document.getElementById('ingredientState')?.value || this.researchData.state,
        density: this.researchData.densityEstimates ? {
          gPerCup: this.researchData.densityEstimates.gPerCup,
          gPerTbsp: this.researchData.densityEstimates.gPerTbsp,
          gPerTsp: this.researchData.densityEstimates.gPerTsp
        } : null,
        aliases: this.researchData.suggestedAliases || [],
        tags: this.researchData.suggestedTags || [],
        spoonacularId: this.researchData.spoonacular?.id || null
      };
      
      // Call API to add ingredient
      const response = await fetch('/api/add-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient: newIngredient })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add ingredient to catalog');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to add ingredient');
      }
      
      // Success!
      this.closeConfirmation();
      this.close();
      
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.currentIngredient, newIngredient);
      }
      
      // Show success message
      this.showSuccessMessage(newIngredient.displayName);
      
    } catch (error) {
      console.error('Add to catalog error:', error);
      alert('Failed to add ingredient: ' + error.message);
      btn.disabled = false;
      btn.innerHTML = '✅ Add to Catalog';
    }
  }
  
  /**
   * Show success message
   */
  showSuccessMessage(ingredientName) {
    const successHTML = `
      <div id="ingredientAddSuccess" class="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in">
        <div class="flex items-center">
          <span class="text-2xl mr-3">✅</span>
          <div>
            <p class="font-semibold">Ingredient Added!</p>
            <p class="text-sm text-green-100">${ingredientName}</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHTML);
    
    setTimeout(() => {
      const msg = document.getElementById('ingredientAddSuccess');
      if (msg) msg.remove();
    }, 3000);
  }
  
  /**
   * Close confirmation dialog
   */
  closeConfirmation() {
    const confirm = document.getElementById('addIngredientConfirm');
    if (confirm) confirm.remove();
  }
  
  /**
   * Close the dialog
   */
  close() {
    const dialog = document.getElementById('addIngredientDialog');
    if (dialog) dialog.remove();
  }
}

export default AddIngredientDialog;
