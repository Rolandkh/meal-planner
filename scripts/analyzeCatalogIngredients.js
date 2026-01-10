/**
 * Ingredient Catalog Analysis Script
 * 
 * Scans the Spoonacular catalog (622 recipes) to extract:
 * - All unique ingredient names
 * - Frequency counts (total occurrences and recipe counts)
 * - Basic identity clustering for master dictionary planning
 * 
 * Outputs:
 * - tmp/catalogUniqueIngredients.json - Detailed ingredient frequency data
 * - tmp/ingredientIdentityCandidates.json - Clustered identity candidates
 * - tmp/ingredientAnalysisSummary.txt - Human-readable summary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the catalog
const catalogPath = path.join(__dirname, '../src/data/vanessa_recipe_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log(`📊 Analyzing ${catalog._count} recipes from catalog...`);
console.log(`📅 Catalog version: ${catalog._catalogVersion}`);
console.log(`🗓️  Last updated: ${catalog._lastUpdated}\n`);

// Data structures for analysis
const ingredientMap = new Map(); // rawText -> { count, recipeIds, normalizedText }
const identityClusters = new Map(); // naive identity -> array of raw texts

// Helper: Basic normalization for analysis
function normalizeForAnalysis(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,\.!?;:()]/g, '');
}

// Helper: Extract naive identity (remove obvious quantity/unit prefixes)
// This is just for clustering analysis, not the final parser
function extractNaiveIdentity(text) {
  const normalized = normalizeForAnalysis(text);
  
  // Remove leading quantity patterns like "1 cup", "2 tbsp", "½ tsp", etc.
  const withoutQuantity = normalized
    .replace(/^[\d\s\/½¼¾⅓⅔⅛⅜⅝⅞]+/, '') // Remove leading numbers/fractions
    .replace(/^(cups?|cup|tablespoons?|tbsps?|tbsp|teaspoons?|tsps?|tsp|oz|ounces?|pounds?|lbs?|lb|g|grams?|kg|ml|milliliters?|l|liters?|bunch|cloves?|pinch|dash|whole|head|stalk|sprig)\b\s*/i, '');
  
  // Remove common preparation words for clustering
  const prepWords = ['chopped', 'diced', 'minced', 'sliced', 'grated', 'crushed', 
                     'peeled', 'fresh', 'dried', 'frozen', 'canned', 'cooked',
                     'raw', 'whole', 'ground', 'finely', 'roughly', 'large', 'small'];
  
  let identity = withoutQuantity;
  prepWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    identity = identity.replace(regex, '');
  });
  
  return identity.trim().replace(/\s+/g, ' ') || normalized; // Fallback to normalized if empty
}

// Process all recipes
let totalIngredientOccurrences = 0;

catalog.recipes.forEach((recipe, index) => {
  if ((index + 1) % 100 === 0) {
    console.log(`   Processing recipe ${index + 1}/${catalog._count}...`);
  }
  
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    return;
  }
  
  recipe.ingredients.forEach(ing => {
    const rawText = ing.name || '';
    if (!rawText) return;
    
    totalIngredientOccurrences++;
    const normalized = normalizeForAnalysis(rawText);
    const naiveIdentity = extractNaiveIdentity(rawText);
    
    // Track unique ingredient occurrences
    if (!ingredientMap.has(rawText)) {
      ingredientMap.set(rawText, {
        rawText,
        normalizedText: normalized,
        count: 0,
        recipeIds: new Set(),
        naiveIdentity
      });
    }
    
    const entry = ingredientMap.get(rawText);
    entry.count++;
    entry.recipeIds.add(recipe.recipeId);
    
    // Cluster by naive identity
    if (!identityClusters.has(naiveIdentity)) {
      identityClusters.set(naiveIdentity, []);
    }
    if (!identityClusters.get(naiveIdentity).includes(rawText)) {
      identityClusters.get(naiveIdentity).push(rawText);
    }
  });
});

console.log(`\n✅ Analysis complete!\n`);

// Convert to arrays and sort
const uniqueIngredients = Array.from(ingredientMap.values())
  .map(entry => ({
    rawText: entry.rawText,
    normalizedText: entry.normalizedText,
    count: entry.count,
    recipeCount: entry.recipeIds.size,
    recipeIds: Array.from(entry.recipeIds).slice(0, 10), // First 10 for reference
    naiveIdentity: entry.naiveIdentity
  }))
  .sort((a, b) => b.count - a.count); // Sort by frequency

const identityClustersArray = Array.from(identityClusters.entries())
  .map(([identity, variants]) => ({
    identity,
    variantCount: variants.length,
    variants: variants.sort()
  }))
  .sort((a, b) => b.variantCount - a.variantCount); // Sort by variant count

// Generate summary statistics
const stats = {
  totalRecipes: catalog._count,
  totalIngredientOccurrences,
  uniqueIngredientStrings: uniqueIngredients.length,
  naiveIdentityClusters: identityClustersArray.length,
  top20MostCommon: uniqueIngredients.slice(0, 20).map(ing => ({
    name: ing.rawText,
    count: ing.count,
    recipeCount: ing.recipeCount
  })),
  coverageAnalysis: {
    top50: uniqueIngredients.slice(0, 50).reduce((sum, ing) => sum + ing.count, 0),
    top100: uniqueIngredients.slice(0, 100).reduce((sum, ing) => sum + ing.count, 0),
    top200: uniqueIngredients.slice(0, 200).reduce((sum, ing) => sum + ing.count, 0),
    top300: uniqueIngredients.slice(0, 300).reduce((sum, ing) => sum + ing.count, 0)
  }
};

// Calculate coverage percentages
const coveragePercentages = {
  top50: ((stats.coverageAnalysis.top50 / totalIngredientOccurrences) * 100).toFixed(1),
  top100: ((stats.coverageAnalysis.top100 / totalIngredientOccurrences) * 100).toFixed(1),
  top200: ((stats.coverageAnalysis.top200 / totalIngredientOccurrences) * 100).toFixed(1),
  top300: ((stats.coverageAnalysis.top300 / totalIngredientOccurrences) * 100).toFixed(1)
};

// Create output directory
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Write outputs
fs.writeFileSync(
  path.join(tmpDir, 'catalogUniqueIngredients.json'),
  JSON.stringify(uniqueIngredients, null, 2)
);

fs.writeFileSync(
  path.join(tmpDir, 'ingredientIdentityCandidates.json'),
  JSON.stringify(identityClustersArray, null, 2)
);

// Generate human-readable summary
const summary = `
INGREDIENT CATALOG ANALYSIS SUMMARY
====================================

📊 Overall Statistics:
- Total recipes analyzed: ${stats.totalRecipes}
- Total ingredient occurrences: ${totalIngredientOccurrences}
- Unique ingredient strings: ${stats.uniqueIngredientStrings}
- Naive identity clusters: ${stats.naiveIdentityClusters}

📈 Coverage Analysis (what % of occurrences covered by top N ingredients):
- Top 50 ingredients:  ${stats.coverageAnalysis.top50} occurrences (${coveragePercentages.top50}%)
- Top 100 ingredients: ${stats.coverageAnalysis.top100} occurrences (${coveragePercentages.top100}%)
- Top 200 ingredients: ${stats.coverageAnalysis.top200} occurrences (${coveragePercentages.top200}%)
- Top 300 ingredients: ${stats.coverageAnalysis.top300} occurrences (${coveragePercentages.top300}%)

🏆 Top 20 Most Common Ingredients:
${stats.top20MostCommon.map((ing, i) => 
  `${(i + 1).toString().padStart(2)}. ${ing.name.padEnd(30)} - ${ing.count.toString().padStart(4)} occurrences in ${ing.recipeCount} recipes`
).join('\n')}

💡 Recommendations:
- Target ~200-300 ingredients for master dictionary to cover ${coveragePercentages.top200}-${coveragePercentages.top300}% of occurrences
- Focus on top 100 first (${coveragePercentages.top100}% coverage)
- Review identity clusters to identify state variations (fresh/frozen/canned/dried)

📁 Output Files:
- tmp/catalogUniqueIngredients.json - Full ingredient frequency data
- tmp/ingredientIdentityCandidates.json - Clustered by naive identity
- tmp/ingredientAnalysisSummary.txt - This summary

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(
  path.join(tmpDir, 'ingredientAnalysisSummary.txt'),
  summary
);

// Print summary to console
console.log(summary);
console.log(`\n✅ Analysis files written to tmp/`);
console.log(`   - catalogUniqueIngredients.json (${uniqueIngredients.length} entries)`);
console.log(`   - ingredientIdentityCandidates.json (${identityClustersArray.length} clusters)`);
console.log(`   - ingredientAnalysisSummary.txt\n`);
