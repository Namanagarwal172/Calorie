const AUTH_KEY = 'health-ai-auth-v1';

const els = {
  authView: document.getElementById('authView'),
  appView: document.getElementById('appView'),
  tabMobile: document.getElementById('tabMobile'),
  tabEmail: document.getElementById('tabEmail'),
  mobileField: document.getElementById('mobileField'),
  emailField: document.getElementById('emailField'),
  authForm: document.getElementById('authForm'),
  logoutBtn: document.getElementById('logoutBtn'),
  googleLogin: document.getElementById('googleLogin'),
  appleLogin: document.getElementById('appleLogin'),
  authError: document.getElementById('authError'),

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

let pendingScanEstimate = null;
let authMode = 'mobile';
let memoryAuth = false;

function isLoggedIn() {
  try {
    const val = localStorage.getItem(AUTH_KEY);
    return val === '1' || memoryAuth;
  } catch {
    return memoryAuth;
  }
}

function setLoggedIn(flag) {
  memoryAuth = Boolean(flag);
  try {
    if (flag) localStorage.setItem(AUTH_KEY, '1');
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    // Safari private mode or storage restrictions
  }
}
const els = {
  profileForm: document.getElementById('profileForm'),
  manualForm: document.getElementById('manualForm'),
  scanForm: document.getElementById('scanForm'),
  barcodeForm: document.getElementById('barcodeForm'),
  mealList: document.getElementById('mealList'),
  todayStats: document.getElementById('todayStats'),
  macroBars: document.getElementById('macroBars'),
  insights: document.getElementById('insights'),
  scanResult: document.getElementById('scanResult'),
  barcodeStatus: document.getElementById('barcodeStatus'),
  waterStatus: document.getElementById('waterStatus'),
  addWater: document.getElementById('addWater'),
  budgetTip: document.getElementById('budgetTip'),
  previewScan: document.getElementById('previewScan'),
  addFromPreview: document.getElementById('addFromPreview'),
};

let pendingScanEstimate = null;

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

function percent(value, goal) {
  if (!goal) return 0;
  return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

function setRing(el, pct, color = '#6366f1') {
  el.style.background = `conic-gradient(${color} ${pct * 3.6}deg, rgba(148,163,184,.22) 0deg)`;
}

function formatCurrency(value) {
  return `₹${Math.max(0, Math.round(value))}`;
}

function estimateMealCost(meal) {
  return Math.round((Number(meal.calories || 0) * 0.16) + 20);
}
function appendChat(line) {
  if (!els.chatBox) return;
  els.chatBox.innerHTML += `<p>${line}</p>`;
  els.chatBox.scrollTop = els.chatBox.scrollHeight;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

async function sendChatMessage(message) {
  const msg = String(message || '').trim();
  if (!msg) return;
  appendChat(`You: ${msg}`);
  const data = await api('/api/chat', { method: 'POST', body: { message: msg } });
  appendChat(`Coach: ${data.reply}`);
  speak(data.reply);
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const loggedIn = localStorage.getItem(AUTH_KEY) === '1';
  els.authView.classList.toggle('hidden', loggedIn);
  els.appView.classList.toggle('hidden', !loggedIn);
}

function setMode(mode) {
  authMode = mode;
  const isMobile = mode === 'mobile';
  els.tabMobile.classList.toggle('active', isMobile);
  els.tabEmail.classList.toggle('active', !isMobile);
  els.mobileField.classList.toggle('hidden', !isMobile);
  els.emailField.classList.toggle('hidden', isMobile);
}

els.tabMobile.addEventListener('click', () => setMode('mobile'));
els.tabEmail.addEventListener('click', () => setMode('email'));

els.googleLogin?.addEventListener('click', () => {
  if (els.authError) els.authError.textContent = '';
  setLoggedIn(true);
  updateAuthUI();
  refresh().catch(showError);
});

els.appleLogin?.addEventListener('click', () => {
  if (els.authError) els.authError.textContent = '';
  setLoggedIn(true);
  updateAuthUI();
  refresh().catch(showError);
});


els.authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const value = authMode === 'mobile' ? String(f.get('mobile') || '').trim() : String(f.get('email') || '').trim();
  if (!value) {
    if (els.authError) els.authError.textContent = `Please enter your ${authMode}.`;
    return;
  }
  if (els.authError) els.authError.textContent = '';
  setLoggedIn(true);
  updateAuthUI();
  refresh().catch((err) => {
    showError(err);
    if (els.authError) els.authError.textContent = 'Logged in, but unable to load dashboard. Check server and refresh.';
  });
});

els.logoutBtn.addEventListener('click', () => {
  setLoggedIn(false);
  if (!value) return;
  localStorage.setItem(AUTH_KEY, '1');
  updateAuthUI();
  refresh().catch(showError);
});

els.logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(AUTH_KEY);
  updateAuthUI();
});

function showError(error) {
  els.insights.innerHTML = `<p class="muted">${error.message}</p>`;
function stat(label, value) {
  return `<div class="stat"><div>${label}</div><b>${value}</b></div>`;
}

function macroRow(label, value, goal) {
  const pct = Math.min(100, Math.round((value / goal) * 100 || 0));
  return `<div class="macro"><div>${label}: ${value}g / ${goal}g</div><div class="progress"><div class="bar" style="width:${pct}%"></div></div></div>`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\'': '&#39;', '"': '&quot;' }[ch]));
}

async function refresh() {
  const [dash, meals] = await Promise.all([api('/api/dashboard'), api('/api/meals')]);
  const p = dash.profile;
  const t = dash.totals;
  const remain = Math.max(0, p.calorieTarget - t.calories);

  els.greeting.textContent = `Good ${new Date().getHours() < 12 ? 'Morning' : 'Evening'} ${p.name || 'Friend'} 👋`;
  els.kcalLine.textContent = `You have ${remain} kcal remaining today`;
  els.streakCount.textContent = String(Math.min(30, Math.max(1, t.count + (dash.waterMl > 0 ? 1 : 0))));

  setRing(els.ringCalories, percent(t.calories, p.calorieTarget), '#6366f1');
  setRing(els.ringProtein, percent(t.protein, p.proteinGoal), '#22c55e');
  setRing(els.ringCarbs, percent(t.carbs, p.carbGoal), '#f59e0b');
  setRing(els.ringWater, percent(dash.waterMl, 2500), '#06b6d4');

  els.ringCaloriesText.textContent = `${t.calories}/${p.calorieTarget}`;
  els.ringProteinText.textContent = `${t.protein}/${p.proteinGoal}g`;
  els.ringCarbsText.textContent = `${t.carbs}/${p.carbGoal}g`;
  els.ringWaterText.textContent = `${dash.waterMl}ml`;

  const spent = meals.reduce((acc, m) => acc + estimateMealCost(m), 0);
  const remainingBudget = (p.budgetInr || 0) - spent;
  els.spentInr.textContent = formatCurrency(spent);
  els.remainingInr.textContent = formatCurrency(remainingBudget);

  els.insights.innerHTML = (dash.insights || []).map((m) => `<p>• ${m}</p>`).join('') || '<p>Stay consistent. You got this 💪</p>';
  els.mealList.innerHTML = meals.map((m) => `
    <li>
      <span><b>${m.name}</b><br/><small class="muted">${m.mealType} • ${m.source}</small></span>
      <span>${m.calories} kcal</span>
    </li>
  `).join('') || '<li>No meals yet. Start with scan or manual add.</li>';

  if (!pendingScanEstimate) els.addFromPreview.disabled = true;
}

els.previewScan.addEventListener('click', async () => {
  try {
    const f = new FormData(els.scanForm);
    const image = f.get('image');
    const note = String(f.get('note') || '').trim();
    if (!image || !image.name || !note) {
      els.scanResult.innerHTML = '<p class="muted">Add photo + note for preview.</p>';
      return;
    }
    pendingScanEstimate = await api('/api/scan', { method: 'POST', body: { fileName: image.name, note } });
    els.scanResult.innerHTML = `<b>${pendingScanEstimate.name}</b><br/>${pendingScanEstimate.calories} kcal • P ${pendingScanEstimate.protein}g • C ${pendingScanEstimate.carbs}g • F ${pendingScanEstimate.fat}g`;
    els.addFromPreview.disabled = false;
  } catch (e) {
    els.scanResult.innerHTML = `<p class="muted">${e.message}</p>`;
  }
});

els.scanForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!pendingScanEstimate) {
    els.scanResult.innerHTML = '<p class="muted">Preview first, then add.</p>';
    return;
  }
  const f = new FormData(els.scanForm);
  await api('/api/meals', {
    method: 'POST',
    body: { ...pendingScanEstimate, mealType: f.get('mealType'), source: 'AI Vision' },
  });
  pendingScanEstimate = null;
  els.scanForm.reset();
  els.scanResult.innerHTML = '<p>Meal added ✅</p>';

  const p = dash.profile;
  const t = dash.totals;
  const left = Math.max(0, p.calorieTarget - t.calories);
  els.todayStats.innerHTML = [
    stat('Calories', `${t.calories}/${p.calorieTarget}`),
    stat('Remaining', `${left}`),
    stat('Meals', t.count),
    stat('Water', `${dash.waterMl} ml`),
  ].join('');

  els.macroBars.innerHTML = [
    macroRow('Protein', t.protein, p.proteinGoal),
    macroRow('Carbs', t.carbs, p.carbGoal),
    macroRow('Fat', t.fat, p.fatGoal),
  ].join('');

  els.mealList.innerHTML = meals.map((m) =>
    `<li>
      <span><b>${escapeHtml(m.name)}</b><small> (${escapeHtml(m.mealType || 'Meal')} • ${escapeHtml(m.source || 'Manual')})</small></span>
      <span>
        ${m.calories} kcal
        <button data-id="${m.id}" class="danger-btn">Delete</button>
      </span>
    </li>`
  ).join('') || '<li>No meals logged today.</li>';

  els.insights.innerHTML = dash.insights.map((i) => `<p>• ${escapeHtml(i)}</p>`).join('');
  els.waterStatus.textContent = `${dash.waterMl}ml today`;
  els.budgetTip.textContent = `City: ${p.city} • Daily budget: ₹${p.budgetInr}`;
  if (!pendingScanEstimate) els.addFromPreview.disabled = true;

  const form = els.profileForm;
  form.name.value = p.name;
  form.city.value = p.city;
  form.calorieTarget.value = p.calorieTarget;
  form.proteinGoal.value = p.proteinGoal;
  form.carbGoal.value = p.carbGoal;
  form.fatGoal.value = p.fatGoal;
  form.budgetInr.value = p.budgetInr;
}

els.profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  await api('/api/profile', {
    method: 'POST',
    body: {
      name: f.get('name'),
      city: f.get('city'),
      calorieTarget: Number(f.get('calorieTarget')),
      proteinGoal: Number(f.get('proteinGoal')),
      carbGoal: Number(f.get('carbGoal')),
      fatGoal: Number(f.get('fatGoal')),
      budgetInr: Number(f.get('budgetInr')),
    },
  });
  await refresh();
});

els.manualForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(els.manualForm);
  const f = new FormData(e.target);
  await api('/api/meals', {
    method: 'POST',
    body: {
      name: f.get('name'),
      calories: Number(f.get('calories')),
      protein: Number(f.get('protein')),
      carbs: Number(f.get('carbs')),
      fat: Number(f.get('fat')),
      mealType: f.get('mealType'),
      source: 'Manual',
    },
  });
  els.manualForm.reset();
  await refresh();
});

els.barcodeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(els.barcodeForm);
  try {
    const meal = await api('/api/barcode', { method: 'POST', body: { code: f.get('code') } });
    els.barcodeStatus.textContent = `Added ${meal.name}`;
    els.barcodeForm.reset();
    await refresh();
  } catch (err) {
    els.barcodeStatus.textContent = err.message;
  }
});

els.addWater.addEventListener('click', async () => {
  await api('/api/water/add', { method: 'POST', body: { amount: 250 } });
  await refresh();
});

els.chatSend?.addEventListener('click', async () => {
  try {
    await sendChatMessage(els.chatInput.value);
    els.chatInput.value = '';
  } catch (e) {
    appendChat(`Coach: ${e.message}`);
  }
});

els.voiceBtn?.addEventListener('click', () => {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    appendChat('Coach: Voice recognition not supported in this browser.');
    return;
  }
  const recognition = new Rec();
  recognition.onresult = async (event) => {
    const speech = event.results[0][0].transcript;
    await sendChatMessage(speech);
  };
  recognition.start();
});

els.scanPhotoBtn?.addEventListener('click', async () => {
  const data = await api('/api/scan-photo', { method: 'POST', body: {} });
  appendChat(`Coach: Photo scan -> ${data.name} (${data.calories} kcal, ${data.protein}g protein)`);
});

els.dietForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(els.dietForm);
  const plan = await api('/api/diet-plan', {
    method: 'POST',
    body: {
      weight: Number(f.get('weight')),
      goal: String(f.get('goal')),
      budget: Number(f.get('budget')),
    },
  });
  els.dietPlanBox.innerHTML = `<p><b>Target:</b> ${plan.targetCalories} kcal</p>` +
    (plan.meals?.map((m) => `<p>• ${m.name} — ${m.calories} kcal, ${m.protein}g protein, ₹${m.price}</p>`).join('') || '<p>No meals found for this budget/goal.</p>');
});

els.loadWeekly?.addEventListener('click', async () => {
  const weekly = await api('/api/analytics/weekly');
  els.weeklyBox.innerHTML = weekly.map((d) => `<p>${d.day}: <b>${d.calories}</b> kcal</p>`).join('');
  e.target.reset();
  await refresh();
});

els.scanForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (!pendingScanEstimate) {
    els.scanResult.innerHTML = '<p>Preview first, then add the meal.</p>';
    return;
  }

  await api('/api/meals', {
    method: 'POST',
    body: {
      ...pendingScanEstimate,
      mealType: f.get('mealType'),
      source: 'AI Vision',
    },
  });

  els.scanResult.innerHTML = `<b>Added:</b> ${escapeHtml(pendingScanEstimate.name)} (${pendingScanEstimate.calories} kcal)`;
  pendingScanEstimate = null;
  els.addFromPreview.disabled = true;
  e.target.reset();
  await refresh();
});

els.previewScan.addEventListener('click', async () => {
  const f = new FormData(els.scanForm);
  const image = f.get('image');
  const note = f.get('note');
  if (!image || !image.name || !String(note || '').trim()) {
    els.scanResult.innerHTML = '<p>Please upload an image and enter meal note for preview.</p>';
    return;
  }

  pendingScanEstimate = await api('/api/scan', {
    method: 'POST',
    body: { fileName: image.name, note: String(note) },
  });

  els.addFromPreview.disabled = false;
  els.scanResult.innerHTML = `<b>Preview:</b> ${escapeHtml(pendingScanEstimate.name)} | ${pendingScanEstimate.calories} kcal | P ${pendingScanEstimate.protein}g | C ${pendingScanEstimate.carbs}g | F ${pendingScanEstimate.fat}g`;
});

els.barcodeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    const meal = await api('/api/barcode', { method: 'POST', body: { code: f.get('code') } });
    els.barcodeStatus.textContent = `Added ${meal.name}`;
    e.target.reset();
    await refresh();
  } catch (err) {
    els.barcodeStatus.textContent = err.message;
  }
});

els.addWater.addEventListener('click', async () => {
  await api('/api/water/add', { method: 'POST', body: { amount: 250 } });
  await refresh();
});

updateAuthUI();
if (!els.appView.classList.contains('hidden')) refresh().catch(showError);
els.mealList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  await api(`/api/meals/${btn.dataset.id}`, { method: 'DELETE' });
  await refresh();
});

refresh().catch((e) => {
  els.insights.innerHTML = `<p>Unable to load app data: ${escapeHtml(e.message)}</p>`;
});
