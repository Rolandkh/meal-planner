# Meal Planning Ecosystem - Complete System Design
**Date:** January 11, 2026

---

## Executive Summary

This session documents the design of a **closed-loop meal planning ecosystem** that manages the complete flow from user requirements to executed meals, with continuous inventory tracking across weeks.

**The Big Picture:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│                           WEEKLY CYCLE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INPUTS                    AI PROCESSING              OUTPUTS            │
│  ──────                    ─────────────              ───────            │
│                                                                          │
│  • Diet Profiles      ──►  • Recipe Selection    ──►  • Meal Plan       │
│  • Meal Schedule      ──►  • Quantity Calc       ──►  • Shopping List   │
│  • Prep Availability  ──►  • Batch Optimization  ──►  • Prep Schedule   │
│  • Current Inventory  ──►  • Cost Calculation    ──►  • Cost Breakdown  │
│                                                                          │
│                               ↓                                          │
│                          EXECUTION                                       │
│                          ─────────                                       │
│                     Shop → Prep → Cook                                   │
│                               ↓                                          │
│                      INVENTORY UPDATE                                    │
│                      ────────────────                                    │
│                   Track actual usage                                     │
│                   Update remaining stock                                 │
│                               ↓                                          │
│                    ┌─────────────────┐                                   │
│                    │ CARRY FORWARD   │──────────────────────────────┐    │
│                    │ to next week    │                              │    │
│                    └─────────────────┘                              │    │
│                                                                     │    │
└─────────────────────────────────────────────────────────────────────│────┘
                                                                      │
                    ┌─────────────────────────────────────────────────┘
                    ↓
              NEXT WEEK: Remaining ingredients + components 
                         become starting inventory
```

---

## 1. Complete System Flow

### 1.1 Material Flow Diagram

```
WEEK N INPUTS                                              
═══════════════                                            
                                                           
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  DIET PROFILES  │    │  MEAL SCHEDULE  │    │ PREP SCHEDULE   │
│                 │    │                 │    │                 │
│ • Person 1:     │    │ Mon: B, L, D    │    │ Sat 2pm-5pm     │
│   Vegetarian    │    │ Tue: B, L, D    │    │ Sun 9am-11am    │
│ • Person 2:     │    │ Wed: B, -, D    │    │                 │
│   No restrict   │    │ ...             │    │                 │
│ • Kid:          │    │ Sun: Brunch, D  │    │                 │
│   Kid-friendly  │    │                 │    │                 │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT INVENTORY                            │
│  ════════════════════════════════════════                       │
│                                                                  │
│  RAW INGREDIENTS:              │  PREPPED COMPONENTS:            │
│  • Chicken breast: 800g        │  • comp_onion_caramelize: 150g  │
│  • Onions: 4 whole (600g)      │    (made 2 days ago, 3 days    │
│  • Rice: 2kg                   │     shelf life remaining)       │
│  • Olive oil: 500ml            │  • comp_garlic_mince: 50g       │
│  • ...                         │    (made yesterday)             │
│                                │                                 │
└────────────────────────────────┴─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI MEAL PLANNER                              │
│  ════════════════════════════════════════                       │
│                                                                  │
│  RECIPE SELECTION CRITERIA:                                      │
│  • Match diet profiles for each meal                            │
│  • Fit within prep time constraints                             │
│  • Prioritize using existing inventory (reduce waste)           │
│  • Maximize component overlap (efficiency)                      │
│  • Balance nutrition across week                                │
│  • Stay within budget                                           │
│                                                                  │
│  CALCULATIONS:                                                   │
│  • Total raw ingredients needed (with yield factors)            │
│  • Total components needed                                       │
│  • Optimal batch sizes for shared components                    │
│  • Prep schedule based on shelf life + availability             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        OUTPUTS                                   │
│  ════════════════════════════════════════                       │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  MEAL PLAN    │  │ SHOPPING LIST │  │  PREP PLAN    │        │
│  │               │  │               │  │               │        │
│  │ Mon B: Oats   │  │ Buy:          │  │ Sat 2pm:      │        │
│  │ Mon L: Salad  │  │ • Chicken 1kg │  │ • Caramelize  │        │
│  │ Mon D: Curry  │  │ • Tomatoes 6  │  │   onions (3x) │        │
│  │ Tue B: Eggs   │  │ • Spinach 2   │  │ • Marinate    │        │
│  │ ...           │  │               │  │   chicken     │        │
│  │               │  │ Have:         │  │               │        │
│  │ Serves: 21    │  │ • Rice ✓      │  │ Sun 9am:      │        │
│  │ People: 3     │  │ • Onions ✓    │  │ • Prep curry  │        │
│  └───────────────┘  └───────────────┘  │   base        │        │
│                                        └───────────────┘        │
│  ┌───────────────────────────────────────────────────────┐      │
│  │                   COST BREAKDOWN                       │      │
│  │                                                        │      │
│  │  Total cost: $127.50          Budget: $150            │      │
│  │  Cost per meal: $6.07         Under budget: ✓ $22.50  │      │
│  │  Cost per serve: $2.02                                │      │
│  │                                                        │      │
│  │  Breakdown by category:                               │      │
│  │  • Protein: $45.00 (35%)                              │      │
│  │  • Produce: $32.50 (26%)                              │      │
│  │  • Pantry: $50.00 (39%)                               │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXECUTION                                  │
│  ════════════════════════════════════════                       │
│                                                                  │
│  SHOP ──► PREP ──► COOK ──► EAT ──► TRACK                       │
│                                                                  │
│  • User shops according to list                                 │
│  • User preps according to schedule                             │
│  • User cooks meals according to plan                           │
│  • System tracks:                                                │
│    - What was actually used                                     │
│    - What substitutions were made                               │
│    - What was wasted                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY UPDATE                              │
│  ════════════════════════════════════════                       │
│                                                                  │
│  END OF WEEK INVENTORY:                                         │
│                                                                  │
│  RAW INGREDIENTS:              │  PREPPED COMPONENTS:            │
│  • Rice: 1.2kg remaining       │  • comp_curry_base: 200g        │
│  • Olive oil: 350ml            │    (made Sunday, 4 days left)   │
│  • Onions: 1 whole             │                                 │
│                                │                                 │
│  EXPIRING SOON:                │  EXPIRING SOON:                 │
│  • Spinach: use in 2 days      │  • None                         │
│                                                                  │
│              ↓                                                   │
│     CARRY FORWARD TO WEEK N+1                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Information Flow Diagram

```
                    ┌────────────────────────────────────────┐
                    │         USER REQUIREMENTS               │
                    │                                         │
                    │  "I need to feed 3 people for a week"  │
                    │  "Person 1 is vegetarian"              │
                    │  "I can prep on Saturday afternoon"    │
                    │  "Budget is $150"                      │
                    │                                         │
                    └───────────────────┬────────────────────┘
                                        │
                    ┌───────────────────▼────────────────────┐
                    │         STRUCTURED INPUTS               │
                    │                                         │
                    │  • diet_profiles[]                     │
                    │  • meal_schedule[]                     │
                    │  • prep_availability[]                 │
                    │  • budget_constraint                   │
                    │  • current_inventory{}                 │
                    │                                         │
                    └───────────────────┬────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   RECIPE DATABASE   │   │   INGREDIENT DB     │   │   PROCESS DB        │
│                     │   │                     │   │                     │
│  • 622 recipes      │   │  • 1039 ingredients │   │  • ~70 processes    │
│  • Process graphs   │   │  • Cost per gram    │   │  • Yield factors    │
│  • Components       │   │  • Nutrition        │   │  • Time estimates   │
│  • Prep-ahead info  │   │  • Shelf life       │   │  • Prep-ahead       │
│                     │   │                     │   │                     │
└─────────┬───────────┘   └─────────┬───────────┘   └─────────┬───────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │         AI REASONING            │
                    │                                 │
                    │  Given all inputs + databases:  │
                    │                                 │
                    │  1. Which recipes fit the       │
                    │     diet profiles?              │
                    │                                 │
                    │  2. Which recipes use existing  │
                    │     inventory efficiently?      │
                    │                                 │
                    │  3. Which recipes share         │
                    │     components (batch prep)?    │
                    │                                 │
                    │  4. What's the optimal prep     │
                    │     schedule given availability?│
                    │                                 │
                    │  5. What needs to be purchased? │
                    │     (accounting for yield)      │
                    │                                 │
                    │  6. What's the total cost?      │
                    │     (within budget?)            │
                    │                                 │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │      GENERATED OUTPUTS          │
                    │                                 │
                    │  • meal_plan{}                  │
                    │  • shopping_list{}              │
                    │  • prep_schedule{}              │
                    │  • cost_breakdown{}             │
                    │  • predicted_end_inventory{}    │
                    │                                 │
                    └────────────────────────────────┘
```

---

## 1.3 What We're Missing (Gap Analysis)

| What We Have | What We Need | Gap |
|--------------|--------------|-----|
| Diet profiles system | ✓ Exists | Minor updates needed |
| Meal schedule input | ✓ Exists | Minor updates needed |
| Recipe catalog (622) | Need process graphs | **MAJOR** - Recipe conversion |
| Ingredient database | ✓ Complete (1039) | Ready |
| Nutrition multipliers | ✓ Complete | Ready |
| Pricing data | ✓ Complete | Ready |
| Shelf life data | ✓ Complete | Ready |
| **Process database** | ❌ Missing | **MAJOR** - Need to create |
| **Component model** | ❌ Missing | **MAJOR** - Need to create |
| **Inventory system** | ❌ Missing | **MAJOR** - Need to create |
| **Prep scheduler** | ❌ Missing | Medium - Need to create |
| **Shopping list generator** | Partially exists | Need yield integration |
| **Cost calculator** | ❌ Missing | Medium - Need to create |
| **Carry-forward logic** | ❌ Missing | Medium - Need to create |

---

## 1. Vision Summary

### What You Described

**Core Concept:** Recipes are not just "ingredients + instructions" — they are a **sequence of processes applied to ingredients**, producing **intermediate components** that can be:
1. Pre-prepared in batches
2. Reused across multiple recipes
3. Tracked for cost, nutrition, and time

**Example Flow:**
```
ONION (raw ingredient)
    ↓ [DICE process: 3 min]
DICED ONION (component)
    ↓ [CARAMELIZE process: 20 min, requires oil]
CARAMELIZED ONION (component)
    → Used in: French Onion Soup, Burger Topping, Pizza Base, Pasta Sauce
```

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Cost per Serve** | Calculate true cost using ingredient costs + process overhead (oil absorption, etc.) |
| **Nutrition Tracking** | Apply cooking method multipliers as ingredients transform |
| **Prep-Ahead Identification** | Identify which components can be made in advance |
| **Batch Prep Optimization** | "If you're caramelizing onions, make extra for 3 other recipes" |
| **Time Estimation** | Sum process times to get total prep + cook time |
| **Inventory Management** | Track raw ingredient → component → final recipe throughput |
| **Component Reusability** | Same component (e.g., "caramelized onion") serves multiple recipes |

---

## 2. Complete Data Model

### 2.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE DATA ENTITIES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  HOUSEHOLD   │      │ DIET PROFILE │      │   SCHEDULE   │
│              │◄────►│              │      │              │
│ • members    │      │ • name       │      │ • meal slots │
│ • budget     │      │ • restrict   │      │ • prep times │
└──────────────┘      │ • preferences│      │ • dates      │
                      └──────────────┘      └──────────────┘
                              │                    │
                              └────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │    MEAL PLAN     │
                            │                  │
                            │ • week_id        │
                            │ • meals[]        │
                            │ • status         │
                            └────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │   RECIPE    │  │  SHOPPING   │  │    PREP     │
          │ (as process │  │    LIST     │  │   PLAN      │
          │   graph)    │  │             │  │             │
          └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                 │                │                │
                 ▼                │                │
          ┌─────────────┐        │                │
          │  COMPONENT  │◄───────┴────────────────┘
          │             │
          │ • inputs    │
          │ • process   │
          │ • outputs   │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐      ┌─────────────┐
          │   PROCESS   │      │ INGREDIENT  │
          │   MASTER    │      │   MASTER    │
          │             │      │             │
          │ • yield     │      │ • cost      │
          │ • time      │      │ • nutrition │
          │ • nutrition │      │ • shelf     │
          └─────────────┘      └─────────────┘


                            ┌──────────────────┐
                            │    INVENTORY     │
                            │                  │
                            │ • raw items[]    │
                            │ • components[]   │
                            │ • history[]      │
                            └──────────────────┘
```

### 2.2 Data Entity Specifications

#### HOUSEHOLD
```typescript
interface Household {
  id: string;
  name: string;                          // "The Smith Family"
  members: HouseholdMember[];
  defaultBudget: {
    weekly: number;                      // $150
    currency: "AUD";
  };
  preferences: {
    defaultServingSize: number;          // 4
    preferBatchCooking: boolean;
    maxPrepTimePerSession: number;       // 180 minutes
  };
  createdAt: string;
}

interface HouseholdMember {
  id: string;
  name: string;                          // "Dad", "Mom", "Kid 1"
  dietProfileId: string;                 // Reference to diet profile
  portionMultiplier: number;             // 1.0 for adult, 0.5 for child
  mealsPerDay: ("breakfast" | "lunch" | "dinner" | "snack")[];
}
```

#### DIET PROFILE (Existing - Minor Updates)
```typescript
interface DietProfile {
  id: string;
  name: string;                          // "Vegetarian", "Keto", etc.
  restrictions: string[];                // ["no_meat", "no_gluten"]
  preferences: string[];                 // ["spicy", "mediterranean"]
  allergies: string[];                   // ["peanuts", "shellfish"]
  nutritionTargets?: {
    dailyCalories?: number;
    dailyProtein?: number;
    // etc.
  };
}
```

#### WEEKLY SCHEDULE
```typescript
interface WeeklySchedule {
  weekId: string;                        // "2026-W02"
  startDate: string;                     // "2026-01-06"
  endDate: string;                       // "2026-01-12"
  
  mealSlots: MealSlot[];                 // Which meals need to be planned
  prepAvailability: PrepWindow[];        // When user can prep
  
  constraints: {
    budgetThisWeek: number;              // Override default if needed
    quickMealsNeeded: string[];          // ["Mon_dinner", "Wed_lunch"]
    specialOccasions: SpecialOccasion[]; // Birthday dinner, etc.
  };
}

interface MealSlot {
  id: string;                            // "Mon_dinner"
  date: string;                          // "2026-01-06"
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  servings: number;                      // How many people eating
  dietProfiles: string[];                // Which profiles apply
  timeConstraint?: number;               // Max cook time (minutes)
  notes?: string;                        // "Guests coming"
}

interface PrepWindow {
  id: string;
  date: string;
  startTime: string;                     // "14:00"
  endTime: string;                       // "17:00"
  duration: number;                      // 180 minutes
  type: "prep" | "cook" | "both";
}
```

#### MEAL PLAN (Generated Output)
```typescript
interface MealPlan {
  id: string;
  weekId: string;
  status: "draft" | "confirmed" | "in_progress" | "completed";
  
  meals: PlannedMeal[];
  
  // Aggregated calculations
  summary: {
    totalCost: number;
    costPerMeal: number;
    costPerServing: number;
    totalServings: number;
    uniqueRecipes: number;
    totalPrepTime: number;
    totalCookTime: number;
  };
  
  // Cross-cutting analysis
  componentReuse: {
    componentId: string;
    usedInMeals: string[];
    totalQuantityNeeded: number;
    batchRecommendation: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

interface PlannedMeal {
  mealSlotId: string;                    // Reference to MealSlot
  recipeId: string;                      // Which recipe
  servings: number;
  scaleFactor: number;                   // 1.5x the recipe
  
  // Calculated for this specific instance
  cost: number;
  costPerServing: number;
  nutritionPerServing: NutritionProfile;
  
  status: "planned" | "prepped" | "cooked" | "skipped";
  actualServingsConsumed?: number;       // For tracking waste
}
```

#### INVENTORY
```typescript
interface Inventory {
  householdId: string;
  lastUpdated: string;
  
  rawIngredients: InventoryItem[];
  preppedComponents: InventoryComponent[];
  
  // For tracking over time
  history: InventoryTransaction[];
}

interface InventoryItem {
  id: string;
  ingredientId: string;                  // Reference to ingredientMaster
  quantity: number;                      // In canonical units (g or ml)
  unit: string;                          // Display unit
  
  // Tracking
  purchaseDate?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  storageLocation: "fridge" | "freezer" | "pantry";
  
  // Source
  source: "purchased" | "leftover" | "gift";
  costPaid?: number;                     // What user actually paid
}

interface InventoryComponent {
  id: string;
  componentId: string;                   // comp_onion_caramelize_001
  quantity: number;                      // grams
  
  // Tracking
  madeDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  storageLocation: "fridge" | "freezer";
  
  // Source recipe (if tracked)
  madeForMealPlanId?: string;
  madeForRecipeId?: string;
}

interface InventoryTransaction {
  id: string;
  timestamp: string;
  type: "add" | "consume" | "waste" | "adjust";
  
  // What changed
  itemType: "ingredient" | "component";
  itemId: string;
  quantityChange: number;                // Positive for add, negative for consume
  
  // Context
  reason: string;                        // "Shopped", "Used in Recipe X", "Expired"
  mealPlanId?: string;
  recipeId?: string;
}
```

#### SHOPPING LIST (Generated)
```typescript
interface ShoppingList {
  id: string;
  mealPlanId: string;
  status: "generated" | "reviewed" | "shopped";
  
  items: ShoppingItem[];
  
  // Summary
  estimatedTotal: number;
  actualTotal?: number;                  // After shopping
  
  // Organization
  byStore?: {
    storeName: string;
    items: ShoppingItem[];
    subtotal: number;
  }[];
  
  byAisle?: {
    aisle: string;
    items: ShoppingItem[];
  }[];
}

interface ShoppingItem {
  ingredientId: string;
  displayName: string;
  
  // Quantities
  quantityNeeded: number;                // Total needed for meal plan
  quantityInInventory: number;           // What we already have
  quantityToBuy: number;                 // Difference
  
  // Account for yield
  rawQuantityToBuy: number;              // Accounting for peel/trim loss
  yieldFactor: number;                   // 0.85 = 15% loss during prep
  
  // Purchasing
  unit: string;                          // "kg", "bunch", "can"
  estimatedPrice: number;
  aisle?: string;
  
  // Flexibility
  isOptional: boolean;
  substitutes?: string[];                // Alternative ingredients
  notes?: string;
}
```

#### PREP PLAN (Generated)
```typescript
interface PrepPlan {
  id: string;
  mealPlanId: string;
  
  sessions: PrepSession[];
  
  // Summary
  totalPrepTime: number;
  componentsToMake: number;
  batchOpportunities: BatchOpportunity[];
}

interface PrepSession {
  id: string;
  prepWindowId: string;                  // When this happens
  
  tasks: PrepTask[];
  
  // Timing
  estimatedDuration: number;
  actualDuration?: number;
  
  status: "scheduled" | "in_progress" | "completed" | "skipped";
}

interface PrepTask {
  id: string;
  order: number;                         // Sequence within session
  
  // What to do
  componentId: string;                   // What we're making
  recipeIds: string[];                   // Which recipes this is for
  
  // Process details
  processId: string;                     // "caramelize"
  ingredients: {
    ingredientId: string;
    quantity: number;
  }[];
  
  // Output
  outputQuantity: number;                // How much component we'll have
  
  // Timing
  estimatedTime: number;
  activeTime: number;                    // Time requiring attention
  passiveTime: number;                   // Time it runs unattended
  
  // Dependencies
  dependsOn: string[];                   // Task IDs that must complete first
  
  status: "pending" | "in_progress" | "completed" | "skipped";
}

interface BatchOpportunity {
  componentId: string;
  usedInRecipes: string[];
  normalQuantity: number;                // If made separately
  batchQuantity: number;                 // If batched together
  timeSaved: number;                     // Minutes saved
  recommendation: string;
}
```

---

## 3. Revised Implementation Plan

Given the complete system view, here's the updated build order:

### Phase 1: Foundation (Data Models)
**Goal:** Define all core data structures

| Task | Description | Dependency |
|------|-------------|------------|
| 1.1 | Create Process Master schema + seed ~70 processes | None |
| 1.2 | Create Component schema | Process Master |
| 1.3 | Create Inventory schema | Ingredient Master |
| 1.4 | Update Recipe schema to v3 (process graphs) | Component schema |
| 1.5 | Create Meal Plan schema | Recipe schema |
| 1.6 | Create Shopping List schema | Inventory + Recipe |
| 1.7 | Create Prep Plan schema | Component + Recipe |

### Phase 2: Recipe Conversion Engine
**Goal:** Convert existing recipes to process graphs

| Task | Description | Dependency |
|------|-------------|------------|
| 2.1 | Build AI Process Parser (Claude) | Process Master |
| 2.2 | Build Component Generator | Parser + Component schema |
| 2.3 | Build Yield Calculator | Process Master |
| 2.4 | Build Cost Calculator | Yield + Ingredient pricing |
| 2.5 | Build Nutrition Calculator | Yield + Nutrition multipliers |
| 2.6 | Validate with 10 test recipes | All calculators |
| 2.7 | Batch convert 622 recipes | Validated pipeline |
| 2.8 | Extract rules, build hybrid parser | Converted recipes |

### Phase 3: Inventory System
**Goal:** Track what user has

| Task | Description | Dependency |
|------|-------------|------------|
| 3.1 | Build Inventory storage/retrieval | Inventory schema |
| 3.2 | Build "Add from shopping" flow | Inventory |
| 3.3 | Build "Deduct from cooking" flow | Inventory + Recipes |
| 3.4 | Build expiry tracking | Inventory + Shelf life data |
| 3.5 | Build carry-forward logic | Inventory |

### Phase 4: Planning Engine
**Goal:** Generate meal plans, shopping lists, prep schedules

| Task | Description | Dependency |
|------|-------------|------------|
| 4.1 | Build Recipe Selector (given constraints) | Converted recipes + Inventory |
| 4.2 | Build Meal Plan Generator | Recipe Selector |
| 4.3 | Build Shopping List Generator | Meal Plan + Inventory + Yield |
| 4.4 | Build Prep Plan Generator | Meal Plan + Components |
| 4.5 | Build Cost Calculator (for plan) | Shopping List |
| 4.6 | Build Component Reuse Analyzer | Meal Plan + Components |

### Phase 5: Integration & UI
**Goal:** Connect everything to user interface

| Task | Description | Dependency |
|------|-------------|------------|
| 5.1 | Onboarding flow (household, diet profiles) | All schemas |
| 5.2 | Weekly planning flow | Planning Engine |
| 5.3 | Shopping list view | Shopping List Generator |
| 5.4 | Prep schedule view | Prep Plan Generator |
| 5.5 | Inventory management UI | Inventory System |
| 5.6 | Week-over-week tracking | All systems |

---

## 4. Current System State

### What Exists

#### A. Ingredient Master Database (`src/data/ingredientMaster.json`)
- **1,039 ingredients** with comprehensive data
- ✅ Cost per gram (pricing data with AUD Melbourne pricing)
- ✅ Nutritional data per 100g (calories, protein, fat, carbs, vitamins, minerals)
- ✅ Cooking method nutrition multipliers (raw, grilled, baked, fried, boiled, steamed)
- ✅ Storage location and shelf life (fridge, pantry, freezer)
- ✅ Density data (g/cup, g/tbsp, g/tsp) for unit conversion
- ✅ Aliases for matching

**Example Ingredient Structure:**
```json
{
  "garlic": {
    "id": "garlic",
    "displayName": "garlic",
    "canonicalUnit": "g",
    "state": "fresh",
    "density": { "gPerCup": 136, "gPerTbsp": 8.5, "gPerTsp": 2.8 },
    "aliases": ["garlic cloves", "minced garlic", ...],
    "nutritionBase": {
      "per100g": { "calories": 149, "protein": 6.36, ... }
    },
    "nutritionByPreparation": {
      "raw": { "multipliers": {...} },
      "sauteed": { "multipliers": {...} }
    },
    "pricing": {
      "averagePrice": 6.00,
      "unit": "kg",
      "unitSize": "1kg"
    },
    "storage": {
      "location": "Counter/Shelf",
      "shelfLife": "3-6 months"
    }
  }
}
```

#### B. Nutrition Multipliers (`references/nutrition-multipliers.json`)
- Research-backed cooking method multipliers
- Covers: raw, grilled, baked, fried, boiled, steamed, air-fried
- Includes: water loss, oil absorption, fat loss, nutrient leaching
- Ingredient-specific overrides for meat, vegetables, fish

#### C. Recipe Catalog (`src/data/vanessa_recipe_catalog.json`)
- **622 recipes** from Spoonacular
- Current format:
  - Ingredients as flat list (name, quantity, unit)
  - Instructions as HTML string
  - Tags for cuisine, diet, etc.
  - Basic nutrition (not process-aware)

#### D. Recipe Import Pipeline
1. **Extract** (`api/extract-recipe-v2.js`) - AI extracts recipe from text
2. **Normalize** (`api/normalize-ingredients.js`) - Match to ingredient master
3. **User Review** - Handle unmatched ingredients
4. **Enhance Instructions** - Add quantities to instructions
5. **Format & Save**

### What's Missing

| Gap | Description | Priority |
|-----|-------------|----------|
| **Process Definition** | No formal model for cooking processes (dice, sauté, caramelize, etc.) | 🔴 Critical |
| **Component Model** | No intermediate "recipe component" entity | 🔴 Critical |
| **Recipe-as-Processes** | Recipes stored as ingredient lists, not process graphs | 🔴 Critical |
| **Process Time Data** | No database of how long each process takes | 🟡 High |
| **Prep-Ahead Analysis** | No logic to identify make-ahead opportunities | 🟡 High |
| **Component Reuse Detection** | No way to identify shared components across recipes | 🟡 High |
| **Cost Aggregation** | No rollup of ingredient costs through processes to final serve | 🟡 High |
| **Batch Prep Engine** | No system to calculate optimal batch sizes | 🟠 Medium |

---

## 3. Proposed Data Model

### 3.1 Process Definition

```typescript
interface CulinaryProcess {
  id: string;                    // "dice", "caramelize", "blanch", etc.
  displayName: string;           // "Dice", "Caramelize", "Blanch"
  category: ProcessCategory;     // "prep", "cook", "combine", "finish"
  
  // Timing
  timeEstimate: {
    base: number;                // Base time in minutes
    perIngredient: number;       // Additional time per ingredient
    parallelizable: boolean;     // Can run alongside other processes?
  };
  
  // Nutrition impact
  nutritionMultiplier: string;   // Reference to nutrition-multipliers.json (e.g., "grilled")
  customMultipliers?: object;    // Override specific nutrients
  
  // Material changes
  materialChanges: {
    yieldFactor: number;         // 0.85 = 15% water loss, 1.0 = no change
    absorbsOil?: number;         // grams oil per 100g ingredient
    addsSodium?: number;         // mg sodium added per 100g
  };
  
  // Prep-ahead characteristics
  prepAhead: {
    canPrepAhead: boolean;
    shelfLifeHours: number;      // How long component keeps
    storageLocation: string;     // "fridge", "freezer", "counter"
    reheatable: boolean;
  };
  
  // Requirements
  requires: {
    equipment: string[];         // ["knife", "cutting board"]
    additionalIngredients?: string[];  // ["oil", "salt"]
  };
  
  // Applicable ingredient types
  applicableTo: string[];        // ["vegetables", "aromatics", "meat"]
}
```

**Example Process Definitions:**

```json
{
  "dice": {
    "id": "dice",
    "displayName": "Dice",
    "category": "prep",
    "timeEstimate": { "base": 2, "perIngredient": 0.5, "parallelizable": false },
    "nutritionMultiplier": "raw",
    "materialChanges": { "yieldFactor": 0.95 },
    "prepAhead": { "canPrepAhead": true, "shelfLifeHours": 72, "storageLocation": "fridge" },
    "requires": { "equipment": ["knife", "cutting_board"] },
    "applicableTo": ["vegetables", "aromatics", "fruit"]
  },
  
  "caramelize": {
    "id": "caramelize",
    "displayName": "Caramelize",
    "category": "cook",
    "timeEstimate": { "base": 20, "perIngredient": 5, "parallelizable": true },
    "nutritionMultiplier": "sauteed",
    "materialChanges": { 
      "yieldFactor": 0.65, 
      "absorbsOil": 5 
    },
    "prepAhead": { "canPrepAhead": true, "shelfLifeHours": 120, "storageLocation": "fridge" },
    "requires": { 
      "equipment": ["pan", "stove"], 
      "additionalIngredients": ["oil", "salt"] 
    },
    "applicableTo": ["onion", "shallots", "garlic"]
  }
}
```

### 3.2 Recipe Component Model

```typescript
interface RecipeComponent {
  id: string;                     // "caramelized_onion_batch_1"
  name: string;                   // "Caramelized Onion"
  
  // Source
  sourceIngredients: {
    ingredientId: string;         // Master ingredient ID
    quantityG: number;            // Grams of raw ingredient
    state: string;                // "fresh", "frozen", etc.
  }[];
  
  // Process applied
  process: {
    processId: string;            // "caramelize"
    additionalIngredients: {      // Oil, salt, etc.
      ingredientId: string;
      quantityG: number;
    }[];
  };
  
  // Output
  output: {
    quantityG: number;            // Grams after process (accounting for yield)
    state: string;                // "cooked", "raw", etc.
  };
  
  // Calculated values
  calculated: {
    costAUD: number;              // Total cost of this component
    costPerG: number;             // Cost per gram
    nutrition: NutritionProfile;  // Nutrition per 100g
    prepTimeMin: number;          // Time to prepare
  };
  
  // Prep-ahead info
  prepAhead: {
    canStore: boolean;
    shelfLifeHours: number;
    storageLocation: string;
  };
  
  // Reusability (calculated)
  usedInRecipes: string[];        // Recipe IDs that use this component
}
```

### 3.3 Recipe-as-Process-Graph

```typescript
interface ProcessedRecipe {
  recipeId: string;
  name: string;
  
  // Version info
  schemaVersion: 3;               // New schema version
  
  // The recipe as a process graph
  processGraph: {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
  };
  
  // Or simplified linear format for most recipes:
  steps: RecipeStep[];
  
  // Final assembly
  assembly: {
    components: string[];         // Component IDs to combine
    instructions: string;         // Final assembly instructions
    timeMin: number;
  };
  
  // Rollup calculations
  calculated: {
    totalCostAUD: number;
    costPerServe: number;
    nutritionPerServe: NutritionProfile;
    totalPrepTimeMin: number;
    totalCookTimeMin: number;
    activeTimeMin: number;        // Time you're actively working
  };
  
  // Prep-ahead analysis
  prepAhead: {
    components: {
      componentId: string;
      canPrepAhead: boolean;
      shelfLifeHours: number;
      timeToPrep: number;
    }[];
    totalPrepAheadTime: number;   // Time you can save by prepping ahead
    dayOfComponents: string[];    // Components that must be made day-of
  };
  
  // Existing metadata
  servings: number;
  tags: RecipeTags;
  // ...
}

interface RecipeStep {
  stepNumber: number;
  
  // Inputs
  inputs: {
    type: "ingredient" | "component";
    id: string;
    quantityG: number;
  }[];
  
  // Process
  process: {
    processId: string;
    duration: number;
    instructions: string;
  };
  
  // Output
  output: {
    componentId?: string;         // If this creates a reusable component
    description: string;
  };
}
```

---

## 4. Recipe Import Pipeline Changes

### Current Pipeline (v2)
```
Text → AI Extract → Normalize Ingredients → User Review → Save Recipe
```

### New Pipeline (v3)
```
Text → AI Extract → Parse Processes → Normalize Ingredients → 
    → Generate Components → Calculate Costs & Nutrition → 
    → Analyze Prep-Ahead → User Review → Save Recipe
```

### New Steps

#### 4.1 Parse Processes
AI extracts cooking methods from instructions and maps to process definitions.

**Input:**
```
"Dice the onion, then sauté in olive oil until caramelized (about 20 minutes)."
```

**Output:**
```json
{
  "steps": [
    {
      "ingredients": ["onion"],
      "process": "dice",
      "outputDescription": "diced onion"
    },
    {
      "inputs": ["diced onion", "olive oil"],
      "process": "caramelize",
      "duration": 20,
      "outputDescription": "caramelized onion"
    }
  ]
}
```

#### 4.2 Generate Components
Convert parsed processes into component objects with calculated values.

#### 4.3 Calculate Costs & Nutrition
Roll up ingredient costs and apply nutrition multipliers through the process chain.

#### 4.4 Analyze Prep-Ahead
Identify which components can be made ahead and calculate time savings.

---

## 5. New Data Files Required

| File | Purpose |
|------|---------|
| `src/data/processMaster.json` | Master list of culinary processes with metadata |
| `src/data/componentLibrary.json` | Reusable components with cross-recipe references |
| Update `vanessa_recipe_catalog.json` | Schema v3 with process graphs |

---

## 6. Implementation Phases

### Phase 1: Foundation
1. Create `processMaster.json` with ~50 core processes
2. Create component data model and schema
3. Build process parser utility

### Phase 2: Recipe Conversion
1. Update recipe import pipeline to extract processes
2. Build component generator
3. Implement cost/nutrition rollup calculator

### Phase 3: Analysis & Optimization
1. Build prep-ahead analyzer
2. Create component reuse detector (across recipes)
3. Implement batch prep optimizer

### Phase 4: Integration
1. Update UI to show process view of recipes
2. Add meal prep planning features
3. Add inventory management features

---

## 7. Design Decisions (Confirmed)

### 7.1 Scope
**Decision:** Retrospectively convert ALL 622 existing recipes. This is the core engine.

### 7.2 Granularity
**Decision:** As detailed as required to support:
- Material throughput simulation
- Prep organization/scheduling
- Nutritional value calculation for finished recipes
- Pantry/inventory management

This means we need to track:
- Every step that has **yield impact** (peeling, trimming, water loss)
- Every step that has **nutritional impact** (cooking methods)
- Every step that creates a **reusable component** (can be prepped ahead)
- Every step that has **time cost** (for scheduling)

### 7.3 Component Naming
**Decision:** Option C - Maximum specificity
```
comp_[primary_ingredient]_[process]_[id]
```
Examples:
- `comp_onion_caramelize_001`
- `comp_chicken_marinate_002`
- `comp_garlic_mince_003`

This enables:
- Fast lookup by ingredient or process
- Unique identification for throughput optimization
- Clear component lineage

### 7.4 AI vs Rules Strategy
**Decision:** Phased approach
1. **Phase 1:** Pure Claude AI for process extraction
2. **Phase 2:** Analyze AI outputs, identify patterns, create rules
3. **Phase 3:** Hybrid system - rules handle common cases, AI handles edge cases

### 7.5 Feature Development Priority
**Decision:** Build in dependency order (see Section 8)

---

## 8. Logical Implementation Plan

### The Dependency Chain

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: FOUNDATION (Must build first)                          │
├─────────────────────────────────────────────────────────────────┤
│ 1.1 Process Master Database                                     │
│     - Define all culinary processes                             │
│     - Yield factors (peeling loses 15%, caramelizing loses 35%) │
│     - Time estimates (dice: 3min, caramelize: 20min)            │
│     - Nutrition multiplier references                           │
│     - Prep-ahead characteristics                                │
│                                                                 │
│ 1.2 Component Schema                                            │
│     - Define the data structure for components                  │
│     - How components reference ingredients + processes          │
│     - How components chain together                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: EXTRACTION (Depends on Layer 1)                        │
├─────────────────────────────────────────────────────────────────┤
│ 2.1 Process Parser (AI-powered)                                 │
│     - Input: Recipe instructions + ingredient list              │
│     - Output: Ordered list of processes with ingredient mapping │
│     - Uses Claude to understand cooking instructions            │
│                                                                 │
│ 2.2 Component Generator                                         │
│     - Input: Parsed processes + normalized ingredients          │
│     - Output: Component objects with calculated values          │
│     - Links to ingredientMaster for source data                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: CALCULATION (Depends on Layer 2)                       │
├─────────────────────────────────────────────────────────────────┤
│ 3.1 Yield Calculator                                            │
│     - Apply yield factors through process chain                 │
│     - Track: input grams → output grams at each step            │
│     - Account for: peeling, trimming, water loss, absorption    │
│                                                                 │
│ 3.2 Cost Calculator                                             │
│     - ingredient cost → component cost → recipe cost            │
│     - Include: added ingredients (oil, salt)                    │
│     - Output: cost per serve                                    │
│                                                                 │
│ 3.3 Nutrition Calculator                                        │
│     - Apply cooking multipliers at each process step            │
│     - Account for: vitamin loss, concentration, oil absorption  │
│     - Output: nutrition per serve (post-cooking)                │
│                                                                 │
│ 3.4 Time Calculator                                             │
│     - Sum process times (active vs passive)                     │
│     - Identify parallel opportunities                           │
│     - Output: prep time, cook time, active time                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 4: SINGLE RECIPE VALIDATION                               │
├─────────────────────────────────────────────────────────────────┤
│ 4.1 End-to-End Test                                             │
│     - Take ONE recipe through entire pipeline                   │
│     - Verify: cost, nutrition, yield, time calculations         │
│     - Validate against known values                             │
│                                                                 │
│ 4.2 Iterate and Refine                                          │
│     - Test with 5-10 diverse recipes                            │
│     - Identify edge cases and fix                               │
│     - Refine yield factors and multipliers                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 5: BATCH CONVERSION                                       │
├─────────────────────────────────────────────────────────────────┤
│ 5.1 Batch Processing Pipeline                                   │
│     - Convert all 622 recipes to new schema                     │
│     - Track success/failure rates                               │
│     - Queue problematic recipes for review                      │
│                                                                 │
│ 5.2 Rules Extraction                                            │
│     - Analyze AI outputs for patterns                           │
│     - Create rule-based shortcuts for common processes          │
│     - Build hybrid system (rules + AI fallback)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 6: ANALYSIS FEATURES                                      │
├─────────────────────────────────────────────────────────────────┤
│ 6.1 Prep-Ahead Analyzer                                         │
│     - Identify components that can be made in advance           │
│     - Calculate time savings                                    │
│     - Suggest prep schedule                                     │
│                                                                 │
│ 6.2 Component Reuse Detector                                    │
│     - Find same/similar components across recipes               │
│     - "If making caramelized onion, you could also make..."     │
│     - Enable batch prep suggestions                             │
│                                                                 │
│ 6.3 Batch Optimization Engine                                   │
│     - Given a meal plan, calculate optimal batch sizes          │
│     - Minimize waste, maximize reuse                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 7: INVENTORY/PANTRY SYSTEM                                │
├─────────────────────────────────────────────────────────────────┤
│ 7.1 Pantry State Tracking                                       │
│     - Track current inventory of raw ingredients                │
│     - Track prepped components (and their shelf life)           │
│                                                                 │
│ 7.2 Material Throughput                                         │
│     - When recipe is cooked, deduct from pantry                 │
│     - Track consumption over time                               │
│     - Predict when restocking needed                            │
│                                                                 │
│ 7.3 Shopping List Generation                                    │
│     - Given meal plan + current pantry                          │
│     - Calculate what needs to be purchased                      │
│     - Account for yield factors (need 120g onion to get 100g)   │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Order?

| Order | Why It Must Come Before Next |
|-------|------------------------------|
| 1. Process Master | Can't parse processes without knowing what processes exist |
| 2. Component Schema | Can't generate components without a schema |
| 3. Process Parser | Can't generate components without parsed processes |
| 4. Component Generator | Can't calculate anything without components |
| 5. Calculators | Can't validate without calculation logic |
| 6. Single Recipe Test | Must prove system works before batch processing |
| 7. Batch Conversion | Can't analyze recipes that aren't converted |
| 8. Analysis Features | Need converted recipes to analyze |
| 9. Inventory System | Need material tracking data from recipes |

---

## 9. Yield Factor Examples

Understanding yield is critical. Here's how material moves through the system:

### Example: Onion in French Onion Soup

```
START: 1 onion (raw, whole)
       Weight: 150g
       Cost: $0.40
       Nutrition: 60 cal, 1.1g protein, 14g carbs per 150g

STEP 1: PEEL
       Process: peel
       Yield Factor: 0.90 (lose 10% as skin)
       Output: 135g peeled onion
       Cost: $0.40 (same cost, less material)
       Cost/g: $0.00296/g (was $0.00267/g)

STEP 2: SLICE
       Process: slice_thin
       Yield Factor: 0.98 (minimal loss, just ends)
       Output: 132g sliced onion
       Cost: $0.40
       Cost/g: $0.00303/g

STEP 3: CARAMELIZE
       Process: caramelize
       Yield Factor: 0.65 (35% water loss over 30 min)
       Added: 15g butter ($0.12)
       Output: 86g caramelized onion + 15g butter = ~95g
       Cost: $0.40 + $0.12 = $0.52
       Cost/g: $0.0055/g
       Nutrition: Concentrated (higher cal/g due to water loss)
                  + fat from butter

FINAL COMPONENT: comp_onion_caramelize_001
       Weight: 95g
       Cost: $0.52
       Cost/g: $0.0055/g
       Can prep ahead: Yes, 5 days fridge
       Used in: French Onion Soup (this recipe)
                Burger Toppings (Recipe #234)
                Caramelized Onion Pizza (Recipe #456)
```

---

## 10. Immediate Next Steps

### Step 1: Create Process Master Database
- [ ] Define ~50-70 core processes
- [ ] Research yield factors for each
- [ ] Map to nutrition multipliers
- [ ] Add time estimates
- [ ] Document prep-ahead characteristics

### Step 2: Create Component Schema
- [ ] Define TypeScript/JSON schema
- [ ] Create validation functions
- [ ] Design ID generation system

### Step 3: Build Process Parser (AI)
- [ ] Design prompt for Claude
- [ ] Test on 5 sample recipes
- [ ] Iterate on prompt engineering

### Step 4: Build Component Generator
- [ ] Implement yield calculations
- [ ] Implement cost rollup
- [ ] Implement nutrition rollup
- [ ] Implement time summation

### Step 5: Validate with Test Recipes
- [ ] Select 10 diverse test recipes
- [ ] Run through pipeline
- [ ] Verify calculations manually
- [ ] Fix issues

---

## Appendix A: Initial Process Categories (To Be Expanded)

| Category | Processes | Typical Yield |
|----------|-----------|---------------|
| **Remove** | peel, trim, core, deseed, debone, shell | 70-95% |
| **Cut** | dice, mince, slice, julienne, chop, cube, quarter | 95-100% |
| **Combine** | mix, fold, toss, whisk, knead | 100% |
| **Cook-Dry** | sauté, roast, grill, bake, fry, broil | 70-90% |
| **Cook-Wet** | boil, simmer, poach, steam, braise, stew | 85-120%* |
| **Reduce** | caramelize, reduce, deglaze | 50-70% |
| **Transform** | marinate, brine, cure, ferment | 95-110%* |
| **Finish** | garnish, plate, rest, slice-to-serve | 100% |

*>100% = absorbs liquid (pasta, rice, beans)

---

## Appendix: Process Categories

| Category | Examples | Description |
|----------|----------|-------------|
| **prep** | dice, mince, slice, julienne, chop, peel, zest | Raw prep, no cooking |
| **cook-dry** | sauté, roast, grill, bake, fry, air-fry | Heat without liquid |
| **cook-wet** | boil, simmer, poach, steam, braise | Heat with liquid |
| **combine** | mix, fold, toss, layer, stuff | Combining components |
| **finish** | garnish, plate, rest, slice-to-serve | Final steps |
| **preserve** | pickle, ferment, cure, freeze | Long-term storage prep |


---

## 11. Additional System Requirements (Confirmed Jan 11)

Based on discussion, the following capabilities must be built into the system:

### 11.1 Recipe Scaling Intelligence

Recipes need **ideal serving ranges** based on complexity and process time:

| Recipe Type | Min | Ideal | Max | Category | Reason |
|-------------|-----|-------|-----|----------|--------|
| Soup/Stew | 6 | 12 | 20 | bulk_cook | High prep time, freezes well |
| Sandwich | 1 | 1 | 4 | single_serve | Quick, made fresh |
| Stir-fry | 2 | 4 | 6 | small_batch | Wok capacity limits |
| Curry | 4 | 8 | 16 | bulk_cook | Flavors develop, freezes well |
| Roast Chicken | 4 | 4 | 4 | fixed_batch | One bird = ~4 servings |

**Scaling Categories:**
- `single_serve` - Sandwiches, salads - make per serving
- `small_batch` - 2-4 servings optimal
- `medium_batch` - 4-8 servings optimal
- `bulk_cook` - 8+ servings, freeze extras
- `fixed_batch` - Can't scale (e.g., whole roast chicken)

### 11.2 Equipment Tracking

Track user's available equipment to filter recipes. Collected during onboarding:
- Specialty: slow cooker, pressure cooker, air fryer, stand mixer, food processor, blender, grill, wok, dutch oven, sous vide
- Capacity: oven size, stovetop burners

### 11.3 User Skill Level Assessment

**Onboarding:**
1. Self-rated confidence (1-5)
2. Process familiarity checklist ("Have you done these?")
3. Optional validation question

**Progression:** Track recipes completed, success rate, new processes learned

### 11.4 Ingredient Substitution System

Built into both ingredients AND recipes:
- Direct substitutes with ratios
- Dietary impact notes ("Makes recipe dairy-free")
- Whether ingredient can be omitted

### 11.5 User-Specific Pricing via Receipt Scanning

**Workflow:**
1. User photographs receipt → AI extracts items, quantities, prices
2. System matches to ingredient database
3. Updates user's personal price history
4. Calculates user's shopping tier (budget/standard/premium/organic)

### 11.6 Seasonal Ingredient Data

Add to ingredientMaster: peak months, available months, off-season months, price multipliers by season (Melbourne region)

### 11.7 Multi-Recipe Meals with Mixed Diet Profiles

A meal can have multiple recipes (main + sides), and different diners can eat different components based on their diet profiles.

**Example:**
```
Tuesday Dinner:
├── Main: Grilled Chicken → Dad, Teen, Kid
├── Main: Grilled Tofu → Mom (vegetarian)  
├── Side: Roasted Veggies → Everyone
└── Side: Quinoa Salad → Everyone
```

---

## 12. Remaining Questions

1. **Leftover Handling:** When bulk recipe makes 12 servings but user eats 4, how are the other 8 tracked? As "leftover meals" to schedule later? Different from prepped components?

2. **Feedback Loop:** After cooking, does user rate the meal? Does this feed into future recommendations?

3. **Waste Tracking:** Do we track when food is thrown away? For waste reduction optimization?

4. **Recipe Import:** Users can import their own recipes beyond the 622 catalog? *(Assume: Yes)*

5. **Manual Override:** Can user fully modify AI-generated meal plan? *(Assume: Yes)*

---

## 13. Final Design Decisions (All Questions Resolved)

### 13.1 Leftover Handling → Option C (Flexible)

**Decision:** User chooses what to do with bulk recipe excess

- Can schedule some as "leftover meals" for later in week
- Can freeze some (tracked in inventory with storage location)
- Can leave flexible (in inventory but not pre-scheduled)
- Vanessa can suggest: "You have leftover soup - use it for Tuesday lunch?"

**Example flow:**
```
User makes 12 servings soup
├── Eat 4 Monday dinner
├── Schedule 4 for Wednesday lunch (leftover meal)
└── Freeze 4 for later (inventory: freezer, 3 month shelf life)
```

### 13.2 Feedback Loop → Staged Approach

**Decision:** More questions early, fewer over time

**Initial Period (Weeks 1-4):**
- More detailed feedback after each meal
- "How did this turn out?" (1-5)
- "Any issues with the recipe?"
- "Would you make this again?"

**Established Period (Week 5+):**
- Minimal feedback (just star rating)
- Only prompt for details if low rating

**User Communication:**
> "During these first few weeks, I'll ask more questions to learn your preferences and cooking style. Once I understand you better, I'll ask less frequently."

This is part of **staged onboarding** - front-load learning, reduce friction over time.

### 13.3 Waste Tracking → Collaborative Inventory Maintenance

**Decision:** Don't burden user with constant tracking; use shelf life + periodic check-ins

**Automatic Expiry:**
- System tracks purchase/prep dates
- Items auto-expire based on shelf life data
- No user action needed for time-based expiry

**Periodic Check-In (During Next Week Planning):**
When Vanessa plans the next week, she reviews inventory and asks about ~5 key items (short shelf life, main ingredients):

> "Before I plan next week, let me check what you have:
> - Chicken breast (bought 3 days ago, shows 400g) - still have it?
> - Spinach (bought 5 days ago, shows 200g) - any left?
> - Leftover curry (made 4 days ago) - eaten or tossed?"

**Accuracy Philosophy:**
- Doesn't need gram-level accuracy
- "Good enough" inventory is sufficient
- User will be forgiving of minor discrepancies
- System learns patterns over time (e.g., "this user uses chicken faster than average")

### 13.4 Recipe Import → Yes, Through Process Parsing

**Decision:** Users can import their own recipes

**Flow:**
1. User pastes recipe text (or URL in future)
2. AI extracts recipe structure
3. System parses processes from instructions
4. Matches ingredients to master database
5. **If ambiguous:** User queried to resolve
   - "Is 'cream' heavy cream or sour cream?"
   - "What does 'quickly cook' mean? Sauté? Stir-fry?"
6. Recipe added to user's library

**Note:** Current catalog is ~540 recipes (verify exact count), not 622.

### 13.5 Manual Override → Full Flexibility Through Vanessa

**Decision:** All changes go through Vanessa, not direct edits

**Why:**
- Maintains data integrity across all related systems
- When recipe changes, Vanessa updates: shopping list, prep plan, cost estimates, inventory projections

**User Experience:**
```
User: "I don't want to make the curry on Thursday, can we do something easier?"

Vanessa: "Sure! Here are some quick options that use similar ingredients:
1. Stir-fry (20 min) - uses the same vegetables
2. Omelette (15 min) - you have eggs
3. Pasta primavera (25 min) - pantry staples

Which would you prefer? I'll update everything accordingly."

[User picks option 2]

Vanessa: "Done! I've updated:
- Thursday dinner: Veggie Omelette
- Shopping list: Removed coconut milk, added 6 eggs
- Prep plan: No Saturday curry prep needed
- Week cost: Reduced by $4.50"
```

---

## 14. Implementation Readiness Checklist

### Data We Have ✓
- [x] Ingredient database (1,039 ingredients)
- [x] Pricing data (Melbourne)
- [x] Nutrition data (per 100g)
- [x] Cooking multipliers (grilled, baked, fried, etc.)
- [x] Shelf life data
- [x] Storage locations
- [x] Diet profiles system
- [x] Recipe catalog (~540 recipes)

### Data We Need to Create
- [ ] **Process Master** (~70 processes with yield, time, nutrition refs)
- [ ] **Component Schema** (intermediate products)
- [ ] **Recipe v3 Schema** (process graphs)
- [ ] **Inventory Schema** (raw + prepped + leftovers)
- [ ] **Meal Schema** (multi-recipe, multi-diner)
- [ ] **User Profile Extensions** (equipment, skill, pricing)

### Systems We Need to Build
- [ ] Process Parser (AI extracts processes from instructions)
- [ ] Component Generator (creates components from processes)
- [ ] Yield/Cost/Nutrition Calculators
- [ ] Recipe Batch Converter (540 recipes)
- [ ] Inventory Tracker
- [ ] Meal Planner (AI generates plans)
- [ ] Shopping List Generator (with yield factors)
- [ ] Prep Plan Generator (with batch optimization)
- [ ] Receipt Scanner (user-specific pricing)

---

## 15. Ready to Begin: Phase 1 - Process Master

We now have complete clarity on the system design. 

**First step:** Create the Process Master Database

This is the foundation because:
1. Can't parse recipes without knowing what processes exist
2. Can't calculate yield without process yield factors
3. Can't estimate time without process time data
4. Can't track nutrition without process→multiplier mapping

**Deliverable:** `src/data/processMaster.json` with ~70 culinary processes

