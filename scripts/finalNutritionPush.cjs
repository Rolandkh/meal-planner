/**
 * Final Nutrition Push - Comprehensive Fallbacks
 * Maps all remaining specific varieties to generic equivalents
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

// Comprehensive fallback mappings for ALL remaining varieties
const COMPREHENSIVE_NUTRITION_FALLBACKS = {
  // Prepared foods → similar items
  'tomato_puree': 'tomato_paste',
  'falafel': 'chickpeas',
  'tabbouleh': 'bulgur',
  
  // Vegetables - specific varieties
  'silverbeet': 'spinach',  // Swiss chard
  'beetroot_bunch': 'beetroot',
  'beetroot_loose': 'beetroot',
  'squash_button': 'squash',
  'peas_in_pod': 'peas',
  'broad_beans_fresh': 'beans',
  'artichoke_globe': 'artichoke',
  
  // Fruits - citrus varieties
  'orange_valencia': 'orange',
  'grapefruit_pink': 'grapefruit',
  'grapefruit_white': 'grapefruit',
  
  // Fruits - stone fruit varieties
  'peach_white': 'peach',
  'peach_yellow': 'peach',
  
  // Fruits - apple varieties (all → generic apple)
  'apple_royal_gala': 'apple',
  'apple_jazz': 'apple',
  'apple_kanzi': 'apple',
  
  // Fruits - pear varieties
  'pear_williams': 'pear',
  'pear_packham': 'pear',
  'pear_beurre_bosc': 'pear',
  'pear_corella': 'pear',
  
  // Fruits - banana varieties  
  'banana_lady_finger': 'banana',
  
  // Fruits - other
  'kiwifruit_gold': 'kiwifruit',
  'coconut_fresh': 'coconut',
  'fig_fresh': 'fig',
  
  // Grapes
  'grapes_black': 'grapes',
  
  // Herbs - fresh
  'parsley_curly': 'parsley',
  'oregano_fresh': 'oregano',
  'lemongrass': 'ginger',  // Similar aromatic
  'kaffir_lime_leaves': 'lime',
  'vietnamese_mint': 'mint',
  'thai_basil': 'basil',
  'curry_leaves': 'basil',
  
  // Meat - specific cuts (all same meat type)
  'beef_steak_rump': 'beef',
  'beef_steak_sirloin': 'beef',
  'beef_steak_scotch_fillet': 'beef',
  'beef_steak_eye_fillet': 'beef',
  'beef_steak_t_bone': 'beef',
  'beef_steak_skirt': 'beef',
  'beef_roast_topside': 'beef',
  'beef_roast_silverside': 'beef',
  'beef_roast_blade': 'beef',
  'beef_roast_chuck': 'beef',
  'beef_brisket': 'beef',
  'beef_stir_fry_strips': 'beef_mince',
  'beef_diced': 'beef_mince',
  'beef_corned': 'beef',
  'beef_osso_bucco': 'beef',
  'beef_cheeks': 'beef',
  'beef_oxtail': 'beef',
  
  // Lamb cuts
  'lamb_chops_loin': 'lamb',
  'lamb_chops_forequarter': 'lamb',
  'lamb_cutlets': 'lamb',
  'lamb_leg_bone_in': 'lamb',
  'lamb_leg_boneless': 'lamb',
  'lamb_leg_butterflied': 'lamb',
  'lamb_shoulder_bone_in': 'lamb',
  'lamb_shoulder_boneless': 'lamb',
  'lamb_rack': 'lamb',
  'lamb_backstrap': 'lamb',
  'lamb_diced': 'lamb_mince',
  'lamb_neck': 'lamb',
  
  // Pork cuts
  'pork_chops_loin': 'pork',
  'pork_chops_forequarter': 'pork',
  'pork_roast_leg': 'pork',
  'pork_roast_shoulder': 'pork',
  'pork_roast_loin': 'pork',
  'pork_belly_sliced': 'pork_belly',
  'pork_steaks_leg': 'pork',
  'pork_steaks_loin': 'pork',
  'pork_steaks_scotch': 'pork',
  'pork_ribs_spare': 'pork',
  'pork_ribs_baby_back': 'pork',
  'pork_diced': 'pork_mince',
  
  // Chicken cuts
  'chicken_breast_skin_on_bone_in': 'chicken_breast',
  'chicken_breast_skinless_boneless': 'chicken_breast',
  'chicken_thigh_skin_on_bone_in': 'chicken_thigh',
  'chicken_thigh_skinless_boneless': 'chicken_thigh',
  'chicken_wings_nibbles': 'chicken_wings',
  'chicken_tenderloin': 'chicken_breast',
  'chicken_lovely_legs': 'chicken_drumsticks',
  'chicken_bbq_rotisserie': 'chicken_whole',
  
  // Turkey & Duck
  'turkey_breast_steaks': 'turkey',
  'turkey_whole_bird': 'turkey',
  'duck_whole_bird': 'duck',
  'duck_legs': 'duck_breast',
  
  // Processed meats
  'bacon_middle': 'bacon',
  'bacon_streaky': 'bacon',
  'bacon_short_cut': 'bacon',
  'bacon_smoked': 'bacon',
  'ham_leg': 'ham',
  'ham_shoulder': 'ham',
  'ham_sliced_deli': 'ham',
  'sausages_beef': 'sausage',
  'sausages_pork': 'sausage',
  'sausages_chicken': 'sausage',
  'sausages_lamb': 'sausage',
  'sausages_italian': 'sausage',
  'sausages_cumberland': 'sausage',
  'sausages_chipolata': 'sausage',
  'hot_dogs': 'sausage',
  
  // Seafood
  'salmon_portions': 'salmon',
  'salmon_whole_side': 'salmon',
  'barramundi_fillets': 'fish_fillets',
  'flathead_fillets': 'fish_fillets',
  'tuna_steaks': 'tuna',
  'swordfish_steaks': 'fish_fillets',
  'sardines_fresh': 'sardines',
  'trout': 'salmon',  // Similar fish
  'tuna_canned_flavoured': 'canned_tuna',
  'salmon_canned_pink': 'salmon',
  'salmon_canned_red': 'salmon',
  'anchovies_canned': 'anchovies',
  'mackerel_canned': 'mackerel',
  'smoked_salmon_cold': 'salmon',
  'smoked_salmon_hot': 'salmon',
  'smoked_trout': 'salmon',
  
  // Shellfish
  'prawns_green_raw': 'shrimp',
  'prawns_cooked': 'shrimp',
  'prawns_king': 'shrimp',
  'prawns_tiger': 'shrimp',
  'prawns_banana': 'shrimp',
  'calamari_tubes': 'calamari',
  'calamari_rings': 'calamari',
  'crab_blue_swimmer': 'crab_meat',
  'crab_mud': 'crab_meat',
  'lobster': 'shrimp',  // Similar shellfish
  
  // Dairy - specific types
  'milk_reduced_fat': 'milk',
  'milk_skim': 'milk',
  'milk_lactose_free': 'milk',
  'milk_a2': 'milk',
  'milk_uht': 'milk',
  'soy_milk_original': 'soy_milk',
  'soy_milk_unsweetened': 'soy_milk',
  'oat_milk': 'almond_milk',  // Similar plant milk
  'coconut_milk_beverage': 'coconut_milk',
  'rice_milk': 'almond_milk',
  'macadamia_milk': 'almond_milk',
  
  // Cream
  'thickened_cream': 'cream',
  'pure_cream': 'cream',
  'double_cream': 'cream',
  'creme_fraiche': 'sour_cream',
  
  // Cheese - specific types
  'cheddar_mild': 'cheddar',
  'cheddar_tasty': 'cheddar',
  'cheddar_vintage': 'cheddar',
  'cheddar_extra_sharp': 'cheddar',
  'pecorino_romano': 'parmesan',
  'gruyere': 'swiss_cheese',
  'gouda': 'cheese',
  'edam': 'cheese',
  'colby': 'cheddar',
  'blue_cheese': 'cheese',
  'gorgonzola': 'blue_cheese',
  'stilton': 'blue_cheese',
  'roquefort': 'blue_cheese',
  'brie': 'camembert',
  'havarti': 'cheese',
  'provolone': 'mozzarella',
  'emmental': 'swiss_cheese',
  'manchego': 'cheese',
  'jarlsberg': 'swiss_cheese',
  
  // Butter
  'butter_unsalted': 'butter',
  'butter_spreadable': 'butter',
  'butter_cultured': 'butter',
  
  // Yogurt
  'yoghurt_natural_full_fat': 'yogurt',
  'yoghurt_natural_low_fat': 'yogurt',
  'yoghurt_flavoured': 'yogurt',
  'coconut_yoghurt': 'yogurt',
  'soy_yoghurt': 'yogurt',
  
  // Eggs
  'chicken_eggs_cage': 'eggs',
  'chicken_eggs_barn': 'eggs',
  'chicken_eggs_free_range': 'eggs',
  'chicken_eggs_organic': 'eggs',
  'duck_eggs': 'eggs',
  'quail_eggs': 'eggs',
  
  // Tofu
  'tofu_silken': 'tofu',
  'tofu_smoked': 'tofu',
  'tofu_fried': 'tofu',
  
  // Rice varieties
  'rice_white_long_grain': 'rice',
  'rice_white_medium_grain': 'rice',
  'rice_white_short_grain': 'rice',
  'rice_jasmine': 'rice',
  'rice_basmati': 'rice',
  'rice_arborio': 'rice',
  'rice_sushi': 'rice',
  'rice_wild': 'rice',
  'rice_black': 'rice',
  
  // Pasta
  'penne': 'pasta',
  'fettuccine': 'pasta',
  'linguine': 'pasta',
  'rigatoni': 'pasta',
  'fusilli': 'pasta',
  'farfalle': 'pasta',
  'lasagne_sheets': 'pasta',
  'cannelloni_tubes': 'pasta',
  
  // Fresh pasta
  'pasta_fresh_sheets': 'pasta',
  'ravioli_fresh': 'pasta',
  'gnocchi_fresh': 'pasta',
  
  // Asian noodles
  'rice_noodles_flat': 'rice_noodle',
  'rice_vermicelli': 'rice_noodle',
  'egg_noodles': 'pasta',
  'hokkien_noodles': 'egg_noodle',
  'udon_noodles': 'rice_noodle',
  'soba_noodles': 'pasta',
  'ramen_noodles': 'egg_noodle',
  'rice_paper': 'rice',
  'glass_noodles': 'rice_noodle',
  
  // Oats & grains
  'oats_quick': 'oats',
  'oats_steel_cut': 'oats',
  'quinoa_red': 'quinoa',
  'quinoa_black': 'quinoa',
  'quinoa_tricolour': 'quinoa',
  'couscous_israeli': 'couscous',
  'bulgur_wheat': 'bulgur',
  'barley_pearl': 'barley',
  'freekeh': 'bulgur',
  'semolina': 'flour',
  'buckwheat': 'oats',
  
  // Cereals
  'muesli': 'oats',
  'granola': 'oats',
  'wheat_biscuits': 'oats',
  'cornflakes': 'corn',
  'bran_flakes': 'oats',
  
  // Bread
  'bread_white_sliced': 'bread',
  'bread_wholemeal_sliced': 'bread',
  'bread_multigrain_sliced': 'bread',
  'bread_sourdough_loaf': 'bread',
  'baguette': 'bread',
  'ciabatta': 'bread',
  'turkish_bread': 'bread',
  'wraps_flour': 'tortilla',
  'wraps_corn': 'tortilla',
  'wraps_wholemeal': 'tortilla',
  'flatbread': 'bread',
  'crumpets': 'bread',
  'english_muffins': 'bread',
  'breadcrumbs_fresh': 'breadcrumbs',
  'croissants': 'bread',
  
  // Canned legumes
  'lentils_canned_brown': 'lentils',
  'lentils_canned_green': 'lentils',
  'red_kidney_beans_canned': 'kidney_beans',
  'cannellini_beans_canned': 'cannellini_beans',
  'black_beans_canned': 'black_beans',
  'butter_beans_canned': 'beans',
  'borlotti_beans_canned': 'beans',
  'baked_beans_canned': 'beans',
  
  // Dried legumes
  'lentils_red_dried': 'lentils',
  'lentils_green_dried': 'lentils',
  'lentils_brown_dried': 'lentils',
  'lentils_french_dried': 'lentils',
  'chickpeas_dried': 'chickpeas',
  'split_peas_green': 'peas',
  'split_peas_yellow': 'peas',
  'black_beans_dried': 'black_beans',
  'kidney_beans_dried': 'kidney_beans',
  'mung_beans': 'beans',
  
  // Nuts
  'almonds_slivered': 'almonds',
  'almonds_flaked': 'almonds',
  'almond_meal': 'almonds',
  'peanuts_raw': 'peanuts',
  'peanuts_roasted': 'peanuts',
  'macadamias': 'almonds',  // Similar nut
  'hazelnuts': 'almonds',
  'pecans': 'walnuts',  // Similar nutritionally
  'brazil_nuts': 'almonds',
  
  // Seeds
  'flaxseeds': 'chia_seeds',  // Similar seeds
  'pumpkin_seeds': 'sunflower_seeds',
  'sesame_seeds_white': 'sesame_seeds',
  'sesame_seeds_black': 'sesame_seeds',
  'poppy_seeds': 'sesame_seeds',
  'hemp_seeds': 'chia_seeds',
  
  // Nut butters
  'peanut_butter_smooth': 'peanut_butter',
  'peanut_butter_crunchy': 'peanut_butter',
  'abc_butter': 'almond_butter',
  'hazelnut_spread': 'chocolate',
  
  // Oils (varieties)
  'rice_bran_oil': 'vegetable_oil',
  'coconut_oil_virgin': 'coconut_oil',
  'coconut_oil_refined': 'coconut_oil',
  'peanut_oil': 'vegetable_oil',
  'truffle_oil': 'olive_oil',
  'walnut_oil': 'olive_oil',
  'macadamia_oil': 'olive_oil',
  
  // Fats
  'copha': 'butter',
  'lard': 'butter',
  'dripping': 'butter',
  
  // Vinegars
  'vinegar_white': 'vinegar',
  'vinegar_red_wine': 'vinegar',
  'vinegar_white_wine': 'vinegar',
  'vinegar_apple_cider': 'vinegar',
  'vinegar_balsamic': 'vinegar',
  'vinegar_malt': 'vinegar',
  'vinegar_sherry': 'vinegar',
  
  // Soy sauces
  'soy_sauce_light': 'soy_sauce',
  'soy_sauce_dark': 'soy_sauce',
  'soy_sauce_low_sodium': 'soy_sauce',
  'kecap_manis': 'soy_sauce',
  'teriyaki_sauce': 'soy_sauce',
  
  // Curry pastes
  'curry_paste_red': 'curry_paste',
  'curry_paste_green': 'curry_paste',
  'curry_paste_yellow': 'curry_paste',
  'curry_paste_massaman': 'curry_paste',
  'curry_paste_panang': 'curry_paste',
  'laksa_paste': 'curry_paste',
  
  // Mustards
  'mustard_wholegrain': 'mustard_dijon',
  'mustard_american_yellow': 'mustard',
  'mustard_english': 'mustard',
  
  // Dried herbs
  'oregano_dried': 'oregano',
  'basil_dried': 'basil',
  'thyme_dried': 'thyme',
  'rosemary_dried': 'rosemary',
  'sage_dried': 'sage',
  'parsley_dried': 'parsley',
  'dill_dried': 'dill',
  'tarragon_dried': 'tarragon',
  'marjoram_dried': 'marjoram',
  'bay_leaves_dried': 'bay_leaf',
  'chives_dried': 'chives',
  'mixed_herbs': 'oregano',
  'italian_herbs': 'oregano',
  
  // Spices - ground
  'white_pepper_ground': 'black_pepper',
  'paprika_sweet': 'paprika',
  'paprika_hot': 'paprika',
  'cayenne_pepper': 'paprika',
  'chilli_flakes': 'chili_powder',
  'cumin_ground': 'cumin',
  'coriander_ground': 'coriander',
  'turmeric_ground': 'turmeric',
  'ginger_ground': 'ginger_powder',
  'cinnamon_ground': 'cinnamon',
  'nutmeg_ground': 'nutmeg',
  'allspice_ground': 'allspice',
  'cloves_ground': 'cloves',
  'cardamom_ground': 'cardamom',
  'chinese_five_spice': 'cinnamon',
  'mixed_spice': 'cinnamon',
  'zaatar': 'oregano',
  'ras_el_hanout': 'cumin',
  
  // Spices - whole
  'black_peppercorns': 'black_pepper',
  'cumin_seeds': 'cumin',
  'coriander_seeds': 'coriander',
  'fennel_seeds': 'fennel',
  'mustard_seeds_yellow': 'mustard',
  'mustard_seeds_brown': 'mustard',
  'mustard_seeds_black': 'mustard',
  'cardamom_pods': 'cardamom',
  'cinnamon_sticks': 'cinnamon',
  'cloves_whole': 'cloves',
  'sichuan_peppercorns': 'black_pepper',
  'juniper_berries': 'black_pepper',
  'caraway_seeds': 'cumin',
  'celery_seeds': 'celery_seed',
  'fenugreek_seeds': 'cumin',
  
  // Salts
  'salt_table': 'salt',
  'salt_sea': 'salt',
  'salt_kosher': 'salt',
  'salt_pink_himalayan': 'salt',
  'salt_flaky': 'salt',
  'chicken_salt': 'salt',
  
  // Stocks
  'chicken_stock_cubes': 'chicken_stock',
  'chicken_stock_powder': 'chicken_stock',
  'beef_stock_cubes': 'beef_stock',
  'vegetable_stock_cubes': 'vegetable_stock',
  'dashi': 'fish_stock',
  
  // Baking - flours
  'flour_self_raising': 'flour_plain',
  'flour_wholemeal': 'flour_plain',
  'rice_flour': 'flour_plain',
  'chickpea_flour': 'flour_plain',
  'spelt_flour': 'flour_plain',
  'gluten_free_flour_blend': 'flour_plain',
  
  // Baking - sugars
  'sugar_white_caster': 'sugar',
  'sugar_white_granulated': 'sugar',
  'sugar_brown_light': 'brown_sugar',
  'sugar_brown_dark': 'brown_sugar',
  'sugar_raw': 'sugar',
  'demerara_sugar': 'sugar',
  'coconut_sugar': 'sugar',
  'agave_syrup': 'honey',
  'rice_malt_syrup': 'honey',
  'stevia': 'sugar',
  
  // Baking - leaveners
  'bicarbonate_of_soda': 'baking_soda',
  'cream_of_tartar': 'baking_powder',
  'yeast_dried': 'yeast',
  'yeast_instant': 'yeast',
  
  // Chocolate/cocoa
  'cocoa_powder_dutch': 'cocoa_powder',
  'cocoa_powder_natural': 'cocoa_powder',
  'dark_chocolate_70': 'dark_chocolate',
  'dark_chocolate_baking': 'dark_chocolate',
  'white_chocolate': 'chocolate',
  'chocolate_chips': 'chocolate',
  'cacao_nibs': 'cocoa_powder',
  'drinking_chocolate': 'cocoa_powder',
  
  // Dried fruits
  'currants_dried': 'raisins',
  'apricots_dried': 'apricot',
  'dates_dried': 'dates',
  'figs_dried': 'fig',
  'cranberries_dried': 'cranberry',
  'mango_dried': 'mango',
  'apple_dried': 'apple',
  'mixed_dried_fruit': 'raisins',
  'glace_cherries': 'cherry',
  'glace_ginger': 'ginger',
  'mixed_peel': 'orange',
  
  // Coconut products
  'coconut_desiccated': 'coconut',
  'coconut_shredded': 'coconut',
  'coconut_flaked': 'coconut',
  
  // Baking other
  'gelatine_sheets': 'gelatine_powder',
  'agar_agar': 'gelatine_powder',
  'vanilla_pods': 'vanilla_extract',
  'peppermint_essence': 'vanilla_extract',
  'arrowroot': 'cornflour',
  
  // Stock liquids
  'chicken_stock_liquid': 'chicken_stock',
  'beef_stock_liquid': 'beef_stock',
  'vegetable_stock_liquid': 'vegetable_stock',
  
  // Pastry
  'puff_pastry_frozen': 'flour_plain',
  'shortcrust_pastry_frozen': 'flour_plain',
  'filo_pastry_frozen': 'flour_plain',
  'pie_shells_frozen': 'flour_plain',
  'pizza_bases_frozen': 'bread',
  
  // Beverages
  'coffee_ground': 'coffee',
  'coffee_beans': 'coffee',
  'tea_green': 'tea',
  'coconut_water': 'water',
  'vegetable_juice': 'tomato',
  'apple_juice_cooking': 'apple',
  
  // Pickles & preserves
  'pickled_gherkins': 'cucumber',
  'pickled_onions': 'onion',
  'olives_black': 'olives',
  'olives_green': 'olives',
  'sun_dried_tomatoes': 'tomato',
  'roasted_capsicums_jarred': 'bell_pepper',
  'artichoke_hearts_jarred': 'artichoke',
  'jalapenos_pickled': 'jalapeno_pepper',
  'sauerkraut': 'cabbage',
  'kimchi': 'cabbage',
  
  // Spreads
  'vegemite': 'yeast',
  'jam_strawberry': 'strawberry',
  'jam_raspberry': 'raspberry',
  'jam_apricot': 'apricot',
  'golden_syrup': 'honey',
  'treacle': 'honey',
  'lemon_curd': 'lemon',
  
  // Dips
  'baba_ganoush': 'eggplant',
  'taramasalata': 'fish',
  'pesto_basil': 'basil',
  'pesto_sun_dried_tomato': 'tomato',
};

console.log('\\nTotal comprehensive mappings: ' + Object.keys(COMPREHENSIVE_NUTRITION_FALLBACKS).length);

module.exports = COMPREHENSIVE_NUTRITION_FALLBACKS;
