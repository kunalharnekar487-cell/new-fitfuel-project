// Elements (new cart.html structure)
const listEl = document.getElementById('cart-list');
const emptyEl = document.getElementById('cart-empty');
const subtotalEl = document.getElementById('subtotal');
const grandTotalEl = document.getElementById('grand-total');
const shippingEl = document.getElementById('shipping');

const SHIPPING_FLAT = 0; // Adjust if you want shipping cost

function getCart() {
  const raw = localStorage.getItem('fitfuel_cart');
  try { return JSON.parse(raw) || []; } catch { return []; }
}

function setCart(items) {
  localStorage.setItem('fitfuel_cart', JSON.stringify(items));
}

function computeTotals(items) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const shipping = items.length ? SHIPPING_FLAT : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function formatINR(n) { return `₹${(Number(n) || 0).toLocaleString('en-IN')}`; }

function renderCart() {
  const items = getCart();
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = items.reduce((c, it) => c + (Number(it.quantity) || 1), 0);

  listEl.innerHTML = '';

  if (!items.length) {
    emptyEl.style.display = 'flex';
    subtotalEl.textContent = formatINR(0);
    shippingEl.textContent = formatINR(0);
    grandTotalEl.textContent = formatINR(0);
    if (typeof updateCartCount === 'function') updateCartCount();
    return;
  }
  emptyEl.style.display = 'none';

  items.forEach((item, index) => {
    const qty = Number(item.quantity) || 1;
    const node = document.createElement('div');
    node.className = 'cart-item';
    node.innerHTML = `
      <img class="cart-item-img" src="${item.img || 'https://via.placeholder.com/120x120'}" alt="${item.name || 'Product'}" />
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name || 'Product'}</h4>
        <div class="cart-item-price">${formatINR(item.price || 0)}</div>
        <div class="cart-item-actions">
          <button class="qty-btn" data-act="dec" data-index="${index}">−</button>
          <span class="qty">${qty}</span>
          <button class="qty-btn" data-act="inc" data-index="${index}">+</button>
          <button class="remove-btn" data-act="remove" data-index="${index}">Remove</button>
        </div>
      </div>
      <div class="cart-item-line">${formatINR((Number(item.price)||0) * qty)}</div>
    `;
    listEl.appendChild(node);
  });

  const totals = computeTotals(items);
  subtotalEl.textContent = formatINR(totals.subtotal);
  shippingEl.textContent = formatINR(totals.shipping);
  grandTotalEl.textContent = formatINR(totals.total);

  // Delegate actions
  listEl.onclick = (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.dataset.index);
    const act = btn.dataset.act;
    const current = getCart();
    if (!(idx in current)) return;
    if (act === 'inc') current[idx].quantity = (Number(current[idx].quantity) || 1) + 1;
    if (act === 'dec') current[idx].quantity = Math.max(1, (Number(current[idx].quantity) || 1) - 1);
    if (act === 'remove') current.splice(idx, 1);
    setCart(current);
    renderCart();
    if (typeof updateCartCount === 'function') updateCartCount();
  };
}

function checkout() {
  const items = getCart();
  if (!items.length) { alert('Your cart is empty.'); return; }
  alert('Thank you for your purchase!');
  localStorage.removeItem('fitfuel_cart');
  renderCart();
  if (typeof updateCartCount === 'function') updateCartCount();
}

// Backward compatible APIs
function addToCart(name, price, img) {
  const items = getCart();
  // If same product exists, bump qty
  const idx = items.findIndex(it => it.name === name && it.price === price);
  if (idx >= 0) items[idx].quantity = (Number(items[idx].quantity) || 1) + 1;
  else items.push({ name, price, img, quantity: 1 });
  setCart(items);
  if (typeof updateCartCount === 'function') updateCartCount();
}

function updateCartCount() {
  const items = getCart();
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = items.reduce((c, it) => c + (Number(it.quantity) || 1), 0);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateCartCount();
  const btn = document.getElementById('checkout-btn');
  if (btn) btn.addEventListener('click', checkout);
});
