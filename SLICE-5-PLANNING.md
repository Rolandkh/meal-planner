# Slice 5 Planning - What's Left to Build

**Date:** January 8, 2026  
**Current Version:** v1.0-rc2  
**Status:** Slice 4 Complete - Ready for Slice 5 Planning

---

## 📊 Overall Project Status

### **Completed Slices:**
- ✅ **Slice 1:** Chat with Vanessa (MVP foundation)
- ✅ **Slice 2:** Meal Plan Generation (full week, shopping list)
- ✅ **Slice 3:** Eaters, Profile & Recipe Library (onboarding, settings, browsing)
- ✅ **Slice 4:** Quick Wins (recipe edit, single-day regen, history, import)

### **Completion Metrics:**
- **Core Features:** ~85% complete
- **Polish & UX:** ~70% complete
- **Infrastructure:** ~60% complete (localStorage only, no backend)
- **Total Lines of Code:** ~18,000 lines
- **Total Features:** 25+ working features

---

## 🎯 What's Left in the PRD

### **1. Recipe Management Pro** (Slice 5 Candidate)

**Status:** Partially implemented  
**Completed:**
- ✅ Recipe import from text (AI extraction)
- ✅ Recipe editing (full edit form)
- ✅ Recipe viewing (detail pages)
- ✅ Recipe library (browsing, search, filter)
- ✅ Recipe favorites & ratings

**Missing:**
- ❌ Manual recipe creation (from scratch with form)
- ❌ Recipe import from URL (fetch webpage + AI extract)
- ❌ Recipe duplication/cloning
- ❌ Recipe categories & advanced tagging
- ❌ Recipe notes & variations
- ❌ Batch recipe operations (delete multiple, export selected)

**Effort Estimate:** 3-4 weeks (6-8 major tasks)

---

### **2. Meal Prep Optimization System** (Fully Spec'd)

**Status:** Fully designed, not implemented  
**Scope:** LARGE - Comprehensive meal prep planning feature

**Components:**
1. **User Preferences (Settings)**
   - Meal prep strategy selection (Fresh Only, Batch Cooking, Hybrid)
   - Prep day selection (which days available for prep)
   - Max prep time (how long willing to spend)
   - Busy days vs light days
   - Advanced options (batch cooking, make-ahead, freezer)

2. **AI-Powered Generation Enhancement**
   - Update system prompts to include prep strategy
   - Generate prep-aware recipes with storage metadata
   - Component reuse optimization (batch cook chicken for 3 meals)
   - Day-specific time constraints (quick on busy days)

3. **Prep Schedule Generator**
   - Analyze recipes to identify batch-cookable components
   - Create prep day task list
   - Calculate time savings
   - Storage instructions for each component

4. **UI Components**
   - Prep Schedule tab in Meal Plan View
   - Prep indicators in Day View
   - Prep badges on recipes
   - Weekly summary with time stats

**Full Specification:** PRD lines 1740-2326 (~600 lines of detailed specs)

**Effort Estimate:** 6-8 weeks (15-20 tasks)

---

### **3. Firebase Migration & Multi-Device Sync** (Infrastructure)

**Status:** Designed, critical for scaling  
**Current:** localStorage (~5MB limit, single device)  
**Target:** Firebase Firestore (unlimited, multi-device sync)

**Components:**
1. **Authentication**
   - Anonymous auth (default, no signup required)
   - Google Sign-In (optional for sync)
   - User profile management

2. **Data Migration**
   - Export all localStorage data
   - Import to Firestore collections
   - Maintain data structure compatibility
   - Migration tool for users

3. **Sync System**
   - Real-time sync across devices
   - Conflict resolution (last-write-wins)
   - Offline-first with sync on reconnect
   - Optimistic updates

4. **Usage Metering**
   - Track meal plan generations
   - Free tier: 4 generations/month
   - Paid tier: Unlimited
   - Upgrade prompts

**Effort Estimate:** 4-6 weeks (12-15 tasks)

---

### **4. Advanced Features** (Polish & Extensions)

**Status:** Various levels of design

**Nutrition Information:**
- ❌ Integrate nutrition API (Spoonacular, Edamam)
- ❌ Display nutrition facts per recipe
- ❌ Weekly nutrition summary
- ❌ Dietary goal tracking

**Export & Sharing:**
- ❌ Export meal plan to PDF
- ❌ Export shopping list to AnyList, Todoist, etc.
- ❌ Calendar sync (Google Calendar, iCal)
- ❌ Share meal plan with others

**Pantry System:**
- ❌ Track what's already in pantry
- ❌ Exclude pantry items from shopping list
- ❌ Expiration date tracking
- ❌ Use up pantry items in meal planning

**Meal Templates & Favorites:**
- ❌ Save meal plan as template
- ❌ Favorite meal plans
- ❌ Regenerate from template
- ❌ Share templates with community

**Effort Estimate:** 8-12 weeks total (varies by feature)

---

## 🧩 Slice 5 Options & Recommendations

### **Option A: Recipe Management Pro (Recommended)**

**Why This First:**
- Builds on Slice 4 momentum (recipe editing/importing)
- High user value (complete recipe management)
- Relatively quick (3-4 weeks)
- No infrastructure changes needed
- Clean scope with clear deliverables

**What It Includes:**
1. Manual recipe creation (form-based, from scratch)
2. Recipe import from URL (fetch + AI extract)
3. Recipe duplication/cloning
4. Advanced recipe organization (categories, bulk operations)
5. Recipe variations & notes

**Success Criteria:**
- Users can add recipes from any source (manual, text, URL)
- Users can organize and manage large recipe collections
- All recipe operations feel fast and intuitive

**Estimated Timeline:** 3-4 weeks

---

### **Option B: Meal Prep Optimization (Ambitious)**

**Why Consider This:**
- Fully spec'd in PRD (600+ lines of detailed design)
- Significant differentiator from competitors
- Addresses real user pain point (time management)
- Showcases AI capabilities

**Why Not Now:**
- Very large scope (6-8 weeks)
- Requires extensive AI prompt engineering
- Complex UI with multiple new pages
- High risk of scope creep
- Better suited for Slice 6-7 after Recipe Management

**Recommendation:** Defer to Slice 6-7

---

### **Option C: Firebase Migration (Foundation)**

**Why Consider This:**
- Enables multi-device sync
- Removes localStorage constraints
- Required for scaling
- Enables usage metering (monetization)

**Why Not Now:**
- Significant infrastructure change (4-6 weeks)
- High risk if migration fails
- Current localStorage solution working fine
- No immediate user demand for sync
- Better after more features are complete

**Recommendation:** Defer to Slice 8-9 (after feature-complete)

---

### **Option D: Polish & Quick Wins (Conservative)**

**What It Includes:**
- Nutrition info integration (external API)
- PDF export for meal plans
- Shopping list export (AnyList, Todoist)
- Performance optimizations
- Mobile polish
- Accessibility improvements

**Why Consider This:**
- Lower risk
- Quick wins
- Improves existing features
- Good for stabilization phase

**Why Not Now:**
- Less exciting than new features
- PRD calls for completing major features first
- Polish is continuous, not a full slice

**Recommendation:** Defer to final polish phase (Slice 10+)

---

## ✅ Slice 5 Recommendation: Recipe Management Pro

### **Rationale:**

1. **Natural Progression:**
   - Slice 4 built import (text) and editing
   - Slice 5 completes recipe management (manual, URL, organization)
   - Users expect complete recipe CRUD after Slice 4

2. **High User Value:**
   - Users want to add family recipes manually
   - Users want to import from favorite food blogs (URL)
   - Users want to organize large recipe collections
   - Users want to clone and modify recipes

3. **Manageable Scope:**
   - 6-8 major tasks (vs 15-20 for Meal Prep)
   - 3-4 weeks (vs 6-8 weeks)
   - No infrastructure changes
   - Clear success criteria

4. **Low Risk:**
   - Similar patterns to Slice 4 (import, edit)
   - No new external dependencies
   - localStorage still sufficient
   - Can ship incrementally

5. **Sets Up Future:**
   - Complete recipe system enables meal prep features
   - Strong foundation for Slice 6 (Meal Prep)
   - Users have rich recipe collections for prep optimization

---

## 📋 Slice 5 Feature Breakdown

### **Feature 1: Manual Recipe Creation** (Priority: HIGH)

**User Story:** "I want to add my grandma's recipe from a hand-written card"

**Components:**
- RecipeCreatePage.js (new component)
- Form with all recipe fields
- Ingredient array builder (add/remove rows)
- Instructions editor (textarea with formatting)
- Tags input (comma-separated or tag chips)
- Save to library

**Complexity:** Medium (similar to RecipeEditPage, but from scratch)

**Estimated Time:** 4-6 hours

---

### **Feature 2: Recipe Import from URL** (Priority: HIGH)

**User Story:** "I want to import a recipe from my favorite food blog"

**Components:**
- Add URL option to RecipeImportModal
- New API endpoint: /api/extract-recipe-from-url
- Fetch webpage HTML
- Parse HTML for recipe microdata (Schema.org)
- Fallback: AI extraction from full HTML
- Preview/edit before save (reuse existing preview)

**Technical Challenges:**
- CORS issues (need proxy)
- Various HTML structures
- Ad-heavy sites (noise)
- Paywalled content

**Complexity:** High (external dependencies, parsing challenges)

**Estimated Time:** 8-12 hours

---

### **Feature 3: Recipe Duplication/Cloning** (Priority: MEDIUM)

**User Story:** "I want to make a spicy version of this recipe"

**Components:**
- "Duplicate" button on RecipeDetailPage
- Clone recipe with " (Copy)" suffix
- Open RecipeEditPage with cloned data
- Save as new recipe (new ID)

**Complexity:** Low (mostly existing components)

**Estimated Time:** 2-3 hours

---

### **Feature 4: Recipe Categories** (Priority: MEDIUM)

**User Story:** "I want to organize recipes into Breakfast, Dinner, Desserts"

**Components:**
- Add "category" field to Recipe schema
- Category dropdown in Create/Edit forms
- Category filter in Recipe Library
- Category badges on recipe cards

**Categories:**
- Breakfast, Lunch, Dinner, Snacks, Desserts, Drinks
- User-defined custom categories (optional)

**Complexity:** Low (similar to existing filters)

**Estimated Time:** 3-4 hours

---

### **Feature 5: Recipe Notes & Variations** (Priority: LOW)

**User Story:** "I want to add notes about substitutions that worked"

**Components:**
- Add "notes" field to Recipe schema
- Notes textarea in RecipeEditPage
- Display notes in RecipeDetailPage (collapsible)
- Allow editing notes without full edit

**Complexity:** Low (simple text field)

**Estimated Time:** 2-3 hours

---

### **Feature 6: Batch Recipe Operations** (Priority: LOW)

**User Story:** "I want to delete multiple old recipes at once"

**Components:**
- Checkbox selection mode in Recipe Library
- "Select All" / "Select None" buttons
- Batch actions: Delete, Export, Add to Collection
- Confirmation dialog for destructive operations

**Complexity:** Medium (new selection UI pattern)

**Estimated Time:** 4-6 hours

---

## 📊 Slice 5 Summary

### **Total Features:** 6
### **Total Estimated Time:** 25-35 hours (~3-4 weeks)

### **Priority Breakdown:**
- **HIGH:** Manual Creation, URL Import (core functionality)
- **MEDIUM:** Duplication, Categories (quality of life)
- **LOW:** Notes, Batch Operations (polish)

### **Risk Assessment:**
- **Low Risk:** Manual Creation, Duplication, Categories, Notes
- **Medium Risk:** URL Import (external dependencies)
- **High Risk:** None

### **Dependencies:**
- All features independent (can ship incrementally)
- URL import may need CORS proxy (Vercel serverless)

---

## 🎯 Slice 5 Success Criteria

1. ✅ Users can add recipes from any source (manual, text, URL)
2. ✅ Users can organize recipes (categories, search, filter)
3. ✅ Users can duplicate and modify recipes easily
4. ✅ Recipe library feels complete and professional
5. ✅ All recipe operations are fast (<2 seconds)
6. ✅ Mobile-responsive recipe forms work well

---

## 🚀 Next Steps

1. **User Approval:** Confirm Slice 5 scope (Recipe Management Pro)
2. **Create PRD:** Write detailed Slice 5 PRD section
3. **Generate Tasks:** Use Taskmaster to create 6 tasks
4. **Expand Tasks:** Break down into subtasks (~20-25 subtasks)
5. **Autonomous Build:** Implement features systematically
6. **User Testing:** Test each feature as it's built
7. **Reality Check:** Document learnings for Slice 6

---

## 💡 Alternative: Slice 5 Mini (2 weeks)

If 3-4 weeks is too long, consider a "mini slice":

**Include:**
- ✅ Manual Recipe Creation
- ✅ Recipe Duplication

**Defer:**
- ❌ URL Import (move to Slice 6)
- ❌ Categories (move to polish)
- ❌ Notes (move to polish)
- ❌ Batch Operations (move to polish)

**Timeline:** 6-9 hours (~1-2 weeks)

**Rationale:** Quick win, completes basic CRUD, sets up for Slice 6

---

## 📚 Resources

### **PRD Sections to Review:**
- Slice 5+ section (lines 1730-1755)
- Recipe Management Pro overview
- Core Entities (Recipe schema)

### **Existing Components to Reuse:**
- RecipeEditPage.js (template for Create)
- RecipeImportModal.js (add URL option)
- RecipeLibraryPage.js (add filters)
- RecipeDetailPage.js (add buttons)

### **Similar Features (Reference):**
- Recipe import from text (Slice 4 Task 55-56)
- Recipe editing (Slice 4 Task 47-48)
- History organization (Slice 4 Task 52-54)

---

**Ready to proceed with Slice 5 planning?**

Let me know if you'd like to:
1. Approve Recipe Management Pro as Slice 5
2. Consider alternative scope (Mini Slice or different features)
3. Create detailed PRD for selected scope
4. Generate Taskmaster tasks and start building
