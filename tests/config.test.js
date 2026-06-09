import { CONSTANTS, PLEDGES, SYSTEM_PROMPT } from '../js/config.js';

describe('Config & Constants Module', () => {
  describe('CONSTANTS', () => {
    test('1. MODEL is defined correctly', () => {
      expect(CONSTANTS.MODEL).toBe('gemini-2.5-flash');
    });
    test('2. API_URL points to Google API', () => {
      expect(CONSTANTS.API_URL).toContain('generativelanguage.googleapis.com');
    });
    test('3. MAX_TOKENS is bounded to a sensible limit', () => {
      expect(CONSTANTS.MAX_TOKENS).toBeGreaterThan(100);
      expect(CONSTANTS.MAX_TOKENS).toBeLessThanOrEqual(4096);
    });
    test('4. MAX_INPUT_LEN is bounded to prevent abuse', () => {
      expect(CONSTANTS.MAX_INPUT_LEN).toBe(500);
    });
    test('5. Warning threshold is lower than max limit', () => {
      expect(CONSTANTS.CHAR_WARN_AT).toBeLessThan(CONSTANTS.MAX_INPUT_LEN);
    });
    test('6. Storage keys are uniquely prefixed', () => {
      expect(CONSTANTS.STORAGE_KEY_API).toBe('ecostep_api_key');
      expect(CONSTANTS.STORAGE_KEY_CHAT).toBe('ecostep_chat_history');
      expect(CONSTANTS.STORAGE_KEY_FOOTPRINT).toContain('footprint');
    });
  });

  describe('PLEDGES', () => {
    test('7. PLEDGES is an array with items', () => {
      expect(Array.isArray(PLEDGES)).toBe(true);
      expect(PLEDGES.length).toBeGreaterThan(5);
    });
    test('8. Every pledge has a valid unique ID', () => {
      const ids = PLEDGES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
    test('9. Every pledge has valid schema (title, ico, saving)', () => {
      PLEDGES.forEach(p => {
        expect(p.title).toBeTruthy();
        expect(typeof p.title).toBe('string');
        expect(p.ico).toBeTruthy();
        expect(typeof p.saving).toBe('number');
        expect(p.saving).toBeGreaterThan(0);
      });
    });
  });

  describe('SYSTEM_PROMPT', () => {
    test('10. Contains Indian emission context', () => {
      expect(SYSTEM_PROMPT).toContain('India');
      expect(SYSTEM_PROMPT).toContain('auto-rickshaw');
      expect(SYSTEM_PROMPT).toContain('LPG');
    });
    test('11. Contains strictly formatted JSON wrapper instructions', () => {
      expect(SYSTEM_PROMPT).toContain('<FOOTPRINT_DATA>');
      expect(SYSTEM_PROMPT).toContain('</FOOTPRINT_DATA>');
    });
  });
});
