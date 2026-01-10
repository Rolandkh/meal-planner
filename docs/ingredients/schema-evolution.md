# Ingredient Master Schema Evolution
**Version:** 2.1.0 → 3.0.0  
**Date:** January 10, 2026  
**Task:** 98.3 - Data model design

---

## 📋 Overview

This document defines the updated schema for `ingredientMaster.json` to support:
- Synonym/alias management for variant matching
- Optional regex patterns for complex matching
- Compound ingredient classification
- Enhanced metadata for filtering
- Backward compatibility with v2.1.0

---

## 🎯 Design Goals

1. **Backward Compatible:** Existing code continues to work
2. **Synonym-Driven:** Multiple text variants map to single canonical ID
3. **Pattern-Based Matching:** Optional regex for complex cases
4. **Metadata-Rich:** Support filtering, categorization, substitutions
5. **Maintainable:** Clear structure, easy to edit manually or programmatically

---

## 📦 Schema Comparison

### Current Schema (v2.1.0)

```json
{
  "ingredients": {
    "garlic": {
      "id": "garlic",
      "displayName": "garlic",
      "canonicalUnit": "g",
      "state": "fresh",
      "density": {
        "gPerCup": 136,
        "gPerTbsp": 8.5,
        "gPerTsp": 2.8
      },
      "aliases": ["garlic", "garlic cloves", "clove garlic"],
      "tags": ["vegetable", "aromatic", "protective"]
    }
  }
}
```

### New Schema (v3.0.0)

```json
{
  "ingredients": {
    "garlic": {
      "id": "garlic",
      "displayName": "garlic",
      "canonicalUnit": "g",
      "state": "fresh",
      "density": {
        "gPerCup": 136,
        "gPerTbsp": 8.5,
        "gPerTsp": 2.8
      },
      "aliases": ["garlic", "garlic cloves", "clove garlic"],
      "synonyms": ["ajo", "lehsun"],
      "patterns": null,
      "category": "vegetable",
      "subCategory": "aromatic",
      "tags": ["protective", "antimicrobial"],
      "metadata": {
        "commonPreparations": ["minced", "chopped", "roasted"],
        "seasonality": "year-round",
        "storageType": "pantry"
      }
    }
  }
}
```

---

## 🔑 Field Definitions

### Core Identity Fields

**`id`** (string, required)
- Unique stable identifier
- Format: lowercase, underscore-separated
- Examples: `"garlic"`, `"canned_tomatoes"`, `"all_purpose_flour"`
- **CRITICAL:** Never change existing IDs (breaking change)

**`displayName`** (string, required)
- Human-readable name for UI display
- Used in shopping lists, recipe views
- Examples: `"garlic"`, `"canned tomatoes"`, `"all purpose flour"`

**`canonicalUnit`** (string, required)
- Primary unit for this ingredient
- Values: `"g"` (solids), `"ml"` (liquids), `"whole"` (countable)
- Used for shopping list aggregation

**`state`** (string, required)
- Product state classification
- Values: `"fresh"`, `"frozen"`, `"canned"`, `"dried"`, `"other"`
- **Key concept:** State is a product variation (fresh spinach ≠ frozen spinach)

---

### Quantity & Conversion Fields

**`density`** (object, optional)
- Enables volume→weight conversion
- Fields:
  - `gPerCup` (number|null): Grams per US cup (240ml)
  - `gPerTbsp` (number|null): Grams per tablespoon (15ml)
  - `gPerTsp` (number|null): Grams per teaspoon (5ml)
- Required for ingredients commonly measured by volume
- Can be null for count-based or weight-only ingredients

**Example:**
```json
{
  "density": {
    "gPerCup": 160,
    "gPerTbsp": 10,
    "gPerTsp": 3.3
  }
}
```

---

### Matching & Synonym Fields

**`aliases`** (array, required)
- **EXISTING FIELD** - maintain backward compatibility
- Common text variants used in recipes
- Includes: spelling variations, plural/singular, common descriptors
- Used by exact and token matching stages
- Examples: `["garlic", "garlic cloves", "clove garlic", "fresh garlic"]`

**`synonyms`** (array, optional) ⭐ NEW
- Alternative names in other languages or regions
- NOT used for automatic matching (prevents false positives)
- Used for manual lookup, educational purposes, substitution hints
- Examples: `["ajo", "lehsun"]` (Spanish, Hindi for garlic)

**`patterns`** (string|null, optional) ⭐ NEW
- Regular expression for complex matching cases
- Use sparingly - most matching should use aliases
- Format: JavaScript regex string (no delimiters)
- Examples:
  ```json
  {
    "patterns": "(portobello|portabella|bella)\\s*mushroom"
  }
  ```
- **Warning:** Escape special chars, test thoroughly for allergen safety

---

### Classification Fields

**`category`** (string, optional) ⭐ NEW
- High-level ingredient category
- Values: `"vegetable"`, `"fruit"`, `"grain"`, `"protein"`, `"dairy"`, `"spice"`, `"condiment"`, `"fat"`, `"sweetener"`, `"beverage"`, `"other"`
- Replaces top-level tag in old schema
- Used for filtering, grouping, diet compatibility

**`subCategory`** (string, optional) ⭐ NEW
- More specific classification within category
- Examples:
  - vegetable: `"leafy"`, `"root"`, `"allium"`, `"cruciferous"`, `"nightshade"`
  - protein: `"poultry"`, `"seafood"`, `"legume"`, `"red-meat"`
  - grain: `"whole"`, `"refined"`, `"pseudo-grain"`

**`tags`** (array, optional)
- **CHANGED** - now focused on properties, not categories
- Values: `"protective"`, `"antimicrobial"`, `"anti-inflammatory"`, `"probiotic"`, `"fermented"`, `"processed"`, `"ultra-processed"`
- Used by Diet Compass scoring
- Must align with `ingredientHealthData.json` tags

---

### Metadata & Enhancement Fields

**`metadata`** (object, optional) ⭐ NEW
- Additional information for future features
- Not used in core normalization logic
- Fields:
  - `commonPreparations` (array): Typical prep methods
  - `seasonality` (string): When ingredient is in season
  - `storageType` (string): `"refrigerator"`, `"freezer"`, `"pantry"`
  - `averageWeight` (object): For whole items (e.g., "1 onion" = ~110g)
  - `substitutes` (array): Common substitution ingredient IDs
  - `allergens` (array): Allergen flags
  - `notes` (string): Free-text notes

**Example:**
```json
{
  "metadata": {
    "commonPreparations": ["diced", "sliced", "grilled"],
    "seasonality": "summer",
    "storageType": "refrigerator",
    "averageWeight": {
      "value": 200,
      "unit": "g",
      "variance": 50
    },
    "substitutes": ["red_bell_pepper", "yellow_bell_pepper"],
    "allergens": ["nightshade"],
    "notes": "Choose firm peppers without wrinkles"
  }
}
```

---

## 🆕 New Special Ingredients

### Unknown Ingredient Placeholder

```json
{
  "unknown_ingredient": {
    "id": "unknown_ingredient",
    "displayName": "unknown ingredient",
    "canonicalUnit": "g",
    "state": "other",
    "density": null,
    "aliases": ["unknown", "unrecognized"],
    "category": "other",
    "tags": ["placeholder"],
    "metadata": {
      "notes": "Fallback for unrecognized ingredients"
    }
  }
}
```

**Purpose:** Graceful degradation when matching fails

**Behavior:**
- Used as masterId when no match found
- Prevents system crashes
- Logged for review via diagnostics
- Neutral impact on Diet Compass scoring

---

## 📊 Migration Strategy

### Backward Compatibility Checklist

✅ **Existing fields preserved:**
- `id`, `displayName`, `canonicalUnit`, `state`
- `density` (unchanged structure)
- `aliases` (unchanged structure)
- `tags` (semantic change but same type)

✅ **New fields are optional:**
- Code without new fields works normally
- Gradual migration possible

✅ **Matching logic unchanged:**
- `ingredientMatcher.js` uses `aliases` (existing)
- New `patterns` field is opt-in enhancement

### Migration Path

**Phase 1: Add new fields (non-breaking)**
```javascript
// Old code continues to work
const ingredient = getMasterIngredient('garlic');
console.log(ingredient.aliases); // ✅ Works

// New code can use new fields
console.log(ingredient.category); // undefined or "vegetable"
console.log(ingredient.synonyms); // undefined or ["ajo"]
```

**Phase 2: Populate new fields incrementally**
- Add `category` and `subCategory` to high-priority ingredients
- Add `synonyms` for multi-language support (future)
- Add `patterns` only where strictly needed
- Add `metadata` for enhanced features

**Phase 3: Version bump**
- Update `_version` to `"3.0.0"`
- Update `_schema` documentation in JSON file
- Keep `_lastUpdated` timestamp current

---

## 🎨 Design Patterns

### Pattern 1: Simple Ingredient (Most Common)

```json
{
  "onion": {
    "id": "onion",
    "displayName": "onion",
    "canonicalUnit": "g",
    "state": "fresh",
    "density": {
      "gPerCup": 160,
      "gPerTbsp": 10,
      "gPerTsp": 3.3
    },
    "aliases": [
      "onion", "onions", 
      "yellow onion", "white onion", "brown onion",
      "cooking onion"
    ],
    "category": "vegetable",
    "subCategory": "allium",
    "tags": ["protective", "anti-inflammatory"]
  }
}
```

### Pattern 2: Spelling Variants

```json
{
  "portobello_mushroom": {
    "id": "portobello_mushroom",
    "displayName": "portobello mushroom",
    "canonicalUnit": "g",
    "state": "fresh",
    "density": {
      "gPerCup": 86,
      "gPerTbsp": null,
      "gPerTsp": null
    },
    "aliases": [
      "portobello mushroom", "portobello mushrooms",
      "portabella mushroom", "portabella mushrooms",
      "bella mushroom", "bella mushrooms",
      "portobello", "portabella"
    ],
    "category": "vegetable",
    "subCategory": "mushroom"
  }
}
```

### Pattern 3: State Variations (Separate Entries)

```json
{
  "spinach": {
    "id": "spinach",
    "displayName": "spinach",
    "state": "fresh",
    "aliases": ["fresh spinach", "spinach leaves", "baby spinach"]
  },
  "frozen_spinach": {
    "id": "frozen_spinach",
    "displayName": "frozen spinach",
    "state": "frozen",
    "aliases": ["frozen spinach", "frozen chopped spinach"]
  }
}
```

### Pattern 4: Complex Pattern Matching (Use Sparingly)

```json
{
  "bell_pepper": {
    "id": "bell_pepper",
    "displayName": "bell pepper",
    "state": "fresh",
    "aliases": [
      "bell pepper", "bell peppers",
      "sweet pepper", "sweet peppers",
      "red bell pepper", "green bell pepper", "yellow bell pepper"
    ],
    "patterns": "(red|green|yellow|orange)\\s*(bell\\s*)?pepper",
    "category": "vegetable",
    "subCategory": "nightshade"
  }
}
```

---

## 🔒 Data Validation Rules

### Required Field Validation

```javascript
function validateIngredient(ingredient) {
  const required = ['id', 'displayName', 'canonicalUnit', 'state', 'aliases'];
  
  for (const field of required) {
    if (!ingredient[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // ID format validation
  if (!/^[a-z0-9_]+$/.test(ingredient.id)) {
    throw new Error(`Invalid ID format: ${ingredient.id}`);
  }
  
  // State validation
  const validStates = ['fresh', 'frozen', 'canned', 'dried', 'other'];
  if (!validStates.includes(ingredient.state)) {
    throw new Error(`Invalid state: ${ingredient.state}`);
  }
  
  // Aliases must be array
  if (!Array.isArray(ingredient.aliases) || ingredient.aliases.length === 0) {
    throw new Error(`Aliases must be non-empty array`);
  }
  
  return true;
}
```

### Data Integrity Rules

1. **No Duplicate IDs:** All ingredient IDs must be unique
2. **No Duplicate Aliases:** Same alias cannot appear in multiple ingredients
3. **Consistent State:** State must match across ID and aliases
4. **Density Completeness:** If any density field is set, gPerCup should be set
5. **Tag Alignment:** Tags should exist in `ingredientHealthData.json` (warning only)

---

## 📚 Schema Documentation in JSON

Update `ingredientMaster.json` header:

```json
{
  "_version": "3.0.0",
  "_lastUpdated": "2026-01-10T00:05:00.000Z",
  "_totalEntries": 584,
  "_coverage": "Comprehensive catalog coverage with synonym support",
  "_schema": {
    "id": "Unique stable identifier (lowercase, underscore-separated)",
    "displayName": "Human-readable name for UI display",
    "canonicalUnit": "Primary unit (g for solids, ml for liquids, whole for countable)",
    "state": "Product state: fresh | frozen | canned | dried | other",
    "density": {
      "gPerCup": "Grams per US cup (240ml), null if not applicable",
      "gPerTbsp": "Grams per tablespoon (15ml), null if not applicable",
      "gPerTsp": "Grams per teaspoon (5ml), null if not applicable"
    },
    "aliases": "Array of common text variants for matching (REQUIRED)",
    "synonyms": "Array of alternative names (other languages/regions) - NEW",
    "patterns": "Optional regex pattern for complex matching - NEW",
    "category": "High-level category (vegetable, protein, etc.) - NEW",
    "subCategory": "Specific classification within category - NEW",
    "tags": "Property tags for Diet Compass (protective, processed, etc.)",
    "metadata": "Optional additional information for future features - NEW"
  },
  "ingredients": { ... }
}
```

---

## ✅ Implementation Checklist

**Code Updates Required:**

- [ ] Update `ingredientMaster.js` to handle new fields (backward compatible)
- [ ] Update matcher to optionally use `patterns` field
- [ ] Add validation utility for schema compliance
- [ ] Update documentation references

**Code Updates NOT Required (backward compatible):**

- ✅ `ingredientParsing.js` - no changes needed
- ✅ `ingredientQuantities.js` - no changes needed
- ✅ `normalizeRecipeIngredients.js` - no changes needed
- ✅ Existing catalog recipes - continue to work

**Data Updates:**

- [ ] Add `unknown_ingredient` entry
- [ ] Populate `category` for existing ingredients
- [ ] Add new high-priority ingredients (Task 98.6)
- [ ] Add aliases for spelling variants
- [ ] Update version to 3.0.0

---

## 📝 Summary

**Key Changes:**
- ⭐ `synonyms` field for multi-language support
- ⭐ `patterns` field for regex matching (opt-in)
- ⭐ `category` and `subCategory` for better organization
- ⭐ `metadata` object for future enhancements
- ⭐ `unknown_ingredient` placeholder for fallback

**Backward Compatibility:**
- All existing fields preserved
- New fields are optional
- Existing code works unchanged
- Gradual migration possible

**Next Steps:**
- Implement compound splitting utility (Task 98.4)
- Enhance matching algorithm (Task 98.5)
- Expand dictionary systematically (Task 98.6)

---

**Document Status:** ✅ Complete  
**Next Task:** 98.4 - Implement compound splitting utility
