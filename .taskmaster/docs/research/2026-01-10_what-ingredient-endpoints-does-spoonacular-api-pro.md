---
title: Research Session
query: "What ingredient endpoints does Spoonacular API provide? How does their ingredient database work - can we get a list of all 2,600 ingredients with metadata like categories, units, and nutritional data? What are the API endpoints for ingredient search, autocomplete, and normalization?"
date: 1/10/2026
time: 11:20:31 AM
timestamp: 2026-01-10T00:20:31.220Z
exchanges: 1
---

# Research Session

## Initial Query

**Question:** What ingredient endpoints does Spoonacular API provide? How does their ingredient database work - can we get a list of all 2,600 ingredients with metadata like categories, units, and nutritional data? What are the API endpoints for ingredient search, autocomplete, and normalization?

**Response:**

Spoonacular provides several **ingredient-focused API endpoints**, but it does **not expose a single “dump all 2,600 ingredients” endpoint**. You can query ingredients by search/autocomplete, and then, for each ingredient ID, fetch rich metadata including categories, units, and full nutrition.

Below is a breakdown tailored to how you could use this for your **ingredient normalization pipeline, master ingredient dictionary, and health scoring**.

---

## 1. Overview of Spoonacular’s ingredient model

According to Spoonacular’s public descriptions and API clients:

- The API has **thousands of ingredients** with:
  - A numeric **ingredient ID**  
  - Name, image  
  - **Category** (e.g., “milk, eggs, dairy”, “vegetables”)  
  - **Possible units** (e.g., g, oz, cup, tbsp, piece)  
  - **Nutrition**: calories, macro/micro nutrients, etc.[7]  
- This data is exposed per-ingredient via the information endpoint, not as a single bulk list.[2][7]

This fits well with your existing `ingredientMaster.json` and `ingredientHealthData.json`: you can treat Spoonacular as an external, ID-based, nutrition/metadata source behind your own normalized ingredient keys.

---

## 2. Core ingredient endpoints

From public API docs and client definitions, the key **ingredient endpoints** are:[1][2][3][7]

1. **Ingredient Search**  
   - Path: `/food/ingredients/search`  
   - Method: `GET`  
   - Purpose: Search the ingredient database and get a list of matching ingredients (ID + basic metadata).[3]  
   - Typical query parameters (based on client types and unofficial docs):  
     - `query` – text string, e.g. "onion"  
     - `number` – number of results to return  
     - `offset` – pagination  

2. **Ingredient Autocomplete**  
   - Path: `/food/ingredients/autocomplete`  
   - Method: `GET`  
   - Purpose: Lightweight typeahead-style suggestions for ingredient names.[2][3]  
   - Parameters (from examples and client):  
     - `query` – partial term, e.g. "app"  
     - `number` – max suggestions  

3. **Ingredient Information (by ID)**  
   - Path: `/food/ingredients/{id}/information`  
   - Method: `GET`  
   - Purpose: Retrieve **detailed metadata and nutrition** for a single ingredient.[2][3][7]  
   - Parameters:  
     - `amount` (optional) – base amount for nutrition, e.g. 100  
     - `unit` (optional) – base unit for nutrition, often `g`  
   - Returns (per docs and examples):  
     - `id`, `name`, `image`  
     - `categoryPath` (hierarchical categories)[7]  
     - `possibleUnits` – recognized units for this ingredient  
     - `nutrition` object with:  
       - `nutrients` (array of nutrients, amounts, units)  
       - possibly weight per serving, etc.[7]  

4. **Parse Ingredients**  
   - Path: `/recipes/parseIngredients`  
   - Method: `POST`  
   - Purpose: NLP parsing and normalization of raw ingredient strings into structured objects that include a matched **ingredient ID**.[1][3]  
   - Very relevant to your normalization pipeline: returns standardized name, amount, unit, and mapping to a canonical ingredient.

5. **Compute/Convert Ingredient Amounts**  
   - `/recipes/convert` or `/recipes/computeIngredientAmount` (naming varies in different docs/clients)[1][3]  
   - Purpose: Unit conversion and possibly density-aware amount conversion for a given ingredient.  
   - This can help cross-check densities in your `ingredientMaster.json`.

There are also **ingredient substitute endpoints**:

- `/food/ingredients/substitutes` (by name) and `/food/ingredients/{id}/substitutes` (by ID)[1][3]  
These can be useful if you later add automated substitution logic in your Diet Compass or recipe personalization.

---

## 3. Autocomplete and normalization endpoints

For your specific questions:

### Ingredient search

- **Endpoint:** `/food/ingredients/search`  
- Use when you want **search results with IDs** plus some limited metadata, not just strings.[3]  
- Example usage (pseudo):

```http
GET /food/ingredients/search?apiKey=KEY&query=onion&number=10
```

- Response (conceptual):

```json
{
  "results": [
    { "id": 11282, "name": "onion", "image": "brown-onion.png" },
    { "id": 11291, "name": "spring onions", "image": "spring-onions.png" }
  ],
  "totalResults": 2
}
```

You can map from your normalized ingredient name (`"onion"`) to one or more Spoonacular ingredient IDs using this search.

### Ingredient autocomplete

- **Endpoint:** `/food/ingredients/autocomplete`[2][3]  
- Use for **typeahead UI** or lightweight suggestions during data entry.  
- Example:

```http
GET /food/ingredients/autocomplete?apiKey=KEY&query=gar&number=5
```

- Response (typical fields, from client models):

```json
[
  { "name": "garlic", "image": "garlic.png", "id": 11215 },
  { "name": "garlic powder", "image": "garlic-powder.png", "id": 2020 }
]
```

The presence of `id` here lets you go directly to `/information` next.

### Ingredient normalization (parse endpoint)

- **Endpoint:** `/recipes/parseIngredients`[1][3]  
- This is the **closest thing to a built‑in normalization service**.  
- You pass raw ingredient strings; the API tries to:
  - Parse quantity and unit  
  - Normalize the ingredient name  
  - Map to a **canonical ingredient ID** and possibly provide nutrition per amount.

- Example body (conceptual):

```json
{
  "ingredientList": "1 cup chopped onion\n2 cloves garlic, minced",
  "servings": 1
}
```

- For your project, this endpoint can be used to:
  - Validate or boot-strap your own `normalizeIngredientName()` logic.  
  - Infer density/weight-per-volume for some ingredients by comparing nutrition per serving across units (with care).  
  - Build a mapping from your normalized keys to Spoonacular IDs (semi-automatically).

---

## 4. What does `/ingredients/{id}/information` return?

The **ingredient database “works”** by tying everything to a numeric ID and returning rich, structured data via this endpoint.[2][7]

Conceptually, the response includes (based on public description and example docs):[7]

- **Identity & classification**
  - `id` – numeric ID  
  - `name` – canonical name  
  - `image` – image filename or URL  
  - `categoryPath` – array indicating category hierarchy, e.g.:  

    ```json
    "categoryPath": ["milk, eggs, dairy", "cheese"]
    ```

- **Units & measure**
  - `possibleUnits` – list of allowed units like `["g", "oz", "cup", "tablespoon", "piece"]` for that ingredient.  
  - `estimatedCost` – cost per amount (sometimes)  

- **Nutrition**
  - `nutrition` object with:
    - `nutrients`: array of objects like  

      ```json
      {
        "name": "Calories",
        "amount": 41.0,
        "unit": "kcal",
        "percentOfDailyNeeds": 2.05
      }
      ```
    - Possibly `weightPerServing` or similar fields.  

This gives you **exactly the metadata you asked about** (categories, units, nutritional data) but per ID, not bulk.[7]

---

## 5. Can you get all ~2,600 ingredients with metadata?

Based on public information and tooling:

- There is **no documented “get all ingredients” or bulk export endpoint**.  
  - Public endpoints are search, autocomplete, information by ID, parse, etc.[1][2][3]  
- Third-party descriptions emphasize that the ingredient information API is called **per ingredient**.[7]  
- The official site just mentions access to “thousands of ingredients,” but not a bulk listing endpoint.[6]

So:

- You **cannot** call a single endpoint to get all 2,600+ ingredients with metadata.  
- You **can** approximate a larger catalog by:
  - Using `/food/ingredients/search` with broad queries, pagination, and different letters/terms.  
  - Mining IDs from recipe data (extended ingredient lists from recipe endpoints, plus `parseIngredients`).  
  - Storing discovered IDs and then calling `/information` per ID to enrich your local database.

Given the rate limits and TOS, any systematic harvesting must respect Spoonacular’s usage policies.

For your project, you likely do **not** need all 2,600 ingredients. You already target ~1,000 normalized entries for catalog coverage (Task 98). A more pragmatic approach is:

- Keep your current `ingredientMaster.json` as the **primary dictionary**.  
- For each ingredient where you want richer data:
  - Map it to a Spoonacular ID (via search or parse).  
  - Store that ID and optionally a subset of the nutrition fields locally.  
- Avoid trying to mirror their full database; treat Spoonacular as an **on-demand, reference source**.

---

## 6. How this integrates with your existing pipeline

Given Tasks 97, 98, 83, and 96:

### a) Ingredient normalization (`ingredientMaster.json` and parsing)

You already have:

- `ingredientMaster.json` with:
  - `id`, `displayName`, `canonicalUnit`, densities, etc.  
- Normalization logic that maps raw strings → normalized keys.

Where Spoonacular can help:

- Use `/recipes/parseIngredients` to:
  - Validate tricky cases (e.g., “1 bunch cilantro, chopped”) and compare to your parser output.
  - Gather canonical naming hints and unit patterns.
- Use `/food/ingredients/search` and `/autocomplete` to:
  - Suggest canonical names when adding new entries to your master dictionary.
- For selected entries, store an extra field, e.g.:

```json
{
  "id": "onion",
  "displayName": "Onion",
  "canonicalUnit": "g",
  "density": 160,
  "spoonacularId": 11282
}
```

Then you can call `/food/ingredients/{spoonacularId}/information` to enrich nutrition or category data on demand.

### b) Diet Compass & ingredient health data (`ingredientHealthData.json`)

You already have:

- 200+ ingredients with health scores and flags keyed by normalized ingredient names.

How to connect:

- For ingredients where you want **finer nutrient-based scoring** in future iterations:
  - Use your normalized key → `spoonacularId`.
  - Call `/information` with `amount=100&unit=g` to get standardized per-100g nutrient data.
  - Optionally precompute and store:
    - Fiber density, sugar per 100g, saturated fat per 100g, etc.
  - Use these to refine or auto-generate Diet Compass points for new ingredients (while still preserving your hand-curated caps/flags).

Because Task 96 already loads `ingredientHealthData.json` into localStorage, you can later add an offline cache of Spoonacular-derived nutrient snapshots if needed.

### c) Densities and unit handling

Your master ingredient dictionary uses densities to convert between volume and weight. Spoonacular’s ingredient metadata can help:

- Use `possibleUnits` to confirm which units are typical and safe to support for each ingredient.  
- If `nutrition` includes `weightPerServing` for measures like `1 cup`, you can infer approximate density:

\[
\text{density (g/cup)} ≈ \frac{\text{grams per serving}}{\text{serving volume in cups}}
\]

You would do this gently, using Spoonacular only as a **sanity check** against your curated density values.

---

## 7. Practical call patterns for your project

Here’s how you might concretely use the endpoints when building/expanding your dictionaries:

1. **Interactive mapping tool for developers:**

   - Input: internal normalized ingredient key, e.g. `"greek_yogurt_2_percent"`.  
   - Step 1: Use `/food/ingredients/search?query=greek%20yogurt`.  
   - Step 2: Pick the best result manually; save its `id` into `ingredientMaster.json`.  
   - Step 3: Fetch `/food/ingredients/{id}/information?amount=100&unit=g` and inspect categories and nutrition before finalizing.

2. **Automatic fallback during normalization:**

   - When a raw catalog ingredient does not match any key in `ingredientMaster.json` (Task 98 logic):
     - Optionally query `/recipes/parseIngredients` with the full ingredient string.
     - If you get a high-confidence ingredient ID, log it and suggest a new master dictionary entry for review.

3. **UI autocomplete:**

   - When you eventually build an internal admin UI for editing master ingredients:
     - Use `/food/ingredients/autocomplete` as the backend for a “Spoonacular link” field.
     - Immediately test the ID by calling `/information` and showing category + nutrition.

---

## 8. Summary of key endpoints for your questions

- **Ingredient search:**  
  - `/food/ingredients/search` – search database, returns ingredients with IDs.[3]

- **Ingredient autocomplete:**  
  - `/food/ingredients/autocomplete` – quick suggestions for partial queries.[2][3]

- **Ingredient normalization / parsing:**  
  - `/recipes/parseIngredients` – parse free-text ingredient lines and map to canonical ingredients.[1][3]

- **Ingredient information (metadata + nutrition):**  
  - `/food/ingredients/{ingredientId}/information` – detailed info including **categories, possible units, and nutrition**.[2][7]

- **No bulk “all ingredients” endpoint:**  
  - You cannot directly fetch the full list of ~2,600 ingredients; you must discover IDs via search, parse, or recipes and then fetch them one-by-one.[1][2][6][7]

If you want, I can draft a small Node/TypeScript helper layer that wraps these endpoints into functions like `lookupSpoonacularId(normalizedName)` and `fetchIngredientMetadata(spoonacularId)` tailored to your existing `src/data/ingredientMaster.json` schema.


---

*Generated by Task Master Research Command*  
*Timestamp: 2026-01-10T00:20:31.220Z*
