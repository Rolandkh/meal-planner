# Ingredient Master Dictionary

**Version:** 1.0.0  
**Last Updated:** January 9, 2026  
**Location:** `src/data/ingredientMaster.json`

## Overview

The ingredient master dictionary is the **authoritative reference** for all ingredient normalization, matching, and conversion operations in the Meal Planner application. It provides:

- Canonical ingredient identities
- Volume-to-weight conversion densities
- State/form classifications (fresh, frozen, canned, dried)
- Aliases for flexible matching
- Tags for categorization and filtering

## Schema

Each ingredient entry follows this structure:

```typescript
{
  "id": string;              // Unique stable identifier (lowercase, underscore-separated)
  "displayName": string;     // Human-readable name for UI display
  "canonicalUnit": string;   // Primary unit: "g" | "ml" | "whole"
  "state": string;           // Product state: "fresh" | "frozen" | "canned" | "dried" | "other"
  "density": {
    "gPerCup": number | null;   // Grams per US cup (240ml)
    "gPerTbsp": number | null;  // Grams per tablespoon (15ml)
    "gPerTsp": number | null;   // Grams per teaspoon (5ml)
  } | null;
  "aliases": string[];       // Common text variants for matching
  "tags": string[];          // Optional classification tags
}
```

## Current Coverage

- **Total Entries:** 25 (Phase 1: Foundation)
- **Target:** 100-200 entries for 54.1-66.9% coverage
- **Current Focus:** Top 25 most common ingredients

## Key Design Principles

### 1. Identity vs. Preparation

**Identity** (what you buy):
- `onion` - The actual ingredient
- `garlic` - The actual ingredient
- `parsley` - The actual ingredient

**Preparation** (what you do):
- `chopped` - Instruction, not identity
- `diced` - Instruction, not identity  
- `minced` - Instruction, not identity

**Rule:** Preparation terms are NEVER part of the ingredient ID or aliases.

### 2. State as Identity Modifier

Different product states = different IDs:

```json
"tomatoes": {          // Fresh tomatoes
  "state": "fresh"
},
"tomatoes_canned": {   // Canned tomatoes (different product)
  "state": "canned"
}
```

**Rule:** Fresh vs. frozen vs. canned vs. dried are DIFFERENT products for shopping.

### 3. Density Mappings

Densities enable volume-to-weight conversion:

```json
"onion": {
  "density": {
    "gPerCup": 160,    // 1 cup chopped onion ≈ 160g
    "gPerTbsp": 10,    // 1 tbsp chopped onion ≈ 10g
    "gPerTsp": 3.3     // 1 tsp minced onion ≈ 3.3g
  }
}
```

**Source:** USDA FoodData Central, culinary references, validated measurements.

### 4. Aliases for Flexible Matching

```json
"aliases": [
  "garlic",           // Base form
  "garlic cloves",    // Count variant
  "clove garlic",     // Reversed form
  "cloves garlic",    // Plural variant
  "fresh garlic"      // State variant (still fresh)
]
```

**Rule:** Include common text variations, but DON'T include preparation terms.

## ID Naming Conventions

| Pattern | Example | When to Use |
|---------|---------|-------------|
| `singular_noun` | `onion`, `garlic` | Base ingredients |
| `noun_state` | `tomatoes_canned`, `spinach_frozen` | State-specific variants |
| `compound_noun` | `bell_pepper`, `soy_sauce` | Multi-word names |
| `noun_qualifier` | `olive_oil`, `lemon_juice` | Type-qualified items |

**Rules:**
- Use lowercase
- Use underscores for spaces
- Use singular unless plural is conventional (e.g., "tomatoes")
- State suffix when needed for disambiguation

## Adding New Ingredients

### Step 1: Check if it exists

```javascript
import { getMasterIngredient, findByAlias } from '../utils/ingredientMaster.js';

const existing = getMasterIngredient('new_ingredient');
const byAlias = findByAlias('variant name');
```

### Step 2: Research density values

Sources (in priority order):
1. **USDA FoodData Central** - https://fdc.nal.usda.gov/
2. **Cooking measurement guides** - America's Test Kitchen, King Arthur Baking
3. **Previous internal measurements** - If validated

### Step 3: Add entry

```json
"new_ingredient": {
  "id": "new_ingredient",
  "displayName": "new ingredient",
  "canonicalUnit": "g",  // or "ml" for liquids, "whole" for countable
  "state": "fresh",      // or "frozen", "canned", "dried", "other"
  "density": {
    "gPerCup": 150,      // Research-backed value
    "gPerTbsp": 9.4,     // gPerCup / 16
    "gPerTsp": 3.1       // gPerCup / 48
  },
  "aliases": [
    "new ingredient",
    "new ingredients",
    "common variant"
  ],
  "tags": ["category", "type"]
}
```

### Step 4: Validate

Run validation tests:

```bash
node scripts/validateDictionary.js
```

### Step 5: Update metadata

```json
{
  "_version": "1.1.0",  // Increment version
  "_lastUpdated": "2026-01-10T...",
  "_totalEntries": 26,  // Update count
  ...
}
```

## Common Density References

| Ingredient Type | Typical g/cup | Notes |
|-----------------|---------------|-------|
| Chopped vegetables | 140-180 | Varies by size and packing |
| Leafy herbs (fresh) | 15-60 | Very light, varies by leaf size |
| Liquids | 237-244 | Water baseline ≈ 237g |
| Oils | 216-220 | Less dense than water |
| Flour (all-purpose) | 120 | Sifted vs. packed varies |
| Sugar (granulated) | 200 | Packed vs. loose varies |
| Rice (uncooked) | 185 | Long-grain white |
| Pasta (dry) | 100 | Varies by shape |

## Integration with Health Data

The master dictionary complements `ingredientHealthData.json`:

- **Master Dictionary:** Identity, conversion, shopping
- **Health Data:** Nutrition scores, diet compatibility

Both use the same `id` as the primary key for cross-referencing.

## Future Expansions

### Phase 2 (75 more entries) - Target 54.1% coverage
- Complete top 100 from frequency analysis
- Add common proteins (beef, pork, fish varieties)
- Add common grains (quinoa, oats, barley)
- Add common vegetables (broccoli, spinach, kale)

### Phase 3 (100 more entries) - Target 66.9% coverage
- Complete top 200 from frequency analysis
- Add regional/ethnic ingredients
- Add specialty items (tofu, tempeh, etc.)
- Add baking-specific items

### Phase 4 (Beyond 200)
- User-requested additions
- Recipe-specific rare ingredients
- Regional variations

## Maintenance

### Monthly Review
- Add most-requested missing ingredients
- Update density values if better data available
- Refine aliases based on matching logs

### Quality Checks
- No duplicate IDs
- All required fields present
- Density values reasonable (spot-check against USDA)
- Aliases don't include preparation terms

## Related Documentation

- `docs/ingredients/analysis.md` - Frequency analysis
- `src/utils/ingredientMaster.js` - Loader utility
- `src/utils/ingredientParsing.js` - Parsing logic (Subtask 3)
- `src/utils/ingredientMatcher.js` - Matching logic (Subtask 3)

---

**Questions?** See developer guide or ask in #meal-planner channel.
