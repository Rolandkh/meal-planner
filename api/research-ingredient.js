/**
 * Research Ingredient API Endpoint
 * 
 * Uses AI to research a new ingredient and gather all required metadata:
 * - Spoonacular nutrition data
 * - Density values
 * - Common aliases
 * - Typical retail unit and pricing guidance
 * - Suggested tags
 */

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

const RESEARCH_SYSTEM_PROMPT = `You are an ingredient research assistant. When given an ingredient name, research and provide comprehensive metadata in JSON format.

Return ONLY valid JSON in this exact format:

{
  "suggestedId": "ingredient_id_format",
  "displayName": "Proper Display Name",
  "canonicalUnit": "g" | "ml" | "whole",
  "state": "fresh" | "frozen" | "canned" | "dried" | "other",
  "suggestedAliases": ["alias1", "alias2", ...],
  "suggestedTags": ["tag1", "tag2", ...],
  "densityEstimates": {
    "gPerCup": number or null,
    "gPerTbsp": number or null,
    "gPerTsp": number or null,
    "source": "USDA" | "estimated" | "standard"
  },
  "retailInfo": {
    "typicalUnit": "kg" | "L" | "pack" | "bunch" | etc,
    "typicalPackSize": "description",
    "estimatedPriceAUD": number or null,
    "notes": "pricing notes"
  },
  "substitutes": ["substitute1", "substitute2"],
  "notes": "Any relevant information about this ingredient"
}

Guidelines:
- Use USDA FoodData Central for density values when possible
- For pricing, estimate typical Melbourne supermarket prices (Coles/Woolworths)
- Include both Australian and international name variants in aliases
- Be thorough but accurate`;

/**
 * Search Spoonacular for ingredient
 */
async function searchSpoonacular(ingredientName) {
  if (!SPOONACULAR_API_KEY) {
    console.warn('Spoonacular API key not available');
    return null;
  }
  
  const url = new URL('https://api.spoonacular.com/food/ingredients/search');
  url.searchParams.set('query', ingredientName);
  url.searchParams.set('number', '1');
  url.searchParams.set('apiKey', SPOONACULAR_API_KEY);
  
  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        id: data.results[0].id,
        name: data.results[0].name
      };
    }
  } catch (error) {
    console.error('Spoonacular search error:', error);
  }
  
  return null;
}

/**
 * Get Spoonacular nutrition data
 */
async function getSpoonacularNutrition(ingredientId) {
  if (!SPOONACULAR_API_KEY) return null;
  
  const url = new URL(`https://api.spoonacular.com/food/ingredients/${ingredientId}/information`);
  url.searchParams.set('amount', '100');
  url.searchParams.set('unit', 'grams');
  url.searchParams.set('apiKey', SPOONACULAR_API_KEY);
  
  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Spoonacular nutrition error:', error);
  }
  
  return null;
}

/**
 * Research ingredient using AI
 */
async function researchIngredient(ingredientName, userNotes = null) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }
  
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  let prompt = `Research this ingredient: "${ingredientName}"`;
  if (userNotes) {
    prompt += `\n\nUser notes: ${userNotes}`;
  }
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.3,
    system: RESEARCH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const content = message.content[0];
  if (content.type === 'text') {
    // Parse JSON response
    let cleanedResponse = content.text.trim();
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
    
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in AI response');
    }
    
    const jsonStr = cleanedResponse.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr);
  }
  
  throw new Error('Unexpected AI response format');
}

/**
 * Main handler
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
    const { ingredientName, userNotes } = body;
    
    if (!ingredientName || typeof ingredientName !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'ingredientName is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Researching ingredient: ${ingredientName}`);
    
    // Step 1: Search Spoonacular
    const spoonacularResult = await searchSpoonacular(ingredientName);
    let spoonacularData = null;
    
    if (spoonacularResult) {
      console.log(`Found in Spoonacular: ID ${spoonacularResult.id}`);
      spoonacularData = await getSpoonacularNutrition(spoonacularResult.id);
    }
    
    // Step 2: AI Research
    const aiResearch = await researchIngredient(ingredientName, userNotes);
    
    // Step 3: Combine data
    const result = {
      ...aiResearch,
      spoonacular: spoonacularResult ? {
        id: spoonacularResult.id,
        name: spoonacularResult.name,
        nutritionData: spoonacularData
      } : null
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        research: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Research ingredient error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SERVER_ERROR',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
