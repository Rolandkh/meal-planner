/**
 * Meal Plan Data Validation Script
 * Run in DevTools Console to validate generated meal plan data
 */

console.log('🔍 VALIDATING MEAL PLAN DATA...\n');

// Load all data
const rawDebug = JSON.parse(localStorage.getItem('debug_raw_ai_output') || 'null');
const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
const meals = JSON.parse(localStorage.getItem('meals') || '[]');
const mealPlan = JSON.parse(localStorage.getItem('currentMealPlan') || 'null');

const validationResults = {
  passed: [],
  failed: [],
  warnings: []
};

// ============================================================================
// TEST 1: Raw AI Output Structure
// ============================================================================
console.log('📋 TEST 1: Raw AI Output Structure');

if (!rawDebug) {
  validationResults.failed.push('No raw debug data found');
  console.log('❌ FAILED: No raw debug data');
} else {
  const rawData = rawDebug.rawData;
  
  // Check basic structure
  if (rawData.weekOf) {
    validationResults.passed.push('Raw data has weekOf');
    console.log('✅ weekOf:', rawData.weekOf);
  } else {
    validationResults.failed.push('Raw data missing weekOf');
  }
  
  if (rawData.budget && rawData.budget.estimated) {
    validationResults.passed.push('Raw data has budget');
    console.log('✅ budget.estimated:', rawData.budget.estimated);
  } else {
    validationResults.failed.push('Raw data missing budget');
  }
  
  if (Array.isArray(rawData.days)) {
    console.log('✅ days array exists:', rawData.days.length, 'days');
    
    if (rawData.days.length === 7) {
      validationResults.passed.push('Exactly 7 days');
    } else {
      validationResults.failed.push(`Expected 7 days, got ${rawData.days.length}`);
    }
    
    // Check each day has all meals
    let totalMeals = 0;
    rawData.days.forEach((day, i) => {
      if (day.breakfast) totalMeals++;
      if (day.lunch) totalMeals++;
      if (day.dinner) totalMeals++;
    });
    
    console.log('✅ Total meals in raw data:', totalMeals);
    if (totalMeals === 21) {
      validationResults.passed.push('Raw data has 21 meals');
    } else {
      validationResults.failed.push(`Expected 21 meals, got ${totalMeals}`);
    }
  } else {
    validationResults.failed.push('Raw data missing days array');
  }
}

console.log('');

// ============================================================================
// TEST 2: Recipes Array
// ============================================================================
console.log('📋 TEST 2: Recipes Array (Transformed & Stored)');

if (!Array.isArray(recipes) || recipes.length === 0) {
  validationResults.failed.push('No recipes found in storage');
  console.log('❌ FAILED: No recipes in localStorage');
} else {
  console.log('✅ Recipes count:', recipes.length);
  
  // Check for required fields
  const missingFields = recipes.filter(r => !r.recipeId || !r.name || !r.ingredients);
  if (missingFields.length === 0) {
    validationResults.passed.push('All recipes have required fields');
    console.log('✅ All recipes have recipeId, name, ingredients');
  } else {
    validationResults.failed.push(`${missingFields.length} recipes missing required fields`);
    console.log('❌', missingFields.length, 'recipes missing fields');
  }
  
  // Check for duplicate recipe names
  const recipeNames = recipes.map(r => r.name.toLowerCase());
  const uniqueNames = new Set(recipeNames);
  if (recipeNames.length === uniqueNames.size) {
    validationResults.passed.push('No duplicate recipe names');
    console.log('✅ No duplicate recipe names');
  } else {
    const duplicates = recipeNames.filter((name, index) => recipeNames.indexOf(name) !== index);
    validationResults.warnings.push(`${duplicates.length} duplicate recipe names: ${[...new Set(duplicates)].join(', ')}`);
    console.log('⚠️  Duplicate recipes found:', [...new Set(duplicates)]);
  }
  
  // Check recipeId format
  const validIds = recipes.filter(r => /^recipe_[0-9a-f-]+$/i.test(r.recipeId));
  if (validIds.length === recipes.length) {
    validationResults.passed.push('All recipe IDs valid format');
    console.log('✅ All recipe IDs in correct format');
  } else {
    validationResults.failed.push(`${recipes.length - validIds.length} invalid recipe IDs`);
  }
  
  // Sample a recipe
  console.log('\n📖 Sample Recipe:');
  console.log(recipes[0]);
}

console.log('');

// ============================================================================
// TEST 3: Meals Array
// ============================================================================
console.log('📋 TEST 3: Meals Array (Transformed & Stored)');

if (!Array.isArray(meals) || meals.length === 0) {
  validationResults.failed.push('No meals found in storage');
  console.log('❌ FAILED: No meals in localStorage');
} else {
  console.log('✅ Meals count:', meals.length);
  
  // Check for exactly 21 meals
  if (meals.length === 21) {
    validationResults.passed.push('Exactly 21 meals');
    console.log('✅ Exactly 21 meals (7 days × 3 meals)');
  } else {
    validationResults.failed.push(`Expected 21 meals, got ${meals.length}`);
    console.log('❌ Expected 21 meals, got', meals.length);
  }
  
  // Check required fields
  const missingFields = meals.filter(m => !m.mealId || !m.recipeId || !m.mealType || !m.date);
  if (missingFields.length === 0) {
    validationResults.passed.push('All meals have required fields');
    console.log('✅ All meals have mealId, recipeId, mealType, date');
  } else {
    validationResults.failed.push(`${missingFields.length} meals missing required fields`);
  }
  
  // Check unique meal IDs
  const mealIds = meals.map(m => m.mealId);
  const uniqueMealIds = new Set(mealIds);
  if (mealIds.length === uniqueMealIds.size) {
    validationResults.passed.push('All meal IDs unique');
    console.log('✅ All meal IDs are unique');
  } else {
    validationResults.failed.push('Duplicate meal IDs found');
    console.log('❌ Duplicate meal IDs found');
  }
  
  // Check all recipeIds are valid (reference existing recipes)
  const recipeIds = new Set(recipes.map(r => r.recipeId));
  const invalidRefs = meals.filter(m => !recipeIds.has(m.recipeId));
  if (invalidRefs.length === 0) {
    validationResults.passed.push('All meal recipeIds valid');
    console.log('✅ All meals reference valid recipes');
  } else {
    validationResults.failed.push(`${invalidRefs.length} meals reference non-existent recipes`);
    console.log('❌', invalidRefs.length, 'meals reference non-existent recipes');
  }
  
  // Check meal type distribution
  const mealTypes = { breakfast: 0, lunch: 0, dinner: 0 };
  meals.forEach(m => {
    if (mealTypes[m.mealType] !== undefined) {
      mealTypes[m.mealType]++;
    }
  });
  console.log('✅ Meal distribution:', mealTypes);
  
  if (mealTypes.breakfast === 7 && mealTypes.lunch === 7 && mealTypes.dinner === 7) {
    validationResults.passed.push('Correct meal distribution');
  } else {
    validationResults.warnings.push('Uneven meal distribution');
  }
}

console.log('');

// ============================================================================
// TEST 4: Current Meal Plan
// ============================================================================
console.log('📋 TEST 4: Current Meal Plan (Transformed & Stored)');

if (!mealPlan) {
  validationResults.failed.push('No meal plan found in storage');
  console.log('❌ FAILED: No meal plan in localStorage');
} else {
  // Check required fields
  if (mealPlan.mealPlanId) {
    validationResults.passed.push('Has mealPlanId');
    console.log('✅ mealPlanId:', mealPlan.mealPlanId);
  } else {
    validationResults.failed.push('Missing mealPlanId');
  }
  
  if (mealPlan.weekOf) {
    validationResults.passed.push('Has weekOf');
    console.log('✅ weekOf:', mealPlan.weekOf);
  } else {
    validationResults.failed.push('Missing weekOf');
  }
  
  if (mealPlan.budget && typeof mealPlan.budget.estimated === 'number') {
    validationResults.passed.push('Has budget');
    console.log('✅ budget.estimated:', mealPlan.budget.estimated);
    
    // Check if budget is reasonable (between $20-$300)
    if (mealPlan.budget.estimated >= 20 && mealPlan.budget.estimated <= 300) {
      validationResults.passed.push('Budget is reasonable');
      console.log('✅ Budget is reasonable ($20-$300)');
    } else {
      validationResults.warnings.push(`Budget seems unusual: $${mealPlan.budget.estimated}`);
    }
  } else {
    validationResults.failed.push('Missing or invalid budget');
  }
  
  if (Array.isArray(mealPlan.mealIds)) {
    console.log('✅ mealIds array:', mealPlan.mealIds.length, 'IDs');
    
    if (mealPlan.mealIds.length === 21) {
      validationResults.passed.push('mealIds has 21 entries');
    } else {
      validationResults.failed.push(`Expected 21 mealIds, got ${mealPlan.mealIds.length}`);
    }
    
    // Check all mealIds reference actual meals
    const mealIdSet = new Set(meals.map(m => m.mealId));
    const invalidMealIds = mealPlan.mealIds.filter(id => !mealIdSet.has(id));
    if (invalidMealIds.length === 0) {
      validationResults.passed.push('All mealIds reference valid meals');
      console.log('✅ All mealIds reference existing meals');
    } else {
      validationResults.failed.push(`${invalidMealIds.length} invalid meal ID references`);
    }
  } else {
    validationResults.failed.push('Missing mealIds array');
  }
}

console.log('');

// ============================================================================
// TEST 5: Data Integrity
// ============================================================================
console.log('📋 TEST 5: Data Integrity Checks');

// Check dates are sequential
if (meals.length > 0) {
  const dates = [...new Set(meals.map(m => m.date))].sort();
  console.log('✅ Unique dates:', dates.length);
  console.log('   Dates:', dates.join(', '));
  
  if (dates.length === 7) {
    validationResults.passed.push('7 unique dates');
  } else {
    validationResults.warnings.push(`Expected 7 unique dates, got ${dates.length}`);
  }
}

// Check ingredient counts
const totalIngredients = recipes.reduce((sum, r) => sum + (r.ingredients?.length || 0), 0);
console.log('✅ Total ingredient entries across all recipes:', totalIngredients);

// Check for empty/null values
const recipesWithEmptyIngredients = recipes.filter(r => !r.ingredients || r.ingredients.length === 0);
if (recipesWithEmptyIngredients.length > 0) {
  validationResults.warnings.push(`${recipesWithEmptyIngredients.length} recipes have no ingredients`);
  console.log('⚠️', recipesWithEmptyIngredients.length, 'recipes have no ingredients');
}

console.log('');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('═══════════════════════════════════════════════════════');
console.log('📊 VALIDATION SUMMARY');
console.log('═══════════════════════════════════════════════════════');
console.log('✅ Passed:', validationResults.passed.length, 'tests');
console.log('❌ Failed:', validationResults.failed.length, 'tests');
console.log('⚠️  Warnings:', validationResults.warnings.length, 'issues');

if (validationResults.failed.length > 0) {
  console.log('\n❌ FAILURES:');
  validationResults.failed.forEach(f => console.log('  -', f));
}

if (validationResults.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  validationResults.warnings.forEach(w => console.log('  -', w));
}

if (validationResults.failed.length === 0) {
  console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
  console.log('\n📊 QUICK STATS:');
  console.log(`   - ${recipes.length} recipes`);
  console.log(`   - ${meals.length} meals`);
  console.log(`   - $${mealPlan?.budget?.estimated || 0} estimated budget`);
  console.log(`   - Week: ${mealPlan?.weekOf || 'unknown'}`);
} else {
  console.log('\n⚠️  VALIDATION FAILED - See failures above');
}

console.log('═══════════════════════════════════════════════════════');

// Return summary for programmatic access
({
  passed: validationResults.passed.length,
  failed: validationResults.failed.length,
  warnings: validationResults.warnings.length,
  results: validationResults,
  data: { recipes, meals, mealPlan }
});
