/*
  Generate product entries from data/protein_names.json and append to data/products.json
  - Avoids duplicates by name
  - Auto-assigns description, category and price bands by group

  Usage:
    node scripts/generateProductsFromNames.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'products.json');
const NAMES = path.join(ROOT, 'data', 'protein_names.json');

const priceBands = {
  whey: [1499, 1999],
  isolate: [1999, 2599],
  concentrate: [1499, 1899],
  casein: [1599, 2099],
  plant: [1499, 1899],
  egg: [1499, 1899],
  hydrolyzed: [2099, 2699],
  gainer: [1999, 2599],
  snacks: [599, 899],
  special: [1699, 2399],
};

const categoryMap = {
  whey: 'protein',
  isolate: 'protein',
  concentrate: 'protein',
  casein: 'protein',
  plant: 'protein',
  egg: 'protein',
  hydrolyzed: 'protein',
  gainer: 'gainer',
  snacks: 'snack',
  special: 'protein',
};

function randBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function buildDescription(group, name) {
  const base = {
    whey: 'Balanced whey blend for muscle growth and recovery.',
    isolate: 'Ultra-filtered whey isolate with fast absorption and low carbs.',
    concentrate: 'Great-tasting whey concentrate for daily protein support.',
    casein: 'Slow-release casein ideal for bedtime recovery.',
    plant: 'Plant-based complete protein for clean nutrition.',
    egg: 'Egg white-based protein with complete amino profile.',
    hydrolyzed: 'Hydrolyzed protein for rapid absorption and quick recovery.',
    gainer: 'High-calorie mass gainer with balanced macros.',
    snacks: 'Protein-rich snack for on-the-go fueling.',
    special: 'Specialized protein formula designed for performance and recovery.',
  }[group] || 'High quality supplement.';
  return `${name}: ${base}`;
}

function main() {
  if (!fs.existsSync(NAMES)) {
    console.error('Missing protein_names.json');
    process.exit(1);
  }
  const namesData = JSON.parse(fs.readFileSync(NAMES, 'utf8'));
  let products = [];
  if (fs.existsSync(OUT)) {
    try { products = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
  }
  const existingNames = new Set(products.map(p => (p.name || '').toLowerCase()));

  let added = 0;
  for (const [group, list] of Object.entries(namesData)) {
    const [min, max] = priceBands[group] || [999, 1999];
    const category = categoryMap[group] || 'protein';
    for (const name of list) {
      if (!name || existingNames.has(name.toLowerCase())) continue;
      const price = randBetween(min, max);
      const desc = buildDescription(group, name);
      const imgText = encodeURIComponent(name.replace(/\s+/g, '+'));
      // Defaults per group
      const servingsBy = { whey: 30, isolate: 30, concentrate: 30, casein: 30, plant: 28, egg: 30, hydrolyzed: 30, gainer: 20, snacks: 6, special: 30 };
      const defaultFlavorBy = { whey: 'Chocolate', isolate: 'Vanilla', concentrate: 'Chocolate', casein: 'Cookies & Cream', plant: 'Chocolate', egg: 'Unflavoured', hydrolyzed: 'Mango', gainer: 'Chocolate', snacks: 'Choco Crunch', special: 'Vanilla' };
      const highlightsBy = {
        whey: ['24g protein per serving', 'Fast absorption', 'Mixes easily'],
        isolate: ['Ultra low carbs', 'Fastest absorption', 'Lactose minimized'],
        concentrate: ['Great taste', 'Budget friendly', 'Daily protein support'],
        casein: ['Slow release', 'Night-time recovery', 'Anti-catabolic'],
        plant: ['Dairy-free', 'Complete amino profile', 'Digestive enzymes'],
        egg: ['Complete protein', 'Dairy-free', 'Lean formula'],
        hydrolyzed: ['Pre-digested peptides', 'Ultra fast absorption', 'Low lactose'],
        gainer: ['High calories', 'Balanced macros', 'Added vitamins'],
        snacks: ['On-the-go protein', 'Tasty and filling', 'Snack smart'],
        special: ['Performance focused', 'Recovery support', 'Premium ingredients']
      };
      const nutritionBy = {
        whey: { calories: 120, protein: 24, carbs: 3, fat: 2 },
        isolate: { calories: 110, protein: 26, carbs: 1, fat: 1 },
        concentrate: { calories: 130, protein: 22, carbs: 4, fat: 3 },
        casein: { calories: 130, protein: 24, carbs: 3, fat: 2 },
        plant: { calories: 130, protein: 22, carbs: 5, fat: 2 },
        egg: { calories: 120, protein: 24, carbs: 2, fat: 1 },
        hydrolyzed: { calories: 115, protein: 25, carbs: 1, fat: 1 },
        gainer: { calories: 380, protein: 20, carbs: 70, fat: 5 },
        snacks: { calories: 220, protein: 15, carbs: 20, fat: 8 },
        special: { calories: 120, protein: 24, carbs: 2, fat: 2 }
      };

      const product = {
        name,
        description: desc,
        price,
        category,
        images: [
          `https://via.placeholder.com/600x600?text=${imgText}`
        ],
        stock: 100,
        rating: 5,
        flavor: defaultFlavorBy[group] || 'Unflavoured',
        servings: servingsBy[group] || 30,
        highlights: highlightsBy[group] || ['High quality supplement'],
        nutrition: nutritionBy[group] || { calories: 120, protein: 24, carbs: 3, fat: 2 }
      };
      products.push(product);
      existingNames.add(name.toLowerCase());
      added++;
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(products, null, 2));
  console.log(`Generated ${added} new products. Total now: ${products.length}`);
}

main();
