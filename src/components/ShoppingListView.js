/**
 * ShoppingListView Component
 * Displays aggregated shopping list from all recipes in meal plan
 * Converts all units to metric supermarket format
 */

import { loadRecipes, loadCurrentMealPlan, loadMeals, getShoppingListMode } from '../utils/storage.js';
import { INGREDIENT_SHOPPING_UNITS, convertToMetric } from '../utils/unitConversions.js';
import { buildNormalizedShoppingList, getRecipeUsageCounts } from '../utils/normalizedShoppingList.js';

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
    const startTime = performance.now();
    
    // Load user's preferred mode
    this.mode = getShoppingListMode();
    const modeLabel = this.mode === 'chef' ? 'Chef Mode (varieties separate)' : 'Pantry Mode (group similar)';
    console.log(`🛒 Starting shopping list generation... [${modeLabel}]`);
    
    try {
      // Step 1: Load all recipes
      const t1 = performance.now();
      const allRecipes = loadRecipes();
      console.log(`  ⏱️ Loaded ${allRecipes.length} recipes in ${Math.round(performance.now() - t1)}ms`);
      
      // Step 2: Load meal plan
      const t2 = performance.now();
      this.mealPlan = loadCurrentMealPlan();
      console.log(`  ⏱️ Loaded meal plan in ${Math.round(performance.now() - t2)}ms`);
      
      if (!this.mealPlan) {
        console.warn('⚠️ No meal plan found');
        this.recipes = [];
        this.shoppingList = [];
        return;
      }

      // Step 3: Extract recipes from meal plan
      const t3 = performance.now();
      this.recipes = this.getRecipesFromMealPlan(allRecipes, this.mealPlan);
      console.log(`  ⏱️ Extracted ${this.recipes.length} recipes from meal plan in ${Math.round(performance.now() - t3)}ms`);

      if (this.recipes.length === 0) {
        console.warn('⚠️ No recipes found in meal plan');
        this.shoppingList = [];
        return;
      }

      // Step 4: Generate shopping list with selected mode
      const t4 = performance.now();
      
      // Try normalized shopping list first (new pipeline)
      const allMeals = loadMeals();
      const usageCounts = getRecipeUsageCounts(this.mealPlan, allMeals);
      const normalizedCount = this.recipes.filter(r => r.normalizedIngredients && r.normalizedIngredients.length > 0).length;
      
      if (normalizedCount > 0) {
        console.log(`  🆕 Using normalized ingredient pipeline (${normalizedCount}/${this.recipes.length} recipes normalized)`);
        const normalizedList = buildNormalizedShoppingList(this.recipes, usageCounts, this.mode);
        
        // Map normalized structure to expected structure
        this.shoppingList = normalizedList.map(item => {
          const raw = item.quantityRaw || {};
          let quantity = null;
          let unit = 'varies';
          
          // Determine best quantity and unit from raw data
          if (raw.totalG) {
            quantity = raw.totalG;
            unit = 'g';
          } else if (raw.totalMl) {
            quantity = raw.totalMl;
            unit = 'ml';
          } else if (raw.totalCount) {
            quantity = raw.totalCount;
            unit = raw.originalUnit || 'whole';
          }
          
          return {
            name: item.displayName,
            quantity: quantity,
            unit: unit,
            category: item.category,
            displayText: item.quantity, // Formatted string like "160g" or "3 cloves"
            checked: false
          };
        });
      } else {
        console.log(`  📜 Using legacy pipeline (no normalized data yet)`);
        this.shoppingList = this.generateShoppingList();
      }
      
      console.log(`  ⏱️ Generated shopping list in ${Math.round(performance.now() - t4)}ms`);
      
      const totalTime = Math.round(performance.now() - startTime);
      console.log(`✅ Shopping list complete: ${this.shoppingList.length} items from ${this.recipes.length} recipes (${totalTime}ms total)`);
      
    } catch (error) {
      console.error('❌ Error generating shopping list:', error);
      console.error('Stack trace:', error.stack);
      this.recipes = [];
      this.shoppingList = [];
    }
  }

  /**
   * Extract recipes referenced in the meal plan
   * Slice 5: Meal plan has mealIds, meals stored separately
   * @param {Array} allRecipes - All recipes in storage
   * @param {Object} mealPlan - Current meal plan (has mealIds, not days)
   * @returns {Array} Only recipes used in this meal plan
   */
  getRecipesFromMealPlan(allRecipes, mealPlan) {
    if (!mealPlan || !mealPlan.mealIds || !Array.isArray(mealPlan.mealIds)) {
      console.warn('⚠️ No valid meal plan found for shopping list');
      console.log('  Meal plan structure:', mealPlan);
      return [];
    }

    console.log(`  📋 Extracting recipes from meal plan with ${mealPlan.mealIds.length} meal IDs`);
    
    // Load meals from storage (Slice 5: meals stored separately)
    const allMeals = loadMeals();
    console.log(`  📦 Loaded ${allMeals.length} total meals from storage`);
    
    // Filter to only meals in this meal plan
    const planMealIds = new Set(mealPlan.mealIds);
    const planMeals = allMeals.filter(meal => planMealIds.has(meal.mealId));
    console.log(`  🎯 Found ${planMeals.length} meals for this meal plan`);
    
    // Create a map of recipe IDs to recipe objects for quick lookup
    const recipeMap = new Map();
    allRecipes.forEach(recipe => {
      if (recipe.recipeId) {
        recipeMap.set(recipe.recipeId, recipe);
      }
    });
    console.log(`  📚 Recipe map created with ${recipeMap.size} recipes`);

    const usedRecipes = [];
    const addedIds = new Set();
    let catalogCount = 0;
    let missingCount = 0;

    // Extract unique recipes from meals
    planMeals.forEach((meal, idx) => {
      if (meal && meal.recipeId) {
        const recipeId = meal.recipeId;
        
        // Avoid adding the same recipe multiple times
        if (!addedIds.has(recipeId)) {
          const recipe = recipeMap.get(recipeId);
          if (recipe) {
            // Recipe from catalog or previously generated - use stored data
            usedRecipes.push(recipe);
            addedIds.add(recipeId);
            catalogCount++;
          } else {
            console.warn(`  ⚠️ Recipe not found in storage: "${recipeId}" (meal ${idx + 1}/${planMeals.length})`);
            missingCount++;
          }
        }
      } else {
        console.warn(`  ⚠️ Meal has no recipeId:`, meal);
      }
    });

    console.log(`  ✅ Extracted ${usedRecipes.length} unique recipes (${catalogCount} from storage, ${missingCount} missing)`);
    
    if (missingCount > 0) {
      console.warn(`  ⚠️ ${missingCount} recipes couldn't be found - shopping list may be incomplete`);
    }
    
    return usedRecipes;
  }

  /**
   * Clean ingredient name for shopping (remove prep terms, generalize only branded/obscure items)
   */
  cleanIngredientName(name) {
    let cleaned = name.toLowerCase().trim();
    
    // Handle compound ingredients (split "salt and pepper" into just "salt")
    // We'll handle pepper separately
    if (cleaned.includes(' and ')) {
      const parts = cleaned.split(' and ');
      // Take the first ingredient
      cleaned = parts[0].trim();
    }
    
    // Remove preparation terms that aren't actual grocery items
    const prepTerms = [
      'cooked', 'leftover', 'shredded', 'diced', 'chopped', 
      'sliced', 'minced', 'crushed', 'grated', 'fresh',
      'frozen', 'canned', 'optional', 'crumbled', 'raw',
      'peeled', 'deveined', 'boneless', 'skinless', 'dried',
      'ground', 'whole', 'to taste', 'for serving'
    ];
    
    prepTerms.forEach(term => {
      // Remove at start of string
      cleaned = cleaned.replace(new RegExp(`^${term}\\s+`, 'i'), '');
      // Remove at end of string
      cleaned = cleaned.replace(new RegExp(`\\s+${term}$`, 'i'), '');
      // Remove in middle (e.g., "leftover roast chicken" -> "roast chicken")
      cleaned = cleaned.replace(new RegExp(`\\s+${term}\\s+`, 'i'), ' ');
    });
    
    // Normalize ONLY truly equivalent variations
    // Keep specificity for ingredients that matter in recipes
    
    // Pepper: Normalize ground/whole variations
    if (cleaned.match(/^black pepper$|^white pepper$|^ground black pepper$|^ground white pepper$/i)) {
      cleaned = 'pepper';
    }
    
    // Basil: Only normalize form variations (leaves vs dried)
    if (cleaned.match(/^basil leaves?$/i)) {
      cleaned = 'basil';
    }
    
    // Garlic: Normalize form variations
    if (cleaned.match(/^garlic cloves?$/i)) {
      cleaned = 'garlic';
    }
    
    // Olive oil: Normalize quality variations (extra virgin vs regular)
    if (cleaned.match(/^extra virgin olive oil$|^evoo$/i)) {
      cleaned = 'olive oil';
    }
    
    // Only generalize branded/obscure items to their common equivalent
    // Keep variety distinctions (cherry vs roma vs regular)
    const generalizations = {
      // Branded tomato varieties → their actual type (NOT generic "tomatoes")
      'campari tomatoes': 'cherry tomatoes',  // Campari is a brand of cherry tomato
      'san marzano tomatoes': 'plum tomatoes', // San Marzano is a variety of plum tomato
      
      // Obscure cheese → common equivalent
      'pecorino romano': 'parmesan cheese',
      'manchego cheese': 'parmesan cheese',
      'gruyère cheese': 'swiss cheese',
      
      // Branded bread → generic type
      'pain de mie': 'white bread',
      
      // Obscure oils → common equivalent
      'grapeseed oil': 'olive oil',
      'avocado oil': 'olive oil',
      
      // Specialty items → common substitutes
      'black garlic': 'garlic',
      'shallots': 'onion',
      'pearl onions': 'onion',
      
      // Obscure greens → common equivalent
      'mizuna': 'arugula',
      'tatsoi': 'bok choy',
      'mâche': 'lettuce'
    };
    
    // Apply generalizations
    if (generalizations[cleaned]) {
      cleaned = generalizations[cleaned];
    }
    
    // Remove extra spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
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
      'clove': 'clove',
      'cups': 'cup',
      'cup': 'cup',
      'tablespoons': 'tablespoon',
      'tablespoon': 'tablespoon',
      'tbsp': 'tablespoon',
      'tbsps': 'tablespoon',
      'teaspoons': 'teaspoon',
      'teaspoon': 'teaspoon',
      'tsp': 'teaspoon',
      'tsps': 'teaspoon',
      'pounds': 'pound',
      'lbs': 'pound',
      'lb': 'pound',
      'ounces': 'ounce',
      'oz': 'ounce',
      'slices': 'slice',
      'slice': 'slice',
      'pieces': 'piece',
      'piece': 'piece',
      'whole': 'whole',
      'wholes': 'whole',
      'large': 'large',
      'medium': 'medium',
      'small': 'small',
      'leaves': 'leaf',
      'leaf': 'leaf',
      'heads': 'head',
      'head': 'head',
      'bunches': 'bunch',
      'bunch': 'bunch',
      'servings': 'whole',  // "1 serving" → "1 whole" (count item)
      'serving': 'whole',
      'pinch': 'pinch',
      'pinches': 'pinch',
      'dash': 'dash',
      'dashes': 'dash'
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
      if (normalizedUnit === 'ounce') {
        return { quantity: Math.ceil(quantity * 28.35), unit: 'g', displayText: null };
      }
      if (normalizedUnit === 'pound') {
        return { quantity: Math.ceil(quantity * 454), unit: 'g', displayText: null };
      }
      if (normalizedUnit === 'cup') {
        return { quantity: Math.ceil(quantity * 240), unit: 'ml', displayText: null };
      }
      if (normalizedUnit === 'tablespoon') {
        return { quantity: Math.ceil(quantity * 15), unit: 'ml', displayText: null };
      }
      if (normalizedUnit === 'teaspoon') {
        return { quantity: Math.ceil(quantity * 5), unit: 'ml', displayText: null };
      }
      
      // Leaf/leaves for herbs - treat as count
      if (normalizedUnit === 'leaf') {
        return { quantity: Math.ceil(quantity), unit: 'leaf', displayText: '(fresh leaves)' };
      }
      
      // Keep whole items and unknown units as-is
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
    
    // Round to whole numbers (no decimals - this isn't chemistry!)
    let roundedQty;
    if (targetUnit === 'g' || targetUnit === 'ml') {
      // Round to whole grams/ml, minimum 1
      roundedQty = Math.max(Math.round(converted), 1);
    } else {
      // Count items - always round up
      roundedQty = Math.ceil(converted);
    }

    return {
      quantity: roundedQty,
      unit: targetUnit,
      displayText: config.note || null
    };
  }

  /**
   * Get canonical ingredient name for grouping (handles variations)
   * Based on production meal planning app research
   * 
   * Two modes:
   * - "chef": Preserve variety distinctions (cherry tomatoes ≠ roma tomatoes)
   * - "pantry": Group similar items for shorter lists (all tomatoes together)
   * 
   * @param {string} name - Ingredient name (already cleaned)
   * @returns {string} Canonical name for grouping
   */
  getCanonicalName(name) {
    const normalized = name.toLowerCase().trim();
    const mode = this.mode || 'chef'; // Use instance mode or default to chef
    
    // Strict variety ingredients (from production app research):
    // In CHEF mode, these NEVER merge across varieties
    // In PANTRY mode, these DO merge to reduce list length
    const STRICT_VARIETY_INGREDIENTS = {
      // Apples: Granny Smith vs Gala are very different
      'apple': 'apple',
      'apples': 'apple',
      // Rice: long-grain vs short-grain vs arborio behave differently
      'rice': 'rice',
      // Flour: bread flour vs all-purpose vs cake flour are NOT interchangeable
      'flour': 'flour',
      // Onions: red vs yellow vs white have different flavors/uses
      'onion': 'onion',
      'onions': 'onion',
      // Cheese: varieties are very distinct
      'cheese': 'cheese',
      // Peppers: bell vs jalapeño vs habanero are completely different
      'pepper': 'bell pepper', // Vegetable peppers
      'peppers': 'bell pepper',
      'bell pepper': 'bell pepper',
      // Chocolate: dark vs milk vs white are distinct
      'chocolate': 'chocolate',
      // Tomatoes: cherry vs roma vs regular have different uses
      'tomato': 'tomato',
      'tomatoes': 'tomato',
      // Potatoes: russet vs red vs yukon gold behave differently
      'potato': 'potato',
      'potatoes': 'potato'
    };
    
    // Check if this is a strict variety ingredient
    if (mode === 'chef') {
      // CHEF MODE: Keep variety distinctions
      for (const strictItem in STRICT_VARIETY_INGREDIENTS) {
        if (normalized.includes(strictItem)) {
          // Keep the full variety distinction
          return normalized.replace(/s$/, '');
        }
      }
    } else if (mode === 'pantry') {
      // PANTRY MODE: Group by canonical type
      for (const strictItem in STRICT_VARIETY_INGREDIENTS) {
        if (normalized.includes(strictItem)) {
          // Return canonical type (merge varieties)
          return STRICT_VARIETY_INGREDIENTS[strictItem];
        }
      }
    }
    
    // ALWAYS group these (in both modes) - truly equivalent/interchangeable:
    
    // Salt: Group equivalent salt types (kosher = sea = table for shopping)
    if (normalized.match(/^salt$|^sea salt$|^kosher salt$|^table salt$|^iodized salt$/)) {
      return 'salt';
    }
    
    // Black/white pepper (as spice, not vegetable peppers)
    if (normalized.match(/^black pepper$|^white pepper$|^ground pepper$/) && !normalized.includes('bell')) {
      return 'pepper (spice)';
    }
    
    // Herbs: Group only form variations (leaves vs dried)
    if (normalized === 'basil' || normalized === 'basil leaves') return 'basil';
    if (normalized === 'parsley' || normalized === 'parsley leaves') return 'parsley';
    if (normalized === 'oregano' || normalized === 'oregano leaves') return 'oregano';
    if (normalized === 'thyme' || normalized === 'thyme leaves') return 'thyme';
    
    // Garlic: Only group form variations
    if (normalized === 'garlic' || normalized === 'garlic cloves') return 'garlic';
    
    // Olive oil: Group quality variations
    if (normalized.match(/^olive oil$|^extra virgin olive oil$|^evoo$/)) {
      return 'olive oil';
    }
    
    // Remove trailing 's' for plurals to catch simple duplicates
    return normalized.replace(/s$/, '');
  }

  /**
   * Get recipe usage counts and servings from meal plan
   * Slice 5: Meals stored separately, accessed via mealIds
   * @returns {Map} Recipe name -> { count, totalServings }
   */
  getRecipeUsageCounts() {
    const usageMap = new Map();
    
    if (!this.mealPlan || !this.mealPlan.mealIds) {
      console.warn('  ⚠️ No meal plan or mealIds for usage counts');
      return usageMap;
    }

    // Load meals from storage
    const allMeals = loadMeals();
    const planMealIds = new Set(this.mealPlan.mealIds);
    const planMeals = allMeals.filter(meal => planMealIds.has(meal.mealId));

    planMeals.forEach(meal => {
      if (meal && meal.recipeId) {
        const recipeId = meal.recipeId;
        const servings = meal.servings || 1;
        
        if (usageMap.has(recipeId)) {
          const existing = usageMap.get(recipeId);
          existing.count += 1;
          existing.totalServings += servings;
        } else {
          usageMap.set(recipeId, {
            count: 1,
            totalServings: servings
          });
        }
      }
    });

    return usageMap;
  }

  /**
   * Generate shopping list from all recipes
   * Aggregates ingredients and converts to supermarket units
   * Accounts for recipe servings and multiple uses
   */
  generateShoppingList() {
    const ingredientMap = new Map();
    const debugInfo = { skipped: [], combined: [], converted: [], warnings: [] };

    // Get recipe usage counts (by recipeId)
    const recipeUsage = this.getRecipeUsageCounts();
    console.log('📊 Recipe usage:', Array.from(recipeUsage.entries()).map(([recipeId, usage]) => 
      `${recipeId}: ${usage.count}x (${usage.totalServings} servings total)`
    ));

    // First pass: collect all ingredients in recipe units, scaled by servings
    const rawIngredients = [];
    let recipeIndex = 0;
    
    this.recipes.forEach(recipe => {
      if (!recipe.ingredients) return;
      
      // Debug: show first recipe's ingredients
      if (recipeIndex === 0) {
        console.log(`  🔍 Sample recipe: "${recipe.name}" (${recipe.ingredients.length} ingredients)`);
        console.log('    First 3 ingredients:', recipe.ingredients.slice(0, 3));
      }
      recipeIndex++;
      
      const recipeId = recipe.recipeId;
      const usage = recipeUsage.get(recipeId);
      if (!usage) {
        console.warn(`Recipe "${recipe.name}" (${recipeId}) not found in meal plan`);
        return;
      }

      // CRITICAL FIX: Calculate scaling factor based on total servings needed
      // Must divide by base servings first to get per-serving amount, then scale
      const recipeBaseServings = recipe.servings || 1;
      const scalingFactor = usage.totalServings / recipeBaseServings;

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
          quantity: (ing.quantity || 0) * scalingFactor, // Scale by servings
          unit: ing.unit || '',
          category: ing.category || 'other',
          original: ing.name
        });
      });
    });

    // Second pass: aggregate same ingredients (same CANONICAL name + unit)
    const aggregatedMap = new Map();
    
    console.log(`  🔄 Aggregating ${rawIngredients.length} raw ingredients...`);
    
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
    
    console.log(`  📊 Aggregated to ${aggregatedMap.size} unique ingredient+unit combinations`);

    // Third pass: convert to shopping units
    console.log(`  🔄 Converting to shopping units...`);
    let conversionErrors = 0;
    
    aggregatedMap.forEach((item, key) => {
      const converted = this.convertToShoppingUnits(
        item.name,
        item.quantity,
        item.unit
      );
      
      // Track conversion failures
      if (item.unit !== converted.unit && converted.quantity === item.quantity) {
        conversionErrors++;
        console.warn(`    ⚠️ Conversion may have failed: ${item.name} (${item.quantity} ${item.unit} → ${converted.quantity} ${converted.unit})`);
      }
      
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
    
    if (conversionErrors > 0) {
      console.warn(`  ⚠️ ${conversionErrors} items may not have converted properly`);
    }

    // Convert to array
    const list = Array.from(ingredientMap.values());
    
    // Log aggregation summary
    console.log('=== SHOPPING LIST AGGREGATION ===');
    console.log('Unique items:', list.length);
    console.log('Skipped (non-purchasable):', debugInfo.skipped.length);
    console.log('Combined (same unit):', debugInfo.combined.length);
    console.log('Converted to shopping units:', debugInfo.converted.length);
    console.log('Conversion errors:', conversionErrors);
    
    // Log first 10 items for debugging
    if (list.length > 50) {
      console.log('⚠️ Shopping list has', list.length, 'items - showing first 10:');
      list.slice(0, 10).forEach(item => {
        console.log(`  - ${item.name}: ${item.quantity} ${item.unit} (${item.category})`);
      });
      console.log('  ... and', list.length - 10, 'more items');
    }
    
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

    const budget = this.mealPlan ? this.mealPlan.budget : { estimated: 0, target: 0 };
    const budgetDisplay = budget.target > 0 
      ? `$${budget.estimated} / $${budget.target}` 
      : `$${budget.estimated}`;

    header.innerHTML = `
      <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2">🛒 Shopping List</h1>
      <p class="text-xl text-gray-600 mb-4">${weekInfo}</p>
      <div class="flex flex-wrap justify-center gap-4">
        <div class="bg-white rounded-lg px-6 py-3 shadow-md">
          <span class="text-2xl font-bold text-purple-600">${budgetDisplay}</span>
          <span class="text-gray-600 ml-2">Budget</span>
        </div>
        <div class="bg-white rounded-lg px-6 py-3 shadow-md">
          <span class="text-2xl font-bold text-green-600">${this.shoppingList.length}</span>
          <span class="text-gray-600 ml-2">Items</span>
        </div>
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
      
      // Format quantity - prefer displayText if available (from normalized pipeline)
      let quantityText = '';
      if (item.displayText && item.displayText !== 'as needed' && item.displayText !== 'varies') {
        // Use the pre-formatted displayText from normalized pipeline (e.g., "160g", "3 cloves")
        quantityText = item.displayText;
      } else if (item.quantity) {
        // Fallback to raw quantity + unit
        const qty = Math.round(item.quantity);
        quantityText = `${qty} ${item.unit}`;
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






