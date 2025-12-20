# Vanessa Specification v5.2 - Implementation Issues

**Document Purpose:** Reference guide for implementation gaps and fixes needed before building the application in Cursor.

**Total Issues Identified:** 15  
**Created:** December 19, 2025

---

## Issue Summary Table

| # | Issue | Severity | Category | Estimated Fix Time |
|---|-------|----------|----------|-------------------|
| 1 | Missing `appState` implementation | Critical | State Management | 30 mins |
| 2 | Missing storage utility functions | Critical | Data Layer | 1 hour |
| 3 | Server/client architecture confusion | Critical | Architecture | 1 hour |
| 4 | Missing window handler functions | Critical | UI Handlers | 1 hour |
| 5 | Missing page components | Major | UI Components | 2 hours |
| 6 | Missing `renderMealPlanHomePage()` | Major | UI Components | 1 hour |
| 7 | Chat history format incompatible with Anthropic | Major | API Integration | 30 mins |
| 8 | No JSON parse error handling | Major | Error Handling | 30 mins |
| 9 | No loading states in ChatWidget | Medium | UX | 30 mins |
| 10 | No search debouncing | Medium | Performance | 15 mins |
| 11 | Progress interval not cleaned up | Medium | Memory Leak | 15 mins |
| 12 | Missing CSS | Medium | Styling | 2 hours |
| 13 | Missing helper functions | Minor | Utilities | 15 mins |
| 14 | Week calculation edge case | Minor | Logic | 15 mins |
| 15 | No environment variable documentation | Minor | Documentation | 15 mins |

**Total Estimated Fix Time:** ~10-11 hours

---

## Critical Issues (App Won't Function)

### Issue #1: Missing `appState` Implementation

**Severity:** Critical  
**Category:** State Management

**Problem:**
The specification references `appState.notifyListeners()` and `appState.subscribe()` throughout the codebase, but there's no actual implementation of this state management system.

**Where It Appears:**
- `chatState.openChat()` → calls `appState.notifyListeners()`
- `handleRouteChange()` → calls `appState.notifyListeners()`
- `GenerationStatusPage` progress updates → calls `appState.notifyListeners()`
- App initialization → calls `appState.subscribe(() => { ... })`
- `AddRecipePage` state changes → calls `appState.notifyListeners()`

**Impact:**
When implemented in Cursor, every component that calls `appState.notifyListeners()` will throw:
```
TypeError: Cannot read property 'notifyListeners' of undefined
```

**Suggested Fix:**

Create `src/utils/appState.js`:

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

---

### Issue #2: Missing Storage Utility Functions

**Severity:** Critical  
**Category:** Data Layer

**Problem:**
The specification calls storage functions like `loadRecipes()`, `saveRecipes()`, `loadEaters()`, `loadBaseSpecification()`, etc., but these are never defined.

**Where It Appears:**
- `RecipeLibrary` → `loadRecipes()`
- `ChatWidget` → `loadBaseSpecification()`, `loadCurrentMealPlan()`, `loadUsageLimits()`
- `chatState.addMessage()` → `saveCurrentMealPlan()`, `saveBaseSpecification()`
- `HomePage` → `loadCurrentMealPlan()`, `loadBaseSpecification()`
- `GenerationStatusPage` → `loadEaters()`, `loadMeals()`, `saveMeals()`, `saveRecipes()`
- `AddRecipePage` → `loadRecipes()`, `saveRecipes()`
- `cleanupUnusedRecipes()` → `loadRecipes()`, `saveRecipes()`

**Impact:**
Every component will throw `ReferenceError: loadRecipes is not defined`.

**Suggested Fix:**

Create `src/utils/storage.js`:

```javascript
// src/utils/storage.js

// ============================================
// EATERS
// ============================================

export function loadEaters() {
  const data = localStorage.getItem('eaters');
  return data ? JSON.parse(data) : [];
}

export function saveEaters(eaters) {
  localStorage.setItem('eaters', JSON.stringify(eaters));
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
  localStorage.setItem('recipes', JSON.stringify(recipes));
}

// ============================================
// MEALS
// ============================================

export function loadMeals() {
  const data = localStorage.getItem('meals');
  return data ? JSON.parse(data) : [];
}

export function saveMeals(meals) {
  localStorage.setItem('meals', JSON.stringify(meals));
}

// ============================================
// MEAL PLANS
// ============================================

export function loadCurrentMealPlan() {
  const data = localStorage.getItem('currentMealPlan');
  return data ? JSON.parse(data) : null;
}

export function saveCurrentMealPlan(mealPlan) {
  localStorage.setItem('currentMealPlan', JSON.stringify(mealPlan));
}

// ============================================
// BASE SPECIFICATION
// ============================================

export function loadBaseSpecification() {
  const data = localStorage.getItem('baseSpecification');
  return data ? JSON.parse(data) : null;
}

export function saveBaseSpecification(baseSpec) {
  localStorage.setItem('baseSpecification', JSON.stringify(baseSpec));
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
  localStorage.setItem('usageLimits', JSON.stringify(usage));
}

// ============================================
// USAGE LOG
// ============================================

export function loadUsageLog() {
  const data = localStorage.getItem('usageLog');
  return data ? JSON.parse(data) : [];
}

export function saveUsageLog(log) {
  localStorage.setItem('usageLog', JSON.stringify(log));
}

// ============================================
// ERROR LOG
// ============================================

export function loadErrorLog() {
  const data = localStorage.getItem('errorLog');
  return data ? JSON.parse(data) : [];
}

export function saveErrorLog(log) {
  localStorage.setItem('errorLog', JSON.stringify(log));
}
```

**Also add imports at the top of each component file:**

```javascript
import { 
  loadRecipes, 
  saveRecipes, 
  loadBaseSpecification,
  // ... etc
} from '../utils/storage.js';
```

---

### Issue #3: Server/Client Architecture Confusion

**Severity:** Critical  
**Category:** Architecture

**Problem:**
The API handlers (server-side code running on Vercel) call functions like `checkUsageLimits()` and `incrementMessageCount()` as if they're available server-side. However, usage data is stored in localStorage (client-side only).

**Where It Appears:**
- `/api/chat-with-vanessa.js`:
  ```javascript
  const usage = checkUsageLimits(context.baseSpecification?.visitorId);
  // ...later...
  incrementMessageCount(context.baseSpecification?.visitorId);
  ```
- `/api/generate-meal-plan.js`:
  ```javascript
  const usage = checkUsageLimits(baseSpecification.visitorId);
  // ...later...
  incrementGenerationCount(baseSpecification.visitorId);
  ```

**Impact:**
Server-side code cannot access `localStorage`. These calls will fail with `ReferenceError` or `localStorage is not defined`.

**Suggested Fix - Option A (Recommended for MVP):**

Move usage checking/incrementing to the client side. The server just does the API work.

**Client-side (before calling API):**
```javascript
// In chatState or wherever the API is called from

async function sendMessage(message) {
  // Check limits BEFORE calling API
  const usage = loadUsageLimits();
  if (usage.currentPeriod.messages >= usage.limits.messagesPerMonth) {
    showUpgradePrompt();
    return;
  }
  
  // Call API
  const response = await fetch('/api/chat-with-vanessa', { ... });
  
  // Only increment on success
  if (response.ok) {
    incrementMessageCount();
  }
}
```

**Server-side (simplified):**
```javascript
// api/chat-with-vanessa.js

export default async function handler(req, res) {
  // Server just handles the API call - no usage tracking
  // Trust that client did the check (enforce with auth in Phase 2)
  
  const { message, conversationType, context } = req.body;
  
  // ... rest of API logic ...
}
```

**Suggested Fix - Option B (Better for Production):**

Pass usage data to the server in the request, let server validate, but client still stores.

```javascript
// Client sends:
{
  message: "...",
  usage: {
    currentMessages: 47,
    limit: 100
  }
}

// Server validates and returns new count:
{
  response: "...",
  newMessageCount: 48
}

// Client updates localStorage with new count
```

---

### Issue #4: Missing Window Handler Functions

**Severity:** Critical  
**Category:** UI Handlers

**Problem:**
The HTML templates reference window functions that are never defined:
- `window.toggleChat()`
- `window.sendChatMessage()`
- `window.handleChatKeydown()`
- `window.minimizeChat()`
- `window.closeChat()`
- `window.searchRecipes()`
- `window.filterRecipes()`
- `window.viewRecipe()`

**Where It Appears:**
- `ChatWidget.js` template: `onclick="window.minimizeChat()"`, `onclick="window.closeChat()"`, `onkeydown="window.handleChatKeydown(event)"`
- `HomePage.js`: `onclick="window.toggleChat()"`
- `RecipeLibrary.js`: `oninput="window.searchRecipes(this.value)"`, `onchange="window.filterRecipes(this.value)"`, `onclick="window.viewRecipe('${recipe.recipeId}')"`

**Impact:**
Clicking any button throws `TypeError: window.toggleChat is not a function`.

**Suggested Fix:**

Add to `src/utils/windowHandlers.js` or at the bottom of each component file:

```javascript
// src/utils/windowHandlers.js

import appState from './appState.js';
import { chatState } from './chatState.js';
import { navigateTo } from './router.js';

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
  
  // Clear input
  input.value = '';
  
  // Add user message to conversation
  chatState.addMessage('user', message);
  
  // Disable send temporarily
  chatState.disableSendTemporarily();
  
  // Send to API and stream response
  await chatState.streamResponse(message);
};

// ============================================
// RECIPE LIBRARY HANDLERS
// ============================================

window.searchRecipes = function(query) {
  appState.recipeSearchQuery = query;
  appState.notifyListeners();
};

window.filterRecipes = function(filter) {
  appState.recipeFilter = filter;
  appState.notifyListeners();
};

window.viewRecipe = function(recipeId) {
  navigateTo(`/recipe/${recipeId}`);
};
```

---

## Major Issues (Features Won't Work)

### Issue #5: Missing Page Components

**Severity:** Major  
**Category:** UI Components

**Problem:**
The route definitions reference components that aren't implemented in the spec:
- `RecipeDetailPage`
- `DayViewPage`
- `ShoppingListPage`
- `ProfilePage`

**Where It Appears:**
```javascript
const routes = {
  '/recipe/:id': RecipeDetailPage,  // Not implemented
  '/shopping': ShoppingListPage,     // Not implemented
  '/day/:date': DayViewPage,         // Not implemented
  '/profile': ProfilePage            // Not implemented
};
```

**Impact:**
Navigating to these routes will throw `ReferenceError: RecipeDetailPage is not defined`.

**Suggested Fix:**

Create stub implementations for each. Here's `RecipeDetailPage` as an example:

```javascript
// src/components/RecipeDetailPage.js

import { loadRecipes, saveRecipes } from '../utils/storage.js';
import { navigateTo } from '../utils/router.js';

export function RecipeDetailPage(recipeId) {
  const recipes = loadRecipes();
  const recipe = recipes.find(r => r.recipeId === recipeId);
  
  if (!recipe) {
    return `
      <div class="page-container">
        <div class="page-header">
          <button onclick="navigateTo('/recipes')" class="back-button">←</button>
          <h1>Recipe Not Found</h1>
        </div>
        <p>This recipe doesn't exist or has been deleted.</p>
      </div>
    `;
  }
  
  return `
    <div class="page-container">
      <div class="page-header">
        <button onclick="navigateTo('/recipes')" class="back-button">←</button>
        <h1>${recipe.name}</h1>
        <button 
          onclick="window.toggleFavorite('${recipe.recipeId}')"
          class="favorite-button"
        >
          ${recipe.isFavorite ? '★' : '☆'}
        </button>
      </div>
      
      <div class="recipe-meta">
        <span>${recipe.category}</span>
        <span>${recipe.cuisine || ''}</span>
        <span>${recipe.totalTime} min</span>
        <span>Serves ${recipe.servings}</span>
      </div>
      
      <section class="recipe-section">
        <h2>Ingredients</h2>
        <ul class="ingredients-list">
          ${recipe.ingredients.map(ing => `
            <li>${ing.quantity} ${ing.item}</li>
          `).join('')}
        </ul>
      </section>
      
      <section class="recipe-section">
        <h2>Instructions</h2>
        <ol class="steps-list">
          ${recipe.steps.map(step => `
            <li>${step}</li>
          `).join('')}
        </ol>
      </section>
      
      ${recipe.notes ? `
        <section class="recipe-section">
          <h2>Notes</h2>
          <p>${recipe.notes}</p>
        </section>
      ` : ''}
      
      <div class="recipe-stats">
        <p>Cooked ${recipe.timesCooked} times</p>
        ${recipe.lastCooked ? `<p>Last cooked: ${recipe.lastCooked}</p>` : ''}
      </div>
      
      <div class="recipe-rating">
        <h3>Your Rating</h3>
        <div class="star-rating">
          ${[1,2,3,4,5].map(star => `
            <button 
              onclick="window.rateRecipe('${recipe.recipeId}', ${star})"
              class="star-button ${recipe.rating >= star ? 'filled' : ''}"
            >
              ${recipe.rating >= star ? '★' : '☆'}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Window handlers for this page
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
```

Similar stub implementations needed for:
- `DayViewPage(date)` - Shows meals for a specific date
- `ShoppingListPage()` - Shows shopping list with checkboxes
- `ProfilePage()` - Shows/edits base specification

---

### Issue #6: Missing `renderMealPlanHomePage()`

**Severity:** Major  
**Category:** UI Components

**Problem:**
`HomePage.js` calls `renderMealPlanHomePage(mealPlan, baseSpec)` for returning users with an existing meal plan, but this function is never defined.

**Where It Appears:**
```javascript
// In HomePage.js
if (mealPlan) {
  return renderMealPlanHomePage(mealPlan, baseSpec);  // Not defined!
}
```

**Impact:**
Returning users with a meal plan see `ReferenceError: renderMealPlanHomePage is not defined`.

**Suggested Fix:**

```javascript
// Add to src/components/HomePage.js or create src/components/MealPlanView.js

function renderMealPlanHomePage(mealPlan, baseSpec) {
  const meals = loadMeals();
  const recipes = loadRecipes();
  const eaters = loadEaters();
  
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
  
  return `
    <div class="page-container">
      <div class="meal-plan-header">
        <h1>This Week's Meals</h1>
        <p class="week-range">${formatDate(mealPlan.weekOf)} - ${formatDate(mealPlan.weekEnd)}</p>
        <div class="budget-indicator">
          Budget: $${mealPlan.budget.estimated} / $${mealPlan.budget.target}
          <span class="budget-status ${mealPlan.budget.status}">${mealPlan.budget.status}</span>
        </div>
      </div>
      
      <div class="week-view">
        ${sortedDates.map(date => {
          const dayMeals = mealsByDate[date];
          const dayName = formatDayName(date);
          
          return `
            <div class="day-card" onclick="navigateTo('/day/${date}')">
              <h3>${dayName}</h3>
              <div class="day-meals">
                ${dayMeals.map(meal => {
                  const recipe = recipes.find(r => r.recipeId === meal.recipeId);
                  return `
                    <div class="meal-preview ${meal.slot}">
                      <span class="slot-label">${meal.slot}</span>
                      <span class="meal-name">${recipe?.name || 'Unknown'}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="quick-actions">
        <button onclick="navigateTo('/shopping')" class="action-button">
          🛒 Shopping List
        </button>
        <button onclick="window.toggleChat()" class="action-button">
          💬 Chat with Vanessa
        </button>
      </div>
    </div>
  `;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

function formatDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { weekday: 'long' });
}
```

---

### Issue #7: Chat History Format Incompatible with Anthropic

**Severity:** Major  
**Category:** API Integration

**Problem:**
The app uses `role: 'system'` for internal messages like "Meal plan generated." However, the Anthropic Messages API only accepts `'user'` and `'assistant'` roles in the messages array. Sending a `'system'` role will cause an API error.

**Where It Appears:**
```javascript
// In various places
conversation.messages.push({
  role: 'system',  // Invalid for Anthropic API!
  content: 'Meal plan generated.',
  timestamp: new Date().toISOString()
});
```

**Impact:**
When chat history is sent to the API, Anthropic returns:
```
Error: messages.*.role must be 'user' or 'assistant'
```

**Suggested Fix:**

**Option A: Filter out system messages before sending to API:**

```javascript
// In buildVanessaSystemPrompt or before API call
const messages = context.chatHistory
  .filter(msg => msg.role === 'user' || msg.role === 'assistant')
  .slice(-20);
```

**Option B: Use a different field for internal messages:**

```javascript
// Store internal messages differently
conversation.messages.push({
  role: 'assistant',  // Use assistant role
  content: 'Meal plan generated.',
  timestamp: new Date().toISOString(),
  isSystemNote: true  // Flag for UI styling
});
```

**Option C: Store internal events separately:**

```javascript
// Separate storage
conversation.messages = [...];  // Only user/assistant
conversation.events = [         // System events
  { type: 'generation_complete', timestamp: '...' }
];
```

---

### Issue #8: No JSON Parse Error Handling

**Severity:** Major  
**Category:** Error Handling

**Problem:**
The generation endpoint does raw `JSON.parse()` without separating parse errors from other failures. This makes debugging difficult and can give confusing error messages to users.

**Where It Appears:**
```javascript
// In api/generate-meal-plan.js
const data = await response.json();
const content = data.content[0].text;

// This can throw with unhelpful error message
generatedPlan = JSON.parse(content);
```

**Impact:**
If Claude returns malformed JSON (which happens occasionally), the user sees a generic "Something went wrong" instead of a more helpful message, and the retry might not be triggered appropriately.

**Suggested Fix:**

```javascript
// Improved parsing with specific error handling
let generatedPlan;
try {
  generatedPlan = JSON.parse(content);
} catch (parseError) {
  console.error('JSON parse error:', parseError.message);
  console.error('Raw content:', content.substring(0, 500));
  
  // Try to extract JSON if there's extra text (Claude sometimes adds explanation)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      generatedPlan = JSON.parse(jsonMatch[0]);
      console.log('Recovered JSON from partial match');
    } catch (secondParseError) {
      // Log for debugging, throw specific error
      logError('json_parse', secondParseError, { 
        contentPreview: content.substring(0, 200) 
      });
      throw new Error('PARSE_ERROR: AI response was not valid JSON');
    }
  } else {
    logError('json_parse', parseError, { 
      contentPreview: content.substring(0, 200) 
    });
    throw new Error('PARSE_ERROR: AI response was not valid JSON');
  }
}

// Validate required fields
if (!generatedPlan.meals || !Array.isArray(generatedPlan.meals)) {
  throw new Error('INVALID_RESPONSE: Missing meals array');
}
```

---

## Medium Issues (UX Problems)

### Issue #9: No Loading States in ChatWidget

**Severity:** Medium  
**Category:** UX

**Problem:**
When waiting for Vanessa's response, the ChatWidget shows no loading indicator. Users don't know if their message was sent or if the system is working.

**Where It Appears:**
The `ChatWidget.js` template has no loading state between sending a message and receiving the first token.

**Impact:**
Users may think the app is broken and click multiple times, or navigate away.

**Suggested Fix:**

```javascript
// Add to chatState
const chatState = {
  // ... existing properties
  isStreaming: false,
  
  // When starting to send
  startStreaming() {
    this.isStreaming = true;
    appState.notifyListeners();
  },
  
  stopStreaming() {
    this.isStreaming = false;
    appState.notifyListeners();
  }
};

// In ChatWidget template, add after messages:
${chatState.isStreaming ? `
  <div class="message assistant typing">
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
` : ''}

// CSS for typing indicator
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: typing 1s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

---

### Issue #10: No Search Debouncing

**Severity:** Medium  
**Category:** Performance

**Problem:**
Recipe search fires `appState.notifyListeners()` on every keystroke, causing excessive re-renders. With a large recipe library, this causes lag.

**Where It Appears:**
```javascript
// In RecipeLibrary.js
oninput="window.searchRecipes(this.value)"

// Handler triggers immediate re-render
window.searchRecipes = function(query) {
  appState.recipeSearchQuery = query;
  appState.notifyListeners();  // Fires on every keystroke!
};
```

**Impact:**
Typing "salmon" triggers 6 re-renders and recipe filter operations.

**Suggested Fix:**

```javascript
// Add debounce utility
function debounce(func, wait) {
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

// Debounced search handler
window.searchRecipes = debounce(function(query) {
  appState.recipeSearchQuery = query;
  appState.notifyListeners();
}, 300);  // Wait 300ms after last keystroke
```

---

### Issue #11: Progress Interval Not Cleaned Up

**Severity:** Medium  
**Category:** Memory Leak

**Problem:**
If the user navigates away from the generation page mid-generation (e.g., by clicking back), the progress interval keeps running, potentially causing errors or memory leaks.

**Where It Appears:**
```javascript
// In startProgressSimulation
const progressInterval = setInterval(() => {
  // Updates state every 500ms
  // Never cleaned up if user navigates away!
}, 500);
```

**Impact:**
- Interval continues running after leaving page
- State updates cause errors if component unmounted
- Memory leak over time

**Suggested Fix:**

```javascript
// Store interval ID in state
const generationState = {
  // ... existing properties
  progressIntervalId: null
};

// In startGeneration, clean up on route change
function startGeneration() {
  // Clean up any existing interval
  if (generationState.progressIntervalId) {
    clearInterval(generationState.progressIntervalId);
  }
  
  // ... rest of function
  
  generationState.progressIntervalId = startProgressSimulation(startTime);
}

// Also clean up on route change
function handleRouteChange() {
  // Clean up generation interval if navigating away from /generating
  const newPath = window.location.hash.slice(1) || '/';
  if (newPath !== '/generating' && generationState.progressIntervalId) {
    clearInterval(generationState.progressIntervalId);
    generationState.progressIntervalId = null;
    generationState.status = 'idle';
  }
  
  // ... rest of function
}
```

---

### Issue #12: Missing CSS

**Severity:** Medium  
**Category:** Styling

**Problem:**
Only `GenerationStatusPage` has any CSS defined. All other components reference CSS classes that don't exist:
- `.chat-widget`, `.chat-header`, `.chat-messages`, `.message`, `.send-button`
- `.page-container`, `.page-header`, `.recipe-card`, `.recipe-grid`
- `.add-recipe-options`, `.add-recipe-option`, `.recipe-paste-field`
- etc.

**Where It Appears:**
Every component template uses class names for styling.

**Impact:**
App will be unstyled and potentially unusable (elements might overlap, be invisible, etc.).

**Suggested Fix:**

Create `src/styles/main.css` with comprehensive styles. Here's a starter:

```css
/* src/styles/main.css */

/* ============================================
   VARIABLES
   ============================================ */
:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --text-color: #1f2937;
  --text-muted: #6b7280;
  --bg-color: #ffffff;
  --bg-secondary: #f3f4f6;
  --border-color: #e5e7eb;
  --error-color: #ef4444;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
}

/* ============================================
   BASE
   ============================================ */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
  line-height: 1.5;
}

/* ============================================
   LAYOUT
   ============================================ */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.app-nav a {
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.app-nav a.active,
.app-nav a:hover {
  color: var(--primary-color);
  background: var(--bg-secondary);
}

.app-content {
  flex: 1;
  padding: 1rem;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
}

/* ============================================
   BUTTONS
   ============================================ */
.primary-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
}

.primary-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

/* ============================================
   CHAT WIDGET
   ============================================ */
.chat-widget {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 500px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 1rem 1rem 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
}

.chat-widget.mobile {
  width: 100%;
  height: 100%;
  border-radius: 0;
  position: fixed;
  top: 0;
  left: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin-bottom: 1rem;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
  background: var(--primary-color);
  color: white;
  padding: 0.75rem;
  border-radius: 1rem 1rem 0 1rem;
}

.message.assistant {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 1rem 1rem 1rem 0;
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 0.5rem;
}

.chat-input-area textarea {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  resize: none;
  min-height: 40px;
}

.send-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.generate-button-container {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.generate-button {
  width: 100%;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

/* ============================================
   ADD RECIPE PAGE
   ============================================ */
.add-recipe-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.add-recipe-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  text-align: left;
}

.add-recipe-option:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--bg-secondary);
}

.option-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.option-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.option-desc {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.recipe-paste-field {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
}

.url-input-field {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
}

.recipe-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recipe-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-weight: 500;
}

.recipe-form input,
.recipe-form select,
.recipe-form textarea {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 1rem;
}

.recipe-form textarea {
  min-height: 100px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.success-banner {
  background: #dcfce7;
  color: #166534;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.error-message {
  background: #fef2f2;
  color: var(--error-color);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

/* ============================================
   RECIPE LIBRARY
   ============================================ */
.recipe-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.recipe-controls input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.recipe-controls select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.recipe-card {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
}

.recipe-card:hover {
  border-color: var(--primary-color);
  background: var(--bg-secondary);
}

/* ============================================
   GENERATION STATUS
   ============================================ */
.generation-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.generation-container {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.generation-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.progress-bar-container {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.retry-notice {
  background: #fef3c7;
  color: #92400e;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.generation-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.generation-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

.generation-btn.primary {
  background: var(--primary-color);
  color: white;
  border: none;
}

.generation-btn.secondary {
  background: white;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

/* ============================================
   UTILITIES
   ============================================ */
.offline-banner {
  background: var(--warning-color);
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
}

.offline-badge {
  background: var(--warning-color);
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
}

.offline-note {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 1rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.page-hint {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.usage-indicator {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}
```

---

## Minor Issues (Polish/Documentation Gaps)

### Issue #13: Missing Helper Functions

**Severity:** Minor  
**Category:** Utilities

**Problem:**
Several small utility functions are referenced but not defined:
- `isMobile()` - Check if running on mobile device
- `formatTime()` - Format timestamp for display

**Where It Appears:**
```javascript
// In ChatWidget.js
class="chat-widget ${isMobile() ? 'mobile' : 'desktop'}"

// In renderMessage()
<div class="message-time">${formatTime(msg.timestamp)}</div>
```

**Suggested Fix:**

```javascript
// src/utils/helpers.js

export function isMobile() {
  return window.innerWidth < 768;
}

export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { 
    weekday: 'long' 
  });
}
```

---

### Issue #14: Week Calculation Edge Case

**Severity:** Minor  
**Category:** Logic

**Problem:**
The spec says "Shopping day dinner to next shopping day lunch" which spans 8 calendar days (e.g., Saturday dinner → next Saturday lunch), not 7.

**Where It Appears:**
Various places mention "7 days" but the actual span is 8 calendar days (7 nights).

**Impact:**
Minor confusion in documentation. The actual implementation (using date math) should be correct.

**Suggested Fix:**

Clarify in documentation:
```
Week runs from shopping day dinner to next shopping day lunch.
- Example: Saturday dinner (Day 1) → Saturday lunch (Day 8)
- This spans 8 calendar days but 7 "meal cycles"
- The plan includes 7 breakfasts, 7 lunches, 7 dinners = 21 meals
```

---

### Issue #15: No Environment Variable Documentation

**Severity:** Minor  
**Category:** Documentation

**Problem:**
The specification doesn't document how to set up the `ANTHROPIC_API_KEY` environment variable for Vercel deployment.

**Impact:**
Developer deploying to Vercel might not know how to configure the API key.

**Suggested Fix:**

Add to specification or create separate deployment doc:

```markdown
## Environment Variables

### Required for Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production, Preview, Development |

### Local Development

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Never commit this file to git!** Add `.env.local` to `.gitignore`.

### Getting an API Key

1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key
5. Copy and store securely
```

---

## Implementation Order Recommendation

For the smoothest implementation experience, address these issues in the following order:

### Phase 1: Foundation (Before Any Features)
1. **Issue #1** - Create `appState.js`
2. **Issue #2** - Create `storage.js` with all load/save functions
3. **Issue #13** - Create `helpers.js` with utility functions
4. **Issue #12** - Create `main.css` with base styles

### Phase 2: Core Infrastructure
5. **Issue #4** - Create `windowHandlers.js` with all window functions
6. **Issue #3** - Refactor usage tracking to client-side

### Phase 3: Components
7. **Issue #5** - Implement missing page components
8. **Issue #6** - Implement `renderMealPlanHomePage()`
9. **Issue #9** - Add loading states to ChatWidget

### Phase 4: API & Error Handling
10. **Issue #7** - Filter system messages before API calls
11. **Issue #8** - Improve JSON parse error handling

### Phase 5: Polish
12. **Issue #10** - Add search debouncing
13. **Issue #11** - Clean up progress interval on navigation
14. **Issue #14** - Update week calculation documentation
15. **Issue #15** - Add environment variable documentation

---

## Conclusion

These 15 issues represent the gaps between the specification document and a working implementation. Addressing them systematically before or during Cursor implementation will result in a much smoother development experience.

The most critical items (Issues 1-4) should be resolved first as they prevent the app from functioning at all. The major issues (5-8) should come next to ensure core features work. Medium and minor issues can be addressed as polish once the app is functional.

**Total estimated time to address all issues:** 10-11 hours

This time can be reduced by having Cursor generate the boilerplate code (especially CSS and stub components) from these specifications.
