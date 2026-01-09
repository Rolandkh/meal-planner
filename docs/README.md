# Vanessa - AI Meal Planning Concierge

**Version:** v1.1-alpha (Slice 5 - Catalog System)  
**Status:** Active Development  
**Created:** December 2025

---

## Overview

Vanessa is an AI-powered meal planning assistant that helps you create personalized weekly meal plans with:

- 💬 **Conversational AI** - Chat with Vanessa about your needs
- 👥 **Household Management** - Multiple members with unique dietary needs
- ✨ **Smart Generation** - 7-day meal plans with accurate servings
- 📚 **Recipe Catalog** - 607 professional recipes with health scores
- 🏥 **Health Intelligence** - Diet Compass scoring system
- 🛒 **Shopping Lists** - Organized by category with ingredient limits
- 📖 **Recipe Library** - Browse, search, rate, and save favorites

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))
- Vercel account (for deployment)

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key-here" > .env.local

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Fast Testing Setup

For rapid testing without going through onboarding:
1. Open the app
2. Scroll to bottom of home page
3. Click "🔧 Import Dev Preset"
4. Instantly have a complete household setup with meal plan!

### Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings → Environment Variables → Add ANTHROPIC_API_KEY
```

## Key Features

### ✅ Current Features

- **Chat Interface** - Collapsible widget, streaming responses, conversation history
- **Onboarding** - AI-powered 5-question setup extracting household members
- **Meal Plan Generation** - Complete 7-day plans with progress tracking
- **Recipe Catalog** - 607 recipes with health scores, local images (11MB)
- **Health Scoring** - 4-metric Diet Compass system (Nutrient Density, Anti-Aging, Weight Loss, Heart Health)
- **Recipe Management** - Edit, import from text, rate, favorite, track usage
- **Single Day Regeneration** - Replace any day without losing the week
- **Meal Plan History** - Browse past plans with configurable retention
- **Settings** - Storage management, household members, meal planning preferences
- **Shopping Lists** - Grouped by category, ingredient limits, budget tracking

### 🚧 In Progress (Slice 5 Phase 2)

- Settings UI for diet profiles
- Prep planning system
- Recipe variations
- Multi-profile meal generation

### 📋 Planned Features

See [FEATURES.md](./FEATURES.md) for complete feature documentation.

## Technology Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), HTML, Tailwind CSS
- **Backend:** Vercel Edge Functions (serverless)
- **AI:** Claude Sonnet 4.5 via Anthropic API
- **Storage:** localStorage (5MB, single-device) → Firebase Firestore (future)
- **Hosting:** Vercel
- **Build:** None (static site, direct ES modules)

## Project Structure

```
meal-planner/
├── docs/                     # 📚 All documentation (you are here)
│   ├── README.md            # Project overview
│   ├── ARCHITECTURE.md      # Technical decisions
│   ├── DEVELOPMENT.md       # Developer guide
│   ├── FEATURES.md          # Feature documentation
│   ├── CHANGELOG.md         # Version history
│   └── sessions/            # Ephemeral session notes (auto-delete)
├── api/                      # Vercel serverless functions
├── src/
│   ├── main.js              # App entry point
│   ├── components/          # UI components (18 files)
│   ├── utils/               # Utilities (20 files)
│   ├── data/                # JSON data files (catalog, profiles, health data)
│   └── migrations/          # Data migrations
├── index.html               # App shell
├── package.json
├── vercel.json
└── .taskmaster/             # Taskmaster project management
    ├── docs/prd.txt         # Product requirements
    └── tasks/tasks.json     # Task tracking
```

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `#/` | Home | Landing page or meal plan summary |
| `#/generating` | Generation Status | Progress during meal plan creation |
| `#/meal-plan` | Meal Plan View | Full week with schedule grid |
| `#/day/:day` | Day View | Single day view |
| `#/recipes` | Recipe Library | Browse, search, filter recipes |
| `#/recipe/:id` | Recipe Detail | View, rate, favorite, edit |
| `#/recipe/:id/edit` | Recipe Edit | Edit recipe form |
| `#/history` | History | Browse past meal plans |
| `#/history/:id` | Historical Plan | View archived plan |
| `#/shopping-list` | Shopping List | Aggregated ingredients |
| `#/settings` | Settings | 4 sections: Storage, Household, Meal Planning, Chat |

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture & decisions
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Setup, testing, deployment guide
- **[FEATURES.md](./FEATURES.md)** - Complete feature documentation
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## Development Methodology

This project follows a **vertical slice** approach:

1. Build complete end-to-end flows one at a time
2. Test and validate each slice
3. Conduct reality check and document learnings
4. Update specifications based on real implementation
5. Move to next slice

**Current Status:**
- ✅ Slice 1: Chat with Vanessa
- ✅ Slice 2: Meal Plan Generation
- ✅ Slice 3: Recipe Library & Profile Management
- ✅ Slice 4: Recipe Management & History
- 🚧 Slice 5: Health Intelligence & Recipe Catalog (Phase 1 complete)

See `.taskmaster/docs/prd.txt` for complete specifications.

## Known Limitations

- Single device only (no sync across phone/desktop) - *Will be fixed in Slice 6*
- 5MB storage limit (~20-30 weeks with auto-cleanup)
- Single user (no authentication) - *Multi-user in Slice 6*
- Metric units only (Australian market)
- Week starts Saturday (hardcoded for shopping preference)

## API Endpoints

### POST /api/chat-with-vanessa
Streams chat responses using SSE. Supports onboarding mode.

### POST /api/generate-meal-plan
Generates 7-day meal plan or single-day regeneration with progress updates.

### POST /api/extract-recipe
Extracts structured recipe data from raw text using AI.

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed API documentation.

## License

Private project - not licensed for redistribution.

---

**Last Updated:** January 9, 2026  
**Maintained By:** Roland Khayat
