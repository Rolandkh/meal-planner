# Task 58: Critical Bug Fix - Week Deletion Issue

**Date:** January 8, 2026  
**Status:** ✅ Fixed - Ready for Re-Test

---

## 🐛 Bug Found During Testing

**Problem:** When regenerating a single day, the entire week was still being deleted (only the regenerated day remained).

**Root Cause:** `GenerationStatusPage.handleComplete()` was calling `saveMeals(transformed.meals)` which **replaced** all meals instead of **merging** with existing meals.

---

## 🔧 Fixes Implemented

### **Fix 1: Merge Strategy in GenerationStatusPage** ✅
**File:** `src/components/GenerationStatusPage.js`

**Changes:**
1. Added tracking: `isSingleDayRegeneration` and `regeneratingDate`
2. In `startGeneration()`: Set flags when regeneration parameters detected
3. In `handleComplete()`: 
   - **NEW:** Load existing meals and filter out the regenerating date
   - **NEW:** Merge other days' meals with new day's meals
   - **NEW:** Merge recipes to avoid duplicates
   - **NEW:** Update mealPlan.mealIds with ALL meal IDs (not just new ones)
   - **NEW:** Use `saveCurrentMealPlan()` instead of `saveNewMealPlan()` (prevents archiving)

**Before:**
```javascript
saveMeals(transformed.meals); // ❌ Replaces everything!
```

**After:**
```javascript
// Load existing and merge
const existingMeals = loadMeals();
const otherDayMeals = existingMeals.filter(m => m.date !== this.regeneratingDate);
const mealsToSave = [...otherDayMeals, ...transformed.meals]; // ✅ Preserves other days
saveMeals(mealsToSave);
```

---

### **Fix 2: Context-Aware Button Text** ✅
**File:** `src/components/ChatWidget.js`

**Changes:**
- Added `updateGenerateButtonText()` method
- Button text now changes based on context:
  - Has `regenerate_day` in sessionStorage → "✨ Generate"
  - No context → "✨ Generate Week"

**User Experience:**
- When opened from day view → button says "Generate" (clear it's for that day)
- When opened normally → button says "Generate Week" (clear it's for full week)

---

### **Fix 3: MealPlanView Gets Same Treatment** ✅
**File:** `src/components/MealPlanView.js`

**Changes:**
- Replaced 🔄 "Regenerate" button with ✏️ "Make Changes" button
- Changed from modal workflow to conversational workflow
- Now opens ChatWidget with day context (same as DayView)
- Added `openChatForDayChanges()` method

---

## 📋 Quick Re-Test Instructions

### **Test 1: Verify Week Preservation** (Most Critical)
1. Make sure you have a full week meal plan
2. Note ALL 7 days' meals (write them down if needed)
3. Go to any day (e.g., Wednesday)
4. Click "Make Changes" (green button)
5. Tell Vanessa you want something different
6. Click "Generate" button
7. Wait for completion
8. **CHECK: All other 6 days should still be there!**

### **Test 2: Button Text is Clear**
1. Open chat from home page (normal) → Should say "Generate Week"
2. Close chat
3. Go to a day view, click "Make Changes" → Should say "Generate"
4. Close chat
5. Open from meal plan page day card → Should say "Generate"

### **Test 3: Both Entry Points Work**
1. Test "Make Changes" from Day View page (detailed view)
2. Test ✏️ button from Meal Plan page (week overview cards)
3. Both should work identically

---

## 🔍 What To Look For

**✅ Success Indicators:**
- Button says "Generate" (not "Generate Week") when opened for day changes
- All 7 days remain after regenerating one day
- Only the selected day shows new meals
- No console errors

**❌ Failure Indicators:**
- Week still gets deleted
- Button text is confusing
- Console shows errors about missing meals
- Meal IDs don't match

---

## 📁 Files Modified

1. **`src/components/GenerationStatusPage.js`**
   - Added single-day tracking flags
   - Implemented meal merging strategy
   - Fixed mealIds update logic
   - Uses saveCurrentMealPlan for single-day (doesn't archive)

2. **`src/components/ChatWidget.js`**
   - Added updateGenerateButtonText() method
   - Button text now context-aware
   - Called in multiple places for consistency

3. **`src/components/MealPlanView.js`**
   - Replaced regenerate modal with conversational workflow
   - Added openChatForDayChanges() method
   - Changed button from 🔄 to ✏️

---

## 🧪 **Please Test Again!**

The critical merge logic is now fixed. This should preserve all other days when regenerating one day.

**Report back:**
- ✅ "Fixed! All days preserved now"
- ❌ "Still broken: [description]"

