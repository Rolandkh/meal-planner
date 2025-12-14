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
    const dayIndex = DAY_ORDER.indexOf(dayKey);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayIndex);
    return dayDate.toDateString() === today.toDateString();
  };
  
  const getDayDate = (dayKey) => {
    const dayIndex = DAY_ORDER.indexOf(dayKey);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayIndex);
    return formatDateShort(dayDate);
  };
  
  // Build document
  let doc = `# WEEKLY MEAL PLAN & SHOPPING LIST
**Week of ${weekRange}**

---

## THIS WEEK'S MEAL PLAN

`;

  // Daily meal plans
  DAY_ORDER.forEach((dayKey, index) => {
    const day = MEAL_PLAN_DATA.days[dayKey];
    if (!day) return;
    
    const roland = day.roland;
    const maia = day.maia;
    const dayName = DAY_NAMES[index];
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
      if (roland.meals.b) {
        doc += `- **${roland.meals.b.time || '8:00 AM'} Breakfast:** ${roland.meals.b.name}\n`;
      }
      if (roland.meals.l) {
        doc += `- **${roland.meals.l.time || '12:30 PM'} Lunch:** ${roland.meals.l.name}${dayKey !== 'thursday' ? ' + 10-min walk' : ''}\n`;
      }
      if (roland.meals.d) {
        if (dayKey === 'thursday') {
          doc += `- **NO DINNER - FAST BEGINS**\n`;
          doc += `- **Evening:** Water, black coffee, herbal tea only\n`;
        } else {
          doc += `- **${roland.meals.d.time || '5:30 PM'} Dinner:** ${roland.meals.d.name} + walk\n`;
        }
      }
    }
    
    // Maia's meals
    if (maia?.meals) {
      const maiaMeals = [];
      if (maia.meals.b) maiaMeals.push(`**${maia.meals.b.time || '8:00 AM'} Breakfast:** ${maia.meals.b.name}`);
      if (maia.meals.l) {
        const lunchLabel = maia.meals.l.name.includes('Packed') ? 'Packed Lunch' : 'Lunch';
        maiaMeals.push(`**${maia.meals.l.time || '12:30 PM'} ${lunchLabel}:** ${maia.meals.l.name}`);
      }
      if (maia.meals.d) {
        if (dayKey === 'wednesday') {
          maiaMeals.push(`**Dinner:** At mum's`);
        } else {
          maiaMeals.push(`**${maia.meals.d.time || '5:30 PM'} Dinner:** ${maia.meals.d.name}${maia.meals.d.name.includes('shared') ? '' : ' (shared with Roland)'}`);
        }
      }
      if (maiaMeals.length > 0) {
        doc += `- **Maia:** ${maiaMeals.join(' • ')}\n`;
      }
    }
    
    // Today's tasks
    if (dayKey === 'sunday') {
      doc += `- **Today's Task:** Make protein bars (recipe below)\n`;
    }
    
    doc += `\n`;
  });
  
  // All recipes section
  doc += `---

## RECIPES

`;
  
  // Protein bar recipe (special section)
  const sundayRecipes = MEAL_PLAN_DATA.days?.sunday?.roland?.recipes || [];
  const proteinBarRecipe = sundayRecipes.find(r => r.name && r.name.toLowerCase().includes('protein bar'));
  
  if (proteinBarRecipe) {
    doc += `---

## PROTEIN BAR RECIPE
**Make today (Sunday) - yields 12 bars**

`;
    
    // Separate ingredients into dry and wet if possible
    const dryIngredients = [];
    const wetIngredients = [];
    const chocolateIngredients = [];
    
    proteinBarRecipe.ing.forEach(ing => {
      const ingLower = ing.toLowerCase();
      if (ingLower.includes('chocolate') || ingLower.includes('coconut oil') || ingLower.includes('cacao')) {
        chocolateIngredients.push(ing);
      } else if (ingLower.includes('butter') || ingLower.includes('syrup') || ingLower.includes('banana') || ingLower.includes('milk') || ingLower.includes('ginger')) {
        wetIngredients.push(ing);
      } else {
        dryIngredients.push(ing);
      }
    });
    
    if (dryIngredients.length > 0) {
      doc += `### DRY INGREDIENTS:\n`;
      dryIngredients.forEach(ing => {
        doc += `- [ ] ${ing}\n`;
      });
      doc += `\n`;
    }
    
    if (wetIngredients.length > 0) {
      doc += `### WET INGREDIENTS:\n`;
      wetIngredients.forEach(ing => {
        doc += `- [ ] ${ing}\n`;
      });
      doc += `\n`;
    }
    
    if (chocolateIngredients.length > 0) {
      doc += `### CHOCOLATE LAYERS:\n`;
      chocolateIngredients.forEach(ing => {
        doc += `- [ ] ${ing}\n`;
      });
      doc += `\n`;
    }
    
    if (proteinBarRecipe.steps && proteinBarRecipe.steps.length > 0) {
      doc += `### METHOD:\n`;
      proteinBarRecipe.steps.forEach((step, i) => {
        doc += `${i + 1}. ${step}\n`;
      });
      doc += `\n`;
    }
  }
  
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
    doc += `### OTHER MEAL RECIPES\n\n`;
    allRecipes.forEach(recipe => {
      doc += `#### ${recipe.name} (${recipe.dayName})\n\n`;
      if (recipe.ing && recipe.ing.length > 0) {
        doc += `**Ingredients:**\n`;
        recipe.ing.forEach(ing => {
          doc += `- ${ing}\n`;
        });
        doc += `\n`;
      }
      if (recipe.steps && recipe.steps.length > 0) {
        doc += `**Steps:**\n`;
        recipe.steps.forEach((step, i) => {
          doc += `${i + 1}. ${step}\n`;
        });
        doc += `\n`;
      }
      doc += `\n`;
    });
  }
  
  // Shopping list
  doc += `---

## COMPLETE SHOPPING LIST

`;
  
  // Group shopping items by category
  const shoppingByCategory = {};
  MEAL_PLAN_DATA.shopping.forEach(category => {
    shoppingByCategory[category.cat] = category.items || [];
  });
  
  // Protein bar ingredients section
  if (shoppingByCategory['Protein Bars'] && shoppingByCategory['Protein Bars'].length > 0) {
    doc += `### PROTEIN BAR INGREDIENTS (if not already in pantry)\n`;
    shoppingByCategory['Protein Bars'].forEach(item => {
      doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
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
        doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
      });
      doc += `\n`;
    }
    
    if (fruits.length > 0) {
      doc += `#### Fruits\n`;
      fruits.forEach(item => {
        doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
      });
      doc += `\n`;
    }
    
    if (herbs.length > 0) {
      doc += `#### Herbs\n`;
      herbs.forEach(item => {
        doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
      });
      doc += `\n`;
    }
  }
  
  // Other categories
  const categoryOrder = ['Proteins', 'Legumes & Grains', 'Dairy & Fermented Foods', 'Nuts, Seeds & Healthy Fats', 'Frozen Foods', 'Ready-Made Meals/Soups', 'Pantry Items'];
  const categoryMap = {
    'Proteins': 'PROTEINS',
    'Dairy': 'DAIRY & FERMENTED FOODS',
    'Grains': 'LEGUMES & GRAINS',
    'Pantry': 'PANTRY ITEMS (check you have these)'
  };
  
  Object.keys(shoppingByCategory).forEach(cat => {
    if (cat === 'Produce' || cat === 'Protein Bars') return; // Already handled
    
    const items = shoppingByCategory[cat];
    if (!items || items.length === 0) return;
    
    const sectionName = categoryMap[cat] || cat.toUpperCase();
    doc += `### ${sectionName}\n\n`;
    
    // Sub-categorize proteins
    if (cat === 'Proteins') {
      const fish = items.filter(i => {
        const name = i.name.toLowerCase();
        return name.includes('salmon') || name.includes('sardine') || name.includes('mackerel') || name.includes('tuna') || name.includes('fish');
      });
      const plant = items.filter(i => {
        const name = i.name.toLowerCase();
        return name.includes('tofu') || name.includes('tempeh');
      });
      
      if (fish.length > 0) {
        doc += `#### Fish (Tinned/Packaged)\n`;
        fish.forEach(item => {
          doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
        });
        doc += `\n`;
      }
      
      if (plant.length > 0) {
        doc += `#### Plant-Based Proteins\n`;
        plant.forEach(item => {
          doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
        });
        doc += `\n`;
      }
    } else {
      items.forEach(item => {
        doc += `- [ ] ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
      });
      doc += `\n`;
    }
  });
  
  // Shopping list by store section
  doc += `---

## SHOPPING LIST BY STORE SECTION

`;
  
  const aisleMap = {
    1: 'PRODUCE SECTION',
    2: 'BAKERY',
    3: 'REFRIGERATED SECTION',
    4: 'FISH COUNTER/AISLE',
    5: 'CANNED GOODS',
    6: 'HEALTH FOOD/ORGANIC SECTION',
    7: 'NUTS & DRIED FRUIT',
    8: 'GRAINS/PASTA AISLE',
    9: 'FREEZER SECTION',
    10: 'SOUP AISLE',
    11: 'BREAKFAST/BAKING AISLE',
    12: 'OILS & CONDIMENTS'
  };
  
  const byAisle = {};
  MEAL_PLAN_DATA.shopping.forEach(category => {
    (category.items || []).forEach(item => {
      const aisle = item.aisle || 99;
      if (!byAisle[aisle]) {
        byAisle[aisle] = [];
      }
      byAisle[aisle].push({ ...item, category: category.cat });
    });
  });
  
  Object.keys(byAisle).sort((a, b) => Number(a) - Number(b)).forEach(aisleNum => {
    const items = byAisle[aisleNum];
    const sectionName = aisleMap[aisleNum] || `AISLE ${aisleNum}`;
    doc += `### ${sectionName}\n`;
    items.forEach(item => {
      doc += `- ${item.name}${item.price ? ` - $${item.price.toFixed(2)}` : ''}\n`;
    });
    doc += `\n`;
  });
  
  // Meal prep checklist
  doc += `---

## MEAL PREP CHECKLIST

`;
  
  DAY_ORDER.forEach(dayKey => {
    const day = MEAL_PLAN_DATA.days[dayKey];
    if (!day) return;
    
    const dayName = DAY_NAMES[DAY_ORDER.indexOf(dayKey)];
    const prep = day.roland?.prep || {};
    const hasPrep = (prep.morning && prep.morning.length > 0) || (prep.evening && prep.evening.length > 0);
    
    if (hasPrep || dayKey === 'sunday') {
      doc += `### ${dayName.toUpperCase()}\n`;
      
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
      
      if (!hasPrep && dayKey === 'sunday') {
        doc += `- [ ] Make protein bars\n`;
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

- [ ] Sunday: Protein bars made and ready
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
