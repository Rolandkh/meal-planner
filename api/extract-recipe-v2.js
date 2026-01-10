/**
 * Extract Recipe API Endpoint - Version 2 with Normalization
 * 
 * Enhanced recipe extraction with:
 * - Ingredient normalization to master catalog
 * - User review for unmatched ingredients
 * - Instruction enhancement with quantities
 * - Standardized formatting
 * 
 * This is the integrated version that combines all pipeline components.
 */

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Enhanced extraction prompt that requests more detail
const EXTRACTION_SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract structured recipe data from the following text.

CRITICAL: Return ONLY valid JSON in this exact format with NO additional text or markdown:

{
  "name": "Recipe Name",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "g" | "ml" | "whole" | "cup" | "tbsp" | "tsp",
      "category": "produce" | "meat" | "dairy" | "pantry" | "other",
      "preparation": "optional preparation note (chopped, diced, etc.)"
    }
  ],
  "instructions": "Clear step-by-step instructions (can be multi-line)",
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "tags": ["tag1", "tag2"],
  "cuisine": "cuisine type",
  "difficulty": "easy" | "medium" | "hard"
}

Guidelines:
- Keep original units when possible (cup, tbsp, tsp, g, ml, etc.) - normalization will handle conversion
- Preserve ingredient names as written (e.g., "garlic cloves" not just "garlic")
- Include preparation in separate field (e.g., "diced", "chopped")
- Instructions can be paragraph or numbered format - keep original structure
- If missing data, use reasonable defaults
- Tags: extract cuisine type, dietary info, cooking method
- Category: classify each ingredient appropriately
- If not a recipe, return {"error": "NOT_A_RECIPE"}`;

/**
 * Validate extracted recipe
 */
function validateExtractedRecipe(recipe) {
  if (!recipe.name || typeof recipe.name !== 'string') {
    return { valid: false, message: 'Recipe name is required' };
  }
  
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 1) {
    return { valid: false, message: 'At least one ingredient is required' };
  }
  
  if (!recipe.instructions || typeof recipe.instructions !== 'string' || recipe.instructions.length < 10) {
    return { valid: false, message: 'Instructions are required (min 10 characters)' };
  }
  
  return { valid: true };
}

/**
 * Calculate confidence score
 */
function calculateConfidence(recipe) {
  let score = 0;
  
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    score += 40;
    const avgQuality = recipe.ingredients.reduce((sum, ing) => {
      let ingScore = 0;
      if (ing.name && ing.name.length > 2) ingScore += 25;
      if (ing.quantity > 0) ingScore += 10;
      if (ing.unit) ingScore += 5;
      return sum + ingScore;
    }, 0) / recipe.ingredients.length;
    score += Math.min(40, avgQuality);
  }
  
  if (recipe.prepTime > 0) score += 3;
  if (recipe.cookTime > 0) score += 3;
  if (recipe.servings > 0) score += 4;
  if (recipe.instructions) {
    const wordCount = recipe.instructions.split(/\s+/).length;
    if (wordCount >= 20) score += 3;
    if (wordCount >= 50) score += 2;
  }
  if (recipe.tags && recipe.tags.length > 0) {
    score += Math.min(5, recipe.tags.length * 1.5);
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Call AI model for extraction
 */
async function callAIModel(text) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('API key not configured');
  }
  
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.3,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Extract the recipe from this text:\n\n${text}`
    }],
  });
  
  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  
  throw new Error('Unexpected response format from AI');
}

/**
 * Main handler - Step 1: Extract only (normalization happens client-side)
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { text } = body;
    
    // Validate input
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Text field is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (text.length < 50) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TEXT_TOO_SHORT',
          message: 'Please provide a complete recipe (at least 50 characters)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (text.length > 5000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TEXT_TOO_LONG',
          message: 'Text too long (max 5000 characters)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract recipe
    let aiResponse;
    try {
      aiResponse = await callAIModel(text);
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI_ERROR',
          message: 'Failed to connect to AI service'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse response
    let extractedRecipe;
    try {
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
      
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON found in AI response');
      }
      
      const jsonStr = cleanedResponse.substring(firstBrace, lastBrace + 1);
      extractedRecipe = JSON.parse(jsonStr);
      
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PARSE_ERROR',
          message: 'Failed to parse AI response'
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for NOT_A_RECIPE
    if (extractedRecipe.error === 'NOT_A_RECIPE') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_A_RECIPE',
          message: 'This doesn\'t look like a recipe'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate
    const validation = validateExtractedRecipe(extractedRecipe);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VALIDATION_FAILED',
          message: validation.message,
          partialData: extractedRecipe
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate confidence
    const confidence = calculateConfidence(extractedRecipe);
    extractedRecipe.confidence = confidence;
    
    // Return extracted recipe
    // Client will handle normalization, review, enhancement
    return new Response(
      JSON.stringify({
        success: true,
        recipe: extractedRecipe,
        nextStep: 'normalize' // Client knows to call normalize-ingredients next
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Extract recipe error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
