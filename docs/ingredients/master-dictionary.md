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
  
  // Volume-to-weight conversions
  "density": {
    "gPerCup": number | null;   // Grams per US cup (240ml)
    "gPerTbsp": number | null;  // Grams per tablespoon (15ml)
    "gPerTsp": number | null;   // Grams per teaspoon (5ml)
  } | null;
  
  "aliases": string[];       // Common text variants for matching
  "tags": string[];          // Optional classification tags
  
  // **NEW: Pricing data (v10.0+)**
  "pricing": {
    "averagePrice": number;    // Average price in AUD
    "unit": string;            // Retail unit: "kg" | "L" | "pack" | "bunch" | etc.
    "unitSize": string;        // Size description: "1kg", "500g", "1L", "6-pack"
    "currency": "AUD";
    "region": "Melbourne, VIC, Australia";
    "lastUpdated": string;     // ISO date
    "source": "manual" | "coles" | "woolworths" | "average";
    "notes": string;           // Optional pricing notes
  };
  
  // **NEW: Base nutrition data (raw state, per 100g)**
  "nutritionBase": {
    "per100g": {
      "calories": number;      // kcal
      "protein": number;       // g
      "carbs": number;         // g
      "fat": number;           // g
      "fiber": number;         // g
      "sugar": number;         // g
      "saturatedFat": number;  // g
      "sodium": number;        // mg
      "cholesterol": number;   // mg
      "vitamins": {
        "vitaminA": number;    // IU or mcg
        "vitaminC": number;    // mg
        "vitaminD": number;    // IU or mcg
        "vitaminE": number;    // mg
        "vitaminK": number;    // mcg
        "thiamin": number;     // mg (B1)
        "riboflavin": number;  // mg (B2)
        "niacin": number;      // mg (B3)
        "b6": number;          // mg
        "folate": number;      // mcg (B9)
        "b12": number;         // mcg
        "pantothenicAcid": number;  // mg (B5)
        // ... all vitamins from Spoonacular
      };
      "minerals": {
        "calcium": number;     // mg
        "iron": number;        // mg
        "magnesium": number;   // mg
        "phosphorus": number;  // mg
        "potassium": number;   // mg
        "zinc": number;        // mg
        "copper": number;      // mg
        "manganese": number;   // mg
        "selenium": number;    // mcg
        // ... all minerals from Spoonacular
      };
    };
    "source": "spoonacular" | "usda" | "manual";
    "spoonacularId": number;   // Spoonacular ingredient ID
    "lastUpdated": string;     // ISO date
  };
  
  // **NEW: Nutrition adjustments by cooking method**
  "nutritionByPreparation": {
    "raw": {
      "multipliers": {
        "calories": 1.0,       // All values = 1.0 (baseline)
        "protein": 1.0,
        "fat": 1.0,
        // ... all nutrients
      }
    };
    "grilled": {
      "multipliers": {
        "calories": number;    // e.g., 0.95 (5% decrease from fat loss)
        "protein": number;     // e.g., 1.1 (concentration from water loss)
        "fat": number;         // e.g., 0.85 (fat renders out)
        // ... other nutrients
      };
      "notes": string;         // Cooking method description
    };
    "baked": { /* similar */ };
    "fried": {
      "multipliers": { /* ... */ };
      "oilAbsorption": number; // Grams of oil per 100g
      "notes": string;
    };
    "boiled": { /* similar */ };
    "steamed": { /* similar */ };
    "air-fried": { /* similar */ };
    // ... additional methods as needed
  };
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
  "tags": ["category", "type"],
  
  // NEW: Add pricing data
  "pricing": {
    "averagePrice": 4.50,
    "unit": "kg",
    "unitSize": "1kg",
    "currency": "AUD",
    "region": "Melbourne, VIC, Australia",
    "lastUpdated": "2026-01-10",
    "source": "manual",
    "notes": "Average of Coles and Woolworths prices"
  },
  
  // NEW: Add base nutrition (fetch from Spoonacular)
  "nutritionBase": {
    "per100g": {
      "calories": 52,
      "protein": 1.2,
      "carbs": 12.0,
      "fat": 0.2,
      "fiber": 2.1,
      "sugar": 4.5,
      "saturatedFat": 0.03,
      "sodium": 4,
      "cholesterol": 0,
      "vitamins": {
        "vitaminA": 450,
        "vitaminC": 15.5,
        // ... fetch all from Spoonacular
      },
      "minerals": {
        "calcium": 22,
        "iron": 0.5,
        // ... fetch all from Spoonacular
      }
    },
    "source": "spoonacular",
    "spoonacularId": 12345,
    "lastUpdated": "2026-01-10"
  },
  
  // NEW: Add preparation multipliers
  "nutritionByPreparation": {
    "raw": {
      "multipliers": {
        "calories": 1.0,
        "protein": 1.0,
        "fat": 1.0,
        "carbs": 1.0,
        "fiber": 1.0,
        "sugar": 1.0,
        "sodium": 1.0
      }
    },
    "grilled": {
      "multipliers": {
        "calories": 0.95,
        "protein": 1.1,
        "fat": 0.85,
        "carbs": 1.05,
        "fiber": 1.1,
        "sugar": 1.05,
        "sodium": 1.2
      },
      "notes": "Grilled until lightly charred, ~15% water loss"
    },
    // ... add other cooking methods
  }
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

## New Fields (v10.0+)

### Pricing Data

**Purpose:** Enable budget calculations, price comparisons, and shopping cost estimates.

**Structure:**
- `averagePrice`: Price in AUD for the retail unit
- `unit`: How the item is typically sold ("kg", "L", "pack", "bunch", etc.)
- `unitSize`: Description of retail packaging ("1kg", "500g bag", "6-pack")
- `region`: Melbourne, VIC, Australia (may expand to other regions later)
- `source`: Where price data came from (manual entry, Coles, Woolworths)
- `lastUpdated`: ISO date of last price check

**Example:**
```json
"chicken_breast": {
  "pricing": {
    "averagePrice": 12.50,
    "unit": "kg",
    "unitSize": "1kg tray",
    "currency": "AUD",
    "region": "Melbourne, VIC, Australia",
    "lastUpdated": "2026-01-10",
    "source": "manual",
    "notes": "Average of Coles ($11.99/kg) and Woolworths ($13.00/kg)"
  }
}
```

**Data Collection:**
1. Check Coles and Woolworths online stores
2. Note the typical package size (e.g., chicken sold per kg, onions per kg, eggs per dozen)
3. Calculate average if prices differ
4. Document source and date

---

### Nutrition Data

**Purpose:** Enable meal plan nutrition calculations, diet compatibility scoring, and health tracking.

#### Base Nutrition (Raw State)

All nutrition values are per 100g in the raw, uncooked state. This provides a consistent baseline.

**Data Source:** Primarily Spoonacular API, supplemented by USDA FoodData Central.

**Fields:**
- **Macronutrients:** calories, protein, carbs, fat, fiber, sugar, saturatedFat
- **Other:** sodium, cholesterol
- **Vitamins:** All vitamins available from Spoonacular (A, C, D, E, K, B-complex)
- **Minerals:** All minerals available (calcium, iron, magnesium, phosphorus, potassium, zinc, etc.)

**Example:**
```json
"chicken_breast": {
  "nutritionBase": {
    "per100g": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6,
      "fiber": 0,
      "sugar": 0,
      "saturatedFat": 1.0,
      "sodium": 74,
      "cholesterol": 85,
      "vitamins": {
        "vitaminA": 0,
        "vitaminC": 0,
        "vitaminD": 0.1,
        "vitaminE": 0.3,
        "vitaminK": 0,
        "thiamin": 0.07,
        "riboflavin": 0.11,
        "niacin": 13.7,
        "b6": 0.6,
        "folate": 4,
        "b12": 0.34,
        "pantothenicAcid": 1.0
      },
      "minerals": {
        "calcium": 15,
        "iron": 0.7,
        "magnesium": 29,
        "phosphorus": 228,
        "potassium": 256,
        "zinc": 1.0,
        "copper": 0.05,
        "manganese": 0.02,
        "selenium": 27
      }
    },
    "source": "spoonacular",
    "spoonacularId": 5062,
    "lastUpdated": "2026-01-10"
  }
}
```

#### Nutrition by Preparation Method

**Purpose:** Adjust nutrition values based on how food is cooked. Cooking changes nutritional content.

**Key Principles:**
1. **Raw = Baseline (1.0):** All multipliers for raw state = 1.0
2. **Water Loss = Concentration:** Grilling/baking concentrates nutrients (1.05-1.15x)
3. **Fat Loss:** Grilling/baking reduces fat (0.85-0.95x)
4. **Oil Absorption:** Frying increases fat and calories significantly (1.4-2.5x)
5. **Nutrient Leaching:** Boiling reduces water-soluble vitamins (0.8-0.95x)

**Cooking Methods:**
- **raw**: Baseline, all = 1.0
- **grilled**: Water loss, some fat loss
- **baked**: Similar to grilled but gentler
- **fried**: Oil absorption, major fat/calorie increase
- **boiled**: Nutrient leaching into water
- **steamed**: Minimal changes, close to raw
- **air-fried**: Between grilling and frying

**Example:**
```json
"chicken_breast": {
  "nutritionByPreparation": {
    "raw": {
      "multipliers": {
        "calories": 1.0,
        "protein": 1.0,
        "fat": 1.0,
        "carbs": 1.0,
        "fiber": 1.0,
        "sugar": 1.0,
        "sodium": 1.0,
        "cholesterol": 1.0,
        "vitamins": { "vitaminA": 1.0, "vitaminC": 1.0, /* ... */ },
        "minerals": { "calcium": 1.0, "iron": 1.0, /* ... */ }
      }
    },
    "grilled": {
      "multipliers": {
        "calories": 0.95,     // Slight fat loss
        "protein": 1.1,       // Water loss concentrates protein
        "fat": 0.85,          // Fat renders out
        "sodium": 1.2,        // Concentration effect
        "cholesterol": 0.9,
        "vitamins": {
          "thiamin": 0.85,    // Heat-sensitive
          "riboflavin": 0.9,
          "niacin": 1.0,      // Stable
          "b6": 0.9,
          "b12": 1.0
        },
        "minerals": {
          "iron": 1.1,        // Concentration
          "zinc": 1.1
        }
      },
      "notes": "Grilled to internal temp 165°F, ~15% water loss"
    },
    "fried": {
      "multipliers": {
        "calories": 1.4,      // Oil absorption
        "protein": 1.05,
        "fat": 2.5,           // Major fat increase
        "sodium": 1.1
      },
      "oilAbsorption": 15,    // 15g oil per 100g chicken
      "notes": "Deep fried in vegetable oil at 350°F"
    },
    "baked": {
      "multipliers": {
        "calories": 0.97,
        "protein": 1.08,
        "fat": 0.9,
        "sodium": 1.15
      },
      "notes": "Baked at 375°F until internal temp 165°F"
    },
    "boiled": {
      "multipliers": {
        "calories": 0.92,
        "protein": 1.12,
        "fat": 0.95,
        "sodium": 0.7,        // Leaches into water
        "vitamins": {
          "thiamin": 0.7,     // Water-soluble loss
          "riboflavin": 0.75,
          "niacin": 0.8,
          "b6": 0.75,
          "folate": 0.65      // Most vulnerable
        }
      },
      "notes": "Boiled in unsalted water"
    },
    "steamed": {
      "multipliers": {
        "calories": 0.98,
        "protein": 1.05,
        "fat": 0.98,
        "sodium": 1.0,
        "vitamins": {
          "thiamin": 0.95,    // Minimal loss
          "riboflavin": 0.98,
          "vitaminC": 0.9
        }
      },
      "notes": "Steamed for 15-20 minutes"
    },
    "air-fried": {
      "multipliers": {
        "calories": 1.05,     // Minimal oil
        "protein": 1.08,
        "fat": 1.15,          // Small oil addition
        "sodium": 1.15
      },
      "oilAbsorption": 3,     // 3g oil per 100g
      "notes": "Air fried at 400°F with light oil spray"
    }
  }
}
```

**Research Sources:**
1. **Spoonacular API:** Compare raw vs cooked ingredient IDs
2. **USDA FoodData Central:** Raw vs cooked comparisons
3. **Nutrition Research:** Studies on cooking method impacts
4. **Culinary Science:** Oil absorption rates, water loss percentages

---

## Data Population Process

### Automated Enrichment Script

**File:** `scripts/enrichIngredientCatalog.js`

**Process:**
1. Read existing ingredientMaster.json
2. For each ingredient:
   - Fetch Spoonacular nutrition data
   - Calculate preparation multipliers
   - Add manual pricing data (from collected spreadsheet)
   - Validate completeness
   - Update entry
3. Save enriched catalog
4. Generate report

**Usage:**
```bash
node scripts/enrichIngredientCatalog.js
```

### Spoonacular API Integration

**Key Endpoints:**
- `GET /food/ingredients/search` - Find ingredient ID
- `GET /food/ingredients/{id}/information?amount=100&unit=grams` - Get nutrition per 100g

**Daily Limit:** 150 requests on free tier (sufficient for 200 ingredients over 2 days)

---

## Related Documentation

- `docs/ingredients/analysis.md` - Frequency analysis
- `src/utils/ingredientMaster.js` - Loader utility
- `src/utils/ingredientParsing.js` - Parsing logic
- `src/utils/ingredientMatcher.js` - Matching logic
- `src/utils/spoonacularNutrition.js` - Spoonacular API integration (new)
- `scripts/enrichIngredientCatalog.js` - Automated data population (new)

---

**Questions?** See developer guide or ask in #meal-planner channel.
