/**
 * Reload Catalog and Index into localStorage
 * 
 * Forces a fresh reload of the catalog and recipe index from files.
 * Run this after updating the catalog or index files.
 * 
 * Usage: Open browser console and run:
 * (async () => {
 *   const module = await import('/scripts/reloadCatalogAndIndex.js');
 *   await module.reloadCatalogAndIndex();
 * })();
 */

import { STORAGE_KEYS } from '../src/types/schemas.js';

/**
 * Force reload catalog and index from files
 */
export async function reloadCatalogAndIndex() {
  try {
    console.log('🔄 Force-reloading catalog and index from files...\n');
    
    // 1. Load catalog from file
    console.log('📦 Loading catalog...');
    const catalogResponse = await fetch('/src/data/vanessa_recipe_catalog.json');
    if (!catalogResponse.ok) {
      throw new Error('Could not load catalog file');
    }
    const catalogData = await catalogResponse.json();
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.RECIPE_CATALOG, JSON.stringify(catalogData));
    console.log(`✅ Catalog loaded: ${catalogData.recipes?.length || 0} recipes`);
    console.log(`   Version: ${catalogData._catalogVersion}`);
    console.log(`   Last updated: ${catalogData._lastUpdated}\n`);
    
    // 2. Load recipe index from file
    console.log('📦 Loading recipe index...');
    const indexResponse = await fetch('/src/data/recipe_index.json');
    if (!indexResponse.ok) {
      throw new Error('Could not load recipe index file');
    }
    const indexData = await indexResponse.json();
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.RECIPE_INDEX, JSON.stringify(indexData));
    console.log(`✅ Recipe index loaded: ${indexData.recipes?.length || 0} recipes`);
    console.log(`   Version: ${indexData._version}`);
    console.log(`   Size reduction: ${((1 - JSON.stringify(indexData).length / JSON.stringify(catalogData).length) * 100).toFixed(1)}%\n`);
    
    // 3. Print summary
    console.log('📊 SUMMARY:');
    console.log(`   Catalog: ${catalogData.recipes?.length || 0} recipes (${(JSON.stringify(catalogData).length / 1024).toFixed(0)} KB)`);
    console.log(`   Index: ${indexData.recipes?.length || 0} recipes (${(JSON.stringify(indexData).length / 1024).toFixed(0)} KB)`);
    console.log(`   Storage savings: ${((1 - JSON.stringify(indexData).length / JSON.stringify(catalogData).length) * 100).toFixed(1)}%`);
    
    // 4. Verify a few sample recipes
    const sampleRecipes = catalogData.recipes.slice(0, 3);
    console.log('\n📋 Sample recipes:');
    sampleRecipes.forEach(r => {
      const proteins = r.tags?.proteinSources?.join(', ') || 'none';
      const cuisines = r.tags?.cuisines?.slice(0, 2).join(', ') || 'none';
      console.log(`   • ${r.name}`);
      console.log(`     Proteins: ${proteins}`);
      console.log(`     Cuisines: ${cuisines}`);
      console.log(`     Meal slots: ${r.tags?.mealSlots?.join(', ')}`);
    });
    
    console.log('\n🎉 Catalog and index successfully reloaded!');
    console.log('💡 Refresh the page to see recipes in the Recipe Library.');
    
    return {
      success: true,
      catalogCount: catalogData.recipes?.length || 0,
      indexCount: indexData.recipes?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error reloading catalog and index:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  window.reloadCatalogAndIndex = reloadCatalogAndIndex;
  console.log('💡 Helper loaded! Run: reloadCatalogAndIndex()');
}
