import { PLEDGES } from './config.js';
import { Store } from './store.js';
import { escapeHtml } from './ui.js';

export function renderPledges() {
  const grid = document.getElementById('pledgeGrid');
  if (!grid) return;

  const pledgesDone = Store.getPledges();

  grid.innerHTML = PLEDGES.map(p => {
    const done = pledgesDone.has(p.id);
    return `
      <div
        class="pledge-card${done ? ' done' : ''} glass"
        role="checkbox"
        aria-checked="${done}"
        tabindex="0"
        data-pledge-id="${p.id}"
        aria-label="${escapeHtml(p.title)}, saves approximately ${p.saving} kg CO₂ per year${done ? ', pledged' : ''}"
      >
        <div class="pledge-ico" aria-hidden="true">${p.ico}</div>
        <div class="pledge-title">${escapeHtml(p.title)}</div>
        <div class="pledge-saving">saves ~${p.saving} kg CO₂/yr</div>
        ${done ? '<span class="pledge-badge">✓ pledged</span>' : ''}
      </div>`;
  }).join('');

  grid.querySelectorAll('.pledge-card').forEach(card => {
    const toggle = (e) => {
      e.preventDefault();
      const id = card.dataset.pledgeId;
      if (pledgesDone.has(id)) pledgesDone.delete(id);
      else pledgesDone.add(id);
      Store.savePledges(pledgesDone);
      renderPledges();
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') toggle(e);
    });
  });

  updatePledgeSummary(pledgesDone);
}

function updatePledgeSummary(pledgesDone) {
  const summary = document.getElementById('pledgeSummary');
  if (!summary) return;

  const committed = PLEDGES.filter(p => pledgesDone.has(p.id));
  if (committed.length === 0) {
    summary.hidden = true;
    return;
  }

  const totalSaving = committed.reduce((acc, p) => acc + p.saving, 0);
  const trees       = Math.round(totalSaving / 21);

  summary.hidden = false;
  summary.innerHTML =
    `You've committed to <strong>${committed.length} action${committed.length !== 1 ? 's' : ''}</strong>. ` +
    `Potential annual saving: <strong style="color:var(--g600);">${Math.round(totalSaving).toLocaleString('en-IN')} kg CO₂</strong>. ` +
    `That's equivalent to planting <strong>${trees} trees</strong>! 🌳`;
}
