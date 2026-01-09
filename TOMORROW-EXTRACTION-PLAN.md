# 🌅 Tomorrow's Extraction Plan

**Date**: January 10, 2026  
**Goal**: Complete the catalog with high-res images + instructions

---

## 📋 What We Need Tomorrow

### 1. High-Resolution Images (636x393)
- **Current**: 312x231 (low-res from yesterday)
- **Target**: 636x393 (2x resolution)
- **Method**: Direct download from Spoonacular CDN (no API points!)
- **Count**: 607 images

### 2. Recipe Instructions
- **Current**: "No instructions available"
- **Target**: Step-by-step cooking instructions
- **Method**: API calls to `/recipes/{id}/information`
- **Count**: 607 recipes
- **API Points**: ~607 points

---

## 🧪 STEP 1: Test Run (3 Recipes)

**Purpose**: Verify everything works before running full extraction

### Command for Test Run:

```bash
cd "/Users/rolandkhayat/Cursor projects/Meal Planner"
node scripts/testExtraction.js
```

### What This Will Do:
1. Download high-res images for 3 recipes
2. Fetch instructions for 3 recipes
3. Update catalog for just those 3
4. Show you the results
5. **Total time**: 2 minutes
6. **API points**: 3 points

### Success Criteria:
- ✅ Images are 636x393 (check file properties)
- ✅ Instructions appear in catalog
- ✅ Recipes display properly in app
- ✅ No errors in console

---

## 🚀 STEP 2: Full Extraction (All 607 Recipes)

**Only run this AFTER Step 1 succeeds!**

### Command for Full Run:

```bash
cd "/Users/rolandkhayat/Cursor projects/Meal Planner"
node scripts/fullExtraction.js
```

### What This Will Do:
1. Delete all old low-res images
2. Download 636x393 images for all 607 recipes
3. Fetch instructions for all 607 recipes
4. Update complete catalog
5. Re-score all recipes
6. **Total time**: 40-45 minutes
7. **API points**: ~607 points

### Progress Updates:
```
📸 Downloading high-res images...
  Downloaded: 50/607
  Downloaded: 100/607
  ...

📋 Fetching instructions...
  Fetched: 50/607
  Fetched: 100/607
  ...

✅ COMPLETE!
```

---

## 📝 Scripts to Create

I'll create two scripts for you:

### 1. `scripts/testExtraction.js` - Test with 3 recipes
- Tests the first 3 recipes from catalog
- Quick validation
- Minimal API usage

### 2. `scripts/fullExtraction.js` - Full 607 recipes
- Processes all recipes
- Shows progress
- Handles errors gracefully

---

## ⏰ When to Run

### Check API Limit Reset:
Spoonacular limits reset at **midnight UTC**

**Current time zones**:
- UTC: Midnight
- EST: 7:00 PM (previous day)
- PST: 4:00 PM (previous day)
- AEDT: 11:00 AM (next day)

### Before Running:
1. **Verify API key works**:
   ```bash
   curl "https://api.spoonacular.com/recipes/715769/information?apiKey=YOUR_KEY"
   ```
   
2. **Check quota** (if you have dashboard access):
   - Log into Spoonacular
   - Check remaining points for the day

---

## 🎯 Expected Results

### After Test Run (3 recipes):
- 3 recipes with high-res images (636x393)
- 3 recipes with full instructions
- Verify in app that they display correctly

### After Full Run (607 recipes):
- ✅ All images: 636x393 high-resolution
- ✅ All ingredients: Complete lists
- ✅ All instructions: Step-by-step cooking
- ✅ All scores: Diet Compass ratings
- 🎉 **100% Complete Catalog!**

---

## 🐛 Troubleshooting

### If Test Run Fails:

**Images don't download:**
- Check internet connection
- Verify Spoonacular CDN is accessible
- Try manual URL: `https://spoonacular.com/recipeImages/715769-636x393.jpg`

**Instructions don't fetch:**
- Verify API key in `.env`
- Check API quota hasn't been exceeded
- Look for error messages in console

**Wrong image size:**
- Check the downloaded file with: `file public/images/recipes/715769.jpg`
- Should show "636x393" in output
- If not, script has wrong URL format

### If Full Run Fails Partway:

**Script is designed to resume!**
- Just run it again
- It will skip completed recipes
- Continue from where it stopped

---

## 📊 Current Catalog Status

### What We Have NOW:
```json
{
  "total": 607,
  "images": "312x231 (low-res)",
  "ingredients": "✅ Complete (7,013 items)",
  "instructions": "❌ Missing",
  "healthScores": "✅ Complete"
}
```

### What We'll Have TOMORROW:
```json
{
  "total": 607,
  "images": "636x393 (high-res)",
  "ingredients": "✅ Complete (7,013 items)",
  "instructions": "✅ Complete",
  "healthScores": "✅ Complete"
}
```

---

## 🎬 Tomorrow's Workflow

### Morning Routine:

1. **Test first** (2 minutes):
   ```bash
   node scripts/testExtraction.js
   ```

2. **Verify test results**:
   - Open app
   - Check one of the 3 test recipes
   - Verify image is sharp/high-res
   - Verify instructions appear

3. **Run full extraction** (40 minutes):
   ```bash
   node scripts/fullExtraction.js
   ```

4. **Celebrate!** 🎉
   - Everything complete
   - Ready for production
   - Full-featured recipe catalog

---

## 💾 Files Created

- `scripts/testExtraction.js` - Test with 3 recipes (creating next)
- `scripts/fullExtraction.js` - Full 607 extraction (creating next)
- `TOMORROW-EXTRACTION-PLAN.md` - This guide

---

## ✅ Pre-Flight Checklist

Before running tomorrow:
- [ ] API limit has reset (check time)
- [ ] `.env` has `SPOONACULAR_API_KEY`
- [ ] Internet connection is stable
- [ ] Have ~45 minutes available
- [ ] Ready to test first, then full run

---

**See you tomorrow! The catalog will be 100% complete after this.** 🚀
