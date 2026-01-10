/**
 * Analyze Unmatched Ingredients with Clustering
 * 
 * Loads normalization_diagnostics.json and performs:
 * 1. Frequency analysis
 * 2. String similarity clustering
 * 3. Pattern detection (compounds, variants, malformed)
 * 4. Priority scoring for dictionary expansion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load diagnostics
const diagnosticsPath = path.join(__dirname, '../tmp/normalization_diagnostics.json');
const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8'));

console.log('=== UNMATCHED INGREDIENTS ANALYSIS ===\n');
console.log('Loaded diagnostics from:', diagnosticsPath);
console.log('Total unmatched types:', diagnostics.unmatchedIngredients.length);
console.log('Total unmatched instances:', diagnostics.summary.totalUnmatched);
console.log('Current match rate:', (diagnostics.summary.totalMatched / diagnostics.summary.totalIngredients * 100).toFixed(1) + '%');
console.log();

// Helper: Calculate Levenshtein distance
function levenshteinDistance(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Helper: Clean string for comparison
function cleanForComparison(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ');        // Collapse whitespace
}

// Helper: Detect if string is a compound ingredient
function isCompound(str) {
  const lower = str.toLowerCase();
  const compoundPatterns = [
    / and /,
    / & /,
    / or /,
    / with /,
    / plus /
  ];
  
  // Must have a connector
  if (!compoundPatterns.some(pattern => pattern.test(lower))) {
    return false;
  }
  
  // But not if it's a product name
  const productKeywords = [
    'sauce', 'dressing', 'mix', 'cream', 'cookie', 'ice', 'sweet'
  ];
  
  if (productKeywords.some(kw => lower.includes(kw))) {
    return false;
  }
  
  return true;
}

// Helper: Detect if string is malformed
function isMalformed(str) {
  if (!str || str.trim().length === 0) return true;
  if (str.length < 2) return true;
  if (str.includes('equivalent')) return true;
  if (str.includes('package')) return true;
  if (str.includes('=')) return true;
  if (str.match(/^\d/)) return true; // Starts with number
  if (str.includes('  ')) return true; // Double spaces
  return false;
}

// Helper: Extract category from string
function extractCategory(str) {
  const lower = str.toLowerCase();
  
  if (lower.includes('pasta') || lower.includes('noodle') || lower.includes('spaghetti') || 
      lower.includes('penne') || lower.includes('fusilli') || lower.includes('orzo') || 
      lower.includes('lasagna') || lower.includes('macaroni')) {
    return 'pasta';
  }
  
  if (lower.includes('cheese') || lower.includes('ricotta') || lower.includes('mozzarella') || 
      lower.includes('cheddar') || lower.includes('parmesan') || lower.includes('pecorino') || 
      lower.includes('mascarpone')) {
    return 'cheese';
  }
  
  if (lower.includes('mushroom') || lower.includes('portobello') || lower.includes('portabella') || 
      lower.includes('shiitake') || lower.includes('oyster')) {
    return 'mushroom';
  }
  
  if (lower.includes('oil') || lower.includes('vinegar') || lower.includes('sauce')) {
    return 'condiment';
  }
  
  if (lower.includes('meat') || lower.includes('beef') || lower.includes('pork') || 
      lower.includes('lamb') || lower.includes('veal') || lower.includes('shank')) {
    return 'meat';
  }
  
  if (lower.includes('tomato') || lower.includes('onion') || lower.includes('pepper') || 
      lower.includes('garlic') || lower.includes('carrot') || lower.includes('celery') || 
      lower.includes('fennel') || lower.includes('plantain')) {
    return 'vegetable';
  }
  
  return 'other';
}

// STEP 1: Frequency analysis
console.log('=== STEP 1: FREQUENCY ANALYSIS ===\n');

const byFrequency = [...diagnostics.unmatchedIngredients].sort((a, b) => b.count - a.count);

console.log('Top 20 by frequency:');
byFrequency.slice(0, 20).forEach((item, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${item.identityText.padEnd(40)} - ${item.count}× (${item.state})`);
});

const frequencyBuckets = {
  '10+': byFrequency.filter(x => x.count >= 10),
  '5-9': byFrequency.filter(x => x.count >= 5 && x.count < 10),
  '3-4': byFrequency.filter(x => x.count >= 3 && x.count < 5),
  '2': byFrequency.filter(x => x.count === 2),
  '1': byFrequency.filter(x => x.count === 1)
};

console.log('\nFrequency distribution:');
Object.entries(frequencyBuckets).forEach(([range, items]) => {
  const totalUses = items.reduce((sum, item) => sum + item.count, 0);
  console.log(`  ${range.padEnd(4)} occurrences: ${items.length.toString().padStart(3)} ingredients (${totalUses} total uses)`);
});

// STEP 2: Categorize by type
console.log('\n=== STEP 2: CATEGORIZATION ===\n');

const categories = {
  compound: [],
  malformed: [],
  pasta: [],
  cheese: [],
  mushroom: [],
  vegetable: [],
  meat: [],
  condiment: [],
  other: []
};

diagnostics.unmatchedIngredients.forEach(item => {
  if (isMalformed(item.identityText)) {
    categories.malformed.push(item);
  } else if (isCompound(item.identityText)) {
    categories.compound.push(item);
  } else {
    const category = extractCategory(item.identityText);
    categories[category].push(item);
  }
});

Object.entries(categories).forEach(([category, items]) => {
  if (items.length > 0) {
    const totalUses = items.reduce((sum, item) => sum + item.count, 0);
    console.log(`${category.padEnd(12)}: ${items.length.toString().padStart(3)} ingredients (${totalUses} total uses)`);
  }
});

// STEP 3: Clustering by similarity
console.log('\n=== STEP 3: SIMILARITY CLUSTERING ===\n');

const clusters = [];
const processed = new Set();

// Sort by frequency first (prioritize common ingredients)
const sortedItems = [...diagnostics.unmatchedIngredients].sort((a, b) => b.count - a.count);

for (const item of sortedItems) {
  if (processed.has(item.identityText)) continue;
  
  const cluster = {
    representative: item.identityText,
    totalCount: item.count,
    state: item.state,
    variants: [item]
  };
  
  processed.add(item.identityText);
  const cleanRep = cleanForComparison(item.identityText);
  
  // Find similar strings
  for (const other of sortedItems) {
    if (processed.has(other.identityText)) continue;
    if (other.state !== item.state) continue; // Only cluster within same state
    
    const cleanOther = cleanForComparison(other.identityText);
    const distance = levenshteinDistance(cleanRep, cleanOther);
    const maxLen = Math.max(cleanRep.length, cleanOther.length);
    const similarity = 1 - (distance / maxLen);
    
    if (similarity >= 0.7) { // 70% similarity threshold
      cluster.variants.push(other);
      cluster.totalCount += other.count;
      processed.add(other.identityText);
    }
  }
  
  if (cluster.variants.length > 1 || cluster.totalCount >= 2) {
    clusters.push(cluster);
  }
}

// Sort clusters by total count
clusters.sort((a, b) => b.totalCount - a.totalCount);

console.log(`Found ${clusters.length} clusters with 2+ variants or 2+ uses\n`);
console.log('Top 15 clusters:');
clusters.slice(0, 15).forEach((cluster, i) => {
  console.log(`\n${i + 1}. "${cluster.representative}" (${cluster.totalCount}× total, ${cluster.variants.length} variants, state: ${cluster.state})`);
  cluster.variants.forEach(v => {
    console.log(`   - ${v.identityText} (${v.count}×)`);
  });
});

// STEP 4: Priority scoring
console.log('\n\n=== STEP 4: PRIORITY SCORING ===\n');

const priorities = diagnostics.unmatchedIngredients.map(item => {
  let score = 0;
  
  // Frequency weight (most important)
  score += item.count * 10;
  
  // Category bonus
  if (!isMalformed(item.identityText) && !isCompound(item.identityText)) {
    score += 5;
  }
  
  // Common category bonus
  const category = extractCategory(item.identityText);
  if (['pasta', 'cheese', 'vegetable', 'mushroom'].includes(category)) {
    score += 3;
  }
  
  // Cluster bonus (if it clusters well with others)
  const cluster = clusters.find(c => 
    c.variants.some(v => v.identityText === item.identityText)
  );
  if (cluster && cluster.variants.length > 1) {
    score += cluster.variants.length;
  }
  
  return {
    ...item,
    priorityScore: score,
    category: isMalformed(item.identityText) ? 'malformed' : 
              isCompound(item.identityText) ? 'compound' : 
              category
  };
});

priorities.sort((a, b) => b.priorityScore - a.priorityScore);

console.log('Top 30 priorities for dictionary expansion:');
console.log('(Score = frequency*10 + bonuses)\n');

priorities.slice(0, 30).forEach((item, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. [${item.priorityScore.toString().padStart(3)}] ${item.identityText.padEnd(40)} - ${item.count}× (${item.category}, ${item.state})`);
});

// STEP 5: Recommendations summary
console.log('\n\n=== STEP 5: RECOMMENDATIONS SUMMARY ===\n');

const highPriority = priorities.filter(p => p.priorityScore >= 20 && p.category !== 'malformed' && p.category !== 'compound');
const compoundCount = categories.compound.length;
const malformedCount = categories.malformed.length;

console.log('PHASE 1: Quick Wins');
console.log(`  → Add ${highPriority.length} high-priority ingredients (score ≥20)`);
console.log(`  → Focus categories: pasta (${categories.pasta.length}), cheese (${categories.cheese.length}), mushroom (${categories.mushroom.length}), vegetable (${categories.vegetable.length})`);
console.log(`  → Expected impact: +${highPriority.reduce((sum, p) => sum + p.count, 0)} matched ingredients`);
console.log();

console.log('PHASE 2: Compound Splitting');
console.log(`  → Implement splitting for ${compoundCount} compound ingredients`);
console.log(`  → Examples: "${categories.compound.slice(0, 3).map(x => x.identityText).join('", "')}"`);
console.log();

console.log('PHASE 3: Systematic Expansion');
console.log(`  → Add all ingredients with 2+ occurrences: ${frequencyBuckets['2'].length + frequencyBuckets['3-4'].length + frequencyBuckets['5-9'].length} ingredients`);
console.log(`  → Review clusters for variant groups (${clusters.filter(c => c.variants.length > 1).length} multi-variant clusters)`);
console.log();

console.log('PHASE 4: Cleanup');
console.log(`  → Filter ${malformedCount} malformed entries`);
console.log(`  → Add fallback for remaining ${frequencyBuckets['1'].length} rare ingredients`);
console.log();

// STEP 6: Export results
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalUnmatched: diagnostics.unmatchedIngredients.length,
    currentMatchRate: `${(diagnostics.summary.totalMatched / diagnostics.summary.totalIngredients * 100).toFixed(1)}%`,
    targetMatchRate: '95-98%',
    estimatedExpansion: highPriority.length + 100
  },
  frequencyBuckets: Object.fromEntries(
    Object.entries(frequencyBuckets).map(([k, v]) => [k, v.length])
  ),
  categories: Object.fromEntries(
    Object.entries(categories).map(([k, v]) => [k, v.length])
  ),
  topPriorities: priorities.slice(0, 100).map(p => ({
    identityText: p.identityText,
    count: p.count,
    state: p.state,
    category: p.category,
    priorityScore: p.priorityScore
  })),
  clusters: clusters.slice(0, 50).map(c => ({
    representative: c.representative,
    totalCount: c.totalCount,
    variantCount: c.variants.length,
    state: c.state,
    variants: c.variants.map(v => ({ identityText: v.identityText, count: v.count }))
  })),
  recommendations: {
    phase1_quickWins: highPriority.length,
    phase2_compounds: compoundCount,
    phase3_systematic: frequencyBuckets['2'].length + frequencyBuckets['3-4'].length,
    phase4_cleanup: malformedCount
  }
};

const reportPath = path.join(__dirname, '../tmp/unmatched_analysis_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('=== ANALYSIS COMPLETE ===');
console.log(`\nDetailed report saved to: ${reportPath}`);
console.log(`\nEstimated dictionary expansion: ${report.summary.estimatedExpansion} entries`);
console.log(`Projected match rate improvement: ${report.summary.currentMatchRate} → ${report.summary.targetMatchRate}`);
