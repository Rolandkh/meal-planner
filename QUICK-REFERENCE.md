# Quick Reference Card

**Version:** v1.0-rc2  
**Status:** Code Complete + UI Polish - Ready for Testing  
**Updated:** January 8, 2026

---

## 🚀 Quick Start

```bash
# Start dev server
npm run dev
# → http://localhost:3000

# Deploy to production
vercel --prod
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.taskmaster/docs/prd.txt` | Main specification (all slices) |
| `references/CURRENT-IMPLEMENTATION.md` | Current state & architecture |
| `TESTING-GUIDE.md` | Manual testing instructions |
| `DOCUMENTATION-INDEX.md` | Complete doc index |

---

## 🗺️ Routes (11 total)

| Route | Page | Slice |
|-------|------|-------|
| `#/` | Home | 1 |
| `#/generating` | Generation Status | 2 |
| `#/meal-plan` | Meal Plan View | 2 |
| `#/day/:day` | Day View | 2 |
| `#/recipes` | Recipe Library | 3 |
| `#/recipe/:id` | Recipe Detail | 3 |
| `#/recipe/:id/edit` | Recipe Edit | 4 ✨ |
| `#/history` | History List | 4 ✨ |
| `#/history/:id` | Historical Plan | 4 ✨ |
| `#/shopping-list` | Shopping List | 2 |
| `#/settings` | Settings | 3 |

---

## 🎯 Slice 4 Features (NEW)

### 1. Recipe Editing ✏️
- Edit any recipe after generation
- Auto-save drafts every 30s
- Dynamic ingredient rows
- Full validation

**Test:** Click recipe → Edit → Change → Save

---

### 2. Single Day Regeneration 🔄
- Regenerate any day (3 meals)
- Keeps other 6 days unchanged
- Avoids recipe duplication
- Fast (~20-30 seconds)

**Test:** Meal Plan → Click 🔄 on Tuesday → Confirm

---

### 3. Meal Plan History 📅
- Auto-archives old plans
- Browse past weeks
- Read-only views
- Configurable retention (1-12 weeks)

**Test:** Generate 2 plans → Check History

---

### 4. Recipe Import 📥
- Paste recipe text from anywhere
- AI extracts structure
- Confidence scoring
- Preview/edit before save

**Test:** Recipes → + Add Recipe → Paste → Import

---

## 🧪 Testing Checklist

### ✅ Automated (Done)
- [x] Navigation & routing
- [x] UI rendering
- [x] Modals open/close
- [x] Buttons appear
- [x] No console errors

### ⏳ Manual (Pending)
- [ ] Recipe import (AI extraction)
- [ ] Single day regeneration (API)
- [ ] Recipe editing (save/persist)
- [ ] Auto-archive (new generation)
- [ ] Form validation (errors)
- [ ] Settings integration
- [ ] Mobile responsive

---

## ✅ Recent Bug Fixes (Dec 26 Evening)

1. ✅ **Settings tab switching** - Fixed (changed `createSelectGroup` → `createFormGroup`)
2. ✅ **Meal plan generation** - Fixed 500 error (requirements string/array handling)
3. ✅ **Dev presets** - Updated with personalized Mediterranean diet data

**Status:** All known bugs resolved!

---

## 📊 Project Stats

- **Version:** v1.0-rc1
- **Slices:** 4 complete
- **Tasks:** 21 total (all done)
- **Code:** ~15,000 lines
- **Components:** 14
- **API Endpoints:** 3
- **Routes:** 11
- **Storage Keys:** 11

---

## 🎓 Key Patterns

### Component Lifecycle
```javascript
beforeRender() → render() → afterRender() → beforeUnload()
```

### Storage Pattern
```javascript
load*() // Returns data or default (never throws)
save*() // Returns {success, error?, message?}
```

### Modal Pattern
```javascript
overlay + modal + state machine + event delegation
```

---

## 🔧 Common Commands

### Taskmaster
```bash
task-master list              # View all tasks
task-master next              # Next task to work on
task-master show 47           # View task details
task-master set-status --id=47 --status=done
```

### Development
```bash
npm run dev                   # Start server
npm run build                 # No-op (static site)
```

### Deployment
```bash
vercel                        # Deploy preview
vercel --prod                 # Deploy production
```

---

## 📞 Need Help?

1. **Understanding features:** Read `.taskmaster/docs/prd.txt`
2. **Current state:** Check `references/CURRENT-IMPLEMENTATION.md`
3. **Testing:** Follow `TESTING-GUIDE.md`
4. **All docs:** See `DOCUMENTATION-INDEX.md`

---

## 🎯 Current Focus

**Right Now:** Manual testing of Slice 4 features  
**Next:** Bug fixes and polish  
**Then:** Slice 4 Reality Check and Slice 5 planning

---

**Server:** http://localhost:3000  
**Status:** 🟢 Ready for Testing


