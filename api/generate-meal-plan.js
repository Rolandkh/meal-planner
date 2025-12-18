/**
 * Vercel Edge Function
 * Proxies requests to Claude API with streaming support
 * Returns real-time progress via Server-Sent Events
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get API key from environment variable
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return new Response(JSON.stringify({ 
      error: 'Invalid API key format. The key should start with "sk-ant-".' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { userPrompt, budgetTarget, store, feedbackHistory, stream: wantStream } = body;

    const baseSpec = loadBaseSpecification();
    const feedbackSummary = buildFeedbackSummary(feedbackHistory || []);

    const systemPrompt = `${baseSpec}
${feedbackSummary ? `\n## FEEDBACK HISTORY\n${feedbackSummary}` : ''}

Generate a meal plan. Return ONLY valid JSON. No markdown. Escape quotes with \\".`;

    const userMessage = `Week: ${getNextWeekDate()}
Budget: $${budgetTarget} | Store: ${store === 'coles-caulfield' ? 'Coles Caulfield' : 'Woolworths Carnegie'}
${userPrompt ? `Preferences: ${userPrompt}` : ''}

Return JSON with this EXACT structure:
{
  "week_of": "YYYY-MM-DD",
  "shopping_list": [{"item": "name", "quantity": "amount", "category": "Produce|Dairy|Proteins|Grains|Pantry|Bakery", "estimated_price": 0.00, "aisle": 1}],
  "roland_meals": {
    "sunday": {"breakfast": {"name": "...", "time": "8:00 AM"}, "lunch": {"name": "...", "time": "12:30 PM"}, "dinner": {"name": "...", "time": "5:30 PM"}, "recipes": [{"name": "...", "ing": ["item qty"], "steps": ["step"]}]},
    "monday": {...}, "tuesday": {...}, "wednesday": {...}, "thursday": {...}, "friday": {...}, "saturday": {...}
  },
  "maia_meals": {"sunday": {"lunch": {...}, "dinner": {...}}, "monday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}}, ...},
  "prep_tasks": {"sunday": {"roland": {"morning": [], "evening": []}, "maia": {"morning": [], "evening": []}}, ...},
  "budget_estimate": 0.00,
  "notes": ""
}

CRITICAL REQUIREMENTS:
1. Plan all meals first, then compile a COMPLETE shopping_list with 25-40 items
2. The shopping_list MUST include every ingredient needed for all meals
3. Include recipes with ing[] and steps[] for Roland's lunch/dinner
4. Thursday: early lunch 12PM, NO dinner (fast day)
5. Friday: coffee only breakfast, late lunch 1PM
6. DO NOT truncate or skip the shopping_list - it is essential`;

    // Call Claude API with streaming
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
        stream: true,
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
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If client wants streaming, return SSE stream
    if (wantStream) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Estimated total characters for a typical meal plan response
      const ESTIMATED_TOTAL_CHARS = 14000;
      
      // Section markers to detect progress
      const sectionMarkers = [
        { key: 'shopping_list', label: 'Shopping list' },
        { key: '"sunday"', label: 'Sunday meals', day: true },
        { key: '"monday"', label: 'Monday meals', day: true },
        { key: '"tuesday"', label: 'Tuesday meals', day: true },
        { key: '"wednesday"', label: 'Wednesday meals', day: true },
        { key: '"thursday"', label: 'Thursday meals', day: true },
        { key: '"friday"', label: 'Friday meals', day: true },
        { key: '"saturday"', label: 'Saturday meals', day: true },
        { key: 'maia_meals', label: 'Maia\'s meals' },
        { key: 'prep_tasks', label: 'Prep tasks' },
        { key: 'budget_estimate', label: 'Finalizing' }
      ];
      
      let fullContent = '';
      let detectedSections = new Set();
      let currentSection = 'Starting generation...';
      
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      fullContent += parsed.delta.text;
                      
                      // Detect which section we're in
                      for (const marker of sectionMarkers) {
                        if (!detectedSections.has(marker.key) && fullContent.includes(marker.key)) {
                          detectedSections.add(marker.key);
                          currentSection = marker.label;
                        }
                      }
                      
                      // Calculate progress based on character count
                      const percent = Math.min(95, Math.round((fullContent.length / ESTIMATED_TOTAL_CHARS) * 100));
                      
                      // Send progress update
                      const progressData = JSON.stringify({
                        type: 'progress',
                        percent,
                        chars: fullContent.length,
                        section: currentSection
                      });
                      controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                    }
                  } catch (e) {
                    // Skip unparseable lines
                  }
                }
              }
            }
            
            // Parse and validate the final response
            const mealPlan = parseAndValidateMealPlan(fullContent, budgetTarget);
            
            // Send complete message
            const completeData = JSON.stringify({
              type: 'complete',
              data: mealPlan
            });
            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
            controller.close();
            
          } catch (error) {
            const errorData = JSON.stringify({
              type: 'error',
              error: error.message
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }
    
    // Non-streaming: collect full response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullContent += parsed.delta.text;
            }
          } catch (e) {
            // Skip unparseable lines
          }
        }
      }
    }
    
    const mealPlan = parseAndValidateMealPlan(fullContent, budgetTarget);
    return new Response(JSON.stringify(mealPlan), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Claude API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate meal plan.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Parse and validate the meal plan JSON
 */
function parseAndValidateMealPlan(content, budgetTarget) {
  let jsonText = content.trim();
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```json\n?/i, '').replace(/```\s*$/i, '').trim();
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
    // Try to repair common JSON issues
    const fixedJson = attemptJsonRepair(jsonText);
    mealPlan = JSON.parse(fixedJson);
  }

  // Validate shopping list exists
  if (!mealPlan.shopping_list || !Array.isArray(mealPlan.shopping_list) || mealPlan.shopping_list.length === 0) {
    mealPlan.shopping_list = generateFallbackShoppingList(mealPlan);
  }

  return { ...mealPlan, budget_target: budgetTarget };
}

/**
 * Load base specification
 */
function loadBaseSpecification() {
  return `Meal Planner App Specification

## ROLAND'S MEAL PLAN

### Schedule
- Sunday-Saturday: Breakfast 8:00 AM, Lunch 12:30 PM, Dinner 5:30 PM
- Thursday: Early lunch at 12:00 PM, NO DINNER (fast begins)
- Friday: Coffee only for breakfast, Late lunch at 1:00 PM, Dinner 5:30 PM

### Meal Requirements
- Breakfast: Protein bar (280-300 cal)
- Lunch: Protein bar + ~600 cal meal (880-900 cal total). Options: Hummus Power Bowl, Lentil Soup, Whole Grain Wrap, Buddha Bowl, Chickpea Salad, Vegetable Soup & Grain
- Dinner: 120-150g protein (fish/tofu/tempeh) + 200-300g vegetables + healthy fat. NO carbohydrates (no rice, bread, pasta, potatoes). Fish 3-4x/week, plant-based 2-3x/week

### Daily Targets
- Calories: 1,490-1,540
- Protein: 60-75g
- Fats: 60-70g (healthy sources)
- Carbs: 150-180g (whole grains only)
- Fiber: 35-45g
- Omega-3: 5.5-7g

## MAIA'S MEAL PLAN

### Schedule
- Sunday: Lunch and dinner with Roland
- Monday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Tuesday: Breakfast (crumpet), Packed lunch, Dinner with Roland
- Wednesday: Breakfast (crumpet), Lunch with Roland, At mum's for dinner
- Thursday-Saturday: No meals scheduled

### Meal Requirements
- Breakfast: Crumpet (simple, consistent)
- Packed Lunch (Mon/Tue): Finger-food friendly - fruit (strawberries, blueberries), crackers, yogurt pouch, cheese cubes or hummus cup, carrot sticks, cucumber. Sometimes: sandwich, pasta salad, leftovers
- Shared Meals: Likes pick-up/finger foods, pasta, olives, hummus, carrots, plain foods, fruit. Avoid: spicy foods, complex flavors, anything too "mixed together"

## RECIPES REQUIREMENT
For Roland's lunch and dinner meals, you MUST include detailed recipes with:
- Recipe name matching the meal name
- Ingredients array (ing) with quantities: ["120g salmon fillet", "200g broccoli", "15ml olive oil", ...]
- Steps array (steps) with clear cooking instructions: ["Heat olive oil in pan", "Cook salmon 4-5 min per side", ...]

## SHOPPING LIST REQUIREMENT
Shopping list must be a flat array format:
[
  {"item": "Salmon fillet", "quantity": "300g", "category": "Proteins", "estimated_price": 12.00, "aisle": 4},
  {"item": "Broccoli", "quantity": "500g", "category": "Produce", "estimated_price": 4.50, "aisle": 1},
  ...
]

Categories: Produce, Dairy, Proteins, Bakery, Pantry, Grains, etc.

## INGREDIENT EFFICIENCY
Maximize shared ingredients between Roland and Maia's meals to minimize waste and shopping costs.`;
}

/**
 * Build feedback summary
 */
function buildFeedbackSummary(feedbackHistory) {
  if (!feedbackHistory || feedbackHistory.length === 0) {
    return null;
  }

  const loved = [];
  const didntWork = [];
  const notes = [];

  feedbackHistory.forEach(feedback => {
    if (feedback.loved) loved.push(feedback.loved);
    if (feedback.didntWork) didntWork.push(feedback.didntWork);
    if (feedback.notes) notes.push(feedback.notes);
  });

  let summary = '';
  if (loved.length > 0) {
    summary += `Loved meals: ${loved.join(', ')}\n`;
  }
  if (didntWork.length > 0) {
    summary += `Didn't work: ${didntWork.join(', ')}\n`;
  }
  if (notes.length > 0) {
    summary += `Notes: ${notes.join(' ')}\n`;
  }

  return summary || null;
}

/**
 * Attempt to repair common JSON issues
 */
function attemptJsonRepair(jsonText) {
  let fixed = jsonText;
  
  // Fix 1: Remove trailing commas before closing brackets/braces
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix 2: Remove comments
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Fix 3: Remove control characters
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Fix 4: Ensure proper closing of brackets/braces
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
  }
  
  return fixed;
}

/**
 * Get next week's date range
 */
function getNextWeekDate() {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()));
  
  const nextSaturday = new Date(nextSunday);
  nextSaturday.setDate(nextSunday.getDate() + 6);
  
  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  return `${formatDate(nextSunday)} - ${formatDate(nextSaturday)}, ${nextSunday.getFullYear()}`;
}

/**
 * Generate a fallback shopping list by extracting ingredients from recipes
 */
function generateFallbackShoppingList(mealPlan) {
  const ingredients = new Map();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  days.forEach(day => {
    const rolandDay = mealPlan.roland_meals?.[day];
    if (rolandDay?.recipes && Array.isArray(rolandDay.recipes)) {
      rolandDay.recipes.forEach(recipe => {
        if (recipe.ing && Array.isArray(recipe.ing)) {
          recipe.ing.forEach(ing => {
            if (ing && !ingredients.has(ing.toLowerCase())) {
              ingredients.set(ing.toLowerCase(), {
                item: ing,
                quantity: '1',
                category: guessCategoryFromIngredient(ing),
                estimated_price: 5.00,
                aisle: guessAisleFromIngredient(ing)
              });
            }
          });
        }
      });
    }
  });
  
  return Array.from(ingredients.values());
}

/**
 * Guess category from ingredient name
 */
function guessCategoryFromIngredient(ing) {
  const ingLower = ing.toLowerCase();
  if (ingLower.includes('salmon') || ingLower.includes('tuna') || ingLower.includes('fish') || 
      ingLower.includes('tofu') || ingLower.includes('tempeh') || ingLower.includes('protein')) {
    return 'Proteins';
  }
  if (ingLower.includes('milk') || ingLower.includes('yogurt') || ingLower.includes('cheese') || 
      ingLower.includes('kefir') || ingLower.includes('cream')) {
    return 'Dairy';
  }
  if (ingLower.includes('spinach') || ingLower.includes('kale') || ingLower.includes('broccoli') || 
      ingLower.includes('carrot') || ingLower.includes('tomato') || ingLower.includes('salad') ||
      ingLower.includes('vegetable') || ingLower.includes('avocado') || ingLower.includes('lemon')) {
    return 'Produce';
  }
  if (ingLower.includes('rice') || ingLower.includes('quinoa') || ingLower.includes('bread') || 
      ingLower.includes('oat') || ingLower.includes('grain')) {
    return 'Grains';
  }
  return 'Pantry';
}

/**
 * Guess aisle from ingredient name
 */
function guessAisleFromIngredient(ing) {
  const category = guessCategoryFromIngredient(ing);
  const aisleMap = { 'Produce': 1, 'Bakery': 2, 'Dairy': 3, 'Proteins': 4, 'Grains': 5, 'Pantry': 5 };
  return aisleMap[category] || 5;
}
