/**
 * Vercel Serverless Function
 * Proxies requests to Claude API with server-side API key
 * Uses non-streaming for reliability
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable
  const apiKey = (process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key)?.trim();

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.' 
    });
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return res.status(500).json({ 
      error: 'Invalid API key format. The key should start with "sk-ant-".' 
    });
  }

  try {
    const { userPrompt, budgetTarget, store, feedbackHistory, shoppingDay = 6 } = req.body; // 6 = Saturday

    const baseSpec = loadBaseSpecification();
    const feedbackSummary = buildFeedbackSummary(feedbackHistory || []);
    const weekInfo = getWeekInfo(shoppingDay);

    const systemPrompt = `${baseSpec}
${feedbackSummary ? `\n## FEEDBACK HISTORY\n${feedbackSummary}` : ''}

Generate a meal plan. Return ONLY valid JSON. No markdown code blocks. Escape quotes with \\".`;

    const userMessage = `Generate a COMPLETE meal plan for: ${weekInfo.rangeStr}
Budget: $${budgetTarget} | Store: ${store === 'coles-caulfield' ? 'Coles Caulfield' : 'Woolworths Carnegie'}
${userPrompt ? `Preferences: ${userPrompt}` : ''}

CRITICAL REQUIREMENTS:
- Year: ${weekInfo.year}
- week_of: "${weekInfo.isoDate}"
- Shopping day: ${weekInfo.shoppingDayName}
${weekInfo.isPartialWeek ? `- PARTIAL WEEK: Only generate for: ${weekInfo.daysToGenerate.join(', ')}` : `- Generate FULL 7-day week`}

YOU MUST RETURN COMPLETE JSON with ALL of the following:

1. shopping_list: Array of 25-40 items. Each item: {"item": "name", "quantity": "amount", "category": "Produce|Proteins|Dairy|Grains|Pantry|Bakery", "estimated_price": number, "aisle": number}

2. roland_meals: EVERY day (saturday through friday) MUST have:
   - breakfast: {"name": "Protein Bar", "time": "8:00 AM"}
   - lunch: {"name": "ACTUAL MEAL NAME", "time": "12:30 PM"} - NOT "..." but real meal names like "Hummus Power Bowl", "Lentil Soup with Bread", etc.
   - dinner: {"name": "ACTUAL MEAL NAME", "time": "5:30 PM"} - Real names like "Grilled Salmon with Vegetables", "Tofu Stir-Fry", etc.
   - recipes: Array with 2-3 recipes per day, each having: {"name": "Recipe Name", "ing": ["100g ingredient 1", "200g ingredient 2", ...], "steps": ["Step 1 instruction", "Step 2 instruction", ...]}

SPECIAL DAYS:
- Thursday: lunch at 12:00 PM (last meal), dinner: null (fast begins)
- Friday: breakfast is coffee only, lunch at 1:00 PM (break fast)

3. maia_meals: Sunday-Wednesday only (null for Thu-Sat)
   - Sunday: lunch and dinner
   - Monday-Tuesday: breakfast (crumpet), packed lunch, dinner
   - Wednesday: breakfast, lunch with Roland, dinner at mum's (null)

4. prep_tasks: Each day has {"roland": {"morning": ["task 1", ...], "evening": ["task 1", ...]}, "maia": {...}}

5. budget_estimate: Total estimated cost (number)

EXAMPLE (partial - you must complete ALL days):
{
  "week_of": "${weekInfo.isoDate}",
  "shopping_list": [
    {"item": "Salmon fillet", "quantity": "400g", "category": "Proteins", "estimated_price": 15.00, "aisle": 4},
    {"item": "Firm tofu", "quantity": "400g", "category": "Proteins", "estimated_price": 4.50, "aisle": 3},
    {"item": "Mixed salad greens", "quantity": "4 bags", "category": "Produce", "estimated_price": 12.00, "aisle": 1},
    {"item": "Broccoli", "quantity": "500g", "category": "Produce", "estimated_price": 4.00, "aisle": 1},
    {"item": "Avocados", "quantity": "3", "category": "Produce", "estimated_price": 5.00, "aisle": 1},
    {"item": "Hummus", "quantity": "400g", "category": "Dairy", "estimated_price": 6.00, "aisle": 3}
  ],
  "roland_meals": {
    "saturday": {
      "breakfast": {"name": "Protein Bar", "time": "8:00 AM"},
      "lunch": {"name": "Mediterranean Hummus Bowl", "time": "12:30 PM"},
      "dinner": {"name": "Pan-Seared Salmon with Roasted Vegetables", "time": "5:30 PM"},
      "recipes": [
        {"name": "Mediterranean Hummus Bowl", "ing": ["150g hummus", "200g mixed greens", "100g chickpeas", "50g feta", "15ml olive oil"], "steps": ["Arrange greens in bowl", "Add hummus and chickpeas", "Top with feta", "Drizzle olive oil"]},
        {"name": "Pan-Seared Salmon", "ing": ["150g salmon fillet", "200g broccoli", "100g asparagus", "15ml olive oil", "lemon"], "steps": ["Season salmon with salt and pepper", "Pan-sear 4 min each side", "Steam vegetables", "Serve with lemon"]}
      ]
    },
    "sunday": {
      "breakfast": {"name": "Protein Bar", "time": "8:00 AM"},
      "lunch": {"name": "Greek Salad with Chickpeas", "time": "12:30 PM"},
      "dinner": {"name": "Grilled Tofu with Stir-Fried Vegetables", "time": "5:30 PM"},
      "recipes": [...]
    }
  },
  "maia_meals": {
    "sunday": {"lunch": {"name": "Pasta with butter", "time": "12:30 PM"}, "dinner": {"name": "Tofu portion with rice", "time": "5:30 PM"}},
    "monday": {"breakfast": {"name": "Crumpet with strawberries", "time": "8:00 AM"}, "lunch": {"name": "Packed lunch: sandwich, fruit, yogurt", "time": "12:30 PM"}, "dinner": {"name": "Shared dinner with Roland", "time": "5:30 PM"}}
  },
  "prep_tasks": {
    "saturday": {"roland": {"morning": ["Make protein bars for the week", "Wash and prep salad greens"], "evening": []}, "maia": {"morning": [], "evening": []}}
  },
  "budget_estimate": 142.50,
  "notes": "Focus on anti-inflammatory foods this week"
}

DO NOT use "..." or placeholders. Generate REAL meal names and REAL recipes for ALL 7 days.`;

    // Call Claude API (non-streaming for reliability)
    // Using higher max_tokens to ensure complete response with all meals and recipes
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 12000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      console.error('Claude API error:', errorMessage);
      return res.status(response.status).json({ error: errorMessage });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse and validate the response
    const mealPlan = parseAndValidateMealPlan(content, budgetTarget, weekInfo.isoDate);
    return res.status(200).json(mealPlan);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate meal plan.' 
    });
  }
}

/**
 * Parse and validate the meal plan JSON
 */
function parseAndValidateMealPlan(content, budgetTarget, weekOf) {
  let jsonText = content.trim();
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```json?\n?/i, '').replace(/```\s*$/i, '').trim();
  }
  
  // Extract just the JSON object
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  }

  let mealPlan;
  try {
    mealPlan = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('JSON parse error, attempting repair:', parseError.message);
    console.error('Raw JSON (first 500 chars):', jsonText.substring(0, 500));
    const fixedJson = attemptJsonRepair(jsonText);
    mealPlan = JSON.parse(fixedJson);
  }

  // Ensure correct week_of date
  mealPlan.week_of = weekOf;

  // Log what we received for debugging
  const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  console.log('Received meal plan structure:');
  days.forEach(day => {
    const rolandDay = mealPlan.roland_meals?.[day];
    console.log(`  ${day}: breakfast=${rolandDay?.breakfast?.name || 'MISSING'}, lunch=${rolandDay?.lunch?.name || 'MISSING'}, dinner=${rolandDay?.dinner?.name || 'MISSING'}, recipes=${rolandDay?.recipes?.length || 0}`);
  });

  // Validate shopping list exists
  if (!mealPlan.shopping_list || !Array.isArray(mealPlan.shopping_list) || mealPlan.shopping_list.length === 0) {
    console.warn('Shopping list missing, generating fallback');
    mealPlan.shopping_list = generateFallbackShoppingList(mealPlan);
  } else {
    console.log(`Shopping list has ${mealPlan.shopping_list.length} items`);
  }

  // Ensure roland_meals exists
  if (!mealPlan.roland_meals) {
    console.warn('roland_meals missing from response');
    mealPlan.roland_meals = {};
  }

  return { ...mealPlan, budget_target: budgetTarget };
}

/**
 * Load base specification
 */
function loadBaseSpecification() {
  return `You are a meal planning assistant generating detailed weekly meal plans.

## ROLAND'S DIETARY REQUIREMENTS
- Focus: Anti-inflammatory, gut health, high protein, low carb for dinners
- Breakfast 8:00 AM: Always a protein bar (homemade)
- Lunch 12:30 PM: Balanced meal with protein bar (~600 cal total)
- Dinner 5:30 PM: 120-150g protein (fish: salmon, sardines, mackerel, tuna OR plant: tofu, tempeh) + 200-300g vegetables + healthy fats (olive oil, avocado). NO carbs at dinner.
- Preferred proteins: Wild salmon, sardines, mackerel, firm tofu, tempeh
- Include fermented foods: sauerkraut, kimchi, kefir, Greek yogurt
- Thursday: FAST DAY - Early lunch at 12:00 PM is LAST MEAL, NO dinner
- Friday: POST-FAST - Coffee only for breakfast, Break fast with light lunch at 1:00 PM

## MAIA (6 YEAR OLD) - Simple Kid-Friendly Meals
- Sunday: Lunch (pasta, simple) and dinner with Roland (plain portion of his meal)
- Monday-Tuesday: Breakfast (crumpet with fruit), Packed school lunch (sandwich, yogurt, fruit, crackers), Dinner with Roland
- Wednesday: Breakfast, Lunch with Roland, At mum's for dinner (no meal needed)
- Thursday-Saturday: Not with Roland (no meals needed)

## REQUIRED OUTPUT FORMAT
You MUST generate:
1. Complete meals for ALL 7 days (breakfast, lunch, dinner for each)
2. 2-3 detailed recipes per day with full ingredients list and cooking steps
3. 25-40 shopping items covering all ingredients
4. Prep tasks for meal preparation

## PROTEIN BAR RECIPE (Make on Saturday/Sunday)
Include this in saturday or sunday recipes:
- Base: oats, protein powder, nut butter, maple syrup, mashed banana
- Add-ins: walnuts, chia seeds, cacao, dried berries
- Chocolate coating: dark chocolate, coconut oil
- Makes 12 bars for the week`;
}

/**
 * Build feedback summary
 */
function buildFeedbackSummary(feedbackHistory) {
  if (!feedbackHistory?.length) return null;
  const parts = [];
  feedbackHistory.forEach(f => {
    if (f.loved) parts.push(`Loved: ${f.loved}`);
    if (f.didntWork) parts.push(`Didn't work: ${f.didntWork}`);
    if (f.notes) parts.push(`Notes: ${f.notes}`);
  });
  return parts.length ? parts.join('\n') : null;
}

/**
 * Attempt to repair common JSON issues
 */
function attemptJsonRepair(jsonText) {
  let fixed = jsonText;
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control chars
  
  // Balance brackets/braces
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  if (openBraces > closeBraces) fixed += '}'.repeat(openBraces - closeBraces);
  if (openBrackets > closeBrackets) fixed += ']'.repeat(openBrackets - closeBrackets);
  
  return fixed;
}

/**
 * Get week info based on shopping day
 * @param {number} shoppingDay - Day of week (0=Sunday, 6=Saturday)
 */
function getWeekInfo(shoppingDay = 6) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesCapitalized = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const today = new Date();
  const todayDayOfWeek = today.getDay();
  
  // Calculate the start of the current meal plan week (most recent shopping day)
  const weekStart = new Date(today);
  let daysSinceShoppingDay = (todayDayOfWeek - shoppingDay + 7) % 7;
  
  // If today is shopping day, this is a new week
  const isShoppingDay = todayDayOfWeek === shoppingDay;
  
  if (isShoppingDay) {
    // Today is shopping day - generate full week starting today
    daysSinceShoppingDay = 0;
  }
  
  weekStart.setDate(today.getDate() - daysSinceShoppingDay);
  
  // Week ends the day before the next shopping day
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Determine if this is a partial week regeneration (mid-week)
  const isPartialWeek = !isShoppingDay && daysSinceShoppingDay > 0;
  
  // Build list of days to generate
  const daysToGenerate = [];
  const allDaysInOrder = [];
  
  // Create ordered list of days starting from shopping day
  for (let i = 0; i < 7; i++) {
    const dayIndex = (shoppingDay + i) % 7;
    allDaysInOrder.push(dayNames[dayIndex]);
  }
  
  if (isPartialWeek) {
    // Only generate from today until the day before shopping day
    for (let i = daysSinceShoppingDay; i < 7; i++) {
      const dayIndex = (shoppingDay + i) % 7;
      daysToGenerate.push(dayNamesCapitalized[dayIndex]);
    }
  } else {
    // Full week
    daysToGenerate.push(...allDaysInOrder.map(d => d.charAt(0).toUpperCase() + d.slice(1)));
  }
  
  // Format date strings
  const rangeStr = `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
  const isoDate = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  
  return {
    rangeStr,
    isoDate,
    year: weekStart.getFullYear(),
    shoppingDay,
    shoppingDayName: dayNamesCapitalized[shoppingDay],
    endDayName: dayNamesCapitalized[(shoppingDay + 6) % 7],
    isPartialWeek,
    daysToGenerate,
    allDaysInOrder,
    daysSinceShoppingDay
  };
}

/**
 * Generate fallback shopping list from recipes
 */
function generateFallbackShoppingList(mealPlan) {
  const ingredients = new Map();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  days.forEach(day => {
    const rolandDay = mealPlan.roland_meals?.[day];
    if (rolandDay?.recipes) {
      rolandDay.recipes.forEach(recipe => {
        if (recipe?.ing) {
          recipe.ing.forEach(ing => {
            if (ing && !ingredients.has(ing.toLowerCase())) {
              ingredients.set(ing.toLowerCase(), {
                item: ing,
                quantity: '1',
                category: guessCategory(ing),
                estimated_price: 5.00,
                aisle: guessAisle(ing)
              });
            }
          });
        }
      });
    }
  });
  
  return Array.from(ingredients.values());
}

function guessCategory(ing) {
  const l = ing.toLowerCase();
  if (/salmon|tuna|fish|tofu|tempeh|chicken|beef|protein/.test(l)) return 'Proteins';
  if (/milk|yogurt|cheese|kefir|cream/.test(l)) return 'Dairy';
  if (/spinach|kale|broccoli|carrot|tomato|salad|vegetable|avocado|lemon|onion|garlic/.test(l)) return 'Produce';
  if (/rice|quinoa|bread|oat|grain|pasta/.test(l)) return 'Grains';
  return 'Pantry';
}

function guessAisle(ing) {
  const cat = guessCategory(ing);
  return { 'Produce': 1, 'Bakery': 2, 'Dairy': 3, 'Proteins': 4, 'Grains': 5, 'Pantry': 5 }[cat] || 5;
}
