# Architecture & Technical Decisions

This document explains the key architectural decisions, design patterns, and technical implementation details for Vanessa.

---

## Core Architecture

### Tech Stack Rationale

**Frontend: Vanilla JavaScript**
- **Why:** Zero build step, fast iteration, small bundle size
- **Tradeoff:** Manual DOM management vs React's abstraction
- **Result:** ~18,000 lines of highly maintainable code

**Backend: Vercel Serverless Functions**
- **Why:** Zero DevOps, auto-scaling, pay-per-use
- **Pattern:** Thin API layer, logic in frontend
- **Cost:** ~$0-5/month for typical usage

**Storage: localStorage → Firebase (planned)**
- **Phase 1:** localStorage (5MB limit, single device)
- **Why:** Zero cost, offline-first, instant setup
- **Phase 2:** Firebase Firestore (unlimited, multi-device sync)
- **Migration:** Abstraction layer makes it 1-2 day effort

### Component Architecture

**Pattern:** Component-based with explicit state management

```javascript
class ComponentName {
  constructor() {
    this.state = { /* mutable state */ };
    this.render();
  }
  
  render() {
    return /* HTML template */;
  }
  
  attachListeners() {
    // Event handlers
  }
}
```

**Benefits:**
- Clear ownership of state
- Easy to understand data flow
- No magic framework behavior
- Debuggable with simple console.logs

---

## Data Model

### Schema Evolution

**v1.0 (Slices 1-4):**
- Basic recipe/meal/eater models
- Flat structure

**v2.0 (Slice 5):**
- Added health scoring
- Added diet profiles
- Added prep planning metadata
- Added recipe relationships (parent/child)

**Migration Strategy:**
- Automatic on app boot
- Idempotent (safe to run multiple times)
- Backward compatible
- Preserves all user data

### Storage Keys

All keys use `vanessa_` prefix for namespace isolation:

```
vanessa_chat_history          - Chat messages
vanessa_recipes               - Recipe library
vanessa_meals                 - Meal instances
vanessa_current_meal_plan     - Active week
vanessa_meal_plan_history     - Archived plans
vanessa_eaters                - Household members
vanessa_base_specification    - User profile + settings
vanessa_recipe_catalog        - 607 professional recipes (~900KB)
vanessa_ingredient_health     - Health scoring data (~35KB)
vanessa_diet_profiles         - 11 diet profiles (~10KB)
vanessa_schema_version        - Migration tracker
```

### Core Entities

**Recipe** (v2.0):
```javascript
{
  recipeId: 'recipe_[uuid]',
  name: string,
  ingredients: [{name, quantity, unit, category}],
  instructions: string,
  prepTime: number,
  cookTime: number,
  servings: number,
  tags: string[],
  
  // v2 additions:
  source: 'catalog' | 'generated' | 'imported' | 'manual',
  spoonacularId: number | null,
  image: string | null,
  nutrition: {...},
  dietCompassScores: {
    nutrientDensity: 0-100,
    antiAging: 0-100,
    weightLoss: 0-100,
    heartHealth: 0-100,
    overall: 0-100
  },
  parentRecipeId: string | null,  // For variations
  childRecipeIds: string[],
  
  // User data:
  isFavorite: boolean,
  rating: number | null,
  timesCooked: number,
  lastCooked: string | null,
  createdAt: string,
  updatedAt: string
}
```

**Meal** (v2.0):
```javascript
{
  mealId: 'meal_[uuid]',
  recipeId: 'recipe_[uuid]',
  mealType: 'breakfast' | 'lunch' | 'dinner',
  date: 'YYYY-MM-DD',
  eaterIds: string[],  // Who's eating
  servings: number,
  notes: string,
  
  // v2 additions:
  prepTasks: [{component, prepDay, storage, reheating}],
  targetEaters: string[],  // Who it was planned for
  dietProfileTags: string[]  // Which profiles it matches
}
```

---

## AI Integration

### Claude API Usage

**Model:** Claude Sonnet 4.5
- **Why:** Best price/performance for meal planning
- **Cost:** ~$0.03 per meal plan generation
- **Tokens:** ~2,000-6,000 per generation (after optimization)

### Token Optimization

**Problem:** Claude was generating full ingredient lists for catalog recipes, only to have us replace them.

**Solution:** Two-format system
```json
// Format 1: Catalog recipes (80% of meals)
{
  "name": "Greek-Style Baked Fish",
  "servings": 4,
  "fromCatalog": true
}
// Tokens: ~15 (95% reduction!)

// Format 2: New recipes (20% of meals)
{
  "name": "Custom Chicken Stir Fry",
  "servings": 2,
  "fromCatalog": false,
  "ingredients": [...],  // Full details
  "instructions": "..."
}
// Tokens: ~300
```

**Results:**
- 67% fewer output tokens
- ~$0.062 saved per meal plan
- Faster generation (8s → 3s)

### Streaming Responses (SSE)

**Implementation:**
```javascript
// Server (api/chat-with-vanessa.js)
const stream = anthropic.messages.stream({...});
for await (const chunk of stream) {
  response.write(`data: ${JSON.stringify({type: 'token', content: chunk})}\n\n`);
}

// Client (ChatWidget.js)
const eventSource = new EventSource('/api/chat-with-vanessa');
eventSource.onmessage = (event) => {
  const {type, content} = JSON.parse(event.data);
  if (type === 'token') appendToMessage(content);
};
```

**Benefits:**
- Real-time user feedback
- Better perceived performance
- Works with Vercel Edge Functions

### Two-Phase AI Extraction Pattern

**Problem:** Claude was ignoring complex household schedules and generating incorrect servings.

**Solution:** Separate conversation into extraction and generation phases.

**Implementation:**

**Phase 1: Extract Structured Data**
```javascript
// During onboarding conversation:
1. Chat naturally with user about household
2. When conversation complete, call extraction API
3. AI parses free-form text → structured data:
   {
     eaters: [{name, age, preferences}],
     schedule: {
       "2025-12-31": {dinner: ["You", "Maya", "Cathie"]},  // 3 servings
       "2026-01-01": {lunch: ["You"]}                       // 1 serving
     }
   }
```

**Phase 2: Use Structured Data for Generation**
```javascript
// In meal generation API:
- Receive pre-extracted structured schedule
- Build explicit requirements:
  "2025-12-31 (TUESDAY) dinner: 3 servings for You, Maya, Cathie"
- Claude can't misinterpret - requirements are explicit
```

**Why It Works:**
- **Separation of concerns**: Extraction vs generation are different tasks
- **Explicit over implicit**: No room for Claude to misinterpret
- **Verifiable**: Can inspect extracted data before generation
- **Reliable**: Eliminates "Claude ignored my schedule" issues

**Tradeoffs:**
- Two API calls instead of one
- Slightly longer onboarding (~5 seconds)
- Worth it: Reliable results vs faster but wrong results

**Results:**
- 100% accurate servings across complex schedules
- Users can verify extracted data before generation
- Fallback mechanisms if extraction fails

---

## Health Scoring System

### Diet Compass Integration

**Source:** "The Diet Compass" by Bas Kast

**Metrics:**
1. **Nutrient Density** (0-100)
   - Protective foods: +score (vegetables, legumes, nuts, fish)
   - Harmful foods: -score (red meat, processed foods, sugar)

2. **Anti-Aging** (0-100)
   - Longevity factors (autophagy triggers, polyphenols)
   - Inflammation markers

3. **Weight Loss** (0-100)
   - Glycemic impact
   - Satiety factors
   - Calorie density

4. **Heart Health** (0-100)
   - Omega-3 content
   - Healthy fats
   - Fiber content

### Scoring Algorithm

```javascript
// For each recipe:
1. Load ingredient health data
2. For each ingredient:
   - Calculate quantity ratio (grams per serving)
   - Get health impact for ingredient
   - Apply ratio weighting
3. Aggregate scores across all ingredients
4. Normalize to 0-100 scale
```

**Database:** 100+ ingredients with health classifications

**Coverage:** 605 of 607 catalog recipes scored (99.7%)

**Performance:** <5ms per recipe, ~3s for batch scoring 607 recipes

---

## Recipe Catalog System

### Spoonacular Integration

**Two-phase extraction:**

**Phase 1 (Jan 8-9, 2026):**
- 174 recipes (Mediterranean & Diet Compass focus)
- 180 images downloaded

**Phase 2 (Jan 10, 2026):**
- 320 additional recipes (66 targeted searches)
- 319 new images downloaded
- **Total: 494 recipes, 835 images (22MB)**

**Complete data:**
- Ingredients with metric units
- Full nutrition data
- Instructions
- High-res images (636x393)
- 15 protein types tagged
- 26 cuisines covered

**Cost:** ~70-100 Spoonacular points per extraction

**Savings:** $29/month (can cancel subscription after extraction)

### Catalog-First Generation

**Process:**
1. Claude suggests recipe names
2. Client attempts exact match on catalog
3. If no match, tries fuzzy match
4. If still no match, uses Claude's generated recipe
5. Tracks catalog vs generated ratio

**Current Catalog:**
- 494 recipes available
- 26 cuisines (Mediterranean, Italian, Thai, Indian, Chinese, Japanese, Korean, Vietnamese, Mexican, Greek, etc.)
- 15 protein types (chicken, salmon, tofu, lentils, chickpeas, etc.)
- 34 breakfasts, 18 curries, 11 stir-fries
- 27 dish types

**Results:**
- 40-70% catalog usage (typical)
- 50-70% token savings
- Pre-scored recipes (instant health data)

### Storage Strategy

**Images:**
- Stored in `/public/images/recipes/`
- Named by spoonacularId: `665719.jpg`
- High-res size: 636x393 (~26KB avg)
- Total: 22MB for 835 images

**Catalog Data:**
- `vanessa_recipe_catalog` in localStorage (1.4MB)
- 494 recipes with complete data
- Loads once on app init
- Cached for session

---

## Routing System

### Hash-based SPA Router

**Why hash routing:**
- Works on static hosts (no server routing needed)
- Simple implementation
- No server configuration required

**Implementation:**
```javascript
// router.js
const routes = {
  '/': HomePage,
  '/meal-plan': MealPlanView,
  '/day/:day': DayView,  // Parameterized routes
  '/recipe/:id': RecipeDetailPage
};

window.addEventListener('hashchange', () => {
  const path = window.location.hash.slice(1);
  const {route, params} = matchRoute(path);
  renderComponent(route, params);
});
```

**Benefits:**
- SEO not a concern (single-user app)
- Simple debugging (URL = state)
- Bookmarkable views

---

## Performance Optimizations

### Debouncing & Throttling

**Search:** 300ms debounce
```javascript
let searchTimer;
input.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => search(e.target.value), 300);
});
```

**Auto-save:** 30s throttle
```javascript
let saveTimer;
function markDirty() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(), 30000);
}
```

### Lazy Loading

**Recipe images:**
- Load on demand (not all 606 at once)
- Browser-native lazy loading: `<img loading="lazy">`
- Reduces initial page load

**Catalog data:**
- Only loads when needed
- Cached in memory after first load

### Storage Efficiency

**Problem:** localStorage 5MB limit

**Solutions:**
1. Auto-archive old meal plans
2. Configurable retention (1-12 weeks)
3. Automatic cleanup on generation
4. Quota monitoring with warnings
5. Export/import for backups

**Result:** ~20-30 weeks capacity with default settings

---

## Testing Strategy

### Manual Testing Approach

**Why no automated testing:**
- Rapid iteration phase
- AI-heavy (hard to mock)
- Single developer
- Cost/benefit ratio

**Testing process:**
1. Agent does automated UI smoke tests
2. User does manual functional testing
3. Reality Check after each slice
4. Document learnings

**Test coverage:**
- ✅ All routes load
- ✅ All forms validate
- ✅ All API endpoints work
- ✅ No console errors
- ⏳ Cross-browser testing (pending)
- ⏳ Mobile testing (pending)

---

## Security Considerations

### Current Security Model

**Storage:** Client-side only (localStorage)
- No server-side persistence
- No authentication required
- Data lives in user's browser

**API Keys:** Server-side only
- Anthropic API key in Vercel environment
- Never exposed to client
- All AI calls proxied through `/api/*`

**Input Validation:**
- Recipe import: 50-5000 char limit
- Form validation on all inputs
- Ingredient limits to prevent abuse

### Future Security (Slice 6+)

**With Firebase:**
- Anonymous auth (default)
- Google Sign-In (optional)
- Firestore security rules
- User isolation
- Rate limiting

---

## Error Handling

### Global Error Handler

```javascript
// errorHandler.js
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showToast('Something went wrong. Please refresh.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('Operation failed. Please try again.', 'error');
});
```

### API Error Handling

```javascript
try {
  const response = await fetch('/api/endpoint', {...});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  console.error('API error:', error);
  showToast('Failed to connect. Check your internet.', 'error');
}
```

### Graceful Degradation

- Catalog fails → Falls back to AI generation
- Image fails → Shows placeholder
- Storage full → Prompts for cleanup
- AI timeout → Retry with exponential backoff

---

## Technical Debt & Future Work

### Known Technical Debt

1. **No build process:** Limits code optimization opportunities
2. **Manual DOM management:** Could use a lightweight framework
3. **localStorage limitations:** Need Firebase migration
4. **No offline mode:** Service worker would enable true offline
5. **No analytics:** Can't measure usage or optimize UX

### Refactoring Candidates

1. **Extract UI library:** Reusable button/form/modal components
2. **State management:** Consider lightweight Zustand or similar
3. **API client:** Centralized fetch wrapper with retry logic
4. **Type safety:** Consider JSDoc comments or TypeScript migration

### Performance Improvements

1. **Code splitting:** Load components on demand
2. **Image optimization:** WebP format, responsive sizes
3. **Service worker:** Cache static assets
4. **CDN:** Serve images from CDN instead of Vercel

---

## Deployment

### Vercel Configuration

```json
{
  "functions": {
    "api/generate-meal-plan.js": {
      "maxDuration": 60,
      "memory": 1024
    },
    "api/chat-with-vanessa.js": {
      "maxDuration": 30,
      "memory": 512
    }
  }
}
```

### Environment Variables

**Required:**
- `ANTHROPIC_API_KEY` - Claude API access

**Optional:**
- `SPOONACULAR_API_KEY` - Only needed for catalog extraction (one-time)

### Build Process

**None!** This is a static site.

```bash
vercel deploy --prod
# That's it. No build step.
```

---

## Monitoring & Debugging

### Debug Helpers

```javascript
// Available in browser console:
window.debug = {
  refreshProfiles() { /* Reload diet profiles */ },
  clearStorage() { /* Clear all data */ },
  showState() { /* Log current state */ },
  exportData() { /* Download backup */ }
};
```

### Logging Strategy

**Development:**
- Verbose console.logs for debugging
- Component lifecycle logging
- API response logging

**Production:**
- Error logging only
- No sensitive data in logs
- Toast notifications for user errors

---

## Key Architectural Decisions

### 1. Vanilla JS over React
**Decision:** Use vanilla JavaScript instead of React/Vue  
**Rationale:** Zero build complexity, faster iteration, smaller bundle  
**Tradeoff:** More manual DOM management  
**Result:** ✅ Successful - 18k lines, highly maintainable

### 2. localStorage First
**Decision:** Use localStorage before Firebase  
**Rationale:** Faster MVP, zero cost, offline-first  
**Tradeoff:** Single device, 5MB limit  
**Result:** ✅ Successful - Works great for single-user, easy migration path

### 3. Serverless Functions
**Decision:** Vercel Edge Functions instead of traditional backend  
**Rationale:** Zero DevOps, auto-scaling, pay-per-use  
**Tradeoff:** Cold starts, vendor lock-in  
**Result:** ✅ Successful - $0-5/month cost, scales to 0

### 4. Catalog-First Generation
**Decision:** Build recipe catalog + health scoring before AI generation  
**Rationale:** Cost savings, faster generation, better health data  
**Tradeoff:** One-time extraction effort  
**Result:** ✅ Successful - 67% token savings, instant health scores

### 5. Vertical Slice Methodology
**Decision:** Build complete features one at a time  
**Rationale:** Learn from reality, ship working features faster  
**Tradeoff:** Slower to see "full vision"  
**Result:** ✅ Successful - 5 slices shipped, each fully functional

---

**Last Updated:** January 9, 2026
