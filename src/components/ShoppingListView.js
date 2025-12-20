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
    
    // Master ingredient unit mapping (what unit to use at the store)
    this.INGREDIENT_UNITS = {
      // Dairy & Fats (by weight)
      'butter': { unit: 'g', gramsPerTbsp: 14, gramsPerCup: 227 },
      'milk': { unit: 'ml', mlPerCup: 240, mlPerTbsp: 15 },
      'cream': { unit: 'ml', mlPerCup: 240 },
      'cheese': { unit: 'g', gramsPerCup: 113, gramsPerSlice: 28 },
      'cheddar cheese': { unit: 'g', gramsPerCup: 113, gramsPerSlice: 28 },
      'mozzarella': { unit: 'g', gramsPerCup: 113, gramsPerSlice: 28 },
      'parmesan': { unit: 'g', gramsPerCup: 100, gramsPerTbsp: 5 },
      'yogurt': { unit: 'g', gramsPerCup: 245 },
      'sour cream': { unit: 'g', gramsPerCup: 230 },
      
      // Meats & Proteins (by weight)
      'chicken breast': { unit: 'g', gramsPerPound: 454, gramsPerWhole: 200 },
      'chicken thigh': { unit: 'g', gramsPerPound: 454, gramsPerWhole: 120 },
      'chicken': { unit: 'g', gramsPerPound: 454 },
      'ground beef': { unit: 'g', gramsPerPound: 454 },
      'ground turkey': { unit: 'g', gramsPerPound: 454 },
      'beef': { unit: 'g', gramsPerPound: 454 },
      'pork': { unit: 'g', gramsPerPound: 454 },
      'pork chop': { unit: 'g', gramsPerPound: 454, gramsPerWhole: 150 },
      'bacon': { unit: 'g', gramsPerSlice: 28 },
      'turkey': { unit: 'g', gramsPerPound: 454, gramsPerSlice: 28 },
      'ham': { unit: 'g', gramsPerSlice: 28 },
      'salmon': { unit: 'g', gramsPerPound: 454 },
      'tuna': { unit: 'g', gramsPerCan: 140 },
      'shrimp': { unit: 'g', gramsPerPound: 454 },
      'eggs': { unit: 'whole', keepWhole: true },
      
      // Vegetables - whole items
      'onion': { unit: 'whole', keepWhole: true },
      'red onion': { unit: 'whole', keepWhole: true },
      'bell pepper': { unit: 'whole', keepWhole: true },
      'red bell pepper': { unit: 'whole', keepWhole: true },
      'tomato': { unit: 'whole', keepWhole: true },
      'potato': { unit: 'whole', keepWhole: true },
      'carrot': { unit: 'whole', keepWhole: true },
      'cucumber': { unit: 'whole', keepWhole: true },
      'garlic': { unit: 'whole', keepWhole: true }, // whole bulbs
      
      // Vegetables - by head
      'cabbage': { unit: 'head', keepWhole: true },
      'lettuce': { unit: 'head', keepWhole: true },
      'romaine lettuce': { unit: 'head', keepWhole: true },
      'broccoli': { unit: 'head', keepWhole: true },
      'cauliflower': { unit: 'head', keepWhole: true },
      
      // Vegetables - by bunch or weight
      'spinach': { unit: 'g', gramsPerCup: 30 },
      'kale': { unit: 'g', gramsPerCup: 20 },
      'parsley': { unit: 'bunch', keepWhole: true },
      'cilantro': { unit: 'bunch', keepWhole: true },
      
      // Spices & Seasonings (by weight)
      'salt': { unit: 'g', gramsPerTsp: 6 },
      'black pepper': { unit: 'g', gramsPerTsp: 2 },
      'pepper': { unit: 'g', gramsPerTsp: 2 },
      'paprika': { unit: 'g', gramsPerTsp: 2 },
      'cumin': { unit: 'g', gramsPerTsp: 2 },
      'oregano': { unit: 'g', gramsPerTsp: 1 },
      'basil': { unit: 'g', gramsPerTsp: 1 },
      
      // Oils & Liquids
      'olive oil': { unit: 'ml', mlPerTbsp: 15, mlPerTsp: 5 },
      'vegetable oil': { unit: 'ml', mlPerTbsp: 15 },
      'soy sauce': { unit: 'ml', mlPerTbsp: 15 },
      
      // Pantry items
      'flour': { unit: 'g', gramsPerCup: 120 },
      'sugar': { unit: 'g', gramsPerCup: 200, gramsPerTbsp: 12 },
      'rice': { unit: 'g', gramsPerCup: 185 },
      'pasta': { unit: 'g', gramsPerCup: 100 },
      'spaghetti': { unit: 'g', gramsPerCup: 100 },
      'bread': { unit: 'loaf', slicesPerLoaf: 20, showDual: true },
      
      // Canned/Packaged goods
      'tomato sauce': { unit: 'can', mlPerCan: 400 },
      'broth': { unit: 'ml', mlPerCup: 240 },
      'chicken broth': { unit: 'ml', mlPerCup: 240 },
      'beef broth': { unit: 'ml', mlPerCup: 240 }
    };
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
   * Clean ingredient name for shopping (remove prep terms)
   */
  cleanIngredientName(name) {
    let cleaned = name.toLowerCase().trim();
    
    // Remove preparation terms that aren't actual grocery items
    const prepTerms = [
      'cooked', 'leftover', 'shredded', 'diced', 'chopped', 
      'sliced', 'minced', 'crushed', 'grated', 'fresh',
      'frozen', 'canned', 'optional', 'crumbled'
    ];
    
    prepTerms.forEach(term => {
      // Remove at start of string
      cleaned = cleaned.replace(new RegExp(`^${term}\\s+`, 'i'), '');
      // Remove in middle (e.g., "leftover roast chicken" -> "roast chicken")
      cleaned = cleaned.replace(new RegExp(`\\s+${term}\\s+`, 'i'), ' ');
    });
    
    // Trim again after removals
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Get ingredient config with fuzzy matching for variations
   * @param {string} name - Normalized ingredient name
   * @returns {Object|null} Ingredient config or null
   */
  getIngredientConfig(name) {
    const normalized = name.toLowerCase().trim();
    
    // Direct match
    if (this.INGREDIENT_UNITS[normalized]) {
      return this.INGREDIENT_UNITS[normalized];
    }
    
    // Fuzzy matching for common variations
    
    // Cheese variations (feta cheese, cheddar cheese, etc. → cheese)
    if (normalized.includes('cheese')) {
      return this.INGREDIENT_UNITS['cheese'] || { unit: 'g', gramsPerCup: 113, gramsPerSlice: 28 };
    }
    
    // Tomato variations (cherry tomatoes, roma tomatoes → tomato)
    if (normalized.includes('tomato') && !normalized.includes('sauce')) {
      return this.INGREDIENT_UNITS['tomato'] || { unit: 'whole', keepWhole: true };
    }
    
    // Onion variations (yellow onion, white onion → onion)
    if (normalized.includes('onion') && !normalized.includes('green')) {
      return this.INGREDIENT_UNITS['onion'] || { unit: 'whole', keepWhole: true };
    }
    
    // Pepper variations (bell peppers → bell pepper)
    if (normalized.includes('bell pepper')) {
      return this.INGREDIENT_UNITS['bell pepper'] || { unit: 'whole', keepWhole: true };
    }
    
    // Chicken variations (boneless chicken breast → chicken breast)
    if (normalized.includes('chicken breast')) {
      return this.INGREDIENT_UNITS['chicken breast'];
    }
    if (normalized.includes('chicken thigh')) {
      return this.INGREDIENT_UNITS['chicken thigh'];
    }
    if (normalized.includes('chicken') && !normalized.includes('broth')) {
      return this.INGREDIENT_UNITS['chicken'];
    }
    
    // Milk variations (almond milk, soy milk → milk)
    if (normalized.includes('milk')) {
      return this.INGREDIENT_UNITS['milk'];
    }
    
    // Bread variations
    if (normalized.includes('bread') && !normalized.includes('crumb')) {
      return this.INGREDIENT_UNITS['bread'];
    }
    
    // Oil variations
    if (normalized.includes('oil')) {
      return this.INGREDIENT_UNITS['olive oil'] || { unit: 'ml', mlPerTbsp: 15, mlPerTsp: 5 };
    }
    
    return null;
  }

  /**
   * Normalize unit for aggregation (handles singular/plural)
   */
  normalizeUnit(unit) {
    const normalized = unit.toLowerCase().trim();
    
    // Map plural to singular and common variations
    const unitMap = {
      'cloves': 'clove',
      'cups': 'cup',
      'tablespoons': 'tablespoon',
      'tbsp': 'tablespoon',
      'teaspoons': 'teaspoon',
      'tsp': 'teaspoon',
      'pounds': 'pound',
      'lbs': 'pound',
      'lb': 'pound',
      'ounces': 'ounce',
      'oz': 'ounce',
      'slices': 'slice',
      'pieces': 'piece',
      'whole': 'whole',
      'wholes': 'whole',
      'large': 'large',
      'medium': 'medium',
      'small': 'small',
      'leaves': 'leaf',
      'heads': 'head',
      'bunches': 'bunch'
    };
    
    return unitMap[normalized] || normalized;
  }

  /**
   * Convert recipe units to shopping units with comprehensive mapping
   * @param {string} name - Ingredient name
   * @param {number} quantity - Recipe quantity
   * @param {string} unit - Recipe unit
   * @returns {Object} { quantity, unit, displayText } in shopping format
   */
  convertToShoppingUnits(name, quantity, unit) {
    const cleanName = this.cleanIngredientName(name);
    const normalizedName = cleanName.toLowerCase().trim();
    const normalizedUnit = this.normalizeUnit(unit);

    // Look up ingredient in master list (with fuzzy matching)
    const ingredientConfig = this.getIngredientConfig(normalizedName);
    
    if (!ingredientConfig) {
      // No mapping - use sensible defaults
      if (normalizedUnit === 'whole' || normalizedUnit === 'piece') {
        return {
          quantity: Math.ceil(quantity),
          unit: 'whole',
          displayText: null
        };
      }
      // Keep as-is
      return {
        quantity: Math.round(quantity * 100) / 100,
        unit: unit,
        displayText: null
      };
    }

    // Handle keepWhole items (eggs, onions, heads of lettuce)
    if (ingredientConfig.keepWhole) {
      let finalQuantity = quantity;
      
      // Convert if not already in whole units
      if (normalizedUnit !== 'whole' && normalizedUnit !== 'piece' && 
          normalizedUnit !== 'head' && normalizedUnit !== 'bunch') {
        finalQuantity = quantity; // Assume already counted
      }
      
      return {
        quantity: Math.ceil(finalQuantity), // Always round up
        unit: ingredientConfig.unit,
        displayText: null
      };
    }

    // Convert to grams
    if (ingredientConfig.unit === 'g') {
      let grams = 0;
      
      // Convert based on recipe unit
      switch (normalizedUnit) {
        case 'cup':
          grams = quantity * (ingredientConfig.gramsPerCup || 120);
          break;
        case 'tablespoon':
          grams = quantity * (ingredientConfig.gramsPerTbsp || 15);
          break;
        case 'teaspoon':
          grams = quantity * (ingredientConfig.gramsPerTsp || 5);
          break;
        case 'pound':
          grams = quantity * (ingredientConfig.gramsPerPound || 454);
          break;
        case 'ounce':
          grams = quantity * 28.35;
          break;
        case 'slice':
          grams = quantity * (ingredientConfig.gramsPerSlice || 30);
          break;
        case 'whole':
          grams = quantity * (ingredientConfig.gramsPerWhole || 100);
          break;
        case 'can':
          grams = quantity * (ingredientConfig.gramsPerCan || 400);
          break;
        default:
          grams = quantity * 100; // Default assumption
      }
      
      return {
        quantity: Math.ceil(grams / 10) * 10, // Round to nearest 10g
        unit: 'g',
        displayText: null
      };
    }

    // Convert to milliliters
    if (ingredientConfig.unit === 'ml') {
      let ml = 0;
      
      switch (normalizedUnit) {
        case 'cup':
          ml = quantity * (ingredientConfig.mlPerCup || 240);
          break;
        case 'tablespoon':
          ml = quantity * (ingredientConfig.mlPerTbsp || 15);
          break;
        case 'teaspoon':
          ml = quantity * (ingredientConfig.mlPerTsp || 5);
          break;
        default:
          ml = quantity * 240; // Assume cups
      }
      
      return {
        quantity: Math.ceil(ml / 10) * 10, // Round to nearest 10ml
        unit: 'ml',
        displayText: null
      };
    }

    // Special case: bread (show both slices and loaves)
    if (ingredientConfig.showDual && normalizedUnit === 'slice') {
      const loaves = Math.ceil(quantity / (ingredientConfig.slicesPerLoaf || 20));
      return {
        quantity: loaves,
        unit: 'loaf',
        displayText: `(${Math.ceil(quantity)} slices)`
      };
    }

    // Fallback
    return {
      quantity: Math.ceil(quantity),
      unit: ingredientConfig.unit || unit,
      displayText: null
    };
  }

  /**
   * Get canonical ingredient name for grouping (handles variations)
   * @param {string} name - Ingredient name
   * @returns {string} Canonical name for grouping
   */
  getCanonicalName(name) {
    const normalized = name.toLowerCase().trim();
    
    // Group cheese variations under "cheese"
    if (normalized.includes('cheese') && !normalized.includes('cream')) {
      return 'cheese';
    }
    
    // Group tomato variations under "tomato"
    if (normalized.includes('tomato') && !normalized.includes('sauce') && !normalized.includes('paste')) {
      return 'tomato';
    }
    
    // Group onion variations (except green onions)
    if (normalized.includes('onion') && !normalized.includes('green') && !normalized.includes('scallion')) {
      return 'onion';
    }
    
    // Group pepper variations
    if (normalized.includes('bell pepper') || normalized.match(/^(red|green|yellow|orange)\s+pepper$/)) {
      return 'bell pepper';
    }
    
    // Group milk variations
    if (normalized.includes('milk')) {
      return 'milk';
    }
    
    // Group oil variations
    if (normalized.includes('oil') && !normalized.includes('sesame')) {
      return 'oil';
    }
    
    // Group chicken variations by type
    if (normalized.includes('chicken breast')) return 'chicken breast';
    if (normalized.includes('chicken thigh')) return 'chicken thigh';
    if (normalized.includes('chicken') && !normalized.includes('broth')) return 'chicken';
    
    // Return as-is for everything else
    return normalized;
  }

  /**
   * Generate shopping list from all recipes
   * Aggregates ingredients and converts to supermarket units
   */
  generateShoppingList() {
    const ingredientMap = new Map();
    const debugInfo = { skipped: [], combined: [], converted: [], warnings: [] };

    // First pass: collect all ingredients in recipe units
    const rawIngredients = [];
    this.recipes.forEach(recipe => {
      if (!recipe.ingredients) return;
      recipe.ingredients.forEach(ing => {
        const cleanedName = this.cleanIngredientName(ing.name);
        const normalizedName = cleanedName.toLowerCase().trim();
        
        // Skip prep items or leftovers
        if (normalizedName.includes('leftover') || normalizedName.length === 0) {
          debugInfo.skipped.push(ing.name);
          return;
        }
        
        // Get canonical name for grouping
        const canonicalName = this.getCanonicalName(cleanedName);
        
        rawIngredients.push({
          name: cleanedName,
          normalizedName,
          canonicalName,
          quantity: ing.quantity || 0,
          unit: ing.unit || '',
          category: ing.category || 'other',
          original: ing.name
        });
      });
    });

    // Second pass: aggregate same ingredients (same CANONICAL name + unit)
    const aggregatedMap = new Map();
    
    rawIngredients.forEach(ing => {
      const normalizedUnit = this.normalizeUnit(ing.unit);
      // Use canonical name for better grouping (e.g., all cheese types together)
      const key = `${ing.canonicalName}::${normalizedUnit}`;
      
      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key);
        existing.quantity += ing.quantity;
        debugInfo.combined.push(`${ing.original} + ${existing.name}`);
      } else {
        aggregatedMap.set(key, {
          name: ing.canonicalName, // Use canonical name for display
          normalizedName: ing.canonicalName,
          quantity: ing.quantity,
          unit: ing.unit,
          normalizedUnit: normalizedUnit,
          category: ing.category
        });
      }
    });

    // Third pass: convert to shopping units
    aggregatedMap.forEach((item, key) => {
      const converted = this.convertToShoppingUnits(
        item.name,
        item.quantity,
        item.unit
      );
      
      // Create final shopping list entry
      const shoppingKey = item.normalizedName; // Use just name for final dedup
      
      if (ingredientMap.has(shoppingKey)) {
        // Same ingredient in shopping units - add quantities
        const existing = ingredientMap.get(shoppingKey);
        if (this.normalizeUnit(existing.unit) === this.normalizeUnit(converted.unit)) {
          existing.quantity += converted.quantity;
          // Update displayText if it exists
          if (converted.displayText) {
            existing.displayText = converted.displayText;
          }
        } else {
          // Different shopping units - keep separate
          const altKey = `${shoppingKey}__${this.normalizeUnit(converted.unit)}`;
          ingredientMap.set(altKey, {
            name: item.name,
            quantity: converted.quantity,
            unit: converted.unit,
            category: item.category,
            displayText: converted.displayText,
            displayName: `${item.name} (${converted.unit})`
          });
        }
      } else {
        ingredientMap.set(shoppingKey, {
          name: item.name,
          quantity: converted.quantity,
          unit: converted.unit,
          category: item.category,
          displayText: converted.displayText
        });
      }

      // Log conversions
      if (item.unit !== converted.unit) {
        const conversionText = converted.displayText ? 
          `${item.name}: ${item.quantity} ${item.unit} → ${converted.quantity} ${converted.unit} ${converted.displayText}` :
          `${item.name}: ${item.quantity} ${item.unit} → ${converted.quantity} ${converted.unit}`;
        debugInfo.converted.push(conversionText);
      }
    });

    // Convert to array
    const list = Array.from(ingredientMap.values());
    
    // Log aggregation summary
    console.log('=== SHOPPING LIST AGGREGATION ===');
    console.log('Unique items:', list.length);
    console.log('Skipped (non-purchasable):', debugInfo.skipped.length);
    console.log('Combined (same unit):', debugInfo.combined.length);
    console.log('Converted to shopping units:', debugInfo.converted.length);
    if (debugInfo.converted.length > 0 && debugInfo.converted.length < 20) {
      console.log('Conversions:', debugInfo.converted);
    }
    console.log('Warnings:', debugInfo.warnings.length);
    
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
    header.className = 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white p-4 flex items-center gap-3';
    header.innerHTML = `
      <span class="text-3xl">${emoji}</span>
      <div>
        <h2 class="text-xl font-bold">${displayName}</h2>
        <p class="text-emerald-50 text-sm">${items.length} items</p>
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
      
      // Format quantity nicely
      let quantityText = '';
      if (item.quantity) {
        const qty = Math.round(item.quantity * 10) / 10;
        quantityText = `${qty} ${item.unit}`;
        
        // Add dual display text if available (e.g., "2 loaves (40 slices)")
        if (item.displayText) {
          quantityText += ` ${item.displayText}`;
        }
      }

      details.innerHTML = `
        <div class="font-medium text-gray-800">${item.name}</div>
        ${quantityText ? `<div class="text-sm text-gray-600">${quantityText}</div>` : ''}
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
