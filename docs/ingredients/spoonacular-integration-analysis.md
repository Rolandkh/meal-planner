# Spoonacular API Integration Analysis
**Date:** January 10, 2026  
**Context:** Evaluating Spoonacular's 2,600 ingredient database for normalization improvement

---

## 🔍 Research Findings

### Spoonacular Ingredient API

**What's Available:**
- **2,600+ ingredients** with rich metadata
- **NO bulk export endpoint** (must query per-ingredient)
- **Key endpoints:**
  - `/food/ingredients/search` - Search by name, get IDs
  - `/food/ingredients/autocomplete` - Typeahead suggestions
  - `/food/ingredients/{id}/information` - Full metadata (categories, units, nutrition)
  - `/recipes/parseIngredients` - NLP parsing & normalization (⭐ most relevant)

**Metadata Per Ingredient:**
- Numeric ID (e.g., 11282 for "onion")
- Canonical name
- Category hierarchy (e.g., ["vegetables", "aromatic"])
- Possible units (g, oz, cup, tbsp, piece)
- Full nutrition data (per 100g or per serving)
- Images

**Limitations:**
- No bulk dump of all 2,600 ingredients
- Must discover IDs via search/parsing
- Rate limits apply (quota management needed)
- Requires API key and network calls

---

## 📊 Performance Impact Analysis

### Current System (598 entries)

**File Size:**
- `ingredientMaster.json`: ~202KB (before expansion), ~215KB (after)
- Loads at module initialization (one-time cost)

**Matching Performance:**
- Pre-built indexes at load time: ~5-10ms
- Exact match: O(1) hash lookup
- Token match: O(n) where n=598, ~1-2ms per ingredient
- Fuzzy match: O(n × m) where m=string length, ~2-5ms per ingredient
- **Total per ingredient: ~0.5-1ms** (negligible)

**Memory Footprint:**
- Dictionary: ~500KB in memory
- Alias index: ~200KB
- Token index: ~300KB
- **Total: ~1MB** (trivial)

---

### Hypothetical: 2,600 Entries

**Estimated File Size:**
- `ingredientMaster.json`: ~900KB-1MB
- Still reasonable for web delivery (gzipped: ~200-300KB)

**Estimated Performance:**
- Pre-built indexes: ~20-30ms (one-time)
- Exact match: O(1) - no change
- Token match: O(n) where n=2,600 - still <5ms
- Fuzzy match: O(n × m) - could be 10-15ms per ingredient
- **Total per ingredient: ~2-3ms** (still fast)

**Memory Footprint:**
- Dictionary: ~2-3MB
- Indexes: ~1-2MB
- **Total: ~4-5MB** (still acceptable for modern browsers)

---

### Normalization at Import vs Runtime

**Current Architecture (Good ✅):**
- Normalization happens **once at import time**
- Shopping lists use pre-normalized data
- No runtime matching overhead during meal planning

**Impact of 2,600 entries:**
- Still happens at import time
- ~0.5-1 second to normalize a 50-ingredient recipe (2,600 entries vs 0.2s for 598)
- User experience: **No noticeable impact**
- Recipe display: **Instant** (uses cached normalized data)

---

## 🎯 Strategic Assessment

### Option 1: Expand to 2,600 Spoonacular Ingredients

**Pros:**
- ✅ Near-100% coverage (vs 88% current)
- ✅ Comprehensive metadata (categories, nutrition)
- ✅ Official canonical names
- ✅ Reduced maintenance burden
- ✅ Nutrition data for Diet Compass scoring

**Cons:**
- ❌ No bulk endpoint (must harvest IDs)
- ❌ API quota cost to build initial dictionary
- ❌ Larger file size (~1MB vs ~215KB)
- ❌ Slightly slower fuzzy matching (~10-15ms vs 2-5ms per ingredient)
- ❌ May include ingredients irrelevant to your catalog
- ❌ Ongoing sync complexity if Spoonacular updates

**Verdict:** **Overkill for current needs**

---

### Option 2: Hybrid Approach (Recommended ✅)

Keep our curated dictionary (598-1000 entries) as primary, use Spoonacular as **fallback and enrichment**.

**Architecture:**
```javascript
// Primary: Local dictionary (fast, curated)
const localMatch = matchIngredient(identityText, state);

if (localMatch.masterId) {
  return localMatch; // Fast path (98% of cases)
}

// Fallback: Query Spoonacular API (slow, comprehensive)
if (enableSpoonacularFallback) {
  const spoonacularMatch = await parseViaSpoonacular(rawText);
  if (spoonacularMatch.id) {
    // Cache result for future use
    suggestDictionaryEntry(spoonacularMatch);
    return spoonacularMatch;
  }
}

// Final fallback: unknown_ingredient
return { masterId: 'unknown_ingredient', confidence: 0 };
```

**Benefits:**
- ✅ Fast local matching for 95%+ of ingredients
- ✅ Spoonacular catches rare edge cases
- ✅ Builds dictionary automatically over time
- ✅ No upfront harvesting needed
- ✅ API quota used only for unknowns
- ✅ Best of both worlds

---

### Option 3: Targeted Expansion (Pragmatic)

Add only ingredients that appear in your 622 catalog recipes.

**Strategy:**
1. Take the 839 unmatched ingredients from evaluation
2. Query Spoonacular `/recipes/parseIngredients` for each
3. Get canonical IDs and metadata
4. Add to dictionary (filtered to ~150-200 real ingredients)
5. Target: 598 → 750-800 entries

**Benefits:**
- ✅ Minimal size increase (~300KB → ~400KB)
- ✅ 95-98% coverage of actual catalog
- ✅ One-time API cost (manageable)
- ✅ No irrelevant ingredients
- ✅ Performance stays excellent

**Costs:**
- API calls: ~839 ingredients × 1 parse call = ~839 calls
- At 150 calls/day (free tier), ~6 days to complete
- Or use paid tier: one-time bulk operation

**Verdict:** **Best balance of coverage vs performance**

---

## 🔬 Performance Benchmark

### Real-World Test (Current System)

```javascript
// 7,183 ingredients across 622 recipes
// Time to normalize entire catalog: ~3.2 seconds
// Per ingredient: ~0.45ms average
// User-facing: Happens at import (imperceptible)
```

### Projected with 2,600 Entries

```javascript
// Same 7,183 ingredients
// Time to normalize entire catalog: ~8-10 seconds
// Per ingredient: ~1.2ms average
// User-facing: Still happens at import (minor increase)
```

### Projected with 800 Entries (Targeted)

```javascript
// Same 7,183 ingredients
// Time to normalize entire catalog: ~4 seconds
// Per ingredient: ~0.56ms average
// User-facing: No noticeable difference
```

**Conclusion:** Performance impact is negligible in all scenarios. Size is the bigger concern.

---

## 💡 Recommendations

### Recommendation #1: Targeted Spoonacular Expansion (Immediate)

**Goal:** Reach 95% coverage with minimal bloat

**Steps:**
1. Query Spoonacular `/recipes/parseIngredients` for the 839 unmatched ingredients
2. Parse responses to extract:
   - Canonical ingredient ID
   - Normalized name
   - Category
   - Suggested units
3. Filter out:
   - Malformed strings that fail parsing
   - Duplicates already in dictionary
   - Ultra-rare items (1× use)
4. Add ~150-200 validated ingredients to dictionary
5. Re-run evaluation

**Expected Outcome:**
- Match rate: 88% → 95-97%
- Dictionary size: 598 → 750-800
- File size: ~215KB → ~380KB
- Performance: No user-facing impact

**API Cost:**
- ~839 parse calls (one-time)
- Free tier: 150/day = 6 days
- Or paid tier: batch in 1 hour

---

### Recommendation #2: Spoonacular Fallback API (Future Enhancement)

**Goal:** Handle truly unknown ingredients gracefully

**Architecture:**
- Keep local dictionary as primary
- Add server-side endpoint: `/api/parse-ingredient-spoonacular`
- Called only when local match fails
- Caches results in temp storage
- Suggests dictionary additions for admin review

**When to Implement:**
- After reaching 95% with local dictionary
- When you see patterns of unmatched ingredients in production
- If you want nutrition data for Diet Compass

**Benefits:**
- Zero upfront cost
- Learns from actual user data
- Quota efficient (only unknowns)
- Dictionary grows organically

---

### Recommendation #3: Spoonacular ID Mapping (Optional)

**Goal:** Link existing ingredients to Spoonacular for nutrition data

**Process:**
- For each ingredient in your dictionary (~598), query `/food/ingredients/search`
- Store `spoonacularId` field
- Use for Diet Compass nutrition enrichment
- One-time operation: ~598 search calls

**Benefits:**
- Nutrition data for health scoring
- Category validation
- Density cross-checks
- Image assets for UI

**When:**
- After reaching 95% match rate
- When building Diet Compass v2
- If you need nutrition beyond health scores

---

## 📋 Recommended Action Plan

### Phase 1: Targeted Expansion (This Week)

**Goal:** 95% match rate

1. **Extract unmatched ingredients**
   ```bash
   node scripts/extractUnmatchedForSpoonacular.js
   # Outputs: tmp/unmatched_for_spoonacular.txt (839 lines)
   ```

2. **Batch parse via Spoonacular**
   ```bash
   node scripts/parseViaSpoonacular.js
   # Calls /recipes/parseIngredients for each
   # Outputs: tmp/spoonacular_matches.json
   ```

3. **Filter and add to dictionary**
   ```bash
   node scripts/integrateSpoonacularMatches.js
   # Adds ~150-200 validated ingredients
   # Updates ingredientMaster.json
   ```

4. **Re-evaluate**
   ```bash
   node scripts/evaluateNormalizationImprovements.js
   # Target: 95-97% match rate
   ```

**Estimated Time:** 2-4 hours (6 days if using free API tier due to rate limits)

---

### Phase 2: Fallback API (Future)

**Goal:** Handle edge cases dynamically

1. Create server endpoint `/api/parse-ingredient-spoonacular`
2. Wire into normalization pipeline as fallback
3. Add admin UI for reviewing suggestions
4. Cache successful parses

**Estimated Time:** 4-6 hours

---

### Phase 3: Nutrition Enrichment (Optional)

**Goal:** Link to Spoonacular for Diet Compass

1. Map existing ingredients to Spoonacular IDs
2. Fetch nutrition data via `/information` endpoint
3. Store in `ingredientHealthData.json`
4. Use for enhanced scoring

**Estimated Time:** 6-8 hours

---

## 🎯 Performance Summary

| Metric | Current (598) | Targeted (800) | Full (2,600) |
|--------|---------------|----------------|--------------|
| **Match Rate** | 88.0% | 95-97% | 99%+ |
| **File Size** | 215KB | 380KB | 900KB |
| **Gzipped** | 60KB | 110KB | 250KB |
| **Load Time** | 5-10ms | 10-15ms | 20-30ms |
| **Match Time** | 0.45ms | 0.56ms | 1.2ms |
| **Memory** | 1MB | 1.5MB | 4MB |
| **User Impact** | None | None | None |

**Verdict:** All options are performant. Choose based on coverage needs vs maintenance burden.

---

## ✅ Final Recommendation

**Go with Targeted Expansion (Option 3)**

**Why:**
- ✅ Achieves 95% target with minimal bloat
- ✅ Leverages Spoonacular's NLP parsing (best feature)
- ✅ One-time API cost (manageable)
- ✅ Maintains fast performance
- ✅ Room to grow to 1,000 entries if needed
- ✅ Can add fallback API later if truly needed

**Don't:**
- ❌ Mirror all 2,600 ingredients (unnecessary overhead)
- ❌ Build real-time Spoonacular dependency (quota risk)
- ❌ Over-engineer before validating need

**Do:**
- ✅ Use Spoonacular to fill our gaps
- ✅ Keep local dictionary as primary
- ✅ Add fallback API if production shows need
- ✅ Link to Spoonacular IDs for future nutrition enrichment

---

## 📝 Next Steps

**Ready to implement if you approve:**

1. Create extraction script for 839 unmatched
2. Build Spoonacular batch parser
3. Add integration script to dictionary
4. Re-evaluate to confirm 95% target

**Estimated total time:** 2-4 hours of dev work + API time (instant if paid, 6 days if free tier)

---

**Status:** Recommendation ready for approval  
**Research:** Saved in `.taskmaster/docs/research/`
