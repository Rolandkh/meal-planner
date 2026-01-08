# Recipe Page Redesign Features

## Recipe Sources & Access Tiers

### Free Tier
- Search within Vanessa's curated catalog (~5,000 recipes from Spoonacular)
- Access to core recipe database

### Premium Tier
- All free tier features
- Search external recipe databases (millions of recipes)
- Recipes based on current specials/sales at supermarkets
- Smart filtering to avoid suggesting expensive ingredients (when price data available)

### Infrastructure
- Maintain Spoonacular subscription for core catalog maintenance and expansion

---

## Page Organization (Netflix-style Horizontal Scrolling)

### Section 1: "Recommended for You"
Personalized recommendations based on:
- User preferences stated during onboarding
- Behavioral patterns from past meal plans
- Ingredient preferences and cooking history

### Section 2: "Saved Recipes"
- Recipes the user has bookmarked/saved for later
- User-curated collection for future reference

### Section 3: "Cook Again"
- **Definition**: Only recipes from generated meal plans that were actually marked as cooked
- Not just viewed or savedâ€”must have been cooked from a meal plan
- Distinct from "Saved Recipes" section

### Section 4: "On Special" (Premium Feature)
Recipes featuring ingredients currently on sale at local supermarkets:
- Connect to supermarket specials API
- Dynamic suggestions based on what's cheap/in season
- Examples: "Pork roasts are cheap this week" or "Strawberries are in season"

### Section 5+: Category Sections by Dish Type

**Organization Philosophy**: Categorize by dish type, NOT by cuisine/culture
- Avoid cultural labels like "Italian" or "Indian"
- Focus on what the food actually is

**Example Dish Type Categories**:
- Pizza
- Pasta
- Roasts
- Stir-fries
- Curries
- Salads
- Soups
- Bowls
- Casseroles
- Grilled dishes
- etc.

**Sub-categorization within each type**:
- Flavoring profiles (e.g., spicy, mild, tangy)
- Protein sources (e.g., chicken, beef, vegetarian)

---

## Dynamic Personalization & Filtering

### Preference-Based Promotion
Show more of what the user enjoys:
- High consumption patterns â†’ prioritize that ingredient
- Example: User eats lots of chicken â†’ show more chicken dishes prominently
- Example: User eats lots of pumpkin â†’ show more pumpkin dishes

### Active Ingredient Exclusion
Hide recipes containing disliked ingredients:
- User-specified dislikes â†’ completely hide from recommendations
- Example: User says they don't like zucchini â†’ hide all zucchini recipes
- Example: User says they don't like eggplant â†’ hide all eggplant recipes

**Exception**: Only show disliked ingredients if user specifically searches for them

### Learning Mechanism
System should be dynamic and learn from:
- Explicit preferences stated during onboarding
- Behavioral patterns (recipes selected, skipped, or cooked)
- Feedback on generated meal plans

---

## Resolved Questions

### Question 2: Dish Type Categories
Should categories be:
- **Option A**: Predefined fixed list that we create upfront and maintain
- **Option B**: Dynamically generated based on catalog contents and user preferences

**Decision**: Option A - Start with predefined list of most commonly used dish types. Reassess and adjust categories after observing actual usage patterns.

### Question 3: Ingredient Exclusion Method
How should users indicate ingredient dislikes:
- **Option A**: Explicit marking during onboarding conversation
- **Option B**: Learned from behavior (skipping recipes, never selecting certain items)
- **Option C**: Combination of both

**Decision**: Handled through the user profile system maintained by Vanessa.

**Overview**: 
- **Diet Profile**: Generic dietary approach (e.g., Mediterranean diet) - may be shared across users
- **User Profile**: User-specific preferences (e.g., "doesn't like capsicums", "loves roast chicken", "prefers Middle Eastern flavors")
- System updates user profile based on ongoing conversations with Vanessa
- Detailed implementation specified in other documentation

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| "Cook Again" definition | Only recipes from meal plans that were marked as cooked |
| Category organization | By dish type, not by cuisine/culture |
| Premium recipe search | External database access is premium feature |
| Price-based suggestions | Premium feature due to API costs |
| Dish type categories | Predefined fixed list; start with most common types and evolve based on usage |
| Ingredient exclusions | Handled via user profile system maintained through Vanessa conversations |

---

## Implementation Notes

- Netflix-style horizontal scrolling for section layout
- Personalization should feel seamless, not intrusive
- Balance between showing variety and respecting preferences
- Price-based features require supermarket API integration (align with Phase 2 pricing work)
