/**
 * Process Parser - Extracts cooking processes from recipe instructions
 * Uses Claude AI to map recipe steps to processMaster.json processes
 * 
 * Phase 2.1 of Recipe Conversion Engine
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Parse HTML instructions into clean text steps
 * @param {string} htmlInstructions - HTML string (e.g., "<ol><li>Step 1</li><li>Step 2</li></ol>")
 * @returns {string[]} Array of instruction steps
 */
export function extractStepsFromHTML(htmlInstructions) {
  if (!htmlInstructions) return [];
  
  // Remove HTML tags and extract steps
  const steps = htmlInstructions
    .replace(/<[^>]*>/g, '\n')  // Replace all HTML tags with newlines
    .split('\n')                 // Split by newlines
    .map(step => step.trim())    // Trim whitespace
    .filter(step => step.length > 0);  // Remove empty lines
  
  return steps;
}

/**
 * Build the Claude prompt for process extraction
 * @param {Object} recipe - Recipe object with ingredients and instructions
 * @param {Object} processMaster - Process Master database
 * @returns {string} Formatted prompt
 */
export function buildProcessParserPrompt(recipe, processMaster) {
  const steps = extractStepsFromHTML(recipe.instructions);
  
  // Create process reference list with aliases
  const processReference = Object.entries(processMaster.processes)
    .map(([id, process]) => {
      const aliases = process.aliases ? ` (also: ${process.aliases.join(', ')})` : '';
      return `- ${id}: ${process.displayName}${aliases} - ${process.description}`;
    })
    .join('\n');
  
  // Format ingredients for context
  const ingredientsList = recipe.ingredients
    .map(ing => `- ${ing.quantity}${ing.unit ? ' ' + ing.unit : ''} ${ing.name}`)
    .join('\n');
  
  return `You are a culinary process analyst. Your task is to parse recipe instructions and identify the specific cooking processes used, mapping them to a standardized process database.

# Recipe: ${recipe.name}

## Ingredients:
${ingredientsList}

## Instructions:
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Available Processes:
${processReference}

## Your Task:

Analyze each instruction step and extract the cooking processes being performed. For each step, identify:

1. **Primary Process(es)** - Which process(es) from the list above are being performed?
2. **Ingredients Involved** - Which ingredients are affected in this step?
3. **Duration** - If mentioned, how long does this step take?
4. **Output Description** - What is the state of ingredients after this step?

## Output Format:

Return a JSON object with this structure:

\`\`\`json
{
  "recipeName": "${recipe.name}",
  "processSteps": [
    {
      "stepNumber": 1,
      "originalInstruction": "...",
      "processes": [
        {
          "processId": "process_id_from_list",
          "ingredients": ["ingredient_name"],
          "durationMinutes": 5,
          "notes": "any specific details"
        }
      ],
      "outputDescription": "state after this step"
    }
  ],
  "processSummary": {
    "totalProcesses": 10,
    "uniqueProcesses": ["dice", "saute", "boil"],
    "estimatedTotalTime": 30
  }
}
\`\`\`

## Important Guidelines:

1. **Use exact process IDs** from the Available Processes list
2. **Match ingredient names** to those in the ingredients list (may need slight normalization)
3. **Be specific** - if "cook onions until soft", that's "saute", not just "cook"
4. **Include implied processes** - if recipe says "add diced onion", include the "dice" process even if not explicitly mentioned
5. **Sequence matters** - processes should be in chronological order
6. **Multiple processes per step** - A step might involve multiple processes (e.g., "add chopped garlic and saute" = dice + saute)
7. **Duration extraction** - Pull out time mentions like "cook for 5 minutes", "until golden (about 10 minutes)"

## Common Patterns to Watch For:

- "Cook until X" often implies a specific process (sauté, simmer, etc.) based on context
- "Add X" might imply prep processes for X if not pre-prepared
- "Season" explicitly = use the "season" process
- "Bring to a boil, then reduce heat" = "boil" + "simmer"
- Temperature and equipment clues help identify processes (oven = bake/roast, stovetop = sauté/boil)

Now analyze the recipe and return ONLY the JSON object.`;
}

/**
 * Call Claude AI to parse processes from recipe
 * @param {Object} recipe - Recipe object
 * @param {Object} processMaster - Process Master database
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Parsed process graph
 */
export async function parseRecipeProcesses(recipe, processMaster, apiKey) {
  if (!apiKey) {
    throw new Error('Anthropic API key is required for process parsing');
  }
  
  const anthropic = new Anthropic({ apiKey });
  
  const prompt = buildProcessParserPrompt(recipe, processMaster);
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,  // Lower temperature for more consistent parsing
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    // Extract JSON from response
    const content = response.content[0].text;
    
    // Try to extract JSON from markdown code blocks if present
    let jsonText = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find raw JSON object
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }
    
    const parsed = JSON.parse(jsonText);
    
    // Validate the parsed result
    const validation = validateParsedProcesses(parsed, processMaster);
    if (!validation.valid) {
      console.warn('Process parsing validation warnings:', validation.warnings);
    }
    
    return {
      success: true,
      data: parsed,
      validation,
      rawResponse: content
    };
    
  } catch (error) {
    console.error('Error parsing recipe processes:', error);
    return {
      success: false,
      error: error.message,
      rawResponse: error.response?.data || null
    };
  }
}

/**
 * Validate parsed processes against Process Master
 * @param {Object} parsed - Parsed process data from Claude
 * @param {Object} processMaster - Process Master database
 * @returns {Object} Validation result with warnings
 */
export function validateParsedProcesses(parsed, processMaster) {
  const warnings = [];
  const validProcessIds = Object.keys(processMaster.processes);
  
  if (!parsed.processSteps || !Array.isArray(parsed.processSteps)) {
    warnings.push('Missing or invalid processSteps array');
    return { valid: false, warnings };
  }
  
  parsed.processSteps.forEach((step, stepIndex) => {
    if (!step.processes || !Array.isArray(step.processes)) {
      warnings.push(`Step ${stepIndex + 1}: Missing or invalid processes array`);
      return;
    }
    
    step.processes.forEach((process, processIndex) => {
      // Check if process ID is valid
      if (!validProcessIds.includes(process.processId)) {
        warnings.push(
          `Step ${stepIndex + 1}, Process ${processIndex + 1}: Invalid process ID "${process.processId}". ` +
          `Did you mean one of: ${findSimilarProcesses(process.processId, validProcessIds).join(', ')}?`
        );
      }
      
      // Check if ingredients array exists
      if (!process.ingredients || !Array.isArray(process.ingredients)) {
        warnings.push(`Step ${stepIndex + 1}, Process ${processIndex + 1}: Missing or invalid ingredients array`);
      }
    });
  });
  
  return {
    valid: warnings.length === 0,
    warnings,
    stats: {
      totalSteps: parsed.processSteps?.length || 0,
      totalProcesses: parsed.processSteps?.reduce((sum, step) => sum + (step.processes?.length || 0), 0) || 0,
      uniqueProcesses: new Set(
        parsed.processSteps?.flatMap(step => 
          step.processes?.map(p => p.processId) || []
        ) || []
      ).size
    }
  };
}

/**
 * Find similar process IDs (for helpful error messages)
 * @param {string} invalidId - The invalid process ID
 * @param {string[]} validIds - Array of valid process IDs
 * @returns {string[]} Top 3 most similar process IDs
 */
function findSimilarProcesses(invalidId, validIds) {
  // Simple Levenshtein distance for finding similar strings
  const distances = validIds.map(validId => ({
    id: validId,
    distance: levenshteinDistance(invalidId.toLowerCase(), validId.toLowerCase())
  }));
  
  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, 3).map(d => d.id);
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // substitution
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Batch parse multiple recipes
 * @param {Object[]} recipes - Array of recipe objects
 * @param {Object} processMaster - Process Master database
 * @param {string} apiKey - Anthropic API key
 * @param {Object} options - Options for batch processing
 * @returns {Promise<Object[]>} Array of parse results
 */
export async function batchParseRecipes(recipes, processMaster, apiKey, options = {}) {
  const {
    batchSize = 1,           // Process one at a time by default (API rate limiting)
    delayMs = 1000,          // Delay between batches
    onProgress = null        // Progress callback
  } = options;
  
  const results = [];
  
  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(recipes.length / batchSize);
    
    if (onProgress) {
      onProgress({
        currentBatch: batchNumber,
        totalBatches,
        recipesProcessed: i,
        totalRecipes: recipes.length
      });
    }
    
    // Process batch in parallel
    const batchPromises = batch.map(recipe => 
      parseRecipeProcesses(recipe, processMaster, apiKey)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Delay before next batch (except for last batch)
    if (i + batchSize < recipes.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

export default {
  extractStepsFromHTML,
  buildProcessParserPrompt,
  parseRecipeProcesses,
  validateParsedProcesses,
  batchParseRecipes
};
