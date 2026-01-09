# 🚀 Run This Now to Fix Images & Instructions

## What This Does

Running the extraction script **ONE TIME** will fix BOTH issues:

1. ✅ **Higher Resolution Images** - Now downloading at `636x393` (was `312x231`)
2. ✅ **Recipe Instructions** - Will extract proper step-by-step instructions

## How to Run

### Step 1: Open Terminal
Open your terminal and navigate to the project:

```bash
cd "/Users/rolandkhayat/Cursor projects/Meal Planner"
```

### Step 2: Run the Extraction Script

```bash
node scripts/extractSpoonacularCatalog.js
```

### What to Expect

```
⏱️  Time: 15-20 minutes
📊  API Points Used: ~800 points
📥  Downloads: ~600 high-res images (~150MB)
✅  Result: Higher quality images + instructions for all recipes
```

### Progress Output

You'll see:
```
🎯 Starting Spoonacular catalog extraction...
📊 Fetching recipes from Spoonacular...
  ✓ Query 1/18: italian (50 recipes)...
  ✓ Query 2/18: mexican (50 recipes)...
  ...
📥 Downloading images (high-res 636x393)...
  Downloaded: 100/607...
  Downloaded: 200/607...
  ...
🔄 Transforming recipes to internal schema...
💾 Saving catalog...
✅ Extraction complete!
```

## After It's Done

1. **Refresh your browser**
2. **Open a recipe** - You should see:
   - 📸 **Higher quality images**
   - 📝 **Proper instructions** (numbered steps)
   - 📊 **Health scores** (already fixed)

## Notes

- **Safe to run**: Will replace old catalog with new one
- **Backup exists**: Old catalog is automatically backed up
- **One-time fix**: Only need to run this once
- **API usage**: Uses Spoonacular points (you have plenty)

## Troubleshooting

### If you see "API key not found":
Check your `.env` file has:
```
SPOONACULAR_API_KEY=your_key_here
```

### If extraction fails partway:
- Script has retry logic built-in
- Will resume from where it failed
- Just run it again

---

## 🎯 Ready? Run the command above!

Once complete, you'll have:
- ✨ Beautiful high-res recipe photos
- 📋 Complete cooking instructions
- 💯 Fixed health scores (already done)

**Estimated completion time: ~20 minutes**
