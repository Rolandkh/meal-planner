# Slice 5: Complete Spoonacular Independence Plan

**Goal:** Extract everything from Spoonacular ONCE, then cancel subscription  
**Status:** Confirmed - All assets will be downloaded locally  
**Date:** January 8, 2026

---

## ✅ What Gets Downloaded & Stored Locally

### **1. Recipe Data (JSON)**
**File:** `src/data/vanessa_recipe_catalog.json`

**Contains for each of ~800 recipes:**
- ✅ Recipe ID (Spoonacular ID preserved)
- ✅ Name/title
- ✅ **Complete ingredient list** (name, quantity, unit, category)
- ✅ **Full instructions** (step-by-step)
- ✅ Prep time & cook time
- ✅ Servings
- ✅ **Complete nutrition data:**
  - Calories
  - Protein, Fat, Carbs, Fiber, Sugar
  - Saturated fat, Omega-3, Omega-6, Sodium
  - All micronutrients from Spoonacular
- ✅ **Comprehensive tags:**
  - Cuisines (Italian, Mexican, Asian, etc.)
  - Diets (Vegetarian, Vegan, Keto, etc.)
  - Dish types (Main course, Side, Dessert, etc.)
  - Protein sources, cooking methods, carb bases
  - Effort level, spice level, budget tier
  - Kid-friendly, make-ahead flags
- ✅ **Diet Compass scores** (calculated locally)
- ✅ **Local image path** (not external URL)

**Size:** ~2-3MB  
**Format:** JSON array  
**Storage:** Committed to git repo

---

### **2. Recipe Images (JPEG)**
**Directory:** `public/images/recipes/`

**Downloaded for each recipe:**
- ✅ Image file: `{spoonacularId}.jpg`
- ✅ Size: 312x231px (card/thumbnail size)
- ✅ Format: JPEG optimized for web
- ✅ Estimated: 60-125KB per image

**Total Size:** ~50-100MB for 800 images  
**Storage:** Committed to git repo  
**URLs in catalog:** `/images/recipes/123456.jpg` (local paths)

---

### **3. Health & Profile Data (JSON)**
**Files:**
- `src/data/ingredientHealthData.json` (~50KB)
- `src/data/dietProfiles.json` (~20KB)

**Contains:**
- ✅ 200+ ingredient health scores
- ✅ 11 diet profile definitions
- ✅ All scoring rules and metadata

**Storage:** Committed to git repo

---

## 📦 Total One-Time Download

| Asset Type | Count | Size | Location |
|------------|-------|------|----------|
| Recipe JSON | 800 | ~2-3MB | `src/data/vanessa_recipe_catalog.json` |
| Recipe Images | 800 | ~50-100MB | `public/images/recipes/*.jpg` |
| Health Data | 1 | ~50KB | `src/data/ingredientHealthData.json` |
| Diet Profiles | 1 | ~20KB | `src/data/dietProfiles.json` |
| **TOTAL** | **~1,602 files** | **~55-105MB** | **All in repo** |

---

## 🔄 Extraction Process (You Run Once)

### **Step 1: Run Extraction Script**
```bash
# This will take 2-3 hours
node scripts/extractSpoonacularCatalog.js
```

**What it does:**
1. Fetches 800 recipes via Spoonacular API (66 searches)
2. Downloads nutrition data for each recipe
3. **Downloads and saves all 800 images locally**
4. Calculates Diet Compass health scores
5. Generates comprehensive tags
6. Saves everything to local files

**Progress output:**
```
🔄 Extraction Progress:
├─ Recipes fetched: 450/800
├─ Images downloaded: 450/800
├─ Duplicates skipped: 23
├─ API points used: ~550/5000
└─ Est. time remaining: 1h 15m

✅ Extraction Complete!
├─ Total recipes: 800
├─ Total images: 796 (4 failed downloads)
├─ JSON size: 2.8MB
├─ Images size: 87MB
└─ API points used: 987/5000
```

### **Step 2: Commit to Repo**
```bash
git add src/data/vanessa_recipe_catalog.json
git add public/images/recipes/
git commit -m "Add Spoonacular catalog with local images"
```

### **Step 3: Deploy**
```bash
vercel --prod
```

### **Step 4: Cancel Spoonacular** 🎉
Once deployed and tested, **you can safely cancel** your Spoonacular subscription!

---

## 🚫 What Happens After Cancellation

### **✅ Still Works (Everything!)**
- ✅ All 800 recipes available in app
- ✅ Images load instantly (local files)
- ✅ Nutrition data complete
- ✅ Health scores calculated
- ✅ Diet filtering works
- ✅ Recipe search & browse
- ✅ Meal generation uses catalog
- ✅ **100% offline capable**

### **❌ No Longer Available**
- ❌ Can't extract NEW recipes from Spoonacular
- ❌ Can't update existing recipe data from Spoonacular

### **🔄 If You Want More Recipes Later**
- Resubscribe for 1 month
- Run extraction again (adds new recipes)
- Merge with existing catalog
- Cancel again

---

## 💾 Git Repository Size Impact

### **Before Slice 5:**
- Code: ~500KB
- Total repo: ~1-2MB

### **After Slice 5:**
- Code: ~500KB
- Recipe JSON: ~3MB
- **Recipe Images: ~50-100MB**
- **Total repo: ~55-105MB**

### **GitHub Considerations:**
- ✅ Well under GitHub's 100MB file limit
- ✅ Well under typical repo size limits
- ⚠️ Initial clone will be larger (~100MB vs ~2MB)
- ✅ LFS not needed (images are <1MB each)

### **Alternative: CDN for Images (Optional)**
If repo size is a concern, we can:
1. Download images during extraction
2. Upload to a free CDN (Cloudflare R2, Vercel Blob)
3. Update image paths to CDN URLs
4. Keep repo size small

**Recommendation:** Start with local storage (simpler), move to CDN later if needed.

---

## 📊 Extraction Cost Analysis

### **Spoonacular API Points**
- **Search calls:** ~66 searches × 5 points = 330 points
- **Recipe details:** ~800 recipes × 1 point = 800 points
- **Total:** ~1,130 points
- **Daily limit:** 5,000 points
- **Usage:** ~23% of daily quota ✅

### **Image Downloads**
- **Images:** 800 downloads
- **Cost:** FREE (direct image URLs)
- **Size:** ~50-100MB
- **Time:** ~30-60 minutes (bandwidth dependent)

### **Total Time**
- **Recipe extraction:** 1.5-2 hours (rate limiting)
- **Image download:** 0.5-1 hour (parallel downloads)
- **Processing:** 0.5 hour (scoring, tagging)
- **Total:** ~2.5-3.5 hours

### **Monthly Cost**
- **During extraction:** $29 (Cook tier, one month)
- **After extraction:** $0 (cancel subscription) 🎉
- **Anthropic (ongoing):** ~$5-10/month (for chat/generation)

---

## 🎯 Extraction Script Features

### **What the Script Does**

```javascript
// Pseudo-code of complete extraction flow
async function extractSpoonacularCatalog() {
  // 1. Create directories
  await ensureDir('public/images/recipes/');
  
  // 2. Fetch recipes
  const recipes = [];
  for (const search of searches) {
    const results = await fetchSpoonacularSearch(search);
    recipes.push(...results);
    await sleep(1000);  // Rate limiting
  }
  
  // 3. Download images
  for (const recipe of recipes) {
    const imageBuffer = await downloadImage(recipe.image);
    await saveImage(`public/images/recipes/${recipe.id}.jpg`, imageBuffer);
    recipe.image = `/images/recipes/${recipe.id}.jpg`;  // Local path
    logProgress(`Images: ${index}/${recipes.length}`);
  }
  
  // 4. Calculate health scores
  for (const recipe of recipes) {
    recipe.dietCompassScores = calculateRecipeScores(recipe);
  }
  
  // 5. Save catalog
  await saveJSON('src/data/vanessa_recipe_catalog.json', recipes);
  
  console.log('✅ Extraction complete! You can now cancel Spoonacular.');
}
```

---

## 🛡️ Backup & Safety

### **What if Image Download Fails?**
- Script logs failed downloads
- Keeps original Spoonacular URL as fallback
- App still works (images load from Spoonacular temporarily)
- Can re-download failed images later

### **What if Extraction Crashes?**
- Script saves progress periodically
- Can resume from last successful batch
- Deduplication prevents duplicate recipes

### **What if You Need to Update Later?**
- Resubscribe for 1 month
- Run extraction with `--append` flag
- New recipes added, existing preserved
- Images only downloaded for new recipes

---

## ✅ Confirmation: Complete Independence

**After extraction completes, your app will:**

✅ **Work 100% offline** (no internet needed)  
✅ **No Spoonacular dependency** (all data local)  
✅ **Fast image loading** (no CDN requests)  
✅ **Full nutrition data** (no API calls)  
✅ **Health scoring** (calculated locally)  
✅ **Diet filtering** (all tags local)  
✅ **Recipe search** (local data only)  

**Only internet needed for:**
- Anthropic Claude (chat & meal generation)
- Your own app hosting (Vercel)

---

## 📋 Pre-Extraction Checklist

Before running extraction:

- [x] Spoonacular API key obtained
- [x] API key added to `.env` file
- [x] API key tested and working ✅
- [x] ~100MB disk space available for images
- [x] 2-3 hours of time available
- [x] Stable internet connection
- [ ] Create `public/images/recipes/` directory
- [ ] Run extraction script
- [ ] Verify catalog JSON created
- [ ] Verify images downloaded
- [ ] Test in app
- [ ] Commit to git
- [ ] Deploy to Vercel
- [ ] **Cancel Spoonacular subscription** 🎉

---

## 🚀 Ready to Build

**Confirmed Strategy:**
1. ✅ Extract recipes with full data
2. ✅ Download ALL images locally
3. ✅ Calculate health scores offline
4. ✅ Store everything in repo
5. ✅ Cancel Spoonacular after extraction
6. ✅ App works independently forever

**Next Steps:**
1. I'll build all the extraction infrastructure
2. You'll run the extraction script (one time, 2-3 hours)
3. We commit everything to git
4. **You cancel Spoonacular and never pay again!** 🎉

---

**Last Updated:** January 8, 2026  
**Spoonacular Independence:** Confirmed ✅
