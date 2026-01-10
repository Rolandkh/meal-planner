# Next Session: Expand Dictionary to 95-98% Coverage

## Current Status
- **Match rate:** 87.5% (6,287/7,183)
- **Dictionary size:** 584 entries
- **Unmatched:** 896 ingredients (887 unique types)

## Goal
- **Target match rate:** 95-98%
- **Target dictionary size:** ~900-1,000 entries
- **Strategy:** Add ALL ingredients with ≥2 occurrences + common singles

## Data Available

### tmp/normalization_diagnostics.json
Contains complete list of unmatched ingredients sorted by frequency:
```json
{
  "unmatchedIngredients": [
    { "identityText": "ingredient", "state": "...", "count": N },
    ...
  ]
}
```

### tmp/catalogUniqueIngredients.json
All 1,825 unique strings sorted by frequency (already loaded)

## Expansion Strategy

### Phase 1: Add Frequent Unmatched (Priority)
1. Load `tmp/normalization_diagnostics.json`
2. Filter to items with count ≥ 2
3. Auto-generate entries (~300-400 ingredients)
4. Expected: 87.5% → 93-95%

### Phase 2: Handle Compounds
1. "salt and pepper" (112×) - split into separate
2. Other "X and Y" patterns
3. Expected: +1-2% coverage

### Phase 3: Add Common Singles
1. Review single-occurrence items
2. Add those that are clearly real ingredients
3. Skip malformed/garbage strings
4. Expected: 95% → 96-98%

### Phase 4: Fallback Handling
For truly unknown ingredients:
- Store as-is without normalization
- Flag for review
- Don't block recipe or shopping list
- Log for dictionary expansion

## Commands for Next Session

```bash
# 1. Build expanded dictionary
node scripts/expandToComprehensiveCoverage.js

# 2. Re-normalize catalog
cp tmp/clean_catalog_backup.json src/data/vanessa_recipe_catalog.json
node scripts/normalizeExistingCatalog.js

# 3. Validate
node scripts/validateNormalizationE2E.js

# 4. Check match rate (should be 95%+)
node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('src/data/vanessa_recipe_catalog.json','utf8')); console.log('Match rate:', c._normalization.stats.matchRate);"
```

## Edge Cases to Handle

1. **Compound ingredients:** "salt and pepper", "oil and vinegar"
2. **Malformed strings:** Empty, concatenated text
3. **Spelling variants:** "portabella" vs "portobello"
4. **Branded items:** "San Marzano tomatoes" → generic

## Success Criteria

- ✅ Match rate ≥ 95%
- ✅ Unmatched count < 350 (5% of 7,183)
- ✅ All recipes have ≥80% ingredients matched
- ✅ System handles unknowns gracefully
- ✅ Shopping lists work for ALL meal plans

## Files Ready for Next Session

All systems operational, just needs dictionary expansion:
- Parser: ✅ Working (loads from dictionary)
- Matcher: ✅ Working (multi-stage)
- Converter: ✅ Working (100% accuracy)
- Pipeline: ✅ Working (idempotent)
- Scripts: ✅ Ready to use
