/**
 * Instruction Enhancer Utility
 * 
 * Enhances recipe instructions by:
 * 1. Inserting ingredient quantities inline
 * 2. Adding helpful equivalents (e.g., "200g, about 1 cup")
 * 3. Standardizing formatting
 */

import { getMasterIngredient } from './ingredientMaster.js';

/**
 * Find ingredient mentions in instruction text
 * @param {string} instruction - Single instruction step text
 * @param {Array} normalizedIngredients - Array of normalized ingredients for this recipe
 * @returns {Array} Array of matches {text, ingredient, position}
 */
function findIngredientMentions(instruction, normalizedIngredients) {
  const mentions = [];
  const lowerInstruction = instruction.toLowerCase();
  
  for (const ing of normalizedIngredients) {
    const searchTerms = [
      ing.displayName,
      ...ing.masterIngredient.aliases || []
    ];
    
    for (const term of searchTerms) {
      const termLower = term.toLowerCase();
      let startIndex = 0;
      
      while (true) {
        const index = lowerInstruction.indexOf(termLower, startIndex);
        if (index === -1) break;
        
        // Check if it's a word boundary
        const beforeChar = index > 0 ? lowerInstruction[index - 1] : ' ';
        const afterChar = index + termLower.length < lowerInstruction.length 
          ? lowerInstruction[index + termLower.length] 
          : ' ';
        
        const isWordBoundary = /\W/.test(beforeChar) && /\W/.test(afterChar);
        
        if (isWordBoundary) {
          mentions.push({
            text: instruction.substring(index, index + termLower.length),
            ingredient: ing,
            position: index,
            length: termLower.length
          });
        }
        
        startIndex = index + 1;
      }
    }
  }
  
  // Sort by position (descending) so we can replace from end to start
  return mentions.sort((a, b) => b.position - a.position);
}

/**
 * Generate quantity text with equivalents
 * @param {Object} ingredient - Normalized ingredient
 * @returns {string} Formatted quantity text
 */
function generateQuantityText(ingredient) {
  const quantity = ingredient.quantity;
  
  if (!quantity || !quantity.value) {
    return '';
  }
  
  let text = `${quantity.value}${quantity.unit}`;
  
  // Add equivalents if available
  const equivalents = [];
  
  // Add normalized grams if different from original
  if (quantity.normalizedQuantityG && quantity.unit !== 'g') {
    equivalents.push(`${Math.round(quantity.normalizedQuantityG)}g`);
  }
  
  // Add common equivalents
  if (quantity.normalizedQuantityG) {
    const grams = quantity.normalizedQuantityG;
    
    // Cups conversion (if we have density)
    const density = ingredient.masterIngredient?.density;
    if (density && density.gPerCup) {
      const cups = grams / density.gPerCup;
      if (cups >= 0.25 && cups <= 4) {
        if (cups === 0.25) equivalents.push('¼ cup');
        else if (cups === 0.33) equivalents.push('⅓ cup');
        else if (cups === 0.5) equivalents.push('½ cup');
        else if (cups === 0.75) equivalents.push('¾ cup');
        else if (cups === 1) equivalents.push('1 cup');
        else if (cups < 1) equivalents.push(`${Math.round(cups * 4)}/4 cup`);
        else equivalents.push(`${Math.round(cups * 2) / 2} cups`);
      }
    }
    
    // Whole item approximations
    if (ingredient.masterIngredient) {
      const name = ingredient.masterIngredient.displayName;
      
      // Garlic cloves
      if (name.includes('garlic')) {
        const cloves = Math.round(grams / 8.5); // ~8.5g per clove
        if (cloves > 0) equivalents.push(`about ${cloves} clove${cloves > 1 ? 's' : ''}`);
      }
      
      // Onions
      if (name.includes('onion') && !name.includes('spring') && !name.includes('green')) {
        const onions = Math.round(grams / 150); // ~150g per medium onion
        if (onions > 0) equivalents.push(`about ${onions} medium onion${onions > 1 ? 's' : ''}`);
      }
      
      // Lemons/Limes
      if (name.includes('lemon') || name.includes('lime')) {
        const fruits = Math.round(grams / 100); // ~100g per lemon/lime
        if (fruits > 0) equivalents.push(`about ${fruits} ${name}${fruits > 1 ? 's' : ''}`);
      }
    }
  }
  
  // Format final text
  if (equivalents.length > 0) {
    text += `, ${equivalents.join(', ')}`;
  }
  
  return text;
}

/**
 * Enhance a single instruction step
 * @param {string} instruction - Original instruction text
 * @param {Array} normalizedIngredients - Normalized ingredients for recipe
 * @returns {string} Enhanced instruction
 */
export function enhanceInstruction(instruction, normalizedIngredients) {
  if (!instruction || !normalizedIngredients || normalizedIngredients.length === 0) {
    return instruction;
  }
  
  // Find all ingredient mentions
  const mentions = findIngredientMentions(instruction, normalizedIngredients);
  
  if (mentions.length === 0) {
    return instruction;
  }
  
  let enhanced = instruction;
  
  // Replace from end to start (so positions don't shift)
  for (const mention of mentions) {
    const quantityText = generateQuantityText(mention.ingredient);
    
    if (quantityText) {
      const before = enhanced.substring(0, mention.position);
      const ingredientText = mention.text;
      const after = enhanced.substring(mention.position + mention.length);
      
      // Insert as: **ingredient (quantity)**
      enhanced = `${before}**${ingredientText} (${quantityText})**${after}`;
    } else {
      // Just bold the ingredient name
      const before = enhanced.substring(0, mention.position);
      const ingredientText = mention.text;
      const after = enhanced.substring(mention.position + mention.length);
      
      enhanced = `${before}**${ingredientText}**${after}`;
    }
  }
  
  return enhanced;
}

/**
 * Enhance all instructions in a recipe
 * @param {string} instructions - Full instruction text (can be multi-line)
 * @param {Array} normalizedIngredients - Normalized ingredients
 * @returns {string} Enhanced instructions
 */
export function enhanceAllInstructions(instructions, normalizedIngredients) {
  if (!instructions) return '';
  
  // Split into steps (by double newline or numbered list)
  const steps = instructions.split(/\n\n+/);
  
  // Enhance each step
  const enhanced = steps.map(step => 
    enhanceInstruction(step.trim(), normalizedIngredients)
  );
  
  return enhanced.join('\n\n');
}

/**
 * Extract preparation methods from instructions
 * Used to determine which cooking method multipliers to apply
 * @param {string} instructions - Full instruction text
 * @returns {Array} Array of detected cooking methods
 */
export function extractCookingMethods(instructions) {
  if (!instructions) return ['raw'];
  
  const lower = instructions.toLowerCase();
  const methods = [];
  
  // Check for each cooking method
  const methodKeywords = {
    'grilled': ['grill', 'grilling', 'grilled', 'barbecue', 'bbq'],
    'baked': ['bake', 'baking', 'baked', 'roast', 'roasting', 'roasted', 'oven'],
    'fried': ['fry', 'frying', 'fried', 'deep fry', 'pan fry', 'stir fry'],
    'boiled': ['boil', 'boiling', 'boiled', 'simmer', 'simmering'],
    'steamed': ['steam', 'steaming', 'steamed'],
    'air-fried': ['air fry', 'air-fry', 'airfry', 'air fried']
  };
  
  for (const [method, keywords] of Object.entries(methodKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      methods.push(method);
    }
  }
  
  // Default to raw if no cooking detected
  if (methods.length === 0) {
    methods.push('raw');
  }
  
  return methods;
}

export default {
  enhanceInstruction,
  enhanceAllInstructions,
  extractCookingMethods
};
