/**
 * Add Ingredient to Catalog API Endpoint
 * 
 * Adds a new ingredient to the master catalog with complete metadata.
 * This endpoint should be called after ingredient research is complete.
 * 
 * Note: This is a server-side endpoint that modifies the catalog file.
 * In production, this would need proper authentication and validation.
 */

import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredient } = req.body;
    
    // Validate input
    if (!ingredient || typeof ingredient !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'ingredient object is required'
      });
    }
    
    // Validate required fields
    const required = ['id', 'displayName', 'canonicalUnit', 'state'];
    for (const field of required) {
      if (!ingredient[field]) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELD',
          message: `${field} is required`
        });
      }
    }
    
    // Read current catalog
    const catalogPath = path.join(process.cwd(), 'src/data/ingredientMaster.json');
    const catalogData = await fs.readFile(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogData);
    
    // Check if ID already exists
    if (catalog.ingredients[ingredient.id]) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ID',
        message: `Ingredient with ID "${ingredient.id}" already exists`
      });
    }
    
    // Add ingredient to catalog
    catalog.ingredients[ingredient.id] = {
      id: ingredient.id,
      displayName: ingredient.displayName,
      canonicalUnit: ingredient.canonicalUnit,
      state: ingredient.state,
      density: ingredient.density || null,
      aliases: ingredient.aliases || [],
      tags: ingredient.tags || []
    };
    
    // Add Spoonacular ID if available
    if (ingredient.spoonacularId) {
      catalog.ingredients[ingredient.id].spoonacularId = ingredient.spoonacularId;
    }
    
    // Update metadata
    catalog._totalEntries = Object.keys(catalog.ingredients).length;
    catalog._lastUpdated = new Date().toISOString();
    
    // Write back to file
    await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2));
    
    console.log(`✅ Added new ingredient: ${ingredient.displayName} (${ingredient.id})`);
    
    // Return success
    return res.status(200).json({
      success: true,
      ingredient: catalog.ingredients[ingredient.id],
      totalIngredients: catalog._totalEntries
    });
    
  } catch (error) {
    console.error('Add ingredient error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to add ingredient to catalog',
      details: error.message
    });
  }
}
