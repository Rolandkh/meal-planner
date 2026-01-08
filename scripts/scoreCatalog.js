/**
 * Score Catalog Script
 * Applies Diet Compass health scores to all recipes in the catalog
 * 
 * Run: node scripts/scoreCatalog.js
 * 
 * What it does:
 * 1. Loads the extracted catalog
 * 2. Loads ingredient health database
 * 3. Calculates Diet Compass scores for each recipe
 * 4. Updates catalog with scores
 * 5. Saves back to catalog file
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Import scoring utilities (we'll inline them since this is a Node script)
const METRIC_WEIGHTS = {
  nutrientDensity: 0.35,
  antiAging: 0.20,
  weightLoss: 0.20,
  heartHealth: 0.25
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function normalizeIngredientName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  
  const stopwords = ['fresh', 'frozen', 'chopped', 'diced', 'sliced', 'minced',
    'grated', 'shredded', 'ground', 'whole', 'raw', 'cooked',
    'canned', 'dried', 'baby', 'large', 'small', 'medium'];
  
  let normalized = rawName.toLowerCase().trim();
  
  for (const term of stopwords) {
    normalized = normalized.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
  }
  
  return normalized.replace(/\s+/g, ' ').trim().replace(/[,\.!?;:()]/g, '');
}

function getIngredientHealthData(ingredientName, healthDatabase) {
  const ingredients = healthDatabase.ingredients || {};
  const normalized = normalizeIngredientName(ingredientName);
  
  if (!normalized) return null;
  if (ingredients[normalized]) return ingredients[normalized];
  
  const singular = normalized.endsWith('s') ? normalized.slice(0, -1) : normalized + 's';
  if (ingredients[singular]) return ingredients[singular];
  
  const words = normalized.split(' ');
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (ingredients[lastWord]) return ingredients[lastWord];
  }
  
  return null;
}

function calculateRecipeScores(recipe, healthDatabase) {
  if (!recipe || !recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    return null;
  }

  const agg = { nd: 0, aa: 0, wl: 0, hh: 0 };
  let totalWeight = 0;
  let hasData = false;

  for (const ing of recipe.ingredients) {
    const healthData = getIngredientHealthData(ing.name, healthDatabase);
    if (!healthData) continue;

    hasData = true;
    const weight = (ing.quantity && ing.unit === 'g') ? ing.quantity : 1;
    totalWeight += weight;
    
    agg.nd += (healthData.nutrientDensityPoints || 0) * weight;
    agg.aa += (healthData.antiAgingPoints || 0) * weight;
    agg.wl += (healthData.weightLossPoints || 0) * weight;
    agg.hh += (healthData.heartHealthPoints || 0) * weight;
  }

  if (!hasData) return null;

  const norm = totalWeight || 1;
  const nd = clamp(Math.round(agg.nd / norm), 0, 100);
  const aa = clamp(Math.round(agg.aa / norm), 0, 100);
  const wl = clamp(Math.round(agg.wl / norm), 0, 100);
  const hh = clamp(Math.round(agg.hh / norm), 0, 100);
  
  const overall = clamp(
    Math.round(
      nd * METRIC_WEIGHTS.nutrientDensity +
      aa * METRIC_WEIGHTS.antiAging +
      wl * METRIC_WEIGHTS.weightLoss +
      hh * METRIC_WEIGHTS.heartHealth
    ),
    0, 100
  );

  return { overall, nutrientDensity: nd, antiAging: aa, weightLoss: wl, heartHealth: hh };
}

async function scoreCatalog() {
  console.log('🔄 Applying Diet Compass scores to catalog...\n');

  // Load catalog
  const catalogPath = path.join(PROJECT_ROOT, 'src/data/vanessa_recipe_catalog.json');
  const catalogData = JSON.parse(await readFile(catalogPath, 'utf-8'));
  const recipes = catalogData.recipes || [];
  
  console.log(`📖 Loaded ${recipes.length} recipes from catalog\n`);

  // Load ingredient health database
  const healthPath = path.join(PROJECT_ROOT, 'src/data/ingredientHealthData.json');
  const healthDatabase = JSON.parse(await readFile(healthPath, 'utf-8'));
  
  console.log(`🏥 Loaded ${Object.keys(healthDatabase.ingredients || {}).length} ingredient health entries\n`);

  // Score each recipe
  console.log('📊 Calculating scores...\n');
  let scored = 0;
  let unscored = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const scores = calculateRecipeScores(recipe, healthDatabase);
    
    if (scores) {
      recipe.dietCompassScores = scores;
      scored++;
      
      if ((i + 1) % 100 === 0) {
        console.log(`  Scored: ${i + 1}/${recipes.length} (${scored} with scores, ${unscored} without)`);
      }
    } else {
      unscored++;
    }
  }

  console.log(`\n✅ Scoring complete: ${scored} scored, ${unscored} unscored\n`);

  // Calculate statistics
  const scoredRecipes = recipes.filter(r => r.dietCompassScores);
  const avgOverall = scoredRecipes.reduce((sum, r) => sum + r.dietCompassScores.overall, 0) / scoredRecipes.length;
  const avgND = scoredRecipes.reduce((sum, r) => sum + r.dietCompassScores.nutrientDensity, 0) / scoredRecipes.length;
  const avgAA = scoredRecipes.reduce((sum, r) => sum + r.dietCompassScores.antiAging, 0) / scoredRecipes.length;
  const avgWL = scoredRecipes.reduce((sum, r) => sum + r.dietCompassScores.weightLoss, 0) / scoredRecipes.length;
  const avgHH = scoredRecipes.reduce((sum, r) => sum + r.dietCompassScores.heartHealth, 0) / scoredRecipes.length;

  console.log('📈 Average Scores:');
  console.log(`   Overall: ${avgOverall.toFixed(1)}`);
  console.log(`   🥗 Nutrient Density: ${avgND.toFixed(1)}`);
  console.log(`   ⏳ Anti-Aging: ${avgAA.toFixed(1)}`);
  console.log(`   ⚖️  Weight Loss: ${avgWL.toFixed(1)}`);
  console.log(`   ❤️  Heart Health: ${avgHH.toFixed(1)}\n`);

  // Save updated catalog
  catalogData.recipes = recipes;
  catalogData._lastScored = new Date().toISOString();
  
  await writeFile(catalogPath, JSON.stringify(catalogData, null, 2));
  console.log(`💾 Saved updated catalog to: ${catalogPath}\n`);

  console.log('✅ SCORING COMPLETE!');
  console.log(`   ${scored} recipes now have health scores`);
  console.log(`   ${unscored} recipes lack ingredient health data (will use fallbacks)\n`);
}

scoreCatalog().catch(error => {
  console.error('❌ Scoring failed:', error);
  process.exit(1);
});
