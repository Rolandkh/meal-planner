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
        "ingredients": [
          {
            "name": "ingredient name",
            "quantity": number,
            "unit": "unit",
            "category": "produce|meat|dairy|pantry|other"
          }
        ],
        "instructions": "Brief instructions (2-3 sentences max)",
        "prepTime": number,
        "cookTime": number,
        "servings": number,
        "tags": ["tag1", "tag2"]
      },
      "lunch": { /* same structure */ },
      "dinner": { /* same structure */ }
    }
  ]
}

Guidelines:
- Generate exactly 7 days of meals (21 total: breakfast, lunch, dinner each day)
- Keep instructions BRIEF (2-3 sentences max per recipe)
- Include realistic estimated budget in dollars
- Consider user's dietary preferences and restrictions
- Vary recipes throughout the week
- Use 3-6 main ingredients per recipe (keep it simple)
- Focus on practical, quick recipes

RECIPE SELECTION STRATEGY (Slice 5):
- The user has a LOCAL CATALOG of 607 professionally-tested recipes with health scores
- PREFER selecting recipes from common cuisines that are likely in the catalog: Italian, Mexican, Chinese, Indian, Thai, Mediterranean, American
- PREFER recipes that match common dietary patterns: vegetarian, vegan, gluten-free, keto
- Examples of catalog-style recipes: "Chicken Tikka Masala", "Spaghetti Carbonara", "Greek Salad", "Vegetable Stir Fry", "Lentil Soup"
- When creating recipes, use SIMPLE, COMMON recipe names that might exist in a standard recipe database
- Avoid overly creative or unique recipe names - stick to classics and standards
- The system will match your recipes to the catalog when possible to use pre-scored health data

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
- Examples: "200g chicken breast", "500ml milk", "2 whole tomatoes", "100g rice"`;

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

  // Validate eaters
  if (body.eaters !== undefined) {
    if (!Array.isArray(body.eaters)) {
      errors.push('eaters must be an array');
    } else if (body.eaters.length > 0) {
      body.eaters.forEach((eater, i) => {
        if (typeof eater !== 'object' || eater === null) {
          errors.push(`eater[${i}] must be an object`);
        }
      });
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
 * Build user prompt from chat history, eaters, and optional structured schedule
 * Slice 4: Enhanced to support single-day regeneration
 */
function buildUserPrompt(chatHistory, eaters, baseSpec = null, regenerateDay = null, dateForDay = null, existingMeals = []) {
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

  // Format eater information with allergies and restrictions
  const eaterInfo = eaters.map(eater => {
    let info = `- ${eater.name}: ${eater.preferences || 'No specific preferences'}`;
    
    // Add allergies (CRITICAL - must be avoided)
    if (eater.allergies && eater.allergies.length > 0) {
      info += `\n  ⚠️  ALLERGIES (MUST AVOID): ${eater.allergies.join(', ')}`;
    }
    
    // Add dietary restrictions
    if (eater.dietaryRestrictions && eater.dietaryRestrictions.length > 0) {
      info += `\n  Dietary restrictions: ${eater.dietaryRestrictions.join(', ')}`;
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
  const maxItems = baseSpec?.maxShoppingListItems || 30;
  
  ingredientConstraint = `\n\nCRITICAL - INGREDIENT LIMIT:
The shopping list must have NO MORE THAN ${maxItems} unique ingredients total across all 21 meals.

To achieve this:
- REUSE ingredients across multiple meals (e.g., use salmon 3 times instead of salmon, cod, tuna, sardines, mackerel)
- Choose recipes with overlapping ingredients
- Use pantry staples (olive oil, salt, pepper, etc.) across many meals
- Limit variety in proteins (pick 2-3 fish types, not 5)
- Reuse vegetables (if you use zucchini Monday, use it again Wednesday)

This constraint is CRITICAL for keeping shopping simple and costs down.`;

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
${avoidDuplication}

If the user specified constraints in the conversation (like "simple recipes", "meal prep on Saturday", etc.), FOLLOW THOSE CONSTRAINTS STRICTLY.

Output ONLY the JSON structure specified in the system prompt. Since this is a single-day regeneration, include ONLY ONE day in the "days" array (${dateForDay}).`;
  }
  
  // Full week generation (default)
  return `Generate a meal plan for the week starting ${weekOf}.

Household members:
${eaterInfo}
${conversationContext}
${scheduleRequirements}
${ingredientConstraint}

Create a complete 7-day meal plan with breakfast, lunch, and dinner for each day. 

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
      regenerateDay = null,
      dateForDay = null,
      existingMeals = []
    } = body;

    // Use default eater if none provided
    const finalEaters = eaters.length > 0 ? eaters : [DEFAULT_EATER];

    // Build user prompt (with optional baseSpecification for structured schedule)
    // Slice 4: Include regeneration parameters
    const userPrompt = buildUserPrompt(
      chatHistory, 
      finalEaters, 
      baseSpecification,
      regenerateDay,
      dateForDay,
      existingMeals
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
            max_tokens: 8192,
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
