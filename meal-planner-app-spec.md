# Meal Planner App Specification
**Version:** 2.0 (Implementation)
**Created:** December 2025
**Last Updated:** December 2025

---

## IMPLEMENTATION SUMMARY

This specification has been updated to reflect the **actual implemented system** (v2.0). The app is fully functional and deployed.

### Key Implementation Decisions

| Aspect | Original Spec | Actual Implementation | Rationale |
|--------|--------------|----------------------|-----------|
| **Frontend** | React PWA | Vanilla JavaScript + ES6 Modules | Simpler, faster, no build step required |
| **State Management** | React Context/Zustand | Observer pattern + localStorage | Lightweight, sufficient for app needs |
| **AI Model** | Claude API (unspecified) | Claude 3.5 Haiku | Fast, cost-effective, 8K output |
| **Store Integration** | MCP Server (live pricing) | AI-estimated pricing | Simpler deployment, no API dependencies |
| **API Key Storage** | Client-side localStorage | Server-side (Vercel env vars) | More secure, better UX |
| **Week Start** | Sunday | Configurable shopping day | Aligns with real shopping patterns |
| **Routing** | Not specified | Hash-free SPA routing | Clean URLs, works offline |
| **Recipes** | Separate recipe view | Inline on daily page | More convenient, less navigation |
| **Export** | Not detailed | Comprehensive markdown | Print-friendly, includes all formats |

### What's Implemented ✅

**Core Features:**
- One-click meal plan generation with Claude AI
- Dual meal plans (Roland + Maya)
- Budget tracking ($150 default)
- Aisle-organized shopping list
- Interactive checklists (persistent state)
- Weekly feedback system
- Markdown export/print
- Mobile-responsive UI
- Offline capability (once generated)

**Smart Features:**
- Configurable shopping day (defaults to Saturday)
- Partial week regeneration (mid-week updates)
- Feedback learning (last 8 weeks)
- Progress tracking with visual indicators
- Special day handling (fast days)
- Recipe details with ingredients & steps
- Prep task checklists

**Technical:**
- Vanilla JS (no framework)
- Vercel serverless functions
- Server-side API key storage
- localStorage persistence
- Observer pattern for reactivity
- ES6 modules for organization

### What's NOT Implemented (Future)

- ❌ Live store API integration (prices are AI estimates)
- ❌ Real-time aisle locations (uses static mapping)
- ❌ MCP server integration
- ❌ Multi-store price comparison
- ❌ Pantry inventory tracking
- ❌ Nutritional dashboard
- ❌ Photo logging
- ❌ Delivery integration
- ❌ Multi-user/sharing features

See [Appendix: Future Enhancements](#13-future-enhancements-not-yet-implemented) for detailed roadmap.

---

## 1. OVERVIEW

### Purpose
A one-click weekly meal planning app that generates personalized meal plans for Roland (Diet Compass protocol) and Maya (4-year-old daughter), creates an ingredient-efficient shopping list organized by store aisle, and provides daily prep guidance with recipes.

### Core Workflow (As Implemented)
```
┌─────────────────────────────────────────────────────────────────────┐
│  1. USER INPUT                                                      │
│     - Navigate to "Generate Week" page                              │
│     - Optional: Add weekly preferences                              │
│     - Set budget target ($150 default)                              │
│     - Select store (Coles Caulfield / Woolworths Carnegie)          │
│     - Select shopping day (Saturday default)                        │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. AI GENERATION (Claude 3.5 Haiku via Vercel Function)           │
│     - Server calls Claude API with:                                 │
│       * Base dietary specification                                  │
│       * User preferences                                            │
│       * Feedback history (last 8 weeks from localStorage)           │
│     - Claude generates complete JSON:                               │
│       * 7 days of meals (Roland + Maya)                            │
│       * 2-3 recipes per day with ingredients & steps               │
│       * 25-40 shopping items with prices & aisle numbers           │
│       * Prep tasks for each day                                     │
│     - Progress indicator shows real-time generation steps           │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. DATA TRANSFORMATION                                             │
│     - Parse Claude's JSON response                                  │
│     - Transform to app data structure                               │
│     - Apply fallback meals if generation incomplete                 │
│     - Calculate week dates from shopping day                        │
│     - Assign aisle numbers using category mapping                   │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  4. STORAGE & DISPLAY                                               │
│     - Save meal plan to localStorage                                │
│     - Navigate to home page                                         │
│     - Display:                                                      │
│       * Weekly overview with budget                                 │
│       * Interactive shopping list (aisle-sorted)                    │
│       * Daily meal plans with recipes inline                        │
│       * Prep checklists with checkboxes                            │
│       * Export/print button for markdown document                   │
└─────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│  5. FEEDBACK LOOP                                                   │
│     - End of week: Submit feedback form                             │
│     - Rate overall week (1-5 stars)                                 │
│     - Note loved/disliked meals                                     │
│     - Shopping list feedback                                        │
│     - Notes for next week                                           │
│     - Stored in localStorage (last 8 weeks)                         │
│     - Fed into next generation as context                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Features (As Implemented)
- **One-click generation**: Generate complete week from single prompt
- **AI-powered planning**: Claude 3.5 Haiku creates personalized meal plans
- **Smart week calculation**: Configurable shopping day, partial week support
- **Budget tracking**: Live budget display, target vs. estimated
- **Aisle-optimized shopping**: Items grouped by store aisle for efficient shopping
- **Interactive checklists**: Check off shopping items & prep tasks
- **Recipe details**: Full ingredients and steps for every meal
- **Export/print**: Generate comprehensive markdown document
- **Offline-capable**: Works without internet once plan is generated
- **Feedback learning**: Historical feedback improves future generations

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

### Maya-Friendly Meal Ideas

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
Maximize ingredient overlap between Roland's and Maya's meals, and across the week, to minimize waste and shopping costs.

### Strategies

**1. Shared Base Ingredients**
Plan meals around common ingredients that work for both:
- Hummus (Roland's lunches + Maya's snacks)
- Greek yogurt (Roland's bowls + Maya's snacks)
- Carrots, cucumber, capsicum (salads + Maya's finger food)
- Pasta (Maya's dinner base, Roland can skip carb but share sauce prep)
- Salmon/fish (cook extra, Maya gets plain portion)
- Chickpeas (Roland's salads + can mash for Maya)
- Berries (protein bars + Maya's fruit)

**2. Batch Cooking Leverage**
- Roland's Sunday protein bar batch uses bananas, berries, oats
- Cook extra grains on Sunday for both meal plans
- Roast vegetables in bulk (Roland's bowls, Maya's sides)

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

## 5. SHOPPING LIST GENERATION (AS IMPLEMENTED)

### Generation Process

**Claude generates shopping list directly in JSON:**
1. Analyzes all meals across both Roland's and Maya's plans
2. Extracts ingredients from all recipes
3. Consolidates duplicate ingredients with summed quantities
4. Assigns each item to a category (Produce/Proteins/Dairy/Grains/Pantry/Bakery)
5. Estimates realistic prices based on typical Australian supermarket costs
6. Assigns aisle numbers based on category
7. Aims for 25-40 items total
8. Considers user's budget target

**Claude's Shopping List Output:**
```json
"shopping_list": [
  {
    "item": "Salmon fillet",
    "quantity": "400g",
    "category": "Proteins",
    "estimated_price": 15.00,
    "aisle": 4
  },
  {
    "item": "Mixed salad greens",
    "quantity": "4 bags",
    "category": "Produce",
    "estimated_price": 12.00,
    "aisle": 1
  }
]
```

### App Processing (mealPlanTransformer.js)

After receiving Claude's response:
1. **Category Grouping**: Group items by category
2. **Aisle Mapping**: Use static category-to-aisle map if aisle not provided
3. **Structure Transformation**: Convert to app format with cat + items arrays

```javascript
// Static aisle mapping (fallback)
const AISLE_MAP = {
  'Produce': 1,
  'Bakery': 2,
  'Dairy': 3,
  'Proteins': 4,
  'Grains': 5,
  'Pantry': 5,
  'Protein Bars': 6
};
```

### Display Format (Shopping List Page)

**Budget Summary Card:**
```
Budget: $142.50 / $150 ✓
Under by $7.50

Progress: 12 / 35 items (34%)
[Progress bar]
```

**Aisle-Organized List:**
```
AISLE 1 - PRODUCE
☐ Salad greens (4 bags)          $12.00
☐ Tomatoes (2)                    $3.00
☐ Cucumbers (4)                   $4.00

AISLE 3 - DAIRY
☐ Greek yogurt 1kg                $7.00
☐ Kefir 500ml                     $5.50
☐ Firm tofu 400g                  $4.50

AISLE 4 - PROTEINS
☐ Salmon 150g                     $8.00
☐ Sardines (tin)                  $3.50
```

**Interactive Features:**
- Click item to check off (saves to localStorage immediately)
- "Hide Bought Items" toggle
- Progress bar updates as items checked
- "Remaining to Buy" total shows unchecked items cost
- Persistent state across page refreshes

### Budget Management (As Implemented)

**Budget Input:**
- User sets target during generation (default: $150)
- Claude receives target in generation prompt
- Claude aims to stay under budget

**Budget Display:**
- Home page: Large budget card (green if under, red if over)
- Shopping list: Budget card + remaining to buy
- Weekly overview: Budget summary

**Claude Budget Optimization:**
When user sets tight budget or preferences mention budget concerns:
1. Uses more affordable proteins (tinned fish vs fresh)
2. Suggests pantry staples that may already be available
3. Optimizes ingredient overlap (use same veg across multiple meals)
4. Includes notes like "Consider using homebrand to save $X"
5. Avoids expensive specialty items

**No Real-Time Price Checking:**
- Prices are AI estimates, not live data
- Good enough for planning purposes
- User manually adjusts budget if actual shopping differs

### Export Format (Markdown Document)

The export generates comprehensive shopping lists in multiple formats:

1. **By Category** (Produce, Proteins, Dairy, etc.)
   - Sub-categorized (e.g., Vegetables, Fruits, Herbs)
   - Checkboxes for printing
   - Prices shown if available

2. **By Store Aisle** (Optimized shopping route)
   - Grouped 1→12 in order
   - Matches Coles Caulfield layout
   - Efficient in-store navigation

Both formats included in single export document for flexibility.

---

## 6. STORE INTEGRATION & PRICING

### Current Implementation: AI-Estimated Pricing

**Status:** No live store integration. Claude AI estimates prices based on typical Australian supermarket pricing.

#### How It Works
1. User selects store during generation (Coles Caulfield or Woolworths Carnegie)
2. Claude API receives store preference in generation prompt
3. Claude estimates realistic prices for each shopping item
4. Prices are stored with shopping list items
5. Budget is calculated from estimated prices

#### Accuracy
- Prices are reasonable estimates based on Claude's training data
- May not reflect current specials, sales, or price changes
- Typically within ±20% of actual prices
- Good enough for budget planning purposes

### Available Stores (Selectable)

#### Primary: Coles Caulfield Village
- **Address:** 5-17 Normanby Road, Caulfield VIC
- **Store ID:** 7724
- **Hours:** 7am - 11pm daily
- Used as default for price estimation context

#### Secondary: Woolworths Carnegie North
- **Address:** 2/20 Koornang Road, Carnegie VIC
- **Phone:** (03) 8347 6521
- **Hours:** 7am - 11pm daily
- Alternative option for price estimation context

### Aisle Mapping (Implemented)

The app uses **static category-to-aisle mapping** for organizing the shopping list:

```javascript
const AISLE_MAP = {
  'Produce': { aisle: 1, section: 'Fresh Produce' },
  'Bakery': { aisle: 2, section: 'Bakery' },
  'Dairy': { aisle: 3, section: 'Dairy & Eggs' },
  'Proteins': { aisle: 4, section: 'Meat & Seafood' },
  'Grains': { aisle: 5, section: 'Pantry' },
  'Pantry': { aisle: 5, section: 'Pantry' },
  'Protein Bars': { aisle: 6, section: 'Health & Wellness' }
};
```

#### Aisle Assignment Process
1. Claude assigns each shopping item to a category
2. App maps category to aisle number using static table
3. Shopping list is sorted by aisle number (1 → 12)
4. Items displayed grouped by aisle for efficient shopping route

#### Why No Live API Integration?

**Pros of Current Approach:**
- ✅ No API keys or external dependencies required
- ✅ Instant generation (no rate limits)
- ✅ No cost per query
- ✅ Works reliably without network dependencies
- ✅ Simpler deployment and maintenance

**Cons:**
- ❌ Prices are estimates, not live data
- ❌ Can't detect current specials/sales
- ❌ May not reflect price increases
- ❌ No real-time stock availability

**Future Enhancement:** Live store integration could be added using:
- Coles/Woolworths MCP Server (if available)
- Official Woolworths Developer API
- Web scraping (less reliable)
- Manual price updates in settings

### Budget Management (As Implemented)

**Target:** User-configurable (default $150/week)

**Budget Display:**
- Shows estimated total vs. target
- Color-coded (green = under budget, red = over budget)
- Calculates difference automatically
- Updates when shopping items are checked off

**Claude Budget Optimization:**
If user sets tight budget, Claude will:
1. Suggest generic/homebrand alternatives in notes
2. Use more affordable protein sources (tuna vs. salmon)
3. Optimize ingredient overlap to reduce quantities
4. Prioritize pantry staples over fresh items

---

## 7. SHOPPING DAY SYSTEM (AS IMPLEMENTED)

### Concept

**Traditional approach:** Week runs Sunday → Saturday
**This app's approach:** Week runs from shopping day → day before shopping day

### Why This Matters

**Real-world shopping patterns:**
- Most people shop on same day each week (e.g., Saturday morning)
- Meal planning naturally aligns with shopping day
- Fresh produce quality depends on shopping day timing

**App benefits:**
- Generate plan on shopping day → fresh 7-day plan
- Mid-week regeneration only updates remaining days (no waste)
- Protein bar prep happens on shopping day (always fresh)
- Week dates calculated from shopping day automatically

### How It Works

**1. User Configuration**
- User selects shopping day in "Generate Week" form
- Options: Sunday through Saturday
- Default: Saturday (most common)
- Saved to localStorage for future generations

**2. Week Calculation**
```javascript
// Example: Shopping day = Saturday (6)
const today = new Date();          // e.g., Wednesday Dec 18
const todayDayOfWeek = today.getDay();  // 3 (Wednesday)
const shoppingDay = 6;              // Saturday

// Calculate days since last shopping day
const daysSinceShoppingDay = (todayDayOfWeek - shoppingDay + 7) % 7;
// (3 - 6 + 7) % 7 = 4 days since last Saturday

// Week start = last Saturday
const weekStart = new Date(today);
weekStart.setDate(today.getDate() - 4);  // Dec 14 (Saturday)

// Week end = next Friday
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekStart.getDate() + 6);  // Dec 20 (Friday)

// Week range: Dec 14 - Dec 20
```

**3. Day Ordering**
Instead of Sunday-Saturday, week displays in shopping day order:
```
Saturday (shopping day)
Sunday
Monday
Tuesday
Wednesday
Thursday
Friday
```

**4. Partial Week Regeneration**
```javascript
// Example: Today is Wednesday, shopping day is Saturday
const isPartialWeek = daysSinceShoppingDay > 0 && !isShoppingDay;
// true (we're mid-week)

// Days to generate: Wednesday, Thursday, Friday
// Days to skip: Saturday, Sunday, Monday, Tuesday (already happened)
```

**Benefits:**
- Don't waste ingredients already bought
- Don't regenerate past meals
- Adjust plan based on how week actually went
- Incorporate new preferences mid-week

**5. Date Display**
- Home page: "Week of Dec 14-20, 2025"
- Each day card: "Saturday, DEC 14" (shopping day first)
- Protein bar prep: Always shown on shopping day
- Exports: Week order matches shopping day start

### User Experience

**First Generation (Shopping Day):**
1. User opens app on Saturday morning
2. Clicks "Generate Week"
3. Selects shopping day: Saturday (default)
4. Generates full 7-day plan (Sat→Fri)
5. Goes shopping with list
6. Week starts fresh

**Mid-Week Regeneration (Wednesday):**
1. User realizes they need to adjust plan
2. Clicks "Generate Week"
3. Shopping day still: Saturday (remembered)
4. Claude generates only Wed→Fri (3 days)
5. Sat→Tue remain unchanged
6. No wasted food from earlier in week

**Week Transition:**
```
Old week: Sat Dec 14 → Fri Dec 20
[Friday night: week ends]
[Saturday morning: new week starts]
New week: Sat Dec 21 → Fri Dec 27
```

### Implementation Details

**Week Metadata:**
```javascript
{
  weekOf: "2025-12-14",  // ISO date of shopping day
  shoppingDay: 6,         // 0=Sun, 6=Sat
  isPartialWeek: false,   // Full vs partial generation
  daysGenerated: ["saturday", "sunday", ...]  // Which days included
}
```

**Date Formatting:**
```javascript
function getDayDate(dayKey, weekOf, shoppingDay) {
  // Calculate day offset from shopping day start
  const weekOrder = ['saturday', 'sunday', 'monday', ...];
  const dayOffset = weekOrder.indexOf(dayKey);
  
  const date = new Date(weekOf);
  date.setDate(date.getDate() + dayOffset);
  
  return formatDate(date);  // "Dec 15"
}
```

**Export Ordering:**
```javascript
// Markdown export uses shopping day order
const WEEK_ORDER = ['saturday', 'sunday', 'monday', 'tuesday', 
                     'wednesday', 'thursday', 'friday'];

WEEK_ORDER.forEach(dayKey => {
  // Export in shopping-day-first order
});
```

### Why Saturday Default?

**Most common shopping pattern:**
- Weekend shopping (less rushed)
- Weekly store sales start Friday/Saturday
- Fresh produce for Sunday meals
- Meal prep on Sunday with fresh ingredients

**User can change:**
- Some prefer Sunday morning shopping
- Some shop after work on weekdays
- App adapts to any day preference

## 8. DAILY PREP SYSTEM

### Prep Task Categories

**Morning Prep** (before leaving house)
- Pack Maya's lunch (Monday, Wednesday)
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
- Portion snacks for Maya

### Prep Display Format
```
MONDAY PREP

Morning (10 mins):
☐ Pack Maya's lunchbox:
  - Strawberries in container
  - Crackers + hummus pot
  - Yogurt pouch
  - Carrot sticks

Evening (15 mins):
☐ Defrost salmon for Tuesday dinner
☐ Wash salad greens for tomorrow
```

---

## 8. USER INTERFACE (AS IMPLEMENTED)

### Technology
- **Framework:** None (Vanilla JavaScript)
- **Rendering:** innerHTML string templates
- **Styling:** CSS3 (src/styles/main.css)
- **Interactivity:** onclick handlers bound to window object
- **State:** Observer pattern with reactive re-renders

### Navigation Pattern
- Single Page Application (SPA)
- Hash-free routing (no # in URLs)
- `appState.navigateTo(page)` changes current page
- State change triggers re-render
- Global functions: `window.navigateTo`, `window.toggleItem`, `window.handleGenerate`

### Color Scheme
- **Primary gradient:** Purple/blue (`#667eea → #764ba2`)
- **Success:** Green (`#48bb78`, `#059669`)
- **Warning:** Amber (`#fbbf24`, `#92400e`)
- **Error:** Red (`#e53e3e`, `#dc2626`)
- **Background:** Dark gradient (`#1a202c → #2d3748`)
- **Cards:** White with shadow
- **Text:** Dark gray on white, white on dark

### Screens

#### 1. HOME PAGE (HomePage.js)
**Route:** `home` (default page)

**Purpose:** Main dashboard showing week overview and navigation

**Layout:**
```
┌─────────────────────────────────────────┐
│ [Dark gradient background]              │
│                                         │
│  🍎 Meal Plan                           │
│  Week of Dec 8-14, 2025                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Budget                          │   │
│  │ $142.50 / $150                  │   │
│  │ ✓ Under by $7.50                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [🛒 Shopping List →]                   │
│  [📅 Weekly Overview →]                 │
│  [📄 Export & Print ↓]                  │
│                                         │
│  Daily Plans                            │
│  ────────────────────────────────────   │
│  [Sunday →]                             │
│  Roland: Protein bar • Hummus Bowl      │
│  Maya: Pasta with butter                │
│                                         │
│  [Monday →]                             │
│  Roland: Protein bar • Lentil Soup      │
│  Maya: Crumpet with strawberries        │
│  ...                                    │
│                                         │
│  [✨ Generate New Week →]               │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Budget card (color-coded: green if under, red if over)
- Quick navigation buttons (Shopping, Weekly, Export)
- Daily plan cards (clickable to view details)
- Special day indicators (⚡ Fast, 🌅 Post-Fast)
- Maya's meals shown in pink text when present
- Generate new week button at bottom

#### 2. WEEKLY OVERVIEW (WeeklyOverview.js)

**Route:** `weekly`

**Purpose:** Compact view of all 7 days in one scroll
**Layout:**
```
┌─────────────────────────────────────────┐
│  [← Back to Home]                       │
│                                         │
│  Weekly Overview                        │
│  Dec 8 - Dec 14, 2025                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Budget Summary                  │   │
│  │ $142.50 / $150                  │   │
│  │ ✓ Under budget by $7.50         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ SUNDAY, DEC 8                     │ │
│  │ ROLAND                            │ │
│  │ 🌅 Protein bar                    │ │
│  │ 🥗 Hummus Bowl                    │ │
│  │ 🍽️ Salmon & Greens               │ │
│  │                                   │ │
│  │ MAYA                              │ │
│  │ 🍱 Pasta with butter              │ │
│  │ 🍽️ Fish (plain) + vegetables     │ │
│  │                                   │ │
│  │ [View Details →]                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [MONDAY card...]                       │
│  [TUESDAY card...]                      │
│  ...                                    │
│                                         │
│  [📝 End of Week Feedback →]            │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Budget summary at top
- All 7 days in scrollable list
- Each day card shows:
  - Day name and date
  - Roland's 3 meals (breakfast/lunch/dinner)
  - Maya's meals (if applicable, in pink)
  - Special day indicators (Fast/Post-Fast)
  - "View Details" button to daily page
- End of week feedback button at bottom

#### 3. SHOPPING LIST (ShoppingList.js)

**Route:** `shopping`

**Purpose:** Interactive checklist organized by store aisle
**Layout:**
```
┌─────────────────────────────────────────┐
│  [← Back to Home]                       │
│                                         │
│  🛒 Shopping List                       │
│  Coles Caulfield Village                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Budget: $142.50 / $150          │   │
│  │ ✓ Under by $7.50                │   │
│  │ Progress: 12 / 35 (34%)         │   │
│  │ [████░░░░░░] 34%                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [✓ Hiding Bought Items]                │
│                                         │
│  AISLE 1 - PRODUCE                      │
│  ─────────────────────────────────────  │
│  ☐ Salad greens (4 bags)    $12.00     │
│  ☐ Tomatoes (2)              $3.00     │
│  ☑ Cucumbers (4)             $4.00     │
│                                         │
│  AISLE 3 - DAIRY                        │
│  ─────────────────────────────────────  │
│  ☐ Greek yogurt 1kg          $7.00     │
│  ☐ Kefir 500ml               $5.50     │
│                                         │
│  AISLE 4 - PROTEINS                     │
│  ─────────────────────────────────────  │
│  ☐ Salmon 150g               $8.00     │
│  ...                                    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Remaining to Buy: $125.50       │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Budget and progress summary at top
- Interactive checkboxes (click anywhere on item row)
- "Hide Bought Items" toggle button (toggles visibility)
- Items grouped by aisle number (1→12)
- Category name with each aisle
- Prices shown for each item
- "Remaining to Buy" total (sum of unchecked items)
- State persists via localStorage
- Real-time progress updates

**Behavior:**
- Click item → checks/unchecks instantly
- Checked items fade and strike-through
- Hide bought → removes checked items from view
- Show all → displays everything again
- Progress bar animates on check/uncheck

#### 4. DAILY VIEW (DailyPlan.js)

**Route:** `sunday`, `monday`, etc. (day key)

**Purpose:** Detailed view of single day with recipes
**Layout:**
```
┌─────────────────────────────────────────┐
│  [← Back to Home]                       │
│                                         │
│  Monday                                 │
│  Dec 9                                  │
│                                         │
│  [⚡ Fast Day] or [🌅 Post-Fast] (if applicable)
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ROLAND                          │   │
│  │ ────────────────────────────    │   │
│  │ 🌅 Breakfast 8:00 AM            │   │
│  │    Protein bar                  │   │
│  │                                 │   │
│  │ 🥗 Lunch 12:30 PM               │   │
│  │    Lentil Soup                  │   │
│  │                                 │   │
│  │ 🍽️ Dinner 5:30 PM              │   │
│  │    Sardines Salad               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ MAYA                            │   │
│  │ ────────────────────────────    │   │
│  │ 🌅 Breakfast 8:00 AM            │   │
│  │    Crumpet + strawberries       │   │
│  │                                 │   │
│  │ 🍱 Packed Lunch 12:30 PM        │   │
│  │    Pasta salad, yogurt          │   │
│  │                                 │   │
│  │ 🍽️ Dinner 5:30 PM              │   │
│  │    Pasta with butter + peas     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 PREP TASKS                   │   │
│  │ ────────────────────────────    │   │
│  │ 🌅 Morning:                     │   │
│  │ ☐ Pack Maya's lunchbox          │   │
│  │                                 │   │
│  │ 🌙 Evening:                     │   │
│  │ ☐ Defrost tofu for tomorrow     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Lentil Soup                     │   │
│  │ ────────────────────────────    │   │
│  │ Ingredients:                    │   │
│  │ • 1 protein bar                 │   │
│  │ • 500ml lentil soup             │   │
│  │ • 2 slices bread (60g)          │   │
│  │ • 1 apple                       │   │
│  │                                 │   │
│  │ Steps:                          │   │
│  │ 1. Heat soup                    │   │
│  │ 2. Serve with bread             │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Sardines Salad recipe card...]        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⏰ REMINDERS                    │   │
│  │ • 10-min walk after lunch       │   │
│  │ • Walk after dinner if possible │   │
│  │ • No snacking between meals     │   │
│  │ • Nothing after 6 PM            │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Special day banners (Fast/Post-Fast) with instructions
- Roland's meals in blue card
- Maya's meals in pink card (when present)
- Prep tasks with interactive checkboxes
- Inline recipes (all recipes for the day)
- Daily reminders card
- No separate recipe view (all shown on daily page)

**Note:** Original spec showed separate recipe view, but implementation shows all recipes inline on daily page for convenience.

#### 5. GENERATE WEEK (GenerateWeek.js)

**Route:** `generate`

**Purpose:** Form to generate new meal plan with AI

**Layout:**
```
┌─────────────────────────────────────────┐
│  [← Back to Home]                       │
│                                         │
│  ✨ Generate Week                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💡 How it works                 │   │
│  │ Enter your preferences and      │   │
│  │ Claude AI will generate plans   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒 Secure API Key Storage       │   │
│  │ Your API key is stored securely │   │
│  │ on Vercel. Never in browser.    │   │
│  │ Set: ANTHROPIC_API_KEY in      │   │
│  │ Vercel environment variables    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Weekly Preferences                     │
│  ┌─────────────────────────────────┐   │
│  │ e.g., I have leftover salmon... │   │
│  │ Maya wants pasta twice...       │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Budget Target                          │
│  [150]                                  │
│                                         │
│  Store                                  │
│  [Coles Caulfield Village ▼]           │
│                                         │
│  Shopping Day                           │
│  [Saturday ▼]                           │
│  Week runs from shopping day to         │
│  the day before. Mid-week regen         │
│  only updates remaining days.           │
│                                         │
│  [✨ Generate Meal Plan]                │
│                                         │
│  [Loading indicator - hidden by default]│
│  ✨                                     │
│  Creating Sunday meals... 45% (8s)      │
│  [████████░░░░] 45%                     │
│  Using Claude Haiku for fast generation │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📝 Quick Prompts                │   │
│  │ • "Use up: [ingredient]"        │   │
│  │ • "Maya wants: [food]"          │   │
│  │ • "More fish/vegetables"        │   │
│  │ • "Budget: tight/normal"        │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Info cards (how it works, API key security)
- Preferences textarea (optional)
- Budget number input (default: 150)
- Store dropdown (Coles/Woolworths)
- Shopping day dropdown (Sunday-Saturday, default: Saturday)
- Generate button (hides on click)
- Progress indicator:
  - Shows during generation
  - Real-time progress bar (0-100%)
  - Section labels ("Creating Sunday meals...")
  - Elapsed time counter
  - Model indicator (Claude Haiku)
- Quick prompts help card
- Error message area (hidden by default)

**Generation Flow:**
1. Click "Generate Meal Plan"
2. Button hides, progress shows
3. Progress updates every 500ms (simulated)
4. Actual API call happens in parallel
5. On success: progress → 100%, show "Complete!"
6. Brief delay (500ms), then navigate to home
7. On error: show error message, re-show button

#### 6. WEEKLY FEEDBACK (Feedback.js)

**Route:** `feedback`

**Purpose:** End of week feedback form
**Layout:**
```
┌─────────────────────────────────────────┐
│  [← Back to Home]                       │
│                                         │
│  📝 Week Feedback                       │
│  Dec 8 - Dec 14, 2025                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Overall Rating                  │   │
│  │ ⭐ ⭐ ⭐ ⭐ ⭐                      │   │
│  │ (click to rate)                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👍 Loved                        │   │
│  │ ┌─────────────────────────┐     │   │
│  │ │ Which meals did you     │     │   │
│  │ │ love? (Salmon dinner,   │     │   │
│  │ │ Buddha bowl, etc.)      │     │   │
│  │ └─────────────────────────┘     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👎 Didn't Work                  │   │
│  │ ┌─────────────────────────┐     │   │
│  │ │ Which meals didn't work?│     │   │
│  │ │ (Mackerel - too fishy   │     │   │
│  │ │ for Maya, etc.)         │     │   │
│  │ └─────────────────────────┘     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Shopping List                   │   │
│  │ ☐ Bought unnecessary items      │   │
│  │ ☐ Missing items                 │   │
│  │ ☑ Budget was good               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Notes for Next Week             │   │
│  │ ┌─────────────────────────┐     │   │
│  │ │ Any specific requests?  │     │   │
│  │ │ (Less mackerel, more    │     │   │
│  │ │ variety in lunches...)  │     │   │
│  │ │                         │     │   │
│  │ └─────────────────────────┘     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [💾 Save Feedback →]                   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- 5-star rating (interactive, click to set)
- Loved meals textarea
- Didn't work meals textarea
- Shopping feedback checkboxes
- Notes textarea
- Save button (green)
- All fields optional
- Inline JavaScript for star rating logic
- Saves to localStorage on submit
- Shows success alert
- Navigates back to home after save

**JavaScript Behavior:**
```javascript
// Star rating
let currentRating = 0;
function setRating(rating) {
  currentRating = rating;
  // Update stars: filled (gold) vs empty (gray)
  for (let i = 1; i <= 5; i++) {
    star[i].style.color = i <= rating ? '#fbbf24' : '#e5e7eb';
  }
}

// Save feedback
function saveFeedback() {
  const feedback = {
    rating: currentRating,
    loved: textarea1.value,
    didntWork: textarea2.value,
    shopping: { unnecessary: bool, missing: bool, budgetGood: bool },
    notes: textarea3.value,
    week: 'Dec 8-Dec 14',
    date: new Date().toISOString()
  };
  
  const existing = JSON.parse(localStorage.getItem('mealPlannerFeedback') || '[]');
  existing.push(feedback);
  localStorage.setItem('mealPlannerFeedback', JSON.stringify(existing.slice(-8)));
  
  alert('Feedback saved!');
  navigateTo('home');
}
```

### UI Components Summary

**Cards:**
- White background, rounded corners, shadow
- Padding: 16-24px
- Used for content grouping

**Buttons:**
- Primary: Purple gradient
- Secondary: Gray/white
- Success: Green
- Warning: Amber
- Danger: Red
- Full width on mobile
- Icon + text layout
- Hover effects (darken)

**Forms:**
- Textareas: White with gray border, rounded
- Inputs: Similar style
- Selects: Native dropdown styling
- Checkboxes: Custom styled (large 20×20px)

**Progress Bars:**
- Green fill on gray background
- Rounded ends
- Smooth transitions
- Percentage displayed

**Typography:**
- Headings: Bold, larger size
- Body: Regular weight, readable size
- Labels: Small, gray, uppercase
- Colors: Dark gray on white, white on dark

**Spacing:**
- Consistent 8px grid
- Cards: 16px margin between
- Content: 12-16px padding
- Sections: 24-32px separation

---

## 9. AI GENERATION PROMPT STRUCTURE (AS IMPLEMENTED)

### System Prompt Structure

The system prompt is constructed in `/api/generate-meal-plan.js` with these components:

1. **Base Dietary Specification** (hardcoded in function)
   - Roland's dietary requirements (Diet Compass protocol)
   - Maya's meal requirements (spelling: Maya with Y)
   - Meal timing and special days (Thursday fast, Friday post-fast)
   - Required output format with examples

2. **Feedback History Summary** (if available)
   - Loved meals from past weeks
   - Meals that didn't work
   - Notes for improvements
   - Built from last 8 weeks in localStorage

3. **Critical Output Rules**
   ```
   - You MUST output ONLY a JSON object starting with { and ending with }
   - Do NOT include any text before or after the JSON
   - Do NOT say "I understand", "Here is", "Sure", or any other preamble
   - Do NOT wrap in markdown code blocks
   - Start your response with the { character immediately
   ```

**Key Dietary Rules in System Prompt:**
- Breakfast: Always protein bar (homemade, hardcoded recipe)
- Lunch: Balanced meal ~600 cal with protein bar
- Dinner: 120-150g protein (fish/tofu) + 200-300g vegetables, NO carbs
- Thursday: Fast day (early lunch 12PM, no dinner)
- Friday: Post-fast (coffee only breakfast, break fast 1PM)
- Focus: Anti-inflammatory, gut health, fermented foods

### User Message Structure

Built dynamically with:
```
Generate a COMPLETE meal plan for: [Week Range]
Budget: $[budgetTarget] | Store: [Coles Caulfield/Woolworths Carnegie]
[User preferences if provided]

CRITICAL REQUIREMENTS:
- Year: [YYYY]
- week_of: "[YYYY-MM-DD]" (shopping day date)
- Shopping day: [DayName]
[If mid-week: - PARTIAL WEEK: Only generate for: [remaining days]]

YOU MUST RETURN COMPLETE JSON with ALL of the following:

1. shopping_list: Array of 25-40 items
   Each: {"item": "name", "quantity": "amount", "category": "Produce|Proteins|Dairy|Grains|Pantry|Bakery", "estimated_price": number, "aisle": number}

2. roland_meals: EVERY day (saturday-friday) MUST have:
   - breakfast: {"name": "Protein Bar", "time": "8:00 AM"}
   - lunch: {"name": "ACTUAL MEAL NAME", "time": "12:30 PM"}
   - dinner: {"name": "ACTUAL MEAL NAME", "time": "5:30 PM"}
   - recipes: Array with 2-3 recipes per day
     {"name": "Recipe Name", "ing": ["100g ingredient 1", ...], "steps": ["Step 1", ...]}
   
   SPECIAL DAYS:
   - Thursday: lunch at 12:00 PM (last meal), dinner: null
   - Friday: breakfast is coffee only, lunch at 1:00 PM

3. maya_meals: Sunday-Wednesday only
   CRITICAL: Use "maya_meals" as JSON key (Maya with Y, not Maia with I)
   - Sunday: lunch and dinner
   - Monday-Tuesday: breakfast (crumpet), packed lunch, dinner
   - Wednesday: breakfast, lunch with Roland, dinner at mum's (null)

4. prep_tasks: Each day has:
   {"roland": {"morning": ["task 1", ...], "evening": [...]}, "maya": {...}}

5. budget_estimate: Total estimated cost (number)

[Partial JSON example with 2-3 complete days shown]

DO NOT use "..." or placeholders. Generate REAL meal names and REAL recipes for ALL 7 days.
IMPORTANT: Start your response with { immediately. No preamble text.
```

### Response Processing

After Claude returns JSON:

1. **Parse & Extract** (`parseAndValidateMealPlan`)
   - Remove markdown code blocks if present
   - Find first `{` and last `}`
   - Extract clean JSON string
   - Parse with JSON.parse()
   - If parse fails: attempt repair (fix trailing commas, balance braces)

2. **Validation**
   - Check shopping_list exists and has items
   - Check roland_meals has all 7 days
   - Check each day has breakfast, lunch, dinner
   - Log warnings for missing data
   - Generate fallback shopping list if needed

3. **Client-Side Transformation** (`mealPlanTransformer.js`)
   - Calculate day dates from week_of + shoppingDay
   - Transform shopping list to category groups
   - Map categories to aisle numbers (static map)
   - Apply fallback meal names if Claude used "..." or short names
   - Handle Maya/Maia spelling variations for backward compatibility
   - Set isFast/isPost flags for Thursday/Friday
   - Calculate budget status (under/over)

4. **Save to localStorage**
   ```javascript
   localStorage.setItem('currentMealPlan', JSON.stringify(transformedPlan));
   ```

### Actual Output Structure (Transformed)

After transformation, the app uses this structure:

```javascript
{
  weekOf: "2025-12-14",  // Shopping day date
  budget: {
    target: 150,
    estimated: 142.50,
    status: "under"
  },
  shopping: [
    {
      cat: "Produce",
      items: [
        { name: "Salad greens (4 bags)", price: 12.00, aisle: 1 },
        { name: "Tomatoes (2)", price: 3.00, aisle: 1 }
      ]
    },
    {
      cat: "Proteins",
      items: [
        { name: "Salmon 150g", price: 8.00, aisle: 4 }
      ]
    }
  ],
  days: {
    saturday: {
      name: "Saturday",
      date: "Dec 14",
      roland: {
        meals: {
          b: { name: "Protein bar", time: "8:00 AM" },
          l: { name: "Mediterranean Salad Bowl", time: "12:30 PM" },
          d: { name: "Grilled Salmon with Vegetables", time: "5:30 PM" }
        },
        prep: {
          morning: ["Make protein bars", "Wash salad greens"],
          evening: []
        },
        recipes: [
          {
            name: "Mediterranean Salad Bowl",
            ing: ["150g hummus", "200g mixed greens", ...],
            steps: ["Arrange greens", "Add hummus", ...]
          }
        ]
      },
      maya: {
        meals: { b: null, l: null, d: null },
        prep: { morning: [], evening: [] }
      }
    },
    sunday: { /* ... */ },
    // ... all 7 days
  }
}
```

---

## 10. FEEDBACK SYSTEM (AS IMPLEMENTED)

### Feedback Form (Feedback.js)

Located at: `/feedback` page

**Form Fields:**
1. **Overall Rating** (1-5 stars)
   - Interactive star buttons
   - Stored as number (0-5)

2. **Loved Meals** (textarea)
   - Free-text input
   - Examples: "Salmon dinner", "Buddha bowl", "Maya's pasta night"

3. **Didn't Work Meals** (textarea)
   - Free-text input
   - Examples: "Mackerel - too fishy for Maya", "Lentil soup was bland"

4. **Shopping List Feedback** (checkboxes)
   - ☐ Bought unnecessary items
   - ☐ Missing items
   - ☑ Budget was good (checked by default)

5. **Notes for Next Week** (textarea)
   - Free-text for specific requests
   - Examples: "Less mackerel", "More variety in lunches"

### Data Storage (localStorage)

**Key:** `mealPlannerFeedback`

**Structure:**
```javascript
[
  {
    rating: 4,
    loved: "Salmon dinner was great",
    didntWork: "Mackerel too strong for Maya",
    shopping: {
      unnecessary: false,
      missing: false,
      budgetGood: true
    },
    notes: "More pasta variety please",
    week: "Dec 8-Dec 14",
    date: "2025-12-15T10:30:00.000Z"
  },
  // ... up to 8 weeks
]
```

**Save Process:**
1. User submits feedback form
2. Create feedback object with all fields + timestamp
3. Load existing feedback array from localStorage
4. Append new feedback to array
5. Keep only last 8 weeks (`.slice(-8)`)
6. Save back to localStorage
7. Show success alert
8. Navigate to home

### Feedback Integration with AI

**During Meal Plan Generation:**

1. Load feedback history from localStorage:
   ```javascript
   const feedbackHistory = JSON.parse(
     localStorage.getItem('mealPlannerFeedback') || '[]'
   );
   ```

2. Send to serverless function with generation request

3. Server builds feedback summary:
   ```javascript
   function buildFeedbackSummary(feedbackHistory) {
     const parts = [];
     feedbackHistory.forEach(f => {
       if (f.loved) parts.push(`Loved: ${f.loved}`);
       if (f.didntWork) parts.push(`Didn't work: ${f.didntWork}`);
       if (f.notes) parts.push(`Notes: ${f.notes}`);
     });
     return parts.join('\n');
   }
   ```

4. Summary added to Claude system prompt:
   ```
   ## FEEDBACK HISTORY
   Loved: Salmon dinner was great
   Didn't work: Mackerel too strong for Maya
   Notes: More pasta variety please
   Loved: Buddha bowl with quinoa
   Notes: Less mackerel. Maya loved pasta night - keep that
   ```

5. Claude reads feedback and adjusts:
   - Avoids meals that didn't work
   - Includes more of loved meals
   - Respects specific requests
   - Learns patterns (e.g., Maya dislikes strong fish)

### Feedback Loop Benefits

**What It Learns:**
- ✅ Meal preferences (loved/disliked)
- ✅ Portion accuracy (shopping feedback)
- ✅ Budget appropriateness
- ✅ Ingredient issues (too much/too little)
- ✅ Complexity preferences (simple vs elaborate)

**What It Adjusts:**
- Meal selection (more of what works)
- Ingredient quantities (reduce waste)
- Recipe complexity (match user capability)
- Budget allocation (based on actual spending)
- Variety balance (not too repetitive, not too adventurous)

**Example Feedback Impact:**
```
Week 1: "Mackerel too fishy for Maya"
Week 2: "Still too much mackerel"
Week 3 Generation: Claude avoids mackerel, uses salmon/tuna instead

Week 1: "Loved the pasta night for Maya"
Week 2 Generation: Claude includes 2 pasta nights instead of 1
Week 3 Generation: Claude varies pasta types (different sauces)
```

### Privacy & Data

**All feedback stored locally:**
- No server upload
- No cloud sync
- Stays in browser localStorage
- Sent to Claude API only during generation (not persisted by Anthropic)
- User can clear browser data to reset feedback history

---

## 11. TECHNICAL ARCHITECTURE

### Stack (As Implemented)
```
Frontend: Vanilla JavaScript (ES6 Modules)
    ↓
API Layer: Vercel Serverless Functions (Node.js)
    ↓
AI Generation: Claude 3.5 Haiku API (Anthropic)
    ↓
Price Estimation: Claude AI (no live store integration)
    ↓
Storage: localStorage (browser-based persistence)
```

### Technology Choices

**Why Vanilla JavaScript?**
- Lightweight and fast (no framework overhead)
- Zero build step required
- Native ES6 modules for code organization
- Direct DOM manipulation for optimal performance
- Easy to understand and modify

**Why Vercel Serverless?**
- Secure server-side API key storage
- No backend infrastructure to maintain
- Automatic HTTPS and global CDN
- Zero-config deployment
- Free tier sufficient for personal use

**Why Claude 3.5 Haiku?**
- Fast generation (8-12 seconds for full week)
- 8192 token output (enough for complete meal plans)
- Strong JSON structure following
- Cost-effective ($1 per million input tokens)
- Excellent at following dietary constraints

### App Architecture (As Implemented)

```
┌─────────────────────────────────────────────────────────────┐
│                  MEAL PLANNER WEB APP                       │
├─────────────────────────────────────────────────────────────┤
│  BROWSER (Client-Side)                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  index.html (SPA Entry Point)                       │   │
│  │  - Loads router.js                                  │   │
│  │  - Error boundary                                   │   │
│  │  - Mobile viewport config                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Router (src/utils/router.js)                       │   │
│  │  - Page navigation                                  │   │
│  │  - Global state subscriptions                       │   │
│  │  - Re-render on state changes                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Pages (src/components/*.js)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐           │   │
│  │  │ HomePage │ │ Weekly   │ │ Shopping  │           │   │
│  │  │          │ │ Overview │ │ List      │           │   │
│  │  └──────────┘ └──────────┘ └───────────┘           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐           │   │
│  │  │ DailyPlan│ │ Generate │ │ Feedback  │           │   │
│  │  │          │ │ Week     │ │           │           │   │
│  │  └──────────┘ └──────────┘ └───────────┘           │   │
│  │  - Pure functions returning HTML strings           │   │
│  │  - No JSX, no virtual DOM                          │   │
│  │  - onclick handlers set on window object           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  State Management (src/utils/state.js)              │   │
│  │  - Observer pattern (pub/sub)                       │   │
│  │  - currentPage: string                              │   │
│  │  - checkedItems: {id: boolean}                      │   │
│  │  - hideChecked: boolean                             │   │
│  │  - notifyListeners() triggers re-render             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Data Layer (src/data/*.js)                         │   │
│  │  - mealPlanData.js: Static example data            │   │
│  │  - mealPlanLoader.js: Load from localStorage       │   │
│  │  - Falls back to static if no generated plan       │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Utilities (src/utils/*.js)                         │   │
│  │  - claudeApi.js: API calls to backend              │   │
│  │  - storage.js: localStorage wrapper                │   │
│  │  - mealPlanTransformer.js: Transform API response  │   │
│  │  - exportMealPlan.js: Generate markdown export     │   │
│  │  - generateHandler.js: Generation orchestration    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Browser Storage (localStorage)                     │   │
│  │  - currentMealPlan: Full meal plan JSON            │   │
│  │  - mealPlannerApp: Checked items state             │   │
│  │  - mealPlannerFeedback: Last 8 weeks feedback      │   │
│  │  - shoppingDay: User's shopping day preference     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│  VERCEL EDGE NETWORK                                        │
│  - Static file serving (HTML, JS, CSS)                     │
│  - Serverless function invocation                          │
│  - HTTPS termination                                       │
│  - Global CDN distribution                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ POST /api/generate-meal-plan
┌─────────────────────────────────────────────────────────────┐
│  VERCEL SERVERLESS FUNCTION (api/generate-meal-plan.js)    │
│                                                             │
│  Input: { userPrompt, budgetTarget, store, feedbackHistory,│
│           shoppingDay }                                     │
│                                                             │
│  Process:                                                   │
│  1. Load base dietary specification                        │
│  2. Build feedback summary                                 │
│  3. Calculate week dates from shoppingDay                  │
│  4. Build system prompt + user message                     │
│  5. Call Claude API (non-streaming)                        │
│  6. Parse & validate JSON response                         │
│  7. Apply fallbacks if incomplete                          │
│  8. Return structured meal plan                            │
│                                                             │
│  Output: Complete meal plan JSON                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTPS (api.anthropic.com)
┌─────────────────────────────────────────────────────────────┐
│  ANTHROPIC CLAUDE API                                       │
│  - Model: claude-3-5-haiku-20241022                        │
│  - Max tokens: 8192                                        │
│  - System prompt: Dietary spec + feedback                  │
│  - User prompt: Week preferences + requirements            │
│  - Response: Complete JSON meal plan (7 days, meals,      │
│    recipes, shopping list, prep tasks)                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (As Implemented)

```
1. USER OPENS APP
   └── router.js initializes
   └── Loads currentMealPlan from localStorage
   └── If exists: Display home page with budget & days
   └── If not exists: Show static example meal plan
   └── Subscribe to state changes for reactivity

2. USER NAVIGATES TO "GENERATE WEEK"
   └── Display generation form with:
       ├── Preferences textarea (optional)
       ├── Budget input (default: $150)
       ├── Store selector (Coles/Woolworths)
       └── Shopping day selector (default: Saturday)

3. USER CLICKS "GENERATE MEAL PLAN"
   └── generateHandler.js orchestrates:
       ├── Hide button, show progress indicator
       ├── Load feedbackHistory from localStorage (last 8 weeks)
       ├── Call claudeApi.generateMealPlan():
       │   ├── POST to /api/generate-meal-plan
       │   ├── Server receives: {userPrompt, budgetTarget, store, 
       │   │                     feedbackHistory, shoppingDay}
       │   └── Progress updates via simulated progress bar
       └── Wait for response...

4. SERVER-SIDE PROCESSING (api/generate-meal-plan.js)
   └── Validate API key from environment variable
   └── Build system prompt:
       ├── Load base dietary specification (hardcoded)
       ├── Build feedback summary from history
       └── Add critical output format rules
   └── Build user message:
       ├── Calculate week date range from shoppingDay
       ├── Determine if full week or partial week
       ├── Include user preferences
       └── Provide detailed JSON schema & example
   └── Call Claude API (non-streaming):
       ├── Model: claude-3-5-haiku-20241022
       ├── Max tokens: 8192
       └── Wait for complete response (8-15 seconds)
   └── Parse & validate response:
       ├── Extract JSON from response text
       ├── Validate structure (meals, shopping, recipes)
       ├── Apply fallback meals if incomplete
       ├── Ensure all 7 days present
       └── Return complete meal plan

5. CLIENT-SIDE TRANSFORMATION
   └── mealPlanTransformer.js processes response:
       ├── Transform to app data structure
       ├── Calculate day dates from week_of + shoppingDay
       ├── Map shopping categories to aisle numbers
       ├── Apply meal fallbacks if Claude used "..."
       ├── Handle Maya/Maia spelling variations
       ├── Calculate budget status (under/over)
       └── Return transformed plan

6. SAVE & NAVIGATE
   └── Save to localStorage('currentMealPlan', JSON)
   └── Update progress to 100%
   └── Brief delay (500ms) to show "Complete!"
   └── Navigate to home page
   └── App re-renders with new data

7. DURING USE
   └── User checks shopping items:
       ├── appState.toggleItem(id) called
       ├── Update in-memory state
       ├── Save to localStorage immediately
       └── Trigger re-render (progress bar updates)
   └── User checks prep tasks:
       ├── Same pattern as shopping items
       └── State persists across sessions

8. END OF WEEK
   └── User navigates to Feedback page
   └── Fill out form:
       ├── Overall rating (1-5 stars)
       ├── Loved meals (text)
       ├── Didn't work meals (text)
       ├── Shopping list feedback (checkboxes)
       └── Notes for next week (text)
   └── Submit feedback:
       ├── Save to localStorage('mealPlannerFeedback')
       ├── Keep only last 8 weeks (sliding window)
       ├── Timestamp feedback with date
       └── Navigate back to home
   └── Next generation:
       └── Feedback automatically included in Claude prompt

9. EXPORT/PRINT
   └── User clicks "Export & Print" button
   └── exportMealPlan.js generates:
       ├── Read currentMealPlan from localStorage
       ├── Build complete markdown document:
       │   ├── Weekly meal plan (all days)
       │   ├── Protein bar recipe (hardcoded)
       │   ├── All other recipes from generated plan
       │   ├── Shopping list by category
       │   ├── Shopping list by aisle
       │   ├── Meal prep checklist
       │   ├── Budget summary
       │   └── Notes & reminders
       ├── Create Blob with markdown content
       ├── Generate filename: meal-plan-YYYY-MM-DD.md
       └── Trigger browser download
```

### Offline Capability (As Implemented)

**Works Offline:**
- ✅ View current meal plan (all pages)
- ✅ Check off shopping items (state saved to localStorage)
- ✅ Check off prep tasks
- ✅ Navigate between pages
- ✅ View recipes and daily plans
- ✅ Toggle hide checked items
- ✅ Export to markdown

**Requires Internet:**
- ❌ Generate new meal plan (needs Claude API)
- ❌ Initial page load (HTML/CSS/JS files)

**Progressive Web App Features:**
- Mobile-optimized viewport
- Works in all modern browsers
- No app store required
- Add to home screen capable
- Responsive design for phone/tablet/desktop

### Offline Capability
- Generated plan cached locally
- Shopping list works offline (checkbox state saved)
- Daily views available offline
- Only "Generate" requires internet
- Aisle mapping stored locally

### Environment Variables (Vercel Configuration)

**Required:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

**Setup in Vercel:**
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add `ANTHROPIC_API_KEY`
4. Set value to your Claude API key from console.anthropic.com
5. Select all environments (Production, Preview, Development)
6. Save and redeploy

**Security Note:**
- API key is ONLY on server-side (Vercel serverless function)
- Never exposed to browser or client-side code
- No client-side API key input required
- Vercel environment variables are encrypted at rest

### API Usage & Costs (As Implemented)

**Claude 3.5 Haiku Pricing:**
- Input: $1.00 per million tokens (~$0.001 per generation)
- Output: $5.00 per million tokens (~$0.03-0.04 per generation)
- **Total per generation: ~$0.04 USD**

**Typical Token Usage:**
- System prompt (dietary spec): ~2,000 tokens
- User message (preferences + schema): ~1,500 tokens
- Response (complete week): ~6,000-7,000 tokens

**Monthly Cost Estimate:**
- 1 generation per week: $0.16/month
- 2 generations per week: $0.32/month
- Daily testing during development: $1.20/month

**Rate Limits (Anthropic):**
- Claude 3.5 Haiku Tier 1: 50 requests/minute
- 40,000 tokens/minute input
- 8,000 tokens/minute output
- **This app: 1 request per generation (well under limits)**

**No Additional API Costs:**
- No store API charges
- No database hosting fees
- Vercel free tier sufficient for personal use
- localStorage is free (browser-based)

---

## 12. IMPLEMENTED FEATURES ✅

**Core Functionality:**
- ✅ AI-powered meal plan generation (Claude 3.5 Haiku)
- ✅ Configurable shopping day (week starts from shopping day, not Sunday)
- ✅ Partial week regeneration (mid-week updates)
- ✅ Budget tracking and estimation
- ✅ Aisle-organized shopping list
- ✅ Interactive checkboxes (shopping + prep tasks)
- ✅ Progress tracking (visual progress bars)
- ✅ Feedback system (last 8 weeks stored)
- ✅ Markdown export/print functionality
- ✅ Offline capability (once plan generated)
- ✅ Mobile-responsive design
- ✅ Persistent state (localStorage)
- ✅ Special day handling (Thursday fast, Friday post-fast)
- ✅ Dual meal planning (Roland + Maya)
- ✅ Recipe generation with full ingredients & steps
- ✅ Prep task checklists
- ✅ Weekly overview with all days
- ✅ Daily detailed view with recipes inline

**Technical:**
- ✅ Vanilla JavaScript (no framework)
- ✅ ES6 modules
- ✅ Vercel serverless deployment
- ✅ Server-side API key storage
- ✅ Progressive generation with visual feedback
- ✅ Error handling and fallbacks
- ✅ JSON transformation pipeline

## 13. FUTURE ENHANCEMENTS (Not Yet Implemented)

### Short Term (Would Improve Current Experience)

**Live Store Pricing Integration:**
- Real-time price lookups via Coles/Woolworths API or MCP
- Actual aisle locations from store database
- Special/sale detection
- Stock availability checking
- Multi-store price comparison
- **Benefit:** Accurate budgeting, real-time savings alerts

**Pantry Management:**
- Track what's already in pantry
- "Already have" checkbox for shopping items
- Low stock alerts
- Expiry date tracking
- **Benefit:** Reduce waste, avoid duplicate purchases

**Nutritional Dashboard:**
- Daily macro/micro nutrient tracking
- Omega-3, fiber, protein targets
- Weekly nutrition summary
- Progress charts
- **Benefit:** Better adherence to Diet Compass targets

**Recipe Improvements:**
- Add recipe photos (from Claude or user upload)
- Cooking time estimates
- Difficulty ratings
- Nutrition facts per recipe
- Print individual recipe cards
- **Benefit:** Easier cooking, better meal selection

### Medium Term (New Capabilities)

**Multi-User & Sharing:**
- Share meal plans with Maya's mum (read-only link)
- Collaborative feedback (both parents can rate)
- Handoff notes (who's cooking which day)
- Sync across devices (via simple cloud sync)
- **Benefit:** Better co-parenting coordination

**Meal Photo Logging:**
- Take photos of actual meals
- Compare to recipe expectations
- Visual feedback history
- Generate photo gallery
- **Benefit:** Track actual portions, share successes

**Smart Regeneration:**
- "Regenerate just this day" (keep others)
- "Swap this meal" (replace single meal)
- "Use up ingredients" mode (prioritize pantry)
- "Quick week" mode (simpler recipes)
- **Benefit:** More flexibility, less waste

**Recipe Scaling:**
- Add guests (scale portions automatically)
- Batch cooking mode (make extras for freezer)
- Meal prep quantities (cook once, eat twice)
- **Benefit:** Handle variable household size

### Long Term (Advanced Features)

**Delivery Integration:**
- One-click order from Coles/Woolworths
- Auto-populate cart from shopping list
- Track delivery status
- Reorder previous weeks
- **Benefit:** Ultimate convenience

**Barcode Scanning:**
- Scan items as you shop (auto-check off)
- Scan pantry items to track inventory
- Scan receipts to track actual spending
- **Benefit:** Eliminate manual checking

**AI Assistant Chat:**
- "Suggest a substitute for salmon"
- "What can I make with these leftovers?"
- "Is this meal kid-friendly for Maya?"
- Real-time cooking help
- **Benefit:** Interactive cooking support

**Health Integrations:**
- Sync with fitness trackers (calorie burn)
- Adjust meal plans based on activity
- Blood test tracking (omega-3, B12, etc.)
- Correlate diet with biomarkers
- **Benefit:** Optimize health outcomes

**Community Features:**
- Share successful meal plans with community
- Browse and clone others' plans
- Rate and review community recipes
- Dietary-specific meal plan templates
- **Benefit:** Learn from others, contribute back

### Technical Improvements

**Performance:**
- Service worker for true offline PWA
- Faster generation via streaming API
- Parallel recipe generation
- Client-side caching strategies

**Developer Experience:**
- TypeScript migration
- Automated testing (unit + e2e)
- CI/CD pipeline
- Component library
- Storybook for UI components

**Data & Privacy:**
- Optional cloud sync (encrypted)
- Export all data (GDPR compliance)
- Account system (optional, not required)
- Family plans (multiple users per household)

---

## APPENDIX A: MAYA'S MEAL SCHEDULE SUMMARY

**Note:** Name spelling is "Maya" (with Y), not "Maia" (with I).

| Day | Breakfast | Lunch | Dinner |
|-----|-----------|-------|--------|
| Sunday | — | ✓ With Roland | ✓ With Roland |
| Monday | Crumpet | ✓ Packed | ✓ With Roland |
| Tuesday | Crumpet | ✓ Packed | ✓ With Roland |
| Wednesday | Crumpet | ✓ With Roland | At mum's |
| Thursday | — | — | — |
| Friday | — | — | — |
| Saturday | — | — | — |

**Meal Details:**
- **Sunday lunch:** Pasta or simple meal (shared prep with Roland's meal)
- **Sunday dinner:** Plain portion of Roland's meal (e.g., fish without sauce, vegetables)
- **Monday breakfast:** Crumpet with fruit (strawberries/blueberries)
- **Monday lunch:** Packed lunch (sandwich, yogurt pouch, fruit, crackers, carrot sticks)
- **Monday dinner:** Shared meal with Roland or simple kid-friendly alternative
- **Tuesday:** Same pattern as Monday
- **Wednesday breakfast:** Crumpet with fruit
- **Wednesday lunch:** With Roland (simple meal)
- **Wednesday dinner:** At mum's (no meal planning needed)
- **Thursday-Saturday:** Not with Roland (no meals in plan)

---

## APPENDIX B: ROLAND'S FASTING SCHEDULE

| Day | Breakfast | Lunch | Dinner | Notes |
|-----|-----------|-------|--------|-------|
| Thursday | ✓ 8am | ✓ 12pm EARLY | ✗ NONE | Fast begins after lunch |
| Friday | ✗ Coffee only | ✓ 1pm LATE | ✓ 5:30pm | Break fast at 1pm, lighter day |

---

## APPENDIX C: ACTUAL FILE STRUCTURE

```
meal-planner/
├── index.html                  # SPA entry point
├── package.json                # NPM config (minimal)
├── vercel.json                 # Vercel deployment config
├── README.md                   # Setup instructions
├── DEPLOYMENT.md               # Deployment guide
├── meal-planner-app-spec.md    # This document
│
├── api/                        # Vercel serverless functions
│   ├── generate-meal-plan.js   # Main AI generation endpoint
│   ├── check-env.js            # Environment variable check
│   └── test-models.js          # Model testing endpoint
│
├── src/
│   ├── components/             # Page components (pure functions)
│   │   ├── HomePage.js         # Main dashboard
│   │   ├── WeeklyOverview.js   # All days summary
│   │   ├── DailyPlan.js        # Single day detail
│   │   ├── ShoppingList.js     # Interactive shopping list
│   │   ├── GenerateWeek.js     # Generation form
│   │   └── Feedback.js         # Feedback form
│   │
│   ├── data/
│   │   ├── mealPlanData.js     # Static example data
│   │   └── mealPlanLoader.js   # Load from localStorage
│   │
│   ├── styles/
│   │   └── main.css            # All styles
│   │
│   └── utils/
│       ├── router.js           # SPA routing & rendering
│       ├── state.js            # State management (observer)
│       ├── storage.js          # localStorage wrapper
│       ├── claudeApi.js        # API client
│       ├── generateHandler.js  # Generation orchestration
│       ├── mealPlanTransformer.js  # Transform API response
│       └── exportMealPlan.js   # Markdown export
│
└── export outputs/             # Generated exports (git ignored)
    └── meal-plan-YYYY-MM-DD.md
```

## APPENDIX D: DEPLOYMENT GUIDE (AS IMPLEMENTED)

### Prerequisites
1. Anthropic API key (from console.anthropic.com)
2. Vercel account (free tier sufficient)
3. Git repository (GitHub/GitLab/Bitbucket)

### Deployment Steps

**1. Set up Vercel project:**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project (from project directory)
vercel link

# Or deploy directly
vercel
```

**2. Configure environment variables:**
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add: `ANTHROPIC_API_KEY`
- Value: Your Claude API key (starts with `sk-ant-`)
- Environments: Production, Preview, Development (all)
- Save and redeploy

**3. Deploy:**
```bash
# Production deployment
vercel --prod

# Or push to main branch (auto-deploys if connected to Git)
git push origin main
```

**4. Verify:**
- Visit deployment URL
- Navigate to "Generate Week"
- Generate a test meal plan
- Check that API key is working (not exposed in browser)

### Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Claude API authentication | `sk-ant-api03-...` |

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Key Points:**
- No build step (vanilla JS)
- All routes rewrite to index.html (SPA)
- Security headers enabled
- API functions auto-detected in `/api` folder

### Local Development

```bash
# Option 1: Vercel dev server (recommended - simulates production)
vercel dev

# Option 2: Any static file server
npm run dev          # Uses npx serve
# or
python -m http.server 8000
# or
npx serve .
```

**Note:** Local development requires `.env` file or Vercel dev server for API key.

### Troubleshooting

**"API key not configured" error:**
- Check Vercel environment variables
- Ensure variable name is exactly `ANTHROPIC_API_KEY`
- Redeploy after adding variable
- Clear browser cache

**Generation fails silently:**
- Check Vercel function logs (Dashboard → Deployments → Function Logs)
- Verify API key is valid (not expired/revoked)
- Check Claude API status (status.anthropic.com)

**Styles not loading:**
- Ensure all paths are relative (no absolute paths)
- Check browser console for 404 errors
- Verify vercel.json rewrites are correct

## APPENDIX E: SAMPLE WEEK OUTPUT

### Week of December 14-20, 2025

**User Prompt:** "I have leftover cabbage. Maya wants pasta twice this week."

**Generated Plan (Example):**

| Day | Roland Lunch | Roland Dinner | Maya Meals |
|-----|--------------|---------------|------------|
| Sat | Mediterranean Salad Bowl | Grilled Salmon with Veg | — |
| Sun | Hummus Power Bowl | Tofu Stir-Fry w/ Cabbage | Pasta with butter / Tofu portion |
| Mon | Lentil Soup & Bread | Sardines Salad w/ Coleslaw | Crumpet / Packed: pasta salad / Leftover pasta |
| Tue | Whole Grain Wrap | Mackerel with Cabbage Slaw | Crumpet / Packed: sandwich / Cheese quesadilla |
| Wed | Buddha Bowl | White Fish & Greens | Crumpet / Hummus & crackers / At mum's |
| Thu | Chickpea Salad (EARLY 12PM) | NO DINNER (FAST) | — |
| Fri | Light Salad (LATE 1PM) | Large Salad w/ Smoked Tofu | — |

**Budget:** $138.50 / $150 ✓
**Cabbage:** Used in 3 meals (Sun, Mon, Tue) ✓
**Pasta:** Sunday dinner + Monday packed lunch ✓

**Generated Recipes:** 18 recipes total (2-3 per day × 7 days)

**Shopping List:** 38 items across 6 categories

**Prep Tasks:** 
- Saturday: Make protein bars, prep vegetables
- Sunday-Wednesday: Morning/evening prep as needed

---

*End of Specification v2.0 (Implementation)*
*Last Updated: December 2025*
