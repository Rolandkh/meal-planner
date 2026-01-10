# Project Overview: Vanessa - AI Meal Planning Concierge

## Product Vision

**Vanessa** is an AI-powered meal planning assistant that transforms the tedious process of meal planning into an effortless, personalized experience. She helps households of all types—from single users to families with diverse dietary needs—create healthy, budget-conscious meal plans with automatically-generated shopping lists.

## Core Philosophy

### Vertical Slice Development

This project follows an **iterative "vertical slice" approach** where each increment delivers a complete, end-to-end feature before moving to the next:

1. **Build Thin Slices** → Complete end-to-end features
2. **Reality Check** → Evaluate what worked, what was awkward
3. **Update Spec** → Refine based on learnings
4. **Repeat** → Next slice builds on proven patterns

**Key Principle:** Build working software incrementally, learning from each slice before expanding. The spec earns its authority through implementation, not theory.

### Technology Stack

- **Frontend:** Vanilla JavaScript, HTML, CSS (Tailwind)
- **Backend:** Vercel serverless functions
- **AI:** Claude API (Anthropic)
- **Storage:** localStorage (client-side)
- **Deployment:** Vercel

**Why No Framework?**
- Faster iteration during early development
- Lower complexity for small team
- Direct control over every interaction
- Easy to understand and modify

## Project Status

**Version:** v1.0-rc2  
**Current Stage:** Slice 5 (72% complete)

### Completed Slices ✅

1. **Slice 1** - Chat with Vanessa (MVP foundation)
2. **Slice 2** - Meal plan generation & shopping lists
3. **Slice 3** - Recipe library, settings, onboarding
4. **Slice 4** - Recipe management, history, import

### Current Work ⏳

**Slice 5** - Health Intelligence & Recipe Catalog
- Recipe database (600+ recipes from Spoonacular)
- Diet Compass health scoring system
- Diet profiles (11 preloaded: Mediterranean, Keto, Vegan, etc.)
- Ingredient normalization pipeline
- Personal preferences & exclusions

### Future Slices 🔮

- **Slice 6** - Multi-user prep coordination
- **Slice 7** - Advanced features & polish
- **Slice 8** - Mobile optimization & PWA

## Core Features

### 1. Conversational Interface
Talk to Vanessa naturally about your meal planning needs. She remembers context and guides you through the process.

### 2. Intelligent Meal Generation
- Generates complete 7-day meal plans
- Considers household members, dietary needs, budgets
- Uses 600+ recipe catalog + AI generation
- Automatic shopping list creation

### 3. Health Intelligence
- **Diet Compass Scoring** - 4 health metrics per recipe:
  - Nutrient Density (0-100)
  - Anti-Aging (0-100)
  - Weight Loss (0-100)
  - Heart Health (0-100)
- Visual health indicators on every recipe

### 4. Diet Profiles
- 11 preloaded profiles (Mediterranean, Keto, Vegan, etc.)
- Personal preferences & exclusions per eater
- Multi-profile household support
- Automatic profile suggestion during onboarding

### 5. Recipe Management
- 600+ professional recipes from Spoonacular
- AI-generated recipes when needed
- Import recipes from URLs
- Create recipe variations (parent-child relationships)
- Edit and customize any recipe

### 6. Smart Shopping Lists
- Automatically generated from meal plans
- Organized by grocery store category
- Ingredient normalization (88% match rate)
- Reduced duplicates through smart aggregation

## Key Design Decisions

### Data Storage Strategy
**Current:** localStorage (client-side only)
- Pros: Simple, fast, no backend database needed
- Cons: 5MB limit, no cross-device sync
- Future: Backend sync when needed (Slice 8+)

### AI Integration
**Primary Model:** Claude Sonnet (Anthropic)
- Used for: Meal generation, recipe creation, chat
- Streaming responses for real-time feedback
- Cost-effective for target scale

### Catalog-First Generation
**Strategy:** Use recipe catalog as primary source
1. Filter catalog by constraints (diet, allergies, prep level)
2. Select matching recipes
3. Fall back to AI generation if no match
4. Generate new recipes on explicit user request

This approach reduces:
- AI API costs (80% reduction)
- Generation time (3x faster)
- Recipe quality variance (tested recipes)

## Target Users

### Primary
- **Health-conscious singles & couples** (ages 25-45)
- Want to eat healthier but lack time/energy for planning
- Value convenience and quality over absolute cost optimization

### Secondary
- **Families with dietary diversity** (vegetarian + omnivore, etc.)
- **Meal prep enthusiasts** who batch-cook
- **People with dietary restrictions** (allergies, health conditions)

## Success Metrics

### User Experience
- Time to first meal plan: <5 minutes
- Recipe catalog match rate: 70%+
- Shopping list consolidation: 40-50 unique ingredients per week
- User returns within 7 days: 60%+

### Technical Performance
- Page load: <2 seconds
- AI response latency: <3 seconds to first token
- Offline capability: Full browsing of saved plans
- Mobile-friendly: All features work on phone

## Development Principles

1. **Working code over perfect code** - Get it working, then polish
2. **User feedback drives features** - Build what users actually need
3. **Vertical slices only** - No horizontal layers without complete flows
4. **Document learnings** - Reality checks after each slice
5. **No premature optimization** - Optimize when real bottlenecks emerge

## Project Documentation

### Main Documentation (docs/)
- `README.md` - Project setup & quick start
- `ARCHITECTURE.md` - Technical decisions & system design
- `DEVELOPMENT.md` - Setup, testing, deployment
- `FEATURES.md` - Feature documentation & user guides
- `CHANGELOG.md` - Version history

### Taskmaster Documentation (.taskmaster/docs/)
- `prd-current.txt` - Current slice requirements & future plans
- `project-overview.md` - This file (vision & philosophy)
- `onboarding-specification.md` - Onboarding flow details
- `future-features.md` - Planned features for Slice 6+
- `archive/` - Historical documentation (Slices 1-4)
- `research/` - Technical research notes

### Reference Documentation (references/)
- Diet profiles, health rating system, extraction protocols
- Kept separate for reference during implementation

---

**Last Updated:** January 10, 2026  
**Document Version:** 1.0
