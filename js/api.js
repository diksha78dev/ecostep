import { CONSTANTS, SYSTEM_PROMPT } from './config.js';
import { Store } from './store.js';

export async function sendMessageToGemini(chatHistory) {
  const apiKey = Store.getApiKey();
  if (!apiKey) throw new Error("API Key missing");

  const geminiBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: chatHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: CONSTANTS.MAX_TOKENS,
      temperature: 0.7,
    },
  };

  const url = `${CONSTANTS.API_URL}/${CONSTANTS.MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const rawReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return rawReply;
}
