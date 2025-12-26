# Vanessa - AI Meal Planning Concierge

**Version:** v0.9 (Slices 1, 2 & 3 Complete)  
**Status:** Production-ready with full profile management  
**Created:** December 2025

---

## Overview

Vanessa is an AI-powered meal planning assistant that helps you:
- 💬 Chat about your meal planning needs and preferences
- 👥 Manage household members with dietary preferences and schedules
- ✨ Generate personalized 7-day meal plans with accurate servings
- 🛒 Get organized shopping lists with ingredient limits (30 items default)
- 📖 Browse, search, and rate your recipe library
- ⭐ Track recipe favorites and cooking history
- 💰 Control your weekly food budget
- ⚙️ Customize settings and preferences

## Current Features (Slices 1, 2 & 3)

### ✅ Slice 1: Chat with Vanessa
- Collapsible chat widget accessible from anywhere
- Real-time streaming responses using Server-Sent Events (SSE)
- AI-powered onboarding flow (5 questions)
- Conversation history persists across sessions
- Voice-activated generation ("plan my week" auto-triggers)
- Mobile-responsive (full-screen on mobile, side panel on desktop)
- Auto-resizing textarea for comfortable typing

### ✅ Slice 2: Meal Plan Generation
- Generate complete 7-day meal plans with one click
- Real-time progress updates during generation (10% → 100%)
- 21 meals per week (breakfast, lunch, dinner × 7 days)
- Automatic recipe deduplication (same recipe used multiple days)
- Household schedule grid (visual calendar showing who eats when)
- Accurate servings per meal based on household composition
- Shopping list with ingredient aggregation and limits
- Metric units only (grams, ml, whole items)
- Comprehensive unit conversion system (70+ ingredients)
- Shopping list grouped by category (produce, meat, dairy, pantry)
- Budget estimation
- Export raw AI output for debugging

### ✅ Slice 3: Recipe Library & Profile Management

**Onboarding System:**
- AI-powered conversation (natural, not form-based)
- Automatic household member extraction (creates profiles for kids, partners, etc.)
- Weekly schedule extraction (structured servings per meal)
- Visual progress feedback during profile setup
- Smart confirmation with auto-generation support

**Settings Page (4 Sections):**
- **Storage Management:** Quota monitoring, export/import backups, data cleanup
- **Household Members:** Manage family members with dietary preferences and schedules
- **Meal Planning:** Budget, shopping list limits (30 items default), shopping day, dietary goals
- **Chat Preferences:** Customize Vanessa's personality and communication style

**Recipe Library:**
- Browse all saved recipes
- Search by name, ingredients, or tags (with debounce)
- Filter: All, Favorites, High-Rated (≥4⭐), Most Cooked (≥3x)
- Recipe cards with emojis, timing, servings, ratings
- Sorting by popularity and name

**Recipe Detail:**
- Full recipe view with hero image placeholder
- Interactive 5-star rating system
- Favorite toggle (❤️/🤍)
- Usage tracking: times cooked, last cooked
- "Mark as Cooked" button
- Ingredients grouped by category
- Step-by-step instructions
- Clickable tags

**Navigation:**
- Global nav bar: Home → Meal Plan → Recipes → Shopping → Settings
- Mobile hamburger menu (responsive < 768px)
- Active link highlighting
- Sticky header

**Data Management:**
- Schema migration system (version tracking)
- Automatic data migrations on app load
- Storage utilities (CRUD for all entities)
- Standardized vanessa_ key prefix

## Technology Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), HTML, Tailwind CSS
- **Backend:** Vercel Edge Functions (serverless)
- **AI:** Claude Sonnet 4.5 via Anthropic API
- **Storage:** 
  - **Current (Slices 1-3):** localStorage (5MB limit, ~20-30 weeks)
  - **Future (Slice 4+):** Firebase Firestore (unlimited, multi-device sync)
- **Authentication:** None (single-user), Firebase Auth (Slice 4+)
- **Hosting:** Vercel
- **Build:** None (static site, direct ES modules)

## Project Structure

```
meal-planner/
├── api/                          # Vercel serverless functions
│   ├── chat-with-vanessa.js      # SSE chat + onboarding endpoint
│   ├── generate-meal-plan.js     # Meal plan generation with schedule
│   ├── check-env.js              # Environment check (dev)
│   └── test-models.js            # Model testing (dev)
├── src/
│   ├── main.js                   # App entry point + migration
│   ├── components/               # UI components
│   │   ├── HomePage.js           # Landing/meal plan summary
│   │   ├── ChatWidget.js         # Chat + onboarding (1,400+ lines)
│   │   ├── GenerationStatusPage.js # Progress UI
│   │   ├── MealPlanView.js       # Weekly view + schedule grid
│   │   ├── ShoppingListView.js   # Shopping list
│   │   ├── SettingsPage.js       # 4-section settings (1,200+ lines)
│   │   ├── RecipeLibraryPage.js  # Recipe browsing + search
│   │   ├── RecipeDetailPage.js   # Recipe detail + ratings
│   │   └── Navigation.js         # Global nav + mobile menu
│   ├── utils/                    # Utilities
│   │   ├── router.js             # Parameterized routing
│   │   ├── storage.js            # localStorage + CRUD (1,000+ lines)
│   │   ├── mealPlanTransformer.js # Data transformation + schedule mapping
│   │   ├── unitConversions.js    # Unit conversion (70+ ingredients)
│   │   ├── errorHandler.js       # Error handling
│   │   └── migrationManager.js   # Schema migrations
│   ├── migrations/               # Data migrations
│   │   └── index.js              # Migration definitions
│   └── styles/
│       └── main.css              # Custom styles
├── index.html                    # App shell
├── package.json                  # Dependencies
├── vercel.json                   # Vercel configuration
└── .taskmaster/
    └── docs/
        └── prd.txt               # **Main specification document**
```

## Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- Anthropic API key (get from https://console.anthropic.com)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   cd /path/to/meal-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   - Go to Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` for Production, Preview, and Development

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `#/` | Home | Landing page or meal plan summary |
| `#/generating` | Generation Status | Progress during meal plan creation |
| `#/meal-plan` | Meal Plan View | Full week with schedule grid + recipes |
| `#/recipes` | Recipe Library | Browse, search, filter recipes |
| `#/recipe/:id` | Recipe Detail | View recipe, rate, favorite, mark cooked |
| `#/shopping-list` | Shopping List | Aggregated ingredients by category |
| `#/settings` | Settings | 4 sections: Storage, Household, Meal Planning, Chat |

## Data Model

### localStorage Keys (Standardized with vanessa_ prefix)
- `vanessa_chat_history` - Chat conversation messages
- `vanessa_recipes` - Recipe library with ratings/favorites
- `vanessa_meals` - Meal instances with eaterIds
- `vanessa_current_meal_plan` - Active week's meal plan
- `vanessa_eaters` - Household member profiles
- `vanessa_base_specification` - User profile + weekly schedule
- `vanessa_debug_raw_output` - Raw AI response (debugging)
- `vanessa_schema_version` - Migration version tracker
- `vanessa_migration_slice3` - Migration completion flag

### Core Entities

**Recipe (Enhanced in Slice 3):**
```javascript
{
  recipeId: 'recipe_[uuid]',
  name: 'Herb-Crusted Salmon',
  ingredients: [
    { name: 'salmon fillet', quantity: 150, unit: 'g', category: 'meat' }
  ],
  instructions: '...',
  prepTime: 15,
  cookTime: 20,
  servings: 2,
  tags: ['quick', 'healthy'],
  source: 'generated',
  isFavorite: boolean,        // NEW
  rating: number | null,      // NEW: 1-5 stars
  timesCooked: number,        // NEW: Usage tracking
  lastCooked: string | null,  // NEW: ISO 8601
  createdAt: '2025-12-20T...',
  updatedAt: '2025-12-26T...' // NEW
}
```

**Meal (Enhanced in Slice 3):**
```javascript
{
  mealId: 'meal_[uuid]',
  recipeId: 'recipe_[uuid]',
  mealType: 'breakfast' | 'lunch' | 'dinner',
  date: 'YYYY-MM-DD',
  eaterIds: ['eater_[uuid]'],  // NEW: Who's eating
  servings: 2,
  notes: string
}
```

**MealPlan:**
```javascript
{
  _schemaVersion: 1,
  mealPlanId: 'plan_YYYYMMDD',
  weekOf: 'YYYY-MM-DD',
  weekEnd: 'YYYY-MM-DD',
  createdAt: 'ISO 8601',
  mealIds: ['meal_...', ...],  // 21 meals
  budget: { target: 150, estimated: 142 },
  weeklyPreferences: string,
  conversation: { messages: [] }
}
```

**Eater (NEW: Slice 3):**
```javascript
{
  eaterId: 'eater_[uuid]',
  name: 'Maya',
  preferences: 'Likes simple foods',
  allergies: [],
  dietaryRestrictions: [],
  schedule: 'Sunday afternoon - Wednesday morning',
  isDefault: false,
  createdAt: '2025-12-26T...',
  updatedAt: '2025-12-26T...'
}
```

**BaseSpecification (NEW: Slice 3):**
```javascript
{
  _schemaVersion: 1,
  ownerEaterId: 'eater_[uuid]',
  weeklyBudget: 120,
  maxShoppingListItems: 30,    // NEW: Ingredient limit
  shoppingDay: 6,              // 0=Sunday, 6=Saturday
  preferredStore: 'Coles',
  householdEaterIds: ['eater_[uuid]'],
  dietaryGoals: 'Lose weight, anti-inflammatory',
  onboardingComplete: true,
  weeklySchedule: {            // NEW: Structured schedule
    tuesday: {
      dinner: {
        servings: 3,
        eaterIds: ['eater_1', 'eater_2', 'eater_3'],
        requirements: ['family-dinner', 'kid-friendly']
      }
    }
    // ... other days/meals
  },
  chatPreferences: {
    personality: 'friendly',
    communicationStyle: 'detailed'
  },
  conversation: { startedAt: '...', messages: [] },
  createdAt: '2025-12-26T...',
  updatedAt: '2025-12-26T...'
}
```

## Development Approach

This project follows a **vertical slice methodology**:

1. Build complete end-to-end flows one at a time
2. Test and validate each slice
3. Conduct reality check and document learnings
4. Update specifications based on real implementation
5. Move to next slice

**Current Status:**
- ✅ Slice 1: Chat with Vanessa (Complete)
- ✅ Slice 2: Meal Plan Generation (Complete)
- ✅ Slice 3: Recipe Library & Profile Management (Complete)
- 📝 Slice 4: Polish & Extended Features (Planned)

**Methodology Benefits:**
- Build working features incrementally
- Learn from reality, not theory
- Spec evolves based on implementation
- Each slice is testable end-to-end

See `.taskmaster/docs/prd.txt` for complete specifications and Reality Check learnings.

## API Endpoints

### POST /api/chat-with-vanessa
Streams chat responses from Vanessa using SSE. Supports onboarding mode.

**Request:**
```json
{
  "message": "string",
  "chatHistory": [{"role": "user|assistant", "content": "string"}],
  "isOnboarding": boolean,     // Optional: onboarding mode
  "onboardingStep": number      // Optional: current question (0-4)
}
```

**Response:** SSE stream
```
data: {"type": "token", "content": "text"}
data: {"type": "done"}
```

**Special Markers:**
- `[ACTION:GENERATE_WEEK]` - Triggers auto-generation when detected

### POST /api/generate-meal-plan
Generates a complete 7-day meal plan with progress updates and schedule support.

**Request:**
```json
{
  "chatHistory": [...],
  "eaters": [
    {
      "name": "You",
      "preferences": "...",
      "allergies": [],
      "dietaryRestrictions": [],
      "schedule": "..."
    }
  ],
  "baseSpecification": {
    "weeklySchedule": {           // Optional: explicit schedule
      "tuesday": {
        "dinner": {
          "servings": 3,
          "eaterIds": ["..."],
          "requirements": ["family-dinner"]
        }
      }
    },
    "maxShoppingListItems": 30,   // Optional: ingredient limit
    "weeklyBudget": 120
  }
}
```

**Response:** SSE stream
```
data: {"type": "progress", "progress": 25, "message": "Planning week..."}
data: {"type": "complete", "data": {...}}
```

**Schedule Processing:**
- Maps day names → actual dates
- Sends explicit servings per date/meal to Claude
- Ensures accurate serving sizes

## Storage & Data Management

### Current Approach (Slices 1-3)
- **localStorage**: 5MB browser storage (~20-30 weeks capacity)
- **Single device**: No multi-device sync
- **Offline-first**: All data available offline
- **Zero cost**: No database hosting fees

### Slice 3 Storage Enhancements
- ✅ **Quota monitoring**: Shows storage usage (X MB / 5 MB)
- ✅ **Export/Import**: Backup to JSON file, restore from file
- ✅ **Data cleanup**: Delete old meal plans to free space
- ✅ **Warning system**: Alert at 80% capacity

### Future Migration (Slice 4+)
- **Firebase Firestore**: When usage metering or multi-device sync needed
- **Migration effort**: 1-2 days (storage abstraction layer makes it easy)
- **Zero feature loss**: All current functionality preserved

## Known Limitations

- Single device only (no sync across phone/desktop) - *Fixed in Slice 4*
- 5MB storage limit (~20-30 weeks) - *Monitored with warnings*
- Manual backup/restore (export/import available) - *Auto-backup in Slice 4*
- Single user (no authentication) - *Multi-user in Slice 4*
- Cannot modify generated plans (must regenerate entire week) - *Slice 4*
- Single active meal plan (no history) - *Multiple weeks in Slice 4*
- Metric units only (Australian market)
- Week starts Saturday (hardcoded for shopping preference)

## Future Enhancements (Slice 4+)

- ✅ ~~Eater management~~ (Complete in Slice 3)
- ✅ ~~Recipe library with search and favorites~~ (Complete in Slice 3)
- ✅ ~~Recipe ratings and usage tracking~~ (Complete in Slice 3)
- ✅ ~~User preferences and settings~~ (Complete in Slice 3)
- Add recipe flow (manual recipe creation)
- Edit/modify generated plans
- Multiple week storage with history
- Usage metering and limits
- Firebase backend with authentication
- Multi-device sync
- Offline mode enhancements

## Contributing

This is a personal project following a structured development methodology. See the Cursor Rules in the project for development guidelines.

## License

Private project - not licensed for redistribution.

---

## 🎉 Slice 3 Completion Summary

**Completed:** December 26, 2025

**What Was Built:**
- 6 new components (3,500+ lines of code)
- 4-section Settings page
- AI-powered onboarding with extraction
- Recipe library and detail pages
- Global navigation system
- Data migration infrastructure
- Storage management utilities
- Household schedule grid
- Shopping list limits

**All 11 Taskmaster tasks completed:** 45/45 subtasks done

---

**Last Updated:** December 26, 2025  
**Documentation:** See `.taskmaster/docs/prd.txt` for detailed specifications and Reality Check learnings
