# Future Features & Improvements

## Slice 3+ Features

### 1. One-Off Meal Generation
**Priority:** High  
**Description:** Generate a single meal (not weekly plan)

**User Story:**
- User clicks "Generate One Meal" button on HomePage
- Opens chat or modal to specify:
  - What ingredients they have available
  - How many people to serve
  - Dietary preferences
  - Time constraints
- Generates single recipe with shopping list for missing ingredients

**Technical Notes:**
- Similar to weekly generation but simpler
- Could use photo upload for fridge scan (see #2)
- Faster generation (1 recipe vs 21)
- Lower API cost

---

### 2. Photo Upload for Fridge Ingredients
**Priority:** Medium  
**Description:** Take photo of fridge/pantry to identify available ingredients

**User Story:**
- User clicks camera icon in one-off meal generation
- Takes photo or uploads image
- AI identifies ingredients visible
- Suggests meals based on what's available

**Technical Notes:**
- Requires Claude Vision API
- Image → ingredient list extraction
- Integration with one-off meal generation
- Could also suggest "use up" recipes for expiring items

---

### 3. Recipe Database for Testing
**Priority:** High (for development)  
**Description:** Pre-generated recipe library to reduce API costs during testing

**Why:**
- Current: Every test generates 21 recipes from scratch (~$0.10-0.20 per test)
- With database: Reference existing recipes, only generate new ones as needed
- Faster generation (~10-20s instead of 60s)
- Lower development costs

**Implementation Plan:**
- Create seed database: 50-100 pre-generated recipes
- Store in localStorage or JSON file
- Generation process:
  1. Check recipe DB for matching preferences
  2. Reuse existing recipes when possible
  3. Generate only missing/new recipes
  4. Add new recipes to database for future reuse

**Categories to seed:**
- Breakfast (15 recipes)
- Lunch (20 recipes)  
- Dinner (25 recipes)
- Quick meals (<30 min)
- Vegetarian options
- Low-carb options
- Budget-friendly meals

**Technical Notes:**
- Recipe schema matches current format
- Each recipe tagged with: dietary type, cook time, difficulty, ingredients used
- Smart matching algorithm: "user wants low dairy + quick" → filter and select from DB
- Fallback to AI generation if no good matches

---

### 4. Full Styling Review
**Priority:** Medium  
**Description:** Professional design polish

**Current State:**
- Using Tailwind CDN (not production-ready)
- Pastel colors implemented
- Functional but could be more polished

**Goals:**
- Clean, simple, professional
- Fresh and modern
- Not overly vibrant
- Consistent spacing and typography
- Mobile-first responsive
- Accessibility (WCAG 2.1 AA)

**No Designer Budget:**
- Use design systems/templates as reference
- Focus on clean layout and good UX
- Consistent component styling
- Simple color palette (2-3 main colors)

**Technical:**
- Install Tailwind properly (not CDN)
- Create custom config with brand colors
- Design tokens for spacing, typography
- Component library for consistency

---

## Development Priorities

**Phase 1 (Now - Slice 2 Complete):**
- ✅ Weekly meal generation
- ✅ Shopping list aggregation
- ✅ Basic UI improvements

**Phase 2 (Slice 3):**
- Recipe database for testing
- One-off meal generation
- Improved ingredient handling

**Phase 3 (Polish):**
- Photo upload
- Full styling review
- Performance optimization
- Production Tailwind setup

---

## Cost Optimization Notes

**Current API Usage:**
- Weekly generation: ~8000 tokens output = ~$0.15-0.20 per generation
- Chat: ~100-500 tokens per message = ~$0.01-0.02 per message
- Testing 10 generations = ~$2.00

**With Recipe Database:**
- First generation: ~$0.15 (generates & stores 21 recipes)
- Subsequent: ~$0.02-0.05 (reuses most recipes, generates few new ones)
- Testing 10 generations = ~$0.50 (75% cost reduction)

**Implementation Priority:** HIGH for active development phase



