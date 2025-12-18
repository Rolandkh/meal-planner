/**
 * Meal Plan Data
 * Contains all the meal planning data including shopping lists, daily plans, and recipes
 * Enhanced to support both Roland's and Maya's meal plans per spec
 */

// Aisle mapping for Coles Caulfield Village (from spec)
const AISLE_MAP = {
  'Produce': { aisle: 1, section: 'Fresh Produce' },
  'Bakery': { aisle: 2, section: 'Bakery' },
  'Dairy': { aisle: 3, section: 'Dairy & Eggs' },
  'Proteins': { aisle: 4, section: 'Meat & Seafood' },
  'Grains': { aisle: 5, section: 'Pantry' },
  'Pantry': { aisle: 5, section: 'Pantry' },
  'Protein Bars': { aisle: 6, section: 'Health & Wellness' }
};

// Helper to get aisle info
function getAisleInfo(category) {
  return AISLE_MAP[category] || { aisle: 99, section: category };
}

export const MEAL_PLAN_DATA = {
  weekOf: '2025-12-08',
  budget: {
    target: 150,
    estimated: 142.50,
    status: 'under' // 'under', 'over', 'at'
  },
  shopping: [
    {
      cat: 'Protein Bars',
      items: [
        { name: '200g oats', price: 2.50, aisle: 6 },
        { name: '100g walnuts', price: 4.00, aisle: 6 },
        { name: '80g protein powder', price: 25.00, aisle: 6 },
        { name: '30g cacao', price: 5.00, aisle: 6 },
        { name: '200g chocolate', price: 4.50, aisle: 6 },
        { name: '30g coconut oil', price: 8.00, aisle: 5 },
        { name: '2 bananas', price: 1.50, aisle: 1 },
        { name: '260g almond butter', price: 8.50, aisle: 6 },
        { name: '100ml maple syrup', price: 6.00, aisle: 5 }
      ]
    },
    {
      cat: 'Produce',
      items: [
        { name: 'Salad greens (4 bags)', price: 12.00, aisle: 1 },
        { name: 'Tomatoes (2)', price: 3.00, aisle: 1 },
        { name: 'Cucumbers (4)', price: 4.00, aisle: 1 },
        { name: 'Capsicums (4)', price: 6.00, aisle: 1 },
        { name: 'Avocados (3)', price: 4.50, aisle: 1 },
        { name: 'Lemons (5)', price: 2.00, aisle: 1 },
        { name: 'Broccoli', price: 3.50, aisle: 1 },
        { name: 'Spinach', price: 3.00, aisle: 1 },
        { name: 'Kale', price: 3.00, aisle: 1 },
        { name: 'Mushrooms', price: 4.00, aisle: 1 },
        { name: 'Strawberries 250g', price: 4.00, aisle: 1 },
        { name: 'Blueberries 125g', price: 5.00, aisle: 1 },
        { name: 'Carrots', price: 2.50, aisle: 1 }
      ]
    },
    {
      cat: 'Proteins',
      items: [
        { name: 'Salmon 150g', price: 8.00, aisle: 4 },
        { name: 'Sardines (tin)', price: 3.50, aisle: 5 },
        { name: 'Mackerel 120g', price: 4.50, aisle: 4 },
        { name: 'Tuna (tin)', price: 3.00, aisle: 5 },
        { name: 'Firm tofu 400g', price: 4.50, aisle: 3 },
        { name: 'Smoked tofu 200g', price: 5.00, aisle: 3 },
        { name: 'Crumpets 6-pack', price: 3.20, aisle: 2 },
        { name: 'Cheese cubes', price: 4.50, aisle: 3 }
      ]
    },
    {
      cat: 'Grains',
      items: [
        { name: 'Hummus 800g', price: 6.00, aisle: 3 },
        { name: 'Chickpeas (4 tins)', price: 6.00, aisle: 5 },
        { name: 'Quinoa 200g', price: 4.00, aisle: 5 },
        { name: 'Bulgur 100g', price: 2.50, aisle: 5 },
        { name: 'Whole grain bread', price: 4.50, aisle: 2 },
        { name: 'Whole grain wraps', price: 4.00, aisle: 2 },
        { name: 'Pasta (for Maya)', price: 2.50, aisle: 5 },
        { name: 'Crackers', price: 3.50, aisle: 5 }
      ]
    },
    {
      cat: 'Dairy',
      items: [
        { name: 'Greek yogurt 1kg', price: 7.00, aisle: 3 },
        { name: 'Kefir 500ml', price: 5.50, aisle: 3 },
        { name: 'Sauerkraut 500g', price: 4.50, aisle: 3 },
        { name: 'Yogurt pouches (for Maya)', price: 5.00, aisle: 3 }
      ]
    },
    {
      cat: 'Pantry',
      items: [
        { name: 'Lentil soup', price: 4.50, aisle: 5 },
        { name: 'Veg soup', price: 4.50, aisle: 5 },
        { name: 'Plant milk', price: 3.50, aisle: 3 },
        { name: 'Olive oil', price: 8.00, aisle: 5 },
        { name: 'Coconut oil', price: 8.00, aisle: 5 },
        { name: 'Tamari sauce', price: 5.00, aisle: 5 }
      ]
    }
  ],
  days: {
    sunday: {
      name: 'Sunday',
      date: 'Dec 8',
      roland: {
        meals: {
          b: { name: 'Protein bar', time: '8:00 AM' },
          l: { name: 'Hummus Bowl', time: '12:30 PM' },
          d: { name: 'Salmon & Greens', time: '5:30 PM' }
        },
        prep: {
          morning: [
            'Make 12 protein bars (see recipe below)',
            'Wash and dry salad greens',
            'Chop vegetables for week (cucumber, capsicum, carrots)',
            'Cook 150g quinoa for buddha bowl',
            'Cook 100g bulgur for Saturday'
          ],
          evening: []
        },
        recipes: [
          {
            name: 'Protein Bars (Makes 12)',
            ing: [
              '200g rolled oats',
              '100g walnuts, chopped',
              '80g plant protein powder',
              '30g cacao powder',
              '15g maca powder',
              '50g chia seeds',
              '30g oat flour',
              '100g dried blueberries',
              '10g Lion\'s Mane powder',
              '5g Reishi powder',
              '5g turmeric powder',
              '20g ground flaxseed',
              '260g almond butter',
              '100ml maple syrup',
              '2 ripe bananas (200g), mashed',
              '60ml plant milk',
              '5g fresh ginger, grated',
              '200-250g dark chocolate',
              '30-40g coconut oil'
            ],
            steps: [
              'Line 20×20cm tin with parchment',
              'Melt 100-125g chocolate with 15-20g coconut oil',
              'Pour into tin, spread evenly, refrigerate 10 min',
              'Mix all dry ingredients in large bowl',
              'Warm 260g almond butter, 100ml maple syrup, and 60ml plant milk until smooth',
              'Remove from heat, stir in 200g mashed bananas and 5g grated ginger',
              'Pour wet into dry, mix until sticky',
              'Spread over set chocolate, press VERY firmly',
              'Refrigerate 2-3 hours',
              'Melt remaining chocolate with remaining coconut oil',
              'Pour over top, spread evenly, refrigerate 30 min',
              'Cut into 12 bars (warm knife between cuts)',
              'Wrap individually'
            ]
          },
          {
            name: 'Hummus Power Bowl',
            ing: [
              '1 protein bar',
              '150-200g mixed salad greens',
              '150g hummus',
              '50g cooked chickpeas',
              '30g walnuts',
              '30g whole grain crackers',
              '150g Greek yogurt',
              '10g chia seeds',
              '15ml olive oil',
              'Lemon juice'
            ],
            steps: [
              'Arrange 150-200g greens in bowl',
              'Add 150g hummus',
              'Top with 50g chickpeas and 30g walnuts',
              'Serve with 30g crackers',
              'Mix 150g yogurt with 10g chia seeds',
              'Drizzle 15ml olive oil and lemon juice',
              'Eat protein bar alongside'
            ]
          },
          {
            name: 'Salmon & Greens',
            ing: [
              '150g salmon fillet',
              '200g broccoli and green beans',
              '100g mixed salad greens',
              '50g sauerkraut',
              '15ml olive oil',
              'Lemon, herbs, garlic'
            ],
            steps: [
              'Pan-fry or bake 150g salmon with herbs and garlic',
              'Steam 200g broccoli and green beans',
              'Arrange 100g salad greens',
              'Add salmon and vegetables',
              'Serve 50g sauerkraut on side',
              'Drizzle 15ml olive oil and lemon'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: null, // No breakfast on Sunday
          l: { name: 'Pasta with butter + steamed vegetables', time: '12:30 PM' },
          d: { name: 'Salmon (plain portion) + mashed potato + vegetables', time: '5:30 PM' }
        },
        prep: {
          morning: [],
          evening: ['Cook extra salmon for Maya', 'Prepare pasta for lunch']
        }
      }
    },
    monday: {
      name: 'Monday',
      date: 'Dec 9',
      roland: {
        meals: {
          b: { name: 'Protein bar', time: '8:00 AM' },
          l: { name: 'Lentil Soup', time: '12:30 PM' },
          d: { name: 'Sardines Salad', time: '5:30 PM' }
        },
        prep: {
          morning: [],
          evening: []
        },
        recipes: [
          {
            name: 'Lentil Soup',
            ing: [
              '1 protein bar',
              '500ml lentil soup',
              '2 slices whole grain bread (60g)',
              '1 apple'
            ],
            steps: [
              'Heat 500ml lentil soup',
              'Serve with 2 slices (60g) bread',
              'Have 1 apple for dessert',
              'Eat protein bar alongside'
            ]
          },
          {
            name: 'Sardines Salad',
            ing: [
              '125g tinned sardines, drained',
              '250g mixed salad',
              '50g avocado (1/4)',
              '50g cherry tomatoes',
              '15ml olive oil',
              'Lemon, herbs'
            ],
            steps: [
              'Arrange 250g salad on plate',
              'Top with 125g sardines',
              'Add 50g avocado and 50g tomatoes',
              'Drizzle 15ml olive oil and lemon',
              'Garnish with herbs'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: { name: 'Crumpet + strawberries', time: '8:00 AM' },
          l: { name: 'Packed Lunch: Pasta salad, yogurt, berries, crackers', time: '12:30 PM' },
          d: { name: 'Leftover pasta + vegetables', time: '5:30 PM' }
        },
        prep: {
          morning: [
            'Pack Maya\'s lunchbox:',
            '  - Pasta salad in container',
            '  - Yogurt pouch',
            '  - Strawberries/blueberries',
            '  - Crackers'
          ],
          evening: ['Defrost salmon for Tuesday dinner']
        }
      }
    },
    tuesday: {
      name: 'Tuesday',
      date: 'Dec 10',
      roland: {
        meals: {
          b: { name: 'Protein bar', time: '8:00 AM' },
          l: { name: 'Whole Grain Wrap', time: '12:30 PM' },
          d: { name: 'Tofu Scramble', time: '5:30 PM' }
        },
        prep: {
          morning: [],
          evening: []
        },
        recipes: [
          {
            name: 'Whole Grain Wrap',
            ing: [
              '1 protein bar',
              '1 whole grain wrap (60g)',
              '100g hummus',
              '150g raw vegetables',
              '30g tahini',
              '150ml kefir'
            ],
            steps: [
              'Spread 100g hummus on 60g wrap',
              'Add 150g vegetables',
              'Drizzle 30g tahini',
              'Roll up tightly',
              'Serve with 150ml kefir',
              'Eat protein bar alongside'
            ]
          },
          {
            name: 'Tofu Scramble',
            ing: [
              '200g firm tofu, crumbled',
              '150g spinach/kale',
              '100g mushrooms',
              '50g sauerkraut',
              '10ml olive oil',
              'Nutritional yeast, turmeric',
              '100g mixed greens'
            ],
            steps: [
              'Heat 10ml olive oil in pan',
              'Add 200g crumbled tofu with turmeric and black pepper',
              'Cook 100g mushrooms until soft',
              'Add 150g spinach, wilt',
              'Season with nutritional yeast',
              'Serve with 50g sauerkraut and 100g salad'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: { name: 'Crumpet + blueberries', time: '8:00 AM' },
          l: { name: 'Packed Lunch: Sandwich, fruit, yogurt, carrot sticks', time: '12:30 PM' },
          d: { name: 'Cheese quesadilla + carrot sticks + fruit', time: '5:30 PM' }
        },
        prep: {
          morning: [
            'Pack Maya\'s lunchbox:',
            '  - Simple sandwich (cheese/ham)',
            '  - Fruit (strawberries/blueberries)',
            '  - Yogurt pouch',
            '  - Carrot sticks'
          ],
          evening: []
        }
      }
    },
    wednesday: {
      name: 'Wednesday',
      date: 'Dec 11',
      roland: {
        meals: {
          b: { name: 'Protein bar', time: '8:00 AM' },
          l: { name: 'Buddha Bowl', time: '12:30 PM' },
          d: { name: 'Mackerel Stir-Fry', time: '5:30 PM' }
        },
        prep: {
          morning: [],
          evening: []
        },
        recipes: [
          {
            name: 'Buddha Bowl',
            ing: [
              '1 protein bar',
              '100g cooked quinoa',
              '150g roasted vegetables',
              '100g chickpeas',
              '50g hummus',
              '30g seeds',
              '150g Greek yogurt'
            ],
            steps: [
              'Layer 100g quinoa in bowl',
              'Add 150g roasted vegetables',
              'Top with 100g chickpeas',
              'Add 50g hummus and 30g seeds',
              'Serve 150g yogurt on side',
              'Eat protein bar alongside'
            ]
          },
          {
            name: 'Mackerel Stir-Fry',
            ing: [
              '120g smoked mackerel',
              '250g frozen stir-fry vegetables',
              '50g kimchi',
              '10ml coconut oil',
              'Tamari, ginger, garlic'
            ],
            steps: [
              'Heat 10ml coconut oil in wok',
              'Stir-fry 250g vegetables with ginger and garlic',
              'Add 120g mackerel, heat through',
              'Season with tamari',
              'Serve with 50g kimchi'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: { name: 'Crumpet + fruit', time: '8:00 AM' },
          l: { name: 'Hummus + crackers + veg sticks', time: '12:30 PM' },
          d: null // At mum's
        },
        prep: {
          morning: [],
          evening: []
        }
      }
    },
    thursday: {
      name: 'Thursday',
      date: 'Dec 12',
      isFast: true,
      roland: {
        meals: {
          b: { name: 'Protein bar', time: '8:00 AM' },
          l: { name: 'Chickpea Salad EARLY', time: '12:00 PM' },
          d: { name: 'NO DINNER - FAST BEGINS', time: null }
        },
        prep: {
          morning: ['Prepare chickpea salad components'],
          evening: []
        },
        recipes: [
          {
            name: 'Chickpea Salad',
            ing: [
              '1 protein bar',
              '200g canned chickpeas, drained',
              '150g mixed salad greens',
              'Cherry tomatoes, cucumber, onion',
              '30g feta',
              '40g walnuts',
              '15ml olive oil',
              'Lemon, herbs',
              '30g crackers',
              '1 pear'
            ],
            steps: [
              'Arrange 150g greens in bowl',
              'Add 200g drained chickpeas',
              'Top with tomatoes, cucumber, onion',
              'Add 30g feta and 40g walnuts',
              'Drizzle 15ml olive oil and lemon',
              'Serve with 30g crackers and 1 pear',
              'Eat protein bar alongside',
              'EAT EARLY AT 12PM - Last meal before 24hr fast'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: null,
          l: null,
          d: null
        },
        prep: {
          morning: [],
          evening: []
        }
      }
    },
    friday: {
      name: 'Friday',
      date: 'Dec 13',
      isPost: true,
      roland: {
        meals: {
          b: { name: 'Coffee/tea only', time: null },
          l: { name: 'Light meal LATE', time: '1:00 PM' },
          d: { name: 'Salad with Tofu', time: '5:30 PM' }
        },
        prep: {
          morning: [],
          evening: []
        },
        recipes: [
          {
            name: 'Break-Fast Meal',
            ing: [
              '1 protein bar',
              '200g mixed salad greens',
              '75g hummus',
              '15ml olive oil'
            ],
            steps: [
              'Arrange 200g salad greens in bowl',
              'Add 75g hummus',
              'Drizzle 15ml olive oil',
              'Eat protein bar alongside',
              'BREAK FAST AT 1PM - Eat slowly, chew well'
            ]
          },
          {
            name: 'Large Salad with Smoked Tofu',
            ing: [
              '150g smoked tofu',
              '300g mixed salad',
              '100g avocado (1/2)',
              '30g walnuts',
              '15ml olive oil',
              'Tahini dressing',
              '50g sauerkraut'
            ],
            steps: [
              'Arrange 300g mixed salad on large plate',
              'Add 150g smoked tofu (sliced or cubed)',
              'Top with 100g avocado and 30g walnuts',
              'Drizzle 15ml olive oil and tahini',
              'Serve 50g sauerkraut on side',
              'Take your time - gentle after fast'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: null,
          l: null,
          d: null
        },
        prep: {
          morning: [],
          evening: []
        }
      }
    },
    saturday: {
      name: 'Saturday',
      date: 'Dec 14',
      roland: {
        meals: {
          b: { name: 'Protein bar', time: '8:00 AM' },
          l: { name: 'Veg Soup & Grain', time: '12:30 PM' },
          d: { name: 'Tuna Bowl', time: '5:30 PM' }
        },
        prep: {
          morning: ['Reheat pre-cooked bulgur'],
          evening: []
        },
        recipes: [
          {
            name: 'Vegetable Soup & Grain',
            ing: [
              '1 protein bar',
              '400ml vegetable soup',
              '80g cooked bulgur',
              '50g sauerkraut',
              '30g sunflower seeds',
              '1 orange'
            ],
            steps: [
              'Heat 400ml soup',
              'Mix 80g bulgur with 50g sauerkraut in bowl',
              'Top with 30g sunflower seeds',
              'Have 1 orange for dessert',
              'Eat protein bar alongside'
            ]
          },
          {
            name: 'Tuna Bowl',
            ing: [
              '120g tinned tuna',
              '200g mixed raw vegetables',
              '100g leafy greens',
              '30g olives',
              '50g avocado (1/4)',
              'Lemon and herb dressing'
            ],
            steps: [
              'Arrange 100g leafy greens in bowl',
              'Add 200g chopped vegetables',
              'Top with 120g tuna and 30g olives',
              'Add 50g avocado slices',
              'Drizzle with lemon and herb dressing'
            ]
          }
        ]
      },
      maia: {
        meals: {
          b: null,
          l: null,
          d: null
        },
        prep: {
          morning: [],
          evening: []
        }
      }
    }
  }
};

// Week metadata
export const WEEK_INFO = {
  startDate: 'Dec 8',
  endDate: 'Dec 14',
  year: 2025
};

// Day order for display
export const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Budget constants
export const BUDGET_TARGET = 150;
