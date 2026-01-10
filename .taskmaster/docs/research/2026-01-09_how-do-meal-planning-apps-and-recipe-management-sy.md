---
title: Research Session
query: "How do meal planning apps and recipe management systems handle ingredient normalization and deduplication? What are the best practices for building comprehensive ingredient dictionaries that handle variations, aliases, and state differences (fresh, frozen, canned)? Are there open-source ingredient databases or ontologies available?"
date: 1/10/2026
time: 10:55:00 AM
timestamp: 2026-01-09T23:55:00.520Z
exchanges: 1
---

# Research Session

## Initial Query

**Question:** How do meal planning apps and recipe management systems handle ingredient normalization and deduplication? What are the best practices for building comprehensive ingredient dictionaries that handle variations, aliases, and state differences (fresh, frozen, canned)? Are there open-source ingredient databases or ontologies available?

**Response:**

Most serious meal-planning and recipe systems converge on the same pattern you’ve already implemented: normalize ingredients into a canonical **ingredient dictionary/ontology**, separate *what you buy* from *how you prepare it*, and aggregate on canonical IDs plus state when building shopping lists.

Below I’ll (1) align industry practices with what your current pipeline is doing, (2) outline best practices for ingredient dictionaries (aliases, state, units, density, nutrition), (3) describe normalization/dedup strategies (including edge cases your current code will hit next), and (4) list concrete open‑source ingredient databases/ontologies you can leverage.

---

## 1. How meal‑planning and recipe apps handle ingredient normalization

Across meal‑planning and “digital recipe book” apps, you see three broad approaches:

1. **Naive string-based deduplication**  
   - Example: Plan to Eat exposes a UI to “standardize your shopping list items” by bulk editing ingredient *titles* so that “allpurpose flour”, “all-purpose flour” etc. are made identical.[2]  
   - Mechanics:
     - Store ingredients as raw text strings.
     - Shopping list groups by exact or lightly-normalized string (case folding, trimming, maybe lemmatization).
     - Let users *manually* fix variants and optionally propagate the change back into recipes (like your import/recipe edit pages).

2. **Lightweight canonicalization without a full ontology**  
   - Typical for simpler apps that generate shopping lists:  
     - Strip obvious formatting noise: numbers, units, punctuation.
     - Lowercase and stem/lemmatize.
     - Domain-specific heuristics: treating “chopped”, “diced”, “minced” as preparation, not identity; merging plural vs singular; combining “fresh basil” and “basil leaves” etc.
     - Keep everything as strings but with best-effort canonicalization rules.
   - The “Create more uniform shopping list” videos and help docs for recipe apps essentially describe this kind of user-assisted normalization.[2]

3. **Full ingredient model with dictionary + IDs (what you’re doing)**  
   - Used by nutrition analysers, clinical diet planners, and sophisticated meal planning platforms.[1][7]  
   - Core ideas:
     - Each distinct *purchasable product* becomes a canonical ingredient node with an ID (`masterIngredientId` in your system).
     - Every recipe ingredient is parsed into: quantity, unit, canonical identity, state, and preparation (exactly what `parseIngredient` does).
     - Shopping list aggregation happens on **(ingredientId, state)**, not raw text.
     - Nutrition, allergy flags, and tags hang off the ingredient dictionary, not the raw recipe text.

Your current architecture (master dictionary, parsing, matching, conversion, normalized shopping list) is very much in line with the “full model” class. You’re already ahead of most consumer apps, especially with:

- Separation of **identity vs preparation**.
- State-aware matching + density-based volume→weight conversion.
- Persistent normalized structure (`normalizedIngredients`) on the recipe, not recomputed at render time.

The main delta between your implementation and best‑in‑class commercial systems is:

- Dictionary breadth (you’re at ~584 entries; target 900–1200+).
- Robust handling of *compound ingredients* and *truly unknowns*.
- Aligning your ingredient dictionary to an external ontology (e.g., USDA / FoodOn) where beneficial.

---

## 2. Best practices for building a comprehensive ingredient dictionary

For your specific project (with `ingredientMaster.json` and `ingredientMaster.js`), here are concrete best practices to evolve that dictionary.

### 2.1. Model design: what belongs in each ingredient entry

You already have:

- `id` / key (e.g., `onion`, `canned_tomatoes`)
- **Aliases** (strings you match against)
- **State** (fresh/frozen/canned/dried/other)
- **Density** (`gPerCup`, `gPerTbsp`, `gPerTsp`)
- **Tags** for categorization

To align with industry practice and keep this maintainable:

1. **Identity-first design: “one node per purchasable thing”**

   - Treat these as separate ingredients:
     - `onion` (fresh)
     - `frozen_spinach`
     - `canned_tomatoes`
     - `tomato_paste`
   - But treat these as aliases of the same ingredient:
     - `onion`, `yellow onion`, `white onion`, `brown onion` → `onion` (fresh state)
     - `all purpose flour`, `all-purpose flour`, `plain flour` → `all_purpose_flour`  

   This matches your **state as product variation** lesson: state is often part of *what you buy*, not just how you use it.

2. **Explicit fields to keep the rest of the system clean**

   Suggested minimal shape (you already approximate this):

   ```jsonc
   {
     "onion": {
       "displayName": "onion",
       "aliases": ["onions", "yellow onion", "white onion"],
       "state": "fresh",               // "fresh"|"frozen"|"canned"|"dried"|"other"
       "category": "vegetable",        // for filter/tagging
       "subCategory": "aromatic",
       "gPerCup": 160,
       "gPerTbsp": null,
       "gPerTsp": null,
       "unitPreference": "g",          // used for display/shopping list
       "nutritionRef": "USDA:11282",   // link into external DB
       "tags": {
         "allergens": [],
         "diets": ["vegan", "vegetarian"],
         "shelfLife": "short"
       }
     }
   }
   ```

3. **Stable IDs**

   - Don’t encode state in the bare ID if you already store `state` as a separate field, *unless* you want `canned_tomatoes` and `tomatoes` to be entirely separate products throughout the system (which may be good for budgeting/stock).  
   - For your current code, you’re already including state in aggregation keys in `normalizedShoppingList`—that’s a good separation: master ID encodes the *core product*, `state` refines it.

4. **Nutrition linkage**

   Even if you don’t yet calculate nutrition client-side, add a `nutritionRef` or `usdaId` now; it will let you:

   - Join against open nutrition datasets later.
   - Avoid double-encoding nutrition or allergens in multiple places.

### 2.2. Aliases and linguistic variation

Best practices for aliases in a production meal planner:

1. **Canonical “lemma” per ingredient**

   - All variants map to a canonical ID:
     - `garbanzo beans`, `chickpeas`, `chick peas`, `chick-peas` → `chickpeas`
   - Store:
     - `displayName` for UI, plus
     - `aliases` used in matching (lowercased, trimmed, no punctuation).

2. **Variant classes to consider**

   Include aliases for:

   - Plural/singular: `onions`, `garlic cloves`, `egg yolks`.
   - Regional names: `cilantro` / `coriander leaves`, `scallion` / `green onion`.
   - Spelling variants: `chili`, `chilli`, `chile`.
   - Packaged descriptors that are de facto names: `jarred marinara sauce`, `BBQ sauce`, `Sriracha`.

3. **Alias generation strategy**

   - You already have `tmp/catalogUniqueIngredients.json` and frequency analysis. Best practice:
     - Cluster raw strings by token similarity.
     - Manually review the top N clusters to either:
       - Add to an existing ingredient as an alias, or
       - Create a new master ingredient.
     - Automatically generate low-risk aliases (pluralization, hyphen/space variants).

   This is precisely what your `buildComprehensiveDictionary.js` script is for; you can keep iterating by re-running clustering on the remaining unmatched 12.5%.

### 2.3. State handling (fresh, frozen, canned, dried)

You already treat **state** as a first-class property and dynamically infer it using `STATE_LOOKUP` + keyword fallback in `ingredientParsing.js`. Best practices relative to that:

1. **State as a product; preparation as behavior**

   - Keep doing what you’re doing:
     - “frozen spinach” → identity tokens include “frozen spinach”; state=`frozen`.
     - “chopped onion” → identity “onion”; state inferred (`fresh`).
   - For spices & products where “ground” is part of the product (“ground cumin”, “ground beef”), maintain a whitelist in the dictionary:  
     - e.g., a `productKeywords` or `lockedTokens` field so the parser does not treat “ground” as pure preparation for those items.

2. **Dictionary‑driven state precedence**

   - Continue preferring dictionary-based state (`STATE_LOOKUP`) over keyword heuristics.  
   - When you fix an ingredient’s state in the dictionary (like you did in v2.1), the parser updates automatically—that solves drift between parsing and dictionary.

3. **Display vs aggregation**

   - In shopping list:
     - Aggregate by `(masterIngredientId, state)` to keep “onion” and “frozen onions” separate.
   - In recipe display:
     - Show original text + derived preparation + state (“1 cup chopped onion (fresh)” if helpful; or simply show raw).

   That’s exactly what your Shopping List and Recipe Display responsibilities are already separated to do.

---

## 3. Normalization and deduplication patterns

Your pipeline (parse → match → convert → aggregate) already matches best practices. Below are refinements and edge cases to target next.

### 3.1. Parsing: quantity, unit, identity, state, preparation

You already:

- Convert vulgar fractions and mixed numbers (`convertFractionsToDecimals`).
- Extract quantity + unit with regex, then normalize units to canonical (`normalizeUnit`).
- Remove quality descriptors (`large`, `organic` etc.) and noise words (`can`, `of`) in `classifyTokens`.
- Separate **identity** vs **preparation** terms via `PREPARATION_KEYWORDS`.

Best-practice improvements:

1. **Extend units & forms**

   - Add:
     - `sheet`, `slice`, `stick` (butter), `package`, `bag`, `container`, `box`, `cupful` etc., depending on your catalog.
   - Make sure every countable form that appears in the catalog is either in `UNIT_ALIASES` or handled as a packaging note in identity.

2. **Robust “no-quantity” handling**

   - For “salt to taste”, “olive oil for frying”, you will usually have:
     - `quantity = null`
     - `unit = null`
   - Keep them in `normalizedIngredients` but:
     - Skip them in quantitative aggregation for shopping lists.
     - Optionally mark a flag like `quantityEstimation: 'to-taste'`.

3. **Preparation edge cases**

   - Some words are both preparation and identity depending on context:
     - “shredded cheese” (product form) vs “cheese, shredded”.
     - “ground turkey” vs “turkey, ground”.
   - Best practice: maintain per-ingredient rules in the dictionary:
     - `treatPreparationAsIdentity: ["ground", "shredded"]` for specific ingredients.

### 3.2. Matching: from parsed identityText to dictionary ID

You already have:

- Multi-stage matcher: exact → token → fuzzy with confidence scores.
- State-aware disambiguation.

Best practices:

1. **Order of matching**

   - Keep these stages:
     1. Exact match on `identityText` to `id` or alias.
     2. Normalized token match (ignoring order, common stopwords).
     3. Fuzzy match with a minimum confidence threshold (e.g., 0.8).
   - If multiple fuzzy matches return, prefer:
     - Same state if known.
     - Higher frequency ingredient across the catalog (you have frequency data).
     - Manually configured tie-breaks if necessary.

2. **Unmatched fallback**

   - Keep unmatched ingredients as:
     - `normalizedIngredients` entries with `masterIngredientId = null` and `normalizedQuantityG = null`.
   - Shopping list:
     - Show them in a separate “Uncategorized” section using original text to avoid user confusion.
   - Optionally provide admin tools in `/admin/catalog` later to:
     - Pick which dictionary entry to map them to.
     - Add new dictionary entries or aliases directly from unmatched logs.

### 3.3. Aggregation for shopping lists

You already:

- Aggregate by `masterIngredientId + state`.
- Sum `normalizedQuantityG` and display user-friendly strings.

Best practices:

1. **Unit preference per ingredient**

   - Use your dictionary `unitPreference` to present:
     - `g` for flour, sugar, meats.
     - `ml` for oils.
     - `whole`/count for eggs, lemons, onions.
   - Convert back from grams to user-friendly forms where appropriate (e.g., `1 onion (approx. 110g)`).

2. **Threshold-based display**

   - If sum ≈ one standard package, display as such:
     - 950g rice → “1 kg rice” or “2.1 lb rice”.
   - That can be derived from per-ingredient packaging metadata if you decide to add it (e.g., `defaultPackageSizeG`).

---

## 4. How this ties into your current project tasks

### 4.1. Recipe Edit / Import pages (future client-side normalization)

From your session notes:

- Recipe Edit and Import pages currently don’t normalize client-side.
- You want:
  - User enters ingredient lines → client parses + matches → stores both raw and normalized forms.

Recommended workflow using your existing utilities:

1. On ingredient row edit/blur:
   - Call `parseIngredient(rawName)` (from `ingredientParsing.js`).
   - Call `matchIngredient(parsed.identityText, parsed.state)` (from `ingredientMatcher.js`).
   - If confidence above threshold:
     - Attach `normalized` sub-object in your ingredient row:
       ```js
       {
         raw: "1 cup chopped onion",
         quantity: 1,
         unit: "cup",
         normalized: {
           masterIngredientId: "onion",
           state: "fresh",
           normalizedQuantityG: 160
         }
       }
       ```
   - Else:
     - Keep normalized empty; show subtle “unrecognized ingredient” badge.

2. When saving recipes:
   - Persist both original `ingredients` and computed `normalizedIngredients`.
   - For user-entered recipes that will sync later with your catalog, store a `source: 'user'` plus any match diagnostic info.

This keeps Recipe Edit functionality aligned with the pipeline you already apply at import time.

### 4.2. Parent–child variations (Tasks 76 & 92)

For recipe variations:

- **Inherit normalized ingredients** from parent on “create variation”.
- When the user edits an ingredient in the child:
  - Re-run the same parsing/matching pipeline for that row only.
- Keep `normalizedIngredients` fully independent per recipe:
  - Parent and child both maintain their own normalized arrays.
- Your `getRecipeFamily(recipeId)` helper doesn’t need to be ingredient-aware, but future UI enhancements could:
  - Show differences between parent and child in normalized terms (e.g., “butter 50g → olive oil 40g”).

### 4.3. Admin catalog management (Task 84)

In `/admin/catalog`, add a section for **ingredient normalization and coverage**:

- Show metrics you already computed:
  - Match rate, unmatched ingredient types, top 50 unmatched by frequency.
- Allow an admin to:
  - Create a new dictionary entry from an unmatched string.
  - Map an unmatched string to an existing ingredient (append alias).
- Each time you update the dictionary:
  - Run `normalizeExistingCatalog.js` to re-normalize all recipes (you already have idempotency and clean backups).

This gives you a tight loop to push match rate from 87.5% toward 95–98% without needing to ship new code; just data changes.

---

## 5. Open‑source ingredient databases and ontologies

There is no single “perfect” open-source ingredient dictionary designed exactly for consumer meal planning, but you can **bootstrap** and/or interlink using several resources:

### 5.1. Nutrition-oriented databases (US-focused)

1. **USDA FoodData Central**  
   - Large database of foods with detailed nutrition and some categorization.
   - Pros:
     - Authoritative, free, machine-readable.
     - IDs you can store as `nutritionRef`.
   - Cons:
     - Granular toward branded products and lab-analyzed entries; not directly modelled as user-facing “pantry ingredients”.
   - Use it to:
     - Attach nutrition data to your `ingredientMaster` (cal/100g, macros, key micros).
     - Derive allergen/diet compatibility flags.

2. **Canadian Nutrient File / other national databases**  
   - Similar to USDA; useful for regional differences.

### 5.2. Ingredient ontologies / vocabularies

1. **FoodOn**  
   - An ontology of thousands of food products (ingredients, processed foods, etc.).
   - Pros:
     - Explicit hierarchy: food groups, raw vs processed, plant/animal origin.
     - Good for tagging and advanced querying (e.g., “all cruciferous vegetables”).
   - Cons:
     - Ontology-level; not a ready-made shopping list DB.
   - How to use:
     - Add a `foodOnId` to your ingredients where mappings are obvious.
     - Use its hierarchy to generate tag sets (e.g., categories, cuisines, protein source).

2. **SNOMED CT / other clinical terminologies**  
   - Include food concepts for clinical diet tools.[7]  
   - Probably overkill for your use, but can be useful if you lean into clinical or allergy-heavy features later.

### 5.3. Crowdsourced / practical ingredient datasets

1. **Open Food Facts**  
   - Crowdsourced database of branded products.
   - Pros:
     - Excellent for barcoded items and some generic categories.
   - Cons:
     - Not strongly structured around “recipe ingredients”; more around packaged items.

2. **Open Recipes & other GitHub datasets**  
   - Many open recipe datasets exist (Kaggle, GitHub) with ingredient lists; some projects have pre-normalized ingredient sets.
   - While not authoritative, they can:
     - Provide candidate alias lists.
     - Suggest typical densities or default states for common items.

### 5.4. How to mix these with your current dictionary

Given your existing `ingredientMaster.json` is already tightly coupled to your 622‑recipe catalog, treat external resources as **enrichment layers** rather than replacements:

- Add optional fields:
  - `usdaId`, `foodOnId`, `openFoodFactsId`.
- Build a small ETL script that:
  - Maps your `displayName` and some aliases to USDA generic foods.
  - Pulls calories + macros per 100g for each ingredient.
- Keep the human-facing names and shopping behaviors defined by your data; use ontologies for:
  - Nutrition math.
  - Higher-level tagging.
  - Potential research/ML.

---

## 6. Concrete next steps for your project

Given your current status and user feedback (“87.5% isn’t enough”):

1. **Dictionary expansion**  
   - Use `normalization_diagnostics.json` to:
     - Add all ingredients with ≥2 occurrences as new entries or aliases.
     - Aim for ~900–1000 entries to reach 95–98% match rate.

2. **Compound ingredient handling**  
   - Implement splitting logic for patterns like:
     - “salt and pepper” → `salt`, `black pepper`.
   - You can do this before or after parsing, with a small rule set.

3. **Client-side normalization on Recipe Edit/Import**  
   - Integrate `parseIngredient` & matcher into `RecipeEditPage` so new user recipes are immediately normalized.

4. **Admin UI for dictionary maintenance**  
   - Expose review & fix cycle for unmatched ingredients in `/admin/catalog`.

5. **Optional: external enrichment**  
   - Add `usdaId` per ingredient and a simple script to attach calories + macros for later use in Diet Compass or nutrition displays.

All of this builds directly on the architecture you already shipped in `ingredientParsing.js`, `ingredientMatcher.js`, `ingredientQuantities.js`, and `normalizeRecipeIngredients.js`, while bringing your system fully in line with best practices used by advanced meal‑planning and nutrition platforms.


---

*Generated by Task Master Research Command*  
*Timestamp: 2026-01-09T23:55:00.520Z*
