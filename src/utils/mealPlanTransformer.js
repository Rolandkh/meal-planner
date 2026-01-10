/**
 * Meal Plan Transformer
 * Transforms Claude's raw JSON output into normalized storage format
 */

import { 
  generateRecipeId, 
  generateMealId, 
  generateMealPlanId, 
  deduplicateRecipes,
  loadEaters,
  loadBaseSpecification 
} from './storage.js';
import { getRecipeCatalogSync } from './catalogStorage.js';
import { normalizeRecipeIngredients } from '../pipelines/normalizeRecipeIngredients.js';

/**
 * Create a hash for recipe deduplication
 * Uses name + ingredient NAMES (not quantities) to detect same recipe at different scales
 * 
 * @param {Object} recipe - Recipe object
 * @returns {string} Hash string
 * 
 * CRITICAL FIX: Exclude quantities from hash!
 * "Greek Yogurt" with 200g yogurt = same as "Greek Yogurt" with 400g yogurt
 * The quantities differ because servings differ, but it's the SAME RECIPE.
 */
function createRecipeHash(recipe) {
  const name = (recipe.name || '').toLowerCase().trim();
  
  // Use only ingredient NAMES and UNITS, NOT quantities
  // This ensures same recipe at different serving sizes deduplicates correctly
  const ingredientsStr = (recipe.ingredients || [])
    .map(ing => {
      const ingName = (ing.name || '').toLowerCase().trim();
      const unit = (ing.unit || '').toLowerCase().trim();
      return `${ingName}:${unit}`;  // Removed quantity from hash
    })
    .sort()
    .join('|');
  
  return `${name}::${ingredientsStr}`;
}

/**
 * Try to match a recipe name to catalog (Slice 5)
 * @param {string} recipeName - Recipe name from Claude
 * @param {Array} catalog - Catalog recipes
 * @returns {Object|null} Catalog recipe or null
 */
function matchCatalogRecipe(recipeName, catalog) {
  if (!recipeName || !catalog || catalog.length === 0) return null;
  
  const searchName = recipeName.toLowerCase().trim();
  
  // Exact match
  let match = catalog.find(r => r.name.toLowerCase() === searchName);
  if (match) {
    console.log(`  ✅ Catalog match (exact): "${recipeName}" → "${match.name}"`);
    return match;
  }
  
  // Fuzzy match (contains)
  match = catalog.find(r => {
    const catalogName = r.name.toLowerCase();
    return catalogName.includes(searchName) || searchName.includes(catalogName);
  });
  
  if (match) {
    console.log(`  ✅ Catalog match (fuzzy): "${recipeName}" → "${match.name}"`);
    return match;
  }
  
  return null;
}

/**
 * Extract and deduplicate recipes from Claude's output
 * OPTIMIZED: Claude now only sends names for catalog recipes (not full details)
 * @param {Array} days - Array of day objects from Claude
 * @returns {Object} { recipes: Array, recipeMap: Map, catalogMatches: number }
 */
function extractRecipes(days) {
  const recipeMap = new Map(); // hash -> { recipe, recipeId }
  const recipes = [];
  let catalogMatches = 0;

  if (!Array.isArray(days)) {
    console.warn('extractRecipes: days is not an array');
    return { recipes, recipeMap, catalogMatches };
  }

  // Load catalog once
  const catalog = getRecipeCatalogSync();
  console.log(`📚 Checking catalog (${catalog.length} recipes) for matches...`);

  // Iterate through all days and meal types
  for (const day of days) {
    if (!day || typeof day !== 'object') continue;

    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    for (const mealType of mealTypes) {
      const mealData = day[mealType];
      
      if (!mealData) continue;
      
      // Handle multi-recipe format (array) or single recipe (object)
      const recipesToProcess = Array.isArray(mealData) ? mealData : [mealData];
      
      for (const recipe of recipesToProcess) {
        if (!recipe || typeof recipe !== 'object') continue;

      // OPTIMIZED: Check if this is a catalog recipe reference
      if (recipe.fromCatalog === true) {
        // This is a catalog recipe - Claude only sent the name
        const catalogRecipe = matchCatalogRecipe(recipe.name, catalog);
        
        if (catalogRecipe) {
          // ✅ Found in catalog - use full catalog details
          const hash = createRecipeHash(recipe);
          if (!recipeMap.has(hash)) {
            recipeMap.set(hash, { 
              recipe: catalogRecipe, 
              recipeId: catalogRecipe.recipeId 
            });
            recipes.push(catalogRecipe);
            catalogMatches++;
            console.log(`  ✅ Catalog recipe: "${recipe.name}" (full details loaded from catalog)`);
          }
        } else {
          // ⚠️ Claude said it's from catalog but we can't find it
          console.warn(`  ⚠️ Catalog recipe not found: "${recipe.name}" - treating as new recipe`);
          // Fall through to create as new recipe
        }
        continue;
      }

      // This is a NEW recipe - Claude provided full details
      // OR: Legacy format where fromCatalog wasn't set (try catalog match first)
      if (recipe.fromCatalog === undefined) {
        // Backwards compatibility: try catalog match
        const catalogRecipe = matchCatalogRecipe(recipe.name, catalog);
        if (catalogRecipe) {
          const hash = createRecipeHash(recipe);
          if (!recipeMap.has(hash)) {
            recipeMap.set(hash, { 
              recipe: catalogRecipe, 
              recipeId: catalogRecipe.recipeId 
            });
            recipes.push(catalogRecipe);
            catalogMatches++;
            console.log(`  ✅ Catalog match (legacy): "${recipe.name}"`);
          }
          continue;
        }
      }
      
      // Create new recipe from Claude's full details
      const hash = createRecipeHash(recipe);

      if (!recipeMap.has(hash)) {
        // New unique recipe
        const recipeId = generateRecipeId();
        
        // Build base recipe structure
        let newRecipe = {
          recipeId,
          name: recipe.name || 'Untitled Recipe',
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ing => ({
            name: ing.name || 'Unknown ingredient',
            quantity: ing.quantity || 1,
            unit: ing.unit || '',
            category: ing.category || 'other'
          })) : [],
          instructions: recipe.instructions || '',
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          servings: recipe.servings || 2,
          tags: Array.isArray(recipe.tags) ? recipe.tags : [],
          source: 'generated',
          rating: null,
          createdAt: new Date().toISOString()
        };
        
        // CRITICAL: Normalize AI-generated recipe ingredients for shopping list aggregation
        try {
          newRecipe = normalizeRecipeIngredients(newRecipe);
          const matchCount = newRecipe.normalizedIngredients?.length || 0;
          const totalCount = newRecipe.ingredients?.length || 0;
          console.log(`  🆕 New recipe: "${recipe.name}" (AI-generated, ${matchCount}/${totalCount} ingredients normalized)`);
        } catch (err) {
          console.warn(`  ⚠️ Could not normalize recipe "${recipe.name}":`, err.message);
          console.log(`  🆕 New recipe: "${recipe.name}" (AI-generated, not normalized)`);
        }

        recipeMap.set(hash, { recipe: newRecipe, recipeId });
        recipes.push(newRecipe);
      }
      }  // Close inner for loop (recipesToProcess)
    }
  }

  const newRecipes = recipes.length - catalogMatches;
  console.log(`📊 Catalog usage: ${catalogMatches} catalog, ${newRecipes} new recipes | Total unique: ${recipes.length}`);

  return { recipes, recipeMap, catalogMatches };
}

/**
 * Create meals array from days and recipe map
 * @param {Array} days - Array of day objects from Claude
 * @param {Map} recipeMap - Map of recipe hashes to recipe IDs
 * @param {number} defaultServings - Default servings if not specified
 * @returns {Array} Array of meal objects
 */
function createMeals(days, recipeMap, defaultServings = 2) {
  const meals = [];

  if (!Array.isArray(days)) {
    console.warn('createMeals: days is not an array');
    return meals;
  }

  for (const day of days) {
    if (!day || typeof day !== 'object') continue;

    const date = day.date || '';
    const mealTypes = ['breakfast', 'lunch', 'dinner'];

    for (const mealType of mealTypes) {
      const mealData = day[mealType];
      
      if (!mealData) continue;
      
      // Handle multi-recipe format (array) or single recipe (object)
      const recipesToProcess = Array.isArray(mealData) ? mealData : [mealData];
      
      for (const recipe of recipesToProcess) {
        if (!recipe || typeof recipe !== 'object') continue;

        // Find matching recipe ID
        const hash = createRecipeHash(recipe);
        const recipeData = recipeMap.get(hash);

        if (!recipeData) {
          console.warn(`No recipe found for ${mealType} on ${date}`);
          continue;
        }

        // Get eater IDs and servings for this specific meal
        const eaters = loadEaters();
        const baseSpec = loadBaseSpecification();
        let eaterIds = [];
        let targetEaters = null;
        let dietProfileTags = null;
        let servings = recipe.servings || defaultServings;
        
        // Check for multi-profile format (targetEaters specified)
        if (recipe.targetEaters && Array.isArray(recipe.targetEaters)) {
          // Multi-profile: map eater names to IDs
          targetEaters = recipe.targetEaters.map(name => {
            const eater = eaters.find(e => e.name.toLowerCase() === name.toLowerCase());
            return eater ? eater.eaterId : null;
          }).filter(Boolean);
          
          eaterIds = targetEaters;
          dietProfileTags = recipe.dietProfiles || [];
          
          console.log(`🍽️  Multi-profile: ${date} ${mealType} → "${recipe.name}" for ${recipe.targetEaters.join(', ')}`);
        } else {
          // Single profile or legacy format: use schedule
          if (baseSpec?.weeklySchedule && date) {
            const mealDate = new Date(date + 'T00:00:00');
            const dayOfWeek = mealDate.getDay(); // 0 = Sunday
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            
            const daySchedule = baseSpec.weeklySchedule[dayName];
            if (daySchedule && daySchedule[mealType]) {
              eaterIds = daySchedule[mealType].eaterIds || [];
              servings = daySchedule[mealType].servings || recipe.servings || 1;
              console.log(`📅 ${date} (${dayName}) ${mealType}: ${servings} servings, ${eaterIds.length} eater(s)`);
            }
          }
          
          // Fallback: if no schedule or no eaterIds, use all eaters
          if (eaterIds.length === 0) {
            eaterIds = eaters.map(e => e.eaterId);
            servings = recipe.servings || eaters.length || defaultServings;
            console.log(`⚠️  No schedule for ${date} ${mealType}, using all eaters (${eaterIds.length})`);
          }
        }
        
        // Create meal object (Slice 5.1: with multi-profile support)
        const meal = {
          mealId: generateMealId(),
          recipeId: recipeData.recipeId,
          mealType: mealType,
          date: date,
          eaterIds: eaterIds,
          servings: servings,
          notes: recipe.notes || '',
          // Multi-profile fields (Slice 5.1)
          targetEaters: targetEaters,
          dietProfileTags: dietProfileTags
        };

        meals.push(meal);
      }
    }
  }

  return meals;
}

/**
 * Calculate next Saturday from today
 * @returns {string} Date in YYYY-MM-DD format
 */
function getNextSaturday() {
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  return nextSaturday.toISOString().split('T')[0];
}

/**
 * Calculate week end date (following Friday)
 * @param {string} weekOf - Week start date (Saturday)
 * @returns {string} Date in YYYY-MM-DD format
 */
function getWeekEnd(weekOf) {
  const startDate = new Date(weekOf);
  startDate.setDate(startDate.getDate() + 6); // Saturday + 6 days = Friday
  return startDate.toISOString().split('T')[0];
}

/**
 * Calculate estimated budget from recipes
 * @param {Array} recipes - Array of recipe objects
 * @returns {number} Estimated budget
 */
function calculateBudget(recipes) {
  // Simple estimation: ~$5-8 per recipe based on complexity
  return recipes.reduce((total, recipe) => {
    const ingredientCount = recipe.ingredients?.length || 0;
    const basePrice = 5;
    const pricePerIngredient = 0.5;
    return total + basePrice + (ingredientCount * pricePerIngredient);
  }, 0);
}

/**
 * Transform Claude's output into normalized storage format
 * @param {Object} claudeOutput - Raw JSON from Claude
 * @returns {Object} { recipes: Array, meals: Array, mealPlan: Object }
 */
export function transformGeneratedPlan(claudeOutput) {
  try {
    // Validate input
    if (!claudeOutput || typeof claudeOutput !== 'object') {
      throw new Error('Invalid Claude output: must be an object');
    }

    if (!Array.isArray(claudeOutput.days) || claudeOutput.days.length === 0) {
      throw new Error('Invalid Claude output: missing or empty days array');
    }

    // Extract and deduplicate recipes (Slice 5: checks catalog first!)
    const { recipes, recipeMap, catalogMatches } = extractRecipes(claudeOutput.days);

    if (recipes.length === 0 && recipeMap.size === 0) {
      throw new Error('No valid recipes found in Claude output');
    }

    // Create meals from days
    const meals = createMeals(claudeOutput.days, recipeMap);

    if (meals.length === 0) {
      throw new Error('No valid meals found in Claude output');
    }

    // Determine week dates
    const weekOf = claudeOutput.weekOf || getNextSaturday();
    const weekEnd = getWeekEnd(weekOf);

    // Calculate budget
    const targetBudget = claudeOutput.budget?.target || 0;
    const estimatedBudget = claudeOutput.budget?.estimated || calculateBudget(recipes);

    // Build meal plan object
    const mealPlan = {
      _schemaVersion: 1,
      mealPlanId: generateMealPlanId(weekOf),
      weekOf,
      weekEnd,
      createdAt: new Date().toISOString(),
      mealIds: meals.map(m => m.mealId),
      budget: {
        target: targetBudget,
        estimated: Math.round(estimatedBudget)
      },
      summary: claudeOutput.summary || 'Weekly meal plan', // Brief 5-6 word summary
      weeklyPreferences: '', // Can be populated from user input later
      conversation: {
        messages: [] // Can be populated with chat history
      },
      // Slice 5: Track catalog usage
      _catalogStats: {
        catalogMatches,
        newRecipes: recipes.length,
        catalogPercentage: Math.round((catalogMatches / (catalogMatches + recipes.length)) * 100)
      }
    };

    console.log(`✅ Meal plan: ${catalogMatches} from catalog, ${recipes.length} generated (${mealPlan._catalogStats.catalogPercentage}% catalog)`);

    return {
      recipes,
      meals,
      mealPlan
    };

  } catch (error) {
    console.error('Error transforming meal plan:', error);
    throw error;
  }
}

/**
 * Validate transformed data structure
 * @param {Object} data - Transformed data { recipes, meals, mealPlan }
 * @returns {boolean} True if valid
 */
export function validateTransformedData(data) {
  try {
    // Check top-level structure
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be an object');
    }

    const { recipes, meals, mealPlan } = data;

    // Validate recipes
    if (!Array.isArray(recipes) || recipes.length === 0) {
      throw new Error('recipes must be a non-empty array');
    }

    recipes.forEach((recipe, i) => {
      if (!recipe.recipeId || !recipe.name) {
        throw new Error(`Recipe ${i} missing required fields`);
      }
    });

    // Validate meals
    if (!Array.isArray(meals) || meals.length === 0) {
      throw new Error('meals must be a non-empty array');
    }

    meals.forEach((meal, i) => {
      if (!meal.mealId || !meal.recipeId) {
        throw new Error(`Meal ${i} missing required fields`);
      }
    });

    // Validate mealPlan
    if (!mealPlan || typeof mealPlan !== 'object') {
      throw new Error('mealPlan must be an object');
    }

    if (!mealPlan.mealPlanId || !mealPlan.weekOf) {
      throw new Error('mealPlan missing required fields');
    }

    return true;

  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}
