import { escapeHtml, formatAiReply, switchTab, addMessage, updateCharCount } from '../js/ui.js';
import { CONSTANTS } from '../js/config.js';
import { jest } from '@jest/globals';

describe('UI Module', () => {
  describe('escapeHtml', () => {
    test('25. Escapes basic HTML tags', () => {
      expect(escapeHtml('<div>Hello</div>')).toBe('&lt;div&gt;Hello&lt;/div&gt;');
    });
    test('26. Escapes ampersands', () => {
      expect(escapeHtml('A & B')).toContain('&amp;');
    });
    test('27. Handles empty strings safely', () => {
      expect(escapeHtml('')).toBe('');
    });
    test('28. Converts numbers to escaped strings', () => {
      expect(escapeHtml(123)).toBe('123');
    });
  });

  describe('formatAiReply', () => {
    test('29. Replaces **bold** with <strong> tags', () => {
      const res = formatAiReply('This is **important** info.');
      expect(res).toContain('<strong>important</strong>');
    });
    test('30. Replaces newlines with <br/>', () => {
      const res = formatAiReply('Line 1\nLine 2');
      expect(res).toContain('<br/>');
    });
    test('31. Uses DOMPurify if available globally', () => {
      window.DOMPurify = { sanitize: jest.fn(str => 'purified_' + str) };
      const res = formatAiReply('test');
      expect(window.DOMPurify.sanitize).toHaveBeenCalled();
      expect(res).toContain('purified_test');
      delete window.DOMPurify;
    });
  });

  describe('DOM manipulations', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="app-tab" id="tab-test1"></div>
        <div class="app-tab" id="tab-test2"></div>
        <div class="app-panel" id="panel-test1"></div>
        <div class="app-panel" id="panel-test2"></div>
        <div id="chatMessages"></div>
        <span id="charCount"></span>
        <input id="testInput" value="" />
      `;
    });

    test('32. switchTab removes active class from all tabs and panels', () => {
      document.getElementById('tab-test1').classList.add('active');
      document.getElementById('panel-test1').classList.add('active');
      switchTab('test2');
      expect(document.getElementById('tab-test1').classList.contains('active')).toBe(false);
      expect(document.getElementById('panel-test1').classList.contains('active')).toBe(false);
    });

    test('33. switchTab adds active class to target tab and panel', () => {
      switchTab('test2');
      expect(document.getElementById('tab-test2').classList.contains('active')).toBe(true);
      expect(document.getElementById('panel-test2').classList.contains('active')).toBe(true);
    });

    test('34. addMessage creates user message element properly', () => {
      const el = addMessage('user', 'Hello <script>');
      expect(el.className).toBe('message user');
      expect(el.innerHTML).toContain('&lt;script&gt;'); // verify escaping
      expect(document.getElementById('chatMessages').children.length).toBe(1);
    });

    test('35. addMessage creates ai message element without double escaping', () => {
      const el = addMessage('ai', '<strong>Bold</strong>');
      expect(el.className).toBe('message ai');
      expect(el.innerHTML).toContain('<strong>Bold</strong>');
    });

    test('36. addMessage handles missing container gracefully', () => {
      document.body.innerHTML = ''; // Remove container
      const el = addMessage('user', 'test');
      expect(el).toBeNull();
    });

    test('37. updateCharCount shows length', () => {
      const input = document.getElementById('testInput');
      input.value = 'a'.repeat(CONSTANTS.CHAR_WARN_AT);
      updateCharCount(input);
      const span = document.getElementById('charCount');
      expect(span.textContent).toBe(`${CONSTANTS.CHAR_WARN_AT}/${CONSTANTS.MAX_INPUT_LEN}`);
      expect(span.classList.contains('warn')).toBe(true);
    });

    test('38. updateCharCount hides warning if length is short', () => {
      const input = document.getElementById('testInput');
      input.value = 'short';
      updateCharCount(input);
      const span = document.getElementById('charCount');
      expect(span.textContent).toBe('');
      expect(span.classList.contains('warn')).toBe(false);
    });
  });
});
