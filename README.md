# FitFuel - Gym Supplements E-commerce Platform (Node.js + MongoDB)

Modernized e-commerce starter focused on gym supplements. Backend is now Node.js (Express) with MongoDB via Mongoose. PHP, XAMPP, and MySQL artifacts were removed.

## Features

- **User Management**: Registration and login with JWT
- **Product Catalog**: Query products by search and category
- **Shopping Cart**: Add and list cart items per user
- **Wallet (Local only)**: Demo wallet persisted in browser `localStorage`

## Project Structure

```
Fitfuel-project-main/
├── models/
│   ├── User.js
│   ├── Product.js
│   └── CartItem.js
├── routes/
│   ├── auth.js        # /api/auth
│   ├── products.js    # /api/products
│   └── cart.js        # /api/cart
├── server.js          # Express server + MongoDB connection
├── .env.example       # Environment variables template
├── index.html         # Frontend static pages (no PHP)
└── ...                # Other HTML/CSS/JS assets
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Configure environment
   - Copy `.env.example` to `.env`
   - Set `MONGO_URI` (e.g., `mongodb://127.0.0.1:27017/fitfuel`)
   - Set a strong `JWT_SECRET`

3. Seed data (optional quick start)
   - Insert a few `Product` documents in your MongoDB `fitfuel` database to see products on the frontend.

4. Run the server
   ```bash
   npm run dev
   ```
   Server runs at: http://localhost:5000

5. Open the static frontend
   - Open `index.html` (and other `.html` pages) in your browser directly or serve statically.

## API Endpoints

### Auth
- `POST /api/auth/register` { name, email, password }
- `POST /api/auth/login` { email, password } → `{ token, user }`

### Products
- `GET /api/products`
  - Query params: `search`, `category`

### Cart (requires Authorization: Bearer <token>)
- `GET /api/cart`
- `POST /api/cart/add` { productId, quantity }

## Notes

- PHP/XAMPP and MySQL files were removed from the stack. The backend is fully Node.js + MongoDB.
- Frontend is static and uses `localStorage` for cart and wallet demo. You can wire it to call the new API endpoints as needed.

## Scripts

- `npm run dev` — start Express in dev mode
- `npm start` — start Express in production mode

## Security

- Passwords hashed with `bcrypt`
- JWT-based auth
- CORS enabled

## Backend Setup Guide

This guide explains how to configure and run the backend API using MongoDB (local or Atlas) and Node.js.

### 1) Prerequisites

- Node.js 18+
- npm (bundled with Node.js)
- MongoDB Community Server (for local) or a MongoDB Atlas cluster

### 2) Install Dependencies

```bash
npm install
```

### 3) Environment Variables

Copy `.env.example` to `.env` in the project root and fill in the values.

Required variables:

- `PORT` — API server port (default: 5000)
- `MONGO_URI` — your MongoDB connection string
  - Local example: `mongodb://127.0.0.1:27017/fitfuel`
  - Atlas example: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/fitfuel`
- `JWT_SECRET` — a strong secret for signing JWTs

Example `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fitfuel
JWT_SECRET=replace_with_a_strong_random_secret
```

Where this is used:

- `server.js` reads `MONGO_URI` and connects via `mongoose.connect(...)` before starting Express.
- `scripts/seed.js` also reads `MONGO_URI` to insert sample products.

### 4) Connect to MongoDB

You can use either a local MongoDB instance or MongoDB Atlas (cloud).

#### Option A: Local MongoDB (Windows)

1. Install MongoDB Community Server from the official MongoDB website.
2. Ensure the MongoDB service is running (default port 27017).
3. (Optional) Install MongoDB Compass to view your data.
4. Set in `.env`:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/fitfuel
   ```

#### Option B: MongoDB Atlas

1. Create a free cluster on MongoDB Atlas.
2. Create a database user with username/password.
3. Add your IP to the network access allowlist (0.0.0.0/0 for quick testing; restrict later).
4. Copy the connection string (`mongodb+srv://...`).
5. Set in `.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fitfuel
   ```

### 5) Run the Server

```bash
npm run dev
```

- On success, you should see `Connected to MongoDB` in the console.
- Health check: open `http://localhost:5000/api/ping`.

### 6) Seed Sample Data (Optional)

To quickly populate `Product` documents for testing:

```bash
npm run seed
```

This runs `scripts/seed.js`, which clears existing products and inserts a small sample set.

### 7) Test API Endpoints

Common routes (see `routes/` and `server.js`):

- Auth
  - `POST /api/auth/register` — `{ name, email, password }`
  - `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- Products
  - `GET /api/products` — query with `?search=` and/or `?category=`
- Cart (requires `Authorization: Bearer <token>`)
  - `GET /api/cart`
  - `POST /api/cart/add` — `{ productId, quantity }`
- Health check
  - `GET /api/ping`

Use a tool like Postman, Insomnia, or curl to invoke endpoints.

### 8) Available Scripts

- `npm run dev` — start server in development mode
- `npm start` — start server in production mode
- `npm run seed` — seed sample products into MongoDB

### 9) Troubleshooting

- Connection refused / timeouts
  - Local: ensure MongoDB Windows service is running and listening on `27017`.
  - Atlas: verify IP allowlist, credentials, and that the cluster is in a ready state.
- Auth errors (Atlas)
  - Re-check username/password in `MONGO_URI` and user’s database permissions.
- DNS/SRV issues for `mongodb+srv://`
  - Ensure internet/DNS are working. Consider using the standard (non-SRV) connection string provided by Atlas.
- TLS/SSL errors
  - Use the default Atlas URI parameters; avoid altering TLS options unless required.

### 10) Project Structure (Backend Highlights)

```
Fitfuel-project-main/
├── models/             # Mongoose models (User, Product, CartItem, WishlistItem, Order)
├── routes/             # Express routes (auth, products, cart, wishlist, orders, users)
├── scripts/
│   └── seed.js         # Seed script for Product data
├── server.js           # App entry; loads env, connects MongoDB, mounts routes
├── .env.example        # Environment template
└── README.md           # You are here
```

If you get stuck, share your `.env` (without secrets) and logs from the terminal for targeted help.
