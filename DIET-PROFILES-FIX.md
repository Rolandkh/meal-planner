# Diet Profiles Dropdown Fix

## Problem
The diet profiles dropdown in Settings → Household → Edit Eater was showing as empty/not working.

## Root Cause
The diet profiles JSON import using `assert { type: 'json' }` syntax may not work in all browsers/environments, causing the initialization to silently fail.

## Solution Implemented

### 1. Added Fallback Initialization
Created `src/utils/forceDietProfilesInit.js` with:
- **Hardcoded fallback data** for all 11 diet profiles
- **Automatic detection** if profiles are missing
- **Force initialization** function

### 2. Updated SettingsPage
The Settings page now:
- Automatically checks for diet profiles on load
- Initializes them if missing
- Logs the status to console

### 3. Added Debug Helpers
Created `src/utils/debugHelpers.js` accessible via browser console:
```javascript
window.debug.checkProfiles()   // Check if profiles loaded
window.debug.fixProfiles()     // Force reinitialize
window.debug.listProfiles()    // Show all 11 profiles
window.debug.help()            // Show all commands
```

### 4. Improved main.js
Added fallback initialization if bootstrap fails.

---

## The 11 Diet Profiles

1. **Mediterranean** - Heart-healthy, olive oil, fish, vegetables
2. **Keto / Low-Carb** - Very low carb, high fat, ketosis
3. **Vegetarian** - Plant-based, no meat/fish, includes dairy/eggs
4. **High Protein** - Muscle building, satiety, weight management
5. **Flexitarian** - Primarily plant-based with occasional meat
6. **Longevity Protocol** - Science-based lifespan extension (Diet Compass)
7. **Intermittent Fasting** - Time-restricted eating (16:8)
8. **Vegan** - Entirely plant-based, no animal products
9. **MIND Diet** - Brain health, Mediterranean + DASH
10. **Kid-Friendly** - Nutritious, familiar foods for children
11. **La Dieta** - Mindfulness, gratitude, intentional eating

---

## How to Test

### Quick Test
1. Reload the page
2. Open browser DevTools → Console
3. You should see: `✅ Diet profiles OK: 11 profiles available`
4. Go to Settings → Household → Edit an eater
5. Diet profile dropdown should show all 11 options

### If Dropdown Still Empty

**Option 1: Use Debug Helper (Recommended)**
1. Open browser console (F12)
2. Type: `window.debug.checkProfiles()`
3. If it shows 0 profiles, run: `window.debug.fixProfiles()`
4. Reload the settings page

**Option 2: Manual Fix**
1. Open browser console (F12)
2. Run this command:
   ```javascript
   localStorage.removeItem('vanessa_diet_profiles');
   location.reload();
   ```
3. This will force reinitialize on next load

**Option 3: Check Console Logs**
Look for these messages on page load:
```
✅ Initialized 11 diet profiles         // Good!
✅ Force initialized 11 diet profiles   // Fallback worked
⚠️ Diet profiles missing, initializing... // Auto-fixing
```

---

## Files Modified

### New Files Created:
1. `src/utils/forceDietProfilesInit.js` - Fallback initialization
2. `src/utils/debugHelpers.js` - Browser console helpers

### Existing Files Updated:
1. `src/components/SettingsPage.js` - Auto-check on load
2. `src/main.js` - Fallback initialization + debug helpers

---

## What Each File Does

### forceDietProfilesInit.js
- Contains hardcoded copy of all 11 profiles
- `ensureDietProfiles()` - Auto-checks and initializes if needed
- `checkDietProfiles()` - Returns status (loaded, count, etc)
- `forceDietProfilesInit()` - Force overwrites localStorage

### debugHelpers.js
- Exposes debug commands to `window.debug`
- Helpful for troubleshooting
- Available in browser console

### SettingsPage.js Changes
```javascript
beforeRender() {
  ensureDietProfiles();           // NEW: Auto-initialize if needed
  const status = checkDietProfiles(); // NEW: Check status
  console.log('Diet Profiles:', status); // NEW: Log for debugging
  // ... rest of existing code
}
```

### main.js Changes
```javascript
try {
  await bootstrapHealthData();
} catch (error) {
  // NEW: Fallback if bootstrap fails
  forceDietProfilesInit();
}

// NEW: Debug helpers
initDebugHelpers();
```

---

## Console Commands Reference

Open browser console (F12) and use these commands:

```javascript
// Check status
window.debug.checkProfiles()
// Output: Shows loaded: true/false, count: 11, list of profiles

// Fix if broken
window.debug.fixProfiles()
// Output: Reinitializes profiles and shows status

// List all profiles
window.debug.listProfiles()
// Output: Shows all 11 profiles with names and summaries

// See all commands
window.debug.help()
// Output: Shows full command reference

// View localStorage
window.debug.showStorage()
// Output: Shows all keys and their sizes
```

---

## Expected Console Output

### On Page Load (Success):
```
🔄 Bootstrapping health data...
✅ Initialized 11 diet profiles
✅ Health data bootstrap complete
🛠️ Debug helpers available: Type window.debug.help() for commands
📋 Diet Profiles Status: { loaded: true, count: 11, ... }
Settings loaded: { ..., dietProfiles: 11 }
```

### On Settings Page:
```
📋 Diet Profiles Status: {
  loaded: true,
  count: 11,
  version: "1.0.0",
  profiles: [
    { id: "mediterranean", name: "Mediterranean" },
    { id: "keto", name: "Keto / Low-Carb" },
    ...
  ]
}
```

### When Opening Eater Modal:
```
📋 Loading diet profiles for eater modal: 11 profiles available
```

### If Problems Detected:
```
⚠️ Diet profiles missing, initializing...
✅ Force initialized 11 diet profiles
```

---

## Troubleshooting

### Issue: "No diet profiles found!"
**Solution:**
```javascript
window.debug.fixProfiles()
```

### Issue: Dropdown shows only "None"
**Check:**
1. Open console, look for errors
2. Run `window.debug.checkProfiles()`
3. If count = 0, run `window.debug.fixProfiles()`

### Issue: Profiles load but dropdown still empty
**Possible causes:**
1. JavaScript error preventing dropdown render
2. Check console for errors
3. Try refreshing page after fix

### Issue: "window.debug is not defined"
**Solution:** 
- Reload the page (debug helpers load on init)
- If still not available, check console for errors in main.js

---

## Verification Checklist

✅ **Files exist:**
- `src/data/dietProfiles.json` (11 profiles)
- `src/utils/forceDietProfilesInit.js` (new)
- `src/utils/debugHelpers.js` (new)

✅ **Console shows on load:**
- "Initialized 11 diet profiles" or "Force initialized 11 diet profiles"
- "Debug helpers available"

✅ **Debug commands work:**
- `window.debug.checkProfiles()` returns count: 11
- `window.debug.listProfiles()` shows all 11 profiles

✅ **Settings page shows:**
- "Diet Profiles Status: { loaded: true, count: 11 }"
- "dietProfiles: 11" in Settings loaded log

✅ **Dropdown works:**
- Edit eater modal shows 11 profiles + "None"
- Can select different profiles
- Profile description box appears

---

## Next Steps

1. **Reload the page** to get the new code
2. **Check console** for initialization messages
3. **Go to Settings → Household** → Edit eater
4. **Verify dropdown** has 11 profiles
5. **If still broken**, run `window.debug.fixProfiles()` in console
6. **Report back** with console output if issues persist

The profiles are definitely there (I can see all 11 in the JSON file), so this should fix the initialization issue!
