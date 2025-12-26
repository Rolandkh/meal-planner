# Slice 4 Testing Guide

**Version:** Updated December 26, 2025 (Evening)  
**Your Role:** Manual testing of AI-powered features  
**My Role:** Automated UI testing (completed ✅)  
**Status:** All critical bugs fixed - Ready for full testing ✅

---

## ✅ What I Already Tested (All Passed)

1. ✅ All new routes load correctly
2. ✅ Recipe Edit Page renders with full form
3. ✅ History Page shows empty state
4. ✅ Import Modal opens and shows all 3 steps
5. ✅ Regenerate Day buttons appear on all day cards
6. ✅ Regenerate modal shows with meal list
7. ✅ Navigation links work
8. ✅ No console errors

**Conclusion:** All UI components work. Ready for functional testing.

---

## 🎯 What YOU Need to Test

### Test 1: Recipe Import (15 minutes) 🔴 CRITICAL

**Goal:** Test AI extraction from various recipe formats

**Steps:**
1. Go to Recipe Library (#/recipes)
2. Click "+ Add Recipe" button
3. Click "Next"
4. Paste this recipe:

```
Chicken Tikka Masala

Ingredients:
- 800g chicken breast, cubed
- 400ml coconut cream
- 200g tomato paste
- 2 whole onions, diced
- 4 whole garlic cloves, minced
- 30ml vegetable oil
- 15g garam masala
- 10g turmeric
- 5g cumin

Instructions:
1. Heat oil in large pan over medium-high heat
2. Sauté onions until golden, about 5 minutes
3. Add garlic and spices, cook 1 minute until fragrant
4. Add chicken, cook until browned on all sides
5. Stir in tomato paste and coconut cream
6. Simmer 15-20 minutes until chicken is cooked through
7. Season with salt to taste
8. Serve over rice with naan bread

Prep: 15 minutes
Cook: 25 minutes
Serves: 4
```

5. Click "Import Recipe"
6. Wait for extraction (5-10 seconds)
7. Review preview screen

**What to Check:**
- ✅ Extraction completes without error
- ✅ Recipe name extracted correctly
- ✅ All ingredients extracted with quantities
- ✅ Units converted to metric (g, ml, whole)
- ✅ Instructions extracted
- ✅ Times and servings extracted
- ✅ Confidence score shows (should be 80-95%)
- ✅ Can edit fields in preview
- ✅ "Save to Library" works
- ✅ Navigates to recipe detail page

**Then Test These:**

**Test 1b:** Simpler format
```
Easy Pasta Carbonara

500g spaghetti
200g bacon, diced
3 eggs
100g parmesan, grated
Black pepper to taste

Cook pasta. Fry bacon until crispy. Beat eggs with cheese. Drain pasta, mix with bacon. Remove from heat, stir in egg mixture. Season with pepper. Serve immediately.

Quick dinner, 20 minutes total, serves 4
```

**Test 1c:** Invalid text (should fail gracefully)
```
This is not a recipe. Just some random text about cooking.
```

**Test 1d:** Text too short (should show error)
```
Pasta
```

---

### Test 2: Single Day Regeneration (10 minutes) 🔴 CRITICAL

**Goal:** Verify single-day regeneration works and doesn't affect other days

**Steps:**
1. Go to Meal Plan View (#/meal-plan)
2. Note Tuesday's current meals:
   - Breakfast: Quick Scrambled Eggs
   - Lunch: Greek Salad
   - Dinner: Chicken Stir Fry
3. Click 🔄 button on Tuesday's card
4. Review modal (should show 3 meals above)
5. Click "Regenerate"
6. Wait for generation (~20-30 seconds)
7. Verify completion

**What to Check:**
- ✅ Generation completes successfully
- ✅ Tuesday has 3 NEW meals
- ✅ Monday's meals unchanged
- ✅ Wednesday's meals unchanged
- ✅ All other days unchanged (18 meals total)
- ✅ New recipes don't duplicate existing week
- ✅ Shopping list updates automatically
- ✅ Navigation returns to meal plan view

**Then Test:**
- Regenerate a different day (e.g., Friday)
- Regenerate from DayView page (click Monday button, then click regenerate in header)

---

### Test 3: Recipe Editing (10 minutes) 🟡 MEDIUM

**Goal:** Verify recipe editing works and updates persist

**Steps:**
1. Go to Recipe Library
2. Click "Spaghetti Bolognese"
3. Click "Edit Recipe" button
4. Make these changes:
   - Change name to "Spaghetti Bolognese (Family Recipe)"
   - Change prep time from 10 to 15 minutes
   - Change first ingredient quantity from 500g to 600g
5. Click "Save Recipe"
6. Wait for save confirmation
7. Navigate back to recipe detail

**What to Check:**
- ✅ Changes saved successfully
- ✅ Recipe detail shows updated values
- ✅ Recipe name updated in meal plan
- ✅ Meal plan still references same recipe (no broken links)

**Then Test:**
- Click Edit again, wait 30 seconds without saving (test auto-save)
- Close tab without saving, reopen (test draft restore)
- Try to save with invalid data (empty name) - should show error

---

### Test 4: Auto-Archive (5 minutes) 🟡 MEDIUM

**Goal:** Verify old plans automatically archive when generating new

**Steps:**
1. Note current plan: Dec 28 - Jan 3
2. Click "Generate New Week" from home
3. Wait for generation to complete
4. Navigate to History (#/history)
5. Verify old plan appears as card
6. Click on archived plan card
7. Review archived plan detail

**What to Check:**
- ✅ Old plan appears in history
- ✅ Card shows correct week dates
- ✅ Card shows meal count, recipe count, budget
- ✅ Clicking card opens detail view
- ✅ Detail view shows all meals
- ✅ Detail view has "Archived" badge
- ✅ No edit buttons in archived view
- ✅ Can view shopping list for archived plan

---

### Test 5: Settings Integration (5 minutes) 🟢 LOW

**Goal:** Verify history retention setting works

**Steps:**
1. Go to Settings (#/settings)
2. Click "Meal Planning" tab
3. Find "History Retention" dropdown
4. Change from 4 weeks to 2 weeks
5. Verify auto-save indicator appears
6. Generate 3+ meal plans
7. Check history only keeps last 2

**What to Check:**
- ✅ Dropdown shows current value
- ✅ Can change retention period
- ✅ Setting saves automatically
- ✅ Cleanup runs when changed
- ✅ Old plans removed correctly

---

## 📝 Test Results Template

Please fill this out as you test:

```markdown
## Test Results - [Your Name] - [Date]

### Test 1: Recipe Import
- Recipe 1 (Chicken Tikka): [ ] PASS / [ ] FAIL
  - Extraction accuracy: ___/10
  - Confidence score: ___%
  - Issues: ___________
  
- Recipe 2 (Pasta Carbonara): [ ] PASS / [ ] FAIL
  - Issues: ___________
  
- Invalid text test: [ ] PASS / [ ] FAIL
  - Showed error: [ ] YES / [ ] NO

### Test 2: Single Day Regeneration
- Tuesday regeneration: [ ] PASS / [ ] FAIL
  - Other days unchanged: [ ] YES / [ ] NO
  - No duplicates: [ ] YES / [ ] NO
  - Shopping list updated: [ ] YES / [ ] NO
  - Issues: ___________

### Test 3: Recipe Editing
- Edit and save: [ ] PASS / [ ] FAIL
  - Changes persisted: [ ] YES / [ ] NO
  - Meal plan updated: [ ] YES / [ ] NO
  - Issues: ___________

### Test 4: Auto-Archive
- Old plan archived: [ ] PASS / [ ] FAIL
  - History accessible: [ ] YES / [ ] NO
  - Data intact: [ ] YES / [ ] NO
  - Issues: ___________

### Overall Assessment
- Ready for production: [ ] YES / [ ] NO
- Blockers found: ___________
- Nice-to-haves: ___________
```

---

## 🔧 Quick Fixes Needed

### Fix #1: Settings Tab Switching
I'll fix this after you complete testing.

### Fix #2: Recipe Edit Add Ingredient
I'll investigate and fix after testing.

---

## 💡 Tips for Testing

1. **Keep browser console open** (F12) to see any errors
2. **Test with real recipe text** from blogs/emails
3. **Try to break things** - edge cases are valuable
4. **Note any UX confusion** - if it's not obvious, it needs improvement
5. **Test on mobile** if possible (or resize browser)

---

**Ready to start manual testing!** 🚀

Focus on the 4 critical tests first (Recipe Import, Single Day Regen, Recipe Edit, Auto-Archive).
The rest can wait if you're short on time.


