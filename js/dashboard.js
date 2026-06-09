import { escapeHtml } from './ui.js';

export function renderDashboard(footprintData) {
  const container = document.getElementById('dashContent');
  if (!container || !footprintData) return;

  const d = footprintData;

  const categories = [
    { key: 'transport', label: 'Transport',    color: '#1D9E75' },
    { key: 'home',      label: 'Home energy',  color: '#378ADD' },
    { key: 'diet',      label: 'Diet',         color: '#EF9F27' },
    { key: 'flights',   label: 'Flights',      color: '#E24B4A' },
    { key: 'shopping',  label: 'Shopping',     color: '#7F77DD' },
  ];

  const maxVal     = Math.max(...categories.map(c => d.breakdown[c.key] || 0), 1);
  const gradeColor = getGradeColor(d.grade);
  const gradeLabel = getGradeLabel(d.grade);
  const biggestCat = categories
    .slice()
    .sort((a, b) => (d.breakdown[b.key] || 0) - (d.breakdown[a.key] || 0))[0];

  const barsHtml = categories.map(c => {
    const val = d.breakdown[c.key] || 0;
    const pct = Math.round(val / maxVal * 100);
    return `
      <div class="bar-row" role="listitem">
        <span class="bar-label">${escapeHtml(c.label)}</span>
        <div class="bar-track"
             role="progressbar"
             aria-valuenow="${Math.round(val)}"
             aria-valuemin="0"
             aria-valuemax="${Math.round(maxVal)}"
             aria-label="${escapeHtml(c.label)}: ${fmtNum(val)} kg CO₂">
          <div class="bar-fill" style="width:${pct}%;background:${c.color}"></div>
        </div>
        <span class="bar-value">${fmtNum(val)} kg</span>
      </div>`;
  }).join('');

  const tipIconMap = { green: 'ti-leaf', amber: 'ti-flame', teal: 'ti-plant' };
  const tipsHtml = (d.tips && d.tips.length)
    ? d.tips.map(t => {
        const icon = tipIconMap[t.type] || 'ti-leaf';
        return `
          <div class="tip-card">
            <div class="tip-icon ${escapeHtml(t.type || 'green')}" aria-hidden="true">
              <i class="ti ${icon}"></i>
            </div>
            <div class="tip-text">
              <p>${escapeHtml(t.text)}</p>
              <span>Potential saving: ${escapeHtml(t.saving)}</span>
            </div>
          </div>`;
      }).join('')
    : '';

  container.innerHTML = `
    <div class="metric-row fade-in">
      <div class="metric-card glass">
        <div class="metric-label">Annual footprint</div>
        <div class="metric-value">${fmtNum(d.total)}<span class="metric-unit"> kg CO₂</span></div>
        <div class="metric-note">India avg: 1,700 kg · Global avg: 4,600 kg</div>
      </div>
      <div class="metric-card glass">
        <div class="metric-label">Your grade</div>
        <div class="metric-value" style="color:${gradeColor}">${escapeHtml(d.grade)}</div>
        <div class="metric-note">${escapeHtml(gradeLabel)}</div>
      </div>
      <div class="metric-card glass">
        <div class="metric-label">Biggest source</div>
        <div class="metric-value" style="font-size:16px">${escapeHtml(biggestCat.label)}</div>
        <div class="metric-note">${fmtNum(d.breakdown[biggestCat.key])} kg/yr</div>
      </div>
    </div>

    <div class="fade-in" style="animation-delay: 0.1s">
      <div class="section-label">
        <i class="ti ti-chart-bar" aria-hidden="true"></i> Breakdown by category
      </div>
      <div class="bar-list" role="list" aria-label="Carbon footprint by category">
        ${barsHtml}
      </div>
    </div>

    ${tipsHtml ? `
    <div class="fade-in" style="animation-delay: 0.2s">
      <div class="section-label">
        <i class="ti ti-bulb" aria-hidden="true"></i> Personalised actions for you
      </div>
      <div class="tips-list" role="list" aria-label="Personalised carbon reduction tips">
        ${tipsHtml}
      </div>
    </div>` : ''}

    <div style="padding:0.25rem 0" class="fade-in" style="animation-delay: 0.3s">
      <button class="btn-outline" id="btnGoToPledges">
        Make green pledges →
      </button>
    </div>
  `;
}

function fmtNum(n) {
  return Math.round(n || 0).toLocaleString('en-IN');
}

function getGradeColor(grade) {
  const c = { A: '#3B6D11', B: '#639922', C: '#BA7517', D: '#993C1D', E: '#A32D2D' };
  return c[grade] || '#888';
}

function getGradeLabel(grade) {
  const l = {
    A: 'Excellent — well below India average',
    B: 'Good — near India average',
    C: 'Average — real room to improve',
    D: 'High — targeted action recommended',
    E: 'Very high — urgent action needed'
  };
  return l[grade] || '';
}
