#!/usr/bin/env node
/**
 * Update product images in MongoDB.
 *
 * Usage examples:
 *  node scripts/updateProductImages.js --id 68e4d9136295687e45ca4414 --images "/assets/images/pure-whey.jpg,https://cdn.example.com/pure-whey-2.jpg"
 *  node scripts/updateProductImages.js --name "Pure Whey" --images "/assets/images/pure-whey.jpg"
 *  node scripts/updateProductImages.js --category protein --default "/assets/images/protein.jpg" --only-missing
 *
 * Notes:
 * - MONGO_URI is read from .env (fallback: mongodb://127.0.0.1:27017/fitfuel)
 * - Images field is an array of strings. The UI uses images[0] as the main image.
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitfuel';

// Simple args parser
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.startsWith('--') ? cur.replace(/^--/, '').split('=') : [cur, true];
  acc[k] = v === undefined ? true : v;
  return acc;
}, {});

function parseCsv(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function run() {
  const { id, name, category, images, default: defaultImg, 'only-missing': onlyMissing } = args;
  const imageList = parseCsv(images);

  if (!id && !name && !category) {
    console.error('Provide one of: --id <id> | --name "Exact Name" | --category <name>');
    process.exit(1);
  }

  if ((id || name) && imageList.length === 0) {
    console.error('Provide --images "url1,url2" when updating a specific product by id or name');
    process.exit(1);
  }

  if (category && !defaultImg) {
    console.error('Provide --default "/assets/images/<file>.jpg" when updating by --category');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

  let filter = null;
  if (id) filter = { _id: new mongoose.Types.ObjectId(id) };
  else if (name) filter = { name };
  else if (category) filter = { category };

  if (id || name) {
    const update = { $set: { images: imageList } };
    const res = await Product.updateOne(filter, update);
    console.log('Updated', res.matchedCount, 'product(s).');
  } else if (category) {
    const cat = String(category).toLowerCase();
    const q = onlyMissing ? { ...filter, $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] } : filter;
    const res = await Product.updateMany(q, { $set: { images: [defaultImg] } });
    console.log(`Updated ${res.modifiedCount} product(s) in category '${cat}'${onlyMissing ? ' (only missing)' : ''}.`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
