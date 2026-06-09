import { CONSTANTS } from './config.js';

export function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

export function formatAiReply(text) {
  let safeHtml = text;
  // If DOMPurify is loaded via CDN in index.html, use it for 100% safe rendering
  if (window.DOMPurify) {
    safeHtml = window.DOMPurify.sanitize(text, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'] });
  } else {
    safeHtml = escapeHtml(text);
  }
  return safeHtml
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export function switchTab(name) {
  document.querySelectorAll('.app-panel').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
  document.querySelectorAll('.app-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById('panel-' + name);
  const tab   = document.getElementById('tab-'   + name);
  if (panel) { panel.classList.add('active'); panel.hidden = false; }
  if (tab)   { tab.classList.add('active');   tab.setAttribute('aria-selected', 'true'); }
}

export function addMessage(role, html) {
  const container = document.getElementById('chatMessages');
  if (!container) return null;

  const el = document.createElement('div');
  el.className = 'message ' + role;

  if (role === 'user') {
    el.innerHTML = escapeHtml(html).replace(/\n/g, '<br/>');
  } else {
    el.innerHTML = html;
  }

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

export function updateCharCount(input) {
  const el = document.getElementById('charCount');
  if (!el) return;
  const len = input.value.length;
  if (len >= CONSTANTS.CHAR_WARN_AT) {
    el.textContent = `${len}/${CONSTANTS.MAX_INPUT_LEN}`;
    el.classList.add('warn');
  } else {
    el.textContent = '';
    el.classList.remove('warn');
  }
}
