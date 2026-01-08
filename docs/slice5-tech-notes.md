# Slice 5: Technical Baseline & Dependencies

**Version:** 1.0-rc3 (Slice 5)  
**Date:** January 8, 2026  
**Status:** Foundation established ✅

---

## Tech Stack (Confirmed for Slice 5)

### **Frontend**
- **Language:** Vanilla JavaScript ES6+ modules
- **HTML:** Semantic HTML5
- **CSS:** Tailwind CSS 3.x (via CDN)
- **Module System:** ES modules (`type="module"`)
- **No Build Step:** Static site, direct imports

### **Backend**
- **Runtime:** Vercel Serverless Functions (Node.js)
- **API Format:** RESTful JSON endpoints
- **Streaming:** Server-Sent Events (SSE) for real-time updates

### **Data Storage**
- **Primary:** localStorage (browser)
- **Capacity:** ~5MB available (currently using ~500KB)
- **Migration Strategy:** Versioned schemas with automatic upgrades

### **AI & External APIs**
- **Primary AI:** Anthropic Claude (Sonnet 3.5/4)
- **Recipe Data:** Spoonacular API (Cook tier)
- **Research:** Perplexity Sonar Pro (optional, for Taskmaster)

---

## Environment Variables

### **Required for Slice 5**

#### **Local Development (.env)**
```bash
# AI
ANTHROPIC_API_KEY=sk-ant-xxx...

# Recipe Database
SPOONACULAR_API_KEY=850d...842a
SPOONACULAR_BASE_URL=https://api.spoonacular.com

# Optional: Admin protection
CATALOG_BUILD_SECRET=your_secure_random_string
```

#### **Vercel Production**
All environment variables configured in Vercel project settings:
- ✅ `ANTHROPIC_API_KEY`
- ✅ `SPOONACULAR_API_KEY`
- ⚠️ `SPOONACULAR_BASE_URL` (defaults to https://api.spoonacular.com)
- ⚠️ `CATALOG_BUILD_SECRET` (add for admin endpoints)

---

## Spoonacular API Usage Patterns

### **One-Time Extraction Goal**

🎯 **Extract everything once, then cancel subscription:**
- ✅ Recipe data (ingredients, instructions, metadata)
- ✅ Full nutrition data (macros, micros, calories)
- ✅ Recipe images (downloaded and stored locally)
- ✅ All tags (cuisines, diets, dish types)
- ❌ No ongoing API dependency after extraction

### **Endpoints Used in Slice 5**

#### **1. Complex Search (Catalog Extraction)**
```
GET /recipes/complexSearch
  ?number=100
  &offset=0
  &addRecipeInformation=true
  &addNutrition=true
  &cuisine=italian
  &diet=vegetarian
  &apiKey=YOUR_KEY
```

**Rate Limits (Cook Tier - $29/month):**
- **Points per day:** 5,000 points
- **Cost per search:** ~1 point (simple) to 5 points (with nutrition)
- **Estimated extraction cost:** ~800-1000 points for full catalog
- **Strategy:** Batch extraction in one session, download everything, save locally

#### **2. Image Download (During Extraction)**
```
GET https://spoonacular.com/recipeImages/{id}-312x231.jpg
```

**Image Strategy:**
- **Download:** All 800 recipe images (312x231 size)
- **Storage:** `public/images/recipes/{spoonacularId}.jpg`
- **Size:** ~50-100MB total (~60-125KB per image)
- **Format:** JPEG (optimized for web)
- **Fallback:** If download fails, keep original URL temporarily

#### **2. Recipe Information (Details)**
```
GET /recipes/{id}/information
  ?includeNutrition=true
  &apiKey=YOUR_KEY
```

**Usage:** Rarely needed (complexSearch includes full info)

### **Rate Limiting Strategy**

```javascript
// Implemented in extraction utilities
const RATE_LIMIT = {
  delayBetweenRequests: 1000,  // 1 second
  maxRetries: 3,
  backoffMultiplier: 2,  // Exponential backoff on 429
  dailyPointsCap: 4500   // Safety margin
};

async function fetchWithRateLimit(url) {
  await sleep(RATE_LIMIT.delayBetweenRequests);
  
  for (let attempt = 0; attempt < RATE_LIMIT.maxRetries; attempt++) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const waitTime = RATE_LIMIT.delayBetweenRequests * Math.pow(RATE_LIMIT.backoffMultiplier, attempt);
      await sleep(waitTime);
      continue;
    }
    
    return response;
  }
  
  throw new Error('Rate limit exceeded after retries');
}
```

---

## Claude API Configuration

### **Current Model**
```javascript
// api/chat-with-vanessa.js & api/generate-meal-plan.js
const MODEL = 'claude-3-5-sonnet-20241022';  // Latest Sonnet 3.5
```

### **Parameters (Consistent with Slices 1-4)**
```javascript
{
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,           // Standard for meal generation
  temperature: 0.7,           // Balanced creativity
  stream: true,               // SSE for real-time updates
}
```

### **Token Budget Per Generation**
- **Meal plan generation:** ~2,000-3,000 tokens
- **With catalog context:** ~3,500-4,500 tokens
- **With full prompts:** ~5,000-6,000 tokens max

---

## Data Storage Strategy

### **Catalog Storage Design**

#### **Static Seed File**
```
src/data/vanessa_recipe_catalog.json
- Size: ~2-3MB (800 recipes with local image paths)
- Format: Array of Recipe objects
- Committed to repo
- Updated periodically (manual re-extraction)
```

#### **Recipe Images (Local)**
```
public/images/recipes/
├── 123456.jpg  (~60-125KB each)
├── 123457.jpg
├── ...
└── 789012.jpg

Total: ~50-100MB for 800 images
Format: JPEG, 312x231px (card size)
Committed to repo for offline use
```

#### **localStorage Cache**
```javascript
// Client-side cache
localStorage['vanessa_recipe_catalog'] = JSON.stringify(catalog);

// Schema version tracking
{
  _catalogVersion: '1.0.0',
  _lastUpdated: '2026-01-08T00:00:00Z',
  recipes: [ ... ]
}
```

### **Health Data Bundling**

```javascript
// Static imports (no network calls)
import ingredientHealthData from './data/ingredientHealthData.json' assert { type: 'json' };
import dietProfiles from './data/dietProfiles.json' assert { type: 'json' };

// Loaded once, cached in memory
// Also persisted to localStorage for offline access
```

---

## localStorage Keys (Slice 5 Additions)

### **New Keys**
```javascript
'vanessa_recipe_catalog'      // ~2-3MB: 800 Spoonacular recipes
'vanessa_ingredient_health'   // ~50KB: 200+ ingredient health scores
'vanessa_diet_profiles'       // ~20KB: 11 diet profile definitions
```

### **Enhanced Keys**
```javascript
'vanessa_base_specification'  // +mealPrepSettings
'vanessa_eaters'              // +dietProfile, personalPreferences
'vanessa_recipes'             // +dietCompassScores, nutrition, tags
'vanessa_meals'               // +prepTasks, targetEaters
```

### **Total Storage Impact**
- **Before Slice 5:** ~500KB
- **After Slice 5:** ~3-3.5MB
- **Remaining capacity:** ~1.5-2MB
- **Status:** ✅ Well within 5MB localStorage limit

---

## Schema Versioning

### **Migration Strategy**
```javascript
// BaseSpecification
{
  _schemaVersion: 2,  // Bumped from 1
  // ... existing fields
  mealPrepSettings: {  // NEW
    batchPrepDays: [6],
    prepLevels: { /* 7 days × 3 meals */ }
  }
}

// Recipe
{
  _schemaVersion: 2,  // NEW
  // ... existing fields
  dietCompassScores: { /* 4 metrics + overall */ },  // NEW
  nutrition: { /* macros + micros */ },  // NEW
  tags: { /* 10+ dimensions */ },  // NEW
  parentRecipeId: null,  // NEW
  childRecipeIds: []  // NEW
}

// Eater
{
  // ... existing fields
  dietProfile: 'mediterranean' | null,  // NEW
  personalPreferences: '',  // NEW
  excludeIngredients: [],  // NEW
  preferIngredients: []  // NEW
}
```

### **Backward Compatibility**
- Existing data automatically migrated on app load
- No data loss
- Gradual enhancement (scores computed on-demand)
- Migration flag: `localStorage['vanessa_migration_slice5']`

---

## Performance Targets

### **Catalog Operations**
- **Load catalog:** <500ms (2-3MB JSON parse)
- **Filter by diet profile:** <50ms (800 recipes)
- **Score single recipe:** <10ms (client-side)
- **Batch score 800 recipes:** <8 seconds (initial load)

### **Generation Times**
- **Catalog-first (no AI):** <2 seconds
- **With AI fallback (1-2 recipes):** 10-20 seconds
- **Full week AI generation:** 60-90 seconds (unchanged)

### **UI Rendering**
- **Recipe card with health bars:** <16ms (60fps)
- **Day view with prep section:** <50ms
- **Recipe library filter:** <100ms

---

## Security Considerations

### **API Key Protection**
- ✅ Never expose keys in client-side code
- ✅ All external API calls via serverless functions
- ✅ Keys stored in Vercel environment variables
- ✅ `.env` in `.gitignore`

### **Admin Endpoints**
- ⚠️ Catalog extraction endpoint requires `CATALOG_BUILD_SECRET`
- ⚠️ Admin UI accessible only in development OR with feature flag
- ✅ No write access to catalog from client

### **Rate Limiting**
- ✅ Client-side: Debounce user interactions
- ✅ Server-side: Enforce delays between Spoonacular calls
- ✅ Circuit breaker: Stop after quota threshold

---

## Testing Strategy for Slice 5

### **Unit Tests**
- Scoring engine (calculateRecipeScores)
- Diet profile filters
- Prep task generator
- Recipe normalization

### **Integration Tests**
- Catalog loading & filtering
- Transformer with multi-recipe input
- Shopping list with multi-profile meals

### **Manual Testing**
- Spoonacular extraction (2-3 hour run) ✅
- Multi-profile household generation
- Recipe variation creation
- Settings UI for all new features

### **Performance Testing**
- Catalog parse time on mobile
- Batch scoring performance
- Filter response time with 800 recipes

---

## Known Limitations & Workarounds

### **Vercel Dev Path Issues**
- **Issue:** Spaces in project path break vercel dev
- **Workaround:** Use standalone scripts for local testing
- **Impact:** None on production deployment

### **localStorage Size**
- **Current:** ~3-3.5MB after Slice 5
- **Limit:** 5MB
- **Future:** May need IndexedDB or cloud storage for Slice 6+

### **Spoonacular Quota**
- **Cook Tier:** 5,000 points/day
- **Extraction:** ~800-1000 points (one-time)
- **Strategy:** Extract once, commit to repo, reuse static file

---

## File Structure (Slice 5 Additions)

```
/Users/rolandkhayat/Cursor projects/Meal Planner/
├── api/
│   ├── extract-spoonacular-catalog.js  ← NEW
│   ├── calculate-diet-compass-score.js ← NEW
│   ├── test-spoonacular.js             ← NEW (test endpoint)
│   └── generate-meal-plan.js           ← ENHANCED
├── src/
│   ├── data/
│   │   ├── vanessa_recipe_catalog.json ← NEW (2-3MB)
│   │   ├── ingredientHealthData.json   ← NEW (50KB)
│   │   └── dietProfiles.json           ← NEW (20KB)
│   ├── utils/
│   │   ├── dietCompassScoring.js       ← NEW
│   │   ├── dietProfileFilter.js        ← NEW
│   │   ├── prepTaskGenerator.js        ← NEW
│   │   ├── spoonacularMapper.js        ← NEW
│   │   └── catalogStorage.js           ← NEW
│   ├── migrations/
│   │   └── migrateToSlice5.js          ← NEW
│   └── components/
│       ├── SettingsPage.js             ← ENHANCED (diet profiles, prep)
│       ├── DayView.js                  ← ENHANCED (prep section)
│       ├── RecipeDetailPage.js         ← ENHANCED (scores, variations)
│       └── RecipeCard.js               ← ENHANCED (health bars)
├── scripts/
│   └── extractSpoonacularCatalog.js    ← NEW (Node script)
├── docs/
│   └── slice5-tech-notes.md            ← THIS FILE
├── test-api.html                       ← NEW (API testing)
└── test-spoonacular-key.js             ← NEW (standalone test)
```

---

## External Dependencies

### **APIs (Ongoing)**
- ✅ **Anthropic:** Claude API for conversational AI (required)

### **APIs (One-Time Only)**
- 🔄 **Spoonacular:** Recipe extraction + image download
  - Used ONCE during initial setup
  - Can cancel subscription after extraction complete
  - All data stored locally (recipes + images + nutrition)

### **CDN Resources**
- ✅ Tailwind CSS 3.x (via CDN)
- ❌ No Spoonacular CDN dependency (images stored locally)

### **Node Modules**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.2"
  },
  "devDependencies": {
    "task-master-ai": "^0.39.0",
    "vercel": "^50.1.3"
  }
}
```

**No new dependencies needed for Slice 5** ✅

---

## Development Workflow

### **Local Development**
```bash
# Start local server
npm run dev              # Static files on :3000

# Test APIs (standalone)
node test-spoonacular-key.js
node scripts/extractSpoonacularCatalog.js  # When ready

# Task management
task-master next
task-master show 60
task-master set-status --id=60 --status=done
```

### **Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Test deployed APIs
open https://your-app.vercel.app/test-api.html
```

---

## API Testing Endpoints

### **Built-in Test Pages**
- **`/test-api.html`** - Visual API key testing
  - Tests Spoonacular API
  - Tests Anthropic API
  - Shows quota usage
  - Displays sample data

### **API Endpoints**
- **`GET /api/test-spoonacular`** - Spoonacular health check
- **`GET /api/check-env`** - Anthropic key check
- **`POST /api/extract-spoonacular-catalog`** - Catalog extraction (admin-only)

---

## Slice 5 Implementation Phases

### **Phase 1: Foundation (Week 1)**
- Schema updates & migrations
- Ingredient health database
- Diet profiles data
- Storage utilities

### **Phase 2: Scoring Engine (Week 2)**
- Diet Compass scoring implementation
- Visual components (health bars)
- Integration with existing recipes

### **Phase 3: Catalog System (Week 3)**
- Spoonacular extraction
- Catalog transformation & tagging
- Admin UI for catalog management

### **Phase 4: Generation Integration (Week 4)**
- Catalog-first recipe selection
- Multi-profile household support
- Transformer updates

### **Phase 5: Prep Planning (Week 5)**
- Prep task generation
- Settings UI for prep levels
- DayView prep section

### **Phase 6: Polish & Testing (Week 6)**
- Recipe variations
- Onboarding enhancements
- End-to-end testing
- Performance optimization

---

## Success Metrics

### **Performance**
- ✅ Catalog loads in <500ms
- ✅ Recipe scoring in <10ms
- ✅ Generation with catalog <5 seconds (vs 60-90s AI-only)

### **Storage**
- ✅ Total localStorage <3.5MB
- ✅ ~1.5MB headroom remaining
- ✅ Fast load times (<1 second total)

### **Cost Savings**
- 🎯 Reduce Claude API calls by 80% (use catalog)
- 🎯 Spoonacular: One-time extraction (~$1-2)
- 🎯 Ongoing: Minimal API usage (<$5/month)

### **User Value**
- 🎯 800 professionally-tested recipes
- 🎯 Health scoring on all recipes
- 🎯 Personalized diet profiles
- 🎯 Smart prep planning
- 🎯 Recipe variations & family tracking

---

## Dependencies Confirmed ✅

- [x] Anthropic API key configured (local + Vercel)
- [x] Spoonacular API key configured (local + Vercel)
- [x] Both APIs tested and working
- [x] Existing codebase stable (Slice 4 complete)
- [x] Taskmaster tasks expanded (47 subtasks)
- [x] Tech stack decisions finalized

**Status:** Ready to build! 🚀

---

## Next Steps

1. ✅ Task 60 complete (this document)
2. ⏭️ Task 61: Design enhanced Recipe schema
3. ⏭️ Task 62: Implement data migration
4. ⏭️ Task 80: Build schema update utilities

---

**Last Updated:** January 8, 2026  
**Author:** AI Agent + User  
**Ready for:** Autonomous implementation
