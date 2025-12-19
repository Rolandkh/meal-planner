# PHASE 1: VANESSA CHATBOT - IMPLEMENTATION SPECIFICATION

**Version:** 5.2 - Normalized Architecture  
**Target Timeline:** MVP-A: 3 weeks, MVP-B: 2 weeks  
**Created:** December 2025  
**Last Updated:** December 19, 2025

**Changelog v5.2:**
- Added manual recipe entry via paste text (Claude extracts structure from pasted recipe)
- Added recipe import via URL (fetch page, Claude extracts recipe)
- Added `/api/extract-recipe` endpoint for both paste and URL import flows
- Added `AddRecipePage` component with method selection, paste, URL, and review screens
- Added "Add Recipe" button to RecipeLibrary page
- Added `/recipes/add` route
- Expanded MVP-B section with detailed Pantry system specification
- Updated development timeline to include Day 10 for Add Recipe flow
- Added request timeout handling with AbortController (45s for generation, 25s for chat/extraction)
- Added Cancel button to GenerationStatusPage for user-initiated cancellation
- Added Vercel function timeout configuration (60s for generation, 30s for chat/extraction)
- Added TIMEOUT and CANCELLED error types with appropriate recovery flows
- Added localStorage quota management with automatic cleanup on QuotaExceededError
- Added `safeSave()` wrapper for all localStorage writes with error handling
- Added `StorageWarningBanner` component showing warnings at 80%/95% capacity
- Added Storage Manager UI for users to manually clean up data
- Added `emergencyStorageCleanup()` with prioritized data removal

**Changelog v5.1:**
- Fixed race condition in usage metering: usage now only incremented after successful API completion (not before)
- Added `transformGeneratedPlan()` function implementation with recipe deduplication logic
- Added `extractWeeklyPreferences()` and `summarizeConversation()` helper functions for generation context
- Fixed `weeklyPreferences` now passed through and stored with meal plan for historical reference
- Added `GenerationStatusPage` component with progress UI, automatic retry on failure, and failure recovery options
- Added simple hash-based routing system with route definitions and navigation
- Expanded Testing Strategy with tests for generation status page, routing, retry flow, and edge cases
- Revised Development Timeline: now 3 weeks with dedicated days for routing, generation status page, and retry logic
- Added note on future Firebase optimization for server-side context fetching

---

## TABLE OF CONTENTS

1. [Overview & User Journey](#1-overview--user-journey)
2. [Data Architecture](#2-data-architecture)
3. [API Specifications](#3-api-specifications)
4. [UI Styling (Tailwind)](#4-ui-styling-tailwind)
5. [UI Components](#5-ui-components)
6. [Conversation Flow](#6-conversation-flow)
7. [Recipe Library System](#7-recipe-library-system)
8. [Usage Metering & Plans](#8-usage-metering--plans)
9. [Offline Mode](#9-offline-mode)
10. [Migration Plan](#10-migration-plan)
11. [Development Timeline](#11-development-timeline)
12. [Error Handling & Logging](#12-error-handling--logging)
13. [Testing Strategy](#13-testing-strategy)

---

## 1. OVERVIEW & USER JOURNEY

### The Vanessa Experience

**Vanessa** is an AI meal planning concierge powered by Claude that helps users:
- Set up their meal planning preferences (streamlined onboarding)
- Generate weekly meal plans through natural conversation
- Update preferences anytime (with confirmation)
- Search and reuse favorite recipes
- Add recipes manually or import from URLs
- Answer cooking and nutrition questions

### Key Design Decisions

**Always-Available Generate Button:**
- Generate button is always visible in the chat interface
- User can click immediately → generates using base specification only
- Or user can chat first to add weekly preferences → then click Generate
- No complex state detection required

**Week as a Single Unit:**
- Meal plans run from shopping day dinner to next shopping day lunch
- No partial regeneration - change all or nothing
- If shopping day is Saturday, plan covers Saturday dinner → next Saturday lunch
  - Note: This spans 8 calendar days but covers 7 "meal cycles"
  - The plan includes 7 breakfasts, 7 lunches, 7 dinners = 21 meals total

**Progressive Profile Building:**
- Fast onboarding (5-6 essential questions) to get first meal plan quickly
- Vanessa suggests additional profile questions over time after first plan

**Conversations Tied to Data Objects:**
- Onboarding/profile conversations attached to Base Specification
- Weekly planning conversations attached to Meal Plans
- No ephemeral sessions - all conversations persist with their parent object

**Profile Updates Require Confirmation:**
- When user requests profile changes via chat, Vanessa confirms before applying
- Prevents accidental modifications from misunderstood queries

### Key Changes from Current App

**What's NEW:**
- Chat interface with Vanessa (replaces "Generate Week" form)
- Base Specification document (user profile)
- Normalized data model (Eaters, Recipes, Meals, Meal Plans)
- Recipe library with search, favorites, and manual addition
- Recipe import from URLs or pasted text
- Usage metering with plan limits (free/pro tiers)

**What STAYS:**
- Shopping list with aisle organization ✅
- Daily meal views with recipes ✅
- Feedback system ✅
- Export functionality ✅
- Budget tracking ✅

**What CHANGES:**
- Generation flow: Chat (optional) → Generate button → Whole week
- Meal plans reference recipes by ID (not embedded)
- Recipes are first-class objects with usage tracking

### MVP Scope Split

**MVP-A (3 weeks): Core Experience**
- Normalized data model (Eaters, Recipes, Meals, Meal Plans)
- Chat with Vanessa (conversations tied to meal plans / base spec)
- Meal plan generation with Sonnet
- Recipe library with usage tracking
- Manual recipe addition (paste text or URL import)
- Generate button always visible
- Usage metering with plan limits
- Offline mode for viewing

**MVP-B (2 weeks): Pantry & Inventory System**

**Pantry** - Track what ingredients you have at home:

*Core Features:*
- Ingredients master data (name, category, default unit, typical shelf life)
- Add items manually (name, quantity, location, expiry date)
- Storage locations: Fridge, Freezer, Pantry/Cupboard
- Expiry date tracking with warnings
- "Low stock" indicators for frequently used items

*Workflows:*
- **Manual add:** Quick entry form for individual items
- **Post-shopping bulk add:** "I bought the shopping list" → converts shopping list to pantry items
- **Photo scan (stretch):** Take photo of fridge/pantry → Claude vision extracts visible items
- **Cooking decrement:** When meal marked as cooked → reduce ingredient quantities

*Smart Features:*
- Vanessa suggests recipes based on expiring ingredients
- Shopping list auto-populates items that are low/out
- "Use it up" mode: prioritize meals using ingredients near expiry

*UI:*
- Pantry page showing all items grouped by location
- Filter by: location, expiry status, category
- Quick actions: adjust quantity, mark as finished, edit expiry

---

### Complete User Journey

#### NEW USER FLOW

**1. FIRST VISIT**
- Land on home page
- See prompt: "Welcome! Chat with Vanessa to get started"
- Click chat widget icon

**2. STREAMLINED ONBOARDING (~3 minutes)**

Vanessa asks 5-6 essential questions to enable first meal plan:

```
Vanessa: "Hi! I'm Vanessa, your meal planning assistant. Let me ask a few quick 
         questions so I can create your first meal plan.
         
         What are your main dietary goals? (e.g., lose weight, eat healthier, 
         follow a specific diet like Mediterranean or keto)"

User: "I want to follow the Diet Compass protocol and maintain around 1500 
      calories per day"

Vanessa: "Great choice! Are there any foods you don't eat or want to avoid?"

User: "No red meat, processed foods, or refined sugars"

Vanessa: "Got it. Do you cook for anyone else, like family members with 
         different preferences?"

User: "Yes, my 4-year-old daughter Maya. She's with me Sunday lunch through 
      Wednesday lunch. She likes simple foods - pasta, fruit, crackers."

Vanessa: "What's your weekly grocery budget?"

User: "$150"

Vanessa: "And which day do you usually do your grocery shopping?"

User: "Saturday"

Vanessa: "Perfect! I have everything I need. Your week will run from Saturday 
         dinner through the following Saturday lunch. Click Generate whenever 
         you're ready!"

[Generate button is always visible - user clicks when ready]
[Navigates to generation status page with progress indicator]
[On success, automatically navigates to meal plan view]
```

**3. POST-FIRST-PLAN PROFILE ENHANCEMENT**

After the first meal plan is generated and user has used the app for a week:

```
Vanessa: "Now that you've used your first meal plan, I'd love to learn more 
         to make future plans even better. When you have a moment, I can ask 
         about your cooking equipment, time availability, and any specific 
         foods you want more of. Just say 'let's do that' when you're ready!"
```

**4. WEEKLY USAGE**
- Use shopping list, daily views (as before)
- Click chat widget anytime to ask Vanessa questions
- Conversation history preserved for current meal plan

**5. NEXT WEEK PLANNING**

```
User: "I need to plan next week"

Vanessa: "Sure! Any special requests for this week?"

User: "I have leftover cabbage and Maya wants pasta twice"

Vanessa: "Got it - I'll incorporate cabbage into 2-3 meals and include pasta 
         twice for Maya. Click Generate when you're ready!"

[User clicks Generate]
[Navigates to generation status page]
[On success, new meal plan loaded]
```

**6. MID-WEEK QUESTIONS**

Users can ask Vanessa questions mid-week:

```
User: "How do I cook the salmon from Thursday's dinner?"

Vanessa: "For the Herb-Crusted Salmon: Pat the fillet dry, season with salt 
         and your herb mix, then pan-sear in olive oil for 4 minutes per side 
         over medium-high heat. The center should be slightly pink."
```

**7. UPDATING BASE SPEC (with confirmation)**

```
User: "I want to start intermittent fasting"

Vanessa: "Great! What eating window works for you? Common options are 16:8 
         (eating 10am-6pm) or 14:10 (eating 8am-6pm)."

User: "Let's do 8am to 6pm"

Vanessa: "Got it. I'll update your eating window to 8am-6pm. This affects 
         all future meal plans. Confirm?"

User: "Yes"

Vanessa: "Done! Your profile now includes an 8am-6pm eating window."
```

**8. ADDING RECIPES MANUALLY**

Users can add their own recipes to the library:

```
[User navigates to Recipe Library]
[Clicks "Add Recipe" button]
[Chooses "Paste Recipe Text"]
[Copies recipe from a website or book, pastes into text field]
[Clicks "Format Recipe"]
[Vanessa extracts and structures the recipe]
[User reviews, edits if needed, saves to library]
```

Or via URL:
```
[User chooses "Import from URL"]
[Pastes recipe URL]
[Clicks "Import Recipe"]
[System fetches page, Vanessa extracts recipe]
[User reviews, edits if needed, saves to library]
```

---

## 2. DATA ARCHITECTURE

### Normalized Data Model

The application uses a normalized data model with five core entities:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   EATERS    │     │   RECIPES   │     │    MEALS    │
│             │     │             │     │             │
│ Preferences │     │ Ingredients │     │ Recipe ref  │
│ Schedule    │     │ Steps       │     │ Eater refs  │
│ Allergies   │     │ Usage stats │     │ Date/slot   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐            │
                    │ MEAL PLANS  │◄───────────┘
                    │             │
                    │ Meal refs   │
                    │ Conversation│
                    │ Budget      │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    BASE     │
                    │    SPEC     │
                    │             │
                    │ Owner eater │
                    │ Conversation│
                    │ Plan tier   │
                    └─────────────┘
```

### Schema Overview

```javascript
// LOCALSTORAGE STRUCTURE (Phase 1 - MVP-A)

localStorage = {
  
  // ==================================================
  // EATERS - People who eat meals
  // ==================================================
  'eaters': [
    {
      _schemaVersion: 1,
      eaterId: 'eater_roland',
      name: 'Roland',
      preferences: 'Diet Compass protocol, 1500 cal/day, no red meat, no processed foods, no refined sugars. Prefers fatty fish, legumes, whole grains, fermented foods.',
      schedule: 'Available all meals. 8am-6pm eating window. 24-hour fast Thursday lunch to Friday lunch.',
      allergies: [],
      createdAt: '2025-12-18T10:00:00.000Z',
      updatedAt: '2025-12-18T10:00:00.000Z'
    },
    {
      _schemaVersion: 1,
      eaterId: 'eater_maya',
      name: 'Maya',
      preferences: 'Simple foods, likes pasta, fruit, crackers. Dislikes spicy or complex flavors.',
      schedule: 'Sun lunch & dinner, Mon-Tue all meals (lunch packed), Wed breakfast & lunch',
      allergies: [],
      createdAt: '2025-12-18T10:00:00.000Z',
      updatedAt: '2025-12-18T10:00:00.000Z'
    }
  ],

  // ==================================================
  // RECIPES - How to make food
  // ==================================================
  'recipes': [
    {
      _schemaVersion: 1,
      recipeId: 'recipe_001',
      name: 'Herb-Crusted Salmon',
      category: 'dinner',
      cuisine: 'mediterranean',
      servings: 2,
      prepTime: 15,
      cookTime: 20,
      totalTime: 35,
      difficulty: 'easy',
      
      ingredients: [
        { item: 'Salmon fillet', quantity: '150g', category: 'protein' },
        { item: 'Fresh dill', quantity: '10g', category: 'herbs' },
        { item: 'Fresh parsley', quantity: '10g', category: 'herbs' },
        { item: 'Olive oil', quantity: '15ml', category: 'fats' },
        { item: 'Lemon', quantity: '1/2', category: 'produce' },
        { item: 'Salt', quantity: 'to taste', category: 'pantry' },
        { item: 'Black pepper', quantity: 'to taste', category: 'pantry' }
      ],
      
      steps: [
        'Pat salmon dry with paper towel',
        'Season with salt and pepper',
        'Chop herbs finely and mix together',
        'Heat olive oil in pan over medium-high',
        'Sear salmon 4 minutes per side',
        'Top with herbs and squeeze lemon over',
        'Serve immediately'
      ],
      
      // Usage tracking
      timesCooked: 3,
      lastCooked: '2025-12-10',
      rating: 5,
      notes: 'Maya loved this!',
      isFavorite: true,
      tags: ['quick', 'kid-friendly', 'omega-3'],
      
      // Metadata
      createdAt: '2025-11-15T10:00:00.000Z',
      createdBy: 'generation'  // 'generation', 'manual', or 'import'
    }
  ],

  // ==================================================
  // MEALS - Specific instances connecting recipe + eaters
  // ==================================================
  'meals': [
    {
      _schemaVersion: 1,
      mealId: 'meal_20251214_sat_d',
      recipeId: 'recipe_001',
      date: '2025-12-14',
      slot: 'dinner',  // breakfast, lunch, dinner
      eaterIds: ['eater_roland'],  // Who's eating this meal
      time: '5:30 PM',
      cooked: false,  // For future inventory decrement
      notes: ''
    },
    {
      _schemaVersion: 1,
      mealId: 'meal_20251215_sun_d',
      recipeId: 'recipe_002',
      date: '2025-12-15',
      slot: 'dinner',
      eaterIds: ['eater_roland', 'eater_maya'],
      time: '5:30 PM',
      cooked: false,
      notes: ''
    }
  ],

  // ==================================================
  // MEAL PLANS - A week's worth of meals grouped together
  // ==================================================
  'currentMealPlan': {
    _schemaVersion: 1,
    mealPlanId: 'plan_20251214',
    weekOf: '2025-12-14',  // Saturday (shopping day)
    weekEnd: '2025-12-21',  // Following Saturday
    createdBy: 'eater_roland',  // Whose base spec drove generation
    generatedAt: '2025-12-14T09:30:00.000Z',
    
    // References to meals
    mealIds: [
      'meal_20251214_sat_d',
      'meal_20251215_sun_b',
      'meal_20251215_sun_l',
      'meal_20251215_sun_d',
      // ... all meals for the week
    ],
    
    // Weekly preferences used for this plan
    weeklyPreferences: {
      useIngredients: ['cabbage'],
      specialRequests: ['Maya wants pasta twice'],
      avoidThisWeek: [],
      budgetAdjustment: null
    },
    
    // Budget tracking
    budget: { 
      target: 150, 
      estimated: 138.50, 
      status: 'under' 
    },
    
    // Shopping list (generated from meal recipes)
    shopping: [
      {
        cat: 'Produce',
        items: [
          { name: 'Cabbage (1 head)', price: 3.50, aisle: 1 },
          { name: 'Salad greens (4 bags)', price: 12.00, aisle: 1 }
        ]
      }
      // ... more categories
    ],
    
    // Conversation for this meal plan
    conversation: {
      startedAt: '2025-12-14T09:15:00.000Z',
      messages: [
        { 
          role: 'assistant', 
          content: 'Hi! How can I help you today?', 
          timestamp: '2025-12-14T09:15:01.000Z' 
        },
        { 
          role: 'user', 
          content: 'I need to plan next week. Use up the cabbage and Maya wants pasta twice.', 
          timestamp: '2025-12-14T09:16:00.000Z' 
        },
        { 
          role: 'assistant', 
          content: "Got it - I'll incorporate cabbage into 2-3 meals and include pasta twice for Maya. Click Generate when you're ready!", 
          timestamp: '2025-12-14T09:16:05.000Z'
        },
        {
          // NOTE: 'system' role messages are for LOCAL DISPLAY ONLY
          // They are filtered out before sending to Anthropic API
          // (Anthropic only accepts 'user' and 'assistant' roles)
          role: 'system',
          content: 'Meal plan generated.',
          timestamp: '2025-12-14T09:30:00.000Z'
        }
      ]
    }
  },

  // ==================================================
  // BASE SPECIFICATION - User profile & settings
  // ==================================================
  'baseSpecification': {
    _schemaVersion: 1,
    
    // Owner of this specification
    ownerEaterId: 'eater_roland',
    
    // Core settings
    weeklyBudget: 150,
    shoppingDay: 6,  // 0=Sunday, 6=Saturday
    preferredStore: 'Coles Caulfield',
    
    // Linked eaters (household)
    householdEaterIds: ['eater_roland', 'eater_maya'],
    
    // Vanessa configuration
    vanessaPersonality: 'friendly-casual',
    communicationPreferences: 'Concise, practical advice',
    
    // Progressive enhancement tracking
    onboardingComplete: true,
    enhancedProfileComplete: false,
    lastEnhancementPrompt: null,
    
    // Onboarding & profile update conversation
    conversation: {
      startedAt: '2025-12-14T08:00:00.000Z',
      messages: [
        { 
          role: 'assistant', 
          content: "Hi! I'm Vanessa, your meal planning assistant...", 
          timestamp: '2025-12-14T08:00:01.000Z' 
        }
        // ... onboarding messages
      ]
    },
    
    createdAt: '2025-12-14T08:00:00.000Z',
    updatedAt: '2025-12-18T10:00:00.000Z'
  },

  // ==================================================
  // USAGE METERING
  // ==================================================
  'usageLimits': {
    visitorId: 'visitor_001',  // or authenticated userId later
    plan: 'free',  // free, pro
    
    // Limits by plan
    limits: {
      generationsPerMonth: 4,    // free: 4, pro: 20
      messagesPerMonth: 100,     // free: 100, pro: 1000
      maxEaters: 2               // free: 2, pro: 10
    },
    
    // Current period usage
    currentPeriod: {
      startDate: '2025-12-01',
      generations: 2,
      messages: 47
    }
  },

  // ==================================================
  // USAGE LOG (For Analysis)
  // ==================================================
  'usageLog': [
    {
      date: '2025-12-18',
      chatMessages: 15,
      generations: 1,
      apiCalls: 16
    }
    // Keep last 30 days
  ],

  // ==================================================
  // EXISTING APP STATE (Unchanged)
  // ==================================================
  'mealPlannerApp': {
    checkedItems: {
      'shopping-item-1': true,
      'shopping-item-2': false
    }
  },

  'mealPlannerFeedback': [
    {
      rating: 4,
      loved: 'Salmon dinner was great',
      didntWork: 'Mackerel too strong',
      week: 'Dec 8-14',
      date: '2025-12-15T10:30:00.000Z'
    }
    // ... last 8 weeks
  ]
}
```

### Recipe Auto-Cleanup

Recipes are automatically cleaned up based on usage:

```javascript
function cleanupUnusedRecipes() {
  const recipes = loadRecipes();
  const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
  
  const activeRecipes = recipes.filter(recipe => {
    // Keep if ever cooked
    if (recipe.timesCooked > 0) return true;
    
    // Keep if favorited
    if (recipe.isFavorite) return true;
    
    // Keep if manually added (user effort)
    if (recipe.createdBy === 'manual' || recipe.createdBy === 'import') return true;
    
    // Keep if created less than 60 days ago
    if (new Date(recipe.createdAt) > sixtyDaysAgo) return true;
    
    // Delete: never cooked, not favorited, auto-generated, AND older than 60 days
    return false;
  });
  
  saveRecipes(activeRecipes);
}

// Run on app startup
cleanupUnusedRecipes();
```

---

## 3. API SPECIFICATIONS

### Endpoints

#### POST /api/chat-with-vanessa

**Purpose:** Stream chat responses from Vanessa

**Request:**
```javascript
{
  message: string,
  conversationType: 'baseSpec' | 'mealPlan',
  context: {
    baseSpecification: object,
    eaters: array,
    currentMealPlan: object | null,
    recipes: array,
    chatHistory: array
  }
}
```

**Response:** Server-Sent Events (SSE) stream
```javascript
data: {"type": "token", "content": "Hi"}
data: {"type": "token", "content": " there"}
data: {"type": "done"}
data: {"type": "error", "message": "Rate limit exceeded"}
```

**Implementation:**
```javascript
// api/chat-with-vanessa.js

// NOTE: Usage tracking is handled client-side (see Known Limitations in Section 7)
// Server trusts client for MVP-A. Proper enforcement requires auth + server DB (Phase 2)

// Vercel serverless function configuration
export const config = {
  maxDuration: 30  // 30 second timeout for chat (streaming responses)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { message, conversationType, context } = req.body;
  
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Track whether we successfully completed the stream
  let streamCompleted = false;
  
  try {
    const systemPrompt = buildVanessaSystemPrompt(context, conversationType);

    // Filter chat history: only send 'user' and 'assistant' messages to Anthropic API
    // System messages (e.g., "Meal plan generated") are kept locally for UI display only
    const filteredHistory = context.chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-20);

    const messages = [
      ...filteredHistory,
      { role: 'user', content: message }
    ];
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages,
        stream: true
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to connect to AI service.' })}\n\n`);
      res.end();
      return;  // Don't increment usage - API call failed
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Append new data to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete events (separated by double newlines)
      const events = buffer.split('\n\n');
      
      // Keep the last incomplete chunk in buffer
      buffer = events.pop() || '';
      
      for (const event of events) {
        if (!event.trim()) continue;
        
        const lines = event.split('\n');
        let eventType = '';
        let eventData = '';
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6);
          }
        }
        
        // Only process content_block_delta events (these contain the text)
        if (eventType === 'content_block_delta' && eventData) {
          try {
            const parsed = JSON.parse(eventData);
            const text = parsed.delta?.text;
            
            if (text) {
              res.write(`data: ${JSON.stringify({ type: 'token', content: text })}\n\n`);
            }
          } catch (e) {
            console.error('Failed to parse delta:', e, eventData);
          }
        }
        
        // Handle errors from the API
        if (eventType === 'error' && eventData) {
          try {
            const parsed = JSON.parse(eventData);
            console.error('Anthropic stream error:', parsed);
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred while generating response.' })}\n\n`);
          } catch (e) {
            // Ignore parse errors for error events
          }
        }
        
        // Message complete - mark as successful
        if (eventType === 'message_stop') {
          streamCompleted = true;
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        }
      }
    }
    
    // Usage tracking handled client-side after successful stream completion
    
    // Ensure we send done event even if message_stop wasn't received
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Chat error:', error);
    logError('chat', error, { visitorId: context.baseSpecification?.visitorId });
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Something went wrong. Please try again.' })}\n\n`);
    res.end();
    // Don't increment usage - request failed
  }
}

function buildVanessaSystemPrompt(context, conversationType) {
  const { baseSpecification, eaters, currentMealPlan, recipes } = context;
  const isOnboarding = !baseSpecification || !baseSpecification.onboardingComplete;
  
  if (isOnboarding) {
    return `You are Vanessa, a friendly meal planning assistant helping a new user set up their profile.

## YOUR GOAL
Collect the 5-6 essential pieces of information needed to generate their first meal plan:
1. Dietary goals (what they want to achieve)
2. Foods they don't eat or want to avoid
3. Household members (especially children with different needs)
4. Weekly grocery budget
5. Shopping day (which day they do groceries)

## CONVERSATION STYLE
- Ask ONE question at a time
- Be warm and encouraging
- Keep responses short (2-3 sentences)
- After collecting all essential info, say "Click Generate whenever you're ready!"

## IMPORTANT
- Don't ask about cooking equipment, time constraints, or detailed preferences yet
- Those can be collected AFTER the first meal plan
- Goal is to get them to their first plan in ~3 minutes
- The Generate button is always visible - user clicks when ready`;
  }
  
  const ownerEater = eaters.find(e => e.eaterId === baseSpecification.ownerEaterId);
  const householdEaters = eaters.filter(e => 
    baseSpecification.householdEaterIds.includes(e.eaterId)
  );
  
  return `You are Vanessa, a friendly meal planning assistant.

## USER'S PROFILE
Name: ${ownerEater?.name || 'User'}
Preferences: ${ownerEater?.preferences || 'Not specified'}
Schedule: ${ownerEater?.schedule || 'Available all meals'}
Budget: $${baseSpecification.weeklyBudget}/week
Shopping Day: ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][baseSpecification.shoppingDay]}

## HOUSEHOLD MEMBERS
${householdEaters.map(e => `- ${e.name}: ${e.preferences} (${e.schedule})`).join('\n')}

## RECIPE LIBRARY
${recipes.length} recipes available. Top rated: ${recipes.filter(r => r.rating >= 4).map(r => r.name).slice(0, 5).join(', ') || 'None yet'}

${currentMealPlan ? `
## CURRENT MEAL PLAN
Week: ${currentMealPlan.weekOf} to ${currentMealPlan.weekEnd}
Budget Used: $${currentMealPlan.budget.estimated} of $${currentMealPlan.budget.target}
` : ''}

## YOUR ROLE
- Help plan weekly meals through natural conversation
- Answer cooking and nutrition questions
- Update their profile when they request changes (WITH CONFIRMATION)

## PROFILE UPDATE FLOW
When user requests a profile change:
1. Clarify what they want to change
2. Summarize the change
3. Ask "Confirm?" explicitly
4. Only after they confirm, acknowledge the change is saved

## GENERATION FLOW
- The Generate button is always visible
- If user wants to add weekly preferences, help them specify
- Say "Click Generate whenever you're ready!" when done
- Don't ask "Would you like me to generate?" - the button is always there

## IMPORTANT RULES
- Week runs from shopping day dinner to next shopping day lunch (8 calendar days, 21 meals)
- No partial regeneration - it's all or nothing
- Keep responses concise (2-3 sentences typically)
- Maximum 2 questions at once
- Consider all household members' needs`;
}
```

---

#### POST /api/generate-meal-plan

**Purpose:** Generate complete weekly meal plan

**Request:**
```javascript
{
  baseSpecification: object,
  eaters: array,
  recipes: array,  // Existing recipes for potential reuse
  weeklyPreferences: {
    useIngredients: ['cabbage'],
    specialRequests: ['Maya wants pasta twice'],
    avoidThisWeek: [],
    budgetAdjustment: null
  },
  conversationSummary: string
}
```

**Response:**
```javascript
{
  success: true,
  mealPlan: {
    weekOf: '2025-12-21',
    weekEnd: '2025-12-28',
    mealIds: [...],
    budget: { target: 150, estimated: 142.50, status: 'under' },
    shopping: [...]
  },
  newMeals: [...],      // Meal objects to save
  newRecipes: [...]     // Only recipes that didn't exist before
}
```

**Implementation:**
```javascript
// api/generate-meal-plan.js

// NOTE: Usage tracking is handled client-side (see Known Limitations in Section 7)
// Server trusts client for MVP-A. Proper enforcement requires auth + server DB (Phase 2)

// Vercel serverless function configuration
// Hobby plan: 10s max, Pro plan: 60s max
// Generation typically takes 15-30 seconds, so Pro plan is required
export const config = {
  maxDuration: 60  // 60 second timeout for Vercel Pro
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { baseSpecification, eaters, recipes, weeklyPreferences, conversationSummary } = req.body;
  
  try {
    const systemPrompt = buildGenerationPrompt(baseSpecification, eaters, recipes, weeklyPreferences);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { 
            role: 'user', 
            content: `Generate my meal plan. Context: ${conversationSummary}\n\nOutput ONLY valid JSON starting with {` 
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return res.status(502).json({
        success: false,
        error: 'Failed to connect to AI service. Please try again.'
      });
      // Don't increment usage - API call failed
    }
    
    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON response with robust error handling
    let generatedPlan;
    try {
      generatedPlan = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw content preview:', content.substring(0, 500));
      
      // Try to extract JSON if Claude added explanation text before/after
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          generatedPlan = JSON.parse(jsonMatch[0]);
          console.log('Recovered JSON from partial match');
        } catch (secondParseError) {
          // Log for debugging and throw specific error
          logError('json_parse', secondParseError, { 
            contentPreview: content.substring(0, 200),
            visitorId: baseSpecification.visitorId
          });
          throw new Error('PARSE_ERROR: AI response was not valid JSON');
        }
      } else {
        logError('json_parse', parseError, { 
          contentPreview: content.substring(0, 200),
          visitorId: baseSpecification.visitorId
        });
        throw new Error('PARSE_ERROR: AI response was not valid JSON');
      }
    }

    // Validate required fields in the parsed response
    if (!generatedPlan.meals || !Array.isArray(generatedPlan.meals)) {
      logError('invalid_response', new Error('Missing meals array'), {
        visitorId: baseSpecification.visitorId,
        keys: Object.keys(generatedPlan)
      });
      throw new Error('INVALID_RESPONSE: Generated plan missing required meals array');
    }
    
    if (generatedPlan.meals.length === 0) {
      logError('invalid_response', new Error('Empty meals array'), {
        visitorId: baseSpecification.visitorId
      });
      throw new Error('INVALID_RESPONSE: Generated plan has no meals');
    }

    // Transform into our normalized structure
    const { mealPlan, meals, newRecipes } = transformGeneratedPlan(
      generatedPlan, 
      baseSpecification, 
      eaters,
      recipes,
      weeklyPreferences
    );
    
    // Usage tracking handled client-side after successful response
    
    res.status(200).json({
      success: true,
      mealPlan,
      newMeals: meals,
      newRecipes
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    logError('generation', error, { visitorId: baseSpecification.visitorId });
    
    // Provide specific error messages based on error type
    let userMessage = 'Could not generate meal plan. Please try again.';
    let statusCode = 500;
    
    if (error.message.startsWith('PARSE_ERROR')) {
      userMessage = 'The AI response was malformed. Please try again.';
      statusCode = 502;  // Bad Gateway - upstream issue
    } else if (error.message.startsWith('INVALID_RESPONSE')) {
      userMessage = 'The AI generated an incomplete plan. Please try again.';
      statusCode = 502;
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      userMessage = 'The request took too long. Please try again.';
      statusCode = 504;  // Gateway Timeout
    }
    
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      // Include error type for client-side handling (e.g., auto-retry logic)
      errorType: error.message.split(':')[0] || 'UNKNOWN_ERROR'
    });
  }
}

function buildGenerationPrompt(baseSpecification, eaters, recipes, weeklyPreferences) {
  const ownerEater = eaters.find(e => e.eaterId === baseSpecification.ownerEaterId);
  const householdEaters = eaters.filter(e => 
    baseSpecification.householdEaterIds.includes(e.eaterId)
  );
  
  const existingRecipeNames = recipes.map(r => ({
    recipeId: r.recipeId,
    name: r.name,
    rating: r.rating,
    timesCooked: r.timesCooked
  }));
  
  return `You are a meal planning AI. Generate a complete weekly meal plan as JSON.

## EATERS
${householdEaters.map(e => `
### ${e.name}
- Preferences: ${e.preferences}
- Schedule: ${e.schedule}
- Allergies: ${e.allergies?.join(', ') || 'None'}
`).join('\n')}

## SETTINGS
- Budget: $${baseSpecification.weeklyBudget}
- Shopping Day: ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][baseSpecification.shoppingDay]}
- Store: ${baseSpecification.preferredStore || 'Not specified'}

## WEEKLY PREFERENCES
- Use ingredients: ${weeklyPreferences.useIngredients?.join(', ') || 'None specified'}
- Special requests: ${weeklyPreferences.specialRequests?.join(', ') || 'None'}
- Avoid this week: ${weeklyPreferences.avoidThisWeek?.join(', ') || 'None'}

## EXISTING RECIPES (reuse when appropriate)
${existingRecipeNames.map(r => `- ${r.name} (ID: ${r.recipeId}, rating: ${r.rating || 'unrated'}, cooked ${r.timesCooked}x)`).join('\n') || 'None yet'}

## OUTPUT FORMAT
Return a JSON object with:
{
  "meals": [
    {
      "date": "2025-12-21",
      "slot": "dinner",
      "eaterIds": ["eater_roland", "eater_maya"],
      "time": "5:30 PM",
      "recipe": {
        "recipeId": "existing_recipe_001" OR null if new,
        "name": "Recipe Name",
        "category": "dinner",
        "cuisine": "mediterranean",
        "servings": 2,
        "prepTime": 15,
        "cookTime": 20,
        "ingredients": [
          { "item": "Salmon fillet", "quantity": "150g", "category": "protein" }
        ],
        "steps": ["Step 1", "Step 2"],
        "tags": ["quick", "kid-friendly"]
      }
    }
  ],
  "shopping": [
    {
      "cat": "Produce",
      "items": [
        { "name": "Cabbage (1 head)", "price": 3.50, "aisle": 1 }
      ]
    }
  ],
  "budget": {
    "target": 150,
    "estimated": 138.50,
    "status": "under"
  }
}

## RULES
1. Week runs from shopping day dinner to next shopping day lunch (8 calendar days, 21 meals: 7 breakfasts + 7 lunches + 7 dinners)
2. Respect each eater's schedule (don't plan meals when they're not present)
3. REUSE existing recipes when appropriate (reference by recipeId)
4. Only create new recipes when needed
5. Optimize ingredient overlap to minimize waste
6. Stay within budget
7. Include variety while respecting preferences`;
}

/**
 * transformGeneratedPlan
 * 
 * Converts Claude's denormalized output (recipes embedded in meals) into 
 * the normalized storage format (recipes stored separately, referenced by ID).
 * 
 * @param {Object} generatedPlan - Claude's raw JSON output
 * @param {Object} baseSpecification - User's base specification
 * @param {Array} eaters - Household eaters
 * @param {Array} existingRecipes - Current recipe library (for deduplication)
 * @param {Object} weeklyPreferences - Weekly preferences used for this generation
 * @returns {Object} { mealPlan, meals, newRecipes }
 */
function transformGeneratedPlan(generatedPlan, baseSpecification, eaters, existingRecipes, weeklyPreferences) {
  const now = new Date().toISOString();
  const weekOf = generatedPlan.meals[0]?.date || now.split('T')[0];
  
  // Calculate week end (6 days after week start for a full week)
  const weekStart = new Date(weekOf);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  // Track recipes we've seen in this generation (for deduplication within the plan)
  const recipeMap = new Map(); // name -> recipeId
  const newRecipes = [];
  const meals = [];
  const mealIds = [];
  
  // Build a lookup of existing recipes by ID and by name (for fuzzy matching)
  const existingById = new Map(existingRecipes.map(r => [r.recipeId, r]));
  const existingByName = new Map(existingRecipes.map(r => [r.name.toLowerCase(), r]));
  
  for (const meal of generatedPlan.meals) {
    const { date, slot, eaterIds, time, recipe } = meal;
    
    // Generate meal ID: meal_YYYYMMDD_dayabbrev_slotabbrev
    const dateObj = new Date(date);
    const dayAbbrev = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()];
    const slotAbbrev = slot.charAt(0); // b, l, or d
    const mealId = `meal_${date.replace(/-/g, '')}_${dayAbbrev}_${slotAbbrev}`;
    
    // Determine recipe ID (existing, already-seen-this-plan, or new)
    let recipeId;
    
    if (recipe.recipeId && existingById.has(recipe.recipeId)) {
      // Claude referenced an existing recipe by ID - use it
      recipeId = recipe.recipeId;
    } else if (recipeMap.has(recipe.name.toLowerCase())) {
      // Same recipe used earlier in this plan - reuse that ID
      recipeId = recipeMap.get(recipe.name.toLowerCase());
    } else if (existingByName.has(recipe.name.toLowerCase())) {
      // Recipe exists by name match - use existing
      recipeId = existingByName.get(recipe.name.toLowerCase()).recipeId;
      recipeMap.set(recipe.name.toLowerCase(), recipeId);
    } else {
      // New recipe - generate ID and create it
      recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      recipeMap.set(recipe.name.toLowerCase(), recipeId);
      
      const newRecipe = {
        _schemaVersion: 1,
        recipeId,
        name: recipe.name,
        category: recipe.category || slot,
        cuisine: recipe.cuisine || null,
        servings: recipe.servings || 2,
        prepTime: recipe.prepTime || null,
        cookTime: recipe.cookTime || null,
        totalTime: (recipe.prepTime || 0) + (recipe.cookTime || 0) || null,
        difficulty: recipe.difficulty || 'medium',
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        
        // Initialize usage tracking
        timesCooked: 0,
        lastCooked: null,
        rating: null,
        notes: '',
        isFavorite: false,
        tags: recipe.tags || [],
        
        // Metadata
        createdAt: now,
        createdBy: 'generation'
      };
      
      newRecipes.push(newRecipe);
    }
    
    // Create normalized meal object
    const normalizedMeal = {
      _schemaVersion: 1,
      mealId,
      recipeId,
      date,
      slot,
      eaterIds: eaterIds || [baseSpecification.ownerEaterId],
      time: time || null,
      cooked: false,
      notes: ''
    };
    
    meals.push(normalizedMeal);
    mealIds.push(mealId);
  }
  
  // Build meal plan object
  const mealPlanId = `plan_${weekOf.replace(/-/g, '')}`;
  const mealPlan = {
    _schemaVersion: 1,
    mealPlanId,
    weekOf,
    weekEnd: weekEndStr,
    createdBy: baseSpecification.ownerEaterId,
    generatedAt: now,
    mealIds,
    weeklyPreferences: weeklyPreferences || {
      useIngredients: [],
      specialRequests: [],
      avoidThisWeek: [],
      budgetAdjustment: null
    },
    budget: generatedPlan.budget || {
      target: baseSpecification.weeklyBudget,
      estimated: 0,
      status: 'unknown'
    },
    shopping: generatedPlan.shopping || [],
    conversation: null  // Will be populated by caller
  };
  
  return {
    mealPlan,
    meals,
    newRecipes
  };
}
```

**Future Firebase Optimization:**

When migrating to Firebase, restructure so the server fetches context from the database rather than receiving it all from the client:

```javascript
// Current approach (localStorage): Client sends everything
{ baseSpecification, eaters, recipes, weeklyPreferences, conversationSummary }

// Future approach (Firebase): Client sends minimal request
{ weeklyPreferences, conversationSummary }

// Server then:
// 1. Reads user's baseSpec + eaters from Firebase (using auth token)
// 2. Reads just recipe names/IDs (not full recipes) for Claude's context
// 3. Calls Claude
// 4. Transforms response using transformGeneratedPlan()
// 5. Batch writes new recipes + meals + meal plan to Firebase
// 6. Returns success + the new meal plan for display
```

This reduces payload size and ensures the server is the single source of truth for data coordination.

---

#### POST /api/extract-recipe

**Purpose:** Extract structured recipe data from pasted text or URL

**Request:**
```javascript
{
  type: 'text' | 'url',
  content: string  // Either pasted recipe text or URL
}
```

**Response:**
```javascript
{
  success: true,
  recipe: {
    name: 'Herb-Crusted Salmon',
    category: 'dinner',
    cuisine: 'mediterranean',
    servings: 2,
    prepTime: 15,
    cookTime: 20,
    ingredients: [
      { item: 'Salmon fillet', quantity: '150g', category: 'protein' }
    ],
    steps: ['Pat salmon dry...', 'Season with salt...'],
    tags: ['quick', 'omega-3']
  }
}
```

**Implementation:**
```javascript
// api/extract-recipe.js

// Vercel serverless function configuration
export const config = {
  maxDuration: 30  // 30 second timeout for recipe extraction
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { type, content } = req.body;
  
  if (!content?.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'No content provided' 
    });
  }
  
  try {
    let recipeText = content;
    
    // If URL, fetch the page content first
    if (type === 'url') {
      try {
        const pageResponse = await fetch(content, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MealPlannerBot/1.0)'
          }
        });
        
        if (!pageResponse.ok) {
          return res.status(400).json({
            success: false,
            error: 'Could not access that URL. The website may be blocking access.'
          });
        }
        
        recipeText = await pageResponse.text();
        
        // Basic HTML to text conversion (strip tags but keep structure)
        recipeText = recipeText
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '\n')
          .replace(/\n\s*\n/g, '\n')
          .trim();
          
        // Limit content length to avoid token limits
        if (recipeText.length > 15000) {
          recipeText = recipeText.substring(0, 15000);
        }
      } catch (fetchError) {
        console.error('URL fetch error:', fetchError);
        return res.status(400).json({
          success: false,
          error: 'Could not access that URL. Please check the link and try again.'
        });
      }
    }
    
    // Use Claude to extract structured recipe data
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are a recipe extraction assistant. Extract recipe information from the provided text and return it as JSON.

Return ONLY valid JSON in this exact format:
{
  "name": "Recipe Name",
  "category": "breakfast|lunch|dinner|snack",
  "cuisine": "italian|mexican|asian|mediterranean|american|other",
  "servings": 2,
  "prepTime": 15,
  "cookTime": 20,
  "ingredients": [
    { "item": "ingredient name", "quantity": "amount with unit", "category": "protein|produce|dairy|pantry|herbs|fats|other" }
  ],
  "steps": ["Step 1 instruction", "Step 2 instruction"],
  "tags": ["tag1", "tag2"]
}

Rules:
- Extract as much information as possible from the text
- If servings not specified, default to 2
- If times not specified, estimate based on recipe complexity or leave as null
- Clean up ingredient formatting (e.g., "2 tablespoons" not "2 tbsp.")
- Number steps if not already numbered
- Generate 2-4 relevant tags (e.g., quick, vegetarian, kid-friendly, healthy, comfort-food)
- If you cannot identify a recipe in the text, return: {"error": "No recipe found"}`,
        messages: [
          { 
            role: 'user', 
            content: `Extract the recipe from this text:\n\n${recipeText}` 
          }
        ]
      })
    });
    
    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return res.status(502).json({
        success: false,
        error: 'Failed to process recipe. Please try again.'
      });
    }
    
    const data = await response.json();
    const extractedText = data.content[0].text;
    
    // Parse the JSON response
    let recipe;
    try {
      recipe = JSON.parse(extractedText);
    } catch (parseError) {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response');
      }
    }
    
    if (recipe.error) {
      return res.status(400).json({
        success: false,
        error: recipe.error
      });
    }
    
    res.status(200).json({
      success: true,
      recipe
    });
    
  } catch (error) {
    console.error('Extract recipe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract recipe. Please try again.'
    });
  }
}
```

---

#### POST /api/update-specification

**Purpose:** Update base specification (after user confirmation in chat)

**Request:**
```javascript
{
  updates: {
    weeklyBudget: 175,
    // ... any fields
  }
}
```

**Response:**
```javascript
{
  success: true,
  updatedFields: ['weeklyBudget'],
  updatedAt: '2025-12-18T10:30:00.000Z'
}
```

---

## 4. UI STYLING (TAILWIND)

### Design Intent

- Clean, modern, friendly
- Content-first (image + card based UI)
- Neutral backgrounds with a single warm accent
- Rounded components, soft shadows
- Mobile-first, touch-friendly

### Color System

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | #F7F8F6 | App background |
| `surface` | #FFFFFF | Cards, sheets |
| `border` | #E6E7E4 | Inputs, dividers |
| `text-primary` | #1C1C1C | Main text |
| `text-secondary` | #6B6B6B | Supporting text |
| `text-muted` | #9A9A9A | Meta text |
| `accent` | #F26B3A | Primary actions |
| `accent-soft` | #FFE6DC | Secondary actions |
| `success` | #4CAF50 | Success state |
| `warning` | #FFB020 | Warning state |

### Typography

- **Font family:** System sans-serif only (no decorative fonts)
- **Hierarchy:** Via size and spacing, not color

| Size | Value |
|------|-------|
| xs | 0.75rem |
| sm | 0.875rem |
| md | 1rem (default) |
| lg | 1.25rem |
| xl | 1.5rem |

### Spacing System (4px-based)

| Token | Value |
|-------|-------|
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 5 | 24px |
| 6 | 32px |

### Border Radius & Shadows

**Border radius:**
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `pill`: 999px

**Shadows:**
- `sm`: 0 2px 6px rgba(0,0,0,0.06)
- `md`: 0 6px 16px rgba(0,0,0,0.08)

### Tailwind Configuration

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],

  theme: {
    extend: {
      colors: {
        bg: "#F7F8F6",
        surface: "#FFFFFF",
        border: "#E6E7E4",

        text: {
          primary: "#1C1C1C",
          secondary: "#6B6B6B",
          muted: "#9A9A9A",
        },

        accent: {
          DEFAULT: "#F26B3A",
          soft: "#FFE6DC",
        },

        success: "#4CAF50",
        warning: "#FFB020",
      },

      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },

      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "999px",
      },

      boxShadow: {
        sm: "0 2px 6px rgba(0,0,0,0.06)",
        md: "0 6px 16px rgba(0,0,0,0.08)",
      },

      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
      },
    },
  },

  plugins: [],
};
```

### Canonical Component Patterns

**Card:**
```html
<div class="bg-surface rounded-lg shadow-sm p-4">
  <!-- content -->
</div>
```

**Image / Recipe Card:**
```html
<div class="bg-surface rounded-lg shadow-sm overflow-hidden">
  <img class="w-full h-44 object-cover" />
  <div class="p-3"><!-- content --></div>
</div>
```

**Primary Button:**
```html
<button class="bg-accent text-white rounded-pill px-4 py-3 font-medium">
  Primary Action
</button>
```

**Secondary Button:**
```html
<button class="bg-accent-soft text-accent rounded-pill px-4 py-3 font-medium">
  Secondary Action
</button>
```

**Input / Search:**
```html
<input class="w-full bg-surface border border-border rounded-pill px-4 py-3" />
```

**Page Layout:**
```html
<div class="min-h-screen bg-bg p-4 pb-20">
  <!-- page content -->
</div>
```

### MVP Constraints (Intentional)

The following are explicitly **out of scope** for MVP:
- Dark mode
- Multiple fonts
- Heavy animation
- Custom Tailwind plugins
- Arbitrary spacing or colors

### AI / Cursor Instructions

When generating UI code:
- Use Tailwind utilities only
- Use tokens defined in this spec
- Prefer composition over custom CSS
- Match spacing, radius, and color exactly
- Do not invent new design tokens

---

## 5. UI COMPONENTS

### Routing

**Approach:** Simple hash-based routing for SPA without server configuration

Hash-based routing (e.g., `/#/generating`) works reliably because:
- No server configuration needed (works with static hosting)
- Browser back/forward buttons work correctly
- Bookmarkable URLs
- Works offline

#### Route Definitions

```javascript
// src/router.js

const routes = {
  '/': HomePage,
  '/generating': GenerationStatusPage,
  '/recipes': RecipeLibrary,
  '/recipes/add': AddRecipePage,
  '/recipe/:id': RecipeDetailPage,
  '/shopping': ShoppingListPage,
  '/day/:date': DayViewPage,
  '/profile': ProfilePage
};

// Current route state
let currentRoute = '/';
let routeParams = {};

/**
 * Initialize router
 * Call once on app startup
 */
function initRouter() {
  // Handle initial route
  handleRouteChange();
  
  // Listen for hash changes (back/forward buttons, manual URL changes)
  window.addEventListener('hashchange', handleRouteChange);
}

/**
 * Navigate to a new route
 * @param {string} path - Route path (e.g., '/generating', '/recipe/recipe_001')
 */
function navigateTo(path) {
  window.location.hash = path;
}

/**
 * Handle route changes
 * Parses the hash, matches route, extracts params, and triggers render
 */
function handleRouteChange() {
  // Get path from hash (remove leading #)
  const hash = window.location.hash.slice(1) || '/';
  
  // Clean up generation interval if navigating away from /generating
  // This prevents memory leaks and state update errors
  if (currentRoute === '/generating' && hash !== '/generating') {
    if (generationState.progressIntervalId) {
      clearInterval(generationState.progressIntervalId);
      generationState.progressIntervalId = null;
    }
    // Reset generation state if leaving mid-generation
    if (generationState.status === 'generating' || generationState.status === 'retrying') {
      generationState.status = 'idle';
      generationState.progress = 0;
    }
  }
  
  // Find matching route
  let matchedRoute = null;
  let params = {};
  
  for (const [pattern, component] of Object.entries(routes)) {
    const match = matchRoute(pattern, hash);
    if (match) {
      matchedRoute = component;
      params = match.params;
      break;
    }
  }
  
  // Default to home if no match
  if (!matchedRoute) {
    matchedRoute = routes['/'];
    params = {};
  }
  
  currentRoute = hash;
  routeParams = params;
  
  // Trigger app re-render
  appState.notifyListeners();
}

/**
 * Match a route pattern against a path
 * Supports :param syntax for dynamic segments
 * 
 * @param {string} pattern - Route pattern (e.g., '/recipe/:id')
 * @param {string} path - Actual path (e.g., '/recipe/recipe_001')
 * @returns {Object|null} - { params: { id: 'recipe_001' } } or null if no match
 */
function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  
  const params = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    
    if (patternPart.startsWith(':')) {
      // Dynamic segment - extract param
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      // Static segment doesn't match
      return null;
    }
  }
  
  return { params };
}

/**
 * Get current route info
 * @returns {Object} - { path: '/recipe/recipe_001', params: { id: 'recipe_001' } }
 */
function getCurrentRoute() {
  return {
    path: currentRoute,
    params: routeParams
  };
}

// Make navigateTo available globally
window.navigateTo = navigateTo;
```

#### Main App Render

```javascript
// src/app.js

function App() {
  const { path, params } = getCurrentRoute();
  
  // Match route to component
  let pageContent;
  
  switch (true) {
    case path === '/':
      pageContent = HomePage();
      break;
    case path === '/generating':
      pageContent = GenerationStatusPage();
      break;
    case path === '/recipes':
      pageContent = RecipeLibrary();
      break;
    case path === '/recipes/add':
      pageContent = AddRecipePage();
      break;
    case path.startsWith('/recipe/'):
      pageContent = RecipeDetailPage(params.id);
      break;
    case path === '/shopping':
      pageContent = ShoppingListPage();
      break;
    case path.startsWith('/day/'):
      pageContent = DayViewPage(params.date);
      break;
    case path === '/profile':
      pageContent = ProfilePage();
      break;
    default:
      pageContent = HomePage();
  }
  
  // Chat widget is available on all pages except /generating
  const showChat = path !== '/generating';
  
  return `
    <div class="app">
      <nav class="app-nav">
        <a href="#/" class="${path === '/' ? 'active' : ''}">Home</a>
        <a href="#/shopping" class="${path === '/shopping' ? 'active' : ''}">Shopping</a>
        <a href="#/recipes" class="${path === '/recipes' ? 'active' : ''}">Recipes</a>
        <a href="#/profile" class="${path === '/profile' ? 'active' : ''}">Profile</a>
      </nav>
      
      ${StorageWarningBanner()}
      
      <main class="app-content">
        ${pageContent}
      </main>
      
      ${showChat ? ChatWidget() : ''}
    </div>
  `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  
  // Check storage health on startup
  const storageHealth = checkStorageHealth();
  if (storageHealth.status === 'critical') {
    console.warn('Storage critical:', storageHealth.message);
  }
  
  // Run recipe cleanup on startup (non-blocking)
  cleanupUnusedRecipes();
  
  // Subscribe to state changes
  appState.subscribe(() => {
    document.getElementById('root').innerHTML = App();
  });
  
  // Initial render
  document.getElementById('root').innerHTML = App();
});
```

#### Route Reference

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Main meal plan view or welcome screen |
| `/generating` | GenerationStatusPage | Generation progress UI (no chat widget) |
| `/recipes` | RecipeLibrary | Browse and search recipes |
| `/recipes/add` | AddRecipePage | Add recipe via paste or URL |
| `/recipe/:id` | RecipeDetailPage | View single recipe details |
| `/shopping` | ShoppingListPage | Shopping list with checkboxes |
| `/day/:date` | DayViewPage | Single day meal view |
| `/profile` | ProfilePage | User settings and base specification |

---

### ChatWidget.js

**Purpose:** Floating chat interface accessible from all pages

#### Desktop Layout (70% content / 30% chat panel)

```
┌─────────────────────────────────────────────────────────────┐
│ PAGE CONTENT                   │ VANESSA PANEL              │
│                                │                            │
│ [Home page, shopping list,     │ ┌────────────────────────┐ │
│  daily view, etc.]             │ │ 👩 Vanessa          │ │
│                                │ │ [Minimize] [X]      │ │
│                                │ └────────────────────────┘ │
│                                │                            │
│                                │ [Chat messages]            │
│                                │ Vanessa: Hi! How can       │
│                                │ I help today?              │
│                                │                            │
│                                │ You: I need to plan        │
│                                │ next week                  │
│                                │                            │
│                                │ [Scrollable area]          │
│                                │                            │
│                                │ ┌────────────────────┐     │
│                                │ │ Type message...    │     │
│                                │ └────────────────────┘     │
│                                │                            │
│                                │ [✨ Generate Plan]         │
│                                │   (always visible)         │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (Full-screen overlay when open)

```
┌──────────────────────────────────┐
│ ← 👩 Vanessa         [X]         │
├──────────────────────────────────┤
│                                  │
│ [Chat messages fill screen]      │
│                                  │
│ Vanessa: Hi! How can I help?     │
│                                  │
│ You: I need to plan next week    │
│                                  │
│ Vanessa: Sure! Any special       │
│ requests?                        │
│                                  │
├──────────────────────────────────┤
│ Type message...             [→]  │
├──────────────────────────────────┤
│      [✨ Generate Plan]          │
│      (always visible)            │
└──────────────────────────────────┘
```

#### Implementation

```javascript
// src/components/ChatWidget.js

import { loadBaseSpecification, loadCurrentMealPlan, loadUsageLimits } from '../utils/storage.js';
import { isMobile, formatTime } from '../utils/helpers.js';
import { chatState } from '../utils/chatState.js';

export function ChatWidget() {
  const baseSpec = loadBaseSpecification();
  const mealPlan = loadCurrentMealPlan();
  const usage = loadUsageLimits();
  const isOffline = !navigator.onLine;
  
  // Determine which conversation to show
  const conversation = mealPlan?.conversation || baseSpec?.conversation || { messages: [] };
  const conversationType = mealPlan ? 'mealPlan' : 'baseSpec';
  
  // Check limits
  const canSendMessage = usage.currentPeriod.messages < usage.limits.messagesPerMonth;
  const canGenerate = usage.currentPeriod.generations < usage.limits.generationsPerMonth;
  
  // Mobile: full screen overlay, Desktop: fixed panel on right
  const containerClasses = isMobile() 
    ? 'fixed inset-0 bg-surface flex flex-col z-50'
    : 'fixed bottom-0 right-0 w-[400px] h-[500px] bg-surface rounded-t-lg shadow-md flex flex-col z-50';
  
  return `
    <div class="${containerClasses}">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="flex items-center gap-2">
          <span class="text-xl">👩</span>
          <span class="font-medium text-text-primary">Vanessa</span>
          ${isOffline ? '<span class="bg-warning text-white text-xs px-2 py-0.5 rounded-pill ml-2">Offline</span>' : ''}
        </div>
        <div class="flex gap-2">
          <button 
            onclick="window.minimizeChat()" 
            class="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg rounded-md"
            aria-label="Minimize"
          >−</button>
          <button 
            onclick="window.closeChat()" 
            class="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg rounded-md"
            aria-label="Close"
          >×</button>
        </div>
      </div>
      
      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="chatMessages">
        ${conversation.messages.map(msg => renderMessage(msg)).join('')}
        
        ${chatState.isStreaming ? `
          <div class="flex">
            <div class="bg-bg rounded-lg rounded-bl-none px-4 py-3 max-w-[80px]">
              <div class="typing-indicator flex gap-1 items-center">
                <span class="w-2 h-2 bg-text-muted rounded-full animate-bounce" style="animation-delay: -0.32s"></span>
                <span class="w-2 h-2 bg-text-muted rounded-full animate-bounce" style="animation-delay: -0.16s"></span>
                <span class="w-2 h-2 bg-text-muted rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-border">
        <div class="text-xs text-text-muted mb-2">
          ${usage.currentPeriod.messages}/${usage.limits.messagesPerMonth} messages
        </div>
        <div class="flex gap-2">
          <textarea 
            id="chatInput" 
            class="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent disabled:bg-bg disabled:text-text-muted"
            rows="2"
            placeholder="${isOffline ? 'Chat unavailable offline' : (canSendMessage ? 'Type a message...' : 'Message limit reached')}"
            onkeydown="window.handleChatKeydown(event)"
            ${isOffline || !canSendMessage ? 'disabled' : ''}
          ></textarea>
          <button 
            onclick="window.sendChatMessage()" 
            class="bg-accent text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            ${isOffline || !canSendMessage ? 'disabled' : ''}
            aria-label="Send message"
          >→</button>
        </div>
      </div>
      
      <!-- Generate Button -->
      <div class="p-4 border-t border-border bg-bg">
        <div class="text-xs text-text-muted mb-2">
          ${usage.currentPeriod.generations}/${usage.limits.generationsPerMonth} generations
        </div>
        <button 
          onclick="window.generateMealPlan()" 
          class="w-full bg-accent text-white rounded-pill py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          ${isOffline || !canGenerate ? 'disabled' : ''}
        >
          ✨ Generate Meal Plan
        </button>
        ${!canGenerate ? '<a href="/upgrade" class="block text-center text-accent text-sm mt-2">Upgrade for more</a>' : ''}
      </div>
    </div>
  `;
}

// Render a single message in the chat UI
// Supports three roles:
// - 'user': Messages from the user (sent to API)
// - 'assistant': Messages from Vanessa (sent to API)
// - 'system': Local-only messages like "Meal plan generated" (NOT sent to API)
function renderMessage(msg) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  
  // User messages: right-aligned, accent background
  // Assistant messages: left-aligned, light background
  // System messages: centered, muted style
  
  if (isSystem) {
    return `
      <div class="flex justify-center">
        <div class="bg-bg text-text-muted text-sm px-3 py-1 rounded-pill">
          ${msg.content}
        </div>
      </div>
    `;
  }
  
  if (isUser) {
    return `
      <div class="flex justify-end">
        <div class="bg-accent text-white rounded-lg rounded-br-none px-4 py-2 max-w-[80%]">
          <div>${msg.content}</div>
          <div class="text-xs opacity-70 mt-1">${formatTime(msg.timestamp)}</div>
        </div>
      </div>
    `;
  }
  
  // Assistant message
  return `
    <div class="flex">
      <div class="bg-bg text-text-primary rounded-lg rounded-bl-none px-4 py-2 max-w-[80%]">
        <div>${msg.content}</div>
        <div class="text-xs text-text-muted mt-1">${formatTime(msg.timestamp)}</div>
      </div>
    </div>
  `;
}
```

**Typing Indicator (custom CSS for animation - add to `src/styles/custom.css`):**

```css
/* Minimal custom CSS for animations not easily done in Tailwind */
@keyframes bounce-dot {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.typing-indicator span {
  animation: bounce-dot 1.4s infinite ease-in-out both;
}
```

#### App State Management

```javascript
// src/utils/appState.js

const appState = {
  listeners: [],
  
  // Transient UI state (not persisted to localStorage)
  recipeSearchQuery: '',
  recipeFilter: 'all',
  
  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback to invoke on state change
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  /**
   * Notify all listeners of state change
   * Call this after any state mutation that should trigger a re-render
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  },
  
  /**
   * Update transient state and notify listeners
   * @param {Object} updates - Key-value pairs to update
   */
  update(updates) {
    Object.assign(this, updates);
    this.notifyListeners();
  }
};

// Make globally available
window.appState = appState;

export default appState;
```

#### Storage Utilities

```javascript
// src/utils/storage.js

// ============================================
// STORAGE QUOTA MANAGEMENT
// ============================================

// Typical localStorage limit is 5-10MB depending on browser
const STORAGE_WARNING_THRESHOLD = 0.8;  // Warn at 80% capacity
const STORAGE_CRITICAL_THRESHOLD = 0.95; // Critical at 95% capacity

/**
 * Get current localStorage usage statistics
 * @returns {Object} { used: bytes, total: estimated bytes, percentage: 0-100 }
 */
export function getStorageUsage() {
  let totalSize = 0;
  
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }
  
  // Estimate total capacity (conservative: 5MB)
  const estimatedTotal = 5 * 1024 * 1024;
  
  return {
    used: totalSize,
    total: estimatedTotal,
    percentage: Math.round((totalSize / estimatedTotal) * 100),
    usedMB: (totalSize / (1024 * 1024)).toFixed(2),
    isWarning: totalSize / estimatedTotal > STORAGE_WARNING_THRESHOLD,
    isCritical: totalSize / estimatedTotal > STORAGE_CRITICAL_THRESHOLD
  };
}

/**
 * Safe save wrapper that handles QuotaExceededError
 * @param {string} key - localStorage key
 * @param {any} data - Data to save (will be JSON stringified)
 * @returns {Object} { success: boolean, error?: string, freedSpace?: boolean }
 */
export function safeSave(key, data) {
  const jsonData = JSON.stringify(data);
  
  try {
    localStorage.setItem(key, jsonData);
    return { success: true };
  } catch (error) {
    // Check if it's a quota error
    if (error.name === 'QuotaExceededError' || 
        error.code === 22 || // Legacy Chrome
        error.code === 1014) { // Firefox
      
      console.warn('localStorage quota exceeded, attempting cleanup...');
      
      // Try to free space and retry
      const freedSpace = emergencyStorageCleanup();
      
      if (freedSpace) {
        try {
          localStorage.setItem(key, jsonData);
          return { success: true, freedSpace: true };
        } catch (retryError) {
          // Still failed after cleanup
          return { 
            success: false, 
            error: 'Storage is full. Please export your data and clear old meal plans.',
            freedSpace: true
          };
        }
      }
      
      return { 
        success: false, 
        error: 'Storage is full. Please export your data and clear old meal plans.' 
      };
    }
    
    // Some other error
    console.error('Storage error:', error);
    return { success: false, error: 'Failed to save data.' };
  }
}

/**
 * Emergency cleanup when storage is full
 * Removes data in priority order (least important first)
 * @returns {boolean} True if space was freed
 */
function emergencyStorageCleanup() {
  let freedSpace = false;
  
  // Priority 1: Clear error log (least important)
  if (localStorage.getItem('errorLog')) {
    localStorage.removeItem('errorLog');
    freedSpace = true;
    console.log('Cleared error log to free space');
  }
  
  // Priority 2: Clear usage log (can be regenerated)
  if (localStorage.getItem('usageLog')) {
    localStorage.removeItem('usageLog');
    freedSpace = true;
    console.log('Cleared usage log to free space');
  }
  
  // Priority 3: Trim conversation history (keep last 10 messages each)
  freedSpace = trimConversationHistory() || freedSpace;
  
  // Priority 4: Run aggressive recipe cleanup
  freedSpace = aggressiveRecipeCleanup() || freedSpace;
  
  // Priority 5: Clear old meals (keep only current week)
  freedSpace = clearOldMeals() || freedSpace;
  
  return freedSpace;
}

/**
 * Trim conversation history to last 10 messages
 */
function trimConversationHistory() {
  let freed = false;
  
  // Trim base spec conversation
  const baseSpec = loadBaseSpecification();
  if (baseSpec?.conversation?.messages?.length > 10) {
    baseSpec.conversation.messages = baseSpec.conversation.messages.slice(-10);
    localStorage.setItem('baseSpecification', JSON.stringify(baseSpec));
    freed = true;
    console.log('Trimmed base spec conversation');
  }
  
  // Trim meal plan conversation
  const mealPlan = loadCurrentMealPlan();
  if (mealPlan?.conversation?.messages?.length > 10) {
    mealPlan.conversation.messages = mealPlan.conversation.messages.slice(-10);
    localStorage.setItem('currentMealPlan', JSON.stringify(mealPlan));
    freed = true;
    console.log('Trimmed meal plan conversation');
  }
  
  return freed;
}

/**
 * Aggressive recipe cleanup - delete all generated recipes not used in current plan
 */
function aggressiveRecipeCleanup() {
  const recipes = loadRecipes();
  const mealPlan = loadCurrentMealPlan();
  const meals = loadMeals();
  
  // Get recipe IDs used in current meal plan
  const currentRecipeIds = new Set();
  if (mealPlan?.mealIds) {
    for (const mealId of mealPlan.mealIds) {
      const meal = meals.find(m => m.mealId === mealId);
      if (meal) {
        currentRecipeIds.add(meal.recipeId);
      }
    }
  }
  
  const originalCount = recipes.length;
  
  // Keep: favorites, manually added, imported, or used in current plan
  const keepRecipes = recipes.filter(recipe => {
    if (recipe.isFavorite) return true;
    if (recipe.createdBy === 'manual' || recipe.createdBy === 'import') return true;
    if (currentRecipeIds.has(recipe.recipeId)) return true;
    if (recipe.timesCooked > 0) return true;
    return false;
  });
  
  if (keepRecipes.length < originalCount) {
    localStorage.setItem('recipes', JSON.stringify(keepRecipes));
    console.log(`Aggressive cleanup: removed ${originalCount - keepRecipes.length} unused recipes`);
    return true;
  }
  
  return false;
}

/**
 * Clear old meals not in current plan
 */
function clearOldMeals() {
  const meals = loadMeals();
  const mealPlan = loadCurrentMealPlan();
  
  if (!mealPlan?.mealIds) return false;
  
  const currentMealIds = new Set(mealPlan.mealIds);
  const originalCount = meals.length;
  
  const currentMeals = meals.filter(meal => currentMealIds.has(meal.mealId));
  
  if (currentMeals.length < originalCount) {
    localStorage.setItem('meals', JSON.stringify(currentMeals));
    console.log(`Cleared ${originalCount - currentMeals.length} old meals`);
    return true;
  }
  
  return false;
}

/**
 * Check storage and notify user if running low
 * Call this on app startup and after saves
 */
export function checkStorageHealth() {
  const usage = getStorageUsage();
  
  if (usage.isCritical) {
    return {
      status: 'critical',
      message: `Storage almost full (${usage.percentage}%). Please export your data or remove old meal plans.`,
      usage
    };
  }
  
  if (usage.isWarning) {
    return {
      status: 'warning', 
      message: `Storage is ${usage.percentage}% full. Consider removing unused recipes.`,
      usage
    };
  }
  
  return { status: 'ok', usage };
}

// ============================================
// EATERS
// ============================================

export function loadEaters() {
  const data = localStorage.getItem('eaters');
  return data ? JSON.parse(data) : [];
}

export function saveEaters(eaters) {
  return safeSave('eaters', eaters);
}

export function getEaterCount() {
  return loadEaters().length;
}

// ============================================
// RECIPES
// ============================================

export function loadRecipes() {
  const data = localStorage.getItem('recipes');
  return data ? JSON.parse(data) : [];
}

export function saveRecipes(recipes) {
  return safeSave('recipes', recipes);
}

// ============================================
// MEALS
// ============================================

export function loadMeals() {
  const data = localStorage.getItem('meals');
  return data ? JSON.parse(data) : [];
}

export function saveMeals(meals) {
  return safeSave('meals', meals);
}

// ============================================
// MEAL PLANS
// ============================================

export function loadCurrentMealPlan() {
  const data = localStorage.getItem('currentMealPlan');
  return data ? JSON.parse(data) : null;
}

export function saveCurrentMealPlan(mealPlan) {
  return safeSave('currentMealPlan', mealPlan);
}

// ============================================
// BASE SPECIFICATION
// ============================================

export function loadBaseSpecification() {
  const data = localStorage.getItem('baseSpecification');
  return data ? JSON.parse(data) : null;
}

export function saveBaseSpecification(baseSpec) {
  return safeSave('baseSpecification', baseSpec);
}

// ============================================
// USAGE LIMITS
// ============================================

export function loadUsageLimits() {
  const data = localStorage.getItem('usageLimits');
  if (data) {
    return JSON.parse(data);
  }
  
  // Default for new users
  return {
    visitorId: `visitor_${Date.now()}`,
    plan: 'free',
    limits: {
      generationsPerMonth: 4,
      messagesPerMonth: 100,
      maxEaters: 2
    },
    currentPeriod: {
      startDate: new Date().toISOString().split('T')[0],
      generations: 0,
      messages: 0
    }
  };
}

export function saveUsageLimits(usage) {
  return safeSave('usageLimits', usage);
}

// ============================================
// USAGE LOG
// ============================================

export function loadUsageLog() {
  const data = localStorage.getItem('usageLog');
  return data ? JSON.parse(data) : [];
}

export function saveUsageLog(log) {
  // Usage log is low priority - don't worry if it fails
  try {
    localStorage.setItem('usageLog', JSON.stringify(log));
  } catch (e) {
    console.warn('Could not save usage log (storage may be full)');
  }
}

// ============================================
// ERROR LOG
// ============================================

export function loadErrorLog() {
  const data = localStorage.getItem('errorLog');
  return data ? JSON.parse(data) : [];
}

export function saveErrorLog(log) {
  // Error log is low priority - don't worry if it fails
  try {
    localStorage.setItem('errorLog', JSON.stringify(log));
  } catch (e) {
    console.warn('Could not save error log (storage may be full)');
  }
}
```

#### Helper Functions

```javascript
// src/utils/helpers.js

/**
 * Check if the app is running on a mobile device
 * @returns {boolean} True if viewport width < 768px
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Format a timestamp for display in chat messages
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time (e.g., "2:30 pm")
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Format a date string for display
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date (e.g., "Dec 19")
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format a date string to show day name
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Day name (e.g., "Saturday")
 */
export function formatDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { 
    weekday: 'long' 
  });
}

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before calling
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a unique ID
 * @param {string} prefix - Prefix for the ID (e.g., "recipe", "meal")
 * @returns {string} Unique ID (e.g., "recipe_1702987234567_a1b2c3")
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

#### Window Event Handlers

```javascript
// src/utils/windowHandlers.js

import appState from './appState.js';
import { chatState } from './chatState.js';
import { navigateTo } from './router.js';
import { checkUsageLimits, incrementMessageCount } from './usage.js';
import { loadRecipes, saveRecipes } from './storage.js';
import { debounce } from './helpers.js';

// ============================================
// CHAT HANDLERS
// ============================================

window.toggleChat = function() {
  if (chatState.isOpen) {
    chatState.closeChat();
  } else {
    chatState.openChat();
  }
};

window.minimizeChat = function() {
  chatState.isMinimized = true;
  appState.notifyListeners();
};

window.closeChat = function() {
  chatState.closeChat();
};

window.handleChatKeydown = function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    window.sendChatMessage();
  }
};

window.sendChatMessage = async function() {
  const input = document.getElementById('chatInput');
  const message = input?.value?.trim();
  
  if (!message || chatState.sendDisabled) return;
  
  // Check limits before sending
  const usage = checkUsageLimits();
  if (usage.messagesRemaining <= 0) {
    window.showUpgradePrompt('messages');
    return;
  }
  
  // Clear input
  input.value = '';
  
  // Add user message to conversation
  chatState.addMessage('user', message);
  
  // Disable send and show typing indicator
  chatState.disableSendTemporarily();
  chatState.startStreaming();
  appState.notifyListeners();
  
  // Set up timeout for chat request (25 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  try {
    // Send to API and stream response
    const response = await fetch('/api/chat-with-vanessa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationType: chatState.getConversationType(),
        context: chatState.buildContext()
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    await chatState.handleStreamResponse(response);
    
    // Only increment on successful completion
    incrementMessageCount();
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Chat error:', error);
    
    if (error.name === 'AbortError') {
      chatState.addMessage('assistant', 'Sorry, that took too long. Please try again.');
    } else {
      chatState.addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }
  } finally {
    chatState.stopStreaming();
    appState.notifyListeners();
  }
};

// ============================================
// RECIPE LIBRARY HANDLERS
// ============================================

// Debounced search to avoid excessive re-renders
// Wait 400ms after user stops typing before triggering re-render
window.searchRecipes = debounce(function(query) {
  appState.recipeSearchQuery = query;
  appState.notifyListeners();
}, 400);

window.filterRecipes = function(filter) {
  appState.recipeFilter = filter;
  appState.notifyListeners();
};

window.viewRecipe = function(recipeId) {
  navigateTo(`/recipe/${recipeId}`);
};

window.toggleFavorite = function(recipeId) {
  const recipes = loadRecipes();
  const recipe = recipes.find(r => r.recipeId === recipeId);
  if (recipe) {
    recipe.isFavorite = !recipe.isFavorite;
    saveRecipes(recipes);
    appState.notifyListeners();
  }
};

window.rateRecipe = function(recipeId, rating) {
  const recipes = loadRecipes();
  const recipe = recipes.find(r => r.recipeId === recipeId);
  if (recipe) {
    recipe.rating = rating;
    saveRecipes(recipes);
    appState.notifyListeners();
  }
};

// ============================================
// NAVIGATION HANDLERS
// ============================================

window.goBack = function() {
  window.history.back();
};

window.goHome = function() {
  navigateTo('/');
};

// ============================================
// ADD RECIPE HANDLERS
// ============================================

window.setAddRecipeMode = function(mode) {
  addRecipeState.mode = mode;
  addRecipeState.error = null;
  appState.notifyListeners();
};

window.updateAddRecipePasteText = function(text) {
  addRecipeState.pasteText = text;
};

window.updateAddRecipeUrl = function(url) {
  addRecipeState.urlText = url;
};

window.updateExtractedRecipeField = function(field, value) {
  if (addRecipeState.extractedRecipe) {
    addRecipeState.extractedRecipe[field] = value;
  }
};

// ============================================
// GENERATION HANDLERS
// ============================================

window.startGeneration = function() {
  // Import and call the generation handler
  import('./generateHandler.js').then(module => {
    module.startGeneration();
  });
};

window.retryGeneration = function() {
  import('./generateHandler.js').then(module => {
    module.retryGeneration();
  });
};

window.cancelGeneration = function() {
  import('./generateHandler.js').then(module => {
    module.cancelGeneration();
  });
};

// Note: The actual cancelGeneration implementation is in GenerationStatusPage.js
// It aborts the in-flight request, cleans up state, and navigates home

// ============================================
// UPGRADE PROMPT
// ============================================

window.showUpgradePrompt = function(limitType) {
  const messages = {
    messages: 'You\'ve reached your monthly message limit.',
    generations: 'You\'ve reached your monthly meal plan limit.',
    eaters: 'You\'ve reached your household member limit.'
  };
  
  const message = messages[limitType] || 'You\'ve reached a usage limit.';
  
  // Show modal or navigate to upgrade page
  if (confirm(`${message}\n\nUpgrade to Pro for more?`)) {
    navigateTo('/upgrade');
  }
};

// ============================================
// UTILITY HANDLERS
// ============================================

window.copyToClipboard = async function(text) {
  try {
    await navigator.clipboard.writeText(text);
    // Show brief success toast
    showToast('Copied to clipboard');
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}
```

#### Chat State Management

```javascript
// src/utils/chatState.js

import appState from './appState.js';
import { 
  loadCurrentMealPlan, 
  saveCurrentMealPlan, 
  loadBaseSpecification, 
  saveBaseSpecification,
  loadUsageLimits 
} from './storage.js';

const chatState = {
  isOpen: false,
  sendDisabled: false,
  isGenerating: false,
  isStreaming: false,  // True while waiting for/receiving AI response

  openChat() {
    this.isOpen = true;
    appState.notifyListeners();
  },
  
  startStreaming() {
    this.isStreaming = true;
    appState.notifyListeners();
  },
  
  stopStreaming() {
    this.isStreaming = false;
    appState.notifyListeners();
  },

  closeChat() {
    this.isOpen = false;
    appState.notifyListeners();
  },
  
  // Get current conversation based on context
  getCurrentConversation() {
    const mealPlan = loadCurrentMealPlan();
    const baseSpec = loadBaseSpecification();
    
    if (mealPlan?.conversation) {
      return { type: 'mealPlan', conversation: mealPlan.conversation };
    }
    if (baseSpec?.conversation) {
      return { type: 'baseSpec', conversation: baseSpec.conversation };
    }
    
    // Initialize new conversation
    return { 
      type: 'baseSpec', 
      conversation: { 
        startedAt: new Date().toISOString(), 
        messages: [] 
      } 
    };
  },
  
  addMessage(role, content) {
    const { type, conversation } = this.getCurrentConversation();
    
    const msg = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(msg);
    
    // Save to appropriate location
    if (type === 'mealPlan') {
      const mealPlan = loadCurrentMealPlan();
      mealPlan.conversation = conversation;
      saveCurrentMealPlan(mealPlan);
    } else {
      const baseSpec = loadBaseSpecification();
      baseSpec.conversation = conversation;
      saveBaseSpecification(baseSpec);
    }
    
    appState.notifyListeners();
  },
  
  // Rate limiting
  disableSendTemporarily() {
    this.sendDisabled = true;
    setTimeout(() => {
      this.sendDisabled = false;
      appState.notifyListeners();
    }, 2000);
  }
};

/**
 * extractWeeklyPreferences
 * 
 * For MVP, returns a default structure. The actual preference extraction
 * happens via the conversation summary passed to Claude's generation prompt.
 * 
 * Future enhancement: Parse conversation for structured data like
 * "use up cabbage" → useIngredients: ['cabbage']
 * 
 * @param {Object} conversation - The current conversation object
 * @returns {Object} Weekly preferences structure
 */
function extractWeeklyPreferences(conversation) {
  // For MVP, return empty defaults
  // Claude will interpret preferences from the conversation summary
  return {
    useIngredients: [],
    specialRequests: [],
    avoidThisWeek: [],
    budgetAdjustment: null
  };
}

/**
 * summarizeConversation
 * 
 * Concatenates recent conversation messages into a string for Claude.
 * Focuses on user messages since those contain the actual requests.
 * 
 * @param {Object} conversation - The current conversation object
 * @returns {string} Conversation summary for generation context
 */
function summarizeConversation(conversation) {
  if (!conversation?.messages?.length) {
    return 'No specific requests for this week.';
  }
  
  // Get last 10 messages (enough context without overwhelming)
  const recentMessages = conversation.messages.slice(-10);
  
  // Format as a simple dialogue
  const summary = recentMessages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => {
      const speaker = msg.role === 'user' ? 'User' : 'Vanessa';
      return `${speaker}: ${msg.content}`;
    })
    .join('\n');
  
  return summary || 'No specific requests for this week.';
}

/**
 * Generation handler
 * 
 * Closes the chat and delegates to startGeneration() which handles
 * the full flow including progress UI, retries, and navigation.
 */
window.generateMealPlan = function() {
  if (chatState.isGenerating) return;
  
  // Close chat panel
  chatState.closeChat();
  
  // Start generation (handles everything from here)
  startGeneration();
};
```

---

### HomePage.js

```javascript
// src/components/HomePage.js

export function HomePage() {
  const mealPlan = loadCurrentMealPlan();
  const baseSpec = loadBaseSpecification();
  const isOffline = !navigator.onLine;
  
  // New user - no profile yet
  if (!baseSpec || !baseSpec.onboardingComplete) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="max-w-md mx-auto text-center pt-16">
          <h1 class="text-xl font-medium text-text-primary mb-3">Welcome to Your Meal Planner</h1>
          <p class="text-text-secondary mb-6">
            Get started by chatting with Vanessa. She'll ask a few quick questions 
            to understand your needs, then you can create your first meal plan.
          </p>
          
          <button 
            onclick="window.toggleChat()" 
            class="w-full bg-accent text-white rounded-pill py-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            ${isOffline ? 'disabled' : ''}
          >
            💬 Chat with Vanessa to Get Started
          </button>
          
          ${isOffline ? '<p class="text-text-muted text-sm mt-4">You\'re offline. Connect to the internet to get started.</p>' : ''}
        </div>
      </div>
    `;
  }
  
  // Has profile but no meal plan
  if (!mealPlan) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="max-w-md mx-auto text-center pt-16">
          <h1 class="text-xl font-medium text-text-primary mb-3">Ready to Plan Your Week</h1>
          <p class="text-text-secondary mb-6">
            Chat with Vanessa to add any special requests, then click Generate.
          </p>
          
          <button 
            onclick="window.toggleChat()" 
            class="w-full bg-accent text-white rounded-pill py-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            ${isOffline ? 'disabled' : ''}
          >
            💬 Plan Your First Week
          </button>
        </div>
      </div>
    `;
  }
  
  // Has meal plan - show it (works offline)
  return renderMealPlanHomePage(mealPlan, baseSpec);
}

/**
 * Render the home page for users with an existing meal plan
 * Shows week overview, day cards, quick actions, and budget status
 */
function renderMealPlanHomePage(mealPlan, baseSpec) {
  const meals = loadMeals();
  const recipes = loadRecipes();
  const eaters = loadEaters();
  const isOffline = !navigator.onLine;
  
  // Group meals by date
  const mealsByDate = {};
  for (const mealId of mealPlan.mealIds) {
    const meal = meals.find(m => m.mealId === mealId);
    if (meal) {
      if (!mealsByDate[meal.date]) {
        mealsByDate[meal.date] = [];
      }
      mealsByDate[meal.date].push(meal);
    }
  }
  
  // Sort dates
  const sortedDates = Object.keys(mealsByDate).sort();
  
  // Calculate progress
  const totalMeals = mealPlan.mealIds.length;
  const cookedMeals = meals.filter(m => 
    mealPlan.mealIds.includes(m.mealId) && m.isCooked
  ).length;
  
  // Find today's date to highlight
  const today = new Date().toISOString().split('T')[0];
  
  return `
    <div class="min-h-screen bg-bg p-4 pb-20">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-xl font-medium text-text-primary">This Week's Meals</h1>
        <p class="text-text-secondary text-sm">
          ${formatDate(mealPlan.weekOf)} – ${formatDate(mealPlan.weekEnd)}
        </p>
      </div>
      
      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="text-sm text-text-secondary mb-1">
          ${cookedMeals} of ${totalMeals} meals cooked
        </div>
        <div class="h-2 bg-border rounded-pill overflow-hidden">
          <div class="h-full bg-accent rounded-pill transition-all" style="width: ${(cookedMeals / totalMeals) * 100}%"></div>
        </div>
      </div>
      
      <!-- Budget Summary -->
      <div class="bg-surface rounded-lg p-3 mb-4 flex items-center justify-between">
        <span class="text-text-secondary text-sm">Budget:</span>
        <div class="flex items-center gap-2">
          <span class="text-text-primary font-medium">
            $${mealPlan.budget?.estimated || '—'} / $${mealPlan.budget?.target || '—'}
          </span>
          <span class="${getBudgetStatusClass(mealPlan.budget?.status)} text-sm">
            ${getBudgetStatusText(mealPlan.budget?.status)}
          </span>
        </div>
      </div>
      
      <!-- Week View - Day Cards -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        ${sortedDates.map(date => {
          const dayMeals = mealsByDate[date];
          const dayName = formatDayName(date);
          const isToday = date === today;
          const allCooked = dayMeals.every(m => m.isCooked);
          
          // Sort by slot
          dayMeals.sort((a, b) => {
            const order = { breakfast: 1, lunch: 2, dinner: 3 };
            return order[a.slot] - order[b.slot];
          });
          
          return `
            <div 
              class="bg-surface rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow ${isToday ? 'ring-2 ring-accent' : ''}"
              onclick="navigateTo('/day/${date}')"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-text-primary">${dayName}</h3>
                <div class="flex items-center gap-1">
                  ${isToday ? '<span class="bg-accent text-white text-xs px-2 py-0.5 rounded-pill">Today</span>' : ''}
                  ${allCooked ? '<span class="text-success">✓</span>' : ''}
                </div>
              </div>
              <div class="space-y-1">
                ${dayMeals.map(meal => {
                  const recipe = recipes.find(r => r.recipeId === meal.recipeId);
                  return `
                    <div class="flex items-center gap-2 text-sm ${meal.isCooked ? 'opacity-60' : ''}">
                      <span>${getSlotIcon(meal.slot)}</span>
                      <span class="text-text-secondary truncate flex-1">${recipe?.name || 'Unknown'}</span>
                      ${meal.isCooked ? '<span class="text-success text-xs">✓</span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Quick Actions -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <button 
          onclick="navigateTo('/shopping')" 
          class="bg-surface rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <span class="text-2xl block mb-1">🛒</span>
          <span class="text-sm text-text-secondary">Shopping</span>
        </button>
        <button 
          onclick="window.toggleChat()" 
          class="bg-surface rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow disabled:opacity-50"
          ${isOffline ? 'disabled' : ''}
        >
          <span class="text-2xl block mb-1">💬</span>
          <span class="text-sm text-text-secondary">Vanessa</span>
        </button>
        <button 
          onclick="navigateTo('/recipes')" 
          class="bg-surface rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-shadow"
        >
          <span class="text-2xl block mb-1">📖</span>
          <span class="text-sm text-text-secondary">Recipes</span>
        </button>
      </div>
      
      ${isOffline ? `
        <div class="bg-warning/10 text-warning rounded-lg p-3 flex items-center gap-2">
          <span>📴</span>
          <span class="text-sm">You're offline. Viewing saved meal plan.</span>
        </div>
      ` : `
        <div class="text-center">
          <p class="text-text-muted text-sm mb-2">Want a different plan?</p>
          <button 
            onclick="window.toggleChat()" 
            class="bg-accent-soft text-accent rounded-pill px-4 py-2 font-medium"
          >
            Chat to modify or regenerate
          </button>
        </div>
      `}
    </div>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

function formatDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { weekday: 'short' });
}

function getSlotIcon(slot) {
  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
  return icons[slot] || '🍽️';
}

function getBudgetStatusText(status) {
  const texts = {
    'under': '✓ Under',
    'on-target': '✓ On target',
    'over': '⚠️ Over'
  };
  return texts[status] || '';
}

function getBudgetStatusClass(status) {
  const classes = {
    'under': 'text-success',
    'on-target': 'text-success',
    'over': 'text-warning'
  };
  return classes[status] || 'text-text-muted';
}
```

---

### RecipeLibrary.js

```javascript
// src/components/RecipeLibrary.js

export function RecipeLibrary() {
  const recipes = loadRecipes();
  const searchQuery = appState.recipeSearchQuery || '';
  const filter = appState.recipeFilter || 'all';
  const isOffline = !navigator.onLine;
  
  let filteredRecipes = recipes;
  
  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredRecipes = filteredRecipes.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.ingredients.some(ing => ing.item.toLowerCase().includes(query)) ||
      r.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  // Apply filter
  if (filter === 'favorites') {
    filteredRecipes = filteredRecipes.filter(r => r.isFavorite);
  } else if (filter === 'high-rated') {
    filteredRecipes = filteredRecipes.filter(r => r.rating >= 4);
  } else if (filter === 'most-cooked') {
    filteredRecipes = filteredRecipes.filter(r => r.timesCooked >= 3);
  }
  
  // Sort by times cooked (most popular first)
  filteredRecipes.sort((a, b) => b.timesCooked - a.timesCooked);
  
  return `
    <div class="min-h-screen bg-bg p-4 pb-20">
      <!-- Header with Add Button -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-medium text-text-primary">Recipe Library</h1>
        <button 
          onclick="navigateTo('/recipes/add')"
          class="bg-accent text-white rounded-pill px-4 py-2 text-sm font-medium disabled:opacity-50"
          ${isOffline ? 'disabled' : ''}
        >
          + Add Recipe
        </button>
      </div>
      
      <!-- Search and Filter -->
      <div class="flex gap-3 mb-4">
        <input 
          type="search" 
          class="flex-1 bg-surface border border-border rounded-pill px-4 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="Search recipes..."
          value="${searchQuery}"
          oninput="window.searchRecipes(this.value)"
        />
        
        <select 
          class="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          onchange="window.filterRecipes(this.value)"
        >
          <option value="all" ${filter === 'all' ? 'selected' : ''}>All Recipes</option>
          <option value="favorites" ${filter === 'favorites' ? 'selected' : ''}>Favorites</option>
          <option value="high-rated" ${filter === 'high-rated' ? 'selected' : ''}>4+ Stars</option>
          <option value="most-cooked" ${filter === 'most-cooked' ? 'selected' : ''}>Most Cooked</option>
        </select>
      </div>
      
      <!-- Recipe Count -->
      <div class="text-sm text-text-muted mb-4">
        ${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''}
      </div>
      
      <!-- Recipe Grid -->
      <div class="grid grid-cols-2 gap-3">
        ${filteredRecipes.map(recipe => `
          <div 
            class="bg-surface rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onclick="window.viewRecipe('${recipe.recipeId}')"
          >
            <div class="p-3">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-text-primary text-sm leading-tight">${recipe.name}</h3>
                ${recipe.isFavorite ? '<span class="text-accent">★</span>' : ''}
              </div>
              <div class="flex flex-wrap gap-2 text-xs text-text-secondary mb-2">
                <span class="bg-bg px-2 py-0.5 rounded">${recipe.category}</span>
                <span>${recipe.totalTime} min</span>
              </div>
              ${recipe.rating ? `
                <div class="text-accent text-xs mb-1">
                  ${'★'.repeat(recipe.rating)}${'☆'.repeat(5-recipe.rating)}
                </div>
              ` : ''}
              <div class="text-xs text-text-muted">
                Cooked ${recipe.timesCooked} time${recipe.timesCooked !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${filteredRecipes.length === 0 ? `
        <div class="text-center py-12">
          <p class="text-text-muted">No recipes found. Generate meal plans to build your library!</p>
        </div>
      ` : ''}
    </div>
  `;
}
```

---

### AddRecipePage.js

**Purpose:** Allow users to add recipes manually (paste text) or via URL import

#### Visual Layout - Method Selection

```
┌─────────────────────────────────────────────────────────────┐
│  ← Add Recipe                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  How would you like to add your recipe?                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📋 Paste Recipe Text                               │    │
│  │  Copy a recipe from anywhere and paste it here      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🔗 Import from URL                                 │    │
│  │  Paste a link to a recipe website                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Visual Layout - Paste Recipe Text

```
┌─────────────────────────────────────────────────────────────┐
│  ← Add Recipe                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paste your recipe below                                    │
│  Copy the recipe from a website, book, or anywhere else     │
│  and paste it here. Vanessa will format it for you.         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Herb-Crusted Salmon                                 │    │
│  │                                                     │    │
│  │ Ingredients:                                        │    │
│  │ - 150g salmon fillet                                │    │
│  │ - 2 tbsp olive oil                                  │    │
│  │ - Fresh dill and parsley                            │    │
│  │ - Salt and pepper                                   │    │
│  │                                                     │    │
│  │ Instructions:                                       │    │
│  │ 1. Pat salmon dry with paper towel                  │    │
│  │ 2. Season with salt and pepper...                   │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              [✨ Format Recipe]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Visual Layout - Import from URL

```
┌─────────────────────────────────────────────────────────────┐
│  ← Add Recipe                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paste the recipe URL                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ https://www.taste.com.au/recipes/herb-salmon/...   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              [🔗 Import Recipe]                              │
│                                                             │
│  Works with most recipe websites. Some sites may not        │
│  work due to access restrictions.                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Visual Layout - Review Extracted Recipe

```
┌─────────────────────────────────────────────────────────────┐
│  ← Add Recipe                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Recipe extracted! Review and edit if needed.             │
│                                                             │
│  Name                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Herb-Crusted Salmon                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Category              Servings                             │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ Dinner     ▼│      │ 2            │                     │
│  └──────────────┘      └──────────────┘                     │
│                                                             │
│  Prep Time (mins)      Cook Time (mins)                     │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ 15           │      │ 20           │                     │
│  └──────────────┘      └──────────────┘                     │
│                                                             │
│  Ingredients (one per line)                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 150g salmon fillet                                  │    │
│  │ 2 tbsp olive oil                                    │    │
│  │ 10g fresh dill                                      │    │
│  │ 10g fresh parsley                                   │    │
│  │ Salt and pepper to taste                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Steps (one per line)                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Pat salmon dry with paper towel                     │    │
│  │ Season with salt and pepper                         │    │
│  │ Chop herbs finely and mix together                  │    │
│  │ Heat olive oil in pan over medium-high              │    │
│  │ Sear salmon 4 minutes per side                      │    │
│  │ Top with herbs and serve                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Tags (comma-separated, optional)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ quick, omega-3, kid-friendly                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              [💾 Save to Library]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

```javascript
// src/components/AddRecipePage.js

// Add recipe state
const addRecipeState = {
  mode: 'select',  // select, paste, url, review
  pasteText: '',
  urlText: '',
  extractedRecipe: null,
  isProcessing: false,
  error: null
};

export function AddRecipePage() {
  const { mode, isProcessing, error, extractedRecipe } = addRecipeState;
  const isOffline = !navigator.onLine;
  
  // Method selection screen
  if (mode === 'select') {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="navigateTo('/recipes')" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">Add Recipe</h1>
        </div>
        
        <p class="text-text-primary mb-4">How would you like to add your recipe?</p>
        
        <div class="space-y-3">
          <button 
            onclick="window.setAddRecipeMode('paste')"
            class="w-full bg-surface rounded-lg p-4 text-left shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
            ${isOffline ? 'disabled' : ''}
          >
            <span class="text-2xl block mb-2">📋</span>
            <span class="font-medium text-text-primary block">Paste Recipe Text</span>
            <span class="text-sm text-text-secondary">Copy a recipe from anywhere and paste it here</span>
          </button>
          
          <button 
            onclick="window.setAddRecipeMode('url')"
            class="w-full bg-surface rounded-lg p-4 text-left shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
            ${isOffline ? 'disabled' : ''}
          >
            <span class="text-2xl block mb-2">🔗</span>
            <span class="font-medium text-text-primary block">Import from URL</span>
            <span class="text-sm text-text-secondary">Paste a link to a recipe website</span>
          </button>
        </div>
        
        ${isOffline ? '<p class="text-text-muted text-sm text-center mt-4">You\'re offline. Connect to the internet to add recipes.</p>' : ''}
      </div>
    `;
  }
  
  // Paste recipe text screen
  if (mode === 'paste') {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="window.setAddRecipeMode('select')" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">Add Recipe</h1>
        </div>
        
        <p class="text-text-primary mb-2">Paste your recipe below</p>
        <p class="text-sm text-text-secondary mb-4">Copy the recipe from a website, book, or anywhere else and paste it here. Vanessa will format it for you.</p>
        
        <textarea 
          id="pasteRecipeText"
          class="w-full bg-surface border border-border rounded-lg p-4 text-sm min-h-[200px] resize-y focus:outline-none focus:border-accent disabled:bg-bg disabled:text-text-muted"
          placeholder="Paste your recipe here..."
          oninput="window.updatePasteText(this.value)"
          ${isProcessing ? 'disabled' : ''}
        >${addRecipeState.pasteText}</textarea>
        
        ${error ? `<div class="bg-red-50 text-red-600 rounded-lg p-3 mt-3 text-sm">${error}</div>` : ''}
        
        <button 
          onclick="window.extractFromPaste()"
          class="w-full bg-accent text-white rounded-pill py-3 font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          ${isProcessing || !addRecipeState.pasteText.trim() ? 'disabled' : ''}
        >
          ${isProcessing ? 'Processing...' : '✨ Format Recipe'}
        </button>
      </div>
    `;
  }
  
  // URL import screen
  if (mode === 'url') {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="window.setAddRecipeMode('select')" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">Add Recipe</h1>
        </div>
        
        <p class="text-text-primary mb-4">Paste the recipe URL</p>
        
        <input 
          type="url"
          id="recipeUrlInput"
          class="w-full bg-surface border border-border rounded-pill px-4 py-3 text-sm focus:outline-none focus:border-accent disabled:bg-bg disabled:text-text-muted"
          placeholder="https://example.com/recipe/..."
          value="${addRecipeState.urlText}"
          oninput="window.updateUrlText(this.value)"
          ${isProcessing ? 'disabled' : ''}
        />
        
        ${error ? `<div class="bg-red-50 text-red-600 rounded-lg p-3 mt-3 text-sm">${error}</div>` : ''}
        
        <button 
          onclick="window.extractFromUrl()"
          class="w-full bg-accent text-white rounded-pill py-3 font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          ${isProcessing || !addRecipeState.urlText.trim() ? 'disabled' : ''}
        >
          ${isProcessing ? 'Importing...' : '🔗 Import Recipe'}
        </button>
        
        <p class="text-sm text-text-muted mt-4 text-center">Works with most recipe websites. Some sites may not work due to access restrictions.</p>
      </div>
    `;
  }
  
  // Review extracted recipe screen
  if (mode === 'review' && extractedRecipe) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-4">
          <button onclick="window.setAddRecipeMode('select')" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">Add Recipe</h1>
        </div>
        
        <div class="bg-success/10 text-success rounded-lg p-3 mb-4 text-sm">
          ✓ Recipe extracted! Review and edit if needed.
        </div>
        
        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm text-text-secondary mb-1">Name</label>
            <input 
              type="text" 
              id="recipeName"
              class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
              value="${extractedRecipe.name || ''}"
              oninput="window.updateExtractedField('name', this.value)"
            />
          </div>
          
          <!-- Category and Servings -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-text-secondary mb-1">Category</label>
              <select 
                id="recipeCategory"
                class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
                onchange="window.updateExtractedField('category', this.value)"
              >
                <option value="breakfast" ${extractedRecipe.category === 'breakfast' ? 'selected' : ''}>Breakfast</option>
                <option value="lunch" ${extractedRecipe.category === 'lunch' ? 'selected' : ''}>Lunch</option>
                <option value="dinner" ${extractedRecipe.category === 'dinner' ? 'selected' : ''}>Dinner</option>
                <option value="snack" ${extractedRecipe.category === 'snack' ? 'selected' : ''}>Snack</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">Servings</label>
              <input 
                type="number" 
                id="recipeServings"
                class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
                value="${extractedRecipe.servings || 2}"
                oninput="window.updateExtractedField('servings', parseInt(this.value))"
              />
            </div>
          </div>
          
          <!-- Prep and Cook Time -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-text-secondary mb-1">Prep Time (mins)</label>
              <input 
                type="number" 
                id="recipePrepTime"
                class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
                value="${extractedRecipe.prepTime || ''}"
                oninput="window.updateExtractedField('prepTime', parseInt(this.value))"
              />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1">Cook Time (mins)</label>
              <input 
                type="number" 
                id="recipeCookTime"
                class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
                value="${extractedRecipe.cookTime || ''}"
                oninput="window.updateExtractedField('cookTime', parseInt(this.value))"
              />
            </div>
          </div>
          
          <!-- Ingredients -->
          <div>
            <label class="block text-sm text-text-secondary mb-1">Ingredients (one per line)</label>
            <textarea 
              id="recipeIngredients"
              class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:border-accent"
              oninput="window.updateExtractedIngredients(this.value)"
            >${extractedRecipe.ingredients?.map(i => i.quantity ? `${i.quantity} ${i.item}` : i.item).join('\n') || ''}</textarea>
          </div>
          
          <!-- Steps -->
          <div>
            <label class="block text-sm text-text-secondary mb-1">Steps (one per line)</label>
            <textarea 
              id="recipeSteps"
              class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:border-accent"
              oninput="window.updateExtractedSteps(this.value)"
            >${extractedRecipe.steps?.join('\n') || ''}</textarea>
          </div>
          
          <!-- Tags -->
          <div>
            <label class="block text-sm text-text-secondary mb-1">Tags (comma-separated, optional)</label>
            <input 
              type="text" 
              id="recipeTags"
              class="w-full bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
              value="${extractedRecipe.tags?.join(', ') || ''}"
              oninput="window.updateExtractedTags(this.value)"
              placeholder="quick, healthy, kid-friendly"
            />
          </div>
        </div>
        
        ${error ? `<div class="bg-red-50 text-red-600 rounded-lg p-3 mt-4 text-sm">${error}</div>` : ''}
        
        <button 
          onclick="window.saveExtractedRecipe()"
          class="w-full bg-accent text-white rounded-pill py-3 font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          ${isProcessing || !extractedRecipe.name?.trim() ? 'disabled' : ''}
        >
          ${isProcessing ? 'Saving...' : '💾 Save to Library'}
        </button>
      </div>
    `;
  }
  
  // Fallback
  return `<div class="min-h-screen bg-bg p-4"><p class="text-text-muted">Something went wrong.</p></div>`;
}

// Window handlers
window.setAddRecipeMode = function(mode) {
  addRecipeState.mode = mode;
  addRecipeState.error = null;
  appState.notifyListeners();
};

window.updatePasteText = function(value) {
  addRecipeState.pasteText = value;
};

window.updateUrlText = function(value) {
  addRecipeState.urlText = value;
};

window.extractFromPaste = async function() {
  if (addRecipeState.isProcessing) return;
  
  addRecipeState.isProcessing = true;
  addRecipeState.error = null;
  appState.notifyListeners();
  
  // Set up timeout (25 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  try {
    const response = await fetch('/api/extract-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'text',
        content: addRecipeState.pasteText
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (data.success) {
      addRecipeState.extractedRecipe = data.recipe;
      addRecipeState.mode = 'review';
    } else {
      addRecipeState.error = data.error || 'Failed to extract recipe. Please try again.';
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Extract error:', error);
    
    if (error.name === 'AbortError') {
      addRecipeState.error = 'Request took too long. Please try again.';
    } else {
      addRecipeState.error = 'Something went wrong. Please try again.';
    }
  } finally {
    addRecipeState.isProcessing = false;
    appState.notifyListeners();
  }
};

window.extractFromUrl = async function() {
  if (addRecipeState.isProcessing) return;
  
  addRecipeState.isProcessing = true;
  addRecipeState.error = null;
  appState.notifyListeners();
  
  // Set up timeout (25 seconds - URL fetch + extraction)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  try {
    const response = await fetch('/api/extract-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'url',
        content: addRecipeState.urlText
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (data.success) {
      addRecipeState.extractedRecipe = data.recipe;
      addRecipeState.mode = 'review';
    } else {
      addRecipeState.error = data.error || 'Failed to import recipe. The website may be blocking access.';
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Import error:', error);
    
    if (error.name === 'AbortError') {
      addRecipeState.error = 'Request took too long. Please try again.';
    } else {
      addRecipeState.error = 'Something went wrong. Please try again.';
    }
  } finally {
    addRecipeState.isProcessing = false;
    appState.notifyListeners();
  }
};

window.updateExtractedField = function(field, value) {
  if (addRecipeState.extractedRecipe) {
    addRecipeState.extractedRecipe[field] = value;
  }
};

window.updateExtractedIngredients = function(text) {
  if (addRecipeState.extractedRecipe) {
    addRecipeState.extractedRecipe.ingredients = text.split('\n')
      .filter(line => line.trim())
      .map(line => ({ item: line.trim(), quantity: '', category: 'other' }));
  }
};

window.updateExtractedSteps = function(text) {
  if (addRecipeState.extractedRecipe) {
    addRecipeState.extractedRecipe.steps = text.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim().replace(/^\d+\.\s*/, '')); // Remove leading numbers
  }
};

window.updateExtractedTags = function(text) {
  if (addRecipeState.extractedRecipe) {
    addRecipeState.extractedRecipe.tags = text.split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag);
  }
};

window.saveExtractedRecipe = function() {
  if (!addRecipeState.extractedRecipe?.name?.trim()) return;
  
  const recipe = {
    _schemaVersion: 1,
    recipeId: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    ...addRecipeState.extractedRecipe,
    totalTime: (addRecipeState.extractedRecipe.prepTime || 0) + (addRecipeState.extractedRecipe.cookTime || 0),
    timesCooked: 0,
    lastCooked: null,
    rating: null,
    notes: '',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    createdBy: 'manual'
  };
  
  const recipes = loadRecipes();
  recipes.push(recipe);
  saveRecipes(recipes);
  
  // Reset state and navigate to recipe library
  addRecipeState.mode = 'select';
  addRecipeState.pasteText = '';
  addRecipeState.urlText = '';
  addRecipeState.extractedRecipe = null;
  
  navigateTo('/recipes');
  appState.notifyListeners();
};
```

---

### RecipeDetailPage.js

**Purpose:** Display full recipe details with rating, favorite toggle, and cooking history

```javascript
// src/components/RecipeDetailPage.js

import { loadRecipes, saveRecipes } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';
import appState from '../utils/appState.js';

export function RecipeDetailPage(recipeId) {
  const recipes = loadRecipes();
  const recipe = recipes.find(r => r.recipeId === recipeId);
  
  if (!recipe) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="window.goBack()" class="text-2xl">←</button>
          <h1 class="text-xl font-medium text-text-primary">Recipe Not Found</h1>
        </div>
        <div class="text-center py-12">
          <p class="text-text-muted mb-4">This recipe doesn't exist or has been deleted.</p>
          <button 
            onclick="navigateTo('/recipes')" 
            class="bg-accent text-white rounded-pill px-6 py-3 font-medium"
          >
            Back to Recipe Library
          </button>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="min-h-screen bg-bg p-4 pb-20">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
        <h1 class="flex-1 text-xl font-medium text-text-primary">${recipe.name}</h1>
        <button 
          onclick="window.toggleFavorite('${recipe.recipeId}')"
          class="text-2xl ${recipe.isFavorite ? 'text-accent' : 'text-text-muted'}"
          aria-label="${recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
        >
          ${recipe.isFavorite ? '★' : '☆'}
        </button>
      </div>
      
      <!-- Meta Bar -->
      <div class="flex flex-wrap gap-3 mb-4">
        <span class="flex items-center gap-1 text-sm text-text-secondary bg-surface px-3 py-1 rounded-pill">
          <span>🍽️</span>
          ${recipe.category}
        </span>
        ${recipe.cuisine ? `
          <span class="flex items-center gap-1 text-sm text-text-secondary bg-surface px-3 py-1 rounded-pill">
            <span>🌍</span>
            ${recipe.cuisine}
          </span>
        ` : ''}
        <span class="flex items-center gap-1 text-sm text-text-secondary bg-surface px-3 py-1 rounded-pill">
          <span>⏱️</span>
          ${recipe.totalTime} min
        </span>
        <span class="flex items-center gap-1 text-sm text-text-secondary bg-surface px-3 py-1 rounded-pill">
          <span>👥</span>
          Serves ${recipe.servings}
        </span>
      </div>
      
      <!-- Tags -->
      ${recipe.tags?.length ? `
        <div class="flex flex-wrap gap-2 mb-6">
          ${recipe.tags.map(tag => `
            <span class="text-xs text-accent bg-accent-soft px-2 py-1 rounded-pill">${tag}</span>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- Ingredients Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">Ingredients</h2>
        <ul class="space-y-2">
          ${recipe.ingredients.map(ing => `
            <li class="flex gap-2 text-sm">
              <span class="text-text-secondary font-medium min-w-[80px]">${ing.quantity}</span>
              <span class="text-text-primary">${ing.item}</span>
            </li>
          `).join('')}
        </ul>
      </section>
      
      <!-- Instructions Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">Instructions</h2>
        <ol class="space-y-4">
          ${recipe.steps.map((step, index) => `
            <li class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-medium">${index + 1}</span>
              <span class="text-sm text-text-secondary leading-relaxed">${step}</span>
            </li>
          `).join('')}
        </ol>
      </section>
      
      <!-- Notes Section -->
      ${recipe.notes ? `
        <section class="bg-surface rounded-lg p-4 mb-4">
          <h2 class="font-medium text-text-primary mb-2">Notes</h2>
          <p class="text-sm text-text-secondary">${recipe.notes}</p>
        </section>
      ` : ''}
      
      <!-- Rating Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">Your Rating</h2>
        <div class="flex gap-1">
          ${[1,2,3,4,5].map(star => `
            <button 
              onclick="window.rateRecipe('${recipe.recipeId}', ${star})"
              class="text-3xl ${recipe.rating >= star ? 'text-accent' : 'text-border'} hover:scale-110 transition-transform"
              aria-label="Rate ${star} star${star !== 1 ? 's' : ''}"
            >
              ${recipe.rating >= star ? '★' : '☆'}
            </button>
          `).join('')}
        </div>
      </section>
      
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-surface rounded-lg p-3 text-center">
          <div class="text-lg font-medium text-text-primary">${recipe.timesCooked}</div>
          <div class="text-xs text-text-muted">times cooked</div>
        </div>
        ${recipe.lastCooked ? `
          <div class="bg-surface rounded-lg p-3 text-center">
            <div class="text-sm font-medium text-text-primary">${formatDate(recipe.lastCooked)}</div>
            <div class="text-xs text-text-muted">last cooked</div>
          </div>
        ` : ''}
        <div class="bg-surface rounded-lg p-3 text-center">
          <div class="text-sm font-medium text-text-primary capitalize">${recipe.createdBy}</div>
          <div class="text-xs text-text-muted">source</div>
        </div>
      </div>
    </div>
  `;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });
}
```

---

### DayViewPage.js

**Purpose:** Display all meals for a specific day with recipe details

```javascript
// src/components/DayViewPage.js

import { loadCurrentMealPlan, loadMeals, loadRecipes, loadEaters } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';

export function DayViewPage(dateStr) {
  const mealPlan = loadCurrentMealPlan();
  const meals = loadMeals();
  const recipes = loadRecipes();
  const eaters = loadEaters();
  
  if (!mealPlan) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">No Meal Plan</h1>
        </div>
        <div class="text-center py-12">
          <p class="text-text-muted mb-4">You don't have a meal plan yet.</p>
          <button 
            onclick="window.toggleChat()" 
            class="bg-accent text-white rounded-pill px-6 py-3 font-medium"
          >
            Chat with Vanessa to create one
          </button>
        </div>
      </div>
    `;
  }
  
  // Get meals for this day
  const dayMeals = mealPlan.mealIds
    .map(id => meals.find(m => m.mealId === id))
    .filter(m => m && m.date === dateStr)
    .sort((a, b) => {
      const slotOrder = { breakfast: 1, lunch: 2, dinner: 3 };
      return slotOrder[a.slot] - slotOrder[b.slot];
    });
  
  const dayName = formatDayName(dateStr);
  const formattedDate = formatDate(dateStr);
  
  return `
    <div class="min-h-screen bg-bg p-4 pb-20">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
        <div>
          <h1 class="text-xl font-medium text-text-primary">${dayName}</h1>
          <span class="text-sm text-text-secondary">${formattedDate}</span>
        </div>
      </div>
      
      <!-- Meals List -->
      <div class="space-y-4 mb-6">
        ${dayMeals.length === 0 ? `
          <div class="text-center py-12">
            <p class="text-text-muted">No meals planned for this day.</p>
          </div>
        ` : dayMeals.map(meal => {
          const recipe = recipes.find(r => r.recipeId === meal.recipeId);
          const mealEaters = meal.eaterIds
            .map(id => eaters.find(e => e.eaterId === id))
            .filter(Boolean);
          
          return `
            <div class="bg-surface rounded-lg shadow-sm overflow-hidden">
              <!-- Meal Header -->
              <div class="flex items-center justify-between px-4 py-3 bg-bg border-b border-border">
                <div class="flex items-center gap-2">
                  <span class="text-xl">${getSlotIcon(meal.slot)}</span>
                  <span class="font-medium text-text-primary">${capitalizeFirst(meal.slot)}</span>
                </div>
                ${meal.isCooked ? '<span class="bg-success text-white text-xs px-2 py-1 rounded-pill">✓ Cooked</span>' : ''}
              </div>
              
              <!-- Meal Content -->
              <div 
                class="p-4 cursor-pointer hover:bg-bg/50 transition-colors"
                onclick="window.viewRecipe('${meal.recipeId}')"
              >
                <h3 class="font-medium text-text-primary mb-2">${recipe?.name || 'Unknown Recipe'}</h3>
                
                ${recipe ? `
                  <div class="flex gap-4 text-sm text-text-secondary mb-3">
                    <span>⏱️ ${recipe.totalTime} min</span>
                    <span>👥 Serves ${meal.servingsNeeded}</span>
                  </div>
                ` : ''}
                
                <div class="flex flex-wrap gap-2">
                  ${mealEaters.map(e => `
                    <span class="text-xs bg-bg text-text-secondary px-2 py-1 rounded-pill">${e.name}</span>
                  `).join('')}
                </div>
              </div>
              
              <!-- Mark Cooked Button -->
              ${!meal.isCooked ? `
                <div class="px-4 pb-4">
                  <button 
                    onclick="window.markMealCooked('${meal.mealId}')"
                    class="w-full bg-accent-soft text-accent rounded-lg py-2 font-medium"
                  >
                    Mark as Cooked
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Day Navigation -->
      <div class="flex gap-3">
        <button 
          onclick="window.navigateDay('${dateStr}', -1)" 
          class="flex-1 bg-surface border border-border rounded-lg py-3 text-text-secondary font-medium"
        >
          ← Previous Day
        </button>
        <button 
          onclick="window.navigateDay('${dateStr}', 1)" 
          class="flex-1 bg-surface border border-border rounded-lg py-3 text-text-secondary font-medium"
        >
          Next Day →
        </button>
      </div>
    </div>
  `;
}

function getSlotIcon(slot) {
  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
  return icons[slot] || '🍽️';
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { weekday: 'long' });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'long', day: 'numeric' });
}

// Window handlers for this page
window.markMealCooked = function(mealId) {
  const meals = loadMeals();
  const meal = meals.find(m => m.mealId === mealId);
  if (meal) {
    meal.isCooked = true;
    meal.cookedAt = new Date().toISOString();
    saveMeals(meals);
    
    // Also update recipe stats
    const recipes = loadRecipes();
    const recipe = recipes.find(r => r.recipeId === meal.recipeId);
    if (recipe) {
      recipe.timesCooked++;
      recipe.lastCooked = new Date().toISOString().split('T')[0];
      saveRecipes(recipes);
    }
    
    appState.notifyListeners();
  }
};

window.navigateDay = function(currentDate, offset) {
  const date = new Date(currentDate);
  date.setDate(date.getDate() + offset);
  const newDateStr = date.toISOString().split('T')[0];
  navigateTo(`/day/${newDateStr}`);
};
```

---

### ShoppingListPage.js

**Purpose:** Display shopping list organized by aisle/category with checkboxes

```javascript
// src/components/ShoppingListPage.js

import { loadCurrentMealPlan, loadMeals, loadRecipes } from '../utils/storage.js';
import appState from '../utils/appState.js';

// Shopping list checked state (stored in localStorage)
function loadCheckedItems() {
  const data = localStorage.getItem('shoppingListChecked');
  return data ? JSON.parse(data) : {};
}

function saveCheckedItems(checked) {
  localStorage.setItem('shoppingListChecked', JSON.stringify(checked));
}

export function ShoppingListPage() {
  const mealPlan = loadCurrentMealPlan();
  const meals = loadMeals();
  const recipes = loadRecipes();
  const checkedItems = loadCheckedItems();
  
  if (!mealPlan) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">Shopping List</h1>
        </div>
        <div class="text-center py-12">
          <p class="text-text-muted mb-4">No meal plan yet. Generate one to see your shopping list!</p>
          <button 
            onclick="window.toggleChat()" 
            class="bg-accent text-white rounded-pill px-6 py-3 font-medium"
          >
            Chat with Vanessa
          </button>
        </div>
      </div>
    `;
  }
  
  // Aggregate ingredients from all meals
  const ingredientMap = new Map();
  
  for (const mealId of mealPlan.mealIds) {
    const meal = meals.find(m => m.mealId === mealId);
    if (!meal) continue;
    
    const recipe = recipes.find(r => r.recipeId === meal.recipeId);
    if (!recipe) continue;
    
    for (const ing of recipe.ingredients) {
      const key = ing.item.toLowerCase();
      if (ingredientMap.has(key)) {
        // Combine quantities (simplified - just note multiple uses)
        const existing = ingredientMap.get(key);
        existing.quantity = `${existing.quantity} + ${ing.quantity}`;
        existing.usedIn.push(recipe.name);
      } else {
        ingredientMap.set(key, {
          item: ing.item,
          quantity: ing.quantity,
          category: ing.category || 'Other',
          usedIn: [recipe.name]
        });
      }
    }
  }
  
  // Group by category
  const byCategory = {};
  for (const [key, ing] of ingredientMap) {
    const cat = ing.category;
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push({ ...ing, key });
  }
  
  // Sort categories (using aisle order if available)
  const categoryOrder = [
    'Produce', 'Meat & Seafood', 'Dairy', 'Bakery',
    'Frozen', 'Pantry', 'Canned Goods', 'Condiments',
    'Snacks', 'Beverages', 'Other'
  ];
  
  const sortedCategories = Object.keys(byCategory).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  const totalItems = ingredientMap.size;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  
  return `
    <div class="min-h-screen bg-bg p-4 pb-20">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
        <h1 class="text-xl font-medium text-text-primary">Shopping List</h1>
      </div>
      
      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="text-sm text-text-secondary mb-1">
          ${checkedCount} of ${totalItems} items
        </div>
        <div class="h-2 bg-border rounded-pill overflow-hidden">
          <div class="h-full bg-accent rounded-pill transition-all" style="width: ${(checkedCount / totalItems) * 100}%"></div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-3 mb-4">
        <button 
          onclick="window.clearAllChecked()" 
          class="flex-1 bg-surface border border-border rounded-lg py-2 text-sm text-text-secondary font-medium"
        >
          Clear All ✓
        </button>
        <button 
          onclick="window.copyShoppingList()" 
          class="flex-1 bg-surface border border-border rounded-lg py-2 text-sm text-text-secondary font-medium"
        >
          Copy List 📋
        </button>
      </div>
      
      <!-- Categories -->
      <div class="space-y-4 mb-6">
        ${sortedCategories.map(category => `
          <div class="bg-surface rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 bg-bg border-b border-border">
              <h2 class="font-medium text-text-primary">
                ${getCategoryIcon(category)} ${category}
              </h2>
              <span class="text-sm text-text-muted">${byCategory[category].length}</span>
            </div>
            <ul class="divide-y divide-border">
              ${byCategory[category].map(ing => `
                <li class="px-4 py-3 ${checkedItems[ing.key] ? 'bg-bg/50' : ''}">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="w-5 h-5 rounded border-border text-accent focus:ring-accent"
                      ${checkedItems[ing.key] ? 'checked' : ''}
                      onchange="window.toggleShoppingItem('${ing.key}')"
                    />
                    <span class="${checkedItems[ing.key] ? 'line-through text-text-muted' : 'text-text-primary'}">
                      <span class="text-text-secondary font-medium">${ing.quantity}</span>
                      <span class="ml-1">${ing.item}</span>
                    </span>
                  </label>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      
      <!-- Budget Summary -->
      <div class="bg-surface rounded-lg p-4">
        <h3 class="font-medium text-text-primary mb-3">Budget</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">Estimated:</span>
            <span class="text-text-primary font-medium">$${mealPlan.budget?.estimated || '—'}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-secondary">Target:</span>
            <span class="text-text-primary font-medium">$${mealPlan.budget?.target || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getCategoryIcon(category) {
  const icons = {
    'Produce': '🥬',
    'Meat & Seafood': '🥩',
    'Dairy': '🧀',
    'Bakery': '🍞',
    'Frozen': '❄️',
    'Pantry': '🫙',
    'Canned Goods': '🥫',
    'Condiments': '🧂',
    'Snacks': '🍿',
    'Beverages': '🥤',
    'Other': '📦'
  };
  return icons[category] || '📦';
}

// Window handlers for shopping list
window.toggleShoppingItem = function(key) {
  const checked = loadCheckedItems();
  checked[key] = !checked[key];
  saveCheckedItems(checked);
  appState.notifyListeners();
};

window.clearAllChecked = function() {
  saveCheckedItems({});
  appState.notifyListeners();
};

window.copyShoppingList = async function() {
  const mealPlan = loadCurrentMealPlan();
  const meals = loadMeals();
  const recipes = loadRecipes();
  
  // Build text version
  let text = 'Shopping List\n';
  text += '=============\n\n';
  
  // ... (aggregate ingredients similar to above)
  const ingredientMap = new Map();
  for (const mealId of mealPlan.mealIds) {
    const meal = meals.find(m => m.mealId === mealId);
    if (!meal) continue;
    const recipe = recipes.find(r => r.recipeId === meal.recipeId);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const key = ing.item.toLowerCase();
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, { item: ing.item, quantity: ing.quantity });
      }
    }
  }
  
  for (const [key, ing] of ingredientMap) {
    text += `☐ ${ing.quantity} ${ing.item}\n`;
  }
  
  await window.copyToClipboard(text);
};
```

---

### ProfilePage.js

**Purpose:** Display and allow editing of user's base specification / preferences

```javascript
// src/components/ProfilePage.js

import { loadBaseSpecification, loadEaters, loadUsageLimits } from '../utils/storage.js';
import { checkUsageLimits } from '../utils/usage.js';
import appState from '../utils/appState.js';

export function ProfilePage() {
  const baseSpec = loadBaseSpecification();
  const eaters = loadEaters();
  const usageLimits = loadUsageLimits();
  const usage = checkUsageLimits();
  const isOffline = !navigator.onLine;
  
  if (!baseSpec) {
    return `
      <div class="min-h-screen bg-bg p-4 pb-20">
        <div class="flex items-center gap-3 mb-6">
          <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
          <h1 class="text-xl font-medium text-text-primary">Profile</h1>
        </div>
        <div class="text-center py-12">
          <p class="text-text-muted mb-4">You haven't set up your profile yet.</p>
          <button 
            onclick="window.toggleChat()" 
            class="bg-accent text-white rounded-pill px-6 py-3 font-medium"
          >
            Chat with Vanessa to get started
          </button>
        </div>
      </div>
    `;
  }
  
  const owner = eaters.find(e => e.eaterId === baseSpec.ownerEaterId);
  const householdMembers = eaters.filter(e => 
    baseSpec.householdEaterIds.includes(e.eaterId)
  );
  
  return `
    <div class="min-h-screen bg-bg p-4 pb-20">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <button onclick="window.goBack()" class="text-2xl text-text-secondary">←</button>
        <h1 class="text-xl font-medium text-text-primary">Profile</h1>
      </div>
      
      ${isOffline ? `
        <div class="bg-warning/10 text-warning rounded-lg p-3 mb-4 text-sm">
          You're offline. Profile editing is unavailable.
        </div>
      ` : ''}
      
      <!-- About You Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">About You</h2>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-text-secondary text-sm">Name</span>
            <span class="text-text-primary text-sm">${owner?.name || 'Not set'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-secondary text-sm">Dietary Goals</span>
            <span class="text-text-primary text-sm">${baseSpec.dietaryGoals || 'Not set'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-secondary text-sm">Foods to Avoid</span>
            <span class="text-text-primary text-sm">${baseSpec.avoidFoods?.join(', ') || 'None specified'}</span>
          </div>
        </div>
      </section>
      
      <!-- Household Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">Household (${householdMembers.length})</h2>
        <div class="space-y-3 mb-4">
          ${householdMembers.map(member => `
            <div class="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <span class="text-text-primary font-medium">${member.name}</span>
                ${member.eaterId === baseSpec.ownerEaterId ? 
                  '<span class="ml-2 text-xs bg-accent-soft text-accent px-2 py-0.5 rounded-pill">You</span>' : ''}
                <p class="text-xs text-text-muted mt-1">
                  ${member.restrictions?.length ? 
                    `Avoids: ${member.restrictions.join(', ')}` : 
                    'No restrictions'}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
        ${usage.eatersRemaining > 0 ? `
          <button 
            onclick="window.addHouseholdMember()"
            class="w-full bg-accent-soft text-accent rounded-lg py-2 font-medium disabled:opacity-50"
            ${isOffline ? 'disabled' : ''}
          >
            + Add Member
          </button>
        ` : `
          <p class="text-sm text-text-muted text-center">
            Household limit reached. 
            <a href="/upgrade" class="text-accent">Upgrade to add more</a>
          </p>
        `}
      </section>
      
      <!-- Meal Planning Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">Meal Planning</h2>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-text-secondary text-sm">Weekly Budget</span>
            <span class="text-text-primary text-sm">$${baseSpec.weeklyBudget || 'Not set'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-secondary text-sm">Shopping Day</span>
            <span class="text-text-primary text-sm">${baseSpec.shoppingDay || 'Not set'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-secondary text-sm">Preferred Store</span>
            <span class="text-text-primary text-sm">${baseSpec.preferredStore || 'Not set'}</span>
          </div>
        </div>
      </section>
      
      <!-- Usage Section -->
      <section class="bg-surface rounded-lg p-4 mb-4">
        <h2 class="font-medium text-text-primary mb-3">Usage This Month</h2>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-bg rounded-lg p-3 text-center">
            <div class="text-lg font-medium text-text-primary">
              ${usageLimits.currentPeriod.generations} / ${usageLimits.limits.generationsPerMonth}
            </div>
            <div class="text-xs text-text-muted">Meal Plans</div>
          </div>
          <div class="bg-bg rounded-lg p-3 text-center">
            <div class="text-lg font-medium text-text-primary">
              ${usageLimits.currentPeriod.messages} / ${usageLimits.limits.messagesPerMonth}
            </div>
            <div class="text-xs text-text-muted">Messages</div>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <span class="${usageLimits.plan === 'pro' ? 'bg-accent text-white' : 'bg-bg text-text-secondary'} text-sm px-3 py-1 rounded-pill">
            ${usageLimits.plan === 'pro' ? '⭐ Pro' : 'Free Plan'}
          </span>
          ${usageLimits.plan === 'free' ? `
            <a href="/upgrade" class="text-accent text-sm font-medium">Upgrade to Pro →</a>
          ` : ''}
        </div>
      </section>
      
      <!-- Edit Button -->
      <button 
        onclick="window.editProfile()"
        class="w-full bg-accent text-white rounded-pill py-3 font-medium disabled:opacity-50"
        ${isOffline ? 'disabled' : ''}
      >
        Edit Profile via Chat
      </button>
    </div>
  `;
}

// Window handlers for profile
window.editProfile = function() {
  // Open chat with a prompt to edit profile
  chatState.openChat();
  // Could pre-populate with "I'd like to update my profile"
};

window.addHouseholdMember = function() {
  chatState.openChat();
  // Could pre-populate with "I'd like to add a household member"
};
```

---

### GenerationStatusPage.js

**Purpose:** Full-page view showing meal plan generation progress with retry handling

#### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ✨                                 │
│                                                             │
│              Creating Monday meals...                       │
│                    45% (8s)                                 │
│                                                             │
│              [████████████░░░░░░░░░░░░] 45%                │
│                                                             │
│              Using Claude Sonnet for generation             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Retry State Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ✨                                 │
│                                                             │
│    ⚠️ First attempt didn't work out as expected.           │
│       Trying again now...                                   │
│                                                             │
│              Connecting to AI...                            │
│                    5% (2s)                                  │
│                                                             │
│              [██░░░░░░░░░░░░░░░░░░░░░░] 5%                 │
│                                                             │
│              Using Claude Sonnet for generation             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Failed State Layout (After 2 Attempts)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          😕                                 │
│                                                             │
│         There seems to be something wrong.                  │
│         What would you like to do next?                     │
│                                                             │
│         ┌─────────────────────────────────┐                │
│         │       🔄 Try Again              │                │
│         └─────────────────────────────────┘                │
│                                                             │
│         ┌─────────────────────────────────┐                │
│         │       💬 Talk to Vanessa        │                │
│         └─────────────────────────────────┘                │
│                                                             │
│         ┌─────────────────────────────────┐                │
│         │       📋 Go to Current Plan     │                │
│         └─────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

```javascript
// src/components/GenerationStatusPage.js

// Generation state
const generationState = {
  status: 'idle',  // idle, generating, retrying, failed, success, cancelled
  progress: 0,
  currentStage: '',
  elapsedTime: 0,
  attemptCount: 0,
  error: null,
  progressIntervalId: null,  // Track interval for cleanup on navigation
  abortController: null      // AbortController for request cancellation/timeout
};

// Stage messages for meal plan generation
const GENERATION_STAGES = [
  'Connecting to AI...',           // 0-9%
  'Planning shopping list...',     // 10-18%
  'Creating Saturday meals...',    // 19-27%
  'Creating Sunday meals...',      // 28-36%
  'Creating Monday meals...',      // 37-45%
  'Creating Tuesday meals...',     // 46-54%
  'Creating Wednesday meals...',   // 55-63%
  'Creating Thursday meals...',    // 64-72%
  'Creating Friday meals...',      // 73-81%
  'Adding recipes...',             // 82-90%
  'Finalizing plan...'             // 91-100%
];

export function GenerationStatusPage() {
  const { status, progress, currentStage, elapsedTime, attemptCount } = generationState;
  const hasMealPlan = !!loadCurrentMealPlan();
  
  // Failed state - show options
  if (status === 'failed') {
    // Determine if this was a timeout
    const isTimeout = generationState.error?.includes('TIMEOUT');
    const title = isTimeout 
      ? 'The request took too long.' 
      : 'There seems to be something wrong.';
    const emoji = isTimeout ? '⏱️' : '😕';
    
    return `
      <div class="min-h-screen bg-bg flex items-center justify-center p-4">
        <div class="text-center max-w-sm">
          <div class="text-6xl mb-6">${emoji}</div>
          <h2 class="text-xl font-medium text-text-primary mb-2">${title}</h2>
          <p class="text-text-secondary mb-6">What would you like to do next?</p>
          
          <div class="space-y-3">
            <button 
              onclick="window.retryGeneration()" 
              class="w-full bg-accent text-white rounded-pill py-3 font-medium"
            >
              🔄 Try Again
            </button>
            
            <button 
              onclick="window.goToChat()" 
              class="w-full bg-surface border border-border rounded-pill py-3 font-medium text-text-primary"
            >
              💬 Talk to Vanessa
            </button>
            
            ${hasMealPlan ? `
              <button 
                onclick="window.goToCurrentPlan()" 
                class="w-full bg-surface border border-border rounded-pill py-3 font-medium text-text-primary"
              >
                📋 Go to Current Plan
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  // Generating or retrying state - show progress
  const isRetrying = status === 'retrying';
  
  return `
    <div class="min-h-screen bg-bg flex items-center justify-center p-4">
      <div class="text-center max-w-sm">
        <div class="text-6xl mb-6">✨</div>
        
        ${isRetrying ? `
          <div class="bg-warning/10 text-warning rounded-lg p-3 mb-4 text-sm">
            ⚠️ First attempt didn't work out as expected.<br>
            Trying again now...
          </div>
        ` : ''}
        
        <div class="text-text-primary mb-4">
          <span class="font-medium">${currentStage}</span>
          <span class="text-text-secondary ml-2">${Math.round(progress)}% (${elapsedTime}s)</span>
        </div>
        
        <div class="h-3 bg-border rounded-pill overflow-hidden mb-4">
          <div 
            class="h-full bg-accent rounded-pill transition-all duration-300" 
            style="width: ${progress}%"
            role="progressbar"
            aria-valuenow="${progress}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Generation progress"
          ></div>
        </div>
        
        <div class="text-sm text-text-muted mb-4">
          Using Claude Sonnet for generation
        </div>
        
        <!-- Cancel Button -->
        <button 
          onclick="window.cancelGeneration()" 
          class="text-sm text-text-muted underline hover:text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  `;
}

/**
 * startGeneration
 * 
 * Main entry point for meal plan generation. Handles the full flow including
 * progress simulation, API calls, retry logic, and state management.
 */
async function startGeneration() {
  const baseSpec = loadBaseSpecification();
  const eaters = loadEaters();
  const recipes = loadRecipes();
  const mealPlan = loadCurrentMealPlan();
  
  // Get context from conversation
  const weeklyPreferences = extractWeeklyPreferences(mealPlan?.conversation);
  const conversationSummary = summarizeConversation(mealPlan?.conversation);
  
  // Reset state for new generation
  generationState.status = 'generating';
  generationState.progress = 0;
  generationState.currentStage = GENERATION_STAGES[0];
  generationState.elapsedTime = 0;
  generationState.attemptCount = 1;
  generationState.error = null;
  
  // Clean up any existing interval before starting a new one
  if (generationState.progressIntervalId) {
    clearInterval(generationState.progressIntervalId);
    generationState.progressIntervalId = null;
  }

  // Navigate to generation page
  navigateTo('/generating');
  appState.notifyListeners();

  // Start progress simulation and timer
  const startTime = Date.now();
  const progressInterval = startProgressSimulation(startTime);
  generationState.progressIntervalId = progressInterval;  // Store for cleanup
  
  try {
    // Attempt generation (with one automatic retry on parse failure)
    const result = await attemptGeneration(
      { baseSpec, eaters, recipes, weeklyPreferences, conversationSummary },
      progressInterval,
      startTime
    );
    
    // Success - save data and navigate
    await handleGenerationSuccess(result);
    
  } catch (error) {
    // If user cancelled, don't retry - just exit silently
    if (error.message?.includes('CANCELLED')) {
      console.log('Generation cancelled by user');
      return;
    }
    
    // First attempt failed - try once more
    console.error('First generation attempt failed:', error);
    
    generationState.status = 'retrying';
    generationState.progress = 0;
    generationState.currentStage = GENERATION_STAGES[0];
    generationState.elapsedTime = 0;
    generationState.attemptCount = 2;
    appState.notifyListeners();
    
    // Restart progress simulation
    const retryStartTime = Date.now();
    const retryProgressInterval = startProgressSimulation(retryStartTime);
    
    try {
      const result = await attemptGeneration(
        { baseSpec, eaters, recipes, weeklyPreferences, conversationSummary },
        retryProgressInterval,
        retryStartTime
      );
      
      // Success on retry
      await handleGenerationSuccess(result);
      
    } catch (retryError) {
      clearInterval(retryProgressInterval);
      
      // If user cancelled during retry, exit silently
      if (retryError.message?.includes('CANCELLED')) {
        console.log('Generation cancelled by user during retry');
        return;
      }
      
      // Second attempt also failed
      console.error('Second generation attempt failed:', retryError);
      
      generationState.status = 'failed';
      generationState.error = retryError.message;
      appState.notifyListeners();
    }
  }
}

/**
 * attemptGeneration
 * 
 * Makes a single API call to generate the meal plan.
 * Throws on network error, API error, JSON parse failure, or timeout.
 * 
 * Uses AbortController for:
 * 1. Request timeout (45 seconds - allows buffer before Vercel's 60s limit)
 * 2. User-initiated cancellation via window.cancelGeneration()
 */
async function attemptGeneration(context, progressInterval, startTime) {
  const { baseSpec, eaters, recipes, weeklyPreferences, conversationSummary } = context;
  
  // Create AbortController for timeout and cancellation
  const controller = new AbortController();
  generationState.abortController = controller;  // Store for user cancellation
  
  // Set timeout - 45 seconds (buffer before Vercel's 60s limit)
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 45000);
  
  try {
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseSpecification: baseSpec,
        eaters,
        recipes,
        weeklyPreferences,
        conversationSummary
      }),
      signal: controller.signal  // Enable cancellation
    });
    
    // Clear timeout on successful response
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }
    
    // Success - stop progress simulation
    clearInterval(progressInterval);
    
    // Jump to 100%
    generationState.progress = 100;
    generationState.currentStage = 'Complete!';
    appState.notifyListeners();
    
    // Brief pause to show completion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    clearInterval(progressInterval);
    
    // Handle specific abort scenarios
    if (error.name === 'AbortError') {
      if (generationState.status === 'cancelled') {
        throw new Error('CANCELLED: Generation cancelled by user');
      }
      throw new Error('TIMEOUT: Request took too long. Please try again.');
    }
    
    throw error;
  }
}

/**
 * startProgressSimulation
 * 
 * Creates an interval that simulates progress with realistic timing.
 * Returns the interval ID for cleanup.
 */
function startProgressSimulation(startTime) {
  return setInterval(() => {
    // Update elapsed time
    generationState.elapsedTime = Math.round((Date.now() - startTime) / 1000);
    
    // S-curve progress: fast start, steady middle, slow end
    let increment;
    if (generationState.progress < 30) {
      increment = 2 + Math.random() * 2;  // Fast start
    } else if (generationState.progress < 60) {
      increment = 3 + Math.random() * 2;  // Steady middle
    } else if (generationState.progress < 80) {
      increment = 2 + Math.random() * 1;  // Slowing down
    } else {
      increment = 0.5 + Math.random() * 0.5;  // Slow crawl at end
    }
    
    // Cap at 92% - last 8% reserved for actual completion
    generationState.progress = Math.min(92, generationState.progress + increment);
    
    // Update stage message based on progress
    const stageIndex = Math.min(
      GENERATION_STAGES.length - 1,
      Math.floor(generationState.progress / (100 / GENERATION_STAGES.length))
    );
    generationState.currentStage = GENERATION_STAGES[stageIndex];
    
    appState.notifyListeners();
  }, 500);
}

/**
 * handleGenerationSuccess
 * 
 * Saves generated data and navigates to home page.
 */
async function handleGenerationSuccess(data) {
  let saveError = null;
  
  // Save new recipes
  if (data.newRecipes?.length > 0) {
    const existingRecipes = loadRecipes();
    const result = saveRecipes([...existingRecipes, ...data.newRecipes]);
    if (!result.success) {
      saveError = result.error;
      console.error('Failed to save recipes:', result.error);
    }
  }

  // Save new meals
  if (data.newMeals?.length > 0) {
    const existingMeals = loadMeals();
    const result = saveMeals([...existingMeals, ...data.newMeals]);
    if (!result.success && !saveError) {
      saveError = result.error;
      console.error('Failed to save meals:', result.error);
    }
  }

  // Add conversation to meal plan
  const newMealPlan = data.mealPlan;
  newMealPlan.conversation = {
    startedAt: new Date().toISOString(),
    messages: [
      {
        // 'system' messages are for local UI display only (not sent to API)
        role: 'system',
        content: 'Meal plan generated.',
        timestamp: new Date().toISOString()
      }
    ]
  };

  // Save meal plan
  const planResult = saveCurrentMealPlan(newMealPlan);
  if (!planResult.success && !saveError) {
    saveError = planResult.error;
    console.error('Failed to save meal plan:', planResult.error);
  }

  // Reset state and navigate home
  generationState.status = 'idle';
  navigateTo('/');
  appState.notifyListeners();
  
  // Show storage warning if save had issues
  if (saveError) {
    // Brief delay to let page render first
    setTimeout(() => {
      alert(`Your meal plan was generated but there was a storage issue:\n\n${saveError}\n\nSome data may not have been saved. Please free up storage space.`);
    }, 500);
  }
}

// Action handlers for generation controls
window.cancelGeneration = function() {
  // Mark as cancelled before aborting (so abort handler knows it's user-initiated)
  generationState.status = 'cancelled';
  
  // Abort the in-flight request if one exists
  if (generationState.abortController) {
    generationState.abortController.abort();
    generationState.abortController = null;
  }
  
  // Clean up progress interval
  if (generationState.progressIntervalId) {
    clearInterval(generationState.progressIntervalId);
    generationState.progressIntervalId = null;
  }
  
  // Navigate home
  navigateTo('/');
  appState.notifyListeners();
};

window.retryGeneration = function() {
  // Reset attempt count and start fresh
  generationState.attemptCount = 0;
  startGeneration();
};

window.goToChat = function() {
  generationState.status = 'idle';
  navigateTo('/');
  appState.notifyListeners();
  // Open chat after a brief delay
  setTimeout(() => window.toggleChat(), 100);
};

window.goToCurrentPlan = function() {
  generationState.status = 'idle';
  navigateTo('/');
  appState.notifyListeners();
};
```

---

## 6. CONVERSATION FLOW

### Onboarding Flow (New User)

**Goal:** Collect essential info in ~3 minutes, generate first plan

```
VANESSA: Hi! I'm Vanessa, your meal planning assistant. Let me ask a few 
         quick questions so I can create your first meal plan.
         
         What are your main dietary goals?

USER: I want to follow Diet Compass and stay around 1500 calories

VANESSA: Great choice! Are there any foods you don't eat or want to avoid?

USER: No red meat, no processed foods, no refined sugar

VANESSA: Got it. Do you cook for anyone else, like family members with 
         different preferences?

USER: Yes, my 4-year-old daughter Maya. She's here Sunday lunch through 
      Wednesday lunch. She likes simple foods.

VANESSA: What's your weekly grocery budget?

USER: $150

VANESSA: And which day do you usually do your grocery shopping?

USER: Saturday

VANESSA: Perfect! I have everything I need:
         • Diet: Diet Compass, ~1500 cal/day
         • Avoid: Red meat, processed foods, refined sugar
         • Household: Maya (4yo) Sun lunch - Wed lunch, likes simple foods
         • Budget: $150/week
         • Shopping: Saturday
         
         Click Generate whenever you're ready!

[User clicks Generate]
[Navigates to generation status page with progress UI]
[On success, user sees meal plan view]
```

### Weekly Planning Flow (Returning User)

```
USER: I need to plan next week

VANESSA: Sure! Any special requests for this week?

USER: I have leftover cabbage and Maya wants pasta

VANESSA: How many times would Maya like pasta this week?

USER: Twice would be good

VANESSA: Got it - I'll use up your cabbage across a few meals and include 
         pasta twice for Maya. Click Generate when you're ready!

[User clicks Generate]
[Navigates to generation status page]
[On success, new meal plan loaded]
```

### Profile Update Flow (with confirmation)

```
USER: I want to start intermittent fasting

VANESSA: Great! What eating window works for you? The most common is 
         10am to 6pm or 12pm to 8pm.

USER: Let's do 8am to 6pm, so I can eat breakfast with Maya

VANESSA: Got it. I'll update your eating window to 8am-6pm. This affects 
         all future meal plans. Confirm?

USER: Yes

VANESSA: Done! Your profile now includes an 8am-6pm eating window.
         
         Is there anything else you'd like to change?

USER: No that's it

VANESSA: Perfect! Let me know when you're ready to plan your next week.
```

### General Question Flow

```
USER: How long should I cook salmon?

VANESSA: For a 150g salmon fillet, pan-sear for 4 minutes per side over 
         medium-high heat. The center should be slightly translucent 
         (it'll continue cooking as it rests).
         
         If using your air fryer, 400°F for 8-10 minutes works well too.

USER: Thanks!

VANESSA: You're welcome! Let me know if you need anything else.
```

---

## 7. RECIPE LIBRARY SYSTEM

### Recipe Creation Sources

Recipes can be created in three ways:

1. **AI Generation** (`createdBy: 'generation'`)
   - Created during meal plan generation
   - Most recipes come from here
   - Subject to auto-cleanup if unused

2. **Manual Entry** (`createdBy: 'manual'`)
   - User pastes recipe text, Claude extracts structure
   - User reviews and edits before saving
   - Never auto-deleted (user effort invested)

3. **URL Import** (`createdBy: 'import'`)
   - User provides URL, system fetches and extracts
   - User reviews and edits before saving
   - Never auto-deleted (user effort invested)

### Recipe Usage Tracking

```javascript
// When a meal is marked as cooked
function markMealAsCooked(mealId) {
  const meals = loadMeals();
  const meal = meals.find(m => m.mealId === mealId);
  
  if (meal && !meal.cooked) {
    meal.cooked = true;
    meal.cookedAt = new Date().toISOString();
    saveMeals(meals);
    
    // Update recipe stats
    const recipes = loadRecipes();
    const recipe = recipes.find(r => r.recipeId === meal.recipeId);
    if (recipe) {
      recipe.timesCooked++;
      recipe.lastCooked = new Date().toISOString().split('T')[0];
      saveRecipes(recipes);
    }
  }
}
```

### Recipe Auto-Cleanup

```javascript
// Run on app startup
function cleanupUnusedRecipes() {
  const recipes = loadRecipes();
  const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
  
  const activeRecipes = recipes.filter(recipe => {
    // Keep if ever cooked
    if (recipe.timesCooked > 0) return true;
    
    // Keep if favorited
    if (recipe.isFavorite) return true;
    
    // Keep if manually added (user effort)
    if (recipe.createdBy === 'manual' || recipe.createdBy === 'import') return true;
    
    // Keep if created less than 60 days ago
    if (new Date(recipe.createdAt) > sixtyDaysAgo) return true;
    
    // Delete: never cooked, not favorited, auto-generated, AND older than 60 days
    console.log(`Auto-deleting unused recipe: ${recipe.name}`);
    return false;
  });
  
  if (activeRecipes.length !== recipes.length) {
    saveRecipes(activeRecipes);
  }
}
```

### Recipe Search

```javascript
function searchRecipes(query, options = {}) {
  const recipes = loadRecipes();
  const search = query.toLowerCase();
  
  return recipes.filter(recipe => {
    if (recipe.name.toLowerCase().includes(search)) return true;
    if (recipe.ingredients.some(ing => 
      ing.item.toLowerCase().includes(search)
    )) return true;
    if (recipe.tags?.some(tag => tag.toLowerCase().includes(search))) return true;
    if (recipe.cuisine?.toLowerCase().includes(search)) return true;
    return false;
  });
}
```

---

## 7. USAGE METERING & PLANS

### Plan Tiers

| Feature | Free | Pro |
|---------|------|-----|
| Generations/month | 4 | 20 |
| Messages/month | 100 | 1000 |
| Max eaters | 2 | 10 |
| Price | $0 | TBD |

### Usage Tracking

```javascript
// src/utils/usage.js

import { loadUsageLimits, saveUsageLimits } from './storage.js';
import { loadEaters } from './storage.js';

export function checkUsageLimits(visitorId) {
  const usage = loadUsageLimits();
  
  // Reset if new month
  const now = new Date();
  const periodStart = new Date(usage.currentPeriod.startDate);
  if (now.getMonth() !== periodStart.getMonth() || 
      now.getFullYear() !== periodStart.getFullYear()) {
    usage.currentPeriod = {
      startDate: now.toISOString().split('T')[0],
      generations: 0,
      messages: 0
    };
    saveUsageLimits(usage);
  }
  
  return {
    plan: usage.plan,
    generationsRemaining: usage.limits.generationsPerMonth - usage.currentPeriod.generations,
    messagesRemaining: usage.limits.messagesPerMonth - usage.currentPeriod.messages,
    eatersRemaining: usage.limits.maxEaters - getEaterCount()
  };
}

export function incrementGenerationCount(visitorId) {
  const usage = loadUsageLimits();
  usage.currentPeriod.generations++;
  saveUsageLimits(usage);
}

export function incrementMessageCount(visitorId) {
  const usage = loadUsageLimits();
  usage.currentPeriod.messages++;
  saveUsageLimits(usage);
}

export function canAddEater() {
  const usage = loadUsageLimits();
  const eaters = loadEaters();
  return eaters.length < usage.limits.maxEaters;
}
```

### Usage Display

```javascript
// In ChatWidget
<div class="usage-indicator">
  ${usage.currentPeriod.messages}/${usage.limits.messagesPerMonth} messages this month
</div>

// Show upgrade prompt at 80%
${usage.currentPeriod.messages >= usage.limits.messagesPerMonth * 0.8 ? `
  <div class="usage-warning">
    Running low on messages. <a href="/upgrade">Upgrade to Pro</a>
  </div>
` : ''}
```

### Client-Side Usage Flow

Usage tracking is performed entirely on the client side for MVP-A:

```javascript
// Example: In chat handler (src/utils/windowHandlers.js)

import { checkUsageLimits, incrementMessageCount } from './usage.js';

window.sendChatMessage = async function() {
  // 1. Check limits BEFORE calling API
  const usage = checkUsageLimits();
  if (usage.messagesRemaining <= 0) {
    showUpgradePrompt('messages');
    return;
  }
  
  const input = document.getElementById('chatInput');
  const message = input?.value?.trim();
  if (!message) return;
  
  // Clear input and add user message
  input.value = '';
  chatState.addMessage('user', message);
  chatState.startStreaming();
  
  try {
    // 2. Call API
    const response = await fetch('/api/chat-with-vanessa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationType: chatState.getConversationType(),
        context: chatState.buildContext()
      })
    });
    
    // 3. Stream response...
    await chatState.handleStreamResponse(response);
    
    // 4. Only increment on success
    incrementMessageCount();
    
  } catch (error) {
    console.error('Chat error:', error);
    chatState.addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    // Don't increment - request failed
  } finally {
    chatState.stopStreaming();
  }
};

// Example: In generation handler (src/utils/generateHandler.js)

import { checkUsageLimits, incrementGenerationCount } from './usage.js';

async function startGeneration(context) {
  // 1. Check limits BEFORE calling API
  const usage = checkUsageLimits();
  if (usage.generationsRemaining <= 0) {
    showUpgradePrompt('generations');
    return;
  }
  
  generationState.status = 'generating';
  navigateTo('/generating');
  
  try {
    // 2. Call API
    const response = await fetch('/api/generate-meal-plan', { ... });
    const data = await response.json();
    
    if (data.success) {
      // 3. Only increment on success
      incrementGenerationCount();
      await handleGenerationSuccess(data);
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    // Don't increment - request failed
    handleGenerationFailure(error);
  }
}
```

### Known Limitations (MVP-A)

**⚠️ Client-Side Usage Tracking is Not Secure**

In MVP-A, usage limits are tracked entirely in localStorage on the client side. This means:

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users can edit localStorage | Bypass limits entirely | Accept for MVP |
| Users can clear localStorage | Reset usage to 0 | Accept for MVP |
| Users can change visitorId | Get fresh limits | Accept for MVP |

**Why This is Acceptable for MVP-A:**
- Most users won't bother cheating
- The cost of abuse is limited (API costs are per-use)
- Prevents *accidental* overuse by legitimate users
- Allows us to ship faster without additional infrastructure

**Phase 2 Solution (Firebase):**
Proper enforcement requires:
1. **User Authentication** - Firebase Auth to identify users
2. **Server-Side Storage** - Usage counts stored in Firestore
3. **Server Validation** - API checks Firestore before processing

```javascript
// Phase 2: Server-side enforcement (api/generate-meal-plan.js)

import { auth } from '../lib/firebase-admin';
import { db } from '../lib/firebase-admin';

export default async function handler(req, res) {
  // Verify Firebase auth token
  const token = req.headers.authorization?.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(token);
  const userId = decodedToken.uid;
  
  // Check usage in Firestore
  const usageDoc = await db.collection('usage').doc(userId).get();
  const usage = usageDoc.data();
  
  if (usage.currentPeriod.generations >= usage.limits.generationsPerMonth) {
    return res.status(429).json({ error: 'Generation limit reached' });
  }
  
  // ... process request ...
  
  // Increment in Firestore (atomic)
  await db.collection('usage').doc(userId).update({
    'currentPeriod.generations': admin.firestore.FieldValue.increment(1)
  });
}
```

---

## 9. OFFLINE MODE

### What Works Offline

| Feature | Available Offline |
|---------|-------------------|
| View current meal plan | ✅ Yes |
| View shopping list | ✅ Yes |
| Check off shopping items | ✅ Yes |
| View daily recipes | ✅ Yes |
| Browse recipe library | ✅ Yes |
| View recipe details | ✅ Yes |
| Chat with Vanessa | ❌ No |
| Generate meal plan | ❌ No |
| Update profile | ❌ No |
| Add recipe (paste/URL) | ❌ No |
| Submit feedback | ❌ No (queued) |

### Offline Detection

```javascript
// src/utils/offline.js

const offlineState = {
  isOnline: navigator.onLine,
  
  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingActions();
      appState.notifyListeners();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      appState.notifyListeners();
    });
  },
  
  pendingActions: [],
  
  queueAction(action) {
    this.pendingActions.push({
      ...action,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
  },
  
  async processPendingActions() {
    const pending = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    
    for (const action of pending) {
      try {
        if (action.type === 'feedback') {
          await submitFeedback(action.data);
        }
      } catch (error) {
        console.error('Failed to process pending action:', error);
      }
    }
    
    localStorage.removeItem('pendingActions');
    this.pendingActions = [];
  }
};
```

### UI Indicators

```javascript
function OfflineBanner() {
  if (navigator.onLine) return '';
  
  return `
    <div class="offline-banner">
      📶 You're offline. Some features are unavailable.
    </div>
  `;
}

/**
 * StorageWarningBanner
 * Shows warning when localStorage is running low
 */
function StorageWarningBanner() {
  const health = checkStorageHealth();
  
  if (health.status === 'ok') return '';
  
  const bgClass = health.status === 'critical' 
    ? 'bg-red-100 text-red-800 border-red-200' 
    : 'bg-warning/10 text-warning border-warning/20';
  
  const icon = health.status === 'critical' ? '⚠️' : '💾';
  
  return `
    <div class="storage-warning-banner ${bgClass} border rounded-lg p-3 mx-4 mt-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span>${icon}</span>
        <span class="text-sm">${health.message}</span>
      </div>
      <button 
        onclick="window.showStorageManager()"
        class="text-sm underline hover:no-underline"
      >
        Manage Storage
      </button>
    </div>
  `;
}

/**
 * Storage Manager - allows users to see usage and clean up data
 */
window.showStorageManager = function() {
  const usage = getStorageUsage();
  const recipes = loadRecipes();
  const meals = loadMeals();
  
  const generatedRecipes = recipes.filter(r => r.createdBy === 'generation' && r.timesCooked === 0);
  const favoriteRecipes = recipes.filter(r => r.isFavorite);
  const manualRecipes = recipes.filter(r => r.createdBy === 'manual' || r.createdBy === 'import');
  
  const message = `
Storage Usage: ${usage.usedMB} MB (${usage.percentage}%)

Data Breakdown:
• ${recipes.length} recipes (${generatedRecipes.length} unused generated)
• ${meals.length} meals
• ${favoriteRecipes.length} favorites
• ${manualRecipes.length} manually added

Options:
• "Clean Up" - Remove unused generated recipes
• "Export" - Download your data before cleaning
• "Cancel" - Do nothing
  `.trim();
  
  const choice = confirm(message + '\n\nClean up unused recipes now?');
  
  if (choice) {
    const result = cleanupUnusedRecipes();
    alert(`Cleaned up! Removed ${result.removed} unused recipes.`);
    appState.notifyListeners();
  }
};

/**
 * Enhanced cleanup that returns stats
 */
function cleanupUnusedRecipes() {
  const recipes = loadRecipes();
  const mealPlan = loadCurrentMealPlan();
  const meals = loadMeals();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  // Get recipe IDs used in current meal plan
  const currentRecipeIds = new Set();
  if (mealPlan?.mealIds) {
    for (const mealId of mealPlan.mealIds) {
      const meal = meals.find(m => m.mealId === mealId);
      if (meal) currentRecipeIds.add(meal.recipeId);
    }
  }
  
  const originalCount = recipes.length;
  
  const activeRecipes = recipes.filter(recipe => {
    if (recipe.timesCooked > 0) return true;
    if (recipe.isFavorite) return true;
    if (recipe.createdBy === 'manual' || recipe.createdBy === 'import') return true;
    if (currentRecipeIds.has(recipe.recipeId)) return true;
    // More aggressive: 30 days instead of 60
    if (new Date(recipe.createdAt) > thirtyDaysAgo) return true;
    return false;
  });
  
  saveRecipes(activeRecipes);
  
  return {
    removed: originalCount - activeRecipes.length,
    remaining: activeRecipes.length
  };
}
```

---

## 10. MIGRATION PLAN

### From Current App to Vanessa (MVP-A)

**Goal:** Preserve existing data, smooth transition

#### Step 1: Add New Components (Days 1-3)

Add alongside existing system:
- ChatWidget component
- Normalized data stores (eaters, recipes, meals)
- Base specification storage
- New API endpoints

**User impact:** None - old system still works

#### Step 2: Create Migration Script (Day 4)

```javascript
// src/utils/migrate.js

function migrateToVanessa() {
  const existingPlan = localStorage.getItem('currentMealPlan');
  const existingFeedback = localStorage.getItem('mealPlannerFeedback');
  
  // Create eaters
  if (!localStorage.getItem('eaters')) {
    const eaters = [
      {
        _schemaVersion: 1,
        eaterId: 'eater_roland',
        name: 'Roland',
        preferences: 'Diet Compass protocol, 1500 cal/day, no red meat, no processed foods, no refined sugars. Prefers fatty fish, legumes, whole grains, fermented foods.',
        schedule: 'Available all meals. 8am-6pm eating window. 24-hour fast Thursday lunch to Friday lunch.',
        allergies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _schemaVersion: 1,
        eaterId: 'eater_maya',
        name: 'Maya',
        preferences: 'Simple foods, likes pasta, fruit, crackers. Dislikes spicy or complex flavors.',
        schedule: 'Sun lunch & dinner, Mon-Tue all meals (lunch packed), Wed breakfast & lunch',
        allergies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('eaters', JSON.stringify(eaters));
  }
  
  // Create base specification
  if (!localStorage.getItem('baseSpecification')) {
    const baseSpec = {
      _schemaVersion: 1,
      ownerEaterId: 'eater_roland',
      weeklyBudget: 150,
      shoppingDay: 6,
      preferredStore: 'Coles Caulfield',
      householdEaterIds: ['eater_roland', 'eater_maya'],
      vanessaPersonality: 'friendly-casual',
      communicationPreferences: 'Concise, practical advice',
      onboardingComplete: true,
      enhancedProfileComplete: true,
      conversation: {
        startedAt: new Date().toISOString(),
        messages: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('baseSpecification', JSON.stringify(baseSpec));
  }
  
  // Create usage limits
  if (!localStorage.getItem('usageLimits')) {
    const usage = {
      visitorId: 'visitor_roland',
      plan: 'pro',  // Existing user gets pro
      limits: {
        generationsPerMonth: 20,
        messagesPerMonth: 1000,
        maxEaters: 10
      },
      currentPeriod: {
        startDate: new Date().toISOString().split('T')[0],
        generations: 0,
        messages: 0
      }
    };
    localStorage.setItem('usageLimits', JSON.stringify(usage));
  }
  
  // Extract recipes from existing meal plan
  if (existingPlan && !localStorage.getItem('recipes')) {
    const plan = JSON.parse(existingPlan);
    const recipes = extractRecipesFromLegacyPlan(plan);
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }
  
  return { success: true, migrated: true };
}
```

#### Step 3: Enable Vanessa (Day 5)

- Make chat widget visible
- Add Profile page to navigation
- Add Recipe Library to navigation
- Show migration notice to user

#### Step 4: Remove Old Generate Page (Day 6+)

- Redirect to chat
- Keep old endpoint as fallback temporarily

### Rollback Plan

If issues arise:
1. Feature flag: `localStorage.setItem('useVanessa', 'false')`
2. Revert to old generate page
3. Keep new data stores for future use

---

## 11. DEVELOPMENT TIMELINE

### MVP-A: Core Experience (3 weeks)

#### Week 1: Infrastructure & Foundation

**Day 1: Data Model & Storage**
- [ ] Define normalized schema (Eaters, Recipes, Meals, Meal Plans)
- [ ] Create storage utilities (load/save for each entity)
- [ ] Implement migration script from existing app
- [ ] Add schema versioning
- **Deliverable:** Data layer complete

**Day 2: Routing & App Shell**
- [ ] Implement hash-based router
- [ ] Create route definitions and matching logic
- [ ] Build main App component with navigation
- [ ] Set up appState and render cycle
- [ ] Test route navigation and browser back/forward
- **Deliverable:** Working SPA routing

**Day 3: Chat Widget & Streaming**
- [ ] Create ChatWidget.js component
- [ ] Implement SSE streaming endpoint (/api/chat-with-vanessa)
- [ ] Build correct Anthropic event parsing
- [ ] Test basic chat flow
- **Deliverable:** Working chat with streaming

**Day 4: Conversations & Context**
- [ ] Attach conversations to base spec / meal plans
- [ ] Build Vanessa system prompts (onboarding + regular)
- [ ] Implement onboarding flow
- [ ] Test profile update with confirmation
- **Deliverable:** Complete conversation system

**Day 5: Usage Metering**
- [ ] Implement usage tracking (only on success)
- [ ] Add plan limits (free/pro)
- [ ] Create upgrade prompts
- [ ] Add usage indicators to chat UI
- **Deliverable:** Complete metering system

#### Week 2: Generation & Recipes

**Day 6: Generation API & Transform**
- [ ] Create /api/generate-meal-plan endpoint
- [ ] Build generation prompts with recipe context
- [ ] Implement transformGeneratedPlan() function
- [ ] Implement extractWeeklyPreferences() and summarizeConversation()
- [ ] Test recipe deduplication logic
- **Deliverable:** Working generation API

**Day 7: Generation Status Page**
- [ ] Create GenerationStatusPage component
- [ ] Implement progress simulation (S-curve timing)
- [ ] Build stage messages and elapsed time display
- [ ] Style progress bar and container
- **Deliverable:** Generation progress UI

**Day 8: Generation Retry & Error Handling**
- [ ] Implement automatic retry on first failure
- [ ] Build retry state UI ("First attempt didn't work out...")
- [ ] Create failed state with action buttons
- [ ] Wire up "Try Again", "Talk to Vanessa", "Go to Current Plan"
- [ ] Test full generation flow end-to-end
- **Deliverable:** Robust generation with retry

**Day 9: Recipe Library**
- [ ] Create RecipeLibrary component
- [ ] Implement search and filters
- [ ] Add rating and favorites
- [ ] Build RecipeDetailPage
- [ ] Implement usage tracking (timesCooked)
- [ ] Add auto-cleanup logic (60-day unused, exclude manual/import)
- **Deliverable:** Full recipe library

**Day 10: Add Recipe Flow**
- [ ] Create AddRecipePage component with mode switching
- [ ] Implement paste text extraction flow
- [ ] Implement URL import flow
- [ ] Create /api/extract-recipe endpoint
- [ ] Build review/edit form
- [ ] Add route and navigation
- [ ] Add "Add Recipe" button to RecipeLibrary
- **Deliverable:** Complete manual recipe addition

#### Week 3: Views, Polish & Testing

**Day 11: Home & Day Views**
- [ ] Update HomePage for new/returning users
- [ ] Implement renderMealPlanHomePage() function
- [ ] Build DayViewPage for single day meals
- [ ] Create ShoppingListPage
- [ ] Build ProfilePage for base specification
- **Deliverable:** All main views complete

**Day 12: Offline Mode**
- [ ] Implement offline detection
- [ ] Disable chat, generation, and add recipe when offline
- [ ] Add offline UI indicators (banner, disabled states)
- [ ] Queue feedback submissions for later
- [ ] Test reconnection handling
- **Deliverable:** Graceful offline experience

**Day 13: Mobile & Responsive**
- [ ] Mobile chat full-screen overlay
- [ ] Desktop chat side panel (70/30 split)
- [ ] Responsive layouts for all pages
- [ ] Touch-friendly targets (min 44px)
- [ ] Test on actual mobile devices
- **Deliverable:** Mobile-ready app

**Day 14: Testing & Bug Fixes**
- [ ] Run through full manual testing checklist
- [ ] Test generation status page all states
- [ ] Test routing edge cases
- [ ] Test recipe deduplication edge cases
- [ ] Test usage metering (success vs failure)
- [ ] Test add recipe flows (paste and URL)
- [ ] Fix all bugs found
- **Deliverable:** Stable, tested system

**Day 15: Buffer**
- Reserved for:
  - Unexpected issues
  - Performance optimization
  - Additional edge cases
  - Final polish

### MVP-A Summary

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Infrastructure | Data model, routing, chat, conversations, metering |
| 2 | Generation & Recipes | API, status page, retry logic, recipe library, add recipe |
| 3 | Views & Polish | All views, offline, mobile, testing |

---

### MVP-B: Pantry & Inventory System (2 weeks) - PLANNED

#### Week 1: Core Inventory

**Day 1-2: Data Model & Storage**
- [ ] Define Ingredient schema (name, category, defaultUnit, typicalShelfLife)
- [ ] Define InventoryItem schema (ingredientId, quantity, unit, location, expiryDate, addedAt)
- [ ] Create storage utilities
- [ ] Seed common ingredients

**Day 3-4: Pantry UI**
- [ ] Create PantryPage component
- [ ] Implement add item form
- [ ] Build item list grouped by location (Fridge/Freezer/Pantry)
- [ ] Add quantity adjustment controls
- [ ] Implement delete/mark as finished

**Day 5: Expiry Management**
- [ ] Add expiry date input to add form
- [ ] Implement expiry warnings (today, this week, expired)
- [ ] Color-code items by expiry status
- [ ] Add "expiring soon" filter

#### Week 2: Integration & Smart Features

**Day 6-7: Shopping → Pantry Flow**
- [ ] Add "I bought the shopping list" button
- [ ] Auto-create inventory items from shopping list
- [ ] Handle quantity input for bulk add
- [ ] Set default expiry dates by ingredient category

**Day 8-9: Cooking → Decrement Flow**
- [ ] When meal marked as cooked, show ingredient list
- [ ] Auto-suggest quantities to decrement
- [ ] User confirms or adjusts
- [ ] Update inventory quantities

**Day 10: Photo Scan (Stretch)**
- [ ] Add "Scan with photo" option
- [ ] Send photo to Claude vision API
- [ ] Extract visible items
- [ ] User reviews and adds to inventory

---

## 12. ERROR HANDLING & LOGGING

### Error Types & Recovery

| Error | User Message | Recovery |
|-------|--------------|----------|
| API_KEY_MISSING | "Configuration issue. Please contact support." | Check Vercel env vars |
| NETWORK_ERROR | "Can't connect. Check your internet and try again." | Retry button |
| GENERATION_FAILED | "Couldn't generate meal plan. Please try again." | Retry, or start new chat |
| TIMEOUT | "Request took too long. Please try again." | Retry button |
| CANCELLED | "Generation cancelled." | Navigate home (no error shown) |
| RATE_LIMIT | "Too many requests. Please wait a moment." | Auto-retry after delay |
| USAGE_LIMIT | "You've reached your plan limit." | Show upgrade option |
| INVALID_RESPONSE | "Something went wrong. Please try again." | Retry |
| STORAGE_FULL | "Storage is full. Please export your data and clear old meal plans." | Auto-cleanup attempted first, then show Storage Manager |
| URL_BLOCKED | "Could not access that URL. The website may be blocking access." | Try paste method instead |
| NO_RECIPE_FOUND | "No recipe found in the text." | Ask user to paste different content |

### Error Logging

```javascript
// src/utils/logging.js

function logError(type, error, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent
  };
  
  const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
  errorLog.push(logEntry);
  
  // Keep last 50 errors
  if (errorLog.length > 50) {
    errorLog.splice(0, errorLog.length - 50);
  }
  
  localStorage.setItem('errorLog', JSON.stringify(errorLog));
  console.error('Logged error:', logEntry);
}

function logApiUsage(visitorId, action) {
  const today = new Date().toISOString().split('T')[0];
  const usageLog = JSON.parse(localStorage.getItem('usageLog') || '[]');
  
  let todayEntry = usageLog.find(e => e.date === today);
  if (!todayEntry) {
    todayEntry = { date: today, chatMessages: 0, generations: 0, apiCalls: 0 };
    usageLog.push(todayEntry);
  }
  
  if (action === 'chat') {
    todayEntry.chatMessages++;
  } else if (action === 'generation') {
    todayEntry.generations++;
  }
  todayEntry.apiCalls++;
  
  // Keep last 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const filtered = usageLog.filter(e => new Date(e.date) > cutoff);
  
  localStorage.setItem('usageLog', JSON.stringify(filtered));
}
```

---

## 13. TESTING STRATEGY

### Manual Testing Checklist

**Onboarding:**
- [ ] New user sees welcome screen
- [ ] Chat opens with onboarding prompt
- [ ] 5-6 questions asked
- [ ] Eaters created after completion
- [ ] Base specification created
- [ ] Generate button always visible

**Weekly Planning:**
- [ ] Returning user can request new plan
- [ ] Weekly preferences captured
- [ ] Generate button works
- [ ] Navigates to generation status page
- [ ] Meal plan displays correctly on success

**Profile Updates:**
- [ ] User can request changes via chat
- [ ] Vanessa asks for confirmation
- [ ] Changes only applied after confirmation
- [ ] Changes persist across sessions

**Recipe Library:**
- [ ] Recipes created during generation
- [ ] Existing recipes reused when appropriate
- [ ] Search works
- [ ] Filters work
- [ ] Rating saves
- [ ] Favorites toggle works
- [ ] Usage tracking works
- [ ] "Add Recipe" button visible

**Add Recipe - Paste:**
- [ ] "Paste Recipe Text" option works
- [ ] Can paste multi-line recipe text
- [ ] "Format Recipe" calls API
- [ ] Loading state shown during extraction
- [ ] Extracted recipe shown in review form
- [ ] All fields editable
- [ ] "Save to Library" creates recipe
- [ ] Recipe appears in library with `createdBy: 'manual'`
- [ ] Error shown if no recipe found in text

**Add Recipe - URL:**
- [ ] "Import from URL" option works
- [ ] Can paste URL
- [ ] "Import Recipe" calls API
- [ ] Loading state shown during import
- [ ] Extracted recipe shown in review form
- [ ] All fields editable
- [ ] "Save to Library" creates recipe
- [ ] Recipe appears in library with `createdBy: 'import'`
- [ ] Error shown if URL inaccessible
- [ ] Error shown if no recipe found on page

**Usage Metering:**
- [ ] Message count increments only on successful chat completion
- [ ] Generation count increments only on successful generation
- [ ] Recipe extraction does NOT count against chat/generation limits
- [ ] Failed API calls do NOT increment usage counts
- [ ] Limits enforced
- [ ] Upgrade prompts appear at limit

**Offline Mode:**
- [ ] Meal plan viewable offline
- [ ] Shopping list works offline
- [ ] Recipe library viewable offline
- [ ] Chat disabled offline
- [ ] Generation disabled offline
- [ ] Add Recipe disabled offline
- [ ] Offline banner shows
- [ ] Reconnection detected

**Mobile:**
- [ ] Chat is full-screen
- [ ] All pages responsive
- [ ] Touch targets adequate
- [ ] No horizontal scroll
- [ ] Add Recipe forms usable on mobile

**Generation Status Page:**
- [ ] Clicking Generate navigates to `/generating` route
- [ ] Progress bar starts at 0%
- [ ] Progress bar animates smoothly (S-curve timing)
- [ ] Stage messages update as progress increases
- [ ] Elapsed time counter increments correctly
- [ ] Progress caps at 92% until API returns
- [ ] On success, progress jumps to 100% with "Complete!" message
- [ ] On success, auto-navigates to home after 500ms delay
- [ ] Chat widget is NOT visible on generation page

**Generation Retry Flow:**
- [ ] First API failure triggers automatic retry
- [ ] Retry notice appears: "First attempt didn't work out..."
- [ ] Progress resets to 0% for retry attempt
- [ ] Elapsed time resets for retry attempt
- [ ] Successful retry navigates to home normally

**Generation Failed State (after 2 attempts):**
- [ ] Failed state shows after second failure
- [ ] Message displays: "There seems to be something wrong."
- [ ] "Try Again" button visible and works
- [ ] "Talk to Vanessa" button visible and opens chat
- [ ] "Go to Current Plan" button visible (only if meal plan exists)
- [ ] "Go to Current Plan" button hidden for new users without a plan

**Routing:**
- [ ] Hash-based URLs work (e.g., `/#/recipes`)
- [ ] Direct URL entry navigates correctly
- [ ] Browser back button works
- [ ] Browser forward button works
- [ ] Invalid routes redirect to home
- [ ] Dynamic routes extract params correctly (e.g., `/recipe/:id`)
- [ ] Navigation via `navigateTo()` updates URL and renders correct page
- [ ] `/recipes/add` route works

**Data Transformation (transformGeneratedPlan):**
- [ ] Existing recipes matched by ID are reused (not duplicated)
- [ ] Existing recipes matched by name are reused
- [ ] Same recipe used twice in one plan only creates one recipe object
- [ ] New recipes get unique IDs
- [ ] Meal IDs follow correct format (meal_YYYYMMDD_day_slot)
- [ ] Weekly preferences stored in meal plan object
- [ ] Budget data passed through correctly
- [ ] Shopping list passed through correctly

**Recipe Auto-Cleanup:**
- [ ] Recipes with `timesCooked > 0` are kept
- [ ] Favorited recipes are kept
- [ ] Recipes with `createdBy: 'manual'` are kept
- [ ] Recipes with `createdBy: 'import'` are kept
- [ ] Generated recipes older than 60 days with no usage are deleted

**Storage Quota Handling:**
- [ ] `getStorageUsage()` returns accurate byte count and percentage
- [ ] Warning banner appears at 80% storage capacity
- [ ] Critical banner appears at 95% storage capacity
- [ ] "Manage Storage" button opens storage manager
- [ ] Storage manager shows data breakdown (recipes, meals, etc.)
- [ ] Cleanup removes correct number of unused recipes
- [ ] `safeSave()` catches QuotaExceededError
- [ ] Emergency cleanup runs automatically on quota exceeded
- [ ] Emergency cleanup removes data in correct priority order
- [ ] Save failures show user-friendly error message
- [ ] Generation completes even if some saves fail (with warning)
- [ ] App startup runs cleanup automatically

### Performance Targets

| Metric | Target | Timeout |
|--------|--------|---------|
| Chat response start | < 1 second | 25s client / 30s server |
| Meal plan generation | < 30 seconds | 45s client / 60s server |
| Recipe extraction (paste) | < 10 seconds | 25s client / 30s server |
| Recipe extraction (URL) | < 15 seconds | 25s client / 30s server |
| Recipe search | < 100ms | N/A (local) |
| Page load | < 1 second | N/A |
| Route navigation | < 50ms | N/A |
| Progress bar animation | 60fps (smooth) | N/A |

### Edge Case Testing

**Generation Edge Cases:**
- [ ] User clicks Generate with no conversation (uses base spec only)
- [ ] User navigates away during generation (state cleanup)
- [ ] User refreshes page during generation (graceful recovery)
- [ ] Very fast API response (< 2 seconds) - still shows progress briefly
- [ ] Very slow API response (> 30 seconds) - progress stays at 92%
- [ ] Network disconnection during generation
- [ ] User clicks Cancel button during generation (aborts request, navigates home)
- [ ] Request times out at 45 seconds (shows timeout error, offers retry)
- [ ] Cancellation during retry attempt (clean abort, no error shown)

**Recipe Deduplication Edge Cases:**
- [ ] Recipe name with different casing matches (case-insensitive)
- [ ] Claude returns invalid recipeId - creates new recipe instead
- [ ] Empty recipe library - all recipes created as new
- [ ] Large recipe library (100+) - performance acceptable

**Add Recipe Edge Cases:**
- [ ] Very long pasted text (> 10,000 chars) - truncated appropriately
- [ ] URL with query params - handled correctly
- [ ] URL with redirects - follows redirects
- [ ] URL returning non-HTML (PDF, etc.) - graceful error
- [ ] Pasted text with no recipe (just random text) - error shown
- [ ] Recipe with missing fields - defaults applied
- [ ] User edits all fields before saving - edits preserved

**Routing Edge Cases:**
- [ ] URL with query params (should ignore params)
- [ ] URL with trailing slash (should match route)
- [ ] Empty hash (defaults to home)
- [ ] Hash with just "/" (matches home)

**Storage Edge Cases:**
- [ ] localStorage at 79% - no warning shown
- [ ] localStorage at 81% - warning banner shown
- [ ] localStorage at 96% - critical banner shown
- [ ] Save fails due to quota - emergency cleanup runs automatically
- [ ] Emergency cleanup frees enough space - retry succeeds
- [ ] Emergency cleanup insufficient - user shown error message
- [ ] All data is important (favorites, manual) - nothing to clean, error shown
- [ ] User dismisses Storage Manager without action - banner persists
- [ ] localStorage completely full - graceful degradation, app still viewable

---

## APPENDICES

### Appendix A: API Cost Estimates

**Claude API Pricing (Sonnet):**
- Input: $3/million tokens
- Output: $15/million tokens

**Usage Estimates per Activity:**

| Activity | Input Tokens | Output Tokens | Cost |
|----------|--------------|---------------|------|
| Onboarding chat (6 turns) | 3,000 | 3,000 | $0.054 |
| Weekly planning chat (4 turns) | 4,000 | 2,000 | $0.042 |
| Meal plan generation | 5,000 | 8,000 | $0.135 |
| Recipe extraction (paste/URL) | 2,000 | 1,000 | $0.021 |
| General question (1 turn) | 2,000 | 500 | $0.014 |

**Monthly Cost (1 user, active usage):**
- 1 onboarding: $0.054
- 4 weekly generations: $0.54
- 8 planning chats: $0.336
- 10 misc questions: $0.14
- 4 recipe imports: $0.084
- **Total: ~$1.15/month**

### Appendix B: localStorage Keys Reference

```javascript
'eaters'                // Household members
'recipes'               // Recipe library (largest - can grow to several MB)
'meals'                 // Meal instances
'currentMealPlan'       // Active week's plan with conversation
'baseSpecification'     // User profile with conversation
'usageLimits'           // Plan tier and usage tracking
'usageLog'              // Daily API usage (last 30 days) - LOW PRIORITY
'errorLog'              // Error log (last 50 errors) - LOW PRIORITY
'pendingActions'        // Actions queued while offline
'mealPlannerApp'        // Shopping list checked items
'mealPlannerFeedback'   // Feedback history (last 8 weeks)
'shoppingListChecked'   // Shopping list checkbox state
```

**Storage Limits:**
- Typical localStorage limit: 5-10MB (varies by browser)
- Warning threshold: 80% (~4MB)
- Critical threshold: 95% (~4.75MB)

**Emergency Cleanup Priority (removed first → last):**
1. `errorLog` - Can be regenerated, debugging only
2. `usageLog` - Can be regenerated, analytics only
3. Conversation history - Trimmed to last 10 messages each
4. Unused generated recipes - Never cooked, not favorited, not in current plan
5. Old meals - Meals not in current week's plan

### Appendix C: Future Enhancements (Post MVP-A & MVP-B)

- Voice input/output for Vanessa
- Firebase authentication and cloud storage
- Universal recipe library (shared across users)
- Partial week regeneration
- Shopping list sharing
- Meal plan collaboration
- Push notifications for meal prep reminders
- Restaurant/commercial tier

---

## 14. ENVIRONMENT CONFIGURATION

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | API key for Claude AI | Yes |

### Vercel Deployment Setup

**⚠️ Important: Vercel Pro Plan Required**

Meal plan generation typically takes 15-30 seconds, which exceeds the Hobby plan's 10-second serverless function limit. **Vercel Pro plan is required** for the 60-second function timeout.

| Plan | Function Timeout | Sufficient for Generation? |
|------|------------------|---------------------------|
| Hobby | 10 seconds | ❌ No |
| Pro | 60 seconds | ✅ Yes |
| Enterprise | 900 seconds | ✅ Yes |

**Setup Steps:**

1. Go to your Vercel project dashboard
2. Ensure you're on the **Pro plan** (or upgrade if needed)
3. Navigate to **Settings → Environment Variables**
4. Add the following variable:

| Name | Value | Environments |
|------|-------|--------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Production, Preview, Development |

5. Click **Save**
6. Redeploy your application for changes to take effect

### Local Development Setup

1. Create a `.env.local` file in the project root:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

2. Ensure `.env.local` is in your `.gitignore` (it should be by default):

```gitignore
# .gitignore
.env.local
.env*.local
```

3. Restart your development server after adding environment variables

### Getting an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to **API Keys** in the sidebar
4. Click **Create Key**
5. Copy the key immediately (it won't be shown again)
6. Store securely - never commit to version control

### API Key Security Best Practices

- **Never** commit API keys to git
- **Never** expose keys in client-side code
- Use environment variables for all sensitive values
- Rotate keys periodically
- Use separate keys for development and production
- Monitor usage in the Anthropic console

---

## CONCLUSION

This v5.2 specification incorporates all refinements from the review process:

**Architecture Changes:**
- Normalized data model (Eaters, Recipes, Meals, Meal Plans)
- Conversations tied to data objects (not ephemeral sessions)
- Recipes as first-class objects with usage tracking
- Simplified eater schedules (natural language strings)

**Recipe Management:**
- Manual recipe addition via paste text
- Recipe import via URL
- Claude extracts and structures recipe data
- User reviews/edits before saving
- Manual/imported recipes excluded from auto-cleanup

**UX Simplifications:**
- Generate button always visible
- Profile updates require confirmation
- Post-generation: navigates to progress page, then home on success

**Business Model:**
- Usage metering built in (generations, messages)
- Plan tiers defined (free, pro)
- Recipe extraction is free (not counted)

**Technical Improvements:**
- Correct SSE streaming implementation
- Recipe auto-cleanup (unused after 60 days, excludes manual/import)
- Proper error handling
- JSON parse error recovery

**Scope Management:**
- MVP-A: Core experience + recipe addition (3 weeks)
- MVP-B: Pantry & inventory system (planned, 2 weeks)

**Timeline:** 3 weeks for MVP-A

**Next Steps:**
1. Review this specification
2. ~~Address the 15 identified implementation issues~~ ✅ Complete
3. Begin Day 1 tasks (Data Model & Storage)
4. Test frequently
5. Adjust as needed
