/**
 * Recipe Formatter Utility
 * 
 * Standardizes recipe instruction formatting for consistent display:
 * - Numbered steps
 * - Proper spacing
 * - Consistent tense (imperative)
 * - Clear timing references
 * - Bold ingredient mentions (already handled by enhancer)
 */

/**
 * Format recipe instructions into standardized steps
 * @param {string} instructions - Raw instruction text
 * @returns {string} Formatted instructions
 */
export function formatInstructions(instructions) {
  if (!instructions || typeof instructions !== 'string') {
    return '';
  }
  
  // Normalize line endings
  let text = instructions.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into potential steps
  let steps = splitIntoSteps(text);
  
  // Clean and standardize each step
  steps = steps.map((step, index) => cleanStep(step, index + 1));
  
  // Filter empty steps
  steps = steps.filter(step => step.trim().length > 0);
  
  // Re-number steps sequentially
  steps = steps.map((step, index) => {
    // Remove any existing numbering
    const cleaned = step.replace(/^\d+[\.)]\s*/, '');
    // Add consistent numbering
    return `${index + 1}. ${cleaned}`;
  });
  
  // Join with double newline for proper spacing
  return steps.join('\n\n');
}

/**
 * Split instructions into individual steps
 * Handles various formats:
 * - Already numbered (1. or 1))
 * - Bullet points (- or •)
 * - Paragraphs separated by double newlines
 * - Sentences ending with periods in a single paragraph
 */
function splitIntoSteps(text) {
  // First, try numbered list format
  const numberedMatch = text.match(/^\d+[\.)]/m);
  if (numberedMatch) {
    // Split by number patterns
    return text.split(/\n*\d+[\.)]\s*/).filter(s => s.trim().length > 0);
  }
  
  // Try bullet points
  const bulletMatch = text.match(/^[-•]/m);
  if (bulletMatch) {
    return text.split(/\n*[-•]\s*/).filter(s => s.trim().length > 0);
  }
  
  // Try double newlines (paragraphs)
  if (text.includes('\n\n')) {
    return text.split(/\n\n+/).filter(s => s.trim().length > 0);
  }
  
  // Try single newlines
  if (text.includes('\n')) {
    const lines = text.split('\n').filter(s => s.trim().length > 10);
    if (lines.length > 1) {
      return lines;
    }
  }
  
  // Last resort: split by sentence endings followed by capital letters
  const sentences = text.split(/\.\s+(?=[A-Z])/);
  if (sentences.length > 1) {
    return sentences.map(s => s.endsWith('.') ? s : s + '.');
  }
  
  // Single step
  return [text];
}

/**
 * Clean and standardize a single step
 * @param {string} step - Step text
 * @param {number} stepNumber - Step number
 * @returns {string} Cleaned step
 */
function cleanStep(step, stepNumber) {
  let cleaned = step.trim();
  
  // Remove existing numbering
  cleaned = cleaned.replace(/^\d+[\.)]\s*/, '');
  cleaned = cleaned.replace(/^[-•]\s*/, '');
  
  // Ensure it ends with a period
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }
  
  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // Standardize timing references
  cleaned = cleaned.replace(/(\d+)\s*-\s*(\d+)\s*(minute|min|hour|hr)/gi, '$1-$2 $3s');
  cleaned = cleaned.replace(/(\d+)\s*(minute|min)(?!s)/gi, '$1 minutes');
  cleaned = cleaned.replace(/(\d+)\s*(hour|hr)(?!s)/gi, '$1 hours');
  
  // Standardize temperature references
  cleaned = cleaned.replace(/(\d+)\s*°?[CF]\b/g, (match) => {
    const temp = match.match(/\d+/)[0];
    const unit = match.match(/[CF]/)?.[0] || 'C';
    return `${temp}°${unit}`;
  });
  
  return cleaned;
}

/**
 * Ensure consistent spacing in formatted instructions
 * @param {string} formattedInstructions - Already formatted instructions
 * @returns {string} Instructions with proper spacing
 */
export function ensureProperSpacing(formattedInstructions) {
  // Ensure double newlines between steps
  return formattedInstructions.replace(/\n{3,}/g, '\n\n');
}

/**
 * Convert instructions to HTML for display
 * @param {string} formattedInstructions - Formatted instruction text
 * @returns {string} HTML string
 */
export function instructionsToHTML(formattedInstructions) {
  if (!formattedInstructions) return '';
  
  const steps = formattedInstructions.split(/\n\n+/);
  
  const html = steps.map(step => {
    // Convert markdown bold (**text**) to HTML
    const withBold = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return `<div class="mb-4 pl-4 border-l-4 border-orange-200">${withBold}</div>`;
  }).join('\n');
  
  return `<div class="recipe-instructions space-y-2">${html}</div>`;
}

/**
 * Validate that instructions are properly formatted
 * @param {string} instructions - Instructions to validate
 * @returns {Object} {valid: boolean, issues: Array}
 */
export function validateInstructionFormat(instructions) {
  const issues = [];
  
  if (!instructions || instructions.trim().length === 0) {
    issues.push('Instructions are empty');
    return { valid: false, issues };
  }
  
  // Check for minimum length
  if (instructions.length < 20) {
    issues.push('Instructions are too short (minimum 20 characters)');
  }
  
  // Check for numbered format
  if (!instructions.match(/^\d+\./m)) {
    issues.push('Instructions should start with step numbers');
  }
  
  // Check for proper spacing
  const steps = instructions.split(/\n\n+/);
  if (steps.length < 2 && instructions.length > 100) {
    issues.push('Steps should be separated by blank lines');
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}

export default {
  formatInstructions,
  ensureProperSpacing,
  instructionsToHTML,
  validateInstructionFormat
};
