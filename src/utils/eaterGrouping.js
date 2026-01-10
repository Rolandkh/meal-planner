/**
 * Eater Grouping Utility
 * Groups eaters by compatible diet profiles for multi-profile meal generation
 */

import { hasProfileConflicts } from './dietProfileFilter.js';

/**
 * Group eaters by compatible diet profiles
 * Eaters with conflicting profiles are placed in separate groups
 * 
 * @param {Array} eaters - Array of eater objects with dietProfile field
 * @returns {Array} Array of eater groups, each group can share the same recipe
 * 
 * @example
 * const eaters = [
 *   { eaterId: '1', name: 'Mom', dietProfile: 'keto' },
 *   { eaterId: '2', name: 'Dad', dietProfile: 'vegan' },
 *   { eaterId: '3', name: 'Kids', dietProfile: 'kid-friendly' }
 * ];
 * const groups = groupEatersByCompatibleProfiles(eaters);
 * // Returns: [
 * //   [{ eaterId: '1', name: 'Mom', dietProfile: 'keto' }],
 * //   [{ eaterId: '2', name: 'Dad', dietProfile: 'vegan' }]
 * // ]
 * // Note: kid-friendly can be added to either group or both
 */
export function groupEatersByCompatibleProfiles(eaters) {
  if (!eaters || eaters.length === 0) {
    return [];
  }

  // If only one eater, return single group
  if (eaters.length === 1) {
    return [eaters];
  }

  const groups = [];
  const processed = new Set();

  // Separate flexible eaters (kid-friendly, flexitarian) from strict profiles
  const flexibleProfiles = ['kid-friendly', 'flexitarian', 'mediterranean'];
  const flexibleEaters = eaters.filter(e => 
    !e.dietProfile || flexibleProfiles.includes(e.dietProfile)
  );
  const strictEaters = eaters.filter(e => 
    e.dietProfile && !flexibleProfiles.includes(e.dietProfile)
  );

  // Group strict eaters by compatibility
  for (let i = 0; i < strictEaters.length; i++) {
    if (processed.has(i)) continue;

    const group = [strictEaters[i]];
    processed.add(i);

    // Try to add other strict eaters to this group
    for (let j = i + 1; j < strictEaters.length; j++) {
      if (processed.has(j)) continue;

      // Check if this eater is compatible with ALL eaters in the current group
      const profileIds = [
        ...group.map(e => e.dietProfile),
        strictEaters[j].dietProfile
      ].filter(Boolean);

      const conflict = hasProfileConflicts(profileIds);

      if (!conflict.hasConflicts) {
        group.push(strictEaters[j]);
        processed.add(j);
      }
    }

    groups.push(group);
  }

  // If no strict groups were created, create a single group for all eaters
  if (groups.length === 0 && flexibleEaters.length > 0) {
    groups.push([...flexibleEaters]);
  } else {
    // Add flexible eaters to ALL groups (they can eat any recipe)
    groups.forEach(group => {
      group.push(...flexibleEaters);
    });
  }

  return groups;
}

/**
 * Check if a household needs multi-profile meal generation
 * @param {Array} eaters - Array of eater objects
 * @returns {boolean} True if household has conflicting profiles
 */
export function needsMultiProfileGeneration(eaters) {
  if (!eaters || eaters.length <= 1) {
    return false;
  }

  const profileIds = eaters
    .map(e => e.dietProfile)
    .filter(Boolean);

  if (profileIds.length <= 1) {
    return false;
  }

  const { hasConflicts } = hasProfileConflicts(profileIds);
  return hasConflicts;
}

/**
 * Get a descriptive label for an eater group
 * @param {Array} eaterGroup - Group of eaters
 * @returns {string} Human-readable label
 */
export function getGroupLabel(eaterGroup) {
  if (!eaterGroup || eaterGroup.length === 0) {
    return 'Unknown';
  }

  if (eaterGroup.length === 1) {
    return eaterGroup[0].name;
  }

  // Get unique profile names
  const profiles = [...new Set(
    eaterGroup.map(e => e.dietProfile).filter(Boolean)
  )];

  if (profiles.length === 1) {
    return `${eaterGroup.map(e => e.name).join(', ')} (${profiles[0]})`;
  }

  return eaterGroup.map(e => e.name).join(', ');
}

/**
 * Format eater names for display in UI
 * @param {Array} eaterIds - Array of eater IDs
 * @param {Array} allEaters - All eaters in household
 * @returns {string} Comma-separated names
 */
export function formatEaterNames(eaterIds, allEaters) {
  if (!eaterIds || eaterIds.length === 0) {
    return 'Everyone';
  }

  const names = eaterIds
    .map(id => {
      const eater = allEaters.find(e => e.eaterId === id);
      return eater ? eater.name : null;
    })
    .filter(Boolean);

  return names.length > 0 ? names.join(', ') : 'Everyone';
}
