# Meal Planner App Specification
**Version:** 1.0 Draft
**Created:** December 2025

---

## 1. OVERVIEW

### Purpose
A one-click weekly meal planning app that generates personalized meal plans for Roland (Diet Compass protocol) and Maia (4-year-old daughter), creates an ingredient-efficient shopping list optimized by store aisle, and provides daily prep guidance.

### Core Workflow
```
┌─────────────────────────────────────────────────────────────────────┐
│  1. USER INPUT                                                      │
│     - Click "Generate Week"                                         │
│     - Optional: Add weekly prompt (preferences, ingredients to use) │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. AI GENERATION (Claude API)                                      │
│     - Reads: Base specification + User prompt + Feedback history    │
│     - Generates: Both meal plans + Shopping list                    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. STORE INTEGRATION (MCP)                                         │
│     - Looks up each ingredient                                      │
│     - Gets: Price, aisle location, product details                  │
│     - Optimizes: Shopping route, budget alternatives                │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  4. OUTPUT                                                          │
│     - Weekly meal plan view (Roland + Maia)                         │
│     - Aisle-optimized shopping list with prices                     │
│     - Daily prep checklists                                         │
│     - Budget summary                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  5. FEEDBACK LOOP                                                   │
│     - End of week: Rate meals, note issues                          │
│     - Feedback stored and fed into future generations               │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Goals
- **Minimal effort**: One click to generate everything
- **Ingredient efficiency**: Shared ingredients across meals, minimize waste
- **Budget conscious**: Target max $150/week
- **Store optimized**: Shopping list ordered by aisle for Caulfield store
- **Iterative improvement**: Learns from weekly feedback

---

## 2. ROLAND'S MEAL PLAN

### Schedule
| Day | Breakfast | Lunch | Dinner |
|-----|-----------|-------|--------|
| Sunday | 8:00 AM | 12:30 PM | 5:30 PM |
| Monday | 8:00 AM | 12:30 PM | 5:30 PM |
| Tuesday | 8:00 AM | 12:30 PM | 5:30 PM |
| Wednesday | 8:00 AM | 12:30 PM | 5:30 PM |
| Thursday | 8:00 AM | 12:00 PM (EARLY) | NO DINNER (fast) |
| Friday | Coffee only | 1:00 PM (LATE) | 5:30 PM |
| Saturday | 8:00 AM | 12:30 PM | 5:30 PM |

### Diet Compass Rules

#### Eating Window
- Window: 8:00 AM - 6:00 PM
- Fasting: 6:00 PM - 8:00 AM (14 hours daily)
- No snacking between meals
- No food after 6:00 PM

#### Weekly 24-Hour Fast
- Start: Thursday 12:00 PM (early lunch)
- End: Friday 1:00 PM (late lunch)
- During fast: Water, black coffee, herbal tea only
- Friday is a lighter calorie day (~1,200-1,300 cal)

#### Daily Targets (Standard Days)
- Calories: 1,490-1,540
- Protein: 60-75g (~15%)
- Fats: 60-70g (healthy sources)
- Carbs: 150-180g (whole grains only)
- Fiber: 35-45g
- Omega-3: 5.5-7g

#### Meal Structure

**Breakfast (280-300 cal)**
- 1 homemade protein bar (see recipe in base doc)
- Water/black coffee/herbal tea

**Lunch (880-900 cal)**
- 1 protein bar
- ~600 cal complement from protective/neutral foods
- Options include: Hummus Power Bowl, Lentil Soup, Whole Grain Wrap, Buddha Bowl, Chickpea Salad, Vegetable Soup & Grain
- 10-minute walk after (mandatory)

**Dinner (450-500 cal)**
- Protein: 120-150g fish/tofu/tempeh
- Vegetables: 200-300g
- Healthy fat: Olive oil
- Optional: 50g fermented vegetables
- NO carbohydrates (no rice, bread, pasta, potatoes)
- Fish 3-4x per week, plant-based 2-3x per week

#### Food Classifications

**PROTECTIVE (Maximize)**
- Fruits, whole grains, legumes
- Nuts and seeds (walnuts, almonds, chia, flax)
- Fermented dairy (Greek yogurt, kefir)
- Dark chocolate (70%+)

**NEUTRAL (Include regularly)**
- All vegetables
- Eggs, poultry
- Fatty fish (salmon, sardines, mackerel)

**AVOID**
- Red meat, processed meats
- Ultra-processed foods
- Added sugars, refined carbs

---

## 3. MAIA'S MEAL PLAN

### Schedule (When with Roland)
| Day | Breakfast | Lunch | Dinner |
|-----|-----------|-------|--------|
| Sunday | — | WITH ROLAND | WITH ROLAND |
| Monday | Crumpet | PACKED LUNCH | WITH ROLAND |
| Tuesday | Crumpet | PACKED LUNCH | WITH ROLAND |
| Wednesday | Crumpet | WITH ROLAND | At mum's |

### Meal Requirements

#### Breakfast (When applicable)
- Crumpet (simple, consistent)
- Optional: fruit on the side

#### Packed Lunch (Monday & Tuesday)
Must be portable, finger-food friendly:
- Fruit: Strawberries, blueberries
- Crackers
- Yogurt pouch or small tub
- Protein: Cheese cubes, hummus cup
- Vegetables: Carrot sticks, cucumber
- Sometimes: Sandwich (simple fillings), pasta salad (cold), leftovers

#### Shared Meals (Sunday lunch, Sunday dinner, Monday dinner, Tuesday dinner, Wednesday lunch)

**Food Preferences:**
- Likes pick-up/finger foods
- Likes pasta
- Likes olives, hummus, carrots
- Likes plain foods
- Likes fruit (strawberries, blueberries)
- Crackers and yogurt

**Avoid:**
- Spicy foods
- Complex flavors
- Anything too "mixed together"

**No allergies**

### Maia-Friendly Meal Ideas

**Dinners (can share components with Roland's meals):**
- Plain pasta with butter/parmesan + steamed vegetables on side
- Fish fingers or plain baked fish + veggies
- Simple rice bowl with plain chicken/tofu
- Cheese quesadilla + carrot sticks
- Homemade pizza on pita/wrap
- Boiled eggs + toast soldiers + fruit

**Lunches:**
- Sandwich (cheese, ham, vegemite)
- Pasta salad (plain)
- Leftover pasta
- Hummus + crackers + veg sticks
- Rice paper rolls (simple filling)

### Portion Guidance (4-year-old)
- Protein: 30-50g per meal
- Carbs: 1/4-1/2 cup
- Vegetables: Whatever she'll eat (offer variety)
- Fruit: 1/2 - 1 cup
- Dairy: 1-2 serves/day

---

## 4. INGREDIENT EFFICIENCY RULES

### Core Principle
Maximize ingredient overlap between Roland's and Maia's meals, and across the week, to minimize waste and shopping costs.

### Strategies

**1. Shared Base Ingredients**
Plan meals around common ingredients that work for both:
- Hummus (Roland's lunches + Maia's snacks)
- Greek yogurt (Roland's bowls + Maia's snacks)
- Carrots, cucumber, capsicum (salads + Maia's finger food)
- Pasta (Maia's dinner base, Roland can skip carb but share sauce prep)
- Salmon/fish (cook extra, Maia gets plain portion)
- Chickpeas (Roland's salads + can mash for Maia)
- Berries (protein bars + Maia's fruit)

**2. Batch Cooking Leverage**
- Roland's Sunday protein bar batch uses bananas, berries, oats
- Cook extra grains on Sunday for both meal plans
- Roast vegetables in bulk (Roland's bowls, Maia's sides)

**3. "Use It Up" Priority**
- Fresh produce used within 3-4 days
- Leafy greens early in week
- Hardier veg (carrots, capsicum) later
- Plan leftover meals strategically

**4. Pantry vs. Fresh Split**
- Pantry staples: Assumed stocked, only replace as needed
- Fresh weekly: Produce, dairy, proteins

### Pantry Staples (Assumed Available)
```
ALWAYS STOCKED (don't add to list unless running low):
- Olive oil
- Coconut oil
- Tamari/soy sauce
- Spices (turmeric, black pepper, etc.)
- Oats
- Quinoa/rice (dry)
- Canned chickpeas
- Canned lentils
- Canned tuna/sardines
- Nut butters
- Maple syrup
- Dark chocolate
- Chia seeds, flax seeds
- Protein powder
- Whole grain bread/wraps (can freeze)
- Crumpets (can freeze)
```

---

## 5. SHOPPING LIST GENERATION

### Process
1. **Aggregate**: Combine all ingredients from both meal plans
2. **Consolidate**: Merge same ingredients, sum quantities
3. **Categorize**: Group by store section
4. **Look up**: Query MCP for prices + aisle locations
5. **Optimize**: Suggest substitutions if over budget
6. **Order**: Sort by aisle for efficient shopping route

### Output Format
```
SHOPPING LIST - Week of [Date]
Budget Target: $150 | Estimated Total: $XXX

═══════════════════════════════════════════════════════
AISLE 1 - BREAD & BAKERY
═══════════════════════════════════════════════════════
☐ Whole grain bread (1 loaf)          $4.50    Aisle 1
☐ Crumpets 6-pack                     $3.20    Aisle 1

═══════════════════════════════════════════════════════
AISLE 3 - DAIRY & REFRIGERATED  
═══════════════════════════════════════════════════════
☐ Greek yogurt 1kg                    $7.00    Aisle 3
☐ Kefir 500ml                         $5.50    Aisle 3
...

═══════════════════════════════════════════════════════
FRESH PRODUCE
═══════════════════════════════════════════════════════
☐ Strawberries 250g                   $4.00    Produce
☐ Blueberries 125g                    $5.00    Produce
...

───────────────────────────────────────────────────────
SUBTOTAL: $142.50
UNDER BUDGET BY: $7.50 ✓
───────────────────────────────────────────────────────
```

### Budget Management

**Target**: Maximum $150/week

**If over budget, AI should:**
1. Suggest generic/homebrand alternatives
2. Identify items that could be skipped (already in pantry)
3. Propose recipe substitutions (e.g., canned fish instead of fresh salmon)
4. Flag items on special

**Cost Optimization Rules:**
- Prioritize specials/sales when available
- Default to Coles homebrand for basics
- Fresh salmon → canned salmon if budget tight
- Suggest "buy once, use twice" ingredients

---

## 6. STORE INTEGRATION (MCP)

### Available Stores

#### Primary: Coles Caulfield Village
- **Address:** 5-17 Normanby Road, Caulfield
- **Store ID:** 7724
- **Hours:** 7am - 11pm (midnight some days)
- **URL Pattern:** `coles.com.au/find-stores/coles/vic/caulfield-7724`

#### Secondary: Woolworths Carnegie North
- **Address:** 2/20 Koornang Road, Carnegie (Carnegie Central)
- **Phone:** (03) 8347 6521
- **Hours:** 7am - 11pm

### MCP Server

#### Primary Server: Coles & Woolworths MCP
- **GitHub:** https://github.com/hung-ngm/coles-woolworths-mcp-server
- **Author:** hung-ngm
- **Requirements:**
  - Python 3.8+
  - `uv` package manager
  - `COLES_API_KEY` environment variable (required for Coles)

#### Available Tools
```
get_coles_products
- Search for products at Coles
- Accepts: query (string), storeId (optional), limit (optional)
- Returns: Product name, price, size, brand

get_woolworths_products
- Search for products at Woolworths
- Accepts: query (string), limit (optional)
- Returns: Product name, price, size, brand
```

#### MCP Configuration (for Claude Desktop/Cursor)
```json
{
  "mcpServers": {
    "coles-woolies-mcp": {
      "command": "uv",
      "args": [
        "run",
        "--with", "fastmcp",
        "--with", "requests",
        "--with", "python-dotenv",
        "fastmcp", "run",
        "/path/to/coles-woolies-mcp/main.py"
      ]
    }
  }
}
```

### MCP Queries Required
For each shopping list item:
```
Query: get_coles_products
{
  "query": "Greek yogurt",
  "storeId": "7724",
  "limit": 5
}

Expected Response:
{
  "product_name": "Coles Greek Style Yoghurt 1kg",
  "brand": "Coles",
  "price": 7.00,
  "size": "1kg",
  "category": "Dairy",      // May be available
  "aisle": "3"              // TBD - needs verification
}
```

### Aisle Location Strategy

#### Challenge
The Coles app provides aisle locations ("sort your shopping list by aisle for your chosen store"), but the MCP server may not expose this data. The official API exists internally but may not be accessible via the reverse-engineered endpoints.

#### Strategy 1: Test MCP Response (Preferred)
1. Query products via MCP server
2. Inspect full response for aisle/location/department fields
3. If available, extract and use for sorting

#### Strategy 2: Category-to-Aisle Mapping (Fallback)
If aisle data not in API, create static mapping for Coles Caulfield Village:

```javascript
const COLES_CAULFIELD_AISLE_MAP = {
  // Entry area
  "Produce": { aisle: 1, section: "Fresh Produce" },
  "Bakery": { aisle: 2, section: "Bakery" },
  
  // Refrigerated
  "Dairy": { aisle: 3, section: "Dairy & Eggs" },
  "Deli": { aisle: 3, section: "Deli" },
  "Meat": { aisle: 4, section: "Meat & Seafood" },
  
  // Center aisles
  "Pantry": { aisle: 5, section: "Pantry" },
  "Canned Goods": { aisle: 5, section: "Pantry" },
  "Pasta & Rice": { aisle: 6, section: "Pantry" },
  "International": { aisle: 6, section: "World Foods" },
  "Breakfast": { aisle: 7, section: "Breakfast & Spreads" },
  "Snacks": { aisle: 7, section: "Snacks" },
  "Beverages": { aisle: 8, section: "Drinks" },
  "Health Foods": { aisle: 8, section: "Health & Wellness" },
  
  // Back/Side aisles
  "Frozen": { aisle: 9, section: "Frozen" },
  "Cleaning": { aisle: 10, section: "Household" },
  "Personal Care": { aisle: 11, section: "Health & Beauty" },
  "Baby": { aisle: 11, section: "Baby" },
  "Pet": { aisle: 12, section: "Pet" }
};
```

**Note:** This mapping needs to be verified/created by walking through the actual store once. User can adjust in app settings if layout changes.

#### Strategy 3: Woolworths Developer API (Future)
Woolworths has an official developer portal (developer.woolworths.com.au) with APIs for products "by their Aisle and Category". Could apply for access if needed.

### Aisle Optimization Process
1. Query all shopping items via MCP
2. For each item, determine aisle:
   - Use API aisle field if available
   - Otherwise, map category → aisle using fallback table
3. Sort shopping list by aisle number (ascending)
4. Group items within same aisle
5. Present in walking order (Aisle 1 → 2 → 3 → etc.)

### Price Lookup
Both APIs reliably provide:
- ✅ Current price
- ✅ Product name and size
- ✅ Brand information
- ⚠️ On-special status (may vary)

### Fallback Handling
If MCP unavailable or product not found:
- Use cached prices from last successful query
- Flag item for manual price entry
- Use category-based aisle mapping
- Show "Price unknown" with estimate based on similar items

### Budget Optimization Queries
```
// For each item, query both stores if price comparison enabled:
get_coles_products({ query: "Greek yogurt 1kg", storeId: "7724" })
get_woolworths_products({ query: "Greek yogurt 1kg" })

// Compare and recommend:
{
  "item": "Greek yogurt 1kg",
  "coles_price": 7.00,
  "woolworths_price": 6.50,
  "recommendation": "woolworths",
  "savings": 0.50
}
```

### Implementation Notes
1. **Rate Limiting:** Space out API calls to avoid hitting rate limits
2. **Caching:** Cache product lookups for 24 hours (prices may change daily)
3. **Batch Queries:** Query similar items together where possible
4. **Error Handling:** Gracefully handle API failures, show cached data

---

## 7. DAILY PREP SYSTEM

### Prep Task Categories

**Morning Prep** (before leaving house)
- Pack Maia's lunch (Monday, Wednesday)
- Defrost items if needed
- Quick breakfast prep

**Evening Prep** (after dinner)
- Prep tomorrow's lunch components
- Marinate proteins overnight
- Wash/chop vegetables

**Sunday Batch Prep** (dedicated session)
- Make protein bars (every 2 weeks)
- Cook grains for the week
- Wash and prep vegetables
- Portion snacks for Maia

### Prep Display Format
```
MONDAY PREP

Morning (10 mins):
☐ Pack Maia's lunchbox:
  - Strawberries in container
  - Crackers + hummus pot
  - Yogurt pouch
  - Carrot sticks

Evening (15 mins):
☐ Defrost salmon for Tuesday dinner
☐ Wash salad greens for tomorrow
```

---

## 8. USER INTERFACE

### Screens

#### 1. HOME / GENERATE
```
┌─────────────────────────────────────────┐
│                                         │
│         🍎 MEAL PLANNER                 │
│         Week of Dec 15-21               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  This week's preferences:       │   │
│  │  ─────────────────────────────  │   │
│  │  I have leftover salmon to      │   │
│  │  use up. Maia wants pasta       │   │
│  │  twice this week.               │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     ✨ GENERATE WEEK ✨         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ───────────────────────────────────   │
│  Quick prompts:                         │
│  [Use up: ___] [Maia wants: ___]       │
│  [Budget: tight/normal] [More fish]    │
│                                         │
└─────────────────────────────────────────┘
```

#### 2. WEEKLY OVERVIEW
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│  WEEK OF DEC 15-21                      │
│  Budget: $142 / $150 ✓                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🛒 Shopping List                →│   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│  SUNDAY Dec 15                          │
│  ───────────────────────────────────   │
│  Roland: Protein bar | Hummus Bowl |   │
│          Salmon & Greens                │
│  Maia:   — | Pasta + veg | Fish +      │
│          mashed potato                  │
│  Prep: Make protein bars, cook grains  │
│  ───────────────────────────────────   │
│                                    → │
│  ═══════════════════════════════════   │
│  MONDAY Dec 16                          │
│  ...                                    │
└─────────────────────────────────────────┘
```

#### 3. SHOPPING LIST (Aisle Mode)
```
┌─────────────────────────────────────────┐
│  ← Back              Total: $142.50     │
│                                         │
│  🛒 SHOPPING LIST                       │
│  Coles Caulfield                        │
│                                         │
│  Progress: ████████░░ 24/30 items       │
│                                         │
│  [Hide bought] [Show all]               │
│                                         │
│  ═══════════════════════════════════   │
│  AISLE 1 - BREAD                        │
│  ═══════════════════════════════════   │
│  ☐ Whole grain bread        $4.50      │
│  ☑ Crumpets 6-pack          $3.20      │
│                                         │
│  ═══════════════════════════════════   │
│  AISLE 3 - DAIRY                        │
│  ═══════════════════════════════════   │
│  ☐ Greek yogurt 1kg         $7.00      │
│  ☐ Kefir 500ml              $5.50      │
│                                         │
│  ...                                    │
└─────────────────────────────────────────┘
```

#### 4. DAILY VIEW
```
┌─────────────────────────────────────────┐
│  ← Week                    MONDAY       │
│                            Dec 16       │
│                                         │
│  ══════════════════════════════════    │
│  ROLAND                                 │
│  ══════════════════════════════════    │
│  🌅 Breakfast 8am                       │
│     Protein bar                         │
│                                         │
│  🥗 Lunch 12:30pm                       │
│     Lentil Soup & Bread         [→]    │
│                                         │
│  🍽️ Dinner 5:30pm                       │
│     Sardines Salad              [→]    │
│                                         │
│  ══════════════════════════════════    │
│  MAIA                                   │
│  ══════════════════════════════════    │
│  🌅 Breakfast                           │
│     Crumpet + strawberries             │
│                                         │
│  🍱 Packed Lunch                        │
│     Pasta salad, yogurt, berries [→]   │
│                                         │
│  🍽️ Dinner 5:30pm                       │
│     Pasta with butter + peas    [→]    │
│                                         │
│  ──────────────────────────────────    │
│  📋 TODAY'S PREP                        │
│  ──────────────────────────────────    │
│  Morning:                               │
│  ☐ Pack Maia's lunchbox                │
│                                         │
│  Evening:                               │
│  ☐ Defrost tofu for tomorrow           │
│                                         │
└─────────────────────────────────────────┘
```

#### 5. RECIPE VIEW
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│  SARDINES SALAD                         │
│  Roland's Dinner                        │
│                                         │
│  ──────────────────────────────────    │
│  INGREDIENTS                            │
│  ──────────────────────────────────    │
│  • 125g tinned sardines, drained       │
│  • 250g mixed salad                     │
│  • 50g avocado (1/4)                   │
│  • 50g cherry tomatoes                  │
│  • 15ml olive oil                       │
│  • Lemon, herbs                         │
│                                         │
│  ──────────────────────────────────    │
│  STEPS                                  │
│  ──────────────────────────────────    │
│  1. Arrange 250g salad on plate        │
│  2. Top with 125g sardines             │
│  3. Add 50g avocado and tomatoes       │
│  4. Drizzle olive oil and lemon        │
│  5. Garnish with herbs                  │
│                                         │
│  ──────────────────────────────────    │
│  NUTRITION                              │
│  450 cal | 30g protein | 2g omega-3    │
│                                         │
└─────────────────────────────────────────┘
```

#### 6. WEEKLY FEEDBACK
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│  📝 WEEK FEEDBACK                       │
│  Dec 15-21                              │
│                                         │
│  How was this week's plan?              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Overall: ⭐⭐⭐⭐☆              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ──────────────────────────────────    │
│  MEALS                                  │
│  ──────────────────────────────────    │
│  👍 Loved                               │
│  [Salmon dinner] [Buddha bowl]         │
│                                         │
│  👎 Didn't work                         │
│  [Mackerel - too fishy for Maia]       │
│                                         │
│  ──────────────────────────────────    │
│  SHOPPING                               │
│  ──────────────────────────────────    │
│  ☐ Bought unnecessary items            │
│  ☐ Missing items                        │
│  ☑ Budget was good                      │
│                                         │
│  ──────────────────────────────────    │
│  NOTES FOR NEXT WEEK                    │
│  ──────────────────────────────────    │
│  ┌─────────────────────────────────┐   │
│  │ Less mackerel. Maia loved the   │   │
│  │ pasta night - keep that. Need   │   │
│  │ more variety in my lunches.     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [SAVE FEEDBACK]                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. AI GENERATION PROMPT STRUCTURE

### System Prompt (Base Specification)
The full specification document (this document) serves as the system prompt, providing:
- Roland's Diet Compass rules
- Maia's meal requirements and schedule
- Ingredient efficiency rules
- Budget constraints
- Meal options and recipes

### User Prompt (Weekly Input)
```
Generate a meal plan for the week of [DATE].

User preferences for this week:
[USER INPUT FROM APP]

Previous feedback to incorporate:
[STORED FEEDBACK FROM LAST 4 WEEKS]

Constraints:
- Budget: $150 max
- Store: Coles Caulfield
- Pantry staples available (see list)

Output required:
1. Roland's meals (Sun-Sat) with recipes
2. Maia's meals (Sun lunch/dinner, Mon all, Tue all, Wed breakfast/lunch)
3. Combined shopping list with quantities
4. Daily prep tasks
5. Estimated budget breakdown
```

### AI Output Structure
```json
{
  "week_of": "2025-12-15",
  "roland_meals": {
    "sunday": {
      "breakfast": {...},
      "lunch": {...},
      "dinner": {...}
    },
    ...
  },
  "maia_meals": {
    "sunday": {
      "lunch": {...},
      "dinner": {...}
    },
    ...
  },
  "shopping_list": [
    {"item": "Salmon fillet", "quantity": "300g", "category": "proteins", "estimated_price": 12.00},
    ...
  ],
  "prep_tasks": {
    "sunday": {"morning": [...], "evening": [...]},
    ...
  },
  "budget_estimate": 142.50,
  "notes": "Using salmon twice this week as requested..."
}
```

---

## 10. FEEDBACK SYSTEM

### Data Collected
- Overall week rating (1-5 stars)
- Meals marked as "loved" or "didn't work"
- Shopping list accuracy (missing items, unnecessary items)
- Budget satisfaction
- Free-text notes

### Feedback Storage
Store last 8 weeks of feedback, summarized into:
```
FEEDBACK HISTORY (fed into AI generation):

Recent patterns:
- Maia consistently dislikes: mackerel, strong fish flavors
- Roland favorites: Buddha bowl, Salmon & greens
- Budget consistently under $145 ✓
- Common issue: Over-buying salad greens

Specific requests carried forward:
- "More pasta variety for Maia"
- "Try new lunch options for Roland"
```

### Feedback Loop
1. End of week → User submits feedback
2. Feedback summarized and stored
3. Next generation → AI receives feedback summary
4. AI adjusts plan based on patterns

---

## 11. TECHNICAL ARCHITECTURE

### Stack (Suggested)
```
Frontend: React (PWA for mobile Safari)
    ↓
API Layer: Node.js / Express (or serverless functions)
    ↓
AI Generation: Claude API (Anthropic)
    ↓
Store Data: Coles/Woolworths MCP Server
    ↓
Storage: localStorage + optional cloud sync
```

### MCP Server Setup

#### Prerequisites
```bash
# Install uv package manager
# macOS/Linux:
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows:
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### Installation
```bash
# Clone the MCP server
git clone https://github.com/hung-ngm/coles-woolworths-mcp-server.git
cd coles-woolworths-mcp-server

# Install dependencies
uv pip install fastmcp requests python-dotenv

# Create .env file
echo "COLES_API_KEY=your_api_key_here" > .env
```

#### Obtaining Coles API Key
The Coles API key may need to be obtained by:
1. Inspecting network requests in browser dev tools while using coles.com.au
2. Extracting from the Coles mobile app
3. Checking the MCP server's GitHub issues for guidance

#### Running the Server
```bash
# Run directly
uv run main.py

# Or via MCP client configuration (Claude Desktop, etc.)
```

### App Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MEAL PLANNER APP                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React PWA)                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Home   │ │  Week   │ │Shopping │ │  Daily  │          │
│  │Generate │ │Overview │ │  List   │ │  View   │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       └──────────┴──────────┴──────────┴───────────────────┤
│                           │                                 │
│  State Management (React Context / Zustand)                 │
│       │                                                     │
├───────┴─────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Meal Generation │  │ Shopping List   │                  │
│  │ Service         │  │ Service         │                  │
│  │ - Claude API    │  │ - MCP Queries   │                  │
│  │ - Spec parsing  │  │ - Aisle sorting │                  │
│  │ - Feedback loop │  │ - Price lookup  │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
├───────────┴────────────────────┴────────────────────────────┤
│  External APIs                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Claude API     │  │  MCP Server     │                  │
│  │  (Anthropic)    │  │  (Coles/Woolies)│                  │
│  │                 │  │                 │                  │
│  │  - Generation   │  │  - Products     │                  │
│  │  - Chat         │  │  - Prices       │                  │
│  │  - Structured   │  │  - Categories   │                  │
│  │    output       │  │  - (Aisles?)    │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Local Storage                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Current Plan    │  │ Feedback History│                  │
│  │ - Meals         │  │ - Last 8 weeks  │                  │
│  │ - Shopping list │  │ - Preferences   │                  │
│  │ - Checked items │  │ - Ratings       │                  │
│  └─────────────────┘  └─────────────────┘                  │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Aisle Mapping   │  │ Price Cache     │                  │
│  │ - Store layout  │  │ - 24hr TTL      │                  │
│  │ - User editable │  │ - Per product   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. USER OPENS APP
   └── Load cached plan from localStorage
   └── Display current week or prompt to generate

2. USER CLICKS "GENERATE WEEK"
   └── Collect user prompt (preferences)
   └── Load feedback history (last 8 weeks)
   └── Load base specification
   
3. CALL CLAUDE API
   └── System prompt: Full app specification
   └── User prompt: Week preferences + feedback
   └── Response: Structured JSON (meals + shopping list)
   
4. PROCESS SHOPPING LIST
   └── For each item:
       ├── Query MCP: get_coles_products(item, storeId="7724")
       ├── Extract: price, category, (aisle if available)
       └── If no aisle: lookup category in aisle mapping
   └── Sort items by aisle number
   └── Calculate total budget
   
5. SAVE & DISPLAY
   └── Cache plan to localStorage
   └── Display weekly overview
   └── Shopping list ready for use

6. DURING SHOPPING
   └── User checks off items (saved to localStorage)
   └── Progress tracked
   └── Works offline

7. END OF WEEK
   └── User submits feedback
   └── Feedback saved to history
   └── Used in next generation
```

### Offline Capability
- Generated plan cached locally
- Shopping list works offline (checkbox state saved)
- Daily views available offline
- Only "Generate" requires internet
- Aisle mapping stored locally

### Environment Variables
```bash
# Required for the app
ANTHROPIC_API_KEY=sk-ant-...       # Claude API key
COLES_API_KEY=...                   # Coles product API key

# Optional
WOOLWORTHS_ENABLED=true             # Enable Woolworths queries
DEFAULT_STORE_ID=7724               # Coles Caulfield Village
```

### API Rate Limiting Strategy
```javascript
const RATE_LIMITS = {
  claude: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000
  },
  mcp: {
    requestsPerMinute: 30,  // Conservative estimate
    cacheTime: 86400000     // 24 hours in ms
  }
};

// Batch shopping list queries
async function queryShoppingList(items) {
  const results = [];
  for (const item of items) {
    // Check cache first
    const cached = await getFromCache(item);
    if (cached && !isExpired(cached)) {
      results.push(cached);
      continue;
    }
    
    // Query API with delay
    await delay(2000); // 2 seconds between requests
    const result = await mcpQuery(item);
    await saveToCache(item, result);
    results.push(result);
  }
  return results;
}
```

---

## 12. FUTURE ENHANCEMENTS

### Phase 2
- Barcode scanning for pantry inventory
- Automatic "running low" detection
- Recipe scaling based on guests
- Nutritional tracking dashboard

### Phase 3
- Multi-store price comparison
- Delivery integration (Coles/Woolworths online)
- Meal photo logging
- Share meal plans with Maia's mum

---

## APPENDIX A: MAIA'S MEAL SCHEDULE SUMMARY

| Day | Breakfast | Lunch | Dinner |
|-----|-----------|-------|--------|
| Sunday | — | ✓ With Roland | ✓ With Roland |
| Monday | Crumpet | ✓ Packed | ✓ With Roland |
| Tuesday | Crumpet | ✓ Packed | ✓ With Roland |
| Wednesday | Crumpet | ✓ With Roland | At mum's |
| Thursday | — | — | — |
| Friday | — | — | — |
| Saturday | — | — | — |

---

## APPENDIX B: ROLAND'S FASTING SCHEDULE

| Day | Breakfast | Lunch | Dinner | Notes |
|-----|-----------|-------|--------|-------|
| Thursday | ✓ 8am | ✓ 12pm EARLY | ✗ NONE | Fast begins after lunch |
| Friday | ✗ Coffee only | ✓ 1pm LATE | ✓ 5:30pm | Break fast at 1pm, lighter day |

---

## APPENDIX C: SAMPLE WEEK OUTPUT

### Week of December 15, 2025

**User Prompt:** "I have half a cabbage to use up. Maia wants spaghetti this week."

**Generated Plan:**

| Day | Roland Lunch | Roland Dinner | Maia Meals |
|-----|--------------|---------------|------------|
| Sun | Hummus Bowl | Salmon + cabbage slaw | Spaghetti bolognese, fruit |
| Mon | Lentil Soup | Tofu stir-fry w/ cabbage | Crumpet / Packed: pasta salad, yogurt, berries / Dinner: Leftover spaghetti |
| Tue | Wrap | Sardines + coleslaw | Crumpet / Packed: sandwich, fruit, yogurt / Dinner: Cheese quesadilla + carrots |
| Wed | Buddha Bowl | Mackerel stir-fry | Crumpet / Lunch: Sandwich + fruit / At mum's for dinner |
| Thu | Chickpea Salad (EARLY) | FASTING | — |
| Fri | Light salad (LATE) | Smoked tofu salad | — |
| Sat | Veg Soup & Grain | Tuna bowl | — |

**Budget:** $138.50 / $150 ✓
**Cabbage:** Used across 3 meals ✓
**Spaghetti:** Sunday dinner for Maia, leftovers Monday ✓

---

*End of Specification v1.0*
