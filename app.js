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

els.mealList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  await api(`/api/meals/${btn.dataset.id}`, { method: 'DELETE' });
  await refresh();
});

refresh().catch((e) => {
  els.insights.innerHTML = `<p>Unable to load app data: ${escapeHtml(e.message)}</p>`;
});
