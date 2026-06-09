import { CONSTANTS } from './config.js';
import { Store } from './store.js';
import { renderDashboard } from './dashboard.js';
import { renderPledges } from './pledges.js';
import { sendMessageToGemini } from './api.js';
import { switchTab, addMessage, formatAiReply, updateCharCount } from './ui.js';

let chatHistory = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initTabs();
  initChatEvents();
  initModalEvents();
  
  // Load State
  chatHistory = Store.getChatHistory();
  const savedFootprint = Store.getFootprint();

  renderPledges();

  if (savedFootprint) {
    renderDashboard(savedFootprint);
  }

  // Restore chat or prompt for key
  if (Store.getApiKey()) {
    if (chatHistory.length > 0) {
      chatHistory.forEach(msg => addMessage(msg.role === 'user' ? 'user' : 'ai', msg.role === 'user' ? msg.content : formatAiReply(msg.content)));
      addMessage('ai', 'Welcome back! Your chat history has been restored. 🌿');
    } else {
      startChat();
    }
  } else {
    document.getElementById('apiKeyModal').style.display = 'flex';
  }
});

function initMobileNav() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  
  const toggleNav = () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.hidden = open;
  };
  
  btn.addEventListener('click', toggleNav);
  document.querySelectorAll('.mobile-nav a').forEach(a => {
    a.addEventListener('click', toggleNav);
  });
}

function initTabs() {
  ['chat', 'dash', 'pledges'].forEach(tab => {
    document.getElementById(`tab-${tab}`)?.addEventListener('click', () => switchTab(tab));
  });
  
  // Also hook up the button created by the dashboard
  document.addEventListener('click', (e) => {
    if(e.target && e.target.id === 'btnGoToPledges'){
      switchTab('pledges');
    }
  });
}

function initModalEvents() {
  document.getElementById('saveKeyBtn')?.addEventListener('click', saveApiKey);
  document.getElementById('apiKeyInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveApiKey();
  });
  
  // Add a clear key button in the header (if we added it to HTML)
  document.getElementById('resetAppBtn')?.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear your API key and reset your carbon footprint history?")) {
      Store.clearAll();
      location.reload();
    }
  });
}

function initChatEvents() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('input', () => updateCharCount(input));
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // Quick action buttons
  document.querySelectorAll('.qbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (input) {
        input.value = btn.textContent;
        updateCharCount(input);
        sendMessage();
      }
    });
  });
}

function saveApiKey() {
  const input = document.getElementById('apiKeyInput');
  const key   = input ? input.value.trim() : '';
  if (!key || key.length < 20) {
    const err = document.getElementById('apiKeyError');
    if (err) { err.textContent = 'Please enter a valid Gemini API key (from aistudio.google.com).'; err.hidden = false; }
    return;
  }
  Store.setApiKey(key);
  document.getElementById('apiKeyModal').style.display = 'none';
  startChat();
}

function startChat() {
  const msg = `Namaste! 🌿 I'm your EcoStep carbon coach.\n\nI'll help you understand your personal carbon footprint — based on your actual life in India, not global averages.\n\n<strong>Let's start:</strong> How do you usually get around day to day — own vehicle, public transport, or a mix of both?`;
  addMessage('ai', msg);
  chatHistory.push({role: 'assistant', content: msg});
  Store.saveChatHistory(chatHistory);
}

async function sendMessage() {
  if (isLoading) return;

  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const rawText = input ? input.value.trim() : '';
  if (!rawText) return;

  const text = rawText.slice(0, CONSTANTS.MAX_INPUT_LEN);
  input.value = '';
  updateCharCount(input);
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });
  Store.saveChatHistory(chatHistory);

  isLoading = true;
  if (input)   input.disabled   = true;
  if (sendBtn) sendBtn.disabled = true;

  const thinkingEl = addMessage('thinking', '<i class="ti ti-loader spin" style="display:inline-block"></i> 🌱 Thinking...');

  try {
    const rawReply = await sendMessageToGemini(chatHistory);
    chatHistory.push({ role: 'assistant', content: rawReply });
    Store.saveChatHistory(chatHistory);

    const dataMatch = rawReply.match(/<FOOTPRINT_DATA>([\s\S]*?)<\/FOOTPRINT_DATA>/);
    const displayText = rawReply.replace(/<FOOTPRINT_DATA>[\s\S]*?<\/FOOTPRINT_DATA>/g, '').trim();

    const dashLink = dataMatch
      ? '\n\n→ <a id="dashLink" role="button" tabindex="0">View your footprint dashboard</a>'
      : '';

    if (thinkingEl) thinkingEl.remove();
    
    // Add msg
    const msgEl = addMessage('ai', formatAiReply(displayText) + dashLink);
    
    // Hook up dynamic link
    if (dataMatch) {
      const link = msgEl.querySelector('#dashLink');
      if (link) {
        link.addEventListener('click', () => switchTab('dash'));
        link.addEventListener('keydown', e => { if (e.key==='Enter' || e.key===' ') switchTab('dash'); });
      }

      try {
        const parsed = JSON.parse(dataMatch[1].trim());
        Store.saveFootprint(parsed);
        renderDashboard(parsed);
      } catch (parseErr) {
        console.error('EcoStep: failed to parse footprint JSON', parseErr);
      }
    }
  } catch (err) {
    if (thinkingEl) thinkingEl.remove();
    addMessage('ai', `<strong>Error:</strong> ${err.message}. Please check your API key or internet connection.`);
    console.error('EcoStep: API error', err);
    // If auth error, pop modal again
    if(err.message.includes("API key not valid")) {
      Store.clearApiKey();
      document.getElementById('apiKeyModal').style.display = 'flex';
    }
  } finally {
    isLoading = false;
    if (input)   { input.disabled   = false; input.focus(); }
    if (sendBtn)   sendBtn.disabled = false;
  }
}
