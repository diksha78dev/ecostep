/**
 * EcoStep — app.js
 * AI-powered carbon footprint coach for India
 *
 * Modules:
 *  - ChatEngine   : manages conversation with Anthropic API
 *  - Dashboard    : renders footprint breakdown UI
 *  - PledgeTracker: manages green pledge state
 *  - UIHelpers    : tab switching, mobile nav, accessibility utilities
 *
 * Security:
 *  - All user input is sanitised via escapeHtml() before DOM insertion
 *  - Input length is capped at MAX_INPUT_LENGTH characters
 *  - No eval(), no innerHTML with raw user strings
 *  - API endpoint is the only external connect-src (enforced by CSP)
 */

'use strict';

/* ── Constants ─────────────────────────────────────────────── */

const API_ENDPOINT   = 'https://api.anthropic.com/v1/messages';
const MODEL          = 'claude-sonnet-4-20250514';
const MAX_TOKENS     = 1000;
const MAX_INPUT_LEN  = 500;
const CHAR_WARN_AT   = 400;

/** @type {Array<{id:string, ico:string, title:string, saving:number}>} */
const PLEDGES = [
  { id: 'metro',    ico: '🚇', title: 'Switch to metro/bus once a week',      saving: 52  },
  { id: 'veg',      ico: '🥗', title: 'One meat-free day per week',             saving: 35  },
  { id: 'ac',       ico: '❄️',  title: 'Set AC to 24°C — not lower',            saving: 40  },
  { id: 'bag',      ico: '🛍️', title: 'Always carry a cloth bag',               saving: 6   },
  { id: 'bulb',     ico: '💡', title: 'Replace all bulbs with LEDs',            saving: 30  },
  { id: 'carpool',  ico: '🚘', title: 'Carpool twice a week',                   saving: 80  },
  { id: 'solar',    ico: '☀️',  title: 'Switch to rooftop solar',               saving: 200 },
  { id: 'shower',   ico: '🚿', title: 'Cut shower time by 2 minutes',           saving: 15  },
  { id: 'flight',   ico: '✈️', title: 'Skip one domestic flight this year',     saving: 150 },
  { id: 'tree',     ico: '🌳', title: 'Plant a tree this month',                saving: 21  },
  { id: 'unplug',   ico: '🔌', title: 'Unplug devices when not in use',         saving: 10  },
  { id: 'cycle',    ico: '🚲', title: 'Cycle for trips under 3 km',             saving: 45  },
];

const GRADE_LABELS = {
  A: 'Excellent — well below India average',
  B: 'Good — near India average',
  C: 'Average — real room to improve',
  D: 'High — targeted action recommended',
  E: 'Very high — urgent action needed',
};

const GRADE_COLORS = {
  A: '#3B6D11', B: '#639922', C: '#BA7517', D: '#993C1D', E: '#A32D2D',
};

const SYSTEM_PROMPT = `You are EcoStep, a friendly and encouraging AI carbon footprint coach built specifically for India.

Your goal: help users calculate and understand their annual carbon footprint through natural conversation, then give personalised, actionable advice.

CONVERSATION RULES:
- Ask 2-3 short conversational questions before calculating
- Cover: daily transport, home energy (electricity units/month, AC hours, LPG cylinders/year), diet, annual flights
- Use Indian context: auto-rickshaw, BEST bus, metro, MSEB/TNEB/BESCOM, LPG, kirana, etc.
- Never use form language ("please fill in", "enter value") — keep it a real conversation

INDIA EMISSION FACTORS (use these for calculation):
Transport (kg CO₂/km): petrol car 0.17, diesel car 0.16, two-wheeler 0.09, auto-rickshaw 0.06, city bus 0.04, metro 0.035
Home: electricity 0.82 kg CO₂/kWh (India grid avg, CEA 2023); LPG cylinder 14.2 kg × 2.98 = ~42 kg CO₂ per cylinder
Diet/year: vegan ~700 kg, vegetarian ~1000 kg, egg+vegetarian ~1200 kg, chicken/fish ~1500 kg, regular non-veg (red meat) ~2000 kg
Flights: domestic one-way ~180 kg, short international ~600 kg, long international ~1800 kg
Shopping/consumer goods: minimal ~400 kg, average ~900 kg, high ~1400 kg/yr

WHEN YOU HAVE ENOUGH INFO (or user asks to calculate):
Respond with:
1. A warm 2-3 sentence personalised summary
2. A data block wrapped in <FOOTPRINT_DATA> ... </FOOTPRINT_DATA> containing ONLY valid JSON:
{
  "total": 2400,
  "breakdown": { "transport": 800, "home": 600, "diet": 700, "flights": 200, "shopping": 100 },
  "score": 42,
  "grade": "B",
  "tips": [
    { "text": "Your car commute is the biggest single source at ~800 kg/yr. Switching to metro even 2 days a week could cut this by ~30%.", "saving": "~240 kg/yr", "type": "green" },
    { "text": "Your AC usage adds ~300 kg/yr. Setting it to 24°C instead of 18°C saves significant electricity.", "saving": "~40 kg/yr", "type": "amber" }
  ]
}

SCORING:
- total = exact sum of breakdown values
- score: 0–100 scale (0 = zero footprint, 100 = 6000+ kg/yr)
  Formula: min(100, round(total / 60))
- grade: A <1000 kg, B 1000-2000, C 2000-3500, D 3500-5000, E >5000
- tips: 3-5 items, each specific to the user's actual habits; type = "green"|"amber"|"teal"

3. After the data block, invite them to check the "My footprint" tab.

TONE: Warm, non-judgmental, encouraging. Short paragraphs. Real Indian examples.`;

/* ── State ──────────────────────────────────────────────────── */

/** @type {Array<{role: 'user'|'assistant', content: string}>} */
let chatHistory = [];

/** @type {Set<string>} */
let pledgesDone = new Set();

/** @type {Object|null} */
let footprintData = null;

/** @type {boolean} */
let isLoading = false;

/* ── Initialisation ─────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  renderPledges();
  addMessage(
    'ai',
    `Namaste! 🌿 I'm your EcoStep carbon coach.\n\nI'll help you understand your personal carbon footprint — based on your actual life in India, not global averages.\n\n<strong>Let's start:</strong> How do you usually get around day to day — own vehicle, public transport, or a mix of both?`
  );
});

/* ── UIHelpers ──────────────────────────────────────────────── */

/**
 * Switch active tab panel.
 * @param {string} name - 'chat' | 'dash' | 'pledges'
 */
function switchTab(name) {
  document.querySelectorAll('.app-panel').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
  document.querySelectorAll('.app-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById('panel-' + name);
  const tab   = document.getElementById('tab-'   + name);
  if (panel) { panel.classList.add('active'); panel.hidden = false; }
  if (tab)   { tab.classList.add('active');   tab.setAttribute('aria-selected', 'true'); }
}

/** Initialise mobile navigation toggle. */
function initMobileNav() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.hidden = open;
  });
}

/** Close mobile nav (called from inline anchor onclick). */
function closeMobileNav() {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('menuBtn');
  if (nav) nav.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/**
 * Update character counter below chat input.
 * @param {HTMLInputElement} input
 */
function updateCharCount(input) {
  const el = document.getElementById('charCount');
  if (!el) return;
  const len = input.value.length;
  if (len >= CHAR_WARN_AT) {
    el.textContent = `${len}/${MAX_INPUT_LEN}`;
    el.classList.add('warn');
  } else {
    el.textContent = '';
    el.classList.remove('warn');
  }
}

/* ── UIHelpers — security ───────────────────────────────────── */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str - Raw user/API string
 * @returns {string} Safe HTML string
 */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

/**
 * Sanitise and lightly format AI reply for safe innerHTML insertion.
 * Only allows <strong>, <br>, and pre-approved <a> tags.
 * @param {string} text
 * @returns {string}
 */
function formatAiReply(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

/* ── ChatEngine ─────────────────────────────────────────────── */

/**
 * Add a message bubble to the chat log.
 * @param {'ai'|'user'|'thinking'} role
 * @param {string} html - Safe HTML string (AI) or plain text (user)
 * @returns {HTMLElement} The created message element
 */
function addMessage(role, html) {
  const container = document.getElementById('chatMessages');
  if (!container) return null;

  const el = document.createElement('div');
  el.className = 'message ' + role;

  if (role === 'user') {
    // User input: always escape, never trust
    el.innerHTML = escapeHtml(html).replace(/\n/g, '<br/>');
  } else {
    // AI content: formatted but no raw user content reaches here
    el.innerHTML = html;
  }

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

/**
 * Pre-fill chat input and send.
 * @param {string} text - Quick-start prompt text
 */
function quickSend(text) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = text.slice(0, MAX_INPUT_LEN);
    updateCharCount(input);
  }
  sendMessage();
}

/** Read input, call API, render response. */
async function sendMessage() {
  if (isLoading) return;

  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const rawText = input ? input.value.trim() : '';
  if (!rawText) return;

  // Enforce max length (defence in depth alongside maxlength attr)
  const text = rawText.slice(0, MAX_INPUT_LEN);

  input.value = '';
  updateCharCount(input);
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  // Disable input while loading
  isLoading = true;
  if (input)   input.disabled   = true;
  if (sendBtn) sendBtn.disabled = true;

  const thinkingEl = addMessage('thinking', '🌱 Thinking...');

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: chatHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rawReply = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    chatHistory.push({ role: 'assistant', content: rawReply });

    // Extract structured footprint JSON if present
    const dataMatch = rawReply.match(/<FOOTPRINT_DATA>([\s\S]*?)<\/FOOTPRINT_DATA>/);
    const displayText = rawReply
      .replace(/<FOOTPRINT_DATA>[\s\S]*?<\/FOOTPRINT_DATA>/g, '')
      .trim();

    const dashLink = dataMatch
      ? '\n\n→ <a onclick="switchTab(\'dash\')" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \')switchTab(\'dash\')">View your footprint dashboard</a>'
      : '';

    if (thinkingEl) thinkingEl.remove();
    addMessage('ai', formatAiReply(displayText) + dashLink);

    if (dataMatch) {
      try {
        footprintData = JSON.parse(dataMatch[1].trim());
        renderDashboard();
      } catch (parseErr) {
        console.error('EcoStep: failed to parse footprint JSON', parseErr);
      }
    }
  } catch (err) {
    if (thinkingEl) thinkingEl.remove();
    addMessage('ai', 'Sorry, I couldn\'t connect right now. Please try again in a moment.');
    console.error('EcoStep: API error', err);
  } finally {
    isLoading = false;
    if (input)   { input.disabled   = false; input.focus(); }
    if (sendBtn)   sendBtn.disabled = false;
  }
}

/* ── Dashboard ──────────────────────────────────────────────── */

/**
 * Format a number for Indian locale display.
 * @param {number} n
 * @returns {string}
 */
function fmtNum(n) {
  return Math.round(n || 0).toLocaleString('en-IN');
}

/** Render footprint data into the dashboard panel. */
function renderDashboard() {
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
  const gradeColor = GRADE_COLORS[d.grade] || '#888';
  const gradeLabel = GRADE_LABELS[d.grade] || '';
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
    <div class="metric-row">
      <div class="metric-card">
        <div class="metric-label">Annual footprint</div>
        <div class="metric-value">${fmtNum(d.total)}<span class="metric-unit"> kg CO₂</span></div>
        <div class="metric-note">India avg: 1,700 kg · Global avg: 4,600 kg</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Your grade</div>
        <div class="metric-value" style="color:${gradeColor}">${escapeHtml(d.grade)}</div>
        <div class="metric-note">${escapeHtml(gradeLabel)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Biggest source</div>
        <div class="metric-value" style="font-size:16px">${escapeHtml(biggestCat.label)}</div>
        <div class="metric-note">${fmtNum(d.breakdown[biggestCat.key])} kg/yr</div>
      </div>
    </div>

    <div>
      <div class="section-label">
        <i class="ti ti-chart-bar" aria-hidden="true"></i> Breakdown by category
      </div>
      <div class="bar-list" role="list" aria-label="Carbon footprint by category">
        ${barsHtml}
      </div>
    </div>

    ${tipsHtml ? `
    <div>
      <div class="section-label">
        <i class="ti ti-bulb" aria-hidden="true"></i> Personalised actions for you
      </div>
      <div class="tips-list" role="list" aria-label="Personalised carbon reduction tips">
        ${tipsHtml}
      </div>
    </div>` : ''}

    <div style="padding:0.25rem 0">
      <button class="btn-outline" onclick="switchTab('pledges')">
        Make green pledges →
      </button>
    </div>
  `;
}

/* ── PledgeTracker ──────────────────────────────────────────── */

/** Render all pledge cards. */
function renderPledges() {
  const grid = document.getElementById('pledgeGrid');
  if (!grid) return;

  grid.innerHTML = PLEDGES.map(p => {
    const done = pledgesDone.has(p.id);
    return `
      <div
        class="pledge-card${done ? ' done' : ''}"
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

  // Attach event listeners (not inline handlers — cleaner and no CSP issues)
  grid.querySelectorAll('.pledge-card').forEach(card => {
    card.addEventListener('click', () => togglePledge(card.dataset.pledgeId));
    card.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        togglePledge(card.dataset.pledgeId);
      }
    });
  });

  updatePledgeSummary();
}

/**
 * Toggle a pledge's committed state.
 * @param {string} id - Pledge ID
 */
function togglePledge(id) {
  if (pledgesDone.has(id)) {
    pledgesDone.delete(id);
  } else {
    pledgesDone.add(id);
  }
  renderPledges();
}

/** Recompute and display pledge savings summary. */
function updatePledgeSummary() {
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
    `Potential annual saving: <strong>${fmtNum(totalSaving)} kg CO₂</strong>. ` +
    `That's equivalent to planting <strong>${trees} trees</strong>! 🌳`;
}

/* ── Expose globals (called from HTML onclick attrs) ────────── */
window.switchTab     = switchTab;
window.closeMobileNav= closeMobileNav;
window.sendMessage   = sendMessage;
window.quickSend     = quickSend;
window.updateCharCount = updateCharCount;
