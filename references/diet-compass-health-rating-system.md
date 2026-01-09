# Diet Compass Health Rating System
## Implementation Specification for Vanessa Meal Planning App

**Version:** 2.0  
**Created:** January 2026  
**Updated:** January 2026  
**Based on:** "The Diet Compass" by Bas Kast (comprehensive extraction)

---

## Overview

The Diet Compass Health Rating System evaluates recipes across four health dimensions derived from the scientific principles in Bas Kast's book. Each recipe receives a score from 0-100 for each metric, plus an overall composite score.

### The Four Metrics

| Metric | What It Measures | Key Mechanisms |
|--------|------------------|----------------|
| **Nutrient Density** | How much of the recipe consists of protective, health-promoting whole foods | Fiber, vitamins, minerals, antioxidants, omega-3s |
| **Longevity** | How the recipe affects cellular aging pathways | mTOR inhibition, autophagy, IGF-1, inflammation |
| **Weight Loss** | How the recipe affects weight management | Protein-leverage effect, satiety, glycemic response |
| **Heart Health** | How the recipe affects cardiovascular health | Omega-3:6 ratio, blood pressure, cholesterol, inflammation |

### Overall Score Calculation

```
Overall Score = (Nutrient Density × 0.25) + (Longevity × 0.25) + (Weight Loss × 0.25) + (Heart Health × 0.25)
```

### Score Components

Each metric score is calculated from:
1. **Ingredient scores** - Based on what foods are included
2. **Cooking method modifiers** - How the food is prepared
3. **Synergy bonuses** - Beneficial ingredient combinations
4. **Portion considerations** - Amounts and proportions
5. **Score caps** - Hard limits for harmful ingredients

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

## Cooking Method Modifiers

Cooking methods significantly impact the health value of ingredients. Apply these modifiers to the base ingredient scores.

### Beneficial Cooking Methods (+5 to +10 points)

| Method | Effect | Modifier |
|--------|--------|----------|
| **Raw** | Preserves enzymes, heat-sensitive nutrients | +10 (for vegetables/fruits) |
| **Steaming** | Minimal nutrient loss, no added fats | +8 |
| **Light sautéing in olive oil** | EVOO benefits + gentle heat | +5 |
| **Poaching** | Low temp, moist heat, gentle | +5 |
| **Baking (≤180°C)** | Moderate heat, no added fat required | +3 |
| **Fermentation** | Creates probiotics, improves bioavailability | +10 |

### Neutral Cooking Methods (0 points)

| Method | Effect | Modifier |
|--------|--------|----------|
| **Boiling** | Some nutrient loss to water | 0 |
| **Roasting (≤200°C)** | Moderate heat, some browning | 0 |
| **Grilling (moderate)** | Good for fish, vegetables | 0 |
| **Stir-frying (high heat, brief)** | Quick cooking preserves nutrients | 0 |

### Harmful Cooking Methods (-10 to -25 points)

| Method | Effect | Modifier | Book Evidence |
|--------|--------|----------|---------------|
| **Deep frying** | Creates oxidized fats, trans fats, AGEs | -20 | Explicitly harmful |
| **Charring/burning** | Creates AGEs (advanced glycation end products) | -15 | Accelerates aging |
| **High-temp grilling (blackened)** | Heterocyclic amines, PAHs (carcinogens) | -15 | Especially harmful for meat |
| **Smoking (heavy)** | PAHs, preservatives | -10 | Processed meat category |
| **Microwaving in plastic** | Potential endocrine disruptors | -5 | Not specifically in book |

### Cooking Method Examples

| Original Ingredient | Cooking Method | Score Adjustment |
|---------------------|----------------|------------------|
| Salmon fillet | Steamed | +8 |
| Salmon fillet | Pan-fried in olive oil | +5 |
| Salmon fillet | Blackened/charred | -15 |
| Vegetables | Raw salad | +10 |
| Vegetables | Steamed | +8 |
| Vegetables | Roasted with olive oil | +5 |
| Potatoes | Boiled | 0 |
| Potatoes | Deep fried (chips) | -20 |

---

## Synergistic Combinations (Bonus Points)

Certain ingredient combinations enhance health benefits. Apply these bonuses when both ingredients are present.

| Combination | Effect | Bonus |
|-------------|--------|-------|
| **Turmeric + Black pepper** | 2000% increase in curcumin absorption | +15 |
| **Fat + Fat-soluble vitamins** | EVOO/avocado with vegetables (A, D, E, K absorption) | +8 |
| **Fiber + Carbohydrates** | Slows glucose absorption | +5 |
| **Vitamin C + Iron** | Citrus with plant-based iron (legumes, greens) | +8 |
| **Fermented dairy + Prebiotics** | Yogurt with fruit/fiber | +5 |
| **Omega-3 fish + Leafy greens** | Anti-inflammatory synergy | +5 |
| **Legumes + Whole grains** | Complete amino acid profile | +5 |

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

#### TIER 2: HIGHLY PROTECTIVE (+10 to +15 points each)

| Ingredient Category | Examples | Points | Book Evidence |
|---------------------|----------|--------|---------------|
| Leafy greens | Spinach, kale, rocket, swiss chard, lettuce | +15 | Highest vegetable category; nitrates, folate |
| Cruciferous vegetables | Broccoli, cauliflower, brussels sprouts, cabbage | +15 | Cancer-protective compounds |
| Berries | Blueberries, raspberries, strawberries, blackberries | +15 | Highest antioxidant fruits |
| Extra virgin olive oil | Cold-pressed, extra virgin olive oil | +15 | mTOR inhibitor, anti-inflammatory |
| Other vegetables | Tomatoes, capsicum, cucumber, zucchini, carrots, celery | +12 | "Eat real food, mostly plants" |
| Alliums | Garlic, onions, leeks, shallots | +12 | Anti-inflammatory, immune support |
| Avocado | Fresh avocado | +12 | Healthy fats, fiber |
| Eggs | Whole eggs (up to 1/day) | +10 | Rehabilitated in book; neutral to beneficial |
| Other whole fruits | Apples, pears, oranges, grapes, kiwi, pomegranate | +10 | Fiber + nutrients intact |

#### TIER 3: NEUTRAL TO BENEFICIAL (0 to +5 points)

| Ingredient Category | Examples | Points | Notes |
|---------------------|----------|--------|-------|
| Poultry | Chicken, turkey (unprocessed) | +5 | Better than red meat |
| White fish | Cod, barramundi, snapper, flathead | +5 | Good protein, less omega-3 than oily fish |
| Tofu | Plain tofu, silken tofu | +8 | Plant protein, isoflavones |
| Tempeh | Plain tempeh | +10 | Fermented = better than tofu |
| Fresh cheese | Ricotta, cottage cheese | 0 | Non-fermented dairy |
| Milk | Whole or skim milk | -5 | Adults limit to 1-2 glasses/day per book |

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

## Metric 2: Longevity (Anti-Aging)

### What It Measures
How the recipe affects cellular aging mechanisms, particularly:
- **mTOR pathway:** Excess animal protein activates mTOR, accelerating cellular aging
- **IGF-1 levels:** Growth factor associated with aging; stimulated by animal protein, especially milk
- **Autophagy:** Cellular "cleanup" process inhibited by constant eating, supported by certain foods
- **Inflammation:** Chronic inflammation accelerates aging
- **Oxidative stress:** Free radical damage to cells

### The mTOR Balance (Key Book Insight)

mTOR is like a "brake on autophagy." When mTOR is active (fed state, high protein), cells grow but don't clean up. When mTOR is inhibited (fasting, certain foods), autophagy occurs.

**Optimal pattern:** Periodic mTOR inhibition through:
- Time-restricted eating (14+ hour overnight fast)
- Plant-dominant protein sources
- mTOR-inhibiting foods (olive oil, coffee, green tea, turmeric)

### Calculation Method

```
Longevity Score = Base Score (50) + Longevity Bonuses - Aging Penalties
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
- **Protein-leverage effect:** We eat until protein needs are met (~15% of calories)
- **Glycemic response:** Blood sugar impact
- **Insulin sensitivity:** Avoiding insulin spikes
- **Satiety:** How filling the recipe is
- **Thermic effect:** Energy required to digest

### The Protein-Leverage Principle (Key Book Insight)

The Diet Compass explains that animals (including humans) eat until their specific protein need is satisfied. If protein is "diluted" by fats and carbs (as in processed foods), we overeat to meet protein requirements.

**Optimal protein proportion:** ~15% of total calories (60-75g/day for most adults)

| Protein % of Recipe | Effect | Points |
|---------------------|--------|--------|
| 12-18% (optimal) | Satisfies protein-leverage with minimal excess | +15 |
| 18-25% (moderate) | Good satiety, slight mTOR concern long-term | +10 |
| 25-35% (high) | Very satiating, but may accelerate aging if chronic | +5 |
| >35% (excessive) | Short-term weight loss, long-term health concerns | 0 |
| <10% (low) | Poor satiety, leads to overeating | -10 |

### Calculation Method

```
Weight Loss Score = Base Score (50) + Metabolic Bonuses - Metabolic Penalties + Protein-Leverage Bonus
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

### Fermented Foods Weight Loss Bonus

The book specifically notes that yogurt consumption is associated with weight loss, particularly in women. Lactic-acid bacteria appear to influence metabolism.

| Ingredient | Points | Book Evidence |
|------------|--------|---------------|
| Greek yogurt (unsweetened) | +12 | Weight loss in studies, especially women |
| Kefir | +10 | Probiotic benefits, metabolism |
| Sauerkraut/kimchi | +8 | Gut microbiome support |
| Other fermented foods | +5 | General probiotic benefits |

### Processed Food Penalty (Protein Dilution)

The book explains that processed foods are typically "protein-diluted" - low in protein relative to fats and carbs, causing overeating.

| Processing Level | Points | Description |
|------------------|--------|-------------|
| Whole, unprocessed | +10 | Foods in natural state |
| Minimally processed | +5 | Cut, frozen, or simple preparation |
| Processed | -5 | Added salt, sugar, or oil |
| Ultra-processed | -20 | Multiple additives, far from original food |

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

### TIER 1: Always Beneficial (All Metrics) ⭐
| Ingredient | ND | LO | WL | HH | Why |
|------------|----|----|----|----|-----|
| Salmon, sardines, mackerel | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Omega-3, protein, vitamin D |
| Legumes (lentils, chickpeas, beans) | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Fiber, plant protein, slow carbs |
| Walnuts | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Omega-3, anti-inflammatory |
| Chia seeds, flaxseeds | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Omega-3, fiber |
| Extra virgin olive oil | ⬆️ | ⬆️ | ⬆️ | ⬆️ | mTOR inhibitor, monounsaturated |
| Leafy greens | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Nitrates, folate, fiber |
| Berries | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Antioxidants, low GI |
| Fermented dairy (yogurt, kefir) | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Probiotics, weight management |
| Cruciferous vegetables | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Sulforaphane, cancer-protective |

### TIER 2: Generally Beneficial (Most Metrics)
| Ingredient | ND | LO | WL | HH | Notes |
|------------|----|----|----|----|-------|
| Whole grains (oats, quinoa) | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Fiber, B vitamins |
| Other vegetables | ⬆️ | ⬆️ | ⬆️ | ⬆️ | "Eat mostly plants" |
| Other nuts (almonds, etc.) | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Healthy fats, fiber |
| Eggs (up to 1/day) | ⬆️ | ➡️ | ⬆️ | ➡️ | Rehabilitated in book |
| Coffee (black) | ➡️ | ⬆️ | ➡️ | ➡️ | mTOR inhibitor, 3-4 cups OK |
| Green tea | ⬆️ | ⬆️ | ➡️ | ➡️ | EGCG, antioxidants |
| Avocado | ⬆️ | ⬆️ | ⬆️ | ⬆️ | Healthy fats, fiber |
| Dark chocolate (70%+) | ⬆️ | ⬆️ | ➡️ | ⬆️ | Polyphenols |

### Always Harmful (All Metrics) ❌
| Ingredient | ND | LO | WL | HH | Why |
|------------|----|----|----|----|-----|
| Processed meats | ⬇️⬇️ | ⬇️⬇️ | ⬇️ | ⬇️⬇️ | Carcinogens, sodium, nitrates |
| Trans fats | ⬇️⬇️ | ⬇️⬇️ | ⬇️ | ⬇️⬇️ | Worst fat type |
| Deep fried foods | ⬇️ | ⬇️⬇️ | ⬇️ | ⬇️⬇️ | AGEs, oxidized fats |
| Added sugars (>10g) | ⬇️ | ⬇️ | ⬇️⬇️ | ⬇️ | Inflammation, insulin spikes |
| Ultra-processed foods | ⬇️ | ⬇️ | ⬇️⬇️ | ⬇️ | Protein-diluted, additives |
| Soft drinks | ⬇️⬇️ | ⬇️ | ⬇️⬇️ | ⬇️ | Sugar, no nutrients |

### Context-Dependent (Varies by Metric)
| Ingredient | ND | LO | WL | HH | Notes |
|------------|----|----|----|----|-------|
| Red meat | ➡️ | ⬇️⬇️ | ➡️ | ⬇️ | mTOR activator; limit to few times/year |
| Milk | ➡️ | ⬇️ | ➡️ | ➡️ | Adults limit 1-2 glasses/day |
| Poultry | ⬆️ | ➡️ | ⬆️ | ➡️ | Better than red meat |
| White fish | ⬆️ | ➡️ | ⬆️ | ➡️ | Good protein, less omega-3 |
| White potato | ⬆️ | ➡️ | ⬇️ | ➡️ | High GI, but has potassium |
| Cheese (aged) | ⬆️ | ⬆️ | ➡️ | ➡️ | Spermidine (fermented = better) |

**Legend:** ⬆️ Beneficial | ➡️ Neutral | ⬇️ Harmful | ⬇️⬇️ Very Harmful

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

## Appendix C: Simplified Scoring Algorithm

For practical implementation, here's a simplified scoring flow:

### Step 1: Identify All Ingredients
Parse the recipe and categorize each ingredient by:
- Category (legume, oily fish, vegetable, etc.)
- Portion size (garnish, small, medium, large)
- Processing level (whole, minimally processed, processed, ultra-processed)

### Step 2: Identify Cooking Methods
For each ingredient, note how it's prepared:
- Raw, steamed, baked, fried, charred, etc.

### Step 3: Calculate Base Scores
For each metric, start with base score of 50, then:
- Add points for beneficial ingredients
- Subtract points for harmful ingredients
- Apply portion multipliers
- Apply cooking method modifiers

### Step 4: Apply Synergy Bonuses
Check for beneficial combinations:
- Turmeric + black pepper present? +15
- Fat + vegetables present? +8
- Fiber + carbs present? +5

### Step 5: Apply Caps
Check for disqualifying ingredients:
- Processed meat present? Cap all scores at 40-50
- Trans fats present? Cap Heart Health at 30
- No protective foods? Cap Nutrient Density at 40

### Step 6: Calculate Overall Score
```
Overall = (ND × 0.25) + (LO × 0.25) + (WL × 0.25) + (HH × 0.25)
```

### Quick Scoring Heuristics

For rapid mental scoring without calculation:

| Recipe Type | Typical Score Range |
|-------------|---------------------|
| Oily fish + vegetables + olive oil | 85-100 |
| Legume-based + vegetables | 80-95 |
| Whole grain bowl + vegetables | 75-90 |
| Chicken/egg + vegetables | 65-80 |
| Pasta with tomato sauce | 50-65 |
| Fast food / fried foods | 10-40 |
| Processed meat dishes | 0-35 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Jan 2026 | Added cooking methods, synergistic combinations, protein-leverage effect, corrected vegetable classification (Tier 1 not neutral), added fermented food weight loss bonus, enhanced quick reference tables |
| 1.0 | Jan 2026 | Initial specification |

