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
    
    // Shopping unit conversions (recipe units → supermarket units)
    this.SHOPPING_CONVERSIONS = {
      // Vegetables sold by head/whole
      'cabbage': { toUnit: 'head', cupsPerUnit: 4 },
      'lettuce': { toUnit: 'head', cupsPerUnit: 6 },
      'romaine lettuce': { toUnit: 'head', cupsPerUnit: 6 },
      'iceberg lettuce': { toUnit: 'head', cupsPerUnit: 8 },
      'broccoli': { toUnit: 'head', cupsPerUnit: 3 },
      'cauliflower': { toUnit: 'head', cupsPerUnit: 4 },
      
      // Items sold by piece/whole
      'onion': { toUnit: 'whole', itemsPerCup: 1 },
      'red onion': { toUnit: 'whole', itemsPerCup: 1 },
      'yellow onion': { toUnit: 'whole', itemsPerCup: 1 },
      'white onion': { toUnit: 'whole', itemsPerCup: 1 },
      'bell pepper': { toUnit: 'whole', itemsPerCup: 1 },
      'red bell pepper': { toUnit: 'whole', itemsPerCup: 1 },
      'green bell pepper': { toUnit: 'whole', itemsPerCup: 1 },
      'tomato': { toUnit: 'whole', itemsPerCup: 1 },
      'potato': { toUnit: 'whole', itemsPerCup: 1.5 },
      'carrot': { toUnit: 'whole', itemsPerCup: 2 },
      'cucumber': { toUnit: 'whole', itemsPerCup: 1 },
      
      // Items sold by bunch
      'spinach': { toUnit: 'bunch', cupsPerUnit: 4 },
      'kale': { toUnit: 'bunch', cupsPerUnit: 4 },
      'parsley': { toUnit: 'bunch', itemsPerCup: 0.25 },
      'cilantro': { toUnit: 'bunch', itemsPerCup: 0.25 },
      'green onions': { toUnit: 'bunch', itemsPerCup: 0.5 },
      'scallions': { toUnit: 'bunch', itemsPerCup: 0.5 },
      
      // Herbs sold in packages
      'basil': { toUnit: 'package', itemsPerCup: 0.5 },
      'mint': { toUnit: 'package', itemsPerCup: 0.5 },
      
      // Items that should use weight
      'mushrooms': { toUnit: 'pound', cupsPerUnit: 3 },
      'green beans': { toUnit: 'pound', cupsPerUnit: 2 },
      'zucchini': { toUnit: 'pound', cupsPerUnit: 2 }
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
      'frozen', 'canned', 'optional'
    ];
    
    prepTerms.forEach(term => {
      // Remove at start of string
      cleaned = cleaned.replace(new RegExp(`^${term}\\s+`, 'i'), '');
      // Remove in middle (e.g., "leftover roast chicken" -> "roast chicken")
      cleaned = cleaned.replace(new RegExp(`\\s+${term}\\s+`, 'i'), ' ');
    });
    
    // Trim again after removals
    cleaned = cleaned.trim();
    
    // Return original case but cleaned structure
    return cleaned;
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
   * Convert recipe units to shopping units
   * @param {string} name - Ingredient name
   * @param {number} quantity - Recipe quantity
   * @param {string} unit - Recipe unit
   * @returns {Object} { quantity, unit } in shopping format
   */
  convertToShoppingUnits(name, quantity, unit) {
    const cleanName = this.cleanIngredientName(name);
    const normalizedName = cleanName.toLowerCase().trim();
    const normalizedUnit = this.normalizeUnit(unit);

    // Check if we have a conversion rule for this ingredient
    const conversion = this.SHOPPING_CONVERSIONS[normalizedName];
    
    if (!conversion) {
      // No conversion rule - keep as-is but round nicely
      return {
        quantity: Math.ceil(quantity * 4) / 4, // Round to nearest 0.25
        unit: unit
      };
    }

    // Convert based on rule
    let shoppingQuantity;
    
    if (conversion.cupsPerUnit) {
      // Convert cups to whole units (heads, bunches, etc.)
      if (normalizedUnit === 'cup') {
        shoppingQuantity = quantity / conversion.cupsPerUnit;
        shoppingQuantity = Math.ceil(shoppingQuantity); // Always round up
      } else {
        shoppingQuantity = quantity;
      }
    } else if (conversion.itemsPerCup) {
      // Convert cups to items
      if (normalizedUnit === 'cup') {
        shoppingQuantity = quantity / conversion.itemsPerCup;
        shoppingQuantity = Math.ceil(shoppingQuantity);
      } else {
        shoppingQuantity = quantity;
      }
    } else {
      shoppingQuantity = quantity;
    }

    // Handle 'whole' units - always round up
    if (normalizedUnit === 'whole' || normalizedUnit === 'piece') {
      shoppingQuantity = Math.ceil(quantity);
    }

    return {
      quantity: Math.max(1, Math.ceil(shoppingQuantity)), // Always at least 1
      unit: conversion.toUnit
    };
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
        
        rawIngredients.push({
          name: cleanedName,
          normalizedName,
          quantity: ing.quantity || 0,
          unit: ing.unit || '',
          category: ing.category || 'other',
          original: ing.name
        });
      });
    });

    // Second pass: aggregate same ingredients (same name + unit)
    const aggregatedMap = new Map();
    
    rawIngredients.forEach(ing => {
      const normalizedUnit = this.normalizeUnit(ing.unit);
      const key = `${ing.normalizedName}::${normalizedUnit}`;
      
      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key);
        existing.quantity += ing.quantity;
        debugInfo.combined.push(`${ing.original} + ${existing.name}`);
      } else {
        aggregatedMap.set(key, {
          name: ing.name,
          normalizedName: ing.normalizedName,
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
        } else {
          // Different shopping units - keep separate
          const altKey = `${shoppingKey}__${this.normalizeUnit(converted.unit)}`;
          ingredientMap.set(altKey, {
            name: item.name,
            quantity: converted.quantity,
            unit: converted.unit,
            category: item.category,
            displayName: `${item.name} (${converted.unit})`
          });
        }
      } else {
        ingredientMap.set(shoppingKey, {
          name: item.name,
          quantity: converted.quantity,
          unit: converted.unit,
          category: item.category
        });
      }

      // Log conversions
      if (item.unit !== converted.unit) {
        debugInfo.converted.push(
          `${item.name}: ${item.quantity} ${item.unit} → ${converted.quantity} ${converted.unit}`
        );
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
