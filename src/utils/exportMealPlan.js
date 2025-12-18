/**
 * Export Meal Plan Utility
 * Generates a comprehensive printable meal plan document
 */

import { DAY_ORDER, DAY_NAMES } from '../data/mealPlanData.js';
import { getMealPlanData } from '../data/mealPlanLoader.js';

/**
 * Generate the full meal plan export document
 * @returns {string} Markdown formatted document
 */
export function generateExportDocument() {
  const MEAL_PLAN_DATA = getMealPlanData();
  
  // Get week date range
  const weekOf = MEAL_PLAN_DATA.weekOf || new Date().toISOString().split('T')[0];
  let startDate = new Date(weekOf + 'T00:00:00'); // Ensure proper date parsing
  if (isNaN(startDate.getTime())) {
    // Fallback: use current date and find Sunday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek; // Get Sunday of this week
    startDate = new Date(today);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
  }
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const formatDate = (date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  const formatDateShort = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
  
  const weekRange = `${formatDate(startDate)} - ${formatDate(endDate)}, ${startDate.getFullYear()}`;
  const today = new Date();
  const isToday = (dayKey) => {
    // Week starts from shopping day (Saturday), not Sunday
    const shoppingDay = 6; // Saturday
    const weekOrderFromShoppingDay = [];
    for (let i = 0; i < 7; i++) {
      const dayIdx = (shoppingDay + i) % 7;
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      weekOrderFromShoppingDay.push(dayNames[dayIdx]);
    }
    
    const dayOffset = weekOrderFromShoppingDay.indexOf(dayKey);
    if (dayOffset === -1) return false;
    
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayOffset);
    return dayDate.toDateString() === today.toDateString();
  };
  
  const getDayDate = (dayKey) => {
    // Week starts from shopping day (Saturday), not Sunday
    // So we need to calculate offset based on actual week order
    const shoppingDay = 6; // Saturday
    const weekOrderFromShoppingDay = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = (shoppingDay + i) % 7;
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      weekOrderFromShoppingDay.push(dayNames[dayIndex]);
    }
    
    const dayOffset = weekOrderFromShoppingDay.indexOf(dayKey);
    if (dayOffset === -1) return 'Unknown';
    
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayOffset);
    return formatDateShort(dayDate);
  };
  
  // Build document
  let doc = `# WEEKLY MEAL PLAN & SHOPPING LIST
**Week of ${weekRange}**

---

## THIS WEEK'S MEAL PLAN

`;

  // Day order starting from shopping day (Saturday)
  const WEEK_ORDER = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const WEEK_NAMES = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Daily meal plans - iterate in week order (Saturday first)
  WEEK_ORDER.forEach((dayKey, index) => {
    const day = MEAL_PLAN_DATA.days[dayKey];
    if (!day) return;
    
    const roland = day.roland;
    const maya = day.maya;
    const dayName = WEEK_NAMES[index];
    const dayDate = day.date || getDayDate(dayKey);
    const todayNote = isToday(dayKey) ? ' (Today' + (dayKey === 'sunday' ? ' - Protein Bar Prep Day' : '') + ')' : '';
    
    doc += `### ${dayName.toUpperCase()}, ${dayDate.toUpperCase()}${todayNote}`;
    
    if (day.isFast) {
      doc += ` (FAST DAY)`;
    } else if (day.isPost) {
      doc += ` (POST-FAST DAY)`;
    }
    
    doc += `\n`;
    
    // Roland's meals
    if (roland?.meals) {
      // Breakfast
      if (roland.meals.b && roland.meals.b.name) {
        // Friday special case - coffee only, no breakfast label
        if (dayKey === 'friday' && (roland.meals.b.name.toLowerCase().includes('coffee') || roland.meals.b.name.toLowerCase().includes('tea'))) {
          doc += `- **Coffee only** (no breakfast)\n`;
        } else {
          doc += `- **${roland.meals.b.time || '8:00 AM'} Breakfast:** ${roland.meals.b.name}\n`;
        }
      }
      
      // Lunch
      if (roland.meals.l && roland.meals.l.name) {
        const lunchTime = dayKey === 'thursday' ? '12:00 PM' : (dayKey === 'friday' ? '1:00 PM' : (roland.meals.l.time || '12:30 PM'));
        const lunchNote = dayKey === 'thursday' ? ' (EARLY - LAST MEAL)' : (dayKey === 'friday' ? ' (Break fast - eat slowly)' : ' + 10-min walk');
        doc += `- **${lunchTime} Lunch:** ${roland.meals.l.name}${lunchNote}\n`;
      }
      
      // Dinner
      if (roland.meals.d && roland.meals.d.name) {
        if (dayKey === 'thursday' || roland.meals.d.name.includes('NO DINNER') || roland.meals.d.name.includes('FAST')) {
          doc += `- **NO DINNER - FAST BEGINS**\n`;
          doc += `- **Evening:** Water, black coffee, herbal tea only\n`;
        } else {
          doc += `- **${roland.meals.d.time || '5:30 PM'} Dinner:** ${roland.meals.d.name} + walk\n`;
        }
      }
    }
    
    // Maya's meals - format on separate lines for readability
    if (maya?.meals && (maya.meals.b || maya.meals.l || maya.meals.d)) {
      doc += `- **Maya:**\n`;
      if (maya.meals.b) {
        doc += `  - ${maya.meals.b.time || '8:00 AM'} Breakfast: ${maya.meals.b.name}\n`;
      }
      if (maya.meals.l) {
        const lunchLabel = maya.meals.l.name.includes('Packed') ? 'Packed Lunch' : 'Lunch';
        doc += `  - ${maya.meals.l.time || '12:30 PM'} ${lunchLabel}: ${maya.meals.l.name}\n`;
      }
      if (maya.meals.d) {
        if (dayKey === 'wednesday') {
          doc += `  - Dinner: At mum's\n`;
        } else {
          const sharedNote = maya.meals.d.name && maya.meals.d.name.includes('shared') ? '' : ' (shared with Roland)';
          doc += `  - ${maya.meals.d.time || '5:30 PM'} Dinner: ${maya.meals.d.name}${sharedNote}\n`;
        }
      }
    }
    
    // Today's task - protein bars made on shopping day (Saturday)
    if (dayKey === 'saturday') {
      doc += `- **Prep Task:** Make protein bars (see recipe below)\n`;
    }
    
    doc += `\n`;
  });
  
  // All recipes section
  doc += `---

## RECIPES

`;
  
  // Hardcoded protein bar recipe (always included - saves API tokens)
  doc += `### PROTEIN BAR RECIPE
**Make on Saturday - yields 12 bars**

#### DRY INGREDIENTS:
- [ ] 200g rolled oats
- [ ] 100g walnuts, chopped
- [ ] 80g plant protein powder
- [ ] 30g cacao powder
- [ ] 15g maca powder
- [ ] 50g chia seeds
- [ ] 30g oat flour
- [ ] 100g dried blueberries
- [ ] 10g Lion's Mane powder
- [ ] 5g Reishi powder
- [ ] 5g turmeric powder
- [ ] 20g ground flaxseed

#### WET INGREDIENTS:
- [ ] 260g almond butter
- [ ] 100ml maple syrup
- [ ] 2 ripe bananas (200g), mashed
- [ ] 60ml plant milk
- [ ] 5g fresh ginger, grated

#### CHOCOLATE COATING:
- [ ] 200-250g dark chocolate
- [ ] 30-40g coconut oil

#### METHOD:
1. Line 20×20cm tin with parchment
2. Melt 100-125g chocolate with 15-20g coconut oil
3. Pour into tin, spread evenly, refrigerate 10 min
4. Mix all dry ingredients in large bowl
5. Warm 260g almond butter, 100ml maple syrup, and 60ml plant milk until smooth
6. Remove from heat, stir in 200g mashed bananas and 5g grated ginger
7. Pour wet into dry, mix until sticky
8. Spread over set chocolate, press VERY firmly
9. Refrigerate 2-3 hours
10. Melt remaining chocolate with remaining coconut oil
11. Pour over top, spread evenly, refrigerate 30 min
12. Cut into 12 bars (warm knife between cuts)
13. Wrap individually, store in fridge up to 2 weeks

`;
  
  // Other recipes from all days
  const allRecipes = [];
  DAY_ORDER.forEach(dayKey => {
    const day = MEAL_PLAN_DATA.days[dayKey];
    if (day?.roland?.recipes) {
      day.roland.recipes.forEach(recipe => {
        if (recipe.name && !recipe.name.toLowerCase().includes('protein bar')) {
          allRecipes.push({ ...recipe, day: dayKey, dayName: DAY_NAMES[DAY_ORDER.indexOf(dayKey)] });
        }
      });
    }
  });
  
  if (allRecipes.length > 0) {
    doc += `\n### OTHER MEAL RECIPES\n\n`;
    allRecipes.forEach(recipe => {
      if (!recipe || !recipe.name) return;
      doc += `#### ${recipe.name} (${recipe.dayName})\n\n`;
      if (recipe.ing && Array.isArray(recipe.ing) && recipe.ing.length > 0) {
        doc += `**Ingredients:**\n`;
        recipe.ing.forEach(ing => {
          if (ing) doc += `- ${ing}\n`;
        });
        doc += `\n`;
      }
      if (recipe.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0) {
        doc += `**Steps:**\n`;
        recipe.steps.forEach((step, i) => {
          if (step) doc += `${i + 1}. ${step}\n`;
        });
        doc += `\n`;
      }
      doc += `\n`;
    });
  } else if (!proteinBarRecipe) {
    // If no recipes at all, add a note
    doc += `*Recipes will be included when meal plan is generated with recipe details.*\n\n`;
  }
  
  // Shopping list
  doc += `---

## COMPLETE SHOPPING LIST

`;
  
  // Group shopping items by category
  const shoppingByCategory = {};
  MEAL_PLAN_DATA.shopping.forEach(category => {
    const items = category.items || [];
    // Handle both string items and object items
    const processedItems = items.map(item => {
      if (typeof item === 'string') {
        return { name: item, price: null, aisle: null, quantity: null };
      }
      const name = item.name || item.item || 'Unknown item';
      // If quantity is separate, prepend it to name; otherwise name may already contain quantity
      const quantity = item.quantity;
      const displayName = quantity && !name.includes(quantity) ? `${quantity} ${name}` : name;
      return {
        name: displayName,
        price: item.price || item.estimated_price || null,
        aisle: item.aisle || null,
        quantity: quantity || null
      };
    });
    shoppingByCategory[category.cat] = processedItems;
  });
  
  // Protein bar ingredients section
  if (shoppingByCategory['Protein Bars'] && shoppingByCategory['Protein Bars'].length > 0) {
    doc += `### PROTEIN BAR INGREDIENTS (if not already in pantry)\n`;
    shoppingByCategory['Protein Bars'].forEach(item => {
      const name = item.name || 'Unknown item';
      const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
      doc += `- [ ] ${name}${priceStr}\n`;
    });
    doc += `\n`;
  }
  
  // Fresh Produce
  if (shoppingByCategory['Produce'] && shoppingByCategory['Produce'].length > 0) {
    doc += `### FRESH PRODUCE\n\n`;
    
    const vegetables = [];
    const fruits = [];
    const herbs = [];
    
    shoppingByCategory['Produce'].forEach(item => {
      const name = item.name.toLowerCase();
      if (name.includes('coriander') || name.includes('parsley') || name.includes('basil') || name.includes('ginger') || name.includes('garlic') || name.includes('herb')) {
        herbs.push(item);
      } else if (name.includes('berry') || name.includes('banana') || name.includes('lemon') || name.includes('apple') || name.includes('orange') || name.includes('avocado')) {
        fruits.push(item);
      } else {
        vegetables.push(item);
      }
    });
    
    if (vegetables.length > 0) {
      doc += `#### Vegetables\n`;
      vegetables.forEach(item => {
        const name = item.name || 'Unknown item';
        const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
        doc += `- [ ] ${name}${priceStr}\n`;
      });
      doc += `\n`;
    }
    
    if (fruits.length > 0) {
      doc += `#### Fruits\n`;
      fruits.forEach(item => {
        const name = item.name || 'Unknown item';
        const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
        doc += `- [ ] ${name}${priceStr}\n`;
      });
      doc += `\n`;
    }
    
    if (herbs.length > 0) {
      doc += `#### Herbs\n`;
      herbs.forEach(item => {
        const name = item.name || 'Unknown item';
        const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
        doc += `- [ ] ${name}${priceStr}\n`;
      });
      doc += `\n`;
    }
  }
  
  // Other categories
  const categoryMap = {
    'Proteins': 'PROTEINS',
    'Protein': 'PROTEINS',
    'Dairy': 'DAIRY & FERMENTED FOODS',
    'Grains': 'LEGUMES & GRAINS',
    'Pantry': 'PANTRY ITEMS (check you have these)',
    'Bakery': 'BAKERY & BREAD',
    'Bakery & Bread': 'BAKERY & BREAD',
    'Snacks': 'SNACKS & EXTRAS',
    'Snacks & Extras': 'SNACKS & EXTRAS'
  };
  
  // Process categories in a logical order
  const categoryOrder = ['Proteins', 'Protein', 'Grains', 'Dairy', 'Bakery', 'Bakery & Bread', 'Pantry', 'Snacks', 'Snacks & Extras'];
  const processedCats = new Set();
  
  // First process known categories in order
  categoryOrder.forEach(cat => {
    if (shoppingByCategory[cat] && shoppingByCategory[cat].length > 0 && !processedCats.has(cat)) {
      processedCats.add(cat);
      const items = shoppingByCategory[cat];
      const sectionName = categoryMap[cat] || cat.toUpperCase();
      doc += `### ${sectionName}\n\n`;
      
      // Sub-categorize proteins
      if (cat === 'Proteins' || cat === 'Protein') {
        const fish = items.filter(i => {
          const name = (i.name || '').toLowerCase();
          return name.includes('salmon') || name.includes('sardine') || name.includes('mackerel') || name.includes('tuna') || name.includes('fish') || name.includes('white fish');
        });
        const plant = items.filter(i => {
          const name = (i.name || '').toLowerCase();
          return name.includes('tofu') || name.includes('tempeh');
        });
        const other = items.filter(i => {
          const name = (i.name || '').toLowerCase();
          return !fish.includes(i) && !plant.includes(i);
        });
        
        if (fish.length > 0) {
          doc += `#### Fish (Tinned/Packaged)\n`;
          fish.forEach(item => {
            const name = item.name || 'Unknown item';
            const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
            doc += `- [ ] ${name}${priceStr}\n`;
          });
          doc += `\n`;
        }
        
        if (plant.length > 0) {
          doc += `#### Plant-Based Proteins\n`;
          plant.forEach(item => {
            const name = item.name || 'Unknown item';
            const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
            doc += `- [ ] ${name}${priceStr}\n`;
          });
          doc += `\n`;
        }
        
        if (other.length > 0) {
          other.forEach(item => {
            const name = item.name || 'Unknown item';
            const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
            doc += `- [ ] ${name}${priceStr}\n`;
          });
          doc += `\n`;
        }
      } else {
        items.forEach(item => {
          const name = item.name || 'Unknown item';
          const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
          doc += `- [ ] ${name}${priceStr}\n`;
        });
        doc += `\n`;
      }
    }
  });
  
  // Then process any remaining categories
  Object.keys(shoppingByCategory).forEach(cat => {
    if (cat === 'Produce' || cat === 'Protein Bars' || processedCats.has(cat)) return;
    
    const items = shoppingByCategory[cat];
    if (!items || items.length === 0) return;
    
    const sectionName = categoryMap[cat] || cat.toUpperCase();
    doc += `### ${sectionName}\n\n`;
    items.forEach(item => {
      const name = item.name || 'Unknown item';
      const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
      doc += `- [ ] ${name}${priceStr}\n`;
    });
    doc += `\n`;
  });
  
  // Shopping list by store section
  doc += `---

## SHOPPING LIST BY STORE SECTION

`;
  
  const aisleMap = {
    1: 'PRODUCE SECTION',
    2: 'BAKERY',
    3: 'DAIRY & REFRIGERATED',
    4: 'FISH COUNTER/AISLE',
    5: 'CANNED GOODS / PANTRY',
    6: 'HEALTH FOOD/ORGANIC SECTION',
    7: 'NUTS & DRIED FRUIT',
    8: 'GRAINS/PASTA AISLE',
    9: 'FREEZER SECTION',
    10: 'SOUP AISLE',
    11: 'BREAKFAST/BAKING AISLE',
    12: 'OILS & CONDIMENTS',
    99: 'OTHER ITEMS'
  };
  
  // Category to aisle mapping for fallback
  const categoryToAisle = {
    'Produce': 1,
    'Bakery': 2,
    'Dairy': 3,
    'Proteins': 4,
    'Protein': 4,
    'Grains': 5,
    'Pantry': 5,
    'Protein Bars': 6
  };
  
  const byAisle = {};
  MEAL_PLAN_DATA.shopping.forEach(category => {
    const categoryAisle = categoryToAisle[category.cat] || 99;
    
    (category.items || []).forEach(item => {
      // Handle both string and object items
      const itemObj = typeof item === 'string' 
        ? { name: item, aisle: categoryAisle, price: null }
        : { 
            name: item.name || item.item || 'Unknown item',
            aisle: item.aisle || categoryAisle,
            price: item.price || item.estimated_price || null,
            quantity: item.quantity || null
          };
      
      const aisle = itemObj.aisle || categoryAisle;
      if (!byAisle[aisle]) {
        byAisle[aisle] = [];
      }
      byAisle[aisle].push({ ...itemObj, category: category.cat });
    });
  });
  
  Object.keys(byAisle).sort((a, b) => Number(a) - Number(b)).forEach(aisleNum => {
    const items = byAisle[aisleNum];
    if (!items || items.length === 0) return;
    
    const sectionName = aisleMap[aisleNum] || `AISLE ${aisleNum}`;
    doc += `### ${sectionName}\n`;
    items.forEach(item => {
      const name = item.name || 'Unknown item';
      const priceStr = item.price ? ` - $${item.price.toFixed(2)}` : '';
      doc += `- ${name}${priceStr}\n`;
    });
    doc += `\n`;
  });
  
  // Meal prep checklist
  doc += `---

## MEAL PREP CHECKLIST

`;
  
  WEEK_ORDER.forEach((dayKey, index) => {
    const day = MEAL_PLAN_DATA.days[dayKey];
    if (!day) return;
    
    const dayName = WEEK_NAMES[index];
    const prep = day.roland?.prep || {};
    const hasPrep = (prep.morning && prep.morning.length > 0) || (prep.evening && prep.evening.length > 0);
    
    // Saturday is the main prep day (shopping day)
    if (hasPrep || dayKey === 'saturday') {
      doc += `### ${dayName.toUpperCase()}\n`;
      
      // Always add protein bar task on Saturday
      if (dayKey === 'saturday') {
        doc += `- [ ] Make protein bars (see recipe above)\n`;
      }
      
      if (prep.morning && prep.morning.length > 0) {
        prep.morning.forEach(task => {
          doc += `- [ ] ${task}\n`;
        });
      }
      
      if (prep.evening && prep.evening.length > 0) {
        prep.evening.forEach(task => {
          doc += `- [ ] ${task}\n`;
        });
      }
      
      doc += `\n`;
    }
  });
  
  // Budget summary
  const budget = MEAL_PLAN_DATA.budget || {};
  doc += `---

## BUDGET SUMMARY

**Target:** $${budget.target || 150}
**Estimated:** $${budget.estimated?.toFixed(2) || '0.00'}
**Status:** ${budget.estimated <= budget.target ? '✓ Under budget' : '⚠️ Over budget'}
${budget.estimated ? `**Difference:** $${Math.abs(budget.target - budget.estimated).toFixed(2)}` : ''}

`;
  
  // Notes and reminders
  doc += `---

## NOTES FOR THIS WEEK

### Important Reminders:
1. **Thursday fast begins after lunch** - eat early at 12:00 PM
2. **Friday break fast at 1:00 PM** - eat slowly
3. **No snacking between meals** - only at 8 AM, 12-1 PM, 5-6 PM
4. **10-minute walk after lunch** every day (mandatory)
5. **Nothing after 6 PM** except water, black coffee, herbal tea

### Hydration Goals:
- Drink 2-3L water daily
- Extra water Thursday evening and Friday morning (during fast)

`;
  
  // Weekly success checklist
  doc += `---

## WEEKLY SUCCESS CHECKLIST

- [ ] Saturday: Protein bars made and ready
- [ ] Daily: Ate only during 8 AM - 6 PM window
- [ ] Daily: No snacking between meals
- [ ] Daily: 10-minute walk after lunch
- [ ] Daily: Walked after dinner when possible
- [ ] Daily: Drank 2-3L water
- [ ] Thursday-Friday: Completed 24-hour fast successfully
- [ ] All week: No food after 6 PM

---

*Print this document and check off items as you shop and prep. Keep it on your fridge for easy reference throughout the week!*

`;
  
  return doc;
}

/**
 * Download the meal plan as a file
 */
export function downloadMealPlan() {
  const doc = generateExportDocument();
  const blob = new Blob([doc], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Generate filename with date
  const weekOf = getMealPlanData().weekOf || new Date().toISOString().split('T')[0];
  const date = new Date(weekOf);
  const filename = `meal-plan-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.md`;
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


