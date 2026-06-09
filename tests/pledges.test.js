import { renderPledges } from '../js/pledges.js';
import { Store } from '../js/store.js';
import { jest } from '@jest/globals';

describe('Pledges Module', () => {
  let getSpy, saveSpy;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="pledgeGrid"></div>
      <div id="pledgeSummary" hidden></div>
    `;
    jest.clearAllMocks();
    getSpy = jest.spyOn(Store, 'getPledges');
    saveSpy = jest.spyOn(Store, 'savePledges');
  });

  test('49. Gracefully exits if container missing', () => {
    document.body.innerHTML = '';
    getSpy.mockReturnValue(new Set());
    expect(() => renderPledges()).not.toThrow();
  });

  test('50. Renders pledges into DOM and respects "done" state', () => {
    getSpy.mockReturnValue(new Set(['metro']));
    renderPledges();
    const grid = document.getElementById('pledgeGrid');
    
    // There are 12 pledges defined in config.js
    expect(grid.children.length).toBe(12);
    
    // Verify the one 'metro' pledge has the 'done' class
    const firstPledge = grid.querySelector('[data-pledge-id="metro"]');
    expect(firstPledge.classList.contains('done')).toBe(true);
  });

  test('51. Toggles pledge state on click', () => {
    const mockSet = new Set(['metro']);
    getSpy.mockReturnValue(mockSet);
    
    renderPledges();
    
    const vegPledge = document.querySelector('[data-pledge-id="veg"]');
    
    // Click it to add to set
    vegPledge.dispatchEvent(new MouseEvent('click'));
    
    // Should call save with 'metro' and 'veg'
    expect(saveSpy).toHaveBeenCalled();
    const savedSet = saveSpy.mock.calls[0][0];
    expect(savedSet.has('metro')).toBe(true);
    expect(savedSet.has('veg')).toBe(true);
  });

  test('52. Calculates summary accurately', () => {
    getSpy.mockReturnValue(new Set(['metro', 'veg'])); // 52 + 35 = 87
    renderPledges();
    
    const summary = document.getElementById('pledgeSummary');
    expect(summary.hidden).toBe(false);
    expect(summary.innerHTML).toContain('87 kg CO₂');
  });

  test('53. Hides summary if no pledges', () => {
    getSpy.mockReturnValue(new Set());
    renderPledges();
    const summary = document.getElementById('pledgeSummary');
    expect(summary.hidden).toBe(true);
  });
});
