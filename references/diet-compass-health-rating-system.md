# Diet Compass Health Rating System
## Implementation Specification for Vanessa Meal Planning App

**Version:** 1.0  
**Created:** January 2026  
**Based on:** "The Diet Compass" by Bas Kast

---

## Overview

The Diet Compass Health Rating System evaluates recipes across four health dimensions derived from the scientific principles in Bas Kast's book. Each recipe receives a score from 0-100 for each metric, plus an overall composite score.

### The Four Metrics

| Metric | What It Measures |
|--------|------------------|
| **Nutrient Density** | How much of the recipe consists of protective, health-promoting whole foods |
| **Anti-Aging** | How the recipe affects cellular aging pathways (mTOR, autophagy, inflammation) |
| **Weight Loss** | How the recipe affects blood sugar, insulin response, and satiety |
| **Heart Health** | How the recipe affects cardiovascular health and inflammation |

### Overall Score Calculation

```
Overall Score = (Nutrient Density × 0.30) + (Anti-Aging × 0.25) + (Weight Loss × 0.25) + (Heart Health × 0.20)
```

---

## Score Interpretation

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 90-100 | Excellent | Optimal alignment with Diet Compass principles |
| 75-89 | Good | Strong health profile with minor areas for improvement |
| 60-74 | Moderate | Acceptable but could be improved |
| 40-59 | Poor | Contains problematic ingredients; occasional consumption only |
| 0-39 | Avoid | Conflicts with Diet Compass principles |

---

## Metric 1: Nutrient Density

### What It Measures
The proportion of the recipe that consists of foods classified as "protective" in The Diet Compass — foods consistently shown across studies to promote health and prevent disease.

### Calculation Method

```
Nutrient Density Score = Base Score (50) + Protective Bonuses - Harmful Penalties
```

### Ingredient Classifications

#### TIER 1: HIGHLY PROTECTIVE (+15 to +20 points each, max contribution 60)

| Ingredient Category | Examples | Points |
|---------------------|----------|--------|
| Legumes | Lentils, chickpeas, black beans, kidney beans, cannellini beans, edamame | +20 |
| Nuts | Walnuts, almonds, pistachios, hazelnuts, macadamias, pecans | +18 |
| Seeds | Chia seeds, flaxseeds, hemp seeds, pumpkin seeds, sunflower seeds | +18 |
| Whole grains | Oats, quinoa, brown rice, bulgur, farro, barley, buckwheat | +18 |
| Fatty fish | Salmon, sardines, mackerel, herring, trout, anchovies | +20 |
| Fermented dairy | Greek yogurt, kefir, aged cheese (parmesan, cheddar, gouda) | +15 |
| Dark chocolate | 70%+ cacao dark chocolate, cacao powder, cacao nibs | +15 |

#### TIER 2: PROTECTIVE (+8 to +12 points each, max contribution 40)

| Ingredient Category | Examples | Points |
|---------------------|----------|--------|
| Berries | Blueberries, raspberries, strawberries, blackberries | +12 |
| Other whole fruits | Apples, pears, oranges, grapes, kiwi, pomegranate | +10 |
| Leafy greens | Spinach, kale, rocket, swiss chard, lettuce varieties | +10 |
| Cruciferous vegetables | Broccoli, cauliflower, brussels sprouts, cabbage | +10 |
| Alliums | Garlic, onions, leeks, shallots | +8 |
| Extra virgin olive oil | Cold-pressed, extra virgin olive oil | +12 |
| Avocado | Fresh avocado | +10 |

#### TIER 3: NEUTRAL (0 points)

| Ingredient Category | Examples | Points |
|---------------------|----------|--------|
| Other vegetables | Tomatoes, capsicum, cucumber, zucchini, carrots, celery | 0 |
| Eggs | Whole eggs | 0 |
| Poultry | Chicken, turkey (unprocessed) | 0 |
| White fish | Cod, barramundi, snapper, flathead | 0 |
| Non-fermented dairy | Milk, cream, fresh cheese (ricotta, cottage) | 0 |
| Tofu | Plain tofu, silken tofu | 0 |
| Tempeh | Plain tempeh | +5 (fermented) |

#### TIER 4: HARMFUL (-10 to -25 points each)

| Ingredient Category | Examples | Points |
|---------------------|----------|--------|
| Red meat | Beef, lamb, pork | -15 |
| Processed meat | Bacon, sausages, ham, salami, hot dogs, deli meats | -25 |
| Refined grains | White bread, white rice, white pasta, white flour | -10 |
| Added sugars | Sugar, honey, maple syrup, agave (>1 tbsp per serve) | -15 |
| Ultra-processed foods | Chips, crackers, packaged snacks, instant noodles | -20 |
| Deep fried foods | Any deep-fried ingredient | -15 |
| Sugary drinks | Fruit juice, soft drinks, sweetened beverages | -20 |

### Portion-Based Adjustments

The score should reflect whether protective foods are present in meaningful quantities:

| Portion Size | Multiplier |
|--------------|------------|
| Trace/garnish (<10g) | × 0.25 |
| Small (10-30g) | × 0.5 |
| Medium (30-100g) | × 1.0 |
| Large (>100g) | × 1.25 |

### Score Caps and Floors

- **Maximum score:** 100
- **Minimum score:** 0
- **If recipe contains processed meat:** Maximum capped at 50
- **If recipe contains no protective foods:** Maximum capped at 40

---

## Metric 2: Anti-Aging

### What It Measures
How the recipe affects cellular aging mechanisms, particularly:
- **mTOR pathway:** Excess animal protein activates mTOR, accelerating cellular aging
- **Autophagy:** Cellular "cleanup" process inhibited by constant eating, supported by certain foods
- **Inflammation:** Chronic inflammation accelerates aging
- **Oxidative stress:** Free radical damage to cells

### Calculation Method

```
Anti-Aging Score = Base Score (50) + Longevity Bonuses - Aging Penalties
```

### Ingredient Classifications

#### mTOR INHIBITORS & AUTOPHAGY PROMOTERS (+10 to +20 points)

| Ingredient | Mechanism | Points |
|------------|-----------|--------|
| Extra virgin olive oil | Contains oleocanthal, inhibits mTOR | +15 |
| Green tea | EGCG promotes autophagy | +12 |
| Coffee | Polyphenols support autophagy | +10 |
| Turmeric/curcumin | Potent mTOR inhibitor | +15 |
| Resveratrol sources (grapes, berries) | Activates sirtuins | +10 |
| Spermidine-rich foods | Promotes autophagy | +12 |
| — Aged cheese (parmesan, cheddar) | High spermidine | +12 |
| — Mushrooms | Moderate spermidine | +10 |
| — Legumes | Moderate spermidine | +10 |
| — Whole grains | Moderate spermidine | +8 |

#### ANTI-INFLAMMATORY INGREDIENTS (+8 to +15 points)

| Ingredient | Points |
|------------|--------|
| Omega-3 rich fish (salmon, sardines, mackerel) | +15 |
| Chia seeds | +12 |
| Flaxseeds | +12 |
| Walnuts | +12 |
| Ginger | +10 |
| Turmeric + black pepper combination | +18 |
| Berries (all types) | +10 |
| Leafy greens | +8 |
| Extra virgin olive oil | +10 |

#### ANTIOXIDANT-RICH INGREDIENTS (+5 to +12 points)

| Ingredient | Points |
|------------|--------|
| Dark chocolate (70%+) | +12 |
| Berries | +12 |
| Green tea | +10 |
| Colorful vegetables (capsicum, tomatoes, carrots) | +8 |
| Herbs (oregano, rosemary, thyme) | +8 |
| Spices (cinnamon, cloves) | +6 |
| Citrus fruits | +6 |

#### mTOR ACTIVATORS & PRO-AGING INGREDIENTS (-10 to -25 points)

| Ingredient | Mechanism | Points |
|------------|-----------|--------|
| Red meat | High leucine activates mTOR strongly | -20 |
| Processed meat | mTOR + carcinogens + inflammation | -25 |
| Excessive dairy protein (>200ml milk) | IGF-1 and mTOR activation | -10 |
| High animal protein (>40g per serve) | Excess mTOR stimulation | -15 |
| Added sugars | Inflammation, glycation | -15 |
| Refined carbohydrates | Inflammation, insulin spikes | -10 |
| Trans fats | Severe inflammation | -25 |
| Deep fried foods | Oxidative compounds, inflammation | -15 |
| Charred/burnt meat | Advanced glycation end products (AGEs) | -15 |

### Protein Source Quality Modifier

| Protein Source | Modifier |
|----------------|----------|
| Plant proteins only (legumes, tofu, tempeh) | +15 |
| Fish as primary protein | +10 |
| Mixed plant + fish | +12 |
| Poultry as primary protein | 0 |
| Eggs as primary protein | 0 |
| Red meat present | -15 |
| Processed meat present | -25 |

### Score Caps

- **If recipe contains processed meat:** Maximum capped at 40
- **If recipe contains red meat:** Maximum capped at 55
- **If no anti-inflammatory ingredients present:** Maximum capped at 60

---

## Metric 3: Weight Loss

### What It Measures
How the recipe affects metabolic health and weight management:
- **Glycemic response:** Blood sugar impact
- **Insulin sensitivity:** Avoiding insulin spikes
- **Satiety:** How filling the recipe is
- **Thermic effect:** Energy required to digest

### Calculation Method

```
Weight Loss Score = Base Score (50) + Metabolic Bonuses - Metabolic Penalties
```

### Glycemic Impact Classifications

#### LOW GLYCEMIC INGREDIENTS (+8 to +15 points)

| Ingredient | Glycemic Index | Points |
|------------|----------------|--------|
| Legumes (lentils, chickpeas, beans) | GI 20-35 | +15 |
| Non-starchy vegetables | GI <20 | +12 |
| Nuts and seeds | GI <20 | +12 |
| Berries | GI 25-40 | +10 |
| Whole intact grains (steel-cut oats, quinoa, bulgur) | GI 40-55 | +10 |
| Most whole fruits | GI 35-55 | +8 |
| Greek yogurt (unsweetened) | GI 11 | +10 |

#### MODERATE GLYCEMIC INGREDIENTS (0 points)

| Ingredient | Glycemic Index | Points |
|------------|----------------|--------|
| Brown rice | GI 50-60 | 0 |
| Whole grain bread | GI 50-65 | 0 |
| Sweet potato | GI 55-65 | 0 |
| Banana (ripe) | GI 55-65 | 0 |

#### HIGH GLYCEMIC INGREDIENTS (-10 to -20 points)

| Ingredient | Glycemic Index | Points |
|------------|----------------|--------|
| White potato | GI 80-95 | -15 |
| White rice | GI 70-85 | -12 |
| White bread | GI 70-80 | -15 |
| White pasta | GI 65-75 | -10 |
| Refined cereals | GI 70-90 | -15 |
| Fruit juice | GI 50-70 (no fiber) | -15 |
| Added sugars | GI 65-100 | -20 |

### Satiety Factors

#### HIGH SATIETY (+8 to +15 points)

| Factor | Examples | Points |
|--------|----------|--------|
| High fiber (>5g per serve) | Legumes, vegetables, whole grains | +15 |
| Adequate protein (15-25g per serve) | Fish, legumes, eggs, poultry | +12 |
| Healthy fats | Olive oil, avocado, nuts | +10 |
| High water content vegetables | Cucumber, tomatoes, leafy greens | +8 |
| Whole fruits (with fiber) | Apple, pear, berries | +8 |

#### LOW SATIETY (-8 to -15 points)

| Factor | Examples | Points |
|--------|----------|--------|
| Low fiber (<2g per serve) | Refined grains, processed foods | -10 |
| Liquid calories | Juices, smoothies (vs whole food) | -12 |
| Highly processed | Packaged snacks, ready meals | -15 |
| Added sugars | Creates hunger rebound | -15 |

### Insulin Sensitivity Support

| Ingredient/Factor | Points |
|-------------------|--------|
| Cinnamon | +8 |
| Apple cider vinegar | +8 |
| Fiber-rich foods | +10 |
| Legumes | +12 |
| Chromium sources (broccoli, whole grains) | +5 |

### Score Caps

- **If added sugars exceed 10g per serve:** Maximum capped at 50
- **If refined carbs are primary carb source:** Maximum capped at 55
- **If no fiber present:** Maximum capped at 45

---

## Metric 4: Heart Health

### What It Measures
How the recipe affects cardiovascular health:
- **Omega-3 fatty acids:** Anti-inflammatory, protective
- **Omega-6/Omega-3 ratio:** Modern diets too high in omega-6
- **Healthy vs harmful fats:** Type of fat matters more than amount
- **Cholesterol management:** Fiber, plant sterols
- **Blood pressure:** Potassium, sodium balance

### Calculation Method

```
Heart Health Score = Base Score (50) + Cardio Bonuses - Cardio Penalties
```

### Omega-3 Rich Ingredients (+12 to +20 points)

| Ingredient | Omega-3 Content | Points |
|------------|-----------------|--------|
| Salmon (100g) | 2.0-2.5g | +20 |
| Sardines (100g) | 1.5-2.0g | +20 |
| Mackerel (100g) | 2.5-3.0g | +20 |
| Herring (100g) | 1.5-2.0g | +18 |
| Anchovies (30g) | 0.5-1.0g | +15 |
| Chia seeds (15g) | 2.5g ALA | +15 |
| Flaxseeds (15g) | 3.0g ALA | +15 |
| Walnuts (30g) | 2.5g ALA | +15 |
| Hemp seeds (30g) | 1.0g | +12 |

### Healthy Fat Sources (+8 to +15 points)

| Ingredient | Type | Points |
|------------|------|--------|
| Extra virgin olive oil | Monounsaturated | +15 |
| Avocado | Monounsaturated | +12 |
| Almonds | Monounsaturated | +10 |
| Macadamia nuts | Monounsaturated | +10 |
| Tahini | Mixed healthy fats | +8 |

### Cholesterol-Friendly Ingredients (+5 to +12 points)

| Ingredient | Mechanism | Points |
|------------|-----------|--------|
| Oats | Beta-glucan binds cholesterol | +12 |
| Legumes | Soluble fiber | +12 |
| Nuts | Plant sterols | +10 |
| Psyllium/fiber supplements | Soluble fiber | +10 |
| Soy products (tofu, tempeh, edamame) | Isoflavones | +8 |
| Apples, citrus | Pectin fiber | +8 |

### Blood Pressure Support (+5 to +10 points)

| Ingredient | Mechanism | Points |
|------------|-----------|--------|
| Leafy greens | High potassium, nitrates | +10 |
| Banana | High potassium | +8 |
| Beetroot | Nitrates | +10 |
| Potatoes (with skin) | High potassium | +5 |
| Legumes | Potassium, magnesium | +8 |
| Low sodium preparation | <400mg sodium per serve | +10 |

### Harmful to Heart Health (-10 to -30 points)

| Ingredient | Mechanism | Points |
|------------|-----------|--------|
| Trans fats (partially hydrogenated oils) | Worst fat for heart | -30 |
| Processed meat | Sodium, nitrates, saturated fat | -25 |
| Deep fried foods | Oxidized fats, trans fats | -20 |
| Excessive saturated fat (>15g per serve) | LDL cholesterol | -15 |
| High sodium (>800mg per serve) | Blood pressure | -15 |
| Added sugars | Triglycerides, inflammation | -12 |
| Refined carbohydrates | Triglycerides | -10 |
| Excessive omega-6 oils (sunflower, corn, soybean) | Inflammation imbalance | -10 |
| Red meat | Saturated fat, TMAO | -12 |

### Omega Ratio Consideration

| Estimated Omega-6:Omega-3 Ratio | Modifier |
|--------------------------------|----------|
| <4:1 (optimal) | +15 |
| 4:1 to 10:1 (acceptable) | 0 |
| 10:1 to 20:1 (poor) | -10 |
| >20:1 (harmful) | -20 |

### Score Caps

- **If trans fats present:** Maximum capped at 30
- **If processed meat present:** Maximum capped at 40
- **If sodium >1000mg per serve:** Maximum capped at 50
- **If no omega-3 sources present:** Maximum capped at 70

---

## Implementation Guide

### Step-by-Step Scoring Process

1. **Parse recipe ingredients** into standardized categories
2. **Calculate base score** (50) for each metric
3. **Apply bonuses** for each beneficial ingredient present
4. **Apply penalties** for each harmful ingredient present
5. **Apply portion multipliers** where relevant
6. **Apply score caps** based on presence of particularly harmful ingredients
7. **Calculate overall score** using weighted formula
8. **Round to nearest whole number**

### Data Structure for Ingredients Database

```javascript
{
  "ingredient_id": "salmon_fresh",
  "name": "Salmon (fresh fillet)",
  "category": "fatty_fish",
  "scores": {
    "nutrient_density": {
      "base_points": 20,
      "tier": 1
    },
    "anti_aging": {
      "base_points": 15,
      "tags": ["omega3", "anti_inflammatory"]
    },
    "weight_loss": {
      "base_points": 12,
      "satiety": "high",
      "glycemic_impact": "none"
    },
    "heart_health": {
      "base_points": 20,
      "omega3_content_per_100g": 2.2,
      "tags": ["omega3_rich"]
    }
  },
  "flags": {
    "is_processed": false,
    "is_red_meat": false,
    "is_processed_meat": false,
    "contains_trans_fat": false
  }
}
```

### Recipe Score Output Structure

```javascript
{
  "recipe_id": "salmon_quinoa_bowl",
  "recipe_name": "Salmon & Quinoa Buddha Bowl",
  "scores": {
    "overall": 88,
    "nutrient_density": 92,
    "anti_aging": 85,
    "weight_loss": 82,
    "heart_health": 94
  },
  "score_breakdown": {
    "nutrient_density": {
      "base": 50,
      "bonuses": [
        {"ingredient": "salmon", "points": 20},
        {"ingredient": "quinoa", "points": 18},
        {"ingredient": "spinach", "points": 10},
        {"ingredient": "olive_oil", "points": 12}
      ],
      "penalties": [],
      "caps_applied": [],
      "final": 92
    }
    // ... other metrics
  },
  "rating": "Excellent",
  "highlights": [
    "Rich in omega-3 fatty acids",
    "High in protective whole grains",
    "Excellent anti-inflammatory profile"
  ],
  "improvement_suggestions": []
}
```

---

## Display Guidelines

### Visual Representation

```
╔═══════════════════════════════════════════╗
║  DIET COMPASS SCORE                       ║
║  ════════════════════                     ║
║           88 / 100                        ║
║          ⭐ Excellent                      ║
╠═══════════════════════════════════════════╣
║                                           ║
║  🥗 Nutrient Density  ████████████░░ 92   ║
║  ⏳ Anti-Aging        ██████████░░░░ 85   ║
║  ⚖️ Weight Loss       █████████░░░░░ 82   ║
║  ❤️ Heart Health      █████████████░ 94   ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### Color Coding

| Score Range | Color | Hex |
|-------------|-------|-----|
| 90-100 | Deep Green | #22c55e |
| 75-89 | Light Green | #84cc16 |
| 60-74 | Yellow | #eab308 |
| 40-59 | Orange | #f97316 |
| 0-39 | Red | #ef4444 |

### Score Bar Visualization

- 10 segments total
- Fill segments proportionally (score ÷ 10, rounded)
- Use metric-appropriate colors or universal color coding

---

## Example Calculations

### Example 1: Salmon & Quinoa Buddha Bowl

**Ingredients:**
- 150g salmon fillet
- 100g quinoa (cooked)
- 100g spinach
- 50g cherry tomatoes
- 30g walnuts
- 15ml extra virgin olive oil
- Lemon juice, garlic

**Nutrient Density Calculation:**
```
Base: 50
+ Salmon (fatty fish, Tier 1): +20
+ Quinoa (whole grain, Tier 1): +18
+ Walnuts (nuts, Tier 1): +18
+ Spinach (leafy greens, Tier 2): +10
+ Olive oil (EVOO, Tier 2): +12
+ Tomatoes (neutral): 0
+ Garlic (alliums, Tier 2): +8
= 136 → Capped at 100

Final Nutrient Density Score: 100
```

**Anti-Aging Calculation:**
```
Base: 50
+ Salmon (omega-3, anti-inflammatory): +15
+ Olive oil (mTOR inhibitor): +15
+ Walnuts (omega-3, anti-inflammatory): +12
+ Spinach (antioxidant): +8
+ Garlic (antioxidant): +6
+ Protein source quality (fish primary): +10
= 116 → Capped at 100

Final Anti-Aging Score: 100
```

**Weight Loss Calculation:**
```
Base: 50
+ Quinoa (low GI): +10
+ Spinach (high satiety, low cal): +12
+ Salmon (protein satiety): +12
+ Walnuts (healthy fat satiety): +10
+ High fiber estimate: +10
= 104 → Capped at 100

Final Weight Loss Score: 100
```

**Heart Health Calculation:**
```
Base: 50
+ Salmon (omega-3 rich): +20
+ Walnuts (omega-3, plant sterols): +15
+ Olive oil (monounsaturated): +15
+ Spinach (potassium, nitrates): +10
+ Low sodium preparation: +10
+ Excellent omega ratio: +15
= 135 → Capped at 100

Final Heart Health Score: 100
```

**Overall Score:**
```
(100 × 0.30) + (100 × 0.25) + (100 × 0.25) + (100 × 0.20)
= 30 + 25 + 25 + 20 = 100

Overall: 100 (Excellent)
```

---

### Example 2: Bacon Cheeseburger with Fries

**Ingredients:**
- 150g beef patty
- 2 strips bacon (30g)
- 60g white bread bun
- 30g cheddar cheese
- 150g deep-fried potato fries
- 15ml vegetable oil (for frying)
- Lettuce, tomato, onion (garnish)

**Nutrient Density Calculation:**
```
Base: 50
+ Tomato (neutral): 0
+ Onion (alliums, Tier 2): +8 × 0.25 (garnish) = +2
- Beef (red meat): -15
- Bacon (processed meat): -25
- White bread (refined grain): -10
- Deep fried potatoes: -15
= 50 + 2 - 15 - 25 - 10 - 15 = -13 → Floor at 0
Cap: Contains processed meat → Max 50

Final Nutrient Density Score: 0
```

**Anti-Aging Calculation:**
```
Base: 50
- Beef (mTOR activator, high animal protein): -20
- Bacon (mTOR, carcinogens): -25
- Deep fried (oxidative compounds): -15
- Refined carbs (inflammation): -10
+ Protein source quality (processed meat present): -25
= 50 - 20 - 25 - 15 - 10 - 25 = -45 → Floor at 0
Cap: Contains processed meat → Max 40

Final Anti-Aging Score: 0
```

**Weight Loss Calculation:**
```
Base: 50
- White bread (high GI): -15
- Deep fried potatoes (high GI): -15
- Added fats (low satiety fried): -10
- Low fiber: -10
= 50 - 15 - 15 - 10 - 10 = 0

Final Weight Loss Score: 0
```

**Heart Health Calculation:**
```
Base: 50
- Bacon (processed meat, sodium): -25
- Beef (saturated fat): -12
- Deep fried (oxidized fats): -20
- High saturated fat total: -15
- High sodium estimate: -15
= 50 - 25 - 12 - 20 - 15 - 15 = -37 → Floor at 0
Cap: Contains processed meat → Max 40

Final Heart Health Score: 0
```

**Overall Score:**
```
(0 × 0.30) + (0 × 0.25) + (0 × 0.25) + (0 × 0.20)
= 0

Overall: 0 (Avoid)
```

---

## Appendix A: Quick Reference Ingredient List

### Always Beneficial (All Metrics)
- Salmon, sardines, mackerel
- Legumes (lentils, chickpeas, beans)
- Nuts (especially walnuts)
- Seeds (chia, flax)
- Extra virgin olive oil
- Leafy greens
- Berries
- Whole grains (oats, quinoa)

### Always Harmful (All Metrics)
- Processed meats (bacon, sausage, deli meats)
- Trans fats
- Deep fried foods
- Added sugars (excessive)
- Ultra-processed foods

### Context-Dependent
- Red meat: Harmful for Anti-Aging and Heart Health; neutral for Weight Loss
- Dairy: Fermented = beneficial; milk = neutral to slightly negative
- Eggs: Generally neutral across all metrics
- Poultry: Neutral across all metrics
- White potato: Only harmful for Weight Loss (GI)
- Coffee/tea: Beneficial for Anti-Aging; neutral for others

---

## Appendix B: Implementation Checklist

- [ ] Create ingredients database with scoring attributes
- [ ] Build score calculation engine
- [ ] Implement cap/floor logic
- [ ] Create visual score display component
- [ ] Add score breakdown tooltip/detail view
- [ ] Generate "highlights" text from high-scoring ingredients
- [ ] Generate "improvement suggestions" from penalties applied
- [ ] Test with diverse recipe examples
- [ ] Validate against manually scored recipes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial specification |

