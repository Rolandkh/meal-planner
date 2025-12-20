/**
 * Chat with Vanessa API Endpoint
 * Streams responses from Claude AI using Server-Sent Events
 */

import Anthropic from '@anthropic-ai/sdk';

// Configure for Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// System prompt for Vanessa
const SYSTEM_PROMPT = `You are Vanessa, a friendly and helpful AI meal planning concierge.

Your personality:
- Warm, conversational, and personable
- Knowledgeable about nutrition, cooking, and meal planning
- Patient and encouraging
- Concise but thorough (aim for 2-4 sentences unless more detail is requested)

Your capabilities:
- Help users think through their meal planning needs
- Provide recipe ideas and suggestions
- Offer nutrition guidance
- Answer questions about cooking and ingredients
- Discuss dietary preferences and restrictions

Current limitations:
- You cannot yet generate complete weekly meal plans (that feature is coming in Slice 2)
- You're currently in conversation mode to help users explore their needs

Always be helpful, friendly, and focused on the user's meal planning journey.`;

/**
 * Main handler for the chat endpoint
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
    const { message, chatHistory = [] } = body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a non-empty string' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate chat history
    if (!Array.isArray(chatHistory)) {
      return new Response(
        JSON.stringify({ error: 'chatHistory must be an array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Format messages for Claude API
    const messages = chatHistory
      .filter(msg => msg.role && msg.content) // Filter out invalid messages
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Add the new user message
    messages.push({
      role: 'user',
      content: message.trim(),
    });

    console.log(`Processing chat request with ${messages.length} messages`);

    // Set up SSE response stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming response in background with timeout
    (async () => {
      let timeoutId;
      
      try {
        // Set up timeout (30 seconds)
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Request timed out after 30 seconds'));
          }, 30000);
        });

        // Create streaming request to Claude
        const streamPromise = (async () => {
          const streamResponse = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            system: SYSTEM_PROMPT,
            messages,
            max_tokens: 1000,
            temperature: 0.7,
          });

          // Process the stream
          for await (const event of streamResponse) {
            // Handle content deltas (the actual text)
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const data = JSON.stringify({
                type: 'token',
                content: event.delta.text,
              });
              await writer.write(encoder.encode(`data: ${data}\n\n`));
            }
            
            // Handle message completion
            if (event.type === 'message_stop') {
              console.log('Stream completed successfully');
            }

            // Handle errors in stream
            if (event.type === 'error') {
              throw new Error(event.error?.message || 'Stream error');
            }
          }
        })();

        // Race between stream and timeout
        await Promise.race([streamPromise, timeoutPromise]);

        // Clear timeout if stream completes
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Send completion signal
        const doneData = JSON.stringify({ type: 'done' });
        await writer.write(encoder.encode(`data: ${doneData}\n\n`));

      } catch (error) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.error('Streaming error:', error);
        
        // Determine error type and message
        let errorMessage = 'An error occurred during streaming';
        
        if (error.message?.includes('timed out')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message?.includes('rate_limit')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message?.includes('overloaded')) {
          errorMessage = 'Service is busy. Please try again in a moment.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication failed. Please contact support.';
        } else if (error.status === 429) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        // Send error to client
        const errorData = JSON.stringify({
          type: 'error',
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
        await writer.write(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error('Error closing writer:', closeError);
        }
      }
    })();

    // Return SSE stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for streaming
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

