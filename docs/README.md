# Vanessa - AI Meal Planning Assistant

**Version:** v1.2.1-alpha  
**Status:** Active Development (Slice 5.1 - Multi-Profile Support)  
**Last Updated:** January 10, 2026 (Evening)

---

## Quick Start

### Run Locally
```bash
npm install
vercel dev
# Open http://localhost:3000
```

### Environment Setup
Create `.env`:
```bash
ANTHROPIC_API_KEY=your_key_here
SPOONACULAR_API_KEY=optional_for_catalog_extraction
```

---

## Current Features

### ✅ Working Features

**Slice 1: Chat with Vanessa**
- Real-time streaming chat with Claude AI
- Conversation persistence
- Collapsible chat widget

**Slice 2: Meal Plan Generation**
- AI-generated 7-day meal plans
- Real-time progress streaming
- Shopping list with ingredient aggregation
- Budget tracking

**Slice 3: Recipe Library & Settings**
- Browse 494+ professional recipes
- Search and filter by cuisine, diet, protein
- Recipe ratings and favorites
- Household management (eaters, schedules)
- Settings (4 sections)

**Slice 4: Advanced Features**
- Recipe editing with auto-save
- Single-day regeneration (without losing week)
- Meal plan history (archive past plans)
- Recipe import from text (AI extraction)

**Slice 5 Phase 1: Catalog & Health System**
- 494 professional recipes from Spoonacular
- Diet Compass health scoring (4 metrics)
- 11 diet profiles (Mediterranean, Keto, Vegan, etc.)
- Catalog-first meal generation (40-70% catalog usage)
- 26 cuisines, 15 protein types
- 34 breakfasts, 18 curries, 11 stir-fries

**Slice 5.1: Multi-Profile & Child Portions** ⭐NEW
- Multi-profile meal generation (conflicting diets = separate recipes)
- Child portion multipliers (accurate serving sizes by age)
- Shopping list scaling bug fix (eliminated 60% overcounting)

### ⏳ In Development

**Slice 5 Phase 2: UI Updates**
- Multi-profile meal display (show which recipe for which eater)
- Enhanced onboarding (automatic child age detection)
- Recipe variations (parent/child relationships)
- Meal prep planning

---

## Recipe Catalog Stats

### Current State (v2.0)
- **494 recipes** with complete data
- **835 images** (22MB, high-res 636x393)
- **100% data complete**: ingredients, instructions, nutrition
- **Lightweight index**: 326KB (84.5% smaller than full catalog)

### Coverage
- **26 cuisines**: Mediterranean, Italian, Thai, Indian, Chinese, Japanese, Korean, Vietnamese, Mexican, Greek, French, Spanish, Middle Eastern, etc.
- **15 protein types**: chicken, salmon, tofu, lentils, chickpeas, beef, pork, shrimp, eggs, turkey, lamb, tuna, white-fish, black-beans, tempeh
- **34 breakfasts** ready to use
- **18 curries**, 11 stir-fries, 32 soups, 27 salads
- **27 dish types** total

### How It Works
1. **Catalog loads** from file into localStorage on app boot
2. **Recipe index** (lightweight) loads for meal generation
3. **Claude receives** only the 326KB index (not 2.1MB catalog)
4. **Token savings**: 84.5% reduction in prompt size
5. **Auto-updates**: Index rebuilds when recipes change

---

## Architecture

**Frontend:** Vanilla JavaScript (no build step)  
**Backend:** Vercel Edge Functions  
**Storage:** localStorage → Firebase (planned)  
**AI:** Claude Sonnet 4.5

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

---

## Development

### Key Scripts
```bash
# Extract more recipes from Spoonacular
node scripts/extractSpoonacularCatalog.js

# Rebuild recipe index from catalog
node scripts/buildRecipeIndex.js

# Run health scoring on catalog
node scripts/scoreCatalog.js

# Test catalog loading
open test-catalog-loading.html
```

### File Structure
```
src/
  ├── components/      # UI components (18 files)
  ├── utils/           # Utilities (20 files)
  ├── data/            # Static data
  │   ├── vanessa_recipe_catalog.json  (2.1MB, 494 recipes)
  │   ├── recipe_index.json            (326KB, lightweight)
  │   ├── dietProfiles.json
  │   └── ingredientHealthData.json
  └── main.js          # App entry point

api/
  ├── chat-with-vanessa.js
  ├── generate-meal-plan.js
  └── extract-recipe.js

docs/
  ├── README.md          # This file
  ├── ARCHITECTURE.md    # Technical decisions
  ├── FEATURES.md        # Feature documentation
  ├── DEVELOPMENT.md     # Setup & deployment
  └── CHANGELOG.md       # Version history
```

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical decisions, patterns, performance
- **[FEATURES.md](./FEATURES.md)** - User-facing feature documentation
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Setup, testing, deployment
- **[CHANGELOG.md](./CHANGELOG.md)** - Detailed version history

---

## Project Status

### Completion by Slice
- ✅ Slice 1: Chat (100%)
- ✅ Slice 2: Meal Generation (100%)
- ✅ Slice 3: Library & Settings (100%)
- ✅ Slice 4: Advanced Features (100%)
- ⏳ Slice 5 Phase 1: Catalog & Health (100%)
- ⏳ Slice 5 Phase 2: UI Integration (40%)

### Current Focus
- Recipe catalog expansion (174 → 494 recipes ✅)
- Lightweight index system ✅
- Integration with meal generation ✅
- Next: Settings UI for diet profiles

---

## Performance

- **Initial load:** <2s (includes 494-recipe catalog)
- **Meal generation:** 3-8s (streaming)
- **Recipe search:** <100ms
- **localStorage usage:** ~3-4MB / 5MB limit

---

## Cost

- **Development:** ~$1-2 (Taskmaster + testing)
- **Spoonacular:** One-time extraction only (~$29 for Cook tier, then cancel)
- **Monthly:** ~$5-10 (Anthropic API only)
- **Per meal plan:** ~$0.02-0.05 (with catalog optimization)

---

## Known Issues

- [ ] Need to run health scoring on new 320 recipes
- [ ] Some images may not display (CDN path issues)
- [ ] Average health scores conservative due to limited ingredient database
- [ ] Some Spoonacular searches returned 0 results (API limitations)

---

## Contributing

This is a personal project following the Vertical Slice development methodology. See `.cursor/rules/` for development guidelines.

---

**Questions?** Check the [DEVELOPMENT.md](./DEVELOPMENT.md) guide or review session notes in `docs/sessions/`.
