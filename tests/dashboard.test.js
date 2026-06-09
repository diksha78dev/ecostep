import { renderDashboard } from '../js/dashboard.js';

describe('Dashboard Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="dashContent"></div>';
  });

  const sampleData = {
    total: 2400,
    breakdown: { transport: 800, home: 600, diet: 700, flights: 200, shopping: 100 },
    score: 42,
    grade: "B",
    tips: [
      { text: "Tip 1", saving: "200 kg", type: "green" },
      { text: "Tip 2", saving: "40 kg", type: "amber" }
    ]
  };

  test('44. Gracefully exits if container is missing', () => {
    document.body.innerHTML = ''; // no container
    expect(() => renderDashboard(sampleData)).not.toThrow();
  });

  test('45. Renders data correctly into DOM', () => {
    renderDashboard(sampleData);
    const container = document.getElementById('dashContent');
    expect(container.innerHTML).toContain('2,400'); // total formatted
    expect(container.innerHTML).toContain('B'); // grade
    expect(container.innerHTML).toContain('Transport'); // breakdown
    expect(container.innerHTML).toContain('Tip 1'); // tips
  });

  test('46. Handles missing tips gracefully', () => {
    const noTipsData = { ...sampleData, tips: null };
    renderDashboard(noTipsData);
    const container = document.getElementById('dashContent');
    expect(container.innerHTML).toContain('2,400');
    expect(container.innerHTML).not.toContain('Personalised actions');
  });

  test('47. Identifies Gamification Level correctly', () => {
    renderDashboard(sampleData);
    const container = document.getElementById('dashContent');
    expect(container.innerHTML).toContain('Gamification Level');
    expect(container.innerHTML).toContain('Eco-Novice 🌱');
  });

  test('48. Missing or null values default to 0 safely', () => {
    const badData = { total: null, breakdown: {}, score: null, grade: null };
    renderDashboard(badData);
    const container = document.getElementById('dashContent');
    expect(container.innerHTML).toContain('0'); // formatted 0
  });
});
