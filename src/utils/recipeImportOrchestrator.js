/**
 * Recipe Import Orchestrator
 * 
 * Coordinates the complete recipe import pipeline:
 * 1. Extract recipe from text (AI)
 * 2. Normalize ingredients (match to catalog)
 * 3. User review for unmatched ingredients
 * 4. Enhance instructions (add quantities)
 * 5. Format recipe (standardize)
 * 6. Save complete recipe
 * 
 * This provides a single entry point for the entire import flow.
 */

import { IngredientReviewModal } from '../components/IngredientReviewModal.js';
import { AddIngredientDialog } from '../components/AddIngredientDialog.js';
import { enhanceAllInstructions, extractCookingMethods } from './instructionEnhancer.js';
import { formatInstructions } from './recipeFormatter.js';
import { getMasterIngredient } from './ingredientMaster.js';

export class RecipeImportOrchestrator {
  constructor() {
    this.currentRecipe = null;
    this.normalizedIngredients = [];
    this.resolutions = [];
    this.onCompleteCallback = null;
    this.onErrorCallback = null;
  }
  
  /**
   * Start the import process
   * @param {string} recipeText - Raw recipe text
   * @param {Function} onComplete - Callback when complete (recipe)
   * @param {Function} onError - Callback on error (error)
   */
  async importRecipe(recipeText, onComplete, onError) {
    this.onCompleteCallback = onComplete;
    this.onErrorCallback = onError;
    
    try {
      // Step 1: Extract recipe
      console.log('Step 1: Extracting recipe...');
      const extractedRecipe = await this.extractRecipe(recipeText);
      
      if (!extractedRecipe) {
        throw new Error('Recipe extraction failed');
      }
      
      this.currentRecipe = extractedRecipe;
      
      // Step 2: Normalize ingredients
      console.log('Step 2: Normalizing ingredients...');
      const normalizationResult = await this.normalizeIngredients(extractedRecipe.ingredients);
      
      if (!normalizationResult) {
        throw new Error('Ingredient normalization failed');
      }
      
      this.normalizedIngredients = normalizationResult.normalized;
      
      // Step 3: User review if needed
      if (normalizationResult.requiresUserReview) {
        console.log('Step 3: User review required...');
        await this.handleUserReview(normalizationResult);
      } else {
        console.log('Step 3: No user review needed');
        this.finalizeRecipe();
      }
      
    } catch (error) {
      console.error('Import error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }
  
  /**
   * Step 1: Extract recipe from text
   */
  async extractRecipe(text) {
    const response = await fetch('/api/extract-recipe-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error('Recipe extraction failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Extraction failed');
    }
    
    return data.recipe;
  }
  
  /**
   * Step 2: Normalize ingredients
   */
  async normalizeIngredients(ingredients) {
    const response = await fetch('/api/normalize-ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ingredients,
        confidenceThreshold: 0.8 
      })
    });
    
    if (!response.ok) {
      throw new Error('Normalization failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Normalization failed');
    }
    
    return data;
  }
  
  /**
   * Step 3: Handle user review for unmatched ingredients
   */
  async handleUserReview(normalizationResult) {
    const unresolvedIngredients = normalizationResult.normalized.filter(n => n.needsReview);
    
    if (unresolvedIngredients.length === 0) {
      this.finalizeRecipe();
      return;
    }
    
    return new Promise((resolve, reject) => {
      const modal = new IngredientReviewModal();
      
      modal.show(
        unresolvedIngredients,
        // onResolve callback
        (ingredient, resolution) => {
          this.resolutions.push({ ingredient, resolution });
          
          // If user chose to add new ingredient, launch add dialog
          if (resolution.action === 'add_new') {
            const addDialog = new AddIngredientDialog();
            addDialog.show(ingredient, (ingredientData, newIngredient) => {
              if (newIngredient) {
                console.log('New ingredient added:', newIngredient);
                // Update resolution with new ingredient ID
                resolution.newIngredientId = newIngredient.id;
              }
            });
          }
        },
        // onComplete callback
        (cancelled) => {
          if (cancelled === null) {
            // User cancelled
            reject(new Error('Import cancelled by user'));
          } else {
            // Review complete, finalize recipe
            this.finalizeRecipe();
            resolve();
          }
        }
      );
    });
  }
  
  /**
   * Step 4 & 5: Enhance and format recipe
   */
  finalizeRecipe() {
    console.log('Step 4: Enhancing instructions...');
    
    // Apply user resolutions to normalized ingredients
    for (const resolution of this.resolutions) {
      const normalized = this.normalizedIngredients.find(
        n => n.original.name === resolution.ingredient.original.name
      );
      
      if (normalized) {
        if (resolution.resolution.action === 'match') {
          // User manually matched to existing ingredient
          const master = getMasterIngredient(resolution.resolution.ingredientId);
          normalized.matched = {
            id: master.id,
            displayName: master.displayName,
            canonicalUnit: master.canonicalUnit,
            state: master.state,
            confidence: 1.0,
            matchMethod: 'manual'
          };
          normalized.needsReview = false;
        } else if (resolution.resolution.action === 'add_new' && resolution.resolution.newIngredientId) {
          // New ingredient was added
          const master = getMasterIngredient(resolution.resolution.newIngredientId);
          normalized.matched = {
            id: master.id,
            displayName: master.displayName,
            canonicalUnit: master.canonicalUnit,
            state: master.state,
            confidence: 1.0,
            matchMethod: 'new'
          };
          normalized.needsReview = false;
        }
      }
    }
    
    // Prepare normalized ingredients for enhancement
    const ingredientsForEnhancement = this.normalizedIngredients
      .filter(n => n.matched) // Only matched ingredients
      .map(n => ({
        displayName: n.matched.displayName,
        masterIngredient: getMasterIngredient(n.matched.id),
        quantity: n.quantity
      }));
    
    // Enhance instructions
    const enhanced = enhanceAllInstructions(
      this.currentRecipe.instructions,
      ingredientsForEnhancement
    );
    
    console.log('Step 5: Formatting recipe...');
    
    // Format instructions
    const formatted = formatInstructions(enhanced);
    
    // Extract cooking methods
    const cookingMethods = extractCookingMethods(formatted);
    
    // Build final recipe object
    const finalRecipe = {
      ...this.currentRecipe,
      instructions: formatted,
      normalizedIngredients: this.normalizedIngredients.filter(n => n.matched),
      cookingMethods: cookingMethods,
      importedAt: new Date().toISOString(),
      importMethod: 'text_paste_v2'
    };
    
    console.log('✅ Recipe import complete!');
    
    // Call completion callback
    if (this.onCompleteCallback) {
      this.onCompleteCallback(finalRecipe);
    }
  }
}

export default RecipeImportOrchestrator;
