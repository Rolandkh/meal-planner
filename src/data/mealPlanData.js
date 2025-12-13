/**
 * Meal Plan Data
 * Contains all the meal planning data including shopping lists, daily plans, and recipes
 */

export const MEAL_PLAN_DATA = {
  shopping: [
    {
      cat: 'Protein Bars',
      items: [
        '200g oats',
        '100g walnuts',
        '80g protein powder',
        '30g cacao',
        '200g chocolate',
        '30g coconut oil',
        '2 bananas',
        '260g almond butter',
        '100ml maple syrup'
      ]
    },
    {
      cat: 'Produce',
      items: [
        'Salad greens (4 bags)',
        'Tomatoes (2)',
        'Cucumbers (4)',
        'Capsicums (4)',
        'Avocados (3)',
        'Lemons (5)',
        'Broccoli',
        'Spinach',
        'Kale',
        'Mushrooms'
      ]
    },
    {
      cat: 'Proteins',
      items: [
        'Salmon 150g',
        'Sardines (tin)',
        'Mackerel 120g',
        'Tuna (tin)',
        'Firm tofu 400g',
        'Smoked tofu 200g'
      ]
    },
    {
      cat: 'Grains',
      items: [
        'Hummus 800g',
        'Chickpeas (4 tins)',
        'Quinoa 200g',
        'Bulgur 100g',
        'Whole grain bread',
        'Whole grain wraps'
      ]
    },
    {
      cat: 'Dairy',
      items: [
        'Greek yogurt 1kg',
        'Kefir 500ml',
        'Sauerkraut 500g'
      ]
    },
    {
      cat: 'Pantry',
      items: [
        'Lentil soup',
        'Veg soup',
        'Plant milk',
        'Olive oil',
        'Coconut oil',
        'Tamari sauce'
      ]
    }
  ],
  days: {
    sunday: {
      name: 'Sunday',
      date: 'Dec 8',
      meals: {
        b: 'Protein bar 8am',
        l: 'Hummus Bowl 12:30pm',
        d: 'Salmon & Greens 5:30pm'
      },
      prep: [
        'Make 12 protein bars (see recipe below)',
        'Wash and dry salad greens',
        'Chop vegetables for week (cucumber, capsicum, carrots)',
        'Cook 150g quinoa for buddha bowl',
        'Cook 100g bulgur for Saturday'
      ],
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
    monday: {
      name: 'Monday',
      date: 'Dec 9',
      meals: {
        b: 'Protein bar 8am',
        l: 'Lentil Soup 12:30pm',
        d: 'Sardines Salad 5:30pm'
      },
      prep: [
        'No prep needed - using pre-made soup'
      ],
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
    tuesday: {
      name: 'Tuesday',
      date: 'Dec 10',
      meals: {
        b: 'Protein bar 8am',
        l: 'Whole Grain Wrap 12:30pm',
        d: 'Tofu Scramble 5:30pm'
      },
      prep: [
        'Assemble wrap - takes 5 minutes'
      ],
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
    wednesday: {
      name: 'Wednesday',
      date: 'Dec 11',
      meals: {
        b: 'Protein bar 8am',
        l: 'Buddha Bowl 12:30pm',
        d: 'Mackerel Stir-Fry 5:30pm'
      },
      prep: [
        'Assemble buddha bowl from prepped ingredients'
      ],
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
    thursday: {
      name: 'Thursday',
      date: 'Dec 12',
      isFast: true,
      meals: {
        b: 'Protein bar 8am',
        l: 'Chickpea Salad EARLY 12pm',
        d: 'NO DINNER - FAST BEGINS'
      },
      prep: [
        'Prepare chickpea salad components in morning'
      ],
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
    friday: {
      name: 'Friday',
      date: 'Dec 13',
      isPost: true,
      meals: {
        b: 'Coffee/tea only',
        l: 'Light meal LATE 1pm',
        d: 'Salad with Tofu 5:30pm'
      },
      prep: [
        'Keep it simple - breaking 24hr fast'
      ],
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
    saturday: {
      name: 'Saturday',
      date: 'Dec 14',
      meals: {
        b: 'Protein bar 8am',
        l: 'Veg Soup & Grain 12:30pm',
        d: 'Tuna Bowl 5:30pm'
      },
      prep: [
        'Reheat pre-cooked bulgur',
        'Shopping list resets today!'
      ],
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
