/*
  Import products from a JSON file into MongoDB (Product collection).
  Usage:
    node scripts/importProducts.js [path/to/products.json]

  The JSON file should be an array of objects with fields compatible with models/Product.js:
    { name, description, price, category, images, stock, rating, flavor, servings, highlights, nutrition }
*/

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

async function main() {
  const fileArg = process.argv[2] || path.join(__dirname, '..', 'data', 'products.json');
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitfuel';

  if (!fs.existsSync(fileArg)) {
    console.error(`Input file not found: ${fileArg}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(fileArg, 'utf8');
  let items;
  try {
    items = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error('No items to import. Expected a non-empty JSON array.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let updated = 0;

  for (const it of items) {
    if (!it || !it.name || typeof it.price !== 'number') {
      console.warn('Skipping invalid item (requires name and numeric price):', it);
      continue;
    }

    const doc = {
      name: String(it.name).trim(),
      description: it.description || '',
      price: Number(it.price),
      category: it.category || 'misc',
      images: Array.isArray(it.images) ? it.images : [],
      stock: typeof it.stock === 'number' ? it.stock : 0,
      // Force all products to 5-star rating
      rating: 5,
      // Optional richer fields
      flavor: it.flavor || undefined,
      servings: typeof it.servings === 'number' ? it.servings : undefined,
      highlights: Array.isArray(it.highlights) ? it.highlights : undefined,
      nutrition: it.nutrition || undefined,
    };

    const existing = await Product.findOne({ name: doc.name });
    if (existing) {
      await Product.updateOne({ _id: existing._id }, { $set: doc });
      updated++;
    } else {
      await Product.create(doc);
      created++;
    }
  }

  console.log(`Import complete. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
  console.log('Disconnected');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
