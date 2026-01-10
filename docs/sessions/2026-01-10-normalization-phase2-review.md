# Ingredient Normalization Pipeline Review
**Date:** January 10, 2026  
**Task:** 98.1 - Review existing implementation  
**Status:** ✅ Complete

---

## System Architecture Overview

### 🏗️ Pipeline Flow

```
Raw Ingredient Text
        ↓
1. PARSING (ingredientParsing.js)
   ├─ Extract quantity/unit
   ├─ Identify state (fresh/frozen/canned/dried)
   ├─ Separate identity from preparation
   └─ Output: { quantity, unit, identityText, state, preparation[] }
        ↓
2. MATCHING (ingredientMatcher.js)
   ├─ Stage 1: Exact ID/alias match
   ├─ Stage 2: Token-normalized match (Jaccard)
   ├─ Stage 3: Fuzzy match (Levenshtein)
   └─ Output: { masterId, confidence, matchedAlias }
        ↓
3. CONVERSION (ingredientQuantities.js)
   ├─ Convert volume → weight using density
   ├─ Normalize to canonical units (g/ml)
   └─ Output: { normalizedQuantityG, normalizedQuantityMl }
        ↓
4. NORMALIZATION (normalizeRecipeIngredients.js)
   ├─ Combine parse + match + convert
   ├─ Build normalizedIngredients array
   └─ Output: Recipe with normalized data
```

---

## 📦 Core Components

### 1. Master Dictionary (`ingredientMaster.json`)

**Current Status:**
- **Version:** 2.1.0
- **Entries:** 584 ingredients
- **Last Updated:** 2026-01-09T23:37:11.825Z
- **Coverage:** Top 600 ingredients from catalog analysis

**Schema:**
```json
{
  "id": "garlic",
  "displayName": "garlic",
  "canonicalUnit": "g",
  "state": "fresh|frozen|canned|dried|other",
  "density": {
    "gPerCup": 136,
    "gPerTbsp": 8.5,
    "gPerTsp": 2.8
  },
  "aliases": ["garlic", "garlic cloves", "clove garlic"],
  "tags": ["vegetable", "aromatic", "protective"]
}
```

**State Distribution:**
- Fresh: 370 ingredients (63.4%)
- Other: 202 ingredients (34.6%)
- Canned: 11 ingredients (1.9%)
- Dried: 1 ingredient (0.2%)

**Key Features:**
- Stable IDs (lowercase, underscore-separated)
- Comprehensive aliases for matching
- Density data for volume→weight conversion
- Tags for categorization (future use)

---

### 2. Parsing Engine (`ingredientParsing.js`)

**Responsibilities:**
- Convert fractions to decimals (vulgar + standard)
- Extract quantity and unit via regex
- Classify tokens into identity vs preparation
- Determine state (dictionary-driven + heuristics)

**State Detection (Critical Feature):**
- **Primary:** Dictionary lookup via `STATE_LOOKUP` map (1,091 mappings)
- **Secondary:** Keyword fallback for unknown ingredients
- **Automatic sync:** STATE_LOOKUP built from dictionary at module load

**Token Classification:**
- **Identity:** What you buy ("onion", "frozen spinach")
- **Preparation:** What you do ("chopped", "diced", "minced")
- **State:** Product variation ("fresh", "frozen", "canned")
- **Removed:** Quality descriptors, noise words ("large", "organic", "can of")

**Supported Units:**
- Volume: cup, tbsp, tsp, ml, l
- Weight: g, kg, oz, lb
- Count: whole, piece, clove, bunch, stalk, sprig

---

### 3. Matching Engine (`ingredientMatcher.js`)

**Multi-Stage Strategy:**

**Stage 1: Exact Match (confidence: 1.0)**
- Direct lookup in alias index
- State bonus: +0.05 if states match

**Stage 2: Token Match (confidence: 0.6-1.0)**
- Jaccard similarity on token sets
- Removes stopwords ("of", "and", "the")
- Threshold: ≥0.6 similarity required
- State bonus: +0.1 if states match

**Stage 3: Fuzzy Match (confidence: 0.5-1.0)**
- Levenshtein distance calculation
- Max distance: 20% of string length
- Conservative threshold for allergen safety
- State bonus: +0.05 if states match

**Performance Optimizations:**
- Pre-built alias index at module load
- Pre-built token index for all ingredients
- Cached normalized forms

---

### 4. Quantity Conversion (`ingredientQuantities.js`)

**Capabilities:**
- Direct weight conversion (g, kg, oz, lb → g)
- Volume→weight via density (cup, tbsp, tsp → g)
- Volume preservation (ml tracking)
- Aggregation for shopping lists

**Density-Based Conversion:**
```javascript
// Example: "1 cup onion" → 160g
// Uses ingredient.density.gPerCup from master dictionary
```

**Rounding:**
- Weight: Rounds to nearest gram
- Volume: Preserves ml for liquids

---

### 5. Normalization Pipeline (`normalizeRecipeIngredients.js`)

**Process:**
1. Check idempotency (skip if already normalized)
2. Parse each ingredient
3. Match to master dictionary
4. Convert quantities
5. Build `normalizedIngredients` array
6. Track diagnostics

**Output Structure:**
```javascript
{
  masterIngredientId: "onion",
  displayName: "onion",
  quantity: {
    originalQuantity: 1,
    originalUnit: "cup",
    normalizedQuantityG: 160,
    normalizedQuantityMl: null
  },
  state: "fresh",
  preparation: ["chopped"],
  rawText: "1 cup chopped onion",
  matchConfidence: 1.0
}
```

**Status Codes:**
- `complete`: All ingredients matched
- `partial`: Some ingredients unmatched
- `complete_with_warnings`: All matched but low confidence/missing density
- `no_ingredients`: Recipe has no ingredients array

---

## 📊 Current Performance

**Match Rate Calculation:**
- **Source:** `tmp/normalization_diagnostics.json`
- **Total Ingredients:** 7,183 (across 622 recipes)
- **Matched:** 6,287 (87.5%)
- **Unmatched:** 896 (12.5%)

**Recipe-Level Stats:**
- **Fully Normalized:** 190/622 recipes (30.5%)
- **Partially Normalized:** 432/622 recipes (69.5%)
- **Failed:** 0 recipes (0%)

**Bottlenecks:**
- Limited dictionary coverage (584 entries)
- No compound splitting ("salt and pepper")
- No fallback for malformed strings
- No handling for rare variants

---

## 🔗 Integration Points

### Consumers of Normalized Data:

**1. Shopping List Generator** (`normalizedShoppingList.js`)
- Aggregates by `(masterIngredientId, state)`
- Sums `normalizedQuantityG`
- Formats for display
- **Benefit:** Eliminates duplication (chopped onion + diced onion → onion)

**2. Spoonacular Import** (Future)
- Auto-normalizes during extraction
- Stores both raw and normalized forms
- Enables immediate catalog integration

**3. Recipe Edit/Import UI** (Future - Task 98 scope)
- Client-side normalization
- Real-time matching feedback
- Unrecognized ingredient badges

**4. Diet Compass Scoring** (Task 83)
- Uses master IDs for health data lookup
- Requires alignment between `ingredientMaster.json` and `ingredientHealthData.json`
- **Critical:** New ingredients must have health data or fallback

---

## 🎯 Key Design Principles (Validated)

### ✅ Separation of Concerns
**What you BUY vs What you DO**
- Shopping list: "onion - 480g"
- Recipe display: "1 cup chopped onion" (preparation preserved)

### ✅ Dictionary-Driven Architecture
- Single source of truth (`ingredientMaster.json`)
- Parser auto-syncs state mappings (1,091 entries)
- No hardcoded ingredient logic

### ✅ State as Product Variation
- "fresh spinach" ≠ "frozen spinach" (different shopping items)
- "canned tomatoes" ≠ "tomatoes" (different products)
- State included in aggregation keys

### ✅ Normalization at Import Time
- Happens once during recipe ingestion
- Shopping lists use pre-normalized data (fast)
- No runtime conversion overhead

### ✅ Idempotency
- Safe to re-run normalization
- Skips already-normalized recipes
- Maintains clean backups for testing

---

## 🚧 Identified Gaps & Opportunities

### High Priority (Task 98 Scope)

**1. Dictionary Expansion**
- Current: 584 entries → Target: ~1,000 entries
- Impact: 87.5% → 95-98% match rate
- Focus: High-frequency unmatched ingredients

**2. Compound Ingredient Splitting**
- Issue: "salt and pepper" treated as single unknown
- Solution: Pattern-based splitting utility
- Benefit: Automatic resolution of 40-50 compound patterns

**3. Fallback Handling**
- Issue: Unmatched ingredients cause incompleteness
- Solution: "unknown_ingredient" placeholder
- Benefit: System stability + logging for review

**4. Malformed String Filtering**
- Issue: Empty strings, concatenated text parsed as ingredients
- Solution: Pre-parsing validation and cleanup
- Benefit: Cleaner diagnostics, fewer false negatives

### Medium Priority (Future Enhancements)

**5. Nutritional Data Integration**
- Add `usdaId` field to dictionary
- Pull calories/macros via API
- Enable Diet Compass nutrition scoring

**6. Client-Side Normalization**
- Wire into Recipe Edit/Import pages
- Real-time matching feedback
- Unrecognized ingredient badges

**7. Admin Dictionary Management**
- UI for adding aliases
- Mapping unmatched ingredients
- Batch dictionary updates

---

## 💡 Implementation Recommendations

### For Task 98 (Phase 2)

**DO:**
- Expand dictionary systematically (frequency-driven)
- Implement compound splitting as reusable utility
- Add fallback handling with logging
- Maintain backward compatibility with existing data

**DON'T:**
- Over-aggressive fuzzy matching (allergen risk)
- Hardcode ingredient-specific logic outside dictionary
- Break idempotency of normalization pipeline
- Change normalized data structure (breaking change)

**PRESERVE:**
- Current architecture (proven and working)
- Separation of identity vs preparation
- Dictionary-driven state detection
- Multi-stage matching strategy
- Idempotency guarantees

---

## 📈 Success Metrics (Phase 2 Targets)

| Metric | Current | Target | Delta |
|--------|---------|--------|-------|
| **Match Rate** | 87.5% | 95-98% | +7.5-10.5% |
| **Dictionary Size** | 584 | ~1,000 | +416 |
| **Compound Handling** | 0% | 100% | +100% |
| **Fallback Coverage** | 0% | 100% | +100% |
| **System Stability** | Good | Excellent | Improved |

---

## 🔍 Code Quality Assessment

**Strengths:**
- ✅ Well-documented functions with JSDoc
- ✅ Clear separation of concerns
- ✅ Reusable, composable utilities
- ✅ Performance optimizations (caching, pre-indexing)
- ✅ Comprehensive error handling

**Areas for Improvement:**
- ⚠️ No unit tests (noted in diagnostics)
- ⚠️ Limited validation of malformed inputs
- ⚠️ No structured logging for debugging
- ⚠️ Hard to trace specific matching decisions

**Test Coverage Needed:**
- Parsing edge cases (fractions, units, state detection)
- Matching accuracy (exact, token, fuzzy)
- Quantity conversion (volume→weight)
- Compound splitting (once implemented)
- Integration with shopping lists

---

## 📚 File Locations

**Core System:**
- `src/data/ingredientMaster.json` - Master dictionary (202KB)
- `src/utils/ingredientMaster.js` - Dictionary loader
- `src/utils/ingredientParsing.js` - Parsing engine
- `src/utils/ingredientMatcher.js` - Matching engine
- `src/utils/ingredientQuantities.js` - Conversion engine
- `src/pipelines/normalizeRecipeIngredients.js` - Pipeline orchestrator

**Diagnostics:**
- `tmp/normalization_diagnostics.json` - Unmatched analysis
- `tmp/catalogUniqueIngredients.json` - All unique strings (1,825)

**Documentation:**
- `docs/ingredients/analysis.md` - Frequency analysis
- `docs/ingredients/master-dictionary.md` - Dictionary guide
- `docs/sessions/2026-01-10-ingredient-normalization.md` - Phase 1 notes

---

## ✅ Review Complete

**Conclusion:** The existing normalization pipeline is well-architected, performant, and follows industry best practices. The 87.5% match rate is a solid foundation. Phase 2 (Task 98) will focus on expanding coverage through dictionary growth, compound splitting, and robust fallback handling to reach 95-98% match rate.

**Key Insight:** Architecture is sound and scalable. The bottleneck is purely dictionary coverage, not design or implementation quality.

**Next Step:** Proceed to Task 98.2 (Analyze unmatched ingredients with clustering).
