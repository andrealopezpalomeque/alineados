import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[gemini] GEMINI_API_KEY not set — article processing will fail');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

// Model for relevance gate (Layer 2 filtering) — same model, gate prompt is tiny
export const geminiModelFast = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
