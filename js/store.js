import { CONSTANTS } from './config.js';

/**
 * Encapsulates localStorage operations for robust state management
 */
export const Store = {
  getApiKey() {
    return sessionStorage.getItem(CONSTANTS.STORAGE_KEY_API) || '';
  },
  setApiKey(key) {
    sessionStorage.setItem(CONSTANTS.STORAGE_KEY_API, key);
  },
  clearApiKey() {
    sessionStorage.removeItem(CONSTANTS.STORAGE_KEY_API);
  },

  getChatHistory() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEY_CHAT);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  saveChatHistory(history) {
    localStorage.setItem(CONSTANTS.STORAGE_KEY_CHAT, JSON.stringify(history));
  },
  clearChatHistory() {
    localStorage.removeItem(CONSTANTS.STORAGE_KEY_CHAT);
  },

  getPledges() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEY_PLEDGES);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch { return new Set(); }
  },
  savePledges(set) {
    localStorage.setItem(CONSTANTS.STORAGE_KEY_PLEDGES, JSON.stringify([...set]));
  },

  getFootprint() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEY_FOOTPRINT);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  saveFootprint(data) {
    localStorage.setItem(CONSTANTS.STORAGE_KEY_FOOTPRINT, JSON.stringify(data));
  },
  
  clearAll() {
    this.clearApiKey();
    this.clearChatHistory();
    localStorage.removeItem(CONSTANTS.STORAGE_KEY_PLEDGES);
    localStorage.removeItem(CONSTANTS.STORAGE_KEY_FOOTPRINT);
  }
};
