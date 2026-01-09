# Development Guide

This guide covers setup, testing, deployment, and day-to-day development workflows for Vanessa.

---

## Setup

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Anthropic API Key** - [Get one here](https://console.anthropic.com)
- **Vercel Account** - [Sign up here](https://vercel.com) (for deployment)
- **Git** - For version control

### Initial Setup

```bash
# Clone or navigate to project
cd /path/to/meal-planner

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API key to .env.local
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key-here" >> .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

**For Local Development (`.env.local`):**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...          # Required
SPOONACULAR_API_KEY=...                     # Only for catalog extraction (one-time)
```

**For Production (Vercel Dashboard):**
- Go to Settings → Environment Variables
- Add `ANTHROPIC_API_KEY` for Production, Preview, and Development

---

## Development Workflow

### Daily Development Loop

1. **Check current slice status**
   ```bash
   # Using Taskmaster (if available)
   task-master list
   task-master next
   ```

2. **Make changes**
   - Edit files in `src/components/` or `src/utils/`
   - Changes hot-reload automatically

3. **Test locally**
   - Open browser DevTools (F12)
   - Check console for errors
   - Test the feature manually

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: descriptive message"
   ```

5. **Deploy to preview**
   ```bash
   vercel
   ```

### Dev Preset for Fast Testing

Instead of going through 5+ minutes of onboarding:

1. Open the app
2. Scroll to bottom of home page
3. Click "🔧 Import Dev Preset"
4. Instant household setup with:
   - 3 eaters (You, Maya, Cathie)
   - Mediterranean diet preferences
   - Complete weekly schedule
   - 6 sample recipes
   - $120 budget

**Perfect for:** Rapid iteration, testing meal plans, recipe features

---

## Testing

### Manual Testing Approach

We use **manual testing** during rapid development:
- Agent performs automated UI smoke tests
- Developer performs functional testing
- Reality Check after each slice
- Document learnings for future

### Testing Checklist

#### Core User Flows

**1. New User Onboarding:**
- [ ] Open app for first time
- [ ] Complete 5-question onboarding
- [ ] Verify household members extracted correctly
- [ ] Verify weekly schedule extracted correctly
- [ ] Check Settings page reflects onboarding data

**2. Meal Plan Generation:**
- [ ] Click "Generate New Week"
- [ ] Watch progress bar (0% → 100%)
- [ ] Verify 21 meals generated (7 days × 3 meals)
- [ ] Check servings match household schedule
- [ ] Verify shopping list generated
- [ ] Check budget calculation
- [ ] Download raw JSON output (verify data structure)

**3. Recipe Management:**
- [ ] Browse Recipe Library
- [ ] Search for specific recipe
- [ ] Filter by "Favorites" / "High Rated"
- [ ] Click recipe to view details
- [ ] Rate recipe (1-5 stars)
- [ ] Toggle favorite (❤️)
- [ ] Edit recipe (change name, ingredients)
- [ ] Verify changes saved
- [ ] Import recipe from text
- [ ] Verify AI extraction works

**4. Single Day Regeneration:**
- [ ] Go to Meal Plan View
- [ ] Click 🔄 on a day card
- [ ] Verify confirmation modal shows current meals
- [ ] Regenerate day
- [ ] Verify only that day changed
- [ ] Verify other 18 meals unchanged
- [ ] Check shopping list updated

**5. History & Archiving:**
- [ ] Generate new meal plan (auto-archives old)
- [ ] Go to History page
- [ ] Verify old plan appears
- [ ] Click archived plan
- [ ] Verify read-only view (no edit buttons)
- [ ] Check shopping list accessible

#### Browser Console Checks

Open DevTools (F12) and verify:

```javascript
// Check for errors
// Console should be clean (no red errors)

// Check storage usage
window.debug.showState()

// Check diet profiles loaded
localStorage.getItem('vanessa_diet_profiles')  // Should show v2.0.0

// Check catalog loaded
localStorage.getItem('vanessa_recipe_catalog')  // Should have 622 recipes

// Verify health data
window.debug.testHealthScoring()  // Should return scores 0-100
```

### Testing API Endpoints

#### Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/chat-with-vanessa \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What can you help me with?",
    "chatHistory": [],
    "isOnboarding": false
  }'
```

Expected: Streaming SSE response with chat tokens

#### Test Meal Plan Generation

```bash
curl -X POST http://localhost:3000/api/generate-meal-plan \
  -H "Content-Type: application/json" \
  -d '{
    "eaters": [{"name": "You", "preferences": "Healthy meals"}],
    "baseSpecification": {"weeklyBudget": 120, "maxShoppingListItems": 30}
  }'
```

Expected: SSE stream with progress updates, then complete meal plan data

#### Test Recipe Import

```bash
curl -X POST http://localhost:3000/api/extract-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Spaghetti Carbonara\n500g pasta, 200g bacon, 3 eggs, 100g parmesan.\nCook pasta. Fry bacon. Mix with eggs and cheese."
  }'
```

Expected: JSON with extracted recipe structure and confidence score

### Debug Helpers

Available in browser console:

```javascript
// Refresh diet profiles from file
window.debug.refreshProfiles()

// Clear all storage
window.debug.clearStorage()

// Show current state
window.debug.showState()

// Export all data as JSON
window.debug.exportData()

// Force reload catalog
window.debug.reloadCatalog()

// Test health scoring
window.debug.testHealthScoring('Greek-Style Baked Fish')
```

---

## Recipe Catalog Management

### Current Catalog Stats (Phase 2)

- **622 recipes** (complete data)
- **~15MB images** (620 images)
- **28 cuisines**, 15 protein types
- **40 breakfasts**, 248 vegetarian, 127 vegan
- **73 protein-packed salads**

### Lightweight Index System

**Two-tier architecture:**
1. **Full Catalog** (~1.7MB) - Complete recipe data with ingredients & instructions
2. **Lightweight Index** (~410KB) - Essential fields only for Claude meal generation

**Benefits:**
- 84.6% token reduction (1.7MB → 410KB)
- Faster meal generation
- Lower API costs (~40% reduction)
- Auto-updates when recipes change

### Extract More Recipes

**Standard extraction (broad coverage):**
```bash
# Extract recipes following the full protocol (66 searches)
node scripts/extractSpoonacularCatalog.js

# Rebuilds catalog with existing + new recipes
# Non-destructive - preserves all existing recipes
```

**Custom extraction (targeted preferences):**
```bash
# Extract recipes matching specific criteria
# Edit scripts/extractCustomRecipes.js to customize searches
node scripts/extractCustomRecipes.js

# Example: Mediterranean, Middle Eastern, kid-friendly, etc.
# Automatically avoids duplicates with existing catalog
```

### Rebuild Recipe Index

```bash
# Manually rebuild index from catalog
node scripts/buildRecipeIndex.js

# Transforms full catalog → lightweight index
# Extracts only essential fields for Claude
```

**When to rebuild:**
- After extracting new recipes from Spoonacular
- After manually editing catalog JSON
- Index auto-rebuilds when saving user recipes (no manual rebuild needed)

### Clear Catalog Cache

When catalog is updated on disk, clear browser cache to load new version:

```javascript
// In browser console:
localStorage.removeItem('vanessa_recipe_catalog');
localStorage.removeItem('vanessa_recipe_index');
location.reload();
```

### Verify Catalog Integration

```javascript
// In browser console:

// 1. Check catalog loaded (full data)
const catalog = JSON.parse(localStorage.getItem('vanessa_recipe_catalog'));
console.log('Catalog:', catalog.recipes.length, 'recipes');  // Should be 622

// 2. Check index loaded (lightweight)
const index = JSON.parse(localStorage.getItem('vanessa_recipe_index'));
console.log('Index:', index.recipes.length, 'recipes');  // Should be 622

// 3. Verify size reduction
const catalogSize = JSON.stringify(catalog).length / 1024;
const indexSize = JSON.stringify(index).length / 1024;
const savings = ((1 - indexSize / catalogSize) * 100).toFixed(1);
console.log(`Catalog: ${catalogSize.toFixed(0)}KB, Index: ${indexSize.toFixed(0)}KB, Savings: ${savings}%`);
// Should show ~84.6% savings

// 4. Check protein tagging
const proteins = new Set();
catalog.recipes.forEach(r => r.tags?.proteinSources?.forEach(p => proteins.add(p)));
console.log('Protein types:', proteins.size, '-', Array.from(proteins).join(', '));
// Should show 15 types

// 5. Check cuisine coverage
const cuisines = new Set();
catalog.recipes.forEach(r => r.tags?.cuisines?.forEach(c => cuisines.add(c)));
console.log('Cuisines:', cuisines.size, 'types');  // Should show 28

// 6. Verify catalog usage in generation
// Generate a meal plan and watch console for:
// "📚 Loaded recipe index: 622 recipes (lightweight)"
// "✅ Catalog match (exact): ..." (should see 15-20 matches per plan)
// "📊 Catalog usage: N catalog, M new recipes"
```

### Test Recipe Index Auto-Update

```javascript
// 1. Check current index count
let index = JSON.parse(localStorage.getItem('vanessa_recipe_index'));
console.log('Before:', index.recipes.length);  // e.g., 622

// 2. Generate a meal plan (creates user recipes)
// (Use the UI to generate)

// 3. Check updated index
index = JSON.parse(localStorage.getItem('vanessa_recipe_index'));
console.log('After:', index.recipes.length);  // Should be 622 + N user recipes

// Should see in console:
// "🔄 Rebuilding index: 622 catalog + N user recipes"
// "✅ Recipe index updated: (622 + N) recipes"
```

---

## Common Issues & Solutions

### Issue: "API key not configured"

**Problem:** `ANTHROPIC_API_KEY` missing or incorrect

**Solution:**
```bash
# Check .env.local exists and has key
cat .env.local

# Restart dev server
npm run dev
```

### Issue: "Storage quota exceeded"

**Problem:** localStorage 5MB limit hit

**Solution:**
1. Go to Settings → Storage Management
2. Click "Clear Old Data"
3. Or export data, clear storage, import back

**Prevent:**
- Set History Retention to 2-4 weeks (default: 4)
- Regularly clean up old meal plans

### Issue: "Catalog not loading"

**Problem:** Recipe catalog or index not loading

**Solution:**
```javascript
// In browser console:
localStorage.removeItem('vanessa_recipe_catalog');
localStorage.removeItem('vanessa_recipe_index');
location.reload();
```

**Verify:**
```javascript
// Should see in console:
// ✅ Loaded 622 recipes into localStorage
// ✅ Loaded 622 recipe summaries into localStorage
```

### Issue: "Images not displaying"

**Problem:** Image paths incorrect or missing

**Solution:**
1. Check `/public/images/recipes/` has images
2. Verify image path format: `/images/recipes/{spoonacularId}.jpg`
3. Check browser Network tab for 404s

### Issue: "Generation takes too long"

**Problem:** Claude API slow or timing out

**Check:**
1. Network connection stable?
2. Anthropic API status (status.anthropic.com)
3. Console shows progress updates?

**Timeout settings:** Max 60 seconds in `vercel.json`

---

## Deployment

### Deploy to Vercel

**First-time setup:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env add ANTHROPIC_API_KEY
# Enter your API key when prompted
# Select: Production, Preview, Development

# Deploy
vercel --prod
```

**Subsequent deploys:**

```bash
# Deploy to preview (automatic URL)
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration

**File:** `vercel.json`

```json
{
  "functions": {
    "api/generate-meal-plan.js": {
      "maxDuration": 60,      // Meal generation can take up to 60s
      "memory": 1024           // 1GB memory for AI processing
    },
    "api/chat-with-vanessa.js": {
      "maxDuration": 30,       // Chat responses faster
      "memory": 512            // Less memory needed
    },
    "api/extract-recipe.js": {
      "maxDuration": 30,
      "memory": 512
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

### Environment Variables in Production

**Vercel Dashboard:**
1. Go to project → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY`
3. Select scope: Production, Preview, Development
4. Save

**Verify deployment:**
```bash
# Test API endpoint
curl https://your-app.vercel.app/api/check-env
```

---

## Code Structure

### Component Pattern

**Standard component structure:**

```javascript
// src/components/ExamplePage.js

class ExamplePage {
  constructor() {
    this.state = {
      data: [],
      loading: false,
      error: null
    };
  }

  async init() {
    await this.loadData();
    this.render();
    this.attachListeners();
  }

  async loadData() {
    try {
      this.state.loading = true;
      this.state.data = await fetchData();
    } catch (error) {
      this.state.error = error.message;
    } finally {
      this.state.loading = false;
    }
  }

  render() {
    const container = document.getElementById('app');
    container.innerHTML = this.template();
  }

  template() {
    return `
      <div class="page-container">
        ${this.state.loading ? this.loadingTemplate() : this.dataTemplate()}
      </div>
    `;
  }

  attachListeners() {
    document.getElementById('btn').addEventListener('click', () => {
      this.handleClick();
    });
  }

  handleClick() {
    // Handle event
    this.render(); // Re-render if state changed
  }
}

export default ExamplePage;
```

### Utility Pattern

**Standard utility structure:**

```javascript
// src/utils/exampleUtil.js

/**
 * Does something useful
 * @param {string} input - Input description
 * @returns {Object} Output description
 */
export function utilityFunction(input) {
  // Implementation
  return result;
}

/**
 * Another utility
 */
export function anotherUtility() {
  // Implementation
}
```

### API Pattern

**Standard API function structure:**

```javascript
// api/example-endpoint.js

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { param } = req.body;

    // Validate input
    if (!param) {
      return res.status(400).json({ error: 'Missing required parameter' });
    }

    // Do work
    const result = await doSomething(param);

    // Return success
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Git Workflow

### Branch Strategy

**Main branch:** `main` or `master`
- Always deployable
- Only merge tested code

**Feature branches:** Short-lived, slice-specific
- `slice-5-catalog-system`
- `fix-recipe-edit-bug`

### Commit Messages

**Format:** `<type>: <description>`

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, no logic change)
- `refactor:` Code restructuring (no behavior change)
- `test:` Adding tests
- `chore:` Build process, dependencies

**Examples:**
```bash
git commit -m "feat: add diet profile filtering"
git commit -m "fix: recipe edit not saving changes"
git commit -m "docs: update DEVELOPMENT.md with testing guide"
```

---

## Performance Monitoring

### Key Metrics to Watch

**1. Meal Plan Generation Time:**
- Target: <30 seconds
- Typical: 15-25 seconds
- Max: 60 seconds (timeout)

**2. Catalog Load Time:**
- Target: <500ms
- Typical: 200-300ms
- Data: ~900KB JSON

**3. Storage Usage:**
- Limit: 5MB
- Typical: 1-2MB
- Warning: 4MB (80%)

**4. API Costs:**
- Target: <$10/month
- Typical: $3-7/month
- Per generation: $0.02-0.04

### Monitoring in Production

**Browser Console Logs:**
```javascript
// Check generation time
console.time('meal-plan-generation');
// ... generation happens ...
console.timeEnd('meal-plan-generation');  // Logs duration

// Check storage usage
const usage = JSON.stringify(localStorage).length;
console.log(`Storage: ${(usage / 1024 / 1024).toFixed(2)} MB / 5 MB`);
```

**Vercel Analytics:**
- View in Vercel dashboard
- Function execution time
- Function invocation count
- Error rates

---

## Troubleshooting

### "Development server won't start"

```bash
# Check Node version
node --version  # Should be 18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :3000
# Kill process if needed: kill -9 <PID>
```

### "Changes not appearing"

```bash
# Hard refresh browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Clear browser cache
# Or use incognito window

# Restart dev server
# Ctrl+C to stop, npm run dev to restart
```

### "API calls failing locally"

```bash
# Check .env.local exists
ls -la .env.local

# Verify API key format
cat .env.local
# Should be: ANTHROPIC_API_KEY=sk-ant-api03-...

# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

---

## Additional Resources

### Useful Commands

```bash
# Start dev server
npm run dev

# Deploy to Vercel preview
vercel

# Deploy to production
vercel --prod

# Check environment variables
vercel env ls

# View logs
vercel logs

# Install new dependency
npm install <package-name>

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Useful Links

- **Anthropic API Docs:** https://docs.anthropic.com
- **Vercel Docs:** https://vercel.com/docs
- **Tailwind CSS:** https://tailwindcss.com
- **MDN Web Docs:** https://developer.mozilla.org

---

**Last Updated:** January 9, 2026
