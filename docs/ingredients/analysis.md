# Ingredient Catalog Analysis

**Date:** January 9, 2026  
**Catalog Version:** 2.0.0  
**Recipes Analyzed:** 622

## Executive Summary

Analysis of the Spoonacular recipe catalog reveals **1,825 unique ingredient strings** across **7,183 total ingredient occurrences**. The top 200 ingredients account for **66.9% of all occurrences**, making them the ideal target for the master ingredient dictionary.

## Key Statistics

| Metric | Value |
|--------|-------|
| Total recipes | 622 |
| Total ingredient occurrences | 7,183 |
| Unique ingredient strings | 1,825 |
| Naive identity clusters | 1,755 |

## Coverage Analysis

Building a master dictionary with the most common ingredients provides excellent coverage:

| Top N Ingredients | Occurrences | Coverage |
|-------------------|-------------|----------|
| Top 50 | 2,933 | 40.8% |
| Top 100 | 3,889 | 54.1% |
| **Top 200** | **4,808** | **66.9%** ✅ |
| Top 300 | 5,261 | 73.2% |

## Top 20 Most Common Ingredients

1. **garlic** - 217 occurrences (214 recipes)
2. **onion** - 202 occurrences (197 recipes)
3. **salt** - 199 occurrences (190 recipes)
4. **olive oil** - 198 occurrences (189 recipes)
5. **water** - 122 occurrences (118 recipes)
6. **salt and pepper** - 108 occurrences (106 recipes) ⚠️ *compound*
7. **butter** - 98 occurrences (96 recipes)
8. **pepper** - 97 occurrences (93 recipes)
9. **bell pepper** - 92 occurrences (83 recipes)
10. **parsley** - 80 occurrences (79 recipes)
11. **sugar** - 75 occurrences (73 recipes)
12. **lemon juice** - 71 occurrences (70 recipes)
13. **carrots** - 63 occurrences (63 recipes)
14. **flour** - 57 occurrences (55 recipes)
15. **soy sauce** - 56 occurrences (52 recipes)
16. **ginger** - 55 occurrences (55 recipes)
17. **eggs** - 53 occurrences (53 recipes)
18. **cilantro** - 53 occurrences (53 recipes)
19. **tomatoes** - 48 occurrences (48 recipes)
20. **garlic cloves** - 45 occurrences (44 recipes) ⚠️ *variant of #1*

## Key Patterns Identified

### 1. Compound Ingredients
Some ingredient strings contain multiple items that should be split:
- `salt and pepper` (#6) → should become `salt` + `pepper`

### 2. Variants of Same Ingredient
Multiple strings refer to the same ingredient:
- `garlic` (#1) + `garlic cloves` (#20) → same ingredient
- Identity clusters show 4 garlic variants: `clove garlic`, `cloves garlic`, `garlic`, `½ garlic`

### 3. State Variations
Tomatoes appear in multiple forms:
- `tomatoes` (fresh)
- `canned tomatoes`
- `ground tomatoes`

These should be **separate master IDs** since they're different products to purchase.

### 4. Unit Prefix Noise
Many strings include quantity/unit prefixes:
- `tablespoons olive oil` → identity: `olive oil`
- `tbsp olive oil` → identity: `olive oil`
- `.5 oz tomatoes` → identity: `tomatoes`

## Recommendations

### Master Dictionary Size
**Target: 200-300 entries** to achieve 66.9-73.2% coverage

**Phase 1 (MVP): Top 100 ingredients** → 54.1% coverage  
**Phase 2: Top 200 ingredients** → 66.9% coverage  
**Phase 3: Top 300 ingredients** → 73.2% coverage

### Priority Focus Areas

1. **Core ingredients** (top 50): garlic, onion, salt, olive oil, etc.
2. **State variations**: Identify fresh/frozen/canned/dried variants
3. **Compound splitting**: Handle "salt and pepper" cases
4. **Variant consolidation**: Merge "garlic" + "garlic cloves" + "clove garlic"

### Density Mapping Priorities

Focus density data collection on:
1. Top 50 ingredients (highest ROI)
2. Common vegetables (onion, garlic, tomatoes, peppers)
3. Common liquids (water, broth, milk, oil)
4. Common dry goods (flour, sugar, rice)

## Data Files

Analysis outputs are available in `tmp/`:

- **catalogUniqueIngredients.json** (1,825 entries)
  - Full frequency data for all unique ingredient strings
  - Sorted by occurrence count (most common first)
  
- **ingredientIdentityCandidates.json** (1,755 clusters)
  - Naive clustering by ingredient identity
  - Shows variants that should likely map to same master ID
  
- **ingredientAnalysisSummary.txt**
  - Human-readable summary report
  - Same stats as this document

## Next Steps

1. ✅ **Complete** - Catalog analysis
2. **Next** - Design master dictionary schema with top 100-200 ingredients
3. Build parsing utilities for quantity/unit/identity/preparation/state extraction
4. Implement matching utilities with fuzzy matching
5. Create volume-to-weight conversion utilities with density data
6. Normalize all 622 catalog recipes
7. Update shopping list generation
8. Wire into import flows

---

**Analysis generated:** 2026-01-09T23:15:36.266Z  
**Script:** `scripts/analyzeCatalogIngredients.js`
