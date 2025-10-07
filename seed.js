/*
  Seed script to populate the MongoDB database with sample products.
  Usage:
    npm run seed
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitfuel';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const sample = [
      { name: 'FitFuel Whey Protein Isolate', description: 'High-quality whey isolate', price: 1899, category: 'protein', images: [], stock: 50, rating: 4.6 },
      { name: 'FitFuel Creatine Monohydrate', description: 'Micronized creatine', price: 899, category: 'performance', images: [], stock: 100, rating: 4.5 },
      { name: 'FitFuel Pre-Workout Blast', description: 'Energy and focus', price: 1299, category: 'preworkout', images: [], stock: 60, rating: 4.3 },
      { name: 'FitFuel Mass Gainer Pro', description: 'Calorie-dense gainer', price: 2499, category: 'gainer', images: [], stock: 30, rating: 4.2 },
      { name: 'FitFuel BCAA Recovery', description: 'Amino acids for recovery', price: 999, category: 'amino', images: [], stock: 80, rating: 4.1 },
      { name: 'FitFuel Multivitamin', description: 'Daily micronutrient support', price: 599, category: 'vitamin', images: [], stock: 150, rating: 4.0 },
    ];

    // Clear then insert
    await Product.deleteMany({});
    const created = await Product.insertMany(sample);
    console.log(`Inserted ${created.length} products`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
