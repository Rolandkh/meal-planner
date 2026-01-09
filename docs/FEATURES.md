# Features Documentation

Complete guide to all features in Vanessa, organized by slice and category.

---

## Feature Status Legend

- ✅ **Complete** - Fully implemented and tested
- 🚧 **In Progress** - Partially implemented
- 📋 **Planned** - Designed but not yet built
- 🎯 **Future** - Concept stage

---

## Slice 1: Chat with Vanessa ✅

### Conversational Interface

**Status:** ✅ Complete

**Description:** Chat with Vanessa about your meal planning needs, preferences, and questions.

**Key Features:**
- **Streaming responses** - See Vanessa's reply in real-time (SSE)
- **Collapsible widget** - Access from any page
- **Conversation history** - Persistent across sessions
- **Mobile-responsive** - Full-screen on mobile, side panel on desktop
- **Auto-resizing textarea** - Comfortable for long messages
- **Voice-activated generation** - Say "plan my week" to trigger auto-generation

**Technical:**
- Server-Sent Events (SSE) for streaming
- Claude Sonnet 4.5 API
- localStorage persistence (`vanessa_chat_history`)

**Routes:**
- Available on all pages via chat button

---

### AI-Powered Onboarding

**Status:** ✅ Complete

**Description:** 5-question conversational onboarding that extracts household members, schedules, and preferences.

**Questions:**
1. Who eats your meals? (extracts household members)
2. Weekly schedule? (extracts who eats when)
3. Dietary restrictions/preferences?
4. Weekly budget?
5. Shopping preferences?

**Smart Extraction:**
- **Household members** - Automatically creates eater profiles
- **Weekly schedule** - Maps to structured servings per meal
- **Preferences** - Converts to actionable dietary goals

**Technical:**
- Structured extraction via Claude
- Validates data before saving
- Visual progress feedback
- Auto-generates first meal plan on completion

---

## Slice 2: Meal Plan Generation ✅

### Full Week Generation

**Status:** ✅ Complete

**Description:** Generate complete 7-day meal plans with 21 meals (breakfast, lunch, dinner × 7).

**Features:**
- **Real-time progress** - Progress bar with status updates (10% → 100%)
- **Accurate servings** - Based on household schedule (who eats when)
- **Recipe deduplication** - Same recipe can appear multiple days
- **Catalog-first** - Uses existing recipes when possible (40-70%)
- **Budget-aware** - Targets your weekly budget
- **Ingredient limits** - Respects shopping list item limit (default: 30)
- **Health-optimized** - Generates meals with good Diet Compass scores

**Process:**
1. User clicks "Generate New Week"
2. Progress page shows: Planning → Recipes → Calculating
3. Auto-archives old plan (if exists)
4. Creates 21 meals across 7 days
5. Aggregates shopping list
6. Calculates budget estimate
7. Navigates to meal plan view

**Technical:**
- `/api/generate-meal-plan` endpoint
- Takes 15-25 seconds typical
- ~2,000-6,000 tokens (optimized)
- Cost: ~$0.03 per generation

**Routes:**
- `#/generating` - Progress page
- `#/meal-plan` - Result view

---

### Shopping List

**Status:** ✅ Complete

**Description:** Aggregated ingredient list organized by category with quantity consolidation.

**Features:**
- **Category grouping** - Produce, Meat, Dairy, Pantry, Other
- **Quantity aggregation** - Combines same ingredients across meals
- **Unit conversion** - 70+ ingredients with smart conversion
- **Ingredient limits** - Default 30 items, configurable in Settings
- **Budget display** - Shows estimated cost vs target
- **Metric units** - All quantities in grams, ml, or whole items

**Example:**
```
PRODUCE
☐ 2400g Cherry tomatoes
☐ 800g Spinach
☐ 6 whole Onions

MEAT & SEAFOOD
☐ 1200g Salmon fillet
☐ 600g Chicken breast
```

**Technical:**
- Smart aggregation algorithm
- Unit conversion system (70+ ingredients)
- Category classification

**Routes:**
- `#/shopping-list`

---

### Day-Specific Views

**Status:** ✅ Complete

**Description:** View individual days with 3 meals (breakfast, lunch, dinner).

**Features:**
- **7 quick nav buttons** - Mon-Sun on home page
- **Individual day pages** - Focus on one day at a time
- **Meal cards** - Recipe name, emoji, timing, servings
- **Regenerate button** - Replace just this day (see Slice 4)
- **Household schedule** - Shows who's eating each meal

**Routes:**
- `#/day/monday`
- `#/day/tuesday`
- ...
- `#/day/sunday`

---

## Slice 3: Recipe Library & Profile Management ✅

### Recipe Library

**Status:** ✅ Complete

**Description:** Browse, search, and filter your recipe collection (includes 607 catalog recipes).

**Features:**
- **Search** - By name, ingredients, or tags (300ms debounce)
- **Filters:**
  - All Recipes
  - Favorites ❤️
  - High-Rated (≥4⭐)
  - Most Cooked (≥3× times)
- **Sorting:**
  - Most Popular (by times cooked)
  - A-Z
- **Recipe cards:**
  - Name with emoji
  - Prep + cook time
  - Servings
  - Rating (1-5 stars)
  - Favorite indicator
  - Health score bars (5 metrics)

**Technical:**
- Real-time filtering
- Debounced search
- localStorage + catalog integration
- 607 catalog recipes + user recipes

**Routes:**
- `#/recipes`

---

### Recipe Detail Pages

**Status:** ✅ Complete

**Description:** Full recipe view with ratings, favorites, and usage tracking.

**Features:**
- **Hero image** - Recipe photo (if available)
- **Interactive rating** - Click stars to rate (1-5)
- **Favorite toggle** - ❤️/🤍 to mark favorite
- **Usage tracking:**
  - Times cooked counter
  - Last cooked date
  - "Mark as Cooked" button
- **Ingredients** - Grouped by category
- **Instructions** - Step-by-step numbered list
- **Tags** - Clickable cuisine/diet/dish type tags
- **Health scores** - Full 5-metric breakdown with bars
- **Edit button** - Opens edit page (see Slice 4)

**Technical:**
- Updates recipe metadata on interaction
- Tracks all user engagement
- Displays Diet Compass scores

**Routes:**
- `#/recipe/:id`

---

### Settings Page

**Status:** ✅ Complete

**Description:** 4-section settings page for managing all preferences.

**Sections:**

**1. Storage Management**
- Storage quota display (X MB / 5 MB)
- Export all data (JSON backup)
- Import data (restore from backup)
- Clear old meal plans
- Warning at 80% capacity

**2. Household Members**
- Add/edit/remove eaters
- Name, preferences, allergies, restrictions
- Weekly schedule (which meals they eat)
- Default eater selection

**3. Meal Planning**
- Weekly budget ($)
- Max shopping list items (default: 30)
- Shopping day preference
- Preferred store
- Dietary goals (free text)
- History retention (1-12 weeks, default: 4)

**4. Chat Preferences**
- Vanessa's personality
- Communication style
- Response detail level

**Technical:**
- Tab-based navigation
- Auto-save (shows "Saved ✓" indicator)
- Validation on all inputs
- Immediate effect on changes

**Routes:**
- `#/settings`

---

### Development Presets

**Status:** ✅ Complete

**Description:** One-click bypass of onboarding for rapid testing.

**What it includes:**
- 3 eaters (You, Maya, Cathie)
- Mediterranean diet preferences
- Complete weekly schedule
- 6 sample Mediterranean recipes
- 21 meals across 7 days
- $120 weekly budget
- Ingredient reuse strategy

**Benefits:**
- Speeds up testing from 5+ minutes to 2 seconds
- Real household data for realistic testing
- Personalized Mediterranean diet example

**Access:**
- Scroll to bottom of home page
- Click "🔧 Import Dev Preset"
- Instant full setup

---

## Slice 4: Recipe Management & History ✅

### Recipe Editing

**Status:** ✅ Complete

**Description:** Edit any recipe with full form validation and auto-save.

**Features:**
- **Full edit form:**
  - Recipe name
  - Prep/cook times
  - Servings
  - Dynamic ingredient rows (add/remove)
  - Instructions (textarea)
  - Tags (comma-separated)
- **Auto-save drafts** - Every 30 seconds
- **BeforeUnload protection** - Warns if unsaved changes
- **Validation:**
  - Required fields
  - Positive numbers for times/servings
  - At least one ingredient
- **Visual feedback:**
  - Button turns green on successful save
  - Toast notification
  - Unsaved indicator

**Technical:**
- Drafts stored in localStorage (`recipe_draft_[id]`)
- Changes persist in active meal plans
- Full recipe object updated

**Routes:**
- `#/recipe/:id/edit`

---

### Single Day Regeneration

**Status:** ✅ Complete

**Description:** Regenerate any single day (3 meals) without losing the rest of the week.

**Features:**
- **Buttons:**
  - 🔄 on each day card in Meal Plan View
  - 🔄 in DayView header
- **Confirmation modal:**
  - Shows current 3 meals
  - "Regenerate Tuesday" button
  - Cancel option
- **Fast generation:**
  - ~20-30 seconds (vs 60-90s for full week)
  - Only generates 3 meals
  - Preserves other 18 meals
- **Duplication avoidance:**
  - Won't reuse recipes from existing week
  - Fresh variety every regeneration
- **Shopping list update:**
  - Automatically recalculates
  - Adjusts ingredient quantities
- **Context-aware navigation:**
  - Returns to origin page (Meal Plan or Day View)

**Use cases:**
- Don't like Tuesday's meals? Regenerate just Tuesday
- Have leftovers? Regenerate that day
- Guests coming Thursday? Special dinner regeneration

**Technical:**
- `/api/generate-meal-plan` with `regenerateDay` param
- Sends existing 18 meals for duplication check
- Merges 3 new meals with 18 existing

**Routes:**
- Available from `#/meal-plan` and `#/day/:day`

---

### Meal Plan History

**Status:** ✅ Complete

**Description:** Browse all past meal plans with auto-archiving and configurable retention.

**Features:**
- **Auto-archive:**
  - Old plan automatically saved when generating new
  - Happens silently, no user action required
  - Captures snapshot at archive time
- **History page:**
  - Grid of past meal plan cards
  - Week dates (Dec 28 - Jan 3)
  - Brief summary (e.g., "Mediterranean weight loss week")
  - Click to view full historical plan
- **Historical plan view:**
  - Read-only (no edit buttons)
  - "Archived" badge
  - Full week of meals
  - Shopping list
  - All original data frozen
- **Configurable retention:**
  - Settings: 1-12 weeks (default: 4)
  - Automatic cleanup based on retention
  - Older plans deleted automatically
- **Snapshot system:**
  - Frozen copy of meals at archive time
  - Frozen copy of recipes at archive time
  - Prevents corruption if recipes edited later

**Technical:**
- `vanessa_meal_plan_history` array in localStorage
- Each archived plan: ~50-100KB
- Automatic cleanup on generation
- Retention setting in `baseSpecification`

**Routes:**
- `#/history` - List of all archived plans
- `#/history/:id` - View specific historical plan

---

### Recipe Import from Text

**Status:** ✅ Complete

**Description:** Import recipes from pasted text (blogs, emails, messages) using AI extraction.

**Features:**
- **3-step modal:**
  1. Paste text (50-5000 chars)
  2. AI extraction (5-10 seconds)
  3. Preview & edit before saving
- **AI extraction:**
  - Recipe name
  - Ingredients with quantities
  - Units converted to metric
  - Instructions
  - Prep/cook times
  - Servings
  - Tags (cuisine, diet, dish type)
- **Confidence scoring:**
  - 0-100% confidence
  - Shown in preview
  - Lower confidence = review carefully
- **Error handling:**
  - Text too short (<50 chars)
  - Text too long (>5000 chars)
  - Not a recipe detected
  - Validation failures
  - Parse errors
- **Preview screen:**
  - Edit any field before saving
  - Add tags
  - Adjust quantities
  - Fix instructions

**Use cases:**
- Found recipe on blog? Copy & paste
- Grandma sent recipe via email? Import it
- Screenshot of recipe? Type it out, paste
- Recipe in a message? Import directly

**Technical:**
- `/api/extract-recipe` endpoint
- Claude Sonnet 4.5 extraction
- Structured output parsing
- Metric unit conversion
- ~300-500 tokens per extraction
- Cost: ~$0.01 per import

**Access:**
- Recipe Library page → "+ Add Recipe" button

---

## Slice 5: Health Intelligence & Recipe Catalog 🚧

### Recipe Catalog System

**Status:** ✅ Phase 1 Complete

**Description:** 607 professionally-tested recipes from Spoonacular, stored locally with zero ongoing API dependency.

**Features:**
- **607 recipes:**
  - 24 cuisines (Mediterranean, Italian, Asian, Mexican, etc.)
  - 10 diet types (Vegetarian, Vegan, Keto, Paleo, etc.)
  - 27 dish types (Main, Appetizer, Dessert, Soup, Salad, etc.)
- **Complete data:**
  - Full ingredient lists (metric units)
  - Step-by-step instructions
  - Prep and cook times
  - Servings
  - Comprehensive tags
  - Full nutrition data (calories, macros, micros)
- **Local images:**
  - 606 of 607 photos downloaded
  - ~11MB total storage
  - ~18KB average per image
  - No CDN dependency
- **Zero ongoing cost:**
  - One-time extraction (~1,400 Spoonacular points)
  - No monthly subscription required
  - All data cached locally

**Catalog coverage:**
- Mediterranean: 85 recipes
- Italian: 72 recipes
- Asian: 68 recipes
- Mexican: 45 recipes
- And 20 more cuisines...

**Technical:**
- `vanessa_recipe_catalog` in localStorage (~900KB)
- Loads once on app boot (~200-300ms)
- Cached for session
- Images in `/public/images/recipes/`

---

### Diet Compass Health Scoring

**Status:** ✅ Complete

**Description:** 4-metric health rating system based on "The Diet Compass" by Bas Kast.

**Metrics (0-100 each):**

**1. Nutrient Density 🥗**
- Protective foods: vegetables, legumes, nuts, fish (+score)
- Harmful foods: red meat, processed foods, sugar (-score)
- Fiber, vitamins, minerals content

**2. Anti-Aging ⏳**
- Longevity factors (autophagy triggers, polyphenols)
- Inflammation markers
- Protective compounds

**3. Weight Loss ⚖️**
- Glycemic impact
- Satiety factors
- Calorie density

**4. Heart Health ❤️**
- Omega-3 content
- Healthy fats (MUFA, PUFA)
- Fiber content
- Cholesterol impact

**Visual Display:**
- **Recipe cards:** 5-bar horizontal display (compact)
- **Recipe detail:** Full breakdown with labels and scores

**Coverage:**
- 605 of 607 catalog recipes scored (99.7%)
- 100+ ingredients in health database
- Real-time scoring (<5ms per recipe)

**Scoring algorithm:**
```
1. For each ingredient:
   - Get health impact from database
   - Calculate quantity ratio (grams per serving)
   - Apply ratio weighting
2. Aggregate scores across all ingredients
3. Normalize to 0-100 scale
4. Calculate overall average
```

**Technical:**
- `vanessa_ingredient_health` in localStorage (~35KB)
- Scoring utils in `src/utils/healthScoring.js`
- Runs on recipe load
- Cached in recipe object

---

### Diet Profile System (Data Layer)

**Status:** 🚧 Data complete, UI pending

**Description:** 11 preloaded diet profiles with compatibility filtering and conflict detection.

**Profiles:**
1. **Mediterranean** - Heart-healthy, longevity-focused
2. **Keto** - Very low-carb, high-fat
3. **Vegan** - Plant-based only
4. **Vegetarian** - No meat, includes dairy/eggs
5. **High Protein** - Muscle building, athletic
6. **Flexitarian** - Mostly plant-based, occasional meat
7. **Longevity Protocol** - Based on Diet Compass book
8. **Intermittent Fasting** - Time-restricted eating
9. **MIND Diet** - Brain health focused
10. **Kid-Friendly** - Familiar flavors, less spice
11. **La Dieta** - Temporary elimination diet (3 phases)

**Profile metadata:**
- Name, description, emoji
- Core principles
- Allowed/avoided foods
- Meal structures
- Diet Compass scores (predicted)
- Daily targets (macros, calories)

**Compatibility:**
- Some profiles compatible (Vegan + Mediterranean)
- Some conflict (Vegan + Keto = impossible)
- Conflict detection built-in

**What's NOT built yet:**
- ❌ Settings UI to select profiles
- ❌ Profile-based filtering in meal generation
- ❌ Multi-profile meal plans (separate recipes per conflict)
- ❌ Onboarding diet suggestions

**Technical:**
- `vanessa_diet_profiles` in localStorage (~10KB)
- 17 profiles total (v2.0.0)
- Profile utilities in `src/utils/dietProfiles.js`

---

### Catalog-First Meal Generation

**Status:** ✅ Complete

**Description:** Intelligent recipe matching that uses catalog recipes before generating new ones.

**Process:**
1. Claude suggests recipe names during generation
2. Client attempts exact match on catalog (e.g., "Greek-Style Baked Fish")
3. If no exact match, tries fuzzy match (e.g., "Greek Baked Fish")
4. If still no match, uses Claude's generated recipe
5. Tracks catalog vs generated ratio

**Benefits:**
- **Cost savings:** 50-70% reduction in Claude tokens
- **Faster generation:** Pre-scored recipes, no health calculation needed
- **Better quality:** Professional recipes from Spoonacular
- **Instant health data:** All catalog recipes pre-scored

**Results:**
- Typical catalog usage: 40-70% (12-15 of 21 meals)
- Token savings: ~4,000 tokens per plan
- Cost savings: ~$0.06 per plan
- Generation time: 25s → 15s typical

**Technical:**
- Name matching in `mealPlanTransformer.js`
- Exact + fuzzy matching algorithm
- Stats tracking and console logging
- Claude prompted to use catalog-friendly names

---

## Planned Features 📋

### Slice 5 Phase 2 (Next Up)

**Settings UI for Diet Profiles:**
- Select active diet profiles
- Conflict warnings
- Profile compatibility checking
- Onboarding integration

**Prep Planning System:**
- 3 prep strategies (Fresh, Batch, Hybrid)
- Prep day selection
- Component reuse optimization
- Time savings calculator

**Recipe Variations:**
- Parent/child recipe relationships
- Create variations from base recipe
- Track recipe families

**Multi-Profile Generation:**
- Generate separate recipes for conflicting diets
- Household with Vegan + Keto members
- Shared sides, separate mains

---

### Slice 6: Firebase Migration & Sync 📋

**Firebase Integration:**
- Migrate from localStorage to Firestore
- Firebase Authentication (anonymous + Google)
- Multi-device sync
- Cloud backup

**Usage Metering:**
- Free tier: 4 generations/month
- Paid tier: unlimited
- Track usage across devices

**Benefits:**
- Unlimited storage
- Multi-device access (phone + desktop)
- Data never lost
- Share with family members

---

### Slice 7: Advanced Features 🎯

**Nutrition Tracking:**
- Daily calorie tracking
- Macro breakdown
- Micronutrient analysis
- Weekly nutrition summary

**Meal Plan Templates:**
- Save custom templates
- Reuse successful meal plans
- Share templates with others

**Social Features:**
- Share meal plans
- Rate public recipes
- Community recipe library

**Mobile App:**
- React Native iOS/Android
- Native performance
- Offline mode
- Push notifications

---

## Feature Comparison

| Feature | Slice 1 | Slice 2 | Slice 3 | Slice 4 | Slice 5 | Planned |
|---------|---------|---------|---------|---------|---------|---------|
| Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Onboarding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Meal Plans | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shopping List | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recipe Library | - | - | ✅ | ✅ | ✅ | ✅ |
| Settings | - | - | ✅ | ✅ | ✅ | ✅ |
| Recipe Edit | - | - | - | ✅ | ✅ | ✅ |
| Single Day Regen | - | - | - | ✅ | ✅ | ✅ |
| History | - | - | - | ✅ | ✅ | ✅ |
| Import Recipe | - | - | - | ✅ | ✅ | ✅ |
| Recipe Catalog | - | - | - | - | ✅ | ✅ |
| Health Scores | - | - | - | - | ✅ | ✅ |
| Diet Profiles | - | - | - | - | 🚧 | ✅ |
| Prep Planning | - | - | - | - | - | 📋 |
| Firebase Sync | - | - | - | - | - | 📋 |
| Usage Metering | - | - | - | - | - | 📋 |
| Nutrition Track | - | - | - | - | - | 🎯 |
| Templates | - | - | - | - | - | 🎯 |

---

**Last Updated:** January 9, 2026
