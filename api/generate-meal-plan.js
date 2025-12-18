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
    const { userPrompt, budgetTarget, store, feedbackHistory } = req.body;

    const baseSpec = loadBaseSpecification();
    const feedbackSummary = buildFeedbackSummary(feedbackHistory || []);
    const weekInfo = getNextWeekDate();

    const systemPrompt = `${baseSpec}
${feedbackSummary ? `\n## FEEDBACK HISTORY\n${feedbackSummary}` : ''}

Generate a meal plan. Return ONLY valid JSON. No markdown code blocks. Escape quotes with \\".`;

    const userMessage = `Generate meal plan for: ${weekInfo.rangeStr}
Budget: $${budgetTarget} | Store: ${store === 'coles-caulfield' ? 'Coles Caulfield' : 'Woolworths Carnegie'}
${userPrompt ? `Preferences: ${userPrompt}` : ''}

CRITICAL: The year is ${weekInfo.year}. Use week_of: "${weekInfo.isoDate}"

Return this JSON structure:
{
  "week_of": "${weekInfo.isoDate}",
  "shopping_list": [{"item": "Salmon fillet", "quantity": "300g", "category": "Proteins", "estimated_price": 12.00, "aisle": 4}],
  "roland_meals": {
    "sunday": {"breakfast": {"name": "Protein Bar", "time": "8:00 AM"}, "lunch": {"name": "...", "time": "12:30 PM"}, "dinner": {"name": "...", "time": "5:30 PM"}, "recipes": [{"name": "...", "ing": ["120g salmon"], "steps": ["Step 1"]}]},
    "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}
  },
  "maia_meals": {"sunday": {"lunch": {...}, "dinner": {...}}, "monday": {...}, ...},
  "prep_tasks": {"sunday": {"roland": {"morning": [], "evening": []}, "maia": {...}}, ...},
  "budget_estimate": 140.00,
  "notes": ""
}

REQUIREMENTS:
1. shopping_list MUST have 25-40 items covering ALL meals
2. Include recipes with ing[] and steps[] for Roland's lunch/dinner
3. Thursday: lunch at 12PM, NO dinner (fast day)
4. Friday: coffee only breakfast, lunch at 1PM`;

    // Call Claude API (non-streaming for reliability)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8000,
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
    const fixedJson = attemptJsonRepair(jsonText);
    mealPlan = JSON.parse(fixedJson);
  }

  // Ensure correct week_of date
  mealPlan.week_of = weekOf;

  // Validate shopping list exists
  if (!mealPlan.shopping_list || !Array.isArray(mealPlan.shopping_list) || mealPlan.shopping_list.length === 0) {
    console.warn('Shopping list missing, generating fallback');
    mealPlan.shopping_list = generateFallbackShoppingList(mealPlan);
  }

  return { ...mealPlan, budget_target: budgetTarget };
}

/**
 * Load base specification
 */
function loadBaseSpecification() {
  return `Meal Planner Specification

## ROLAND'S MEALS
- Breakfast 8:00 AM: Protein bar
- Lunch 12:30 PM: Protein bar + meal (~600 cal)
- Dinner 5:30 PM: 120-150g protein (fish/tofu) + 200-300g vegetables + healthy fat. NO carbs.
- Thursday: Early lunch 12:00 PM, NO dinner (24hr fast begins)
- Friday: Coffee only for breakfast, Late lunch 1:00 PM

## MAIA'S MEALS
- Sunday: Lunch and dinner with Roland
- Monday-Tuesday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Wednesday: Breakfast (crumpet), Lunch with Roland, At mum's for dinner
- Thursday-Saturday: No meals

## RECIPES
Include detailed recipes for Roland's lunch and dinner with:
- ing: array of ingredients with quantities
- steps: array of cooking steps

## SHOPPING LIST
Include ALL ingredients needed for the week with:
- item, quantity, category (Produce/Dairy/Proteins/Bakery/Pantry/Grains), estimated_price, aisle`;
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
 * Get next week's date info
 */
function getNextWeekDate() {
  const today = new Date();
  const nextSunday = new Date(today);
  const daysUntilSunday = today.getDay() === 0 ? 7 : 7 - today.getDay(); // Next Sunday (not today)
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  
  const nextSaturday = new Date(nextSunday);
  nextSaturday.setDate(nextSunday.getDate() + 6);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rangeStr = `${months[nextSunday.getMonth()]} ${nextSunday.getDate()} - ${months[nextSaturday.getMonth()]} ${nextSaturday.getDate()}, ${nextSunday.getFullYear()}`;
  const isoDate = `${nextSunday.getFullYear()}-${String(nextSunday.getMonth() + 1).padStart(2, '0')}-${String(nextSunday.getDate()).padStart(2, '0')}`;
  
  return { rangeStr, isoDate, year: nextSunday.getFullYear() };
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
