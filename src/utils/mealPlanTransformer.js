/**
 * Meal Plan Transformer
 * Transforms Claude API response to match our app's data structure
 */

import { DAY_ORDER } from '../data/mealPlanData.js';

// Fallback meals for when Claude returns incomplete data
const FALLBACK_LUNCHES = {
  saturday: 'Mediterranean Salad Bowl',
  sunday: 'Hummus Power Bowl',
  monday: 'Lentil Soup with Bread',
  tuesday: 'Whole Grain Wrap with Vegetables',
  wednesday: 'Buddha Bowl with Quinoa',
  thursday: 'Chickpea Salad (Last Meal)',
  friday: 'Light Salad with Hummus'
};

const FALLBACK_DINNERS = {
  saturday: 'Grilled Salmon with Vegetables',
  sunday: 'Tofu Stir-Fry with Greens',
  monday: 'Sardines Salad',
  tuesday: 'Mackerel with Steamed Vegetables',
  wednesday: 'Baked White Fish with Salad',
  thursday: null, // Fast day - no dinner
  friday: 'Large Salad with Smoked Tofu'
};

/**
 * Transform Claude response to MEAL_PLAN_DATA format
 */
export function transformClaudeResponse(claudeResponse) {
  // Debug: log the raw response structure
  console.log('Raw Claude response keys:', Object.keys(claudeResponse));
  console.log('roland_meals days:', claudeResponse.roland_meals ? Object.keys(claudeResponse.roland_meals) : 'missing');
  
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

    // Debug: log what we received for each day
    if (!rolandDay?.lunch?.name || !rolandDay?.dinner?.name) {
      console.warn(`Day ${dayKey} missing meals:`, {
        hasLunch: !!rolandDay?.lunch?.name,
        hasDinner: !!rolandDay?.dinner?.name,
        rolandDay
      });
    }

    // Determine lunch with fallback
    let lunchMeal = null;
    if (rolandDay?.lunch?.name && rolandDay.lunch.name !== '...' && rolandDay.lunch.name.length > 2) {
      lunchMeal = {
        name: rolandDay.lunch.name,
        time: rolandDay.lunch.time || (dayKey === 'thursday' ? '12:00 PM' : dayKey === 'friday' ? '1:00 PM' : '12:30 PM')
      };
    } else if (FALLBACK_LUNCHES[dayKey]) {
      lunchMeal = {
        name: FALLBACK_LUNCHES[dayKey],
        time: dayKey === 'thursday' ? '12:00 PM' : dayKey === 'friday' ? '1:00 PM' : '12:30 PM'
      };
    }

    // Determine dinner with fallback
    let dinnerMeal = null;
    if (dayKey === 'thursday') {
      dinnerMeal = { name: 'NO DINNER - FAST BEGINS', time: null };
    } else if (rolandDay?.dinner?.name && rolandDay.dinner.name !== '...' && rolandDay.dinner.name.length > 2) {
      dinnerMeal = {
        name: rolandDay.dinner.name,
        time: rolandDay.dinner.time || '5:30 PM'
      };
    } else if (FALLBACK_DINNERS[dayKey]) {
      dinnerMeal = {
        name: FALLBACK_DINNERS[dayKey],
        time: '5:30 PM'
      };
    }

    transformed.days[dayKey] = {
      name: getDayName(dayKey),
      date: getDayDate(dayKey, transformed.weekOf),
      isFast: dayKey === 'thursday',
      isPost: dayKey === 'friday',
      roland: {
        meals: {
          b: {
            name: rolandDay?.breakfast?.name || (dayKey === 'friday' ? 'Coffee/tea only' : 'Protein bar'),
            time: rolandDay?.breakfast?.time || (dayKey === 'friday' ? null : '8:00 AM')
          },
          l: lunchMeal,
          d: dinnerMeal
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
          } : (shouldHaveMayaBreakfast(dayKey) ? { name: 'Crumpet with fruit', time: '8:00 AM' } : undefined),
          l: maiaDay?.lunch ? {
            name: maiaDay.lunch.name,
            time: maiaDay.lunch.time
          } : (shouldHaveMayaLunch(dayKey) ? { name: 'Packed lunch', time: '12:30 PM' } : undefined),
          d: maiaDay?.dinner ? {
            name: maiaDay.dinner.name,
            time: maiaDay.dinner.time
          } : (shouldHaveMayaDinner(dayKey) ? { name: 'Shared dinner with Roland', time: '5:30 PM' } : undefined)
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
 * Handles both flat array format and nested structure with items arrays
 */
function transformShoppingList(shoppingList) {
  const byCategory = {};

  shoppingList.forEach(item => {
    // Handle nested structure: {category: "...", items: [{name: "...", ...}]}
    if (item.items && Array.isArray(item.items)) {
      const category = item.category || 'Pantry';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      
      item.items.forEach(subItem => {
        byCategory[category].push({
          name: subItem.name || subItem.item || 'Unknown item',
          price: subItem.price || subItem.estimated_price || 0,
          aisle: subItem.aisle || getAisleFromCategory(category)
        });
      });
    } else {
      // Handle flat structure: {item: "...", category: "...", ...}
      const category = item.category || 'Pantry';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }

      byCategory[category].push({
        name: item.name || item.item || 'Unknown item',
        price: item.price || item.estimated_price || 0,
        aisle: item.aisle || getAisleFromCategory(category)
      });
    }
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
 * The week_of date is the shopping day (Saturday by default)
 * So we need to calculate days relative to Saturday start, not Sunday
 */
function getDayDate(dayKey, weekOf, shoppingDay = 6) {
  const date = new Date(weekOf + 'T12:00:00'); // Use noon to avoid timezone issues
  
  // Week order starting from shopping day (Saturday = 6)
  // Saturday (day 0), Sunday (day 1), Monday (day 2), etc.
  const weekOrderFromShoppingDay = [];
  for (let i = 0; i < 7; i++) {
    const dayIndex = (shoppingDay + i) % 7;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    weekOrderFromShoppingDay.push(dayNames[dayIndex]);
  }
  
  const dayOffset = weekOrderFromShoppingDay.indexOf(dayKey);
  if (dayOffset === -1) return 'Unknown';
  
  date.setDate(date.getDate() + dayOffset);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Check if Maya should have breakfast on this day
 */
function shouldHaveMayaBreakfast(dayKey) {
  return ['monday', 'tuesday', 'wednesday'].includes(dayKey);
}

/**
 * Check if Maya should have lunch on this day
 */
function shouldHaveMayaLunch(dayKey) {
  return ['sunday', 'monday', 'tuesday', 'wednesday'].includes(dayKey);
}

/**
 * Check if Maya should have dinner on this day
 */
function shouldHaveMayaDinner(dayKey) {
  // Sunday-Tuesday dinner with Roland, Wednesday at mum's (no dinner needed), Thu-Sat not with Roland
  return ['sunday', 'monday', 'tuesday'].includes(dayKey);
}
