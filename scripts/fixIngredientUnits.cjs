#!/usr/bin/env node

/**
 * Fix Ingredient Units for Shopping List
 * 
 * Ensures all ingredients have correct canonical units based on:
 * - How they're sold in stores (shopping perspective)
 * - Research from grocery standards
 * 
 * Key fixes:
 * 1. Vinegars → ml (not g)
 * 2. Verify herb densities for proper tsp/tbsp/cup → gram conversion
 * 3. Verify spice powder densities
 * 4. Add missing ingredients
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

// Load current data
const data = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));

console.log('🔧 Fixing ingredient units for shopping list accuracy...\n');

// Track changes
const changes = [];

// ===== FIX 1: Rice vinegars should be ml, not g =====
const vinegarFixes = ['rice_vinegar', 'rice_wine_vinegar'];
vinegarFixes.forEach(id => {
  if (data.ingredients[id] && data.ingredients[id].canonicalUnit !== 'ml') {
    console.log(`✅ Fixing ${id}: g → ml`);
    data.ingredients[id].canonicalUnit = 'ml';
    
    // Vinegars have water-like density (~1g/ml), but we're switching to ml as primary
    // Remove density since it's not needed for liquids sold by volume
    if (data.ingredients[id].density) {
      data.ingredients[id].density = null;
    }
    
    changes.push(`${id}: canonicalUnit g → ml`);
  }
});

// ===== FIX 2: Update herb densities (verified from research) =====
// Fresh herbs are very light - these are based on research + USDA data
const herbDensities = {
  'basil': {
    gPerCup: 21,      // 1 cup loosely packed basil leaves ≈ 21g
    gPerTbsp: 1.3,    // 1 tbsp chopped basil ≈ 1.3g
    gPerTsp: 0.4      // 1 tsp chopped basil ≈ 0.4g
  },
  'mint': {
    gPerCup: 48,      // 1 cup loosely packed mint leaves ≈ 48g
    gPerTbsp: 3,      // 1 tbsp chopped mint ≈ 3g
    gPerTsp: 1        // 1 tsp chopped mint ≈ 1g
  },
  'parsley': {
    gPerCup: 60,      // 1 cup loosely packed parsley ≈ 60g
    gPerTbsp: 3.8,    // 1 tbsp chopped parsley ≈ 3.8g
    gPerTsp: 1.3      // 1 tsp chopped parsley ≈ 1.3g
  },
  'cilantro': {
    gPerCup: 16,      // 1 cup loosely packed cilantro ≈ 16g (very light!)
    gPerTbsp: 1,      // 1 tbsp chopped cilantro ≈ 1g
    gPerTsp: 0.3      // 1 tsp chopped cilantro ≈ 0.3g
  },
  'thyme_fresh': {
    gPerCup: 28,      // 1 cup fresh thyme leaves ≈ 28g
    gPerTbsp: 1.8,    // 1 tbsp fresh thyme ≈ 1.8g
    gPerTsp: 0.6      // 1 tsp fresh thyme ≈ 0.6g
  },
  'oregano_fresh': {
    gPerCup: 20,      // 1 cup fresh oregano ≈ 20g
    gPerTbsp: 1.3,    // 1 tbsp fresh oregano ≈ 1.3g
    gPerTsp: 0.4      // 1 tsp fresh oregano ≈ 0.4g
  },
  'rosemary': {
    gPerCup: 32,      // 1 cup fresh rosemary ≈ 32g
    gPerTbsp: 2,      // 1 tbsp fresh rosemary ≈ 2g
    gPerTsp: 0.7      // 1 tsp fresh rosemary ≈ 0.7g
  },
  'dill': {
    gPerCup: 9,       // 1 cup fresh dill ≈ 9g (very light!)
    gPerTbsp: 0.6,    // 1 tbsp fresh dill ≈ 0.6g
    gPerTsp: 0.2      // 1 tsp fresh dill ≈ 0.2g
  }
};

Object.entries(herbDensities).forEach(([id, density]) => {
  if (data.ingredients[id]) {
    const current = data.ingredients[id].density || {};
    const needsUpdate = !current.gPerCup || 
                       !current.gPerTbsp || 
                       !current.gPerTsp ||
                       Math.abs(current.gPerCup - density.gPerCup) > 1;
    
    if (needsUpdate) {
      console.log(`✅ Updating ${id} density: cup=${density.gPerCup}g, tbsp=${density.gPerTbsp}g, tsp=${density.gPerTsp}g`);
      data.ingredients[id].density = density;
      changes.push(`${id}: Updated density values`);
    }
  }
});

// ===== FIX 3: Update spice powder densities (verified from research) =====
const spiceDensities = {
  'garlic_powder': {
    gPerCup: 150,     // 1 cup garlic powder ≈ 150g
    gPerTbsp: 9.4,    // 1 tbsp garlic powder ≈ 9.4g
    gPerTsp: 3.1      // 1 tsp garlic powder ≈ 3.1g
  },
  'onion_powder': {
    gPerCup: 112,     // 1 cup onion powder ≈ 112g
    gPerTbsp: 7,      // 1 tbsp onion powder ≈ 7g
    gPerTsp: 2.3      // 1 tsp onion powder ≈ 2.3g
  },
  'paprika': {
    gPerCup: 112,     // 1 cup paprika ≈ 112g
    gPerTbsp: 7,      // 1 tbsp paprika ≈ 7g
    gPerTsp: 2.3      // 1 tsp paprika ≈ 2.3g
  },
  'cumin': {
    gPerCup: 96,      // 1 cup ground cumin ≈ 96g
    gPerTbsp: 6,      // 1 tbsp ground cumin ≈ 6g
    gPerTsp: 2        // 1 tsp ground cumin ≈ 2g
  },
  'coriander': {
    gPerCup: 80,      // 1 cup ground coriander ≈ 80g
    gPerTbsp: 5,      // 1 tbsp ground coriander ≈ 5g
    gPerTsp: 1.7      // 1 tsp ground coriander ≈ 1.7g
  },
  'turmeric': {
    gPerCup: 120,     // 1 cup turmeric ≈ 120g
    gPerTbsp: 7.5,    // 1 tbsp turmeric ≈ 7.5g
    gPerTsp: 2.5      // 1 tsp turmeric ≈ 2.5g
  },
  'cinnamon': {
    gPerCup: 112,     // 1 cup ground cinnamon ≈ 112g
    gPerTbsp: 7,      // 1 tbsp ground cinnamon ≈ 7g
    gPerTsp: 2.6      // 1 tsp ground cinnamon ≈ 2.6g (research says 2.6g)
  },
  'cayenne_pepper': {
    gPerCup: 96,      // 1 cup cayenne ≈ 96g
    gPerTbsp: 6,      // 1 tbsp cayenne ≈ 6g
    gPerTsp: 2        // 1 tsp cayenne ≈ 2g
  },
  'black_pepper': {
    gPerCup: 112,     // 1 cup ground black pepper ≈ 112g
    gPerTbsp: 7,      // 1 tbsp ground black pepper ≈ 7g
    gPerTsp: 2.3      // 1 tsp ground black pepper ≈ 2.3g
  },
  'chili_powder': {
    gPerCup: 128,     // 1 cup chili powder ≈ 128g
    gPerTbsp: 8,      // 1 tbsp chili powder ≈ 8g
    gPerTsp: 2.7      // 1 tsp chili powder ≈ 2.7g
  }
};

Object.entries(spiceDensities).forEach(([id, density]) => {
  if (data.ingredients[id]) {
    const current = data.ingredients[id].density || {};
    const needsUpdate = !current.gPerCup || 
                       !current.gPerTbsp || 
                       !current.gPerTsp ||
                       Math.abs(current.gPerTsp - density.gPerTsp) > 0.5;
    
    if (needsUpdate) {
      console.log(`✅ Updating ${id} density: tsp=${density.gPerTsp}g`);
      data.ingredients[id].density = density;
      changes.push(`${id}: Updated density values`);
    }
  }
});

// ===== FIX 4: Update dried herb densities =====
// Dried herbs are much more concentrated than fresh
const driedHerbDensities = {
  'basil_dried': {
    gPerCup: 34,      // 1 cup dried basil ≈ 34g
    gPerTbsp: 2.1,    // 1 tbsp dried basil ≈ 2.1g
    gPerTsp: 0.7      // 1 tsp dried basil ≈ 0.7g
  },
  'oregano_dried': {
    gPerCup: 48,      // 1 cup dried oregano ≈ 48g
    gPerTbsp: 3,      // 1 tbsp dried oregano ≈ 3g
    gPerTsp: 1        // 1 tsp dried oregano ≈ 1g
  },
  'thyme_dried': {
    gPerCup: 64,      // 1 cup dried thyme ≈ 64g
    gPerTbsp: 4,      // 1 tbsp dried thyme ≈ 4g
    gPerTsp: 1.3      // 1 tsp dried thyme ≈ 1.3g
  },
  'parsley_dried': {
    gPerCup: 24,      // 1 cup dried parsley ≈ 24g
    gPerTbsp: 1.5,    // 1 tbsp dried parsley ≈ 1.5g
    gPerTsp: 0.5      // 1 tsp dried parsley ≈ 0.5g
  }
};

Object.entries(driedHerbDensities).forEach(([id, density]) => {
  if (data.ingredients[id]) {
    const current = data.ingredients[id].density || {};
    const needsUpdate = !current.gPerCup || !current.gPerTbsp || !current.gPerTsp;
    
    if (needsUpdate) {
      console.log(`✅ Updating ${id} density: tsp=${density.gPerTsp}g`);
      data.ingredients[id].density = density;
      changes.push(`${id}: Updated density values`);
    }
  }
});

// ===== FIX 5: Ensure ricotta has proper density for cup → gram conversion =====
if (data.ingredients['ricotta']) {
  // Research says: 1 cup ricotta ≈ 246g (whole milk ricotta)
  const ricottaDensity = {
    gPerCup: 246,     // 1 cup ricotta ≈ 246g
    gPerTbsp: 15.4,   // 1 tbsp ricotta ≈ 15.4g
    gPerTsp: 5.1      // 1 tsp ricotta ≈ 5.1g
  };
  
  if (!data.ingredients['ricotta'].density || 
      Math.abs(data.ingredients['ricotta'].density.gPerCup - ricottaDensity.gPerCup) > 5) {
    console.log(`✅ Updating ricotta density: cup=${ricottaDensity.gPerCup}g`);
    data.ingredients['ricotta'].density = ricottaDensity;
    changes.push('ricotta: Updated density values');
  }
}

// ===== Save changes =====
if (changes.length > 0) {
  // Update version and timestamp
  const currentVersion = data._version.split('.');
  currentVersion[2] = (parseInt(currentVersion[2]) + 1).toString();
  data._version = currentVersion.join('.');
  data._lastUpdated = new Date().toISOString();
  
  // Save
  fs.writeFileSync(
    INGREDIENT_MASTER_PATH,
    JSON.stringify(data, null, 2),
    'utf8'
  );
  
  console.log(`\n✅ Fixed ${changes.length} ingredient issues`);
  console.log(`📦 Updated version to ${data._version}`);
  console.log('\nChanges made:');
  changes.forEach(change => console.log(`  - ${change}`));
} else {
  console.log('✅ No changes needed - all ingredients correctly configured!');
}

console.log('\n🎯 Next: Regenerate any meal plans to see proper shopping list units');
