# Spoonacular Recipe Extraction Protocol

**Version:** 1.0  
**Target:** ~800 recipes  
**Estimated API Cost:** ~900 points (Cook tier: $29/month sufficient)  
**Created:** January 2025

---

## 1. OVERVIEW

This document defines a systematic search protocol for extracting a diverse recipe catalog from the Spoonacular API. The catalog will serve as the foundation for Vanessa, an AI-powered meal planning application.

### Goals

1. Extract approximately **800 unique recipes**
2. Ensure broad coverage across all defined dimensions
3. Tag each recipe with all applicable labels (not just the search that found it)
4. Prioritize quality (high ratings, complete instructions)
5. Include Diet Compass-aligned recipes for health-focused users

### Key Constraints

- Deduplicate by Spoonacular recipe ID during extraction
- Minimum quality threshold: `spoonacularScore >= 70` OR `aggregateLikes >= 50`
- Only include recipes with `analyzedInstructions` present
- Cache all API responses to avoid redundant calls

---

## 2. RECIPE DIMENSIONS & TAGGING SCHEMA

Each extracted recipe must be tagged across ALL applicable dimensions.

### 2.1 Searchable Dimensions (API Parameters)

| Dimension | Tag Values | Spoonacular Parameter |
|-----------|------------|----------------------|
| **cuisine** | See Section 3.1 | `cuisine=X` |
| **diet** | See Section 3.2 | `diet=X` |
| **mealSlot** | breakfast, lunch, dinner, snack | `type=X` |
| **dishType** | See Section 3.3 | `type=X` |
| **proteinSource** | See Section 3.4 | `includeIngredients=X` |
| **effortLevel** | quick, easy, medium, project | `maxReadyTime=X` |

### 2.2 Inferred Dimensions (Post-Retrieval Analysis)

| Dimension | Tag Values | Inference Method |
|-----------|------------|------------------|
| **cookingMethod** | grill, bake, roast, sauté, steam, slow-cook, pressure-cook, no-cook, air-fry, braise | Parse `analyzedInstructions` for keywords |
| **kidFriendly** | true, false | Heuristic: no spicy ingredients, familiar foods, mild flavors |
| **carbBase** | rice, pasta, potato, bread, quinoa, noodles, none | Parse `extendedIngredients` |
| **spiceLevel** | none, mild, medium, hot | Detect chili, jalapeño, cayenne, sriracha, etc. |
| **makeAhead** | true, false | Detect "refrigerate", "freeze", "make ahead", "meal prep" in instructions |
| **budgetTier** | budget, moderate, premium | Use `pricePerServing`: <$2=budget, $2-5=moderate, >$5=premium |

### 2.3 Recipe Category

Each recipe belongs to ONE primary category:

| Category | Description |
|----------|-------------|
| **meal** | Standard meals (breakfast, lunch, dinner) |
| **snack** | Between-meal items |
| **component** | Bulk/preserved items, condiments, bases (see Section 3.6) |
| **dessert** | Sweet dishes |

---

## 3. SEARCH MATRIX

### Extraction Algorithm

```
FOR each search_query in SEARCH_MATRIX:
    target_count = search_query.target
    added_count = 0
    offset = 0
    max_offset = 200  // Safety limit
    
    WHILE added_count < target_count AND offset < max_offset:
        results = spoonacular.complexSearch({
            ...search_query.params,
            sort: "popularity",
            sortDirection: "desc",
            number: 20,
            offset: offset,
            addRecipeInformation: true,
            fillIngredients: true,
            instructionsRequired: true,
            minSpoonacularScore: 70
        })
        
        IF results.results.length == 0:
            LOG: "Exhausted results for {search_query.id}"
            BREAK
        
        FOR each recipe in results.results:
            IF recipe.id NOT IN catalog:
                // Fetch full recipe details if needed
                full_recipe = recipe  // complexSearch with addRecipeInformation provides most data
                
                // Apply ALL applicable tags from ALL dimensions
                tagged_recipe = {
                    spoonacularId: recipe.id,
                    name: recipe.title,
                    sourceUrl: recipe.sourceUrl,
                    image: recipe.image,
                    servings: recipe.servings,
                    readyInMinutes: recipe.readyInMinutes,
                    spoonacularScore: recipe.spoonacularScore,
                    pricePerServing: recipe.pricePerServing,
                    
                    // Apply tags
                    tags: inferAllTags(recipe),
                    
                    // Track provenance
                    searchSource: search_query.id,
                    extractedAt: ISO_TIMESTAMP
                }
                
                catalog.add(tagged_recipe)
                added_count++
                
                IF added_count >= target_count:
                    BREAK
        
        offset += 20
    
    LOG: "{search_query.id}: Added {added_count}/{target_count} recipes"
```

---

### 3.1 CUISINE SEARCHES (Target: 165 recipes)

| ID | Cuisine | Target | Parameters |
|----|---------|--------|------------|
| CUI-01 | Italian | 15 | `cuisine=italian` |
| CUI-02 | Indian | 15 | `cuisine=indian` |
| CUI-03 | Thai | 15 | `cuisine=thai` |
| CUI-04 | Mexican | 15 | `cuisine=mexican` |
| CUI-05 | Japanese | 15 | `cuisine=japanese` |
| CUI-06 | Chinese | 15 | `cuisine=chinese` |
| CUI-07 | Mediterranean | 15 | `cuisine=mediterranean` |
| CUI-08 | Greek | 10 | `cuisine=greek` |
| CUI-09 | Middle Eastern | 15 | `cuisine=middle+eastern` |
| CUI-10 | French | 10 | `cuisine=french` |
| CUI-11 | Korean | 10 | `cuisine=korean` |
| CUI-12 | Vietnamese | 10 | `cuisine=vietnamese` |
| CUI-13 | Spanish | 5 | `cuisine=spanish` |

---

### 3.2 DIET SEARCHES (Target: 90 recipes)

| ID | Diet | Target | Parameters |
|----|------|--------|------------|
| DIT-01 | Vegetarian | 15 | `diet=vegetarian` |
| DIT-02 | Vegan | 15 | `diet=vegan` |
| DIT-03 | Gluten-Free | 15 | `diet=gluten+free` |
| DIT-04 | Dairy-Free | 10 | `diet=dairy+free` |
| DIT-05 | Keto | 10 | `diet=ketogenic` |
| DIT-06 | Paleo | 10 | `diet=paleo` |
| DIT-07 | Whole30 | 10 | `diet=whole30` |
| DIT-08 | Pescatarian | 5 | `diet=pescetarian` |

---

### 3.3 DISH TYPE SEARCHES (Target: 130 recipes)

| ID | Dish Type | Target | Parameters |
|----|-----------|--------|------------|
| DSH-01 | Soup | 15 | `type=soup` |
| DSH-02 | Salad | 15 | `type=salad` |
| DSH-03 | Sandwich | 10 | `type=sandwich` |
| DSH-04 | Bowl | 15 | `query=bowl&type=main+course` |
| DSH-05 | Stew | 10 | `query=stew` |
| DSH-06 | Curry | 15 | `query=curry` |
| DSH-07 | Stir-fry | 10 | `query=stir+fry` |
| DSH-08 | Casserole | 10 | `query=casserole` |
| DSH-09 | Pasta | 10 | `query=pasta&type=main+course` |
| DSH-10 | Tacos | 10 | `query=tacos` |
| DSH-11 | Sheet Pan | 10 | `query=sheet+pan` |

---

### 3.4 PROTEIN SOURCE SEARCHES (Target: 120 recipes)

| ID | Protein | Target | Parameters |
|----|---------|--------|------------|
| PRO-01 | Chicken | 15 | `includeIngredients=chicken` |
| PRO-02 | Salmon | 15 | `includeIngredients=salmon` |
| PRO-03 | White Fish | 10 | `includeIngredients=cod,tilapia,halibut` |
| PRO-04 | Shrimp | 10 | `includeIngredients=shrimp` |
| PRO-05 | Tofu | 15 | `includeIngredients=tofu` |
| PRO-06 | Tempeh | 10 | `includeIngredients=tempeh` |
| PRO-07 | Lentils | 15 | `includeIngredients=lentils` |
| PRO-08 | Chickpeas | 15 | `includeIngredients=chickpeas` |
| PRO-09 | Black Beans | 10 | `includeIngredients=black+beans` |
| PRO-10 | Eggs | 5 | `includeIngredients=eggs&type=main+course` |

---

### 3.5 MEAL SLOT SEARCHES (Target: 60 recipes)

| ID | Meal Slot | Target | Parameters |
|----|-----------|--------|------------|
| SLT-01 | Breakfast | 25 | `type=breakfast` |
| SLT-02 | Snack | 20 | `type=snack` |
| SLT-03 | Appetizer | 15 | `type=appetizer` |

*Note: Lunch and Dinner are well-covered by other searches*

---

### 3.6 COMPONENT/PRESERVED ITEMS (Target: 50 recipes)

These are bulk preparation items, ferments, condiments, and meal components.

| ID | Component Type | Target | Parameters |
|----|----------------|--------|------------|
| CMP-01 | Kimchi & Ferments | 8 | `query=kimchi+OR+sauerkraut+OR+fermented` |
| CMP-02 | Pickles & Preserves | 8 | `query=pickled+OR+preserved+OR+pickle` |
| CMP-03 | Sauces & Condiments | 10 | `type=sauce&query=homemade` |
| CMP-04 | Dips & Spreads | 8 | `query=hummus+OR+dip+OR+spread` |
| CMP-05 | Spice Blends | 6 | `query=spice+blend+OR+seasoning+mix` |
| CMP-06 | Stocks & Broths | 5 | `query=stock+OR+broth+OR+bone+broth` |
| CMP-07 | Grain Bases | 5 | `query=batch+rice+OR+meal+prep+grains` |

*Note: Tag all CMP results with `category: "component"`*

---

### 3.7 EFFORT LEVEL SEARCHES (Target: 45 recipes)

| ID | Effort | Target | Parameters |
|----|--------|--------|------------|
| EFF-01 | Quick (<20 min) | 20 | `maxReadyTime=20` |
| EFF-02 | Easy (20-40 min) | 15 | `maxReadyTime=40&minReadyTime=20` |
| EFF-03 | Project (60+ min) | 10 | `minReadyTime=60` |

---

### 3.8 DIET COMPASS ALIGNED (Target: 100 recipes)

These searches specifically target the Diet Compass protocol's protective foods.

| ID | Focus | Target | Parameters |
|----|-------|--------|------------|
| DC-01 | Omega-3 Rich Fish | 15 | `includeIngredients=salmon,sardines,mackerel&diet=pescetarian` |
| DC-02 | Whole Grains | 15 | `includeIngredients=quinoa,bulgur,farro,brown+rice&diet=vegetarian` |
| DC-03 | Legume-Based | 15 | `includeIngredients=lentils,chickpeas,beans&diet=vegan` |
| DC-04 | Nuts & Seeds | 10 | `includeIngredients=walnuts,almonds,chia,flax` |
| DC-05 | Fermented Dairy | 10 | `includeIngredients=yogurt,kefir` |
| DC-06 | Anti-Inflammatory | 15 | `includeIngredients=turmeric,ginger&diet=vegetarian` |
| DC-07 | High Fiber | 10 | `minFiber=10` |
| DC-08 | Low Glycemic | 10 | `maxCarbs=30&minProtein=20` |

---

### 3.9 KID-FRIENDLY (Target: 40 recipes)

| ID | Focus | Target | Parameters |
|----|-------|--------|------------|
| KID-01 | Kid Main Dishes | 20 | `query=kid+friendly&type=main+course` |
| KID-02 | Kid Snacks | 10 | `query=kid+friendly&type=snack` |
| KID-03 | Hidden Veggies | 10 | `query=hidden+vegetables+kids` |

*Note: Tag all KID results with `kidFriendly: true`*

---

## 4. TAG INFERENCE FUNCTIONS

### 4.1 inferCookingMethod(recipe)

```javascript
function inferCookingMethod(recipe) {
    const methods = [];
    const instructions = recipe.analyzedInstructions
        ?.flatMap(i => i.steps)
        ?.map(s => s.step.toLowerCase())
        ?.join(' ') || '';
    
    const keywords = {
        'grill': ['grill', 'grilled', 'grilling', 'bbq', 'barbecue'],
        'bake': ['bake', 'baked', 'baking', 'oven'],
        'roast': ['roast', 'roasted', 'roasting'],
        'sauté': ['sauté', 'saute', 'sautéed', 'sauteed', 'pan-fry', 'pan fry'],
        'steam': ['steam', 'steamed', 'steaming'],
        'slow-cook': ['slow cook', 'slow-cook', 'crockpot', 'crock pot'],
        'pressure-cook': ['pressure cook', 'instant pot', 'instapot'],
        'no-cook': ['no-cook', 'no cook', 'raw', 'no cooking'],
        'air-fry': ['air fry', 'air-fry', 'air fryer'],
        'braise': ['braise', 'braised', 'braising']
    };
    
    for (const [method, terms] of Object.entries(keywords)) {
        if (terms.some(term => instructions.includes(term))) {
            methods.push(method);
        }
    }
    
    return methods.length > 0 ? methods : ['other'];
}
```

### 4.2 inferKidFriendly(recipe)

```javascript
function inferKidFriendly(recipe) {
    const ingredients = recipe.extendedIngredients
        ?.map(i => i.name.toLowerCase()) || [];
    
    const spicyIndicators = [
        'jalapeño', 'jalapeno', 'habanero', 'serrano', 'cayenne',
        'chili flakes', 'red pepper flakes', 'sriracha', 'hot sauce',
        'wasabi', 'horseradish', 'ghost pepper', 'scotch bonnet'
    ];
    
    const unfamiliarIndicators = [
        'anchovy', 'liver', 'oyster', 'mussel', 'octopus', 'squid',
        'blue cheese', 'gorgonzola', 'organ meat', 'tripe'
    ];
    
    const hasSpicy = spicyIndicators.some(s => 
        ingredients.some(i => i.includes(s))
    );
    
    const hasUnfamiliar = unfamiliarIndicators.some(u => 
        ingredients.some(i => i.includes(u))
    );
    
    // Also check if explicitly tagged
    const title = recipe.title.toLowerCase();
    const isExplicitlyKidFriendly = title.includes('kid') || title.includes('child');
    
    return isExplicitlyKidFriendly || (!hasSpicy && !hasUnfamiliar);
}
```

### 4.3 inferCarbBase(recipe)

```javascript
function inferCarbBase(recipe) {
    const ingredients = recipe.extendedIngredients
        ?.map(i => i.name.toLowerCase()) || [];
    
    const carbBases = {
        'rice': ['rice', 'risotto'],
        'pasta': ['pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'macaroni', 'noodle'],
        'potato': ['potato', 'potatoes'],
        'bread': ['bread', 'toast', 'bun', 'roll', 'pita', 'naan', 'tortilla', 'wrap'],
        'quinoa': ['quinoa'],
        'noodles': ['noodle', 'ramen', 'udon', 'soba', 'rice noodle']
    };
    
    const found = [];
    for (const [base, terms] of Object.entries(carbBases)) {
        if (terms.some(term => ingredients.some(i => i.includes(term)))) {
            found.push(base);
        }
    }
    
    return found.length > 0 ? found : ['none'];
}
```

### 4.4 inferSpiceLevel(recipe)

```javascript
function inferSpiceLevel(recipe) {
    const ingredients = recipe.extendedIngredients
        ?.map(i => i.name.toLowerCase()) || [];
    const title = recipe.title.toLowerCase();
    
    const hotIndicators = ['habanero', 'ghost pepper', 'scotch bonnet', 'carolina reaper'];
    const mediumIndicators = ['jalapeño', 'jalapeno', 'serrano', 'cayenne', 'chili', 'sriracha'];
    const mildIndicators = ['paprika', 'mild curry', 'black pepper'];
    
    const allText = ingredients.join(' ') + ' ' + title;
    
    if (hotIndicators.some(h => allText.includes(h))) return 'hot';
    if (mediumIndicators.some(m => allText.includes(m))) return 'medium';
    if (mildIndicators.some(m => allText.includes(m))) return 'mild';
    return 'none';
}
```

### 4.5 inferBudgetTier(recipe)

```javascript
function inferBudgetTier(recipe) {
    const pricePerServing = recipe.pricePerServing; // in cents
    
    if (!pricePerServing) return 'unknown';
    
    const priceInDollars = pricePerServing / 100;
    
    if (priceInDollars < 2) return 'budget';
    if (priceInDollars <= 5) return 'moderate';
    return 'premium';
}
```

### 4.6 inferEffortLevel(recipe)

```javascript
function inferEffortLevel(recipe) {
    const time = recipe.readyInMinutes;
    
    if (!time) return 'unknown';
    
    if (time <= 20) return 'quick';
    if (time <= 40) return 'easy';
    if (time <= 60) return 'medium';
    return 'project';
}
```

### 4.7 inferMakeAhead(recipe)

```javascript
function inferMakeAhead(recipe) {
    const instructions = recipe.analyzedInstructions
        ?.flatMap(i => i.steps)
        ?.map(s => s.step.toLowerCase())
        ?.join(' ') || '';
    
    const makeAheadTerms = [
        'make ahead', 'meal prep', 'refrigerate overnight',
        'freeze', 'freezer friendly', 'store in refrigerator',
        'keeps for', 'batch cook', 'prepare in advance'
    ];
    
    return makeAheadTerms.some(term => instructions.includes(term));
}
```

---

## 5. RECIPE OUTPUT SCHEMA

Each recipe in the final catalog must conform to this schema:

```typescript
interface ExtractedRecipe {
    // Spoonacular Data
    spoonacularId: number;
    name: string;
    sourceUrl: string;
    servings: number;
    readyInMinutes: number;
    spoonacularScore: number;
    pricePerServing: number;  // in cents
    
    // Images (multiple sizes)
    images: {
        thumbnail: string;   // 90x90 - for lists/search results
        small: string;       // 240x150 - for cards
        medium: string;      // 312x231 - for recipe previews
        large: string;       // 556x370 - for recipe detail pages
        original: string;    // Full size original
    };
    
    // Ingredients (from extendedIngredients)
    ingredients: Array<{
        id: number;
        name: string;
        amount: number;
        unit: string;
        original: string;  // Original text
        aisle: string;     // Spoonacular's aisle categorization
    }>;
    
    // Instructions
    steps: Array<{
        number: number;
        step: string;
        equipment: string[];
        ingredients: string[];
    }>;
    
    // Nutrition (comprehensive - from nutrition.nutrients)
    nutrition: {
        // Macronutrients
        calories: number;
        protein: number;           // grams
        fat: number;               // grams
        carbohydrates: number;     // grams
        fiber: number;             // grams
        sugar: number;             // grams
        
        // Fats breakdown
        saturatedFat: number;      // grams
        unsaturatedFat: number;    // grams (mono + poly)
        transFat: number;          // grams
        cholesterol: number;       // mg
        
        // Diet Compass key metrics
        omega3: number;            // mg - critical for protocol
        omega6: number;            // mg - ratio matters
        
        // Minerals
        sodium: number;            // mg
        potassium: number;         // mg
        calcium: number;           // mg
        iron: number;              // mg
        magnesium: number;         // mg
        zinc: number;              // mg
        
        // Vitamins
        vitaminA: number;          // IU
        vitaminC: number;          // mg
        vitaminD: number;          // IU
        vitaminE: number;          // mg
        vitaminK: number;          // µg
        vitaminB6: number;         // mg
        vitaminB12: number;        // µg
        folate: number;            // µg
        
        // Per-serving calculations
        caloriesPerServing: number;
        proteinPerServing: number;
        fiberPerServing: number;
    };
    
    // TAGS (all dimensions)
    tags: {
        // Primary category
        category: 'meal' | 'snack' | 'component' | 'dessert';
        
        // Searchable dimensions (arrays - can have multiple)
        cuisines: string[];
        diets: string[];         // From Spoonacular's diets array
        dishTypes: string[];     // From Spoonacular's dishTypes array
        mealSlots: string[];     // breakfast, lunch, dinner, snack
        proteinSources: string[];
        
        // Inferred dimensions
        cookingMethods: string[];
        carbBases: string[];
        effortLevel: string;
        spiceLevel: string;
        budgetTier: string;
        kidFriendly: boolean;
        makeAhead: boolean;
        
        // Diet Compass alignment
        dietCompassScore: number;  // 0-100, see Section 6
        protectiveFoods: string[]; // Which protective foods are present
    };
    
    // Provenance
    searchSource: string;  // Which search query found this recipe
    extractedAt: string;   // ISO timestamp
}
```

---

## 6. DIET COMPASS SCORING

Each recipe receives a Diet Compass alignment score (0-100) based on ingredient analysis.

### Protective Foods Detection

```javascript
const protectiveFoods = {
    'whole_grains': ['oats', 'quinoa', 'brown rice', 'bulgur', 'farro', 'whole wheat', 'barley'],
    'legumes': ['lentils', 'chickpeas', 'black beans', 'kidney beans', 'cannellini', 'edamame'],
    'nuts_seeds': ['walnuts', 'almonds', 'chia', 'flax', 'hemp seeds', 'pumpkin seeds'],
    'fermented_dairy': ['yogurt', 'kefir', 'greek yogurt'],
    'fatty_fish': ['salmon', 'sardines', 'mackerel', 'herring', 'anchovies'],
    'dark_chocolate': ['dark chocolate', 'cacao', 'cocoa'],
    'olive_oil': ['olive oil', 'extra virgin olive oil']
};

const harmfulFoods = {
    'red_meat': ['beef', 'pork', 'lamb', 'bacon', 'sausage', 'ham'],
    'processed_meat': ['hot dog', 'salami', 'pepperoni', 'deli meat'],
    'refined_carbs': ['white bread', 'white rice', 'white flour'],
    'added_sugar': ['sugar', 'corn syrup', 'high fructose']
};
```

### Scoring Algorithm

```javascript
function calculateDietCompassScore(recipe) {
    const ingredients = recipe.extendedIngredients
        ?.map(i => i.name.toLowerCase()) || [];
    
    let score = 50;  // Start neutral
    const foundProtective = [];
    
    // Add points for protective foods (+8 each, max 48)
    for (const [category, terms] of Object.entries(protectiveFoods)) {
        if (terms.some(term => ingredients.some(i => i.includes(term)))) {
            score += 8;
            foundProtective.push(category);
        }
    }
    
    // Subtract points for harmful foods (-15 each)
    for (const [category, terms] of Object.entries(harmfulFoods)) {
        if (terms.some(term => ingredients.some(i => i.includes(term)))) {
            score -= 15;
        }
    }
    
    // Bonus for high fiber
    if (recipe.nutrition?.nutrients?.find(n => n.name === 'Fiber')?.amount > 8) {
        score += 5;
    }
    
    // Bonus for vegetable-forward (many veggies in ingredients)
    const veggieCount = ingredients.filter(i => 
        recipe.extendedIngredients.find(e => 
            e.name.toLowerCase() === i && e.aisle?.includes('Produce')
        )
    ).length;
    if (veggieCount >= 4) score += 5;
    
    return {
        score: Math.max(0, Math.min(100, score)),
        protectiveFoods: foundProtective
    };
}
```

---

## 7. EXECUTION SEQUENCE

Execute searches in this order to maximize unique recipes early:

### Phase 1: High-Distinctiveness Searches (First ~350 recipes)

1. **Cuisines** (CUI-01 through CUI-13) — Most distinct, least overlap
2. **Components** (CMP-01 through CMP-07) — Unique category

### Phase 2: Variety Searches (~250 recipes)

3. **Proteins** (PRO-01 through PRO-10) — Fills protein variety gaps
4. **Dish Types** (DSH-01 through DSH-11) — Fills format gaps
5. **Meal Slots** (SLT-01 through SLT-03) — Breakfast/snacks often unique

### Phase 3: Diet & Lifestyle Searches (~150 recipes)

6. **Diets** (DIT-01 through DIT-08) — Many overlaps, but ensures coverage
7. **Kid-Friendly** (KID-01 through KID-03)

### Phase 4: Quality & Alignment (~50 recipes)

8. **Diet Compass** (DC-01 through DC-08) — Fill gaps in health alignment
9. **Effort Levels** (EFF-01 through EFF-03) — Ensure quick options exist

---

## 8. DEDUPLICATION & GAP ANALYSIS

### During Extraction

```javascript
const catalog = new Map();  // spoonacularId -> recipe

function addToCatalog(recipe, searchId) {
    if (catalog.has(recipe.id)) {
        // Already exists - merge tags
        const existing = catalog.get(recipe.id);
        existing.tags = mergeTags(existing.tags, inferAllTags(recipe));
        existing.additionalSources = existing.additionalSources || [];
        existing.additionalSources.push(searchId);
        return false;  // Not a new recipe
    }
    
    catalog.set(recipe.id, {
        ...recipe,
        tags: inferAllTags(recipe),
        searchSource: searchId
    });
    return true;  // New recipe added
}
```

### Post-Extraction Gap Analysis

After all searches complete, analyze coverage:

```javascript
function analyzeGaps(catalog) {
    const coverage = {};
    
    // Count recipes per tag
    for (const recipe of catalog.values()) {
        for (const [dimension, values] of Object.entries(recipe.tags)) {
            if (!coverage[dimension]) coverage[dimension] = {};
            
            const tagValues = Array.isArray(values) ? values : [values];
            for (const value of tagValues) {
                coverage[dimension][value] = (coverage[dimension][value] || 0) + 1;
            }
        }
    }
    
    // Identify gaps (< 5 recipes)
    const gaps = [];
    for (const [dimension, values] of Object.entries(coverage)) {
        for (const [value, count] of Object.entries(values)) {
            if (count < 5) {
                gaps.push({ dimension, value, count });
            }
        }
    }
    
    return { coverage, gaps };
}
```

---

## 9. API IMPLEMENTATION NOTES

### Spoonacular Endpoints Used

| Endpoint | Purpose | Points |
|----------|---------|--------|
| `GET /recipes/complexSearch` | Primary search with filters | 1 + 0.01/result |
| `GET /recipes/{id}/information` | Full recipe details (if needed) | 1 |

### Request Example

```javascript
const response = await fetch(
    'https://api.spoonacular.com/recipes/complexSearch?' + new URLSearchParams({
        apiKey: API_KEY,
        cuisine: 'italian',
        number: 20,
        offset: 0,
        addRecipeInformation: true,
        fillIngredients: true,
        addRecipeNutrition: true,
        instructionsRequired: true,
        sort: 'popularity',
        sortDirection: 'desc'
    })
);
```

### Image URL Construction

Spoonacular provides a base image URL. Construct different sizes using their CDN pattern:

```javascript
function constructImageUrls(recipe) {
    // Base image URL from API: e.g., "https://spoonacular.com/recipeImages/123456-556x370.jpg"
    // Extract the recipe ID from the image URL or use recipe.id
    
    const baseUrl = 'https://spoonacular.com/recipeImages';
    const id = recipe.id;
    const imageType = recipe.imageType || 'jpg';  // Usually 'jpg' or 'png'
    
    return {
        thumbnail: `${baseUrl}/${id}-90x90.${imageType}`,
        small: `${baseUrl}/${id}-240x150.${imageType}`,
        medium: `${baseUrl}/${id}-312x231.${imageType}`,
        large: `${baseUrl}/${id}-556x370.${imageType}`,
        original: `${baseUrl}/${id}-636x393.${imageType}`  // Largest standard size
    };
}
```

**Image Size Recommendations:**

| Size | Dimensions | Use Case |
|------|------------|----------|
| thumbnail | 90×90 | Search result lists, compact views |
| small | 240×150 | Recipe cards in grids |
| medium | 312×231 | Recipe previews, mobile detail |
| large | 556×370 | Desktop recipe detail pages |
| original | 636×393 | Full-screen views, hero images |

### Nutrition Data Extraction

Spoonacular returns nutrition as an array of nutrient objects. Map to our schema:

```javascript
function extractNutrition(recipe) {
    const nutrients = recipe.nutrition?.nutrients || [];
    const servings = recipe.servings || 1;
    
    // Helper to find nutrient by name
    const getNutrient = (name) => {
        const nutrient = nutrients.find(n => 
            n.name.toLowerCase() === name.toLowerCase()
        );
        return nutrient?.amount || 0;
    };
    
    const calories = getNutrient('Calories');
    const protein = getNutrient('Protein');
    const fiber = getNutrient('Fiber');
    
    return {
        // Macronutrients
        calories: calories,
        protein: protein,
        fat: getNutrient('Fat'),
        carbohydrates: getNutrient('Carbohydrates'),
        fiber: fiber,
        sugar: getNutrient('Sugar'),
        
        // Fats breakdown
        saturatedFat: getNutrient('Saturated Fat'),
        unsaturatedFat: getNutrient('Mono Unsaturated Fat') + getNutrient('Poly Unsaturated Fat'),
        transFat: getNutrient('Trans Fat'),
        cholesterol: getNutrient('Cholesterol'),
        
        // Diet Compass key metrics (may not always be available)
        omega3: getNutrient('Omega-3') || getNutrient('Omega 3 Fatty Acids') || 0,
        omega6: getNutrient('Omega-6') || getNutrient('Omega 6 Fatty Acids') || 0,
        
        // Minerals
        sodium: getNutrient('Sodium'),
        potassium: getNutrient('Potassium'),
        calcium: getNutrient('Calcium'),
        iron: getNutrient('Iron'),
        magnesium: getNutrient('Magnesium'),
        zinc: getNutrient('Zinc'),
        
        // Vitamins
        vitaminA: getNutrient('Vitamin A'),
        vitaminC: getNutrient('Vitamin C'),
        vitaminD: getNutrient('Vitamin D'),
        vitaminE: getNutrient('Vitamin E'),
        vitaminK: getNutrient('Vitamin K'),
        vitaminB6: getNutrient('Vitamin B6'),
        vitaminB12: getNutrient('Vitamin B12'),
        folate: getNutrient('Folate'),
        
        // Per-serving calculations
        caloriesPerServing: Math.round(calories / servings),
        proteinPerServing: Math.round((protein / servings) * 10) / 10,
        fiberPerServing: Math.round((fiber / servings) * 10) / 10
    };
}
```

**Note on Omega-3 Data:** Spoonacular doesn't always provide omega-3/omega-6 data for every recipe. For recipes featuring fatty fish (salmon, sardines, mackerel), consider using reference values:

| Fish (per 100g) | Omega-3 (mg) |
|-----------------|--------------|
| Salmon | 2,260 |
| Sardines | 1,480 |
| Mackerel | 2,670 |
| Tuna | 270 |
| Cod | 180 |

### Rate Limiting

- Free tier: 1 request/second
- Cook tier: 5 requests/second
- Implement exponential backoff on 429 responses
- Cache all responses to avoid redundant calls

---

## 10. SUMMARY

| Category | Search Count | Target Recipes |
|----------|--------------|----------------|
| Cuisines | 13 | 165 |
| Diets | 8 | 90 |
| Dish Types | 11 | 130 |
| Proteins | 10 | 120 |
| Meal Slots | 3 | 60 |
| Components | 7 | 50 |
| Effort Levels | 3 | 45 |
| Diet Compass | 8 | 100 |
| Kid-Friendly | 3 | 40 |
| **TOTAL** | **66** | **~800** |

*Actual yield will be lower due to deduplication, expect ~700-800 unique recipes.*

---

## APPENDIX A: COMPLETE TAG VALUE REFERENCE

### cuisines
italian, indian, thai, mexican, japanese, chinese, mediterranean, greek, middle-eastern, french, korean, vietnamese, spanish, american, african, caribbean

### diets
vegetarian, vegan, gluten-free, dairy-free, keto, paleo, whole30, pescatarian, low-fodmap

### mealSlots
breakfast, lunch, dinner, snack

### dishTypes
soup, salad, sandwich, bowl, stew, curry, stir-fry, casserole, pasta, tacos, sheet-pan, wrap, pizza, frittata, risotto

### proteinSources
chicken, beef, pork, salmon, white-fish, shrimp, tofu, tempeh, lentils, chickpeas, black-beans, eggs, turkey, lamb

### cookingMethods
grill, bake, roast, sauté, steam, slow-cook, pressure-cook, no-cook, air-fry, braise, poach, deep-fry

### carbBases
rice, pasta, potato, bread, quinoa, noodles, couscous, polenta, none

### effortLevels
quick, easy, medium, project

### spiceLevels
none, mild, medium, hot

### budgetTiers
budget, moderate, premium

### protectiveFoods (Diet Compass)
whole_grains, legumes, nuts_seeds, fermented_dairy, fatty_fish, dark_chocolate, olive_oil
