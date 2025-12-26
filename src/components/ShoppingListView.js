/**
 * ShoppingListView Component
 * Displays aggregated shopping list from all recipes in meal plan
 * Converts all units to metric supermarket format
 */

import { loadRecipes, loadCurrentMealPlan } from '../utils/storage.js';
import { INGREDIENT_SHOPPING_UNITS, convertToMetric } from '../utils/unitConversions.js';

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
    if (INGREDIENT_SHOPPING_UNITS[normalized]) {
      return INGREDIENT_SHOPPING_UNITS[normalized];
    }
    
    // Fuzzy matching for common variations
    
    // Cheese variations (feta cheese, cheddar cheese, etc. → cheese)
    if (normalized.includes('cheese')) {
      return INGREDIENT_SHOPPING_UNITS['cheese'];
    }
    
    // Tomato variations (cherry tomatoes, roma tomatoes → tomato)
    if (normalized.includes('tomato') && !normalized.includes('sauce')) {
      return INGREDIENT_SHOPPING_UNITS['tomato'];
    }
    
    // Onion variations (yellow onion, white onion → onion)
    if (normalized.includes('onion') && !normalized.includes('green')) {
      return INGREDIENT_SHOPPING_UNITS['onion'];
    }
    
    // Pepper variations (bell peppers → bell pepper)
    if (normalized.includes('bell pepper') || normalized.includes('capsicum')) {
      return INGREDIENT_SHOPPING_UNITS['bell pepper'];
    }
    
    // Chicken variations
    if (normalized.includes('chicken breast')) {
      return INGREDIENT_SHOPPING_UNITS['chicken breast'];
    }
    if (normalized.includes('chicken thigh')) {
      return INGREDIENT_SHOPPING_UNITS['chicken thigh'];
    }
    if (normalized.includes('chicken') && !normalized.includes('broth')) {
      return INGREDIENT_SHOPPING_UNITS['chicken'];
    }
    
    // Milk variations (almond milk, soy milk → milk)
    if (normalized.includes('milk')) {
      return INGREDIENT_SHOPPING_UNITS['milk'];
    }
    
    // Yogurt variations
    if (normalized.includes('yogurt')) {
      return INGREDIENT_SHOPPING_UNITS['yogurt'];
    }
    
    // Bread variations
    if (normalized.includes('bread') && !normalized.includes('crumb')) {
      return INGREDIENT_SHOPPING_UNITS['bread'];
    }
    
    // Oil variations
    if (normalized.includes('oil') && !normalized.includes('sesame')) {
      return INGREDIENT_SHOPPING_UNITS['olive oil'];
    }
    
    // Rice variations
    if (normalized.includes('rice') && !normalized.includes('paper')) {
      return INGREDIENT_SHOPPING_UNITS['rice'];
    }
    
    // Salmon variations
    if (normalized.includes('salmon')) {
      return INGREDIENT_SHOPPING_UNITS['salmon'];
    }
    
    // Dressing variations
    if (normalized.includes('dressing')) {
      return INGREDIENT_SHOPPING_UNITS['dressing'];
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
   * Convert recipe units to metric shopping units
   * @param {string} name - Ingredient name
   * @param {number} quantity - Recipe quantity
   * @param {string} unit - Recipe unit
   * @returns {Object} { quantity, unit, displayText } in metric shopping format
   */
  convertToShoppingUnits(name, quantity, unit) {
    const cleanName = this.cleanIngredientName(name);
    const normalizedName = cleanName.toLowerCase().trim();
    const normalizedUnit = this.normalizeUnit(unit);

    // Look up ingredient config
    const config = this.getIngredientConfig(normalizedName);
    
    if (!config) {
      // No mapping - convert to metric if imperial, otherwise keep
      if (normalizedUnit === 'ounce' || normalizedUnit === 'oz') {
        return { quantity: Math.ceil(quantity * 28.35), unit: 'g', displayText: null };
      }
      if (normalizedUnit === 'pound' || normalizedUnit === 'lb') {
        return { quantity: Math.ceil(quantity * 454), unit: 'g', displayText: null };
      }
      if (normalizedUnit === 'cup') {
        return { quantity: Math.ceil(quantity * 240), unit: 'ml', displayText: null };
      }
      
      // Keep whole items as-is
      return {
        quantity: Math.ceil(quantity),
        unit: normalizedUnit,
        displayText: null
      };
    }

    const targetUnit = config.unit;
    const conversions = config.conversions || {};

    // Handle count items (eggs, whole veggies, etc.)
    if (config.keepAsCount) {
      let finalQty = quantity;
      
      // If unit is fractional (cups, etc.), try to convert to count
      if (conversions[normalizedUnit]) {
        finalQty = quantity / conversions[normalizedUnit];
      }
      
      return {
        quantity: Math.ceil(finalQty), // Always round up
        unit: targetUnit,
        displayText: config.note || null
      };
    }

    // Handle dual display (bread: loaves + slices)
    if (config.showBoth && normalizedUnit === 'slice') {
      const slices = Math.ceil(quantity);
      const loaves = Math.ceil(slices / 20); // ~20 slices per loaf
      return {
        quantity: loaves,
        unit: 'loaf',
        displayText: `(${slices} slices needed)`
      };
    }

    // Convert to target metric unit
    const converted = convertToMetric(quantity, normalizedUnit, targetUnit, conversions);
    
    // Round appropriately
    let roundedQty;
    if (targetUnit === 'g' || targetUnit === 'ml') {
      // Round to nearest 10 for small amounts, 50 for large amounts
      if (converted < 100) {
        roundedQty = Math.ceil(converted / 10) * 10;
      } else if (converted < 500) {
        roundedQty = Math.ceil(converted / 25) * 25;
      } else {
        roundedQty = Math.ceil(converted / 50) * 50;
      }
    } else {
      roundedQty = Math.ceil(converted);
    }

    return {
      quantity: Math.max(roundedQty, targetUnit === 'g' ? 10 : 1), // Minimum amounts
      unit: targetUnit,
      displayText: config.note || null
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



