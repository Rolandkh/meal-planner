/**
 * Vercel Serverless Function
 * Proxies requests to Claude API with server-side API key
 * This keeps the API key secure and never exposes it to the client
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable (set in Vercel dashboard)
  // Try both possible variable names (Vercel sometimes uses different casing)
  const apiKey = (process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key || process.env.Anthropic_Api_Key)?.trim();

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set or is empty');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('anthropic')));
    return res.status(500).json({ 
      error: 'API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables and redeploy. Visit /api/check-env to verify.' 
    });
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-ant-')) {
    console.error('API key format is invalid (should start with sk-ant-)');
    console.error('Key starts with:', apiKey.substring(0, 10));
    return res.status(500).json({ 
      error: `Invalid API key format. The key should start with "sk-ant-". Found: "${apiKey.substring(0, 10)}...". Please check your Vercel environment variable.` 
    });
  }

  // Log key info (first 10 and last 4 chars only for security)
  console.log('Using API key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));

  try {
    const { userPrompt, budgetTarget, store, feedbackHistory } = req.body;

    // Load base specification
    const baseSpec = await loadBaseSpecification();

    // Build feedback summary
    const feedbackSummary = buildFeedbackSummary(feedbackHistory || []);

    // Construct the system prompt
    const systemPrompt = `${baseSpec}

${feedbackSummary ? `\n## FEEDBACK HISTORY\n${feedbackSummary}\n` : ''}

Generate a meal plan following the specification above. Return ONLY valid JSON matching the structure below. Do not include any markdown formatting or code blocks.

CRITICAL JSON REQUIREMENTS:
1. All strings in the JSON must be properly escaped. Use \\" for quotes inside string values.
2. All property values must be followed by commas (except the last property in an object).
3. All arrays and objects must be properly closed with ] and }.
4. No trailing commas before closing brackets or braces.
5. The JSON must be completely valid and parseable - test it mentally before returning.
6. Double-check that every opening { has a closing } and every opening [ has a closing ].`;

    // Construct the user prompt
    const userMessage = `Generate a meal plan for the week of ${getNextWeekDate()}.

User preferences for this week:
${userPrompt || 'No specific preferences provided.'}

Constraints:
- Budget: $${budgetTarget} max
- Store: ${store === 'coles-caulfield' ? 'Coles Caulfield Village (Store ID: 7724)' : 'Woolworths Carnegie North'}

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid, parseable JSON
- All string values must have quotes properly escaped (use \\" for quotes inside strings)
- No unescaped newlines in string values (use \\n)
- No trailing commas
- All brackets and braces must be properly closed
- The JSON must be complete and valid - test it mentally before returning

Output required (JSON format):
{
  "week_of": "YYYY-MM-DD",
  "roland_meals": {
    "sunday": {
      "breakfast": {"name": "...", "time": "8:00 AM"},
      "lunch": {"name": "...", "time": "12:30 PM"},
      "dinner": {"name": "...", "time": "5:30 PM"},
      "recipes": [
        {
          "name": "Meal Name",
          "ing": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
          "steps": ["step 1", "step 2", ...]
        }
      ]
    },
    ...
  },
  "maia_meals": {
    "sunday": {
      "lunch": {"name": "...", "time": "12:30 PM"},
      "dinner": {"name": "...", "time": "5:30 PM"}
    },
    ...
  },
  "shopping_list": [
    {"item": "Item name", "quantity": "amount", "category": "Produce|Dairy|Proteins|etc", "estimated_price": 0.00, "aisle": 1}
  ],
  "prep_tasks": {
    "sunday": {
      "roland": {"morning": ["task 1", "task 2"], "evening": ["task 1", "task 2"]},
      "maia": {"morning": ["task 1"], "evening": ["task 1"]}
    },
    ...
  },
  "budget_estimate": 0.00,
  "notes": "..."
}

IMPORTANT:
- Include detailed recipes for Roland's meals (lunch and dinner) with ingredients (ing array) and steps (steps array)
- Shopping list should be a flat array with each item having: item, quantity, category, estimated_price, and aisle
- Prep tasks should be specific and actionable
- Ensure all meals follow the Diet Compass protocol and Maia's preferences

FINAL CHECK BEFORE RETURNING:
1. Verify every property has a comma after its value (except the last one in each object/array)
2. Verify all strings are properly quoted and escaped
3. Verify all brackets [ ] and braces { } are properly matched and closed
4. Verify there are no trailing commas
5. The JSON must parse successfully - if you're unsure, simplify the content rather than risk invalid JSON`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: { message: await response.text() } };
      }
      
      console.error('Claude API error response:', JSON.stringify(errorData, null, 2));
      console.error('Status:', response.status);
      console.error('Status text:', response.statusText);
      
      // Extract error message properly - Anthropic API error format
      let errorMessage = 'Unknown error';
      
      // Anthropic API returns errors in format: { error: { type: "...", message: "..." } }
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error.type) {
          errorMessage = `${errorData.error.type}: ${errorData.error.message || JSON.stringify(errorData.error)}`;
        } else {
          errorMessage = JSON.stringify(errorData.error);
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.type) {
        errorMessage = `${errorData.type}: ${errorData.message || ''}`;
      } else {
        // Show full error for debugging
        errorMessage = `API error (${response.status}): ${JSON.stringify(errorData)}`;
      }
      
      // Provide more helpful error messages
      if (errorMessage.includes('invalid x-api-key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
        errorMessage = 'Invalid API key. Please check that ANTHROPIC_API_KEY is set correctly in Vercel environment variables. Make sure there are no extra spaces or characters.';
      } else if (errorMessage.includes('model') || errorMessage.includes('invalid')) {
        errorMessage = `Claude API error: ${errorMessage}. Please check the model name and API version.`;
      }
      
      return res.status(response.status).json({ 
        error: errorMessage 
      });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    let jsonText = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json\n?/i, '').replace(/```\s*$/i, '').trim();
    }
    
    // Remove any leading/trailing text that's not JSON
    // Look for the first { and last } to extract just the JSON object
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    // Log the extracted JSON length for debugging
    console.log('Extracted JSON length:', jsonText.length);

    let mealPlan;
    try {
      mealPlan = JSON.parse(jsonText);
    } catch (parseError) {
      // Log the problematic JSON for debugging
      console.error('JSON parse error:', parseError.message);
      const positionMatch = parseError.message.match(/position (\d+)/);
      const position = positionMatch ? parseInt(positionMatch[1]) : null;
      
      console.error('JSON length:', jsonText.length);
      if (position !== null) {
        console.error('Error at position:', position);
        const start = Math.max(0, position - 300);
        const end = Math.min(jsonText.length, position + 300);
        const context = jsonText.substring(start, end);
        console.error('Context around error (characters', start, 'to', end, '):');
        console.error(context);
        console.error('Character at error position:', JSON.stringify(jsonText[position]));
        
        // Try to find the line number
        const beforeError = jsonText.substring(0, position);
        const lineNumber = (beforeError.match(/\n/g) || []).length + 1;
        const columnNumber = position - beforeError.lastIndexOf('\n');
        console.error('Approximate line:', lineNumber, 'column:', columnNumber);
      }
      
      // Log a sample of the JSON to help identify the issue
      console.error('First 500 characters:', jsonText.substring(0, 500));
      console.error('Last 500 characters:', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // Try to repair common JSON issues
      let fixedJson = attemptJsonRepair(jsonText, parseError, position);
      
      try {
        mealPlan = JSON.parse(fixedJson);
        console.log('Successfully parsed JSON after repair attempt');
      } catch (repairError) {
        // If repair didn't work, throw the original error with context
        const errorMsg = `Failed to parse JSON response from Claude: ${parseError.message}. ` +
          `The AI response contains invalid JSON. Please try generating the meal plan again. ` +
          `If the issue persists, check the server logs for more details.`;
        throw new Error(errorMsg);
      }
    }

    // Return the meal plan
    return res.status(200).json({
      ...mealPlan,
      budget_target: budgetTarget
    });

  } catch (error) {
    console.error('Claude API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
      apiKeyLength: process.env.ANTHROPIC_API_KEY?.length
    });
    
    return res.status(500).json({ 
      error: error.message || 'Failed to generate meal plan. Check server logs for details.' 
    });
  }
}

/**
 * Load base specification
 */
async function loadBaseSpecification() {
  // Return key parts of the spec with detailed requirements
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
function attemptJsonRepair(jsonText, parseError, errorPosition) {
  let fixed = jsonText;
  let repairs = [];
  
  // Fix 1: Remove trailing commas before closing brackets/braces
  const trailingCommaMatches = fixed.match(/,(\s*[}\]])/g);
  if (trailingCommaMatches) {
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    repairs.push('Removed trailing commas');
  }
  
  // Fix 2: Remove comments (single line and multi-line)
  const commentMatches = fixed.match(/\/\/.*$|\/\*[\s\S]*?\*\//g);
  if (commentMatches) {
    fixed = fixed.replace(/\/\/.*$/gm, ''); // Single line comments
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
    repairs.push('Removed comments');
  }
  
  // Fix 3: Remove any control characters that might break JSON
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Fix 4: If error mentions missing comma or closing brace, try to fix it
  if ((parseError.message.includes("Expected ','") || parseError.message.includes("Expected '}'")) && errorPosition !== null) {
    // Look at context around the error - expand the search area
    const contextStart = Math.max(0, errorPosition - 200);
    const contextEnd = Math.min(fixed.length, errorPosition + 200);
    const context = fixed.substring(contextStart, contextEnd);
    const relativeErrorPos = errorPosition - contextStart;
    
    console.log('Context around error:', context);
    console.log('Relative error position in context:', relativeErrorPos);
    
    // Try multiple patterns to find where the comma/brace is missing
    
    // Pattern 1: String value followed by closing brace/bracket without comma
    // Look backwards from error position for: "value" } or "value" ]
    let searchStart = Math.max(0, relativeErrorPos - 50);
    let searchEnd = Math.min(context.length, relativeErrorPos + 10);
    let searchContext = context.substring(searchStart, searchEnd);
    
    // Look for pattern: "..." } or "..." ] (missing comma)
    const missingCommaAfterString = /("(?:[^"\\]|\\.)*")\s*([}\]])/;
    let match = searchContext.match(missingCommaAfterString);
    if (match) {
      const matchStart = contextStart + searchStart + searchContext.indexOf(match[0]);
      const insertPos = matchStart + match[1].length;
      fixed = fixed.substring(0, insertPos) + ',' + fixed.substring(insertPos);
      repairs.push('Added missing comma after string value');
      return fixed; // Return early since we made a fix
    }
    
    // Pattern 2: Number or boolean/null value followed by closing brace/bracket
    const missingCommaAfterValue = /([\d\w]+)\s*([}\]])/;
    match = searchContext.match(missingCommaAfterValue);
    if (match && (match[1] === 'true' || match[1] === 'false' || match[1] === 'null' || /^\d+$/.test(match[1]))) {
      const matchStart = contextStart + searchStart + searchContext.indexOf(match[0]);
      const insertPos = matchStart + match[1].length;
      fixed = fixed.substring(0, insertPos) + ',' + fixed.substring(insertPos);
      repairs.push('Added missing comma after value');
      return fixed;
    }
    
    // Pattern 3: Property value followed by another property without comma
    const missingCommaBetweenProps = /(["\}\]\]])\s*"([^"]+)":/;
    match = searchContext.match(missingCommaBetweenProps);
    if (match) {
      const matchStart = contextStart + searchStart + searchContext.indexOf(match[0]);
      const insertPos = matchStart + match[1].length;
      fixed = fixed.substring(0, insertPos) + ',' + fixed.substring(insertPos);
      repairs.push('Added missing comma between properties');
      return fixed;
    }
    
    // Pattern 4: Array element followed by closing bracket without comma
    const missingCommaInArray = /(["\d\]\]])\s*(\])/;
    match = searchContext.match(missingCommaInArray);
    if (match) {
      const matchStart = contextStart + searchStart + searchContext.indexOf(match[0]);
      const insertPos = matchStart + match[1].length;
      fixed = fixed.substring(0, insertPos) + ',' + fixed.substring(insertPos);
      repairs.push('Added missing comma in array');
      return fixed;
    }
    
    // Pattern 5: If error says "Expected '}'", maybe there's a missing closing brace
    if (parseError.message.includes("Expected '}'")) {
      // Count braces up to error position
      const beforeError = fixed.substring(0, errorPosition);
      const openCount = (beforeError.match(/{/g) || []).length;
      const closeCount = (beforeError.match(/}/g) || []).length;
      if (openCount > closeCount) {
        // Try to insert closing brace at error position
        fixed = fixed.substring(0, errorPosition) + '}' + fixed.substring(errorPosition);
        repairs.push('Added missing closing brace');
        return fixed;
      }
    }
  }
  
  // Fix 5: Ensure proper closing of brackets/braces
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  // Add missing closing braces
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
    repairs.push(`Added ${openBraces - closeBraces} missing closing braces`);
  }
  
  // Add missing closing brackets
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
    repairs.push(`Added ${openBrackets - closeBrackets} missing closing brackets`);
  }
  
  if (repairs.length > 0) {
    console.log('JSON repair attempts:', repairs.join(', '));
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
