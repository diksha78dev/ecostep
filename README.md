# EcoStep — AI Carbon Footprint Coach for India

> **Hack2Skill "India Runs" Hackathon · Challenge 3: Carbon Footprint Awareness Platform**

[![Tests](https://img.shields.io/badge/tests-31%20passed-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

**Live demo:** _[[Add your Vercel/Netlify URL here after deployment]_](https://diksha78dev.github.io/ecostep)

---

## Chosen vertical

**Individual consumer** — helping everyday Indians understand, measure, and reduce their personal carbon footprint through a conversational AI interface grounded in Indian context.

---

## The problem

Most carbon calculators give you a generic number and leave you confused. They're built around global averages that don't reflect how people actually live in India — auto-rickshaws, LPG cylinders, state electricity grids, and predominantly vegetarian diets aren't captured.

**EcoStep fixes this by having a real conversation with you.**

---

## Features

| Feature | Details |
|---|---|
| 🤖 AI Coach | Conversational interface powered by Claude — asks about your life, calculates your footprint |
| 📊 Visual Dashboard | Breakdown by transport, home energy, diet, flights, shopping with bar charts |
| 🌿 Pledge Tracker | 12 green pledges with real kg CO₂ savings; commit and track total |
| 🇮🇳 India-first | Auto-rickshaw, MSEB/TNEB electricity, LPG cylinders, Indian diet patterns |
| ♿ Accessible | ARIA roles, keyboard navigation, skip link, dark mode, reduced motion |
| 🔒 Secure | CSP headers, XSS sanitisation via `escapeHtml()`, input length limits |
| 📱 Responsive | Mobile-first, works from 320px up |

---

## Approach and logic

### Architecture

```
ecostep/
├── index.html          ← Semantic HTML5, ARIA landmarks, CSP meta
├── style.css           ← Design system, dark mode, responsive layout
├── app.js              ← Chat engine, dashboard, pledges — vanilla JS
├── package.json        ← Project metadata, test + start scripts
├── tests/
│   ├── ecostep.test.js ← 31 automated unit tests (zero dependencies)
│   └── manual-tests.md ← Manual QA checklist (14 scenarios)
└── README.md
```

No build tools. No frameworks. No npm install required. Works from any static file server.

### AI Coach logic

```
User describes lifestyle
        ↓
[ChatEngine] sends to Anthropic API with India-specific system prompt
        ↓
AI asks 2-3 conversational questions (transport, home energy, diet, travel)
        ↓
AI calculates and returns:
  - Friendly summary text
  - <FOOTPRINT_DATA> JSON block (total, breakdown, grade, tips)
        ↓
[Dashboard] parses JSON → renders metric cards + bar charts + tips
        ↓
User commits to pledges → [PledgeTracker] shows total CO₂ savings
```

### Emission factors used (India-specific)

| Source | Factor | Reference |
|---|---|---|
| Petrol car | 0.17 kg CO₂/km | MoEFCC India |
| Diesel car | 0.16 kg CO₂/km | MoEFCC India |
| Two-wheeler | 0.09 kg CO₂/km | MoEFCC India |
| Auto-rickshaw | 0.06 kg CO₂/km | TERI India |
| City bus | 0.04 kg CO₂/km | TERI India |
| Metro | 0.035 kg CO₂/km | DMRC reports |
| Electricity grid | 0.82 kg CO₂/kWh | CEA India 2023 |
| LPG cylinder (14.2 kg) | ~42 kg CO₂ | IPCC AR6 |
| Domestic flight (one way) | ~180 kg CO₂ | ICAO |
| Vegetarian diet | ~1,000 kg CO₂/yr | FAO |
| Non-vegetarian diet | ~1,500–2,000 kg CO₂/yr | FAO |

---

## How to run locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/ecostep.git
cd ecostep

# 2. Run tests (Node.js required, no npm install needed)
npm test

# 3. Serve locally
npx serve .
# or
python3 -m http.server 3000

# Open http://localhost:3000
```

---

## Deployment

### Option A — Vercel (recommended, free)

```bash
npm install -g vercel
vercel --prod
```

### Option B — Netlify (drag and drop)

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `ecostep/` folder onto the page
3. Your site is live instantly — copy the URL

### Option C — GitHub Pages

1. Push code to GitHub (main branch)
2. Go to repo → **Settings** → **Pages**
3. Source: **Deploy from a branch** → **main** → **/ (root)**
4. Click **Save** — site live at `https://username.github.io/ecostep`

---

## Evaluation criteria — how EcoStep addresses each

### Code Quality
- Clean module separation: `ChatEngine`, `Dashboard`, `PledgeTracker`, `UIHelpers` as named comment sections
- Full JSDoc on every function (param types, return types, descriptions)
- `'use strict'` at top of file
- Named constants (`MAX_INPUT_LEN`, `MODEL`, `API_ENDPOINT`) — no magic numbers
- Consistent naming: camelCase functions, SCREAMING_SNAKE constants

### Security
- **Content-Security-Policy** meta tag: restricts scripts, styles, connect targets
- **`escapeHtml()`** sanitises all user and API content before any DOM insertion
- **Input capped** at 500 chars via both `maxlength` attribute AND JS `.slice()`
- **No `eval()`**, no `innerHTML` with raw user strings anywhere
- **No API keys** in client code — Anthropic handles auth via claude.ai platform

### Efficiency
- Zero build step, zero npm dependencies
- Dashboard only renders when AI returns footprint data (lazy)
- CSS transitions use `cubic-bezier` hardware-accelerated transforms
- `prefers-reduced-motion` disables all animations for performance + accessibility
- Input disabling during API call prevents duplicate requests

### Testing
- **31 automated unit tests** in `tests/ecostep.test.js` — runs with `npm test`
- Zero external test dependencies — custom micro-harness
- Covers: security (XSS escaping), grade logic, score calculation, number formatting, pledge savings, data validation, input length
- **14 manual test scenarios** in `tests/manual-tests.md`

### Accessibility
- **Semantic HTML5**: `<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`, `<article>`
- **ARIA roles**: `role="log"` (chat), `role="progressbar"` (bars), `role="checkbox"` (pledges), `role="tablist/tab/tabpanel"` (tabs), `role="status"` (pledge summary)
- **`aria-live`**: chat log (`polite`), pledge summary (`polite`), char count (`polite`)
- **Skip link**: keyboard users can jump past navigation to main content
- **Full keyboard navigation**: all interactive elements reachable and operable via Tab + Enter/Space
- **Dark mode**: `prefers-color-scheme: dark` — every color uses CSS variables
- **Reduced motion**: `prefers-reduced-motion: reduce` disables all CSS transitions and animations
- **Focus ring**: `focus-visible` outline on all interactive elements
- **Color contrast**: all text/background pairs meet WCAG AA (4.5:1 minimum)

---

## Assumptions

- Users are India-based; all emission factors and comparisons use Indian data
- The Anthropic API (Claude Sonnet) is available at runtime via claude.ai
- Monthly electricity bill in units (kWh) is the proxy for home energy — most Indian households know this
- A modern browser (Chrome/Firefox/Safari 2022+) with `fetch` API is used

---

## License

MIT — free to use, modify, and deploy.

---

*Built by Diksha · B.Tech CSE, Rajarambapu Institute of Technology, Islampur · GSSoC '26 Mentor · ECWoC Top Contributor (Rank 24/5000+)*
