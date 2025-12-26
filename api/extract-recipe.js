/**
 * Extract Recipe API Endpoint
 * Extracts structured recipe data from raw text using Claude AI
 * Slice 4: Task 55 (6 subtasks)
 */

import Anthropic from '@anthropic-ai/sdk';

// Configure for Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// System prompt for recipe extraction
const EXTRACTION_SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract structured recipe data from the following text.

CRITICAL: Return ONLY valid JSON in this exact format with NO additional text or markdown:

{
  "name": "Recipe Name",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "g" | "ml" | "whole",
      "category": "produce" | "meat" | "dairy" | "pantry" | "other"
    }
  ],
  "instructions": "Clear step-by-step instructions",
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "tags": ["tag1", "tag2"]
}

Guidelines:
- Convert ALL quantities to metric (grams, milliliters, or whole items)
- If missing data, use reasonable defaults (prepTime: 15, cookTime: 20, servings: 4)
- Instructions should be clear, numbered steps
- Tags: extract cuisine type, dietary info, cooking method
- Category: classify each ingredient appropriately
- If the text is clearly not a recipe, return {"error": "NOT_A_RECIPE"}

Examples of metric conversions:
- 1 cup flour = 120g
- 1 tbsp oil = 15ml
- 1 lb chicken = 450g
- 1 cup milk = 240ml`;

/**
 * Validate extracted recipe data structure (Subtask 1)
 * @param {Object} recipe - Extracted recipe object
 * @returns {Object} Validation result {valid: boolean, message?: string}
 */
function validateExtractedRecipe(recipe) {
  // Check required fields
  if (!recipe.name || typeof recipe.name !== 'string') {
    return { valid: false, message: 'Recipe name is required and must be a string' };
  }
  
  if (recipe.name.length < 3 || recipe.name.length > 100) {
    return { valid: false, message: 'Recipe name must be 3-100 characters' };
  }
  
  // Validate ingredients
  if (!Array.isArray(recipe.ingredients)) {
    return { valid: false, message: 'Ingredients must be an array' };
  }
  
  if (recipe.ingredients.length < 1) {
    return { valid: false, message: 'At least one ingredient is required' };
  }
  
  if (recipe.ingredients.length > 30) {
    return { valid: false, message: 'Maximum 30 ingredients allowed' };
  }
  
  // Validate each ingredient
  const validUnits = ['g', 'ml', 'whole', 'kg', 'l'];
  const validCategories = ['produce', 'meat', 'dairy', 'pantry', 'other'];
  
  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i];
    
    if (!ing.name || typeof ing.name !== 'string') {
      return { valid: false, message: `Ingredient ${i + 1} must have a name` };
    }
    
    if (typeof ing.quantity !== 'number' || ing.quantity <= 0) {
      return { valid: false, message: `Ingredient ${i + 1} quantity must be a positive number` };
    }
    
    if (!validUnits.includes(ing.unit)) {
      return { valid: false, message: `Ingredient ${i + 1} unit must be one of: ${validUnits.join(', ')}` };
    }
    
    if (!validCategories.includes(ing.category)) {
      return { valid: false, message: `Ingredient ${i + 1} category must be one of: ${validCategories.join(', ')}` };
    }
  }
  
  // Validate instructions
  if (!recipe.instructions || typeof recipe.instructions !== 'string') {
    return { valid: false, message: 'Instructions are required and must be a string' };
  }
  
  if (recipe.instructions.length < 10) {
    return { valid: false, message: 'Instructions must be at least 10 characters' };
  }
  
  // Validate times and servings
  if (typeof recipe.prepTime !== 'number' || recipe.prepTime < 0) {
    return { valid: false, message: 'Prep time must be a non-negative number' };
  }
  
  if (typeof recipe.cookTime !== 'number' || recipe.cookTime < 0) {
    return { valid: false, message: 'Cook time must be a non-negative number' };
  }
  
  if (typeof recipe.servings !== 'number' || recipe.servings < 1 || recipe.servings > 20) {
    return { valid: false, message: 'Servings must be a number between 1-20' };
  }
  
  // Validate tags (optional)
  if (recipe.tags !== undefined) {
    if (!Array.isArray(recipe.tags)) {
      return { valid: false, message: 'Tags must be an array' };
    }
  }
  
  return { valid: true };
}

/**
 * Calculate confidence score for extracted recipe (Subtask 3)
 * @param {Object} recipe - Extracted recipe object
 * @returns {number} Confidence score 0-100
 */
function calculateConfidence(recipe) {
  let score = 0;
  
  // Ingredient completeness (80% weight)
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    // Base score for having ingredients
    score += 40;
    
    // Additional points for ingredient quality
    const avgIngredientQuality = recipe.ingredients.reduce((sum, ing) => {
      let ingScore = 0;
      if (ing.name && ing.name.length > 2) ingScore += 25;
      if (ing.quantity > 0) ingScore += 10;
      if (ing.unit && ing.unit.length > 0) ingScore += 5;
      return sum + ingScore;
    }, 0) / recipe.ingredients.length;
    
    score += Math.min(40, avgIngredientQuality);
  }
  
  // Presence of times and servings (10% weight)
  if (recipe.prepTime > 0) score += 3;
  if (recipe.cookTime > 0) score += 3;
  if (recipe.servings > 0) score += 4;
  
  // Instruction length and quality (5% weight)
  if (recipe.instructions) {
    const wordCount = recipe.instructions.split(/\s+/).length;
    if (wordCount >= 20) score += 3;
    if (wordCount >= 50) score += 2;
  }
  
  // Tag count (5% weight)
  if (recipe.tags && recipe.tags.length > 0) {
    score += Math.min(5, recipe.tags.length * 1.5);
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Call AI model for recipe extraction (Subtask 2)
 * @param {string} text - Raw recipe text
 * @returns {Promise<string>} AI response
 */
async function callAIModel(text) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('API key not configured');
  }
  
  const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      temperature: 0.3, // Lower temp for more consistent extraction
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract the recipe from this text:\n\n${text}`
        }
      ],
    });
    
    // Extract text from response
    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    
    throw new Error('Unexpected response format from AI');
  } catch (error) {
    console.error('AI model call failed:', error);
    throw error;
  }
}

/**
 * Main handler for the extract-recipe endpoint (Subtask 4)
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

  try {
    // Parse request body
    const body = await req.json();
    const { text } = body;
    
    // Validate input text
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Text field is required and must be a string'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (text.length < 50) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TEXT_TOO_SHORT',
          message: 'Please provide a complete recipe (at least 50 characters)'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (text.length > 5000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TEXT_TOO_LONG',
          message: 'Text is too long. Please paste one recipe at a time (max 5000 characters).'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Call AI model for extraction (Subtask 2)
    let aiResponse;
    try {
      aiResponse = await callAIModel(text);
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI_ERROR',
          message: 'Failed to connect to AI service. Please try again.'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parse AI response
    let extractedRecipe;
    try {
      // Clean response (remove markdown code fences if present)
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
      
      // Extract JSON object
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in AI response');
      }
      
      const jsonStr = cleanedResponse.substring(firstBrace, lastBrace + 1);
      extractedRecipe = JSON.parse(jsonStr);
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI response:', aiResponse.substring(0, 500));
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PARSE_ERROR',
          message: 'Failed to parse AI response. Please try with a different recipe format.'
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check if AI detected this is not a recipe
    if (extractedRecipe.error === 'NOT_A_RECIPE') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_A_RECIPE',
          message: 'This doesn\'t look like a recipe. Please check the text and try again.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validate extracted data (Subtask 1)
    const validationResult = validateExtractedRecipe(extractedRecipe);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VALIDATION_FAILED',
          message: validationResult.message,
          partialData: extractedRecipe
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Calculate confidence score (Subtask 3)
    const confidence = calculateConfidence(extractedRecipe);
    extractedRecipe.confidence = confidence;
    
    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        recipe: extractedRecipe
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    // Subtask 5: Comprehensive error handling
    console.error('Extract recipe endpoint error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}


