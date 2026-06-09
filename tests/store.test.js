import { Store } from '../js/store.js';
import { jest } from '@jest/globals';

// Mock localStorage and sessionStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('Store Module (Persistence)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('API Key Management', () => {
    test('12. getApiKey returns empty string if no key', () => {
      expect(Store.getApiKey()).toBe('');
    });
    test('13. setApiKey saves key to sessionStorage', () => {
      Store.setApiKey('test_key_123');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('ecostep_api_key', 'test_key_123');
      expect(Store.getApiKey()).toBe('test_key_123');
    });
    test('14. clearApiKey removes key from sessionStorage', () => {
      Store.setApiKey('test');
      Store.clearApiKey();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('ecostep_api_key');
      expect(Store.getApiKey()).toBe('');
    });
  });

  describe('Chat History', () => {
    test('15. getChatHistory returns empty array by default', () => {
      expect(Store.getChatHistory()).toEqual([]);
    });
    test('16. saveChatHistory serializes and saves array', () => {
      const hist = [{role: 'user', content: 'hi'}];
      Store.saveChatHistory(hist);
      expect(localStorage.setItem).toHaveBeenCalledWith('ecostep_chat_history', JSON.stringify(hist));
    });
    test('17. getChatHistory parses saved JSON array correctly', () => {
      const hist = [{role: 'assistant', content: 'hello'}];
      Store.saveChatHistory(hist);
      expect(Store.getChatHistory()).toEqual(hist);
    });
    test('18. getChatHistory handles invalid JSON gracefully', () => {
      localStorage.setItem('ecostep_chat_history', '{invalid_json[');
      expect(Store.getChatHistory()).toEqual([]);
    });
  });

  describe('Pledges', () => {
    test('19. getPledges returns empty Set by default', () => {
      expect(Store.getPledges() instanceof Set).toBe(true);
      expect(Store.getPledges().size).toBe(0);
    });
    test('20. savePledges serializes Set to Array', () => {
      const pSet = new Set(['p1', 'p2']);
      Store.savePledges(pSet);
      expect(localStorage.setItem).toHaveBeenCalledWith('ecostep_pledges', JSON.stringify(['p1', 'p2']));
    });
    test('21. getPledges deserializes Array to Set correctly', () => {
      Store.savePledges(new Set(['tree', 'bus']));
      const retrieved = Store.getPledges();
      expect(retrieved.has('tree')).toBe(true);
      expect(retrieved.has('bus')).toBe(true);
    });
  });

  describe('Footprint Data', () => {
    test('22. getFootprint returns null by default', () => {
      expect(Store.getFootprint()).toBeNull();
    });
    test('23. saveFootprint handles complex objects', () => {
      const data = { total: 100, breakdown: { transport: 50 } };
      Store.saveFootprint(data);
      expect(Store.getFootprint()).toEqual(data);
    });
  });

  describe('clearAll', () => {
    test('24. clearAll wipes both local and session storage target keys', () => {
      Store.setApiKey('a');
      Store.saveChatHistory(['b']);
      Store.savePledges(new Set(['c']));
      Store.clearAll();
      expect(Store.getApiKey()).toBe('');
      expect(Store.getChatHistory()).toEqual([]);
      expect(Store.getPledges().size).toBe(0);
    });
  });
});
