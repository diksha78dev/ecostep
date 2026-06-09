import { sendMessageToGemini } from '../js/api.js';
import { Store } from '../js/store.js';
import { jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Store.setApiKey('fake_key_123');
  });

  test('39. Throws error if API key is missing', async () => {
    Store.clearApiKey();
    await expect(sendMessageToGemini([])).rejects.toThrow('API Key missing');
  });

  test('40. Formats request body correctly for Gemini', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'mock response' }] } }] })
    });
    await sendMessageToGemini([{ role: 'user', content: 'hello' }]);
    
    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = fetch.mock.calls[0];
    const url = fetchArgs[0];
    const options = fetchArgs[1];
    
    expect(url).toContain('key=fake_key_123');
    expect(options.method).toBe('POST');
    
    const body = JSON.parse(options.body);
    expect(body.contents[0].role).toBe('user');
    expect(body.contents[0].parts[0].text).toBe('hello');
  });

  test('41. Parses successful response perfectly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'success text' }] } }] })
    });
    const result = await sendMessageToGemini([]);
    expect(result).toBe('success text');
  });

  test('42. Throws error on HTTP failure (401)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'API key not valid' } })
    });
    await expect(sendMessageToGemini([])).rejects.toThrow('API key not valid');
  });

  test('43. Throws generic error on HTTP failure without JSON payload', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('No JSON'); }
    });
    await expect(sendMessageToGemini([])).rejects.toThrow('API Error: 500');
  });
});
