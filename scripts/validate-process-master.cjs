#!/usr/bin/env node

/**
 * Validation script for processMaster.json
 * Ensures data integrity and consistency
 * 
 * Run with: node scripts/validate-process-master.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`ERROR: Failed to load ${filePath}`, 'red');
    log(`  ${error.message}`, 'red');
    process.exit(1);
  }
}

function validateProcessMaster() {
  log('\n🔍 Validating Process Master Database...\n', 'cyan');
  
  const processMaster = loadJSON('src/data/processMaster.json');
  const nutritionMultipliers = loadJSON('references/nutrition-multipliers.json');
  
  const errors = [];
  const warnings = [];
  
  // Extract valid nutrition multiplier keys
  const validNutritionRefs = Object.keys(nutritionMultipliers.defaultMultipliers || {});
  log(`✓ Loaded ${validNutritionRefs.length} valid nutrition multiplier refs: ${validNutritionRefs.join(', ')}`, 'green');
  
  // Extract valid categories
  const validCategories = Object.keys(processMaster.categories || {});
  log(`✓ Loaded ${validCategories.length} valid categories: ${validCategories.join(', ')}`, 'green');
  
  // Extract valid heat levels
  const validHeatLevels = Object.keys(processMaster.heatLevels || {});
  log(`✓ Loaded ${validHeatLevels.length} valid heat levels: ${validHeatLevels.join(', ')}`, 'green');
  
  // Extract valid ingredient categories
  const validIngredientCategories = processMaster.ingredientCategories?.categories || [];
  log(`✓ Loaded ${validIngredientCategories.length} valid ingredient categories\n`, 'green');
  
  const processes = processMaster.processes || {};
  const processIds = Object.keys(processes);
  
  log(`📊 Validating ${processIds.length} processes...\n`, 'cyan');
  
  // Track all equipment names for consistency check
  const allEquipment = new Set();
  
  processIds.forEach(processId => {
    const process = processes[processId];
    const context = `Process "${processId}"`;
    
    // 1. Required fields
    const requiredFields = [
      'id', 'displayName', 'aliases', 'category', 'description',
      'yieldFactor', 'timeEstimate', 'heatLevel', 'nutritionMultiplierRef',
      'prepAhead', 'equipment', 'applicableTo', 'prerequisites'
    ];
    
    requiredFields.forEach(field => {
      if (!(field in process)) {
        errors.push(`${context}: Missing required field "${field}"`);
      }
    });
    
    // 2. ID consistency
    if (process.id !== processId) {
      errors.push(`${context}: ID mismatch - key is "${processId}" but id field is "${process.id}"`);
    }
    
    // 3. Valid category
    if (process.category && !validCategories.includes(process.category)) {
      errors.push(`${context}: Invalid category "${process.category}". Must be one of: ${validCategories.join(', ')}`);
    }
    
    // 4. Valid nutrition multiplier ref
    if (process.nutritionMultiplierRef && !validNutritionRefs.includes(process.nutritionMultiplierRef)) {
      errors.push(`${context}: Invalid nutritionMultiplierRef "${process.nutritionMultiplierRef}". Must be one of: ${validNutritionRefs.join(', ')}`);
    }
    
    // 5. Valid heat level
    if (process.heatLevel && !validHeatLevels.includes(process.heatLevel)) {
      errors.push(`${context}: Invalid heatLevel "${process.heatLevel}". Must be one of: ${validHeatLevels.join(', ')}`);
    }
    
    // 6. Yield factor range
    if (process.yieldFactor !== undefined) {
      if (typeof process.yieldFactor !== 'number') {
        errors.push(`${context}: yieldFactor must be a number`);
      } else if (process.yieldFactor < 0.05 || process.yieldFactor > 3.0) {
        warnings.push(`${context}: yieldFactor ${process.yieldFactor} is outside typical range (0.05-3.0)`);
      }
    }
    
    // 7. Yield factor overrides
    if (process.yieldFactorOverrides) {
      if (typeof process.yieldFactorOverrides !== 'object') {
        errors.push(`${context}: yieldFactorOverrides must be an object`);
      } else {
        Object.entries(process.yieldFactorOverrides).forEach(([ingredient, factor]) => {
          if (typeof factor !== 'number') {
            errors.push(`${context}: yieldFactorOverrides["${ingredient}"] must be a number`);
          } else if (factor < 0.05 || factor > 3.0) {
            warnings.push(`${context}: yieldFactorOverrides["${ingredient}"] = ${factor} is outside typical range`);
          }
        });
      }
    }
    
    // 8. Time estimate structure
    if (process.timeEstimate) {
      const te = process.timeEstimate;
      
      if (typeof te.baseMinutes !== 'number' || te.baseMinutes < 0) {
        errors.push(`${context}: timeEstimate.baseMinutes must be a non-negative number`);
      }
      
      if (te.perIngredientMinutes !== undefined && (typeof te.perIngredientMinutes !== 'number' || te.perIngredientMinutes < 0)) {
        errors.push(`${context}: timeEstimate.perIngredientMinutes must be a non-negative number`);
      }
      
      if (te.activeTime !== undefined && (typeof te.activeTime !== 'number' || te.activeTime < 0)) {
        errors.push(`${context}: timeEstimate.activeTime must be a non-negative number`);
      }
      
      if (te.passiveTime !== undefined && (typeof te.passiveTime !== 'number' || te.passiveTime < 0)) {
        errors.push(`${context}: timeEstimate.passiveTime must be a non-negative number`);
      }
      
      if (te.parallelizable !== undefined && typeof te.parallelizable !== 'boolean') {
        errors.push(`${context}: timeEstimate.parallelizable must be a boolean`);
      }
      
      // Check that activeTime + passiveTime roughly equals total time
      if (te.activeTime !== undefined && te.passiveTime !== undefined) {
        const total = te.activeTime + te.passiveTime;
        const expected = te.baseMinutes + (te.perIngredientMinutes || 0);
        if (Math.abs(total - expected) > 1) {
          warnings.push(`${context}: activeTime (${te.activeTime}) + passiveTime (${te.passiveTime}) = ${total} doesn't match baseMinutes (${te.baseMinutes})`);
        }
      }
    }
    
    // 9. Equipment array and naming
    if (process.equipment) {
      if (!Array.isArray(process.equipment)) {
        errors.push(`${context}: equipment must be an array`);
      } else {
        process.equipment.forEach(item => {
          allEquipment.add(item);
          
          // Check for inconsistent naming (spaces, camelCase, etc.)
          if (/\s/.test(item)) {
            warnings.push(`${context}: equipment "${item}" contains spaces - should use snake_case`);
          }
          if (/[A-Z]/.test(item)) {
            warnings.push(`${context}: equipment "${item}" contains uppercase - should be lowercase or snake_case`);
          }
        });
      }
    }
    
    // 10. Aliases array
    if (process.aliases) {
      if (!Array.isArray(process.aliases)) {
        errors.push(`${context}: aliases must be an array`);
      } else {
        process.aliases.forEach(alias => {
          if (typeof alias !== 'string') {
            errors.push(`${context}: All aliases must be strings`);
          }
        });
      }
    }
    
    // 11. Prerequisites reference valid processes
    if (process.prerequisites) {
      if (!Array.isArray(process.prerequisites)) {
        errors.push(`${context}: prerequisites must be an array`);
      } else {
        process.prerequisites.forEach(prereqId => {
          if (!processIds.includes(prereqId)) {
            errors.push(`${context}: prerequisite "${prereqId}" references non-existent process`);
          }
        });
      }
    }
    
    // 12. ApplicableTo uses valid categories
    if (process.applicableTo) {
      if (!Array.isArray(process.applicableTo)) {
        errors.push(`${context}: applicableTo must be an array`);
      } else {
        process.applicableTo.forEach(category => {
          if (!validIngredientCategories.includes(category)) {
            warnings.push(`${context}: applicableTo includes "${category}" which is not in ingredientCategories.categories`);
          }
        });
      }
    }
    
    // 13. PrepAhead structure
    if (process.prepAhead) {
      const pa = process.prepAhead;
      
      if (typeof pa.canPrepAhead !== 'boolean') {
        errors.push(`${context}: prepAhead.canPrepAhead must be a boolean`);
      }
      
      if (typeof pa.shelfLifeHours !== 'number' || pa.shelfLifeHours < 0) {
        errors.push(`${context}: prepAhead.shelfLifeHours must be a non-negative number`);
      }
      
      const validStorageLocations = ['fridge', 'freezer', 'counter'];
      if (pa.storageLocation && !validStorageLocations.includes(pa.storageLocation)) {
        errors.push(`${context}: prepAhead.storageLocation must be one of: ${validStorageLocations.join(', ')}`);
      }
      
      if (typeof pa.reheatable !== 'boolean') {
        errors.push(`${context}: prepAhead.reheatable must be a boolean`);
      }
    }
    
    // 14. Additional ingredients (if present)
    if (process.additionalIngredients) {
      if (!Array.isArray(process.additionalIngredients)) {
        errors.push(`${context}: additionalIngredients must be an array`);
      }
    }
  });
  
  // Report results
  log('\n📋 Validation Results:\n', 'bold');
  
  log(`Total processes: ${processIds.length}`, 'cyan');
  log(`Total equipment types: ${allEquipment.size}`, 'cyan');
  
  if (errors.length === 0 && warnings.length === 0) {
    log('\n✅ All validations passed! Process Master is valid.\n', 'green');
    return true;
  }
  
  if (errors.length > 0) {
    log(`\n❌ Found ${errors.length} error(s):\n`, 'red');
    errors.forEach((error, i) => {
      log(`  ${i + 1}. ${error}`, 'red');
    });
  }
  
  if (warnings.length > 0) {
    log(`\n⚠️  Found ${warnings.length} warning(s):\n`, 'yellow');
    warnings.forEach((warning, i) => {
      log(`  ${i + 1}. ${warning}`, 'yellow');
    });
  }
  
  log('\n');
  
  if (errors.length > 0) {
    process.exit(1);
  }
  
  return warnings.length === 0;
}

// Additional validation: Check equipment naming consistency
function validateEquipmentConsistency() {
  log('🔧 Checking equipment naming consistency...\n', 'cyan');
  
  const processMaster = loadJSON('src/data/processMaster.json');
  const processes = processMaster.processes || {};
  
  // Collect all equipment
  const equipmentUsage = {};
  
  Object.values(processes).forEach(process => {
    if (process.equipment) {
      process.equipment.forEach(item => {
        if (!equipmentUsage[item]) {
          equipmentUsage[item] = [];
        }
        equipmentUsage[item].push(process.id);
      });
    }
  });
  
  const equipmentList = Object.keys(equipmentUsage).sort();
  
  log(`Found ${equipmentList.length} unique equipment items:\n`, 'green');
  
  // Group by naming pattern
  const singleWord = equipmentList.filter(e => !e.includes('_'));
  const snakeCase = equipmentList.filter(e => e.includes('_'));
  
  if (singleWord.length > 0) {
    log(`  Single-word (${singleWord.length}): ${singleWord.slice(0, 10).join(', ')}${singleWord.length > 10 ? '...' : ''}`, 'cyan');
  }
  
  if (snakeCase.length > 0) {
    log(`  Snake_case (${snakeCase.length}): ${snakeCase.slice(0, 10).join(', ')}${snakeCase.length > 10 ? '...' : ''}`, 'cyan');
  }
  
  log('\n✓ Equipment naming is consistent\n', 'green');
}

// Run validations
try {
  const isValid = validateProcessMaster();
  validateEquipmentConsistency();
  
  if (isValid) {
    log('🎉 Process Master validation complete - All checks passed!\n', 'green');
    process.exit(0);
  } else {
    log('⚠️  Process Master validation complete - Check warnings above\n', 'yellow');
    process.exit(0);
  }
} catch (error) {
  log(`\n❌ Validation failed with error:\n`, 'red');
  log(`  ${error.message}\n`, 'red');
  if (error.stack) {
    log(`${error.stack}\n`, 'red');
  }
  process.exit(1);
}
