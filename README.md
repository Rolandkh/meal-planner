# Vanessa - AI Meal Planning Concierge

**Version:** v0.8 (Slices 1 & 2 Complete)  
**Status:** Production-ready MVP  
**Created:** December 2025

---

## Overview

Vanessa is an AI-powered meal planning assistant that helps you:
- 💬 Chat about your meal planning needs and preferences
- ✨ Generate complete 7-day meal plans (breakfast, lunch, dinner)
- 🛒 Get organized shopping lists with metric units
- 📖 View detailed recipes with ingredients and instructions
- 💰 Track your weekly food budget

## Current Features (Slices 1 & 2)

### ✅ Slice 1: Chat with Vanessa
- Collapsible chat widget accessible from anywhere
- Real-time streaming responses using Server-Sent Events (SSE)
- Conversation history persists across sessions
- Mobile-responsive (full-screen on mobile, side panel on desktop)
- Auto-resizing textarea for comfortable typing

### ✅ Slice 2: Meal Plan Generation
- Generate complete 7-day meal plans with one click
- Real-time progress updates during generation (10% → 100%)
- 21 meals per week (breakfast, lunch, dinner × 7 days)
- Automatic recipe deduplication (same recipe used multiple days)
- Shopping list with ingredient aggregation
- Metric units only (grams, ml, whole items)
- Comprehensive unit conversion system (70+ ingredients)
- Shopping list grouped by category (produce, meat, dairy, pantry)
- Budget estimation
- Export raw AI output for debugging

## Technology Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), HTML, Tailwind CSS
- **Backend:** Vercel Edge Functions (serverless)
- **AI:** Claude Sonnet 4.5 via Anthropic API
- **Storage:** localStorage (Phase 1)
- **Hosting:** Vercel
- **Build:** None (static site, direct ES modules)

## Project Structure

```
meal-planner/
├── api/                          # Vercel serverless functions
│   ├── chat-with-vanessa.js      # SSE chat endpoint
│   ├── generate-meal-plan.js     # Meal plan generation
│   ├── check-env.js              # Environment check (dev)
│   └── test-models.js            # Model testing (dev)
├── src/
│   ├── main.js                   # App entry point
│   ├── components/               # UI components
│   │   ├── HomePage.js           # Landing/meal plan summary
│   │   ├── ChatWidget.js         # Chat interface
│   │   ├── GenerationStatusPage.js # Progress UI
│   │   ├── MealPlanView.js       # Weekly meal view
│   │   └── ShoppingListView.js   # Shopping list
│   ├── utils/                    # Utilities
│   │   ├── router.js             # Hash-based routing
│   │   ├── storage.js            # localStorage wrapper
│   │   ├── mealPlanTransformer.js # Data transformation
│   │   ├── unitConversions.js    # Unit conversion system
│   │   └── errorHandler.js       # Error handling
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
| `#/meal-plan` | Meal Plan View | Full week with all recipes |
| `#/shopping-list` | Shopping List | Aggregated ingredients by category |

## Data Model

### localStorage Keys
- `vanessa-chat-history` - Chat conversation messages
- `recipes` - Recipe library (unique recipes)
- `meals` - Meal instances (21 per week)
- `currentMealPlan` - Active week's meal plan
- `debug_raw_ai_output` - Raw AI response (debugging)

### Core Entities

**Recipe:**
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
  rating: null,
  createdAt: '2025-12-20T...'
}
```

**Meal:**
```javascript
{
  mealId: 'meal_[uuid]',
  recipeId: 'recipe_[uuid]',
  mealType: 'breakfast' | 'lunch' | 'dinner',
  date: 'YYYY-MM-DD',
  servings: 2
}
```

**MealPlan:**
```javascript
{
  mealPlanId: 'plan_YYYYMMDD',
  weekOf: 'YYYY-MM-DD',
  weekEnd: 'YYYY-MM-DD',
  mealIds: ['meal_...', ...],  // 21 meals
  budget: { target: 150, estimated: 142 }
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
- ✅ Slice 1: Chat with Vanessa
- ✅ Slice 2: Meal Plan Generation
- 📝 Slice 3: Recipe Library & Eater Management (planned)

See `.taskmaster/docs/prd.txt` for complete specifications and learnings.

## API Endpoints

### POST /api/chat-with-vanessa
Streams chat responses from Vanessa using SSE.

**Request:**
```json
{
  "message": "string",
  "chatHistory": [{"role": "user|assistant", "content": "string"}]
}
```

**Response:** SSE stream
```
data: {"type": "token", "content": "text"}
data: {"type": "done"}
```

### POST /api/generate-meal-plan
Generates a complete 7-day meal plan with progress updates.

**Request:**
```json
{
  "chatHistory": [...],
  "eaters": [{"name": "User", "preferences": "...", "schedule": "..."}]
}
```

**Response:** SSE stream
```
data: {"type": "progress", "progress": 25, "message": "Planning week..."}
data: {"type": "complete", "data": {...}}
```

## Known Limitations

- localStorage only (5MB limit, ~20-30 weeks of plans)
- Single user (no authentication)
- Cannot modify generated plans (must regenerate entire week)
- Metric units only (Australian market)
- Week starts Saturday (hardcoded)

## Future Enhancements (Slice 3+)

- Eater management (household members with preferences)
- Recipe library with search and favorites
- Recipe ratings and usage tracking
- Edit/modify generated plans
- Multiple week storage
- User preferences and settings
- Firebase backend with authentication

## Contributing

This is a personal project following a structured development methodology. See the Cursor Rules in the project for development guidelines.

## License

Private project - not licensed for redistribution.

---

**Last Updated:** December 20, 2025  
**Documentation:** See `.taskmaster/docs/prd.txt` for detailed specifications
