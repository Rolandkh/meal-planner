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
        "instructions": "Step by step instructions",
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
- Each recipe should be practical and detailed
- Include realistic estimated budget in dollars
- Consider user's dietary preferences and restrictions
- Vary recipes throughout the week
- Use common, accessible ingredients`;

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

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Build user prompt from chat history and eaters
 */
function buildUserPrompt(chatHistory, eaters) {
  // Get next Saturday as week start
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  const weekOf = nextSaturday.toISOString().split('T')[0];

  // Extract preferences from chat history
  const recentMessages = chatHistory.slice(-10);
  const conversationContext = recentMessages.length > 0
    ? `\n\nRecent conversation context:\n${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
    : '';

  // Format eater information
  const eaterInfo = eaters.map(e => 
    `- ${e.name}: ${e.preferences || 'no restrictions'}, ${e.schedule || 'home for dinner'}`
  ).join('\n');

  return `Generate a meal plan for the week starting ${weekOf}.

Household members:
${eaterInfo}

${conversationContext}

Please create a complete 7-day meal plan with breakfast, lunch, and dinner for each day. Output ONLY the JSON structure specified in the system prompt, with no additional text.`;
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

    const { chatHistory = [], eaters = [] } = body;

    // Use default eater if none provided
    const finalEaters = eaters.length > 0 ? eaters : [DEFAULT_EATER];

    // Build user prompt
    const userPrompt = buildUserPrompt(chatHistory, finalEaters);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Create abort controller for 60s timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 60000);

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
            max_tokens: 4096,
            temperature: 1,
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
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error('No valid JSON found in response');
            }
            parsedData = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('Failed to parse Claude response:', parseError);
            console.error('Raw response:', accumulatedText.substring(0, 500));
            throw new Error('Failed to parse meal plan data');
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
