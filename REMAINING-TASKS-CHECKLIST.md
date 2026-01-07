# ✅ Remaining Tasks to Complete Slice 4

**Created:** December 26, 2025  
**For:** When you return from holiday  
**Estimated Time:** 6-8 hours (1-2 days)

---

## 🔴 HIGH PRIORITY - Manual Testing (3-4 hours)

### ☐ 1. Test Recipe Import from Text (30-45 min)
**Guide:** `TESTING-GUIDE.md` - Test 1  
**Route:** http://localhost:3000/#/recipes → + Add Recipe

**Test Cases:**
- [ ] 1a. Import Chicken Tikka Masala recipe (well-formatted)
  - Verify extraction accuracy
  - Check confidence score 80-95%
  - Test preview/edit step
  - Save to library
- [ ] 1b. Import Easy Pasta Carbonara (simple format)
  - Verify works with minimal formatting
  - Check confidence score 70-85%
- [ ] 1c. Invalid text (not a recipe)
  - Verify shows error gracefully
- [ ] 1d. Text too short (< 50 chars)
  - Verify shows character limit error

**Sample Recipes:** See `TESTING-GUIDE.md`

**Pass Criteria:**
- [ ] AI extraction 80%+ accurate
- [ ] Confidence scoring works
- [ ] Preview/edit functional
- [ ] Saves to library successfully
- [ ] Error handling works

---

### ☐ 2. Test Single Day Regeneration (30 min)
**Guide:** `TESTING-GUIDE.md` - Test 2  
**Route:** http://localhost:3000/#/meal-plan

**Test Cases:**
- [ ] 2a. Regenerate Tuesday from Meal Plan View
  - Note current Tuesday meals
  - Click 🔄 button
  - Confirm in modal
  - Verify only Tuesday changed (3 meals)
  - Verify other 18 meals unchanged
  - Check shopping list updated
- [ ] 2b. Regenerate Friday from Day View
  - Navigate to #/day/friday
  - Click "Regenerate Friday" button
  - Verify returns to Friday view
- [ ] 2c. Verify no recipe duplication
  - Check new recipes don't duplicate existing week

**Pass Criteria:**
- [ ] Only target day changes
- [ ] Other 6 days (18 meals) unchanged
- [ ] No recipe duplication
- [ ] Shopping list updates
- [ ] Fast generation (~20-30s)

---

## 🟡 MEDIUM PRIORITY - Functional Testing (1-2 hours)

### ☐ 3. Test Recipe Editing (20-30 min)
**Guide:** `TESTING-GUIDE.md` - Test 3  
**Route:** http://localhost:3000/#/recipes → Click recipe → Edit

**Test Cases:**
- [ ] 3a. Edit and save recipe
  - Edit "Spaghetti Bolognese"
  - Change name, times, ingredient quantity
  - Save
  - Verify changes persist
- [ ] 3b. Verify changes in meal plan
  - Check meal plan shows updated recipe
  - Verify same recipeId (no broken links)
- [ ] 3c. Test auto-save (wait 30 seconds)
  - Make changes, don't save
  - Wait 30 seconds
  - Check auto-save indicator
  - Close tab, reopen
  - Verify draft restore
- [ ] 3d. Test validation
  - Clear recipe name, try to save
  - Verify error message shows

**Pass Criteria:**
- [ ] Changes save successfully
- [ ] Persist after reload
- [ ] Update in meal plan
- [ ] Auto-save works
- [ ] Validation prevents invalid data

---

### ☐ 4. Test Auto-Archive System (15-20 min)
**Guide:** `TESTING-GUIDE.md` - Test 4  
**Route:** http://localhost:3000 → Generate New Week

**Test Cases:**
- [ ] 4a. Generate new plan, check history
  - Note current plan dates
  - Generate new week
  - Go to History (#/history)
  - Verify old plan appears
- [ ] 4b. View archived plan details
  - Click archived plan card
  - Verify shows all meals
  - Verify shows shopping list
  - Check "Archived" badge
  - Verify read-only (no edit buttons)
- [ ] 4c. Test retention cleanup (optional)
  - Change retention to 2 weeks in Settings
  - Generate 3 more plans
  - Verify only 2 kept

**Pass Criteria:**
- [ ] Old plan auto-archives
- [ ] History shows correctly
- [ ] All data intact in archive
- [ ] Read-only mode works

---

## 🟢 LOW PRIORITY - Bug Fixes (30 min - 1 hour)

### ☐ 5. Fix Settings Tab Switching (15-30 min)
**File:** `src/components/SettingsPage.js`  
**Issue:** Clicking "Meal Planning" tab doesn't update content  
**Location:** Around line 170-180

**Current Behavior:**
- Click "Meal Planning" tab
- Content stays on "Storage" section

**Expected Behavior:**
- Click tab → Content switches

**Likely Fix:**
- Tab click handler needs to update `this.state.activeSection`
- May need to call re-render or update method

**Test After Fix:**
- [ ] All 4 tabs switch content correctly
- [ ] Active tab highlighting updates
- [ ] Form data persists when switching

---

### ☐ 6. Fix Recipe Edit Add Ingredient (15-30 min)
**File:** `src/components/RecipeEditPage.js`  
**Issue:** "+ Add Ingredient" doesn't show new row  
**Location:** `addIngredient()` method around line 120

**Current Behavior:**
- Click "+ Add Ingredient"
- No visual update (or page reload needed)

**Expected Behavior:**
- Click → New ingredient row appears immediately

**Likely Fix:**
- `addIngredient()` updates state but doesn't trigger re-render
- Add explicit render call after state update

**Test After Fix:**
- [ ] Clicking "+ Add Ingredient" shows new row
- [ ] New row has empty/default values
- [ ] Can add multiple in sequence
- [ ] Remove button works on new rows

---

## 📝 DOCUMENTATION - Reality Check (1-2 hours)

### ☐ 7. Conduct Slice 4 Reality Check
**File:** `.taskmaster/docs/prd.txt`  
**Template:** See Slice 2 and Slice 3 Reality Check sections in PRD

**Answer These 5 Questions:**

1. **What was awkward in this implementation?**
   - Based on your testing experience
   - Note any friction points or workarounds
   - Document API limitations

2. **What assumptions were wrong?**
   - Pre-implementation expectations vs reality
   - Surprises during testing
   - Design decisions to reconsider

3. **What patterns are emerging?**
   - Code patterns that worked well
   - Reusable solutions
   - Successful architectural decisions

4. **What should be standardized?**
   - Helper functions to extract
   - Conventions to adopt
   - UI patterns to reuse in Slice 5

5. **Is the data shape right for Slice 5?**
   - Review data structures
   - Identify needed changes
   - Consider migration needs

**Deliverables:**
- [ ] Add "REALITY CHECK: Slice 4 Learnings" to PRD (after Slice 4 section)
- [ ] Create `references/SLICE-4-COMPLETION.md` summary
- [ ] Update `references/CURRENT-IMPLEMENTATION.md` final status
- [ ] Update version to v1.0 if shipping

---

## 🟢 OPTIONAL - Polish (2-4 hours)

### ☐ 8. Polish Based on Feedback
**Priority:** LOW - Can defer to Slice 5 or future

**If you have time, consider:**
- [ ] Better error messages for recipe import
- [ ] Loading animations improvements
- [ ] Mobile UX testing and tweaks
- [ ] Performance with large datasets
- [ ] Keyboard shortcuts (Ctrl+S to save)
- [ ] Recipe import example templates
- [ ] Add "Undo" for single day regeneration

**Or:** Skip this and ship v1.0!

---

## 📈 Progress Visualization

```
Tasks Completed:
├─ Slice 1-3: ████████████████████ 100% ✅ (21 tasks done)
├─ Slice 4 Code: ████████████████████ 100% ✅ (10 tasks done)
├─ Automated Tests: ████████████████████ 100% ✅ (6/6 passed)
└─ Manual Tests: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (0/7 done)

To Complete:
├─ Manual Testing: ░░░░░░░░░░░░ 4 tasks (~3h)
├─ Bug Fixes: ░░ 2 tasks (~1h)
└─ Reality Check: ░ 1 task (~1h)

Total Remaining: ~5-6 hours
```

---

## 🎯 Decision Tree

```
After completing Tasks 1-7:

┌─ All tests passed? ────────┐
│                             │
YES                          NO
│                             │
├─ 2 bugs fixed? ────┐        └─> Fix issues, retest
│                     │
YES                  NO
│                     │
├─ Reality Check     └─> Fix bugs first
│   documented?
│
YES
│
└─> DECISION POINT:
    
    Option A: Ship v1.0 Minimum
    ├─ Deploy to Vercel
    ├─ Monitor for issues
    └─ Plan Slice 5 based on usage
    
    Option B: Continue to Slice 5
    ├─ Plan Recipe Management Pro
    ├─ Manual recipe creation
    ├─ URL import
    └─ Advanced features
    
    Option C: Polish Slice 4
    ├─ Implement Task 8 items
    ├─ Mobile optimization
    └─ Then ship v1.0
```

---

## 📞 Quick Commands

```bash
# Start dev server
npm run dev

# View task status (if Taskmaster works)
task-master list

# Deploy when ready
vercel --prod

# Create git commit after testing
git add .
git commit -m "test: Complete Slice 4 manual testing

- Tested recipe import with X recipes
- Tested single day regeneration
- Tested recipe editing and persistence  
- Tested auto-archive system
- Fixed settings tab switching bug
- Fixed recipe edit add ingredient bug
- Documented Slice 4 Reality Check

All Slice 4 features tested and working.
Ready for v1.0 release."
```

---

## 🎉 You're Almost There!

**Project Completion:**
- Overall: 75% → Will be 78% after testing
- Slice 4: 95% → Will be 100% after testing
- To v1.0: Just 1-2 days of work!

**What You've Built:**
- 4 complete feature slices
- 14 components
- 3 API endpoints
- 11 routes
- ~15,000 lines of code
- Comprehensive documentation

**Congratulations on getting this far!**

---

**Start here when you return:** `TESTING-GUIDE.md` → Test 1: Recipe Import

Have a great holiday! 🏖️ See you in a week! 👋




