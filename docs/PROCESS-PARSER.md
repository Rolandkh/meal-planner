# Process Parser - Phase 2.1

**Status:** ✅ Complete  
**Created:** January 11, 2026

---

## Overview

The Process Parser is an AI-powered module that transforms flat recipe instructions into structured process graphs. It uses Claude AI to:

1. Analyze recipe instruction text
2. Identify cooking processes (dice, sauté, boil, etc.)
3. Map processes to our standardized Process Master database
4. Link ingredients to each process
5. Extract timing information
6. Validate the output

---

## Files Created

| File | Purpose |
|------|---------|
| `src/utils/processParser.js` | Core parsing logic and AI integration |
| `scripts/test-process-parser.js` | Test script for validating parser |
| `docs/PROCESS-PARSER.md` | This documentation |

---

## Setup

### 1. Ensure API Key is Set

Add your Anthropic API key to `.env`:

```bash
ANTHROPIC_API_KEY=your_key_here
```

### 2. Verify Dependencies

Already installed in package.json:
- ✅ `@anthropic-ai/sdk` - Claude AI integration
- ✅ `dotenv` - Environment variable loading

---

## Usage

### Testing with Sample Recipes

Test the parser with recipes from the catalog:

```bash
# Test with first recipe (index 0)
node scripts/test-process-parser.js

# Test with specific recipe by index
node scripts/test-process-parser.js 5

# Test with recipe index 10
node scripts/test-process-parser.js 10
```

**Output includes:**
- Extracted instruction steps
- Identified processes for each step
- Ingredients involved in each process
- Duration estimates
- Validation results
- Full JSON saved to `test-output/`

### Using in Code

```javascript
import { parseRecipeProcesses } from './src/utils/processParser.js';
import processMaster from './src/data/processMaster.json' assert { type: 'json' };

const recipe = {
  name: "Spaghetti Carbonara",
  ingredients: [
    { name: "spaghetti", quantity: 400, unit: "g" },
    { name: "eggs", quantity: 4, unit: "" },
    { name: "bacon", quantity: 200, unit: "g" }
  ],
  instructions: "<ol><li>Boil pasta until al dente</li><li>Fry bacon until crispy</li><li>Mix with eggs and serve</li></ol>"
};

const apiKey = process.env.ANTHROPIC_API_KEY;

const result = await parseRecipeProcesses(recipe, processMaster, apiKey);

if (result.success) {
  console.log(result.data.processSteps);
}
```

### Batch Processing

Process multiple recipes:

```javascript
import { batchParseRecipes } from './src/utils/processParser.js';

const results = await batchParseRecipes(
  recipes,            // Array of recipe objects
  processMaster,      // Process Master database
  apiKey,            // Anthropic API key
  {
    batchSize: 1,    // Process one at a time (rate limiting)
    delayMs: 1000,   // 1 second delay between batches
    onProgress: (progress) => {
      console.log(`Batch ${progress.currentBatch}/${progress.totalBatches}`);
    }
  }
);
```

---

## Output Format

### Process Step Structure

```json
{
  "recipeName": "Broccolini Quinoa Pilaf",
  "processSteps": [
    {
      "stepNumber": 1,
      "originalInstruction": "In a large pan with lid heat olive oil over medium high heat...",
      "processes": [
        {
          "processId": "heat",
          "ingredients": ["olive oil"],
          "durationMinutes": 1,
          "notes": "Medium high heat"
        },
        {
          "processId": "saute",
          "ingredients": ["onion"],
          "durationMinutes": 1,
          "notes": "Cook for 1 minute"
        },
        {
          "processId": "saute",
          "ingredients": ["garlic", "onion"],
          "durationMinutes": 3,
          "notes": "Cook until onions are translucent and garlic is fragrant"
        }
      ],
      "outputDescription": "Sautéed aromatics ready for quinoa"
    }
  ],
  "processSummary": {
    "totalProcesses": 12,
    "uniqueProcesses": ["heat", "saute", "boil", "simmer", "mix", "season"],
    "estimatedTotalTime": 30
  }
}
```

---

## Features

### ✅ Implemented

1. **HTML Parsing** - Extracts clean steps from HTML instructions
2. **Process Identification** - Maps instructions to 74 standardized processes
3. **Alias Recognition** - Recognizes process variations (sauté = sautee)
4. **Ingredient Linking** - Associates ingredients with each process
5. **Duration Extraction** - Pulls time information from instructions
6. **Validation** - Checks process IDs against Process Master
7. **Error Suggestions** - Suggests similar processes if ID is invalid
8. **Batch Processing** - Handle multiple recipes with rate limiting

### 🔄 Future Enhancements

- [ ] **Implicit Process Detection** - Infer prep processes not explicitly stated
- [ ] **Equipment Detection** - Identify required equipment from instructions
- [ ] **Temperature Extraction** - Pull oven temps, heat levels
- [ ] **Ingredient State Tracking** - Track ingredient transformations
- [ ] **Component Detection** - Identify reusable intermediate components

---

## Validation

The parser includes automatic validation that checks:

1. ✅ All process IDs exist in Process Master
2. ✅ Process steps array is valid
3. ✅ Each process has ingredients array
4. ✅ Step numbers are sequential
5. ⚠️  Warnings for potential issues (not blocking)

**Example validation output:**
```
✅ All processes are valid!

Stats:
- Total Steps: 7
- Total Processes: 12
- Unique Processes: 6
```

---

## Error Handling

### Invalid Process ID

If Claude returns an invalid process ID, the validator provides suggestions:

```
⚠️  Validation warning:
Step 2, Process 1: Invalid process ID "sautee". 
Did you mean one of: saute, steam, stew?
```

### Missing API Key

```
❌ ANTHROPIC_API_KEY not found in environment
💡 Add your API key to .env file:
   ANTHROPIC_API_KEY=your_key_here
```

### Parse Failure

If JSON parsing fails, the full raw response is returned for debugging:

```json
{
  "success": false,
  "error": "Unexpected token in JSON",
  "rawResponse": "..." 
}
```

---

## Cost Estimation

**Per Recipe:**
- Model: Claude Sonnet 4
- Input tokens: ~2,000-4,000 (depends on recipe complexity)
- Output tokens: ~500-1,500
- Estimated cost: **$0.02-0.06 per recipe**

**For 622 recipes:**
- Estimated total: $12-37
- Time: ~12-30 minutes (with 1s delays)

---

## Testing Results

Test the parser with diverse recipes to ensure robust parsing:

| Recipe Type | Test Index | Expected Processes |
|-------------|------------|-------------------|
| Simple (3-4 steps) | 0 | heat, saute, boil, mix |
| Medium (5-7 steps) | 5 | dice, saute, boil, simmer, season, garnish |
| Complex (8+ steps) | 10 | peel, dice, marinate, sear, braise, reduce, plate |
| Baking | 15 | mix, knead, proof, bake, cool |
| No-cook | 20 | dice, mix, toss, chill |

---

## Next Steps (Phase 2.2)

After successful process parsing, move to **Component Generator**:

1. Take parsed processes
2. Identify intermediate components (e.g., "caramelized onions")
3. Calculate component yields using Process Master yield factors
4. Track material throughput through process chain
5. Generate component library for reuse across recipes

---

## Troubleshooting

### Parser returns empty steps

**Problem:** HTML parsing fails  
**Solution:** Check that `recipe.instructions` contains HTML (not plain text)

### Claude times out

**Problem:** API timeout  
**Solution:** Check network connection, API key validity, Anthropic service status

### Validation warnings about process IDs

**Problem:** Claude using slightly different process names  
**Solution:** This is expected - validation will suggest corrections. Consider adding more aliases to Process Master

### Batch processing is slow

**Problem:** Sequential processing with delays  
**Solution:** This is intentional for API rate limiting. Adjust `delayMs` if you have higher rate limits

---

## Support

For issues or questions:
1. Check validation output for specific warnings
2. Review `test-output/` JSON files for debugging
3. Test with simpler recipes first
4. Verify API key and Process Master data are loaded correctly

---

**Status:** ✅ Ready for Phase 2.2 - Component Generator
