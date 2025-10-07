// wallet.js

let walletBalance = parseFloat(localStorage.getItem("fitfuel_wallet")) || 0;
let walletHistory = JSON.parse(localStorage.getItem("fitfuel_wallet_history")) || [];
// Simple auth check (aligns with app.js localStorage user)
function getAuthUser() {
  try { return JSON.parse(localStorage.getItem('fitfuel_user') || 'null'); } catch { return null; }
}
function setAuthUser(u) {
  localStorage.setItem('fitfuel_user', JSON.stringify(u));
}
// Limits & config
const WALLET_CFG = {
  MIN_TXN: 10,           // minimum amount per transaction
  MAX_TXN: 10000,        // maximum amount per transaction
  DAILY_CAP: 20000,      // daily total add cap
  COOLDOWN_MS: 30_000,   // 30 seconds between add requests
};
let lastAddAttemptAt = parseInt(localStorage.getItem('fitfuel_wallet_lastAddTs') || '0', 10);
function todayKey() { return new Date().toISOString().slice(0,10); }
function getDailyTotal() {
  const map = JSON.parse(localStorage.getItem('fitfuel_wallet_dailyTotals') || '{}');
  return Number(map[todayKey()] || 0);
}
function bumpDailyTotal(amount) {
  const map = JSON.parse(localStorage.getItem('fitfuel_wallet_dailyTotals') || '{}');
  map[todayKey()] = Number(map[todayKey()] || 0) + amount;
  localStorage.setItem('fitfuel_wallet_dailyTotals', JSON.stringify(map));
}

const walletBalanceEl = document.getElementById("wallet-balance");
const transactionListEl = document.getElementById("transaction-list");
// Modal elements (optional)
const modal = document.getElementById('wallet-modal');
const amountInput = document.getElementById('amount-input');
const methodSelect = document.getElementById('method-select');
const upiInput = document.getElementById('upi-input');
const phoneInput = document.getElementById('phone-input');
const sendOtpBtn = document.getElementById('send-otp-btn');
const otpSentNote = document.getElementById('otp-sent-note');
const otpInput = document.getElementById('otp-input');
const confirmAddBtn = document.getElementById('confirm-add-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');

function updateWalletDisplay() {
  walletBalanceEl.textContent = walletBalance.toFixed(2);

  transactionListEl.innerHTML = "";
  walletHistory.slice().reverse().forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="p-3 border rounded ${entry.type === 'Credited' ? 'bg-green-50' : 'bg-red-50'}">
        <strong>${entry.type}</strong>: ₹${entry.amount}
        <div class="text-xs text-gray-700 mt-1">
          Method: ${entry.method || '-'} | Txn: ${entry.txnId || '-'} | Status: ${entry.status || 'Success'}
        </div>
        <span class="text-xs text-gray-500">${entry.date}</span>
      </div>
    `;
    transactionListEl.appendChild(li);
  });
}

function openWalletModal() {
  if (!modal) return false;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  // Prefill
  const user = getAuthUser();
  if (user && user.phone && phoneInput) phoneInput.value = user.phone;
  if (amountInput) amountInput.value = '';
  if (upiInput) upiInput.value = '';
  if (otpInput) otpInput.value = '';
  if (otpSentNote) otpSentNote.classList.add('hidden');
  return true;
}

function closeWalletModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Validate amount and limits
function validateAmountAndLimits(amount) {
  const now = Date.now();
  const since = now - lastAddAttemptAt;
  if (since < WALLET_CFG.COOLDOWN_MS) {
    const wait = Math.ceil((WALLET_CFG.COOLDOWN_MS - since)/1000);
    alert(`Please wait ${wait}s before making another add-money attempt.`);
    return { ok:false };
  }
  if (!Number.isFinite(amount)) { alert('Invalid amount.'); return { ok:false }; }
  if (amount < WALLET_CFG.MIN_TXN || amount > WALLET_CFG.MAX_TXN) {
    alert(`Amount must be between ₹${WALLET_CFG.MIN_TXN} and ₹${WALLET_CFG.MAX_TXN}.`);
    return { ok:false };
  }
  const todaysTotal = getDailyTotal();
  if (todaysTotal + amount > WALLET_CFG.DAILY_CAP) {
    alert(`Daily limit exceeded. You can add ₹${(WALLET_CFG.DAILY_CAP - todaysTotal).toFixed(2)} more today.`);
    return { ok:false };
  }
  return { ok:true };
}

function addMoney() {
  // If modal exists, use it
  const usedModal = openWalletModal();
  if (usedModal) return;
  // Fallback to prompt flow
  // Auth required
  const user = getAuthUser();
  if (!user) { alert('Please log in to add money to your wallet.'); return; }
  // Continue with previous prompt-based flow if no modal available
  // (We keep it for compatibility)
  // For brevity, encourage using the modal.
  alert('Please use the modal to add money.');
}

// Wire modal buttons if present
if (modal) {
  cancelModalBtn && cancelModalBtn.addEventListener('click', closeWalletModal);
  sendOtpBtn && sendOtpBtn.addEventListener('click', () => {
    const user = getAuthUser();
    if (!user) { alert('Please log in to add money to your wallet.'); return; }
    // Amount pre-check
    let amount = Number(amountInput && amountInput.value);
    amount = Math.round((amount || 0) * 100)/100;
    const v = validateAmountAndLimits(amount);
    if (!v.ok) return;
    const M = (methodSelect && methodSelect.value || 'upi').toLowerCase();
    if (M !== 'upi') { alert('OTP is required only for UPI in this demo.'); return; }
    const upi = upiInput && upiInput.value;
    if (!upi || !/^[\w\.\-]{2,}@[\w\.\-]{2,}$/.test(upi)) { alert('Invalid UPI ID.'); return; }
    if (!user.phone) {
      const phone = (phoneInput && phoneInput.value) || '';
      if (!/^[0-9]{10}$/.test(phone)) { alert('Enter valid 10-digit phone.'); return; }
      user.phone = phone;
      setAuthUser(user);
    }
    const otpCode = String(Math.floor(100000 + Math.random()*900000));
    const otpData = { code: otpCode, exp: Date.now() + 5*60*1000 };
    localStorage.setItem('fitfuel_wallet_otp', JSON.stringify(otpData));
    if (otpSentNote) otpSentNote.classList.remove('hidden');
    const masked = user.phone.replace(/^(\d{2})\d{6}(\d{2})$/, '+91-$1******$2');
    alert(`OTP sent to ${masked}. (Simulation)`);
  });

  confirmAddBtn && confirmAddBtn.addEventListener('click', () => {
    const user = getAuthUser();
    if (!user) { alert('Please log in to add money to your wallet.'); return; }
    let amount = Number(amountInput && amountInput.value);
    amount = Math.round((amount || 0) * 100)/100;
    const v = validateAmountAndLimits(amount);
    if (!v.ok) return;
    const M = (methodSelect && methodSelect.value || 'upi').toLowerCase();
    if (!['upi','card','netbanking'].includes(M)) { alert('Unsupported payment method.'); return; }
    // OTP verify for UPI
    if (M === 'upi') {
      const otp = otpInput && otpInput.value;
      try {
        const saved = JSON.parse(localStorage.getItem('fitfuel_wallet_otp') || 'null');
        if (!saved) { alert('OTP not generated. Please Send OTP first.'); return; }
        if (Date.now() > saved.exp) { alert('OTP expired. Please request again.'); return; }
        if (otp !== saved.code) { alert('Invalid OTP. Payment failed.'); return; }
      } catch { alert('OTP verification failed.'); return; }
    }
    // Process success
    const now = Date.now();
    lastAddAttemptAt = now;
    localStorage.setItem('fitfuel_wallet_lastAddTs', String(lastAddAttemptAt));
    const txnId = 'TXN' + Math.random().toString(36).slice(2,10).toUpperCase();
    walletBalance += amount;
    saveTransaction('Credited', amount, { method: M.toUpperCase(), txnId, status: 'Success' });
    bumpDailyTotal(amount);
    updateWalletDisplay();
    closeWalletModal();
    alert(`₹${amount.toFixed(2)} added successfully!\nTxn: ${txnId}`);
  });
}

function saveTransaction(type, amount, extra = {}) {
  const transaction = {
    type,
    amount: amount.toFixed(2),
    date: new Date().toLocaleString(),
    ...extra,
  };
  walletHistory.push(transaction);
  localStorage.setItem("fitfuel_wallet", walletBalance.toFixed(2));
  localStorage.setItem("fitfuel_wallet_history", JSON.stringify(walletHistory));
}

updateWalletDisplay();
