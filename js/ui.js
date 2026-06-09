import { CONSTANTS } from './config.js';

/**
 * Safely escapes HTML characters to prevent XSS attacks when rendering user input.
 * @param {string} str - The unescaped input string.
 * @returns {string} The HTML-escaped string.
 */
export function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

/**
 * Formats the AI's markdown response into safe HTML.
 * Uses DOMPurify if available to completely sanitize the output against XSS.
 * @param {string} text - The raw markdown text from the AI.
 * @returns {string} Safe, rendered HTML string.
 */
export function formatAiReply(text) {
  let safeHtml = text;
  // If DOMPurify is loaded via CDN in index.html, use it for 100% safe rendering
  if (window.DOMPurify) {
    safeHtml = window.DOMPurify.sanitize(text);
  } else {
    safeHtml = escapeHtml(text);
  }
  return safeHtml
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

/**
 * Switches the active UI tab (e.g., 'Chat', 'Dashboard', 'Pledges').
 * Uses try/catch to ensure graceful failure if a DOM element is missing.
 * @param {string} tabId - The ID of the tab to activate.
 */
export function switchTab(tabId) {
  try {
  document.querySelectorAll('.app-panel').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
  document.querySelectorAll('.app-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById('panel-' + tabId);
  const tab   = document.getElementById('tab-'   + tabId);
  if (panel) { panel.classList.add('active'); panel.hidden = false; }
  if (tab)   { tab.classList.add('active');   tab.setAttribute('aria-selected', 'true'); }
  } catch (err) {
    // Graceful failure handled silently
  }
}

/**
 * Appends a new chat message to the DOM.
 * @param {string} role - The role of the sender ('user' or 'ai').
 * @param {string} content - The message content (HTML for AI, raw string for user).
 * @returns {HTMLElement|null} The created message element, or null if container missing.
 */
export function addMessage(role, content) {
  const container = document.getElementById('chatMessages');
  if (!container) return null;

  const el = document.createElement('div');
  el.className = 'message ' + role;

  if (role === 'user') {
    el.innerHTML = escapeHtml(content).replace(/\n/g, '<br/>');
  } else {
    el.innerHTML = content;
  }

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

/**
 * Updates the character count warning on the input field.
 * @param {HTMLInputElement} inputEl - The chat input DOM element.
 */
export function updateCharCount(inputEl) {
  const el = document.getElementById('charCount');
  if (!el) return;
  const len = inputEl.value.length;
  if (len >= CONSTANTS.CHAR_WARN_AT) {
    el.textContent = `${len}/${CONSTANTS.MAX_INPUT_LEN}`;
    el.classList.add('warn');
  } else {
    el.textContent = '';
    el.classList.remove('warn');
  }
}
