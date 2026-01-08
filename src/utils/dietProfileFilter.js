/**
 * Diet Profile Filtering Utilities
 * Filter recipes by diet profile compatibility and detect conflicts
 */

import { getDietProfileById, getConflictingProfiles } from './dietProfiles.js';

// Known profile conflicts matrix
const PROFILE_CONFLICTS = {
  'keto': ['vegan', 'vegetarian'],
  'vegan': ['keto'],
  'vegetarian': ['keto']
};

/**
 * Filter catalog by single diet profile
 * @param {Array} catalog - Recipe catalog
 * @param {string} profileId - Diet profile ID
 * @returns {Array} Filtered recipes
 */
export function filterByDietProfile(catalog, profileId) {
  if (!profileId || !catalog || !Array.isArray(catalog)) {
    return catalog || [];
  }

  const profile = getDietProfileById(profileId);
  if (!profile) {
    console.warn(`Unknown diet profile: ${profileId}`);
    return catalog;
  }

  return catalog.filter(recipe => {
    // Check if recipe tags include this diet
    if (recipe.tags?.diets && recipe.tags.diets.includes(profileId)) {
      return true;
    }

    // Check for profile-specific compatibility
    // If recipe has no diet tags, it's considered neutral (compatible)
    if (!recipe.tags?.diets || recipe.tags.diets.length === 0) {
      return true;
    }

    return false;
  });
}

/**
 * Check if recipe is compatible with multiple diet profiles
 * @param {Object} recipe
 * @param {string[]} profileIds
 * @returns {boolean}
 */
export function isCompatibleWithProfiles(recipe, profileIds) {
  if (!profileIds || profileIds.length === 0) return true;
  if (!recipe || !recipe.tags) return false;

  const recipeDiets = recipe.tags.diets || [];
  
  // If recipe has no diet tags, consider it compatible
  if (recipeDiets.length === 0) return true;

  // Recipe must be compatible with ALL profiles
  for (const profileId of profileIds) {
    if (!recipeDiets.includes(profileId)) {
      // Check if recipe has a compatible parent profile
      const profile = getDietProfileById(profileId);
      const compatible = profile?.compatibleWith || [];
      
      const hasCompatible = recipeDiets.some(d => compatible.includes(d));
      if (!hasCompatible) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Detect conflicts in a set of diet profiles
 * @param {string[]} profileIds
 * @returns {Object} Conflict information
 */
export function hasProfileConflicts(profileIds) {
  if (!profileIds || profileIds.length <= 1) {
    return { hasConflicts: false, conflictPairs: [] };
  }

  const conflicts = [];

  for (let i = 0; i < profileIds.length; i++) {
    for (let j = i + 1; j < profileIds.length; j++) {
      const profile1 = profileIds[i];
      const profile2 = profileIds[j];

      // Check conflict matrix
      if (PROFILE_CONFLICTS[profile1]?.includes(profile2)) {
        conflicts.push([profile1, profile2]);
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflictPairs: conflicts
  };
}

/**
 * Filter recipes by excluding specific ingredients
 * @param {Array} recipes
 * @param {string[]} excludeIngredients
 * @returns {Array} Filtered recipes
 */
export function filterByExclusions(recipes, excludeIngredients) {
  if (!excludeIngredients || excludeIngredients.length === 0) {
    return recipes;
  }

  const exclusions = excludeIngredients.map(e => e.toLowerCase());

  return recipes.filter(recipe => {
    const ingredientNames = (recipe.ingredients || [])
      .map(i => i.name.toLowerCase());

    // Check if any ingredient matches an exclusion
    const hasExcluded = exclusions.some(excluded =>
      ingredientNames.some(name => name.includes(excluded))
    );

    return !hasExcluded;
  });
}

/**
 * Prioritize recipes containing preferred ingredients
 * @param {Array} recipes
 * @param {string[]} preferIngredients
 * @returns {Array} Sorted recipes (preferred first)
 */
export function prioritizeByPreferences(recipes, preferIngredients) {
  if (!preferIngredients || preferIngredients.length === 0) {
    return recipes;
  }

  const preferences = preferIngredients.map(p => p.toLowerCase());

  return [...recipes].sort((a, b) => {
    const aIngredients = (a.ingredients || []).map(i => i.name.toLowerCase());
    const bIngredients = (b.ingredients || []).map(i => i.name.toLowerCase());

    const aMatches = preferences.filter(pref =>
      aIngredients.some(name => name.includes(pref))
    ).length;

    const bMatches = preferences.filter(pref =>
      bIngredients.some(name => name.includes(pref))
    ).length;

    return bMatches - aMatches;  // Higher matches first
  });
}

/**
 * Get compatible recipes for a household with multiple eaters
 * @param {Array} catalog - Recipe catalog
 * @param {Array} eaters - Household eaters
 * @returns {Object} Compatible recipes by group
 */
export function getCompatibleRecipesForHousehold(catalog, eaters) {
  // Get all unique diet profiles
  const profileIds = [...new Set(eaters.map(e => e.dietProfile).filter(Boolean))];
  
  // Check for conflicts
  const { hasConflicts, conflictPairs } = hasProfileConflicts(profileIds);

  // If no conflicts, find recipes compatible with all
  if (!hasConflicts) {
    let compatible = catalog;
    
    // Filter by profiles
    if (profileIds.length > 0) {
      compatible = compatible.filter(r => isCompatibleWithProfiles(r, profileIds));
    }

    // Filter by all exclusions
    const allExclusions = eaters.flatMap(e => e.excludeIngredients || []);
    compatible = filterByExclusions(compatible, allExclusions);

    return {
      hasConflicts: false,
      sharedRecipes: compatible,
      groups: null
    };
  }

  // If conflicts exist, create groups
  const groups = profileIds.map(profileId => {
    const eatersInGroup = eaters.filter(e => e.dietProfile === profileId);
    const exclusions = eatersInGroup.flatMap(e => e.excludeIngredients || []);
    
    let groupRecipes = filterByDietProfile(catalog, profileId);
    groupRecipes = filterByExclusions(groupRecipes, exclusions);

    return {
      profileId,
      eaters: eatersInGroup,
      recipes: groupRecipes
    };
  });

  return {
    hasConflicts: true,
    conflictPairs,
    groups,
    sharedRecipes: []
  };
}
