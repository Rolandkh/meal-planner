/**
 * Build Recipe Index
 * 
 * Creates a lightweight recipe index from the full catalog for Claude meal generation.
 * This file is 78% smaller than the full catalog (only essential info, no full ingredients/instructions).
 * 
 * Run: node scripts/buildRecipeIndex.js
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Extract main ingredients (first 5-8 most significant)
 */
function extractMainIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return [];
  
  // Sort by quantity (descending) and take top ingredients
  const sorted = [...ingredients]
    .filter(ing => ing.name && ing.quantity)
    .sort((a, b) => {
      // Convert to approximate grams for sorting
      const aGrams = convertToGrams(a.quantity, a.unit);
      const bGrams = convertToGrams(b.quantity, b.unit);
      return bGrams - aGrams;
    })
    .slice(0, 8)  // Top 8 ingredients
    .map(ing => ing.name);
  
  return sorted.length > 0 ? sorted : ingredients.slice(0, 5).map(i => i.name);
}

/**
 * Rough conversion to grams for sorting
 */
function convertToGrams(quantity, unit) {
  if (!quantity) return 0;
  
  const conversions = {
    'g': 1,
    'kg': 1000,
    'oz': 28,
    'lb': 454,
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'ml': 1,
    'l': 1000
  };
  
  const unitLower = (unit || '').toLowerCase();
  const multiplier = conversions[unitLower] || 100; // Default guess
  
  return quantity * multiplier;
}

/**
 * Transform full recipe to lightweight index entry
 */
function transformToIndexEntry(recipe) {
  return {
    recipeId: recipe.recipeId,
    name: recipe.name,
    prepTime: recipe.prepTime || 0,
    cookTime: recipe.cookTime || 0,
    servings: recipe.servings || 4,
    
    // Nutrition (if available)
    calories: recipe.nutrition?.calories || 0,
    protein: recipe.nutrition?.protein || 0,
    carbs: recipe.nutrition?.carbs || 0,
    fat: recipe.nutrition?.fat || 0,
    fiber: recipe.nutrition?.fiber || 0,
    
    // Tags for filtering
    cuisines: recipe.tags?.cuisines || [],
    diets: recipe.tags?.diets || [],
    dishTypes: recipe.tags?.dishTypes || [],
    mealSlots: recipe.tags?.mealSlots || [],
    proteinSources: recipe.tags?.proteinSources || [],
    effortLevel: recipe.tags?.effortLevel || 'medium',
    
    // Main ingredients (first 5-8)
    mainIngredients: extractMainIngredients(recipe.ingredients),
    
    // Diet flags (quick filters)
    vegetarian: recipe.tags?.diets?.includes('vegetarian') || recipe.tags?.diets?.includes('lacto ovo vegetarian'),
    vegan: recipe.tags?.diets?.includes('vegan'),
    glutenFree: recipe.tags?.diets?.includes('gluten free'),
    dairyFree: recipe.tags?.diets?.includes('dairy free'),
    ketogenic: recipe.tags?.diets?.includes('ketogenic'),
    pescatarian: recipe.tags?.diets?.includes('pescatarian'),
    
    // Health score (if available)
    healthScore: recipe.dietCompassScores?.overall || null,
    
    // Source
    source: recipe.source || 'user'
  };
}

/**
 * Build the recipe index
 */
async function buildRecipeIndex() {
  console.log('🔨 Building Recipe Index\n');
  
  try {
    // Load full catalog
    const catalogPath = path.join(PROJECT_ROOT, 'src/data/vanessa_recipe_catalog.json');
    console.log('📂 Loading catalog from:', catalogPath);
    
    const catalogContent = await readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogContent);
    
    console.log(`✅ Loaded ${catalog.recipes?.length || 0} recipes from catalog\n`);
    
    // Transform to lightweight entries
    console.log('🔄 Transforming to lightweight format...');
    const indexEntries = catalog.recipes.map(transformToIndexEntry);
    
    // Build index structure
    const index = {
      _version: '2.0.0',
      _lastUpdated: new Date().toISOString(),
      _count: indexEntries.length,
      _description: 'Lightweight recipe index for Claude meal plan generation',
      _usage: 'Contains only essential recipe info (no full ingredients/instructions)',
      _source: 'Generated from vanessa_recipe_catalog.json',
      recipes: indexEntries
    };
    
    // Calculate sizes
    const fullSize = catalogContent.length;
    const indexSize = JSON.stringify(index).length;
    const reduction = ((1 - indexSize / fullSize) * 100).toFixed(1);
    
    console.log(`✅ Transformed ${indexEntries.length} recipes`);
    console.log(`📊 Size reduction: ${reduction}% (${(fullSize/1024).toFixed(0)}KB → ${(indexSize/1024).toFixed(0)}KB)\n`);
    
    // Save index
    const indexPath = path.join(PROJECT_ROOT, 'src/data/recipe_index.json');
    await writeFile(indexPath, JSON.stringify(index, null, 2));
    
    console.log(`💾 Saved to: ${indexPath}`);
    
    // Print summary
    console.log('\n📊 INDEX SUMMARY:');
    
    const cuisines = new Set();
    const proteins = new Set();
    let breakfasts = 0;
    
    indexEntries.forEach(r => {
      r.cuisines?.forEach(c => cuisines.add(c));
      r.proteinSources?.forEach(p => proteins.add(p));
      if (r.mealSlots?.includes('breakfast')) breakfasts++;
    });
    
    console.log(`   Total recipes: ${indexEntries.length}`);
    console.log(`   Cuisines: ${cuisines.size} types`);
    console.log(`   Proteins: ${proteins.size} types`);
    console.log(`   Breakfasts: ${breakfasts}`);
    console.log(`   Vegetarian: ${indexEntries.filter(r => r.vegetarian).length}`);
    console.log(`   Vegan: ${indexEntries.filter(r => r.vegan).length}`);
    
    console.log('\n🎉 Recipe index built successfully!');
    
  } catch (error) {
    console.error('❌ Error building recipe index:', error);
    process.exit(1);
  }
}

// Run
buildRecipeIndex();
