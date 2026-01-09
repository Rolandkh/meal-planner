# How to Update Diet Profiles on Live Site

## The Problem
Your deployed site has the OLD diet profiles (v1.0.0, 11 profiles) cached in browser localStorage. The new enhanced profiles (v2.0.0, 17 profiles) exist in the code but aren't loading because of localStorage caching.

---

## ✅ SOLUTION: Clear localStorage

### Method 1: Browser Console (Easiest)

On your deployed Vercel site:

1. **Open Browser DevTools**
   - Press `F12` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)
   - Or right-click → Inspect

2. **Go to Console tab**

3. **Run this command:**
   ```javascript
   localStorage.removeItem('vanessa_diet_profiles');
   location.reload();
   ```

4. **Verify it worked:**
   - Console should show: `✅ Initialized 17 diet profiles (v2.0.0)`
   - Diet Profiles page title should say: "17 profiles available"
   - New profiles should appear: Pescatarian, Paleo, DASH, Anti-Inflammatory, Low FODMAP, Gut Health

---

### Method 2: Use Debug Helper (Recommended)

If the debug helpers are loaded:

1. **Open console** (F12)
2. **Run:**
   ```javascript
   window.debug.refreshProfiles()
   ```
3. Page will automatically reload with fresh profiles

---

### Method 3: Hard Refresh (Less Reliable)

1. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. This MAY clear the cache, but Method 1 is more reliable

---

## How to Verify Success

### Console Output
You should see:
```
🔄 Bootstrapping health data...
✅ Initialized 17 diet profiles (v2.0.0)
✅ Health data bootstrap complete
```

### Diet Profiles Page
- **Title:** "17 profiles available" (not 11)
- **See these NEW profiles:**
  - Pescatarian
  - Paleo  
  - DASH Diet
  - Anti-Inflammatory
  - Low FODMAP
  - Gut Health Protocol

### Enhanced Detail
Click "View Details" on **Longevity Protocol**:
- Should see "Diet Compass Score: 88/100"
- Should see "4-Tier Food System" section
- Should see "Daily Targets" section
- Should see "Weekly Fasting Protocol"

Click "View Details" on **La Dieta**:
- Should see yellow banner: "⚠️ Temporary Diet Protocol"
- Should see "Progressive Phases" section
- Should see Phase 1, 2, and 3 details

---

## Why This Happens

### The Caching System:
1. On first load, diet profiles load from `dietProfiles.json`
2. Saved to localStorage as `vanessa_diet_profiles`
3. Version number saved: `_dataVersion: "1.0.0"`
4. On subsequent loads, checks version
5. If same version → skip loading (uses cached)
6. If different version → should update (but localStorage has old data)

### The Fix:
- Clear localStorage entry
- Forces fresh load from JSON file
- New version (2.0.0) gets cached
- All 17 enhanced profiles load

---

## Updated Files (To Deploy)

These files now have better version handling:

### 1. `src/utils/initializeHealthData.js`
- Now logs version changes: `v1.0.0 → v2.0.0`
- Better logging to see what's happening

### 2. `src/utils/forceDietProfilesInit.js`
- Updated to version 2.0.0
- Better version checking

### 3. `src/components/DietProfilesPage.js`
- Checks version on page load
- Warns in console if outdated
- Tells you exactly what command to run

### 4. `src/utils/debugHelpers.js`
- Added `refreshProfiles()` command
- One-click solution to clear and reload

### 5. `src/utils/forceProfileRefresh.js` (NEW)
- Advanced async refresh system
- For future use

---

## Step-by-Step for You

### Right Now (On Live Site):

1. **Go to your deployed Vercel site**
2. **Open DevTools** (F12)
3. **Open Console tab**
4. **Run:**
   ```javascript
   localStorage.removeItem('vanessa_diet_profiles');
   location.reload();
   ```
5. **Wait for page to reload**
6. **Check console for:**
   ```
   ✅ Initialized 17 diet profiles (v2.0.0)
   ```
7. **Go to Diet Profiles page**
8. **Title should say:** "17 profiles available"
9. **Click "View Details" on Longevity Protocol**
10. **Should see Diet Compass score and all enhanced sections**

### After Deploying Updated Code:

Next time you deploy updates, users can:

**Option A: Simple Command**
```javascript
localStorage.removeItem('vanessa_diet_profiles');
location.reload();
```

**Option B: Debug Helper**
```javascript
window.debug.refreshProfiles()
```

**Option C: Console Will Warn Them**
When they visit Diet Profiles page, console will show:
```
⚠️ Diet profiles may be outdated!
   Current: v1.0.0, 11 profiles
   Expected: v2.0.0, 17 profiles
   Solution: Clear localStorage and reload page
   Run: localStorage.removeItem('vanessa_diet_profiles'); location.reload();
```

---

## For Future Profile Updates

### When You Update Profiles:

1. **Edit `src/data/dietProfiles.json`**
2. **Bump the version number:**
   ```json
   "_dataVersion": "2.1.0"  // or 3.0.0, etc.
   ```
3. **Deploy to Vercel**
4. **Clear your browser cache:**
   ```javascript
   localStorage.removeItem('vanessa_diet_profiles');
   location.reload();
   ```
5. **Verify new profiles loaded**

### The version number controls caching:
- Same version → uses cached (fast)
- Different version → loads fresh (update)

---

## Summary

**What's Wrong:** Old profiles (v1.0.0, 11 profiles) cached in localStorage  
**What's New:** Enhanced profiles (v2.0.0, 17 profiles) in code  
**The Fix:** Clear localStorage to force fresh load

**Command:**
```javascript
localStorage.removeItem('vanessa_diet_profiles');
location.reload();
```

**Or:**
```javascript
window.debug.refreshProfiles()
```

**Then you'll see:**
- ✅ 17 profiles (not 11)
- ✅ Enhanced detail with Diet Compass scores
- ✅ La Dieta with 3 phases
- ✅ Meal structures, daily targets, tier systems
- ✅ All the comprehensive data we added!

Try it now on your live site and let me know if it works! 🎯
