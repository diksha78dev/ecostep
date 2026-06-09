import { PLEDGES } from './config.js';
import { Store } from './store.js';
import { escapeHtml } from './ui.js';

/**
 * Renders the actionable pledges into the DOM.
 * Handles the calculation of total CO2 savings and triggers Gamification level updates.
 */
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

  const totalSavings = PLEDGES
    .filter(p => pledgesDone.has(p.id))
    .reduce((acc, p) => acc + p.saving, 0);

  updateSummary(pledgesDone.size, totalSavings);
}

/**
 * Updates the summary section with total savings and gamification messaging.
 * @param {number} count - Number of pledges completed.
 * @param {number} totalSavings - Total estimated CO2 savings.
 */
function updateSummary(count, totalSavings) {
  const summary = document.getElementById('pledgeSummary');
  if (!summary) return;
  
  if (count === 0) {
    summary.hidden = true;
    return;
  }
  
  let gamificationMsg = "Keep going! Small steps make a huge difference.";
  if (count >= 2) gamificationMsg = "Awesome job! You are becoming an Eco-Explorer! 🌿";
  if (count > 4) gamificationMsg = "Incredible! You are an absolute Eco-Warrior! 🌳";

  summary.hidden = false;
  summary.innerHTML = `
    <p>You have committed to <strong>${count}</strong> actions.</p>
    <p>Estimated annual savings: <strong style="color:var(--brand);">${totalSavings} kg CO₂</strong></p>
    <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">${gamificationMsg}</p>
  `;
}
