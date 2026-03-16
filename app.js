const AUTH_KEY = 'health-ai-auth-v1';

const els = {
  authView: document.getElementById('authView'),
  appView: document.getElementById('appView'),
  tabMobile: document.getElementById('tabMobile'),
  tabEmail: document.getElementById('tabEmail'),
  mobileField: document.getElementById('mobileField'),
  emailField: document.getElementById('emailField'),
  authForm: document.getElementById('authForm'),
  googleLogin: document.getElementById('googleLogin'),
  appleLogin: document.getElementById('appleLogin'),
  authError: document.getElementById('authError'),
  otpField: document.getElementById('otpField'),
  otpInput: document.getElementById('otpInput'),
  continueBtn: document.getElementById('continueBtn'),
  verifyOtpBtn: document.getElementById('verifyOtpBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  scanForm: document.getElementById('scanForm'),
  previewScan: document.getElementById('previewScan'),
  addFromPreview: document.getElementById('addFromPreview'),
  scanResult: document.getElementById('scanResult'),
  manualForm: document.getElementById('manualForm'),
  barcodeForm: document.getElementById('barcodeForm'),
  barcodeStatus: document.getElementById('barcodeStatus'),
  mealList: document.getElementById('mealList'),
  insights: document.getElementById('insights'),
  addWater: document.getElementById('addWater'),
  greeting: document.getElementById('greeting'),
  kcalLine: document.getElementById('kcalLine'),
  streakCount: document.getElementById('streakCount'),
  spentInr: document.getElementById('spentInr'),
  remainingInr: document.getElementById('remainingInr'),
  ringCalories: document.getElementById('ringCalories'),
  ringProtein: document.getElementById('ringProtein'),
  ringCarbs: document.getElementById('ringCarbs'),
  ringWater: document.getElementById('ringWater'),
  ringCaloriesText: document.getElementById('ringCaloriesText'),
  ringProteinText: document.getElementById('ringProteinText'),
  ringCarbsText: document.getElementById('ringCarbsText'),
  ringWaterText: document.getElementById('ringWaterText'),
  chatInput: document.getElementById('chatInput'),
  chatSend: document.getElementById('chatSend'),
  voiceBtn: document.getElementById('voiceBtn'),
  chatBox: document.getElementById('chatBox'),
  scanPhotoBtn: document.getElementById('scanPhotoBtn'),
  dietForm: document.getElementById('dietForm'),
  dietPlanBox: document.getElementById('dietPlanBox'),
  loadWeekly: document.getElementById('loadWeekly'),
  weeklyBox: document.getElementById('weeklyBox'),
};

let authMode = 'mobile';
let pendingLoginId = '';
let pendingScanEstimate = null;
let memoryAuth = false;

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[ch]));
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function isLoggedIn() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1' || memoryAuth;
  } catch {
    return memoryAuth;
  }
}

function setLoggedIn(flag) {
  memoryAuth = Boolean(flag);
  try {
    if (flag) localStorage.setItem(AUTH_KEY, '1');
    else localStorage.removeItem(AUTH_KEY);
  } catch {}
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  els.authView.classList.toggle('hidden', loggedIn);
  els.appView.classList.toggle('hidden', !loggedIn);
}

function setMode(mode) {
  authMode = mode;
  const mobile = mode === 'mobile';
  els.tabMobile.classList.toggle('active', mobile);
  els.tabEmail.classList.toggle('active', !mobile);
  els.mobileField.classList.toggle('hidden', !mobile);
  els.emailField.classList.toggle('hidden', mobile);
}

function percent(value, goal) {
  if (!goal) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(value) / Number(goal)) * 100)));
}

function setRing(el, pct, color) {
  el.style.background = `conic-gradient(${color} ${pct * 3.6}deg, rgba(148,163,184,.22) 0deg)`;
}

function formatCurrency(value) {
  return `Rs${Math.max(0, Math.round(value))}`;
}

function estimateMealCost(meal) {
  return Math.round((Number(meal.calories || 0) * 0.16) + 20);
}

function appendChat(line) {
  els.chatBox.innerHTML += `<p>${escapeHtml(line)}</p>`;
  els.chatBox.scrollTop = els.chatBox.scrollHeight;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

async function sendChatMessage(message) {
  const msg = String(message || '').trim();
  if (!msg) return;
  appendChat(`You: ${msg}`);
  const data = await api('/api/chat', { method: 'POST', body: { message: msg } });
  appendChat(`Coach: ${data.reply}`);
  speak(data.reply);
}

function showError(error) {
  els.insights.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
}

async function refresh() {
  const [dashboard, meals] = await Promise.all([api('/api/dashboard'), api('/api/meals')]);
  const profile = dashboard.profile;
  const totals = dashboard.totals;
  const remainingCalories = Math.max(0, profile.calorieTarget - totals.calories);

  els.greeting.textContent = `Good ${new Date().getHours() < 12 ? 'Morning' : 'Evening'} ${profile.name || 'Friend'}`;
  els.kcalLine.textContent = `You have ${remainingCalories} kcal remaining today`;
  els.streakCount.textContent = String(Math.min(30, Math.max(1, totals.count + (dashboard.waterMl > 0 ? 1 : 0))));

  setRing(els.ringCalories, percent(totals.calories, profile.calorieTarget), '#6366f1');
  setRing(els.ringProtein, percent(totals.protein, profile.proteinGoal), '#22c55e');
  setRing(els.ringCarbs, percent(totals.carbs, profile.carbGoal), '#f59e0b');
  setRing(els.ringWater, percent(dashboard.waterMl, 2500), '#06b6d4');

  els.ringCaloriesText.textContent = `${totals.calories}/${profile.calorieTarget}`;
  els.ringProteinText.textContent = `${totals.protein}/${profile.proteinGoal}g`;
  els.ringCarbsText.textContent = `${totals.carbs}/${profile.carbGoal}g`;
  els.ringWaterText.textContent = `${dashboard.waterMl}ml`;

  const spent = meals.reduce((sum, meal) => sum + estimateMealCost(meal), 0);
  els.spentInr.textContent = formatCurrency(spent);
  els.remainingInr.textContent = formatCurrency((profile.budgetInr || 0) - spent);

  els.insights.innerHTML = (dashboard.insights || [])
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('') || '<p class="muted">Stay consistent. You got this.</p>';

  els.mealList.innerHTML = meals.map((meal) => `
    <li>
      <span>
        <b>${escapeHtml(meal.name)}</b><br>
        <small class="muted">${escapeHtml(meal.mealType)} | ${escapeHtml(meal.source)}</small>
      </span>
      <span>
        ${meal.calories} kcal
        <button type="button" class="btn" data-id="${meal.id}">Delete</button>
      </span>
    </li>
  `).join('') || '<li class="muted">No meals yet. Start with scan or manual add.</li>';
}

els.tabMobile.addEventListener('click', () => setMode('mobile'));
els.tabEmail.addEventListener('click', () => setMode('email'));

els.googleLogin.addEventListener('click', async () => {
  setLoggedIn(true);
  updateAuthUI();
  await refresh();
});

els.appleLogin.addEventListener('click', async () => {
  setLoggedIn(true);
  updateAuthUI();
  await refresh();
});

els.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const value = authMode === 'mobile'
    ? String(form.get('mobile') || '').trim()
    : String(form.get('email') || '').trim();

  if (!value) {
    els.authError.textContent = `Please enter your ${authMode}.`;
    return;
  }

  try {
    const login = await api('/api/login', {
      method: 'POST',
      body: authMode === 'mobile' ? { mobile: value } : { email: value },
    });
    pendingLoginId = login.loginId;
    els.authError.textContent = `OTP sent. Use demo OTP: ${login.otp}`;
    els.otpField.classList.remove('hidden');
    els.continueBtn.classList.add('hidden');
    els.verifyOtpBtn.classList.remove('hidden');
  } catch (error) {
    els.authError.textContent = error.message;
  }
});

els.verifyOtpBtn.addEventListener('click', async () => {
  const otp = String(els.otpInput.value || '').trim();
  if (!otp) {
    els.authError.textContent = 'Please enter OTP.';
    return;
  }

  try {
    await api('/api/login/verify', { method: 'POST', body: { loginId: pendingLoginId, otp } });
    els.authError.textContent = '';
    setLoggedIn(true);
    updateAuthUI();
    await refresh();
  } catch (error) {
    els.authError.textContent = error.message;
  }
});

els.logoutBtn.addEventListener('click', () => {
  setLoggedIn(false);
  pendingLoginId = '';
  pendingScanEstimate = null;
  els.authForm.reset();
  els.authError.textContent = '';
  els.otpField.classList.add('hidden');
  els.continueBtn.classList.remove('hidden');
  els.verifyOtpBtn.classList.add('hidden');
  updateAuthUI();
});

els.previewScan.addEventListener('click', async () => {
  try {
    const form = new FormData(els.scanForm);
    const image = form.get('image');
    const note = String(form.get('note') || '').trim();
    if (!image || !image.name || !note) {
      els.scanResult.innerHTML = '<p class="muted">Add photo and note for preview.</p>';
      return;
    }
    pendingScanEstimate = await api('/api/scan', {
      method: 'POST',
      body: { fileName: image.name, note },
    });
    els.addFromPreview.disabled = false;
    els.scanResult.innerHTML = `<b>${escapeHtml(pendingScanEstimate.name)}</b><br>${pendingScanEstimate.calories} kcal | P ${pendingScanEstimate.protein}g | C ${pendingScanEstimate.carbs}g | F ${pendingScanEstimate.fat}g`;
  } catch (error) {
    els.scanResult.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
});

els.scanForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!pendingScanEstimate) {
    els.scanResult.innerHTML = '<p class="muted">Preview first, then add the meal.</p>';
    return;
  }
  const form = new FormData(els.scanForm);
  await api('/api/meals', {
    method: 'POST',
    body: {
      ...pendingScanEstimate,
      mealType: form.get('mealType'),
      source: 'AI Vision',
    },
  });
  pendingScanEstimate = null;
  els.addFromPreview.disabled = true;
  els.scanForm.reset();
  els.scanResult.innerHTML = '<p>Meal added successfully.</p>';
  await refresh();
});

els.manualForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(els.manualForm);
  await api('/api/meals', {
    method: 'POST',
    body: {
      name: form.get('name'),
      calories: Number(form.get('calories')),
      protein: Number(form.get('protein')),
      carbs: Number(form.get('carbs')),
      fat: Number(form.get('fat')),
      mealType: form.get('mealType'),
      source: 'Manual',
    },
  });
  els.manualForm.reset();
  await refresh();
});

els.barcodeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(els.barcodeForm);
  try {
    const meal = await api('/api/barcode', {
      method: 'POST',
      body: { code: form.get('code') },
    });
    els.barcodeStatus.textContent = `Added ${meal.name}`;
    els.barcodeForm.reset();
    await refresh();
  } catch (error) {
    els.barcodeStatus.textContent = error.message;
  }
});

els.addWater.addEventListener('click', async () => {
  await api('/api/water/add', { method: 'POST', body: { amount: 250 } });
  await refresh();
});

els.chatSend.addEventListener('click', async () => {
  try {
    await sendChatMessage(els.chatInput.value);
    els.chatInput.value = '';
  } catch (error) {
    appendChat(`Coach: ${error.message}`);
  }
});

els.voiceBtn.addEventListener('click', () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    appendChat('Coach: Voice recognition is not supported in this browser.');
    return;
  }
  const recognition = new Recognition();
  recognition.onresult = async (event) => {
    await sendChatMessage(event.results[0][0].transcript);
  };
  recognition.start();
});

els.scanPhotoBtn.addEventListener('click', async () => {
  const data = await api('/api/scan-photo', { method: 'POST', body: {} });
  appendChat(`Coach: Photo scan suggests ${data.name} at ${data.calories} kcal with ${data.protein}g protein.`);
});

els.dietForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(els.dietForm);
  const plan = await api('/api/diet-plan', {
    method: 'POST',
    body: {
      weight: Number(form.get('weight')),
      goal: String(form.get('goal')),
      budget: Number(form.get('budget')),
    },
  });
  els.dietPlanBox.innerHTML = `<p><b>Target:</b> ${plan.targetCalories} kcal</p>${
    (plan.meals || []).map((meal) => (
      `<p>${escapeHtml(meal.name)} | ${meal.calories} kcal | ${meal.protein}g protein | Rs${meal.price}</p>`
    )).join('') || '<p class="muted">No meals fit this plan.</p>'
  }`;
});

els.loadWeekly.addEventListener('click', async () => {
  const weekly = await api('/api/analytics/weekly');
  els.weeklyBox.innerHTML = weekly
    .map((day) => `<p>${escapeHtml(day.day)}: <b>${day.calories}</b> kcal</p>`)
    .join('');
});

els.mealList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  await api(`/api/meals/${button.dataset.id}`, { method: 'DELETE' });
  await refresh();
});

setMode('mobile');
updateAuthUI();

if (isLoggedIn()) {
  refresh().catch(showError);
}
