// Shared frontend utilities for FitFuel
const API_BASE = window.FITFUEL_API_BASE || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('fitfuel_token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('fitfuel_token', token);
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('fitfuel_user') || 'null'); } catch { return null; }
}

function logout() {
  localStorage.removeItem('fitfuel_token');
  localStorage.removeItem('fitfuel_user');
  // optional: also clear local cart on logout? keep for now
  location.reload();
}

async function authFetch(path, options = {}) {
  // Safety: normalize accidental orderNumber paths to orders endpoint.
  try {
    if (typeof path === 'string') {
      // Case 1: path like '/o_abc'
      if (/^\/o_[A-Za-z0-9_-]+$/.test(path)) {
        path = `/orders/${path.slice(1)}`;
      }
      // Case 2: absolute URL containing '/api/o_...'
      else if (/^https?:\/\//i.test(path) && /\/api\/o_[A-Za-z0-9_-]+/i.test(path)) {
        const url = new URL(path);
        url.pathname = url.pathname.replace(/\/api\/o_([A-Za-z0-9_-]+)/i, '/api/orders/o_$1');
        path = url.toString().replace(API_BASE, '');
      }
      // Case 3: any string containing '/api/o_' relative to API_BASE
      else if (/\/api\/o_[A-Za-z0-9_-]+/i.test(path)) {
        path = path.replace(/\/api\/o_([A-Za-z0-9_-]+)/i, '/api/orders/o_$1');
      }
    }
  } catch {}
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

// Auth
async function apiRegister({ name, email, password }) {
  return authFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

async function apiLogin({ email, password }) {
  const data = await authFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token);
  localStorage.setItem('fitfuel_user', JSON.stringify(data.user));
  return data;
}

// Products
async function apiListProducts({ search = '', category = '', page = 1, pageSize = 12 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  const qs = params.toString();
  const res = await authFetch(`/products${qs ? `?${qs}` : ''}`);
  // Normalize legacy array response to paginated shape
  if (Array.isArray(res)) {
    return { items: res, total: res.length, page, pageSize };
  }
  return res;
}

async function apiGetProduct(id) {
  return authFetch(`/products/${id}`);
}

// Cart
async function apiGetCart() {
  return authFetch('/cart');
}

async function apiAddToCart({ productId, quantity = 1 }) {
  return authFetch('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
}

// Helpers for UI
function showToast(msg) {
  alert(msg);
}

// Global cart helpers for frontend pages
function getLocalCart() {
  return JSON.parse(localStorage.getItem('fitfuel_cart')) || [];
}

function setLocalCart(cart) {
  localStorage.setItem('fitfuel_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getLocalCart();
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = String(cart.length);
}

// Add to cart that chooses API if logged-in, else local
async function addToCart(name, price, img, productId, quantity = 1) {
  try {
    const token = getToken();
    if (token && productId) {
      await apiAddToCart({ productId, quantity });
      showToast('Added to cart');
      return;
    }
    // Fallback to local storage
    const cart = getLocalCart();
    cart.push({ name, price, img, productId: productId || null, quantity });
    setLocalCart(cart);
    updateCartCount();
    showToast(`${name} added to cart!`);
  } catch (e) {
    console.error(e);
    showToast(e.message || 'Failed to add to cart');
  }
}

// Simple header auth state updater: looks for elements by IDs if present
function updateAuthHeader() {
  const user = getUser();
  const loginLink = document.getElementById('auth-login-link');
  const userName = document.getElementById('auth-user-name');
  const logoutLink = document.getElementById('auth-logout-link');
  if (user) {
    if (loginLink) loginLink.style.display = 'none';
    if (userName) userName.textContent = user.name || user.email || 'Account';
    if (logoutLink) logoutLink.style.display = 'inline';
  } else {
    if (loginLink) loginLink.style.display = 'inline';
    if (userName) userName.textContent = '';
    if (logoutLink) logoutLink.style.display = 'none';
  }
}

function fixPlaceholderImages() {
  try {
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      if (img && typeof img.src === 'string' && img.src.includes('via.placeholder.com')) {
        img.src = img.src.replace('via.placeholder.com', 'placehold.co');
      }
      // Fix malformed src like '64x64' or '//64x64' by converting to placehold URL
      try {
        const src = img.getAttribute('src') || '';
        const sizeOnly = src.match(/^\s*\/?(\d{2,4})x(\d{2,4})\s*$/);
        if (sizeOnly) {
          const w = sizeOnly[1], h = sizeOnly[2];
          img.src = `https://placehold.co/${w}x${h}?text=Item`;
        }
      } catch {}
      img && img.addEventListener('error', () => {
        if (!img.src.includes('placehold.co')) {
          const size = `${img.width || 80}x${img.height || 80}`;
          img.src = `https://placehold.co/${size}?text=Item`;
        }
      }, { once: true });
    });
  } catch {}
}

function ensureFavicon() {
  try {
    const existing = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (existing) return;
    // Minimal inline SVG favicon (indigo circle with F)
    const svg = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
        <rect width='64' height='64' rx='12' ry='12' fill='#4f46e5'/>
        <text x='20' y='42' font-family='Arial,Helvetica,sans-serif' font-size='36' fill='white' font-weight='700'>F</text>
      </svg>`);
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = `data:image/svg+xml,${svg}`;
    document.head.appendChild(link);
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  try { updateAuthHeader(); } catch {}
  try { fixPlaceholderImages(); } catch {}
  try { ensureFavicon(); } catch {}
});

// Category-based local fallbacks (add these files under /assets/images/ to see real images)
window.FITFUEL_IMAGE_FALLBACKS = Object.assign({
  protein: '/assets/images/protein.jpg',
  gainer: '/assets/images/gainer.jpg',
  amino: '/assets/images/amino.jpg',
  preworkout: '/assets/images/preworkout.jpg',
  vitamin: '/assets/images/vitamin.jpg',
  health: '/assets/images/health.jpg',
  snack: '/assets/images/snack.jpg',
  performance: '/assets/images/performance.jpg',
  carb: '/assets/images/carb.jpg',
  default: '/assets/images/default-product.jpg'
}, (window.FITFUEL_IMAGE_FALLBACKS||{}));

// Return best image URL for a product (prefers real image, then category fallback, then placeholder)
function productImageUrl(p, size = '400x400') {
  try {
    const imgs = Array.isArray(p && p.images) ? p.images : [];
    const first = imgs.find(u => typeof u === 'string' && u.trim().length) || '';
    const isPlaceholder = /placeholder\.com|placehold\.co/i.test(first);
    if (first && !isPlaceholder) return first;
    const cat = String(p && p.category || '').toLowerCase();
    const local = (window.FITFUEL_IMAGE_FALLBACKS && window.FITFUEL_IMAGE_FALLBACKS[cat]) || (window.FITFUEL_IMAGE_FALLBACKS && window.FITFUEL_IMAGE_FALLBACKS.default);
    return local || `https://placehold.co/${size}?text=Product`;
  } catch {
    return `https://placehold.co/${size}?text=Product`;
  }
}

// Wishlist API
async function apiGetWishlist() { return authFetch('/wishlist'); }
async function apiAddWishlist(productId) { return authFetch('/wishlist/add', { method: 'POST', body: JSON.stringify({ productId }) }); }
async function apiRemoveWishlist(productId) { return authFetch(`/wishlist/remove/${productId}`, { method: 'DELETE' }); }

// Orders API
async function apiPlaceOrder(order) { return authFetch('/orders', { method: 'POST', body: JSON.stringify(order) }); }
async function apiListOrders() { return authFetch('/orders'); }
