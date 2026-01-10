/**
 * Generate Meal Plan API Endpoint
 * Creates a weekly meal plan using Claude AI with SSE progress streaming
 */

import Anthropic from '@anthropic-ai/sdk';

// Configure for Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Default eater if none provided
const DEFAULT_EATER = {
  name: 'User',
  preferences: 'no restrictions',
  schedule: 'home for dinner'
};

// System prompt for meal plan generation
const SYSTEM_PROMPT = `You are Vanessa, an expert meal planning assistant. Generate a complete 7-day meal plan based on user preferences.

CRITICAL: Your response must be ONLY valid JSON in this EXACT format with NO additional text:

{
  "weekOf": "YYYY-MM-DD",
  "budget": {
    "estimated": number
  },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "breakfast": {
        "name": "Recipe Name",
        "servings": number,
        "fromCatalog": true,  // Set true for catalog recipes, false for new recipes
        
        // ONLY include these fields if fromCatalog is FALSE (new recipe):
        "ingredients": [/* only for NEW recipes */],
        "instructions": "...",  // only for NEW recipes
        "prepTime": number,     // only for NEW recipes
        "cookTime": number,     // only for NEW recipes
        "tags": ["tag1"]        // only for NEW recipes
      },
      "lunch": { /* same structure */ },
      "dinner": { /* same structure */ }
    }
  ]
}

⚠️ CRITICAL - TWO RECIPE FORMATS:

FORMAT 1 - CATALOG RECIPES (use this 80%+ of the time):
{
  "name": "Exact catalog recipe name",
  "servings": number,
  "fromCatalog": true
}
DO NOT include ingredients, instructions, prepTime, cookTime, or tags for catalog recipes!
The client already has all these details locally.

FORMAT 2 - NEW RECIPES (only when catalog has no suitable option):
{
  "name": "New Recipe Name",
  "servings": number,
  "fromCatalog": false,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "g|ml|whole",
      "category": "produce|meat|dairy|pantry|other"
    }
  ],
  "instructions": "Brief instructions (2-3 sentences max)",
  "prepTime": number,
  "cookTime": number,
  "tags": ["tag1", "tag2"]
}

Guidelines:
- Generate exactly 7 days of meals (21 total: breakfast, lunch, dinner each day)
- Target: 80%+ catalog recipes (16-20 out of 21 meals)
- For catalog recipes: ONLY provide name, servings, and fromCatalog: true
- For new recipes: Provide all details (ingredients, instructions, timing, tags)
- Keep new recipe instructions BRIEF (2-3 sentences max)
- Use 3-6 main ingredients for new recipes (keep it simple)
- Include realistic estimated budget in dollars

🛒 CRITICAL - SHOPPING LIST OPTIMIZATION (HIGHEST PRIORITY):
Your PRIMARY goal is to create a meal plan with a MINIMAL shopping list (30-40 unique ingredients max).
This is achieved by selecting recipes that SHARE COMMON INGREDIENTS.

**INGREDIENT OVERLAP STRATEGY - FOLLOW THIS PROCESS:**

STEP 1: Choose a "Core Ingredients Set" BEFORE selecting recipes:
- Pick 2-3 PROTEINS to use throughout the week (e.g., chicken, salmon, eggs)
- Pick 4-5 VEGETABLES to repeat (e.g., tomatoes, zucchini, bell peppers, spinach, onion)
- Pick 2-3 GRAINS/STARCHES (e.g., rice, pasta, quinoa)
- Pick 1-2 DAIRY items (e.g., greek yogurt, feta cheese)
- Use standard PANTRY STAPLES (olive oil, garlic, lemon, salt, pepper)

STEP 2: Select recipes that use your core ingredients:
- For EACH recipe you consider, check: "Does this share ingredients with other meals?"
- PREFER recipes that reuse your core proteins and vegetables
- AVOID introducing one-off ingredients (e.g., if only one recipe needs duck, skip it)

STEP 3: Plan meals in clusters around shared ingredients:
- If you use salmon on Monday, plan to use salmon again on Wednesday or Thursday
- If a recipe uses zucchini, find 2-3 other recipes that also use zucchini
- Breakfast items should share with each other (same fruits, yogurt, eggs across the week)

**GOOD INGREDIENT REUSE EXAMPLES:**

Example 1 - Protein Reuse:
- Monday Dinner: Lemon Herb Salmon (uses: salmon, lemon, herbs)
- Wednesday Lunch: Salmon Quinoa Bowl (uses: salmon, quinoa, vegetables)
- Result: Salmon bought ONCE, used TWICE

Example 2 - Vegetable Reuse:
- Monday: Mediterranean Salad (tomatoes, cucumber, feta)
- Tuesday: Greek Chicken (tomatoes, feta, olives)
- Thursday: Shakshuka (tomatoes, eggs)
- Result: Tomatoes bought ONCE, used THREE TIMES

Example 3 - Breakfast Consistency:
- All 7 breakfasts: Greek yogurt + rotating toppings (honey, berries, banana)
- Result: ONE yogurt type, 3-4 topping ingredients for the whole week

**BAD PATTERNS TO AVOID:**

❌ DON'T: Choose beef on Monday, duck on Tuesday, lamb on Wednesday, pork on Thursday
✅ DO: Choose chicken for 3-4 dinners, salmon for 2 lunches

❌ DON'T: Different protein in every meal (7 different proteins = 7 shopping items)
✅ DO: 2-3 proteins across 21 meals = efficient shopping

❌ DON'T: Artichoke in one recipe only (one-off ingredient)
✅ DO: Common vegetables (bell peppers, tomatoes, spinach) that appear in 3+ recipes

**WHEN SELECTING FROM CATALOG:**
Before finalizing your recipe choices, mentally group them by main ingredients:
- "These 4 recipes all use chicken breast" ✓
- "These 3 recipes all use cherry tomatoes" ✓
- "This recipe is the only one using mango" ✗ (find an alternative or skip)

⚠️ CRITICAL - RECIPE SELECTION STRATEGY:
- The user has a LOCAL CATALOG of 494+ professionally-tested recipes with complete details
- Catalog includes: 26 cuisines, 15 protein types, 34 breakfasts, 18 curries, 11 stir-fries, plus soups, salads, and more
- You will be provided with a filtered list of available catalog recipes in the user prompt
- YOUR PRIMARY JOB: Select recipes FROM THE CATALOG LIST by using their exact names
- Only create NEW recipes when the catalog truly has no suitable options for a specific meal
- The catalog has already been filtered for the household's diet profiles and exclusions
- Using catalog recipes is BETTER: verified ingredients, health scores, proven quality, PLUS saves tokens!
- **When browsing the catalog, look at the (main ingredients) shown for each recipe and SELECT recipes with overlapping ingredients**

CRITICAL - Servings:
- CAREFULLY READ THE CONVERSATION to understand household composition and schedule
- Each meal's servings MUST match who is present for that specific meal
- If the user mentions different people on different days (e.g., "my daughter visits Sunday-Wednesday", "dinner for 3 on Tuesday"), you MUST adjust servings accordingly
- Pay special attention to:
  * Which days have children present (kid-friendly recipes needed)
  * Which meals have guests (different serving counts)
  * Solo meals vs family meals
- Example: If user says "Tuesday dinner is for me, my daughter, and my ex", that dinner must have servings: 3
- Example: If user says "just me Wednesday-Saturday", those meals should have servings: 1
- DO NOT default to 2 servings - ANALYZE THE CONVERSATION for exact household schedule

CRITICAL - Units:
- Use ONLY metric units in ingredient quantities
- Liquids: milliliters (ml) or liters
- Solids: grams (g) or kilograms (kg)
- DO NOT use: ounces, pounds, cups, tablespoons, teaspoons
- Exception: Count items can use "whole" (e.g., "2 whole onions", "3 whole eggs")
- All quantities should be WHOLE NUMBERS (not 0.2g - this isn't chemistry!)
- Examples: "200g chicken breast", "500ml milk", "2 whole tomatoes", "100g rice"

CRITICAL - Ingredient Names (SUPERMARKET-FRIENDLY):
When creating NEW recipes, use SPECIFIC BUT FINDABLE ingredient names:
✅ GOOD (Specific but common):
  - "feta cheese", "parmesan cheese", "cheddar cheese" (common varieties)
  - "chicken breast", "chicken thigh" (standard cuts)
  - "cherry tomatoes", "roma tomatoes" (common types)
  - "red onion", "yellow onion" (standard varieties)
  - "bell pepper" (common vegetable)
  - "greek yogurt", "plain yogurt" (standard types)
  - "whole wheat bread", "white bread" (common types)
  
❌ AVOID (Branded or obscure):
  - Branded items: "San Marzano tomatoes", "Campari tomatoes"
  - Obscure cheese: "Pecorino Romano", "Manchego", "Gruyère"
  - Specialty items: "black garlic", "mâche", "tatsoi"
  - Overly specific: "boneless skinless chicken breast" (just use "chicken breast")
  
✅ SUBSTITUTE obscure items with common equivalents:
  - "Gruyère" → "swiss cheese"
  - "Campari tomatoes" → "cherry tomatoes"
  - "shallots" → "onion"
  - "grapeseed oil" → "olive oil"

WHY: Keep ingredient names specific enough for recipe quality (feta ≠ cheddar) but avoid branded/obscure items that are hard to find in regular supermarkets.`;

/**
 * Validate request body
 */
function validateRequest(body) {
  const errors = [];

  // Validate chatHistory
  if (body.chatHistory !== undefined) {
    if (!Array.isArray(body.chatHistory)) {
      errors.push('chatHistory must be an array');
    }
  }

  // Validate eaters (Slice 5: now includes diet profiles and preferences)
  if (body.eaters !== undefined) {
    if (!Array.isArray(body.eaters)) {
      errors.push('eaters must be an array');
    } else if (body.eaters.length > 0) {
      body.eaters.forEach((eater, i) => {
        if (typeof eater !== 'object' || eater === null) {
          errors.push(`eater[${i}] must be an object`);
        }
        // Slice 5: Validate new eater fields (optional)
        if (eater.excludeIngredients !== undefined && !Array.isArray(eater.excludeIngredients)) {
          errors.push(`eater[${i}].excludeIngredients must be an array`);
        }
        if (eater.preferIngredients !== undefined && !Array.isArray(eater.preferIngredients)) {
          errors.push(`eater[${i}].preferIngredients must be an array`);
        }
      });
    }
  }
  
  // Slice 5: Validate baseSpecification (optional but expected)
  if (body.baseSpecification !== undefined) {
    if (typeof body.baseSpecification !== 'object' || body.baseSpecification === null) {
      errors.push('baseSpecification must be an object');
    }
  }
  
  // Slice 5: Validate catalog slice (optional)
  if (body.catalogSlice !== undefined) {
    if (!Array.isArray(body.catalogSlice)) {
      errors.push('catalogSlice must be an array');
    }
  }
  
  // Slice 4: Validate single-day regeneration parameters
  if (body.regenerateDay !== undefined) {
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (typeof body.regenerateDay !== 'string' || !validDays.includes(body.regenerateDay.toLowerCase())) {
      errors.push('regenerateDay must be a valid day name (sunday-saturday)');
    }
    
    if (!body.dateForDay) {
      errors.push('dateForDay is required when regenerateDay is specified');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateForDay)) {
      errors.push('dateForDay must be in YYYY-MM-DD format');
    }
  }
  
  if (body.existingMeals !== undefined) {
    if (!Array.isArray(body.existingMeals)) {
      errors.push('existingMeals must be an array');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Slice 5: Filter catalog recipes by diet profiles and constraints
 * @param {Array} catalog - Full recipe catalog
 * @param {Array} eaters - Array of eater objects
 * @param {string} mealType - Optional meal type filter (breakfast|lunch|dinner)
 * @returns {Array} Filtered recipes
 */
function getCandidateCatalogRecipes(catalog, eaters, mealType = null) {
  if (!catalog || catalog.length === 0) {
    return [];
  }

  // Extract unique diet profiles from eaters
  const profileIds = [...new Set(eaters.map(e => e.dietProfile).filter(Boolean))];
  
  // Collect all exclusions from all eaters (must avoid these)
  const allExclusions = eaters.flatMap(e => e.excludeIngredients || []).map(ex => ex.toLowerCase());
  
  // Collect all preferences (nice to have)
  const allPreferences = eaters.flatMap(e => e.preferIngredients || []).map(pref => pref.toLowerCase());

  let filtered = catalog;

  // Filter by meal type if specified
  if (mealType) {
    filtered = filtered.filter(recipe => {
      const mealSlots = recipe.tags?.mealSlots || [];
      return mealSlots.length === 0 || mealSlots.includes(mealType);
    });
  }

  // Filter by diet profiles (recipe must be compatible with at least one profile)
  if (profileIds.length > 0) {
    filtered = filtered.filter(recipe => {
      const recipeDiets = recipe.tags?.diets || [];
      
      // If recipe has no diet tags, it's neutral (compatible with all)
      if (recipeDiets.length === 0) return true;
      
      // Recipe is compatible if it matches any eater's diet profile
      return profileIds.some(profileId => recipeDiets.includes(profileId));
    });
  }

  // Filter out recipes with excluded ingredients
  if (allExclusions.length > 0) {
    filtered = filtered.filter(recipe => {
      const ingredientNames = (recipe.ingredients || [])
        .map(i => i.name.toLowerCase());
      
      // Check if any ingredient contains an excluded item
      const hasExcluded = allExclusions.some(excluded =>
        ingredientNames.some(name => name.includes(excluded))
      );
      
      return !hasExcluded;
    });
  }

  // Sort by preferences (recipes with preferred ingredients first)
  if (allPreferences.length > 0) {
    filtered.sort((a, b) => {
      const aIngredients = (a.ingredients || []).map(i => i.name.toLowerCase());
      const bIngredients = (b.ingredients || []).map(i => i.name.toLowerCase());
      
      const aMatches = allPreferences.filter(pref =>
        aIngredients.some(name => name.includes(pref))
      ).length;
      
      const bMatches = allPreferences.filter(pref =>
        bIngredients.some(name => name.includes(pref))
      ).length;
      
      return bMatches - aMatches; // Higher matches first
    });
  }

  return filtered;
}

/**
 * Build user prompt from chat history, eaters, and optional structured schedule
 * Slice 4: Enhanced to support single-day regeneration
 * Slice 5: Enhanced with diet profiles and catalog awareness
 */
function buildUserPrompt(chatHistory, eaters, baseSpec = null, regenerateDay = null, dateForDay = null, existingMeals = [], catalogSlice = null) {
  // Get next Saturday as week start
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  const weekOf = nextSaturday.toISOString().split('T')[0];

  // Extract preferences from chat history
  const recentMessages = chatHistory.slice(-10);
  let conversationContext = '';
  
  if (recentMessages.length > 0) {
    conversationContext = `\n\nUser's conversation with Vanessa:\n`;
    conversationContext += recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'USER' : 'VANESSA';
      return `${role}: ${msg.content}`;
    }).join('\n');
    conversationContext += '\n\nPay special attention to dietary preferences, recipe complexity, ingredient constraints, etc.';
  }

  // Slice 5: Format eater information with diet profiles and preferences
  const eaterInfo = eaters.map(eater => {
    let info = `- ${eater.name}`;
    
    // Add diet profile (Slice 5)
    if (eater.dietProfile) {
      info += `\n  🍽️  Diet Profile: ${eater.dietProfile}`;
    }
    
    // Add general preferences
    if (eater.preferences && eater.preferences !== 'no restrictions') {
      info += `\n  Preferences: ${eater.preferences}`;
    }
    
    // Add personal preferences (Slice 5)
    if (eater.personalPreferences) {
      info += `\n  Personal notes: ${eater.personalPreferences}`;
    }
    
    // Add preferred ingredients (Slice 5)
    if (eater.preferIngredients && eater.preferIngredients.length > 0) {
      info += `\n  ❤️  Prefers: ${eater.preferIngredients.join(', ')}`;
    }
    
    // Add excluded ingredients (Slice 5 - CRITICAL)
    if (eater.excludeIngredients && eater.excludeIngredients.length > 0) {
      info += `\n  ⛔ MUST EXCLUDE: ${eater.excludeIngredients.join(', ')}`;
    }
    
    // Add allergies (CRITICAL - must be avoided)
    if (eater.allergies && eater.allergies.length > 0) {
      info += `\n  ⚠️  ALLERGIES (MUST AVOID): ${eater.allergies.join(', ')}`;
    }
    
    // Add dietary restrictions
    if (eater.dietaryRestrictions && eater.dietaryRestrictions.length > 0) {
      info += `\n  Dietary restrictions: ${eater.dietaryRestrictions.join(', ')}`;
    }
    
    if (!eater.dietProfile && !eater.preferences && !eater.personalPreferences) {
      info += ': No specific preferences';
    }
    
    return info;
  }).join('\n\n');

  // Build explicit schedule requirements if available
  let scheduleRequirements = '';
  
  if (baseSpec?.weeklySchedule) {
    scheduleRequirements = '\n\nCRITICAL - EXACT SERVINGS SCHEDULE (FOLLOW PRECISELY):\n';
    scheduleRequirements += 'You MUST generate meals with these EXACT servings counts for each DATE:\n\n';
    
    // Map day names to actual dates in the week
    const weekStart = new Date(weekOf + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    
    // Generate schedule for each of the 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dayName = dayNames[dayOfWeek];
      const dayDisplayName = dayName.toUpperCase();
      
      const daySchedule = baseSpec.weeklySchedule[dayName];
      
      if (daySchedule) {
        scheduleRequirements += `${dateStr} (${dayDisplayName}):\n`;
        
        mealTypes.forEach(mealType => {
          const mealData = daySchedule[mealType];
          if (mealData) {
            // Handle requirements as either string or array
            let requirements = '';
            if (mealData.requirements) {
              if (typeof mealData.requirements === 'string' && mealData.requirements.length > 0) {
                requirements = ` - ${mealData.requirements}`;
              } else if (Array.isArray(mealData.requirements) && mealData.requirements.length > 0) {
                requirements = ` - ${mealData.requirements.join(', ')}`;
              }
            }
            scheduleRequirements += `  - ${mealType}: ${mealData.servings} serving${mealData.servings !== 1 ? 's' : ''}${requirements}\n`;
          }
        });
        
        scheduleRequirements += '\n';
      } else {
        // Fallback if no schedule for this day
        scheduleRequirements += `${dateStr} (${dayDisplayName}): 1 serving per meal (default)\n\n`;
      }
    }
    
    scheduleRequirements += 'These servings are CRITICAL - match them EXACTLY to each date.\n';
  } else {
    // Fallback to conversation-based requirements
    scheduleRequirements = `\n\nCRITICAL - SERVINGS REQUIREMENTS:
Read the conversation above VERY CAREFULLY to determine:
1. How many people are eating each meal on each day
2. When children are present (need kid-friendly recipes)
3. When guests join (adjust servings for that specific meal)
4. When the user is cooking just for themselves

For EACH of the 21 meals (7 days × 3 meals), you MUST:
- Analyze who is present for that specific meal based on the conversation
- Set servings to match the exact number of people
- Adjust ingredient quantities accordingly
- Choose kid-friendly recipes when children are present
`;
  }

  // Build ingredient constraint
  let ingredientConstraint = '';
  const maxItems = baseSpec?.maxShoppingListItems || 35;
  
  ingredientConstraint = `\n\n🎯 SHOPPING LIST TARGET: ${maxItems} UNIQUE INGREDIENTS MAXIMUM

This is a HARD CONSTRAINT. The user needs a simple, focused shopping list.

**YOUR CORE INGREDIENTS SET FOR THIS WEEK:**
Before selecting any recipes, mentally commit to:
- 2-3 proteins (e.g., chicken + salmon + eggs)
- 4-5 vegetables (e.g., tomatoes, zucchini, spinach, bell peppers, onion)
- 2-3 grains (e.g., rice, pasta, quinoa)
- 1-2 dairy (e.g., greek yogurt, feta)
- Standard pantry (olive oil, garlic, lemon, herbs)

Then SELECT ONLY recipes that use these core ingredients. Reject recipes that introduce unique one-off items.

**CALCULATION CHECK:**
- Proteins (3) + Vegetables (5) + Grains (3) + Dairy (2) + Pantry (8) = ~21 base ingredients
- This leaves room for ~14 specialty items across 21 meals
- Each specialty item should appear in 2+ recipes to justify its inclusion

If you find yourself adding a 4th protein or 6th vegetable, STOP and reconsider your recipe choices.`;

  // Slice 5: Add catalog information to prompt
  let catalogInfo = '';
  if (catalogSlice && catalogSlice.length > 0) {
    // Helper to format recipe with metadata
    const formatRecipe = (recipe) => {
      const diets = recipe.tags?.diets || [];
      const cuisines = recipe.tags?.cuisines || [];
      const mainIngredients = (recipe.ingredients || []).slice(0, 4).map(i => i.name);
      const prepTime = recipe.prepTime || 0;
      const healthScore = recipe.dietCompassScores?.overall || 0;
      
      // Build compact metadata string
      let metadata = [];
      if (diets.length > 0) metadata.push(`${diets.join(', ')}`);
      if (cuisines.length > 0) metadata.push(`${cuisines.join(', ')}`);
      if (healthScore > 0) metadata.push(`health: ${Math.round(healthScore)}/100`);
      if (prepTime > 0) metadata.push(`${prepTime}min`);
      
      const metaStr = metadata.length > 0 ? `[${metadata.join(' | ')}]` : '';
      const ingredients = mainIngredients.length > 0 ? `(${mainIngredients.join(', ')})` : '';
      
      return `• ${recipe.name} ${metaStr} ${ingredients}`.trim();
    };
    
    // Group recipes by meal type for better organization
    const byMealType = {
      breakfast: catalogSlice.filter(r => r.tags?.mealSlots?.includes('breakfast') || false),
      lunch: catalogSlice.filter(r => r.tags?.mealSlots?.includes('lunch') || false),
      dinner: catalogSlice.filter(r => r.tags?.mealSlots?.includes('dinner') || false),
      any: catalogSlice.filter(r => !r.tags?.mealSlots || r.tags.mealSlots.length === 0)
    };
    
    // If too many recipes, sample them to fit in prompt
    const maxPerMeal = 60; // Reduced due to richer format
    const sampleRecipes = (list) => {
      if (list.length <= maxPerMeal) return list;
      // Prioritize high health scores and variety of diets
      const sorted = [...list].sort((a, b) => {
        const scoreA = a.dietCompassScores?.overall || 0;
        const scoreB = b.dietCompassScores?.overall || 0;
        return scoreB - scoreA; // Higher scores first
      });
      // Take top 60
      return sorted.slice(0, maxPerMeal);
    };
    
    const breakfastSample = sampleRecipes(byMealType.breakfast);
    const lunchSample = sampleRecipes(byMealType.lunch);
    const dinnerSample = sampleRecipes(byMealType.dinner);
    const anySample = sampleRecipes(byMealType.any);
    
    catalogInfo = `\n\n🍽️ AVAILABLE RECIPE CATALOG (${catalogSlice.length} recipes):

CRITICAL: SELECT recipes FROM THIS LIST by using their EXACT names.
These recipes are pre-filtered for the household's diet profiles and exclusions.

FORMAT: Recipe Name [diet profiles | cuisines | health score | prep time] (main ingredients)

Breakfast Options (${breakfastSample.length} shown):
${breakfastSample.map(formatRecipe).join('\n')}

Lunch Options (${lunchSample.length} shown):
${lunchSample.map(formatRecipe).join('\n')}

Dinner Options (${dinnerSample.length} shown):
${dinnerSample.map(formatRecipe).join('\n')}

${anySample.length > 0 ? `Flexible (Any Meal) Options (${anySample.length} shown):\n${anySample.map(formatRecipe).join('\n')}\n` : ''}

⚠️ MANDATORY SELECTION RULES:
1. You MUST select recipes from the catalog list above - do NOT create new recipes unless absolutely necessary
2. For EACH meal slot, search the appropriate list (breakfast/lunch/dinner) for suitable options
3. A recipe is suitable if:
   - It matches the household's diet profiles (shown in brackets)
   - It does NOT contain excluded ingredients
   - It fits the prep time and complexity needs
4. Use the EXACT recipe name from the catalog (copy it character-for-character)
5. Even simple meals like "yogurt" or "salad" - use catalog versions if available
6. ONLY generate a NEW recipe if you've reviewed the entire relevant catalog list and found NO suitable matches
7. When using catalog recipes, still provide ingredients and instructions (the system will merge with catalog data)
8. Aim for 80%+ catalog usage - creating new recipes should be the exception, not the rule

IMPORTANT: The catalog has been pre-filtered for this household's needs. Most meals CAN and SHOULD come from the catalog.`;
  }

  // Slice 4: Handle single-day regeneration
  if (regenerateDay && dateForDay) {
    const dayNameUpper = regenerateDay.toUpperCase();
    
    // Extract existing recipe names to avoid duplication
    const existingRecipeNames = existingMeals
      .map(m => m.recipeName || '')
      .filter(name => name.length > 0);
    
    const avoidDuplication = existingRecipeNames.length > 0
      ? `\n\nIMPORTANT - AVOID DUPLICATION:
The user already has meals for the other 6 days this week with these recipes:
${existingRecipeNames.map(name => `- ${name}`).join('\n')}

DO NOT repeat any of these recipes for ${dayNameUpper}.
Ensure variety across the full week by choosing completely different recipes.`
      : '';
    
    return `Generate meals for ${dayNameUpper}, ${dateForDay} ONLY.

This is a single-day regeneration. The user wants to replace meals for this day only.

Generate ONLY 3 meals for ${dayNameUpper}:
- Breakfast
- Lunch
- Dinner

Household members:
${eaterInfo}
${conversationContext}
${scheduleRequirements}
${ingredientConstraint}
${catalogInfo}
${avoidDuplication}

If the user specified constraints in the conversation (like "simple recipes", "meal prep on Saturday", etc.), FOLLOW THOSE CONSTRAINTS STRICTLY.

Output ONLY the JSON structure specified in the system prompt. Since this is a single-day regeneration, include ONLY ONE day in the "days" array (${dateForDay}).`;
  }
  
  // Full week generation (default)
  return `Generate a meal plan for the week starting ${weekOf}.

CRITICAL: Generate EXACTLY 7 DAYS of meals (Saturday through Friday).
Your response must include ALL 7 days in the "days" array.

Household members:
${eaterInfo}
${conversationContext}
${scheduleRequirements}
${ingredientConstraint}
${catalogInfo}

Create a complete 7-day meal plan with breakfast, lunch, and dinner for each day. 

IMPORTANT: 
- Generate ALL 7 days (21 meals total)
- Do NOT stop early or truncate
- Keep instructions brief (2-3 sentences max per recipe) to fit all 7 days

If the user specified constraints in the conversation (like "simple recipes", "meal prep on Saturday", etc.), FOLLOW THOSE CONSTRAINTS STRICTLY.

Output ONLY the JSON structure specified in the system prompt, with no additional text.`;
}

/**
 * Send SSE message
 */
function sendSSE(writer, encoder, data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  writer.write(encoder.encode(message));
}

/**
 * Main handler for the generate-meal-plan endpoint
 */
export default async function handler(req) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check for API key
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { 
      chatHistory = [], 
      eaters = [], 
      baseSpecification = null,
      catalogSlice = null,  // Slice 5: Pre-filtered catalog recipes
      regenerateDay = null,
      dateForDay = null,
      existingMeals = []
    } = body;

    // Use default eater if none provided
    const finalEaters = eaters.length > 0 ? eaters : [DEFAULT_EATER];
    
    // Slice 5: Log catalog slice info if provided
    if (catalogSlice && catalogSlice.length > 0) {
      console.log(`📚 Using catalog slice with ${catalogSlice.length} recipes`);
    }

    // Slice 5: Filter catalog if available (server-side pre-filtering)
    let filteredCatalog = null;
    if (catalogSlice && catalogSlice.length > 0) {
      // Apply diet profile and exclusion filtering
      filteredCatalog = getCandidateCatalogRecipes(catalogSlice, finalEaters);
      console.log(`🔍 Filtered catalog: ${catalogSlice.length} → ${filteredCatalog.length} recipes`);
      
      // Log diet profiles for debugging
      const profiles = finalEaters.map(e => e.dietProfile).filter(Boolean);
      if (profiles.length > 0) {
        console.log(`👥 Diet profiles: ${profiles.join(', ')}`);
      }
    }

    // Build user prompt (with optional baseSpecification for structured schedule)
    // Slice 4: Include regeneration parameters
    // Slice 5: Include catalog slice
    const userPrompt = buildUserPrompt(
      chatHistory, 
      finalEaters, 
      baseSpecification,
      regenerateDay,
      dateForDay,
      existingMeals,
      filteredCatalog  // Slice 5: Pass filtered catalog
    );

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Create abort controller for 90s timeout (Vercel Edge limit)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 90000);

    // Set up SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const writer = {
          write: (chunk) => controller.enqueue(chunk)
        };

        try {
          // Send initial progress
          sendSSE(writer, encoder, {
            type: 'progress',
            progress: 10,
            message: 'Analyzing your preferences...'
          });

          // Create Claude stream
          const messageStream = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 12288,  // Increased for Slice 5 (was 8192)
            temperature: 0.7,  // Lower temp for faster, more focused generation
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: userPrompt
              }
            ],
            stream: true,
          });

          let accumulatedText = '';
          let progressSteps = [25, 50, 75, 90];
          let currentStep = 0;

          // Send progress updates
          sendSSE(writer, encoder, {
            type: 'progress',
            progress: 25,
            message: 'Planning your week...'
          });

          // Process stream
          for await (const event of messageStream) {
            // Check for abort
            if (abortController.signal.aborted) {
              throw new Error('Request timeout');
            }

            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              accumulatedText += event.delta.text;

              // Send progress updates based on accumulated length
              if (currentStep < progressSteps.length) {
                const expectedLength = 8000; // Approximate JSON length
                const currentProgress = Math.min(
                  progressSteps[currentStep],
                  Math.floor((accumulatedText.length / expectedLength) * 100)
                );

                if (accumulatedText.length > (expectedLength * (currentStep + 1) / progressSteps.length)) {
                  currentStep++;
                  const messages = [
                    'Creating delicious recipes...',
                    'Organizing your meals...',
                    'Calculating your shopping list...',
                    'Finalizing your plan...'
                  ];
                  sendSSE(writer, encoder, {
                    type: 'progress',
                    progress: progressSteps[Math.min(currentStep, progressSteps.length - 1)],
                    message: messages[Math.min(currentStep, messages.length - 1)]
                  });
                }
              }
            }
          }

          // Clear timeout
          clearTimeout(timeoutId);

          // Send final progress
          sendSSE(writer, encoder, {
            type: 'progress',
            progress: 95,
            message: 'Preparing your meal plan...'
          });

          // Parse JSON response
          let parsedData;
          try {
            // Remove markdown code fences if present
            let cleanedText = accumulatedText.trim();
            
            // Strip ```json and ``` if present
            cleanedText = cleanedText.replace(/^```json\s*/i, '');
            cleanedText = cleanedText.replace(/^```\s*/i, '');
            cleanedText = cleanedText.replace(/\s*```$/i, '');
            
            // Extract JSON object (first { to last })
            const firstBrace = cleanedText.indexOf('{');
            const lastBrace = cleanedText.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
              throw new Error('No valid JSON object found in response');
            }
            
            const jsonStr = cleanedText.substring(firstBrace, lastBrace + 1);
            parsedData = JSON.parse(jsonStr);
            
            console.log('Successfully parsed JSON response');
          } catch (parseError) {
            console.error('Failed to parse Claude response:', parseError);
            console.error('Raw response (first 1000 chars):', accumulatedText.substring(0, 1000));
            console.error('Raw response (last 500 chars):', accumulatedText.substring(Math.max(0, accumulatedText.length - 500)));
            throw new Error('Failed to parse meal plan data: ' + parseError.message);
          }

          // Validate basic structure
          if (!parsedData.days || !Array.isArray(parsedData.days)) {
            throw new Error('Invalid meal plan structure');
          }

          // Send complete event with data
          sendSSE(writer, encoder, {
            type: 'complete',
            data: parsedData
          });

          controller.close();

        } catch (error) {
          console.error('Generation error:', error);
          
          // Clear timeout
          clearTimeout(timeoutId);

          // Send error event
          sendSSE(writer, encoder, {
            type: 'error',
            error: error.message || 'Generation failed'
          });

          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Endpoint error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
