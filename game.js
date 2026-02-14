const fragments = [
  { id: 'F-07', biome: 'temperate_forest', mass: 'medium', civilization: 'recovery', tags: ['forest', 'coastal'] },
  { id: 'F-12', biome: 'arid_steppe', mass: 'light', civilization: 'survivors', tags: ['desert', 'trade'] },
  { id: 'F-22', biome: 'tundra', mass: 'heavy', civilization: 'scientists', tags: ['polar', 'energy'] },
  { id: 'F-31', biome: 'rainforest', mass: 'medium', civilization: 'agrarian', tags: ['tropical', 'biodiversity'] },
];

const slots = [
  { id: 'S1', expects: ['forest', 'coastal'], climate: 'humid', tectonic: 'stable' },
  { id: 'S2', expects: ['desert', 'trade'], climate: 'arid', tectonic: 'stable' },
  { id: 'S3', expects: ['polar', 'energy'], climate: 'cold', tectonic: 'volatile' },
  { id: 'S4', expects: ['tropical', 'biodiversity'], climate: 'humid', tectonic: 'stable' },
  { id: 'S5', expects: ['forest', 'trade'], climate: 'temperate', tectonic: 'volatile' },
  { id: 'S6', expects: ['polar', 'coastal'], climate: 'cold', tectonic: 'stable' },
];

const metrics = {
  gravity: 52,
  climate: 44,
  biosphere: 38,
  population: 29,
};

const quests = [
  'Engineer Darya: Align tectonic seams around the equatorial arc.',
  'Scientist Hale: Restore rainfall corridors between humid fragments.',
  'Mayor Imani: Reconnect the floating ports for displaced civilians.',
];

let selectedFragment = null;
let energy = 70;
let hope = 32;
const sealedSlots = new Set();
const deployedFragments = new Set();

const fragmentInventory = document.getElementById('fragmentInventory');
const orbitalSlots = document.getElementById('orbitalSlots');
const metricsPanel = document.getElementById('metricsPanel');
const questList = document.getElementById('questList');
const globalMessage = document.getElementById('globalMessage');
const placementHint = document.getElementById('placementHint');
const energyMeter = document.getElementById('energyMeter');
const energyLabel = document.getElementById('energyLabel');
const regionSummary = document.getElementById('regionSummary');
const overlayLegend = document.getElementById('overlayLegend');
const policyResult = document.getElementById('policyResult');
const orbitalModeBtn = document.getElementById('orbitalModeBtn');
const surfaceModeBtn = document.getElementById('surfaceModeBtn');
const orbitalView = document.getElementById('orbitalView');
const surfaceView = document.getElementById('surfaceView');

function statusClass(value) {
  if (value >= 70) return 'status-good';
  if (value >= 40) return 'status-warn';
  return 'status-bad';
}

function renderMetrics() {
  metricsPanel.innerHTML = '';
  Object.entries(metrics).forEach(([name, value]) => {
    const row = document.createElement('div');
    row.className = 'metric';
    const label = document.createElement('span');
    label.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    const stat = document.createElement('span');
    stat.className = statusClass(value);
    stat.textContent = `${value}%`;
    row.append(label, stat);
    row.title = `Expanded: ${name} stability index ${value}`;
    metricsPanel.appendChild(row);
  });
}

function renderQuests() {
  questList.innerHTML = '';
  quests.forEach((quest) => {
    const li = document.createElement('li');
    li.textContent = quest;
    questList.appendChild(li);
  });
}

function renderFragments() {
  fragmentInventory.innerHTML = '';
  fragments.forEach((fragment) => {
    const btn = document.createElement('button');
    btn.className = 'fragment-card';
    if (selectedFragment?.id === fragment.id) btn.classList.add('selected');
    if (deployedFragments.has(fragment.id)) btn.disabled = true;
    btn.innerHTML = `${fragment.id} · ${fragment.biome}<small>Mass: ${fragment.mass} | Civ: ${fragment.civilization}</small>`;
    btn.addEventListener('click', () => {
      selectedFragment = fragment;
      renderFragments();
      renderSlots();
      placementHint.textContent = `Selected ${fragment.id}. Valid edges glow green; invalid edges glow red with cause.`;
    });
    fragmentInventory.appendChild(btn);
  });
}

function validatePlacement(slot, fragment) {
  if (!fragment) return { ok: false, reason: 'No fragment selected.' };
  if (!slot.expects.every((tag) => fragment.tags.includes(tag))) {
    return { ok: false, reason: 'Tectonic mismatch' };
  }
  if (slot.climate === 'cold' && !fragment.tags.includes('polar')) {
    return { ok: false, reason: 'Climate incompatibility' };
  }
  if (slot.tectonic === 'volatile' && fragment.mass === 'heavy') {
    return { ok: false, reason: 'Magnetic polarity conflict' };
  }
  return { ok: true, reason: 'Fragment can be sealed here.' };
}

function updateEnergy(next) {
  energy = Math.max(0, Math.min(100, next));
  energyMeter.value = energy;
  energyLabel.textContent = `${energy} / 100`;
}

function renderSlots() {
  orbitalSlots.innerHTML = '';
  slots.forEach((slot) => {
    const cell = document.createElement('button');
    cell.className = 'slot';
    cell.type = 'button';

    const result = validatePlacement(slot, selectedFragment);
    cell.classList.add(result.ok ? 'valid' : 'invalid');
    cell.innerHTML = `<strong>${slot.id}</strong><br/><small>${result.reason}</small>`;
    cell.title = result.reason;
    if (sealedSlots.has(slot.id)) {
      cell.className = 'slot filled';
      cell.disabled = true;
      cell.innerHTML = `<strong>${slot.id}</strong><br/><small>Seam stabilized</small>`;
      cell.title = 'This slot is already stabilized.';
    }

    cell.addEventListener('click', () => {
      if (!selectedFragment) {
        globalMessage.textContent = 'Select a fragment first.';
        return;
      }
      if (sealedSlots.has(slot.id)) {
        globalMessage.textContent = `${slot.id} is already stabilized.`;
        return;
      }
      if (energy < 8) {
        globalMessage.textContent = 'Insufficient reconstruction energy for orbital sealing.';
        return;
      }
      const placement = validatePlacement(slot, selectedFragment);
      if (!placement.ok) {
        globalMessage.textContent = `${selectedFragment.id} failed to connect at ${slot.id}: ${placement.reason}.`;
        return;
      }

      sealedSlots.add(slot.id);
      deployedFragments.add(selectedFragment.id);
      cell.classList.add('filled');
      cell.disabled = true;
      cell.innerHTML = `<strong>${slot.id}</strong><br/><small>${selectedFragment.id} sealed</small>`;
      metrics.gravity += 4;
      metrics.climate += 5;
      metrics.biosphere += 6;
      metrics.population += 3;
      hope += 5;
      updateEnergy(energy - 8);
      renderMetrics();
      regionSummary.textContent = `${selectedFragment.id} restored. Population corridors reopening and biodiversity migration trails stabilizing.`;
      overlayLegend.innerHTML = `
        <div class="metric"><span>Temperature Map</span><span class="${statusClass(metrics.climate)}">${metrics.climate}%</span></div>
        <div class="metric"><span>Rainfall Map</span><span class="${statusClass(metrics.biosphere)}">${metrics.biosphere}%</span></div>
        <div class="metric"><span>Pollution Map</span><span class="${statusClass(100 - metrics.population)}">${100 - metrics.population}% risk</span></div>
        <div class="metric"><span>Seismic Stress</span><span class="${statusClass(metrics.gravity)}">${metrics.gravity}% stable</span></div>
      `;
      globalMessage.textContent = `Seam healed at ${slot.id}. Hope wave intensity now ${hope}%.`;
      selectedFragment = null;
      renderFragments();
      renderSlots();
    });

    orbitalSlots.appendChild(cell);
  });
}

function setupPolicies() {
  document.querySelectorAll('[data-policy]').forEach((button) => {
    button.addEventListener('click', () => {
      const policy = button.dataset.policy;
      if (policy === 'supply') {
        metrics.population += 6;
        policyResult.textContent = 'Supply lines restored: protests reduced, trade resumes between sky-ports.';
      }
      if (policy === 'microclimate') {
        metrics.climate += 7;
        metrics.biosphere += 4;
        policyResult.textContent = 'Microclimate meshes deployed: rainfall corridors normalized.';
      }
      if (policy === 'species') {
        metrics.biosphere += 8;
        hope += 6;
        policyResult.textContent = 'Endangered species reintroduced: visible migration trails appeared.';
      }
      if (energy < 5) {
        globalMessage.textContent = 'Insufficient reconstruction energy for additional policy actions.';
        return;
      }
      updateEnergy(energy - 5);
      renderMetrics();
      globalMessage.textContent = `Policy enacted (${policy}). Global morale ripple detected.`;
    });
  });
}

function setMode(mode) {
  const orbital = mode === 'orbital';
  orbitalView.classList.toggle('hidden', !orbital);
  surfaceView.classList.toggle('hidden', orbital);
  orbitalModeBtn.classList.toggle('active', orbital);
  surfaceModeBtn.classList.toggle('active', !orbital);
  orbitalModeBtn.setAttribute('aria-selected', String(orbital));
  surfaceModeBtn.setAttribute('aria-selected', String(!orbital));
}

orbitalModeBtn.addEventListener('click', () => setMode('orbital'));
surfaceModeBtn.addEventListener('click', () => setMode('surface'));

renderMetrics();
renderQuests();
renderFragments();
renderSlots();
setupPolicies();
updateEnergy(energy);
