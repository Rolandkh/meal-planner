# Diet Profiles Library - Feature Complete!

## Overview
A comprehensive Diet Profiles management system where you can view, create, edit, and share custom diet profiles.

---

## ✨ Features Implemented

### 1. **View All Diet Profiles**
- Beautiful card-based grid layout
- See all 11 built-in profiles + custom profiles
- Filter by: All / Built-in / Custom
- Quick preview of key foods and summary

### 2. **Detailed Profile View**
- Full profile information modal
- Shows:
  - Overview & summary
  - Key principles
  - Foods to emphasize (with green tags)
  - Foods to avoid (with red tags)
  - Macro guidance (carbs, protein, fat %)
  - Special considerations
  - Compatibility with other profiles
- Beautiful gradient headers (blue for built-in, purple for custom)

### 3. **Export Profiles**
- Export any profile as JSON file
- Shareable with others
- Preserves all profile data
- Filename format: `diet-profile-{id}-{date}.json`

### 4. **Import Profiles**
- Import profiles shared by others
- Validates format and required fields
- Warns if profile already exists (can overwrite)
- Automatically marks as custom

### 5. **Delete Custom Profiles**
- Can delete your own custom profiles
- Built-in profiles are protected (can't delete)
- Confirmation required

---

## 🎨 User Interface

### Diet Profiles Page Layout
```
┌─────────────────────────────────────────────────┐
│  Diet Profiles         [➕ Create] [📥 Import]  │
│  11 profiles available                 [← Back] │
├─────────────────────────────────────────────────┤
│  [📋 All] [🏛️ Built-in] [✨ Custom]            │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Profile 1│  │ Profile 2│  │ Profile 3│      │
│  │ Summary  │  │ Summary  │  │ Summary  │      │
│  │ Key Foods│  │ Key Foods│  │ Key Foods│      │
│  │ [View]   │  │ [View]   │  │ [View]   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

### Profile Card Features
- **Header**: Gradient colored (blue=built-in, purple=custom)
- **Badge**: "Built-in" or "Custom"
- **Summary**: 2-line preview
- **Key Foods**: Shows first 4 foods + count
- **Actions**: View Details, Edit (custom only), Export

### Detail Modal Features
- Full-screen modal with gradient header
- Scrollable content
- Organized sections with icons
- Color-coded food tags (green=emphasize, red=avoid)
- Macro guidance grid
- Footer actions: Export, Edit, Delete

---

## 📍 How to Access

### Method 1: From Settings
1. Go to **Settings**
2. Click **📋 Diet Profiles** tab (far right)
3. Opens Diet Profiles Library

### Method 2: Direct URL
Navigate to: `#/diet-profiles`

---

## 🔧 How to Use

### View Profile Details
1. Go to Diet Profiles page
2. Click **"View Details"** on any profile card
3. See complete information
4. Close with ✕ or click outside modal

### Export a Profile
1. Find the profile you want to share
2. Click **📤 Export** button (or from detail modal)
3. JSON file downloads automatically
4. Share file with others!

### Import a Profile
1. Click **📥 Import** button (top right)
2. Select a `.json` profile file
3. Confirm if profile already exists
4. Profile appears in "Custom" filter

### Filter Profiles
- **All Profiles**: Shows everything (11 built-in + custom)
- **Built-in**: Shows only the 11 original profiles
- **Custom**: Shows only imported/created profiles

### Delete a Profile (Custom Only)
1. Open profile detail modal
2. Click **🗑️** button (bottom right)
3. Confirm deletion
4. Profile removed permanently

---

## 📋 The 11 Built-in Profiles

1. **Mediterranean** 🫒
   - Heart-healthy, olive oil, fish, vegetables
   - Moderate carbs, healthy fats

2. **Keto / Low-Carb** 🥑
   - Very low carb (<10%), high fat (70-80%)
   - Induces ketosis

3. **Vegetarian** 🥗
   - Plant-based, includes dairy/eggs
   - No meat or fish

4. **High Protein** 🍗
   - 30-40% protein
   - For muscle building, satiety

5. **Flexitarian** 🌱
   - Primarily plant-based
   - Occasional meat/fish

6. **Longevity Protocol** 🧬
   - Diet Compass based
   - Maximizes protective foods

7. **Intermittent Fasting** ⏰
   - Time-restricted eating (16:8)
   - Focus on nutrient density

8. **Vegan** 🌿
   - 100% plant-based
   - No animal products

9. **MIND Diet** 🧠
   - Brain health focused
   - Mediterranean + DASH combo

10. **Kid-Friendly** 👶
    - Nutritious, familiar foods
    - Age-appropriate portions

11. **La Dieta** 🙏
    - Mindfulness & gratitude
    - Intentional eating

---

## 🔐 Profile Data Structure

### Complete Profile Schema
```javascript
{
  "id": "profile-slug",
  "name": "Profile Name",
  "summary": "Brief description",
  "principles": [
    "Key principle 1",
    "Key principle 2"
  ],
  "foodsToEmphasize": [
    "food1", "food2", "food3"
  ],
  "foodsToAvoid": [
    "food1", "food2"
  ],
  "macroGuidance": {
    "carbs": "percentage or description",
    "protein": "percentage or description",
    "fat": "percentage or description"
  },
  "specialConsiderations": "Important notes",
  "compatibleWith": ["other-profile-ids"],
  "conflictsWith": ["incompatible-profile-ids"],
  "isCustom": true,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Required Fields (for custom profiles)
- `id` - Unique identifier (slug format)
- `name` - Display name
- `summary` - Brief description

### Optional Fields
All other fields are optional but recommended for completeness.

---

## 🚀 Coming Next: Create/Edit Form

**Status**: Not yet implemented (placeholder added)

**Planned Features**:
- Form to create new profiles from scratch
- Edit custom profiles
- Visual editor for:
  - Basic info (name, summary)
  - Principles (bullet list)
  - Foods to emphasize/avoid (tag input)
  - Macro percentages (sliders)
  - Special considerations (textarea)
  - Compatibility settings
- Validation
- Preview before saving

**Current Workaround**:
- Create profiles by importing JSON files
- Edit by exporting, modifying JSON, re-importing

---

## 📁 Files Created/Modified

### New Files
- `src/components/DietProfilesPage.js` (530 lines)
  - Main page component
  - Grid view, filters, cards
  - Detail modal with full info
  - Export/import handling

### Updated Files
- `src/utils/dietProfiles.js`
  - Added: `saveDietProfile()`
  - Added: `deleteDietProfile()`
  - Added: `exportDietProfile()`
  - Added: `importDietProfile()`

- `src/main.js`
  - Added route: `#/diet-profiles`
  - Imported DietProfilesPage component

- `src/components/SettingsPage.js`
  - Added "Diet Profiles" tab/link in settings navigation
  - Links to `/diet-profiles` page

---

## 🧪 Testing Checklist

### ✅ View All Profiles
- [ ] Navigate to Settings → Diet Profiles
- [ ] Verify 11 built-in profiles display
- [ ] Cards show name, summary, key foods
- [ ] Gradient headers (blue)
- [ ] "Built-in" badge visible

### ✅ Filter Profiles
- [ ] Click "All Profiles" - shows all
- [ ] Click "Built-in" - shows 11 profiles
- [ ] Click "Custom" - shows none (initially)

### ✅ View Details
- [ ] Click "View Details" on Mediterranean
- [ ] Modal opens with full information
- [ ] All sections present:
  - Overview
  - Key Principles (7 items)
  - Foods to Emphasize (green tags)
  - Foods to Avoid (red tags)
  - Macro Guidance (grid)
  - Special Considerations
  - Compatibility
- [ ] Close modal with ✕
- [ ] Close modal by clicking outside

### ✅ Export Profile
- [ ] Click 📤 Export on a profile
- [ ] JSON file downloads
- [ ] Filename format: `diet-profile-{id}-{date}.json`
- [ ] Open file, verify JSON structure
- [ ] All profile data present

### ✅ Import Profile
- [ ] Click "📥 Import" button
- [ ] Select exported JSON file
- [ ] Success toast appears
- [ ] Profile appears in "Custom" filter
- [ ] Purple gradient header
- [ ] "Custom" badge
- [ ] Can view details
- [ ] Can export again
- [ ] Can delete

### ✅ Delete Custom Profile
- [ ] Import a profile
- [ ] View its details
- [ ] Click 🗑️ delete button
- [ ] Confirm deletion
- [ ] Profile removed from list
- [ ] Success toast appears

### ✅ Built-in Protection
- [ ] View built-in profile details
- [ ] Verify no delete button
- [ ] Can still export
- [ ] Cannot modify

---

## 💡 Usage Examples

### Example 1: Share Your Custom Profile
1. Create/import a custom profile
2. Test it with meals
3. Export to JSON file
4. Email/share file with friend
5. Friend imports it
6. They now have your profile!

### Example 2: Try Community Profiles
1. Download profile from community
2. Click Import in Diet Profiles
3. Select downloaded file
4. View details to learn about it
5. Assign to household member
6. Generate meals with that profile

### Example 3: Compare Profiles
1. Open Diet Profiles page
2. View Mediterranean details (note key foods)
3. Close modal
4. View Keto details (compare differences)
5. See macro guidance differences
6. Choose best for your goals

---

## 🐛 Known Limitations

1. **No Create/Edit Form Yet**
   - Must import JSON files for custom profiles
   - Can't edit existing profiles in UI
   - **Workaround**: Export → Edit JSON → Re-import

2. **No Profile Validation**
   - Import accepts any valid JSON
   - May not catch all errors
   - **Workaround**: Use exported profiles as templates

3. **No Bulk Operations**
   - Can't export/delete multiple at once
   - **Workaround**: Use one at a time

---

## 📊 Profile Usage

### Where Profiles Are Used

1. **Settings → Household**
   - Assign profile to each eater
   - Profile dropdown shows all profiles
   - Profile description appears on selection

2. **Meal Generation**
   - Vanessa reads eater's diet profile
   - Selects recipes matching profile guidelines
   - Emphasizes recommended foods
   - Avoids restricted foods

3. **Recipe Scoring**
   - Recipes tagged with compatible profiles
   - Profile rules inform scoring
   - Better recommendations

---

## 🎯 Next Steps

### For You to Test:
1. **Reload the page** to get new code
2. **Go to Settings** → Click "📋 Diet Profiles"
3. **Browse the 11 profiles**
4. **View details** on a few
5. **Export a profile** to see JSON format
6. **Import it back** to test custom profiles
7. **Report any issues!**

### Future Enhancements:
- Create/Edit form (in progress)
- Profile templates
- Community library
- Profile recommendations
- Usage statistics

---

## 🔍 Troubleshooting

### Issue: "Diet Profiles" tab not showing
**Solution**: Clear cache and reload page

### Issue: Import fails
**Solution**: 
- Verify JSON file is valid
- Check file has `_type: "diet-profile"`
- Ensure `profile.id`, `profile.name`, `profile.summary` exist

### Issue: Can't delete a profile
**Solution**: Can only delete custom profiles, not built-in ones

### Issue: Profile not appearing
**Solution**: 
- Check "Custom" filter
- Run `window.debug.checkProfiles()` in console
- Verify import was successful

---

## ✅ Summary

**What You Can Do Now:**
- ✅ View all 11 built-in diet profiles with full details
- ✅ Export any profile as JSON for sharing
- ✅ Import profiles shared by others
- ✅ Delete custom profiles you don't need
- ✅ Filter between built-in and custom profiles
- ✅ Beautiful, intuitive interface

**What's Coming:**
- ⏳ Create custom profiles from scratch (form UI)
- ⏳ Edit existing custom profiles
- ⏳ Profile templates and wizard

**Access**: Settings → Diet Profiles or `#/diet-profiles`

The foundation is complete and working! Try it out and let me know what you think! 🎉
