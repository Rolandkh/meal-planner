/**
 * Parse Pricing Data from Markdown Tables
 * 
 * Reads markdown-formatted pricing tables and integrates them into
 * the ingredient catalog. Handles all 678 pricing entries.
 * 
 * Usage:
 *   1. Save your pricing markdown to a file (e.g., pricing-data.md)
 *   2. Run: node scripts/parsePricingMarkdown.cjs pricing-data.md
 */

const fs = require('fs');
const path = require('path');

const INGREDIENT_MASTER_PATH = path.join(__dirname, '../src/data/ingredientMaster.json');

// Get input file from command line
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('\n❌ Error: No input file specified');
  console.error('Usage: node scripts/parsePricingMarkdown.cjs <pricing-file.md>\n');
  process.exit(1);
}

// Load comprehensive mappings
const COMPREHENSIVE_MAPPINGS = require('./enhancedPricingMappings.cjs');

// Smart matching function
function smartMatch(name, catalog) {
  // First, check manual mappings
  if (COMPREHENSIVE_MAPPINGS[name]) {
    const mappedId = COMPREHENSIVE_MAPPINGS[name];
    if (catalog[mappedId]) {
      return mappedId;
    }
  }
  
  const cleanName = (n) => n
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')  // Remove parentheses
    .replace(/[^\w\s-]/g, '')   // Remove special chars
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  const simple = cleanName(name);
  
  // Try direct match
  if (catalog[simple]) return simple;
  
  // Try variations
  const variations = [
    simple.replace(/_fresh$/, ''),
    simple.replace(/_dried$/, ''),
    simple.replace(/_canned$/, ''),
    simple.replace(/_frozen$/, ''),
    simple.replace(/_raw$/, ''),
    simple.replace(/s$/, ''),
    simple + 's',
    simple.replace(/_each$/, ''),
    simple.replace(/_loose$/, ''),
    simple.replace(/_bunch$/, ''),
    simple.replace(/_bag$/, ''),
  ];
  
  for (const variant of variations) {
    if (catalog[variant]) return variant;
  }
  
  // Try fuzzy search through all ingredients
  const nameLower = name.toLowerCase();
  for (const [id, ing] of Object.entries(catalog)) {
    const displayLower = ing.displayName.toLowerCase();
    
    // Check if names contain each other
    if (nameLower.includes(displayLower) && displayLower.length > 3) {
      return id;
    }
    if (displayLower.includes(nameLower) && nameLower.length > 3) {
      return id;
    }
    
    // Check aliases
    if (ing.aliases && ing.aliases.length > 0) {
      for (const alias of ing.aliases) {
        const aliasLower = alias.toLowerCase();
        if (nameLower.includes(aliasLower) && aliasLower.length > 3) {
          return id;
        }
      }
    }
  }
  
  return null;
}

// Parse pack info
function parsePackInfo(packDesc) {
  const desc = packDesc.trim();
  
  const unitKeywords = {
    'bag': 'bag', 'bunch': 'bunch', 'pack': 'pack', 'jar': 'jar',
    'can': 'can', 'bottle': 'bottle', 'box': 'box', 'tin': 'tin',
    'tub': 'tub', 'carton': 'carton', 'each': 'each', 'head': 'head',
    'punnet': 'punnet', 'loaf': 'loaf', 'wheel': 'wheel', 'block': 'block',
    'dozen': 'dozen'
  };
  
  // Check for specific units
  for (const [keyword, unit] of Object.entries(unitKeywords)) {
    if (desc.toLowerCase().includes(keyword)) {
      return { unit, unitSize: desc };
    }
  }
  
  // Check for kg, L, ml, g
  if (desc.match(/\dkg/i)) return { unit: 'kg', unitSize: desc };
  if (desc.match(/\dL/)) return { unit: 'L', unitSize: desc };
  if (desc.match(/\dml/i)) return { unit: 'ml', unitSize: desc };
  if (desc.match(/\dg\s/i) || desc.endsWith('g')) return { unit: 'g', unitSize: desc };
  if (desc.match(/per\s*100g/i)) return { unit: 'per 100g', unitSize: desc };
  
  return { unit: 'unit', unitSize: desc };
}

// Parse markdown table row
function parseTableRow(line) {
  // Split by pipes and clean
  const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length < 7) return null;
  
  const [num, ingredient, pack, unit, priceStr, perUnit, notes] = parts;
  
  // Extract price (remove $ and commas)
  const price = parseFloat(priceStr.replace(/[$,]/g, ''));
  
  if (isNaN(price)) return null;
  
  return {
    number: parseInt(num),
    name: ingredient,
    pack: pack,
    price: price,
    notes: notes
  };
}

// Main function
async function parsePricingFile(filePath) {
  console.log(`\n💰 Parsing Pricing Data from: ${filePath}`);
  console.log('==========================================\n');
  
  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Parse table rows
  const entries = [];
  for (const line of lines) {
    if (line.trim().startsWith('|') && !line.includes('---')) {
      const parsed = parseTableRow(line);
      if (parsed && parsed.number) {
        entries.push(parsed);
      }
    }
  }
  
  console.log(`📝 Found ${entries.length} pricing entries\n`);
  
  // Load catalog
  const masterData = JSON.parse(fs.readFileSync(INGREDIENT_MASTER_PATH, 'utf8'));
  
  let matched = 0;
  let unmatched = 0;
  let updated = 0;
  const unmatchedList = [];
  const matchReport = [];
  
  for (const entry of entries) {
    const ingredientId = smartMatch(entry.name, masterData.ingredients);
    
    if (ingredientId) {
      const packInfo = parsePackInfo(entry.pack);
      const existing = masterData.ingredients[ingredientId];
      
      const action = existing.pricing ? 'UPDATE' : 'ADD';
      
      existing.pricing = {
        averagePrice: entry.price,
        unit: packInfo.unit,
        unitSize: packInfo.unitSize,
        currency: "AUD",
        region: "Melbourne, VIC, Australia",
        lastUpdated: "2026-01-10",
        source: "manual",
        notes: entry.notes || "Melbourne supermarket average"
      };
      
      if (action === 'UPDATE') updated++;
      matched++;
      
      matchReport.push({
        num: entry.number,
        name: entry.name,
        id: ingredientId,
        price: entry.price,
        action
      });
      
      if (matched % 50 === 0) {
        console.log(`   Progress: ${matched} matched...`);
      }
    } else {
      unmatched++;
      unmatchedList.push({
        num: entry.number,
        name: entry.name
      });
    }
  }
  
  // Save catalog
  masterData._lastUpdated = new Date().toISOString();
  fs.writeFileSync(INGREDIENT_MASTER_PATH, JSON.stringify(masterData, null, 2));
  
  const totalWithPricing = Object.values(masterData.ingredients).filter(i => i.pricing).length;
  
  console.log(`\n📊 Final Summary:`);
  console.log(`=================`);
  console.log(`   Entries processed: ${entries.length}`);
  console.log(`   ✅ Matched: ${matched} (${Math.round(matched/entries.length*100)}%)`);
  console.log(`   📝 Updated existing: ${updated}`);
  console.log(`   ⚠️  Unmatched: ${unmatched}`);
  console.log(`   💰 Total with pricing: ${totalWithPricing}`);
  console.log(`\n✅ Pricing integration complete!\n`);
  
  // Save detailed report
  const reportPath = path.join(__dirname, '../tmp/pricing-integration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalEntries: entries.length,
      matched,
      updated,
      unmatched,
      totalWithPricing
    },
    matched: matchReport,
    unmatched: unmatchedList
  }, null, 2));
  
  console.log(`📄 Detailed report saved: ${reportPath}\n`);
  
  if (unmatchedList.length > 0) {
    console.log(`⚠️  Unmatched items (${unmatchedList.length}):`);
    if (unmatchedList.length <= 50) {
      unmatchedList.forEach(u => console.log(`   ${u.num}. ${u.name}`));
    } else {
      console.log(`   (Too many to display - see report file)`);
    }
    console.log(`\n💡 These may need manual ID mapping or the ingredients may not exist in catalog\n`);
  }
}

// Run
if (require.main === module) {
  parsePricingFile(inputFile);
}

module.exports = { parsePricingFile, smartMatch, parsePackInfo };
