import { CONSTANTS } from './config.js';

/**
 * Encapsulates localStorage and sessionStorage operations for robust state management.
 * Provides abstraction over browser storage APIs to securely manage keys, history, and footprint data.
 * @namespace Store
 */
export const Store = {
  /**
   * Retrieves the Gemini API key from session storage.
   * @returns {string} The stored API key or an empty string if not found.
   */
  getApiKey() {
    return sessionStorage.getItem(CONSTANTS.STORAGE_KEY_API) || '';
  },
  /**
   * Securely saves the API key to session storage (destroyed on tab close).
   * @param {string} key - The API key to store.
   */
  setApiKey(key) {
    sessionStorage.setItem(CONSTANTS.STORAGE_KEY_API, key);
  },
  /**
   * Removes the API key from session storage.
   */
  clearApiKey() {
    sessionStorage.removeItem(CONSTANTS.STORAGE_KEY_API);
  },

  /**
   * Retrieves the saved chat history from local storage.
   * @returns {Array<Object>} Array of message objects ({role, content}).
   */
  getChatHistory() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEY_CHAT);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  /**
   * Persists the chat history to local storage.
   * @param {Array<Object>} messages - Array of message objects to save.
   */
  saveChatHistory(messages) {
    localStorage.setItem(CONSTANTS.STORAGE_KEY_CHAT, JSON.stringify(messages));
  },
  /**
   * Removes the chat history from local storage.
   */
  clearChatHistory() {
    localStorage.removeItem(CONSTANTS.STORAGE_KEY_CHAT);
  },

  /**
   * Retrieves the set of completed pledges from local storage.
   * @returns {Set<string>} Set containing the IDs of completed pledges.
   */
  getPledges() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEY_PLEDGES);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch { return new Set(); }
  },
  /**
   * Saves the set of completed pledges to local storage by converting it to an array.
   * @param {Set<string>} pledgeSet - The set of pledge IDs to save.
   */
  savePledges(pledgeSet) {
    localStorage.setItem(CONSTANTS.STORAGE_KEY_PLEDGES, JSON.stringify([...pledgeSet]));
  },

  /**
   * Retrieves the parsed footprint JSON data from local storage.
   * @returns {Object|null} The footprint data object, or null if not found.
   */
  getFootprint() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEY_FOOTPRINT);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  /**
   * Persists the footprint JSON data to local storage.
   * @param {Object} data - The footprint data object to save.
   */
  saveFootprint(data) {
    localStorage.setItem(CONSTANTS.STORAGE_KEY_FOOTPRINT, JSON.stringify(data));
  },
  
  /**
   * Completely clears all EcoStep related data from both local and session storage.
   */
  clearAll() {
    this.clearApiKey();
    this.clearChatHistory();
    localStorage.removeItem(CONSTANTS.STORAGE_KEY_PLEDGES);
    localStorage.removeItem(CONSTANTS.STORAGE_KEY_FOOTPRINT);
  }
};
