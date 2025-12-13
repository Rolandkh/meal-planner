/**
 * Meal Plan Transformer
 * Transforms Claude API response to match our app's data structure
 */

import { DAY_ORDER } from '../data/mealPlanData.js';

/**
 * Transform Claude response to MEAL_PLAN_DATA format
 */
export function transformClaudeResponse(claudeResponse) {
  const transformed = {
    weekOf: claudeResponse.week_of || new Date().toISOString().split('T')[0],
    budget: {
      target: claudeResponse.budget_target || 150,
      estimated: claudeResponse.budget_estimate || 0,
      status: (claudeResponse.budget_estimate || 0) <= (claudeResponse.budget_target || 150) ? 'under' : 'over'
    },
    shopping: transformShoppingList(claudeResponse.shopping_list || []),
    days: {}
  };

  // Transform Roland's meals
  DAY_ORDER.forEach(dayKey => {
    const rolandDay = claudeResponse.roland_meals?.[dayKey];
    const maiaDay = claudeResponse.maia_meals?.[dayKey];
    const prepTasks = claudeResponse.prep_tasks?.[dayKey] || {};

    transformed.days[dayKey] = {
      name: getDayName(dayKey),
      date: getDayDate(dayKey, transformed.weekOf),
      isFast: dayKey === 'thursday',
      isPost: dayKey === 'friday',
      roland: {
        meals: {
          b: rolandDay?.breakfast ? {
            name: rolandDay.breakfast.name || 'Protein bar',
            time: rolandDay.breakfast.time || '8:00 AM'
          } : { name: 'Protein bar', time: '8:00 AM' },
          l: rolandDay?.lunch ? {
            name: rolandDay.lunch.name || '',
            time: rolandDay.lunch.time || '12:30 PM'
          } : null,
          d: rolandDay?.dinner ? {
            name: rolandDay.dinner.name || '',
            time: rolandDay.dinner.time || '5:30 PM'
          } : (dayKey === 'thursday' ? { name: 'NO DINNER - FAST BEGINS', time: null } : null)
        },
        prep: {
          morning: prepTasks.roland?.morning || [],
          evening: prepTasks.roland?.evening || []
        },
        recipes: rolandDay?.recipes || []
      },
      maia: {
        meals: {
          b: maiaDay?.breakfast ? {
            name: maiaDay.breakfast.name,
            time: maiaDay.breakfast.time
          } : (shouldHaveMaiaBreakfast(dayKey) ? null : undefined),
          l: maiaDay?.lunch ? {
            name: maiaDay.lunch.name,
            time: maiaDay.lunch.time
          } : (shouldHaveMaiaLunch(dayKey) ? null : undefined),
          d: maiaDay?.dinner ? {
            name: maiaDay.dinner.name,
            time: maiaDay.dinner.time
          } : (dayKey === 'wednesday' ? null : undefined)
        },
        prep: {
          morning: prepTasks.maia?.morning || [],
          evening: prepTasks.maia?.evening || []
        }
      }
    };
  });

  return transformed;
}

/**
 * Transform shopping list to our format
 */
function transformShoppingList(shoppingList) {
  const byCategory = {};

  shoppingList.forEach(item => {
    const category = item.category || 'Pantry';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }

    byCategory[category].push({
      name: item.name || item.item,
      price: item.price || item.estimated_price || 0,
      aisle: item.aisle || getAisleFromCategory(category)
    });
  });

  // Convert to array format
  return Object.entries(byCategory).map(([cat, items]) => ({
    cat,
    items
  }));
}

/**
 * Get aisle number from category
 */
function getAisleFromCategory(category) {
  const map = {
    'Produce': 1,
    'Bakery': 2,
    'Dairy': 3,
    'Proteins': 4,
    'Grains': 5,
    'Pantry': 5,
    'Protein Bars': 6
  };
  return map[category] || 99;
}

/**
 * Get day name from key
 */
function getDayName(dayKey) {
  const names = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday'
  };
  return names[dayKey] || dayKey;
}

/**
 * Get date for a day
 */
function getDayDate(dayKey, weekOf) {
  const date = new Date(weekOf);
  const dayIndex = DAY_ORDER.indexOf(dayKey);
  date.setDate(date.getDate() + dayIndex);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Check if Maia should have breakfast on this day
 */
function shouldHaveMaiaBreakfast(dayKey) {
  return ['monday', 'tuesday', 'wednesday'].includes(dayKey);
}

/**
 * Check if Maia should have lunch on this day
 */
function shouldHaveMaiaLunch(dayKey) {
  return ['sunday', 'monday', 'tuesday', 'wednesday'].includes(dayKey);
}
