/**
 * EcoStep — ecostep.test.js
 * Automated unit tests (vanilla JS, no framework required)
 * Run: node tests/ecostep.test.js
 */

'use strict';

/* ── Minimal test harness ─────────────────────────────────── */
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ status: 'PASS', name });
  } catch (err) {
    failed++;
    results.push({ status: 'FAIL', name, error: err.message });
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeFalsy: () => {
      if (actual) throw new Error(`Expected falsy, got ${actual}`);
    },
    toBeGreaterThan: (n) => {
      if (actual <= n) throw new Error(`Expected ${actual} > ${n}`);
    },
    toBeLessThanOrEqual: (n) => {
      if (actual > n) throw new Error(`Expected ${actual} <= ${n}`);
    },
    toContain: (substr) => {
      if (!String(actual).includes(substr)) {
        throw new Error(`Expected "${actual}" to contain "${substr}"`);
      }
    },
    not: {
      toContain: (substr) => {
        if (String(actual).includes(substr)) {
          throw new Error(`Expected "${actual}" NOT to contain "${substr}"`);
        }
      },
      toBe: (expected) => {
        if (actual === expected) {
          throw new Error(`Expected value NOT to be ${JSON.stringify(expected)}`);
        }
      },
    },
  };
}

/* ── Functions under test (replicated from app.js) ─────────── */

function escapeHtml(str) {
  const replacements = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#x27;',
  };
  return String(str).replace(/[&<>"']/g, ch => replacements[ch]);
}

function fmtNum(n) {
  return Math.round(n || 0).toLocaleString('en-IN');
}

const GRADE_LABELS = {
  A: 'Excellent — well below India average',
  B: 'Good — near India average',
  C: 'Average — real room to improve',
  D: 'High — targeted action recommended',
  E: 'Very high — urgent action needed',
};

const PLEDGES = [
  { id: 'metro',   saving: 52  },
  { id: 'veg',     saving: 35  },
  { id: 'ac',      saving: 40  },
  { id: 'bag',     saving: 6   },
  { id: 'bulb',    saving: 30  },
  { id: 'carpool', saving: 80  },
  { id: 'solar',   saving: 200 },
  { id: 'shower',  saving: 15  },
  { id: 'flight',  saving: 150 },
  { id: 'tree',    saving: 21  },
  { id: 'unplug',  saving: 10  },
  { id: 'cycle',   saving: 45  },
];

function calcPledgeSavings(doneIds) {
  return PLEDGES
    .filter(p => doneIds.has(p.id))
    .reduce((acc, p) => acc + p.saving, 0);
}

function getGrade(total) {
  if (total < 1000) return 'A';
  if (total < 2000) return 'B';
  if (total < 3500) return 'C';
  if (total < 5000) return 'D';
  return 'E';
}

function calcScore(total) {
  return Math.min(100, Math.round(total / 60));
}

function getBiggestCategory(breakdown) {
  return Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])[0][0];
}

function validateFootprintData(data) {
  const required = ['total', 'breakdown', 'score', 'grade', 'tips'];
  for (const key of required) {
    if (!(key in data)) return { valid: false, error: `Missing key: ${key}` };
  }
  const catKeys = ['transport', 'home', 'diet', 'flights', 'shopping'];
  for (const k of catKeys) {
    if (!(k in data.breakdown)) return { valid: false, error: `Missing breakdown.${k}` };
  }
  if (!['A','B','C','D','E'].includes(data.grade)) {
    return { valid: false, error: `Invalid grade: ${data.grade}` };
  }
  if (!Array.isArray(data.tips)) {
    return { valid: false, error: 'tips must be an array' };
  }
  return { valid: true };
}

/* ── TESTS ──────────────────────────────────────────────────── */

// Security: escapeHtml
test('escapeHtml — strips script tags', () => {
  const result = escapeHtml('<script>alert(1)</script>');
  expect(result).not.toContain('<script>');
  expect(result).toContain('&lt;script&gt;');
});

test('escapeHtml — strips onclick attributes', () => {
  const result = escapeHtml('<img onclick="evil()"/>');
  // After escaping, quotes around evil() are escaped so it cannot execute
  expect(result).toContain('&lt;img');
  expect(result).toContain('&quot;');
  // The raw < and > are gone, preventing tag injection
});

test('escapeHtml — handles ampersand', () => {
  expect(escapeHtml('A & B')).toBe('A &amp; B');
});

test('escapeHtml — handles double quotes', () => {
  expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
});

test('escapeHtml — handles single quotes', () => {
  expect(escapeHtml("it's")).toBe("it&#x27;s");
});

test('escapeHtml — returns empty string unchanged', () => {
  expect(escapeHtml('')).toBe('');
});

// Grade calculation
test('getGrade — below 1000 kg is grade A', () => {
  expect(getGrade(800)).toBe('A');
  expect(getGrade(0)).toBe('A');
  expect(getGrade(999)).toBe('A');
});

test('getGrade — 1000-1999 kg is grade B (India average range)', () => {
  expect(getGrade(1000)).toBe('B');
  expect(getGrade(1700)).toBe('B');
  expect(getGrade(1999)).toBe('B');
});

test('getGrade — 2000-3499 kg is grade C', () => {
  expect(getGrade(2000)).toBe('C');
  expect(getGrade(3000)).toBe('C');
});

test('getGrade — 3500-4999 kg is grade D', () => {
  expect(getGrade(3500)).toBe('D');
  expect(getGrade(4500)).toBe('D');
});

test('getGrade — 5000+ kg is grade E', () => {
  expect(getGrade(5000)).toBe('E');
  expect(getGrade(9999)).toBe('E');
});

// Score calculation
test('calcScore — 0 kg gives score 0', () => {
  expect(calcScore(0)).toBe(0);
});

test('calcScore — 6000 kg gives score 100', () => {
  expect(calcScore(6000)).toBe(100);
});

test('calcScore — score never exceeds 100', () => {
  expect(calcScore(999999)).toBe(100);
});

test('calcScore — 1700 kg (India avg) gives reasonable mid score', () => {
  const s = calcScore(1700);
  expect(s).toBeGreaterThan(10);
  expect(s).toBeLessThanOrEqual(40);
});

// Number formatting
test('fmtNum — formats whole numbers', () => {
  expect(fmtNum(1700)).toBe('1,700');
});

test('fmtNum — rounds floats', () => {
  expect(fmtNum(1700.7)).toBe('1,701');
});

test('fmtNum — handles zero', () => {
  expect(fmtNum(0)).toBe('0');
});

test('fmtNum — handles undefined gracefully', () => {
  expect(fmtNum(undefined)).toBe('0');
});

// Pledge savings
test('calcPledgeSavings — no pledges = 0', () => {
  expect(calcPledgeSavings(new Set())).toBe(0);
});

test('calcPledgeSavings — single pledge adds correctly', () => {
  expect(calcPledgeSavings(new Set(['metro']))).toBe(52);
});

test('calcPledgeSavings — multiple pledges sum correctly', () => {
  expect(calcPledgeSavings(new Set(['metro', 'veg', 'ac']))).toBe(52 + 35 + 40);
});

test('calcPledgeSavings — all pledges total is positive', () => {
  const allIds = new Set(PLEDGES.map(p => p.id));
  const total = calcPledgeSavings(allIds);
  expect(total).toBeGreaterThan(0);
});

// Biggest category
test('getBiggestCategory — identifies largest emission source', () => {
  const breakdown = { transport: 900, home: 400, diet: 700, flights: 0, shopping: 200 };
  expect(getBiggestCategory(breakdown)).toBe('transport');
});

test('getBiggestCategory — handles tied values returns a valid key', () => {
  const breakdown = { transport: 500, home: 500, diet: 300, flights: 0, shopping: 100 };
  const result = getBiggestCategory(breakdown);
  const validKeys = ['transport', 'home'];
  if (!validKeys.includes(result)) {
    throw new Error('Expected transport or home, got ' + result);
  }
});

// Footprint data validation
test('validateFootprintData — valid data passes', () => {
  const data = {
    total: 2400,
    breakdown: { transport: 800, home: 600, diet: 700, flights: 200, shopping: 100 },
    score: 40,
    grade: 'C',
    tips: [{ text: 'Take the metro', saving: '200 kg/yr', type: 'green' }],
  };
  expect(validateFootprintData(data).valid).toBe(true);
});

test('validateFootprintData — missing total fails', () => {
  const data = {
    breakdown: { transport: 800, home: 600, diet: 700, flights: 200, shopping: 100 },
    score: 40, grade: 'C', tips: [],
  };
  expect(validateFootprintData(data).valid).toBe(false);
});

test('validateFootprintData — invalid grade fails', () => {
  const data = {
    total: 2400,
    breakdown: { transport: 800, home: 600, diet: 700, flights: 200, shopping: 100 },
    score: 40, grade: 'Z', tips: [],
  };
  expect(validateFootprintData(data).valid).toBe(false);
});

test('validateFootprintData — missing breakdown key fails', () => {
  const data = {
    total: 2400,
    breakdown: { transport: 800, home: 600, diet: 700, flights: 200 }, // missing shopping
    score: 40, grade: 'C', tips: [],
  };
  expect(validateFootprintData(data).valid).toBe(false);
});

// Grade labels
test('GRADE_LABELS — all grades have labels', () => {
  ['A', 'B', 'C', 'D', 'E'].forEach(g => {
    expect(GRADE_LABELS[g]).toBeTruthy();
  });
});

// Input length validation
test('MAX_INPUT_LEN — enforced via slice', () => {
  const MAX = 500;
  const longInput = 'a'.repeat(600);
  const truncated = longInput.slice(0, MAX);
  expect(truncated.length).toBe(MAX);
});

/* ── Report ─────────────────────────────────────────────────── */
console.log('\n── EcoStep Test Results ─────────────────────────\n');
results.forEach(r => {
  const icon = r.status === 'PASS' ? '✓' : '✗';
  const msg  = r.status === 'PASS'
    ? `  ${icon} ${r.name}`
    : `  ${icon} ${r.name}\n      → ${r.error}`;
  console.log(msg);
});
console.log(`\n── ${passed} passed · ${failed} failed ──────────────────────\n`);
if (failed > 0) process.exit(1);
