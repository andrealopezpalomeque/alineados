import { db } from '../config/firebase.js';
import { geminiModel } from '../config/gemini.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { Article } from '../types/index.js';

export interface BriefingItem {
  articleId: string;
  headline: string;
  summary: string;
  urgency: 'breaking' | 'important' | 'routine';
  source: string;
  time: string;
}

export interface BriefingSection {
  title: string;
  icon: string;
  items: BriefingItem[];
}

export interface Briefing {
  id: string;
  generatedAt: Timestamp;
  executiveSummary: string;
  sections: BriefingSection[];
}

function getARTDayBoundaries(date: Date): { start: Date; end: Date } {
  // ART = UTC-3. Get the start/end of the given day in ART.
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Start of day in ART (00:00:00 ART = 03:00:00 UTC)
  const start = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
  // End of day in ART (23:59:59.999 ART = next day 02:59:59.999 UTC)
  const end = new Date(Date.UTC(year, month, day + 1, 2, 59, 59, 999));

  return { start, end };
}

function getYesterdayART(): Date {
  // "Now" in ART: subtract 3 hours from UTC to get ART wall-clock
  const now = new Date();
  const artNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  // Yesterday in ART
  artNow.setDate(artNow.getDate() - 1);
  return artNow;
}

function formatDateId(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function fetchArticlesForDate(date: Date): Promise<(Article & { id: string })[]> {
  const { start, end } = getARTDayBoundaries(date);

  const snapshot = await db.collection('articles')
    .where('processed', '==', true)
    .where('publishedAt', '>=', Timestamp.fromDate(start))
    .where('publishedAt', '<=', Timestamp.fromDate(end))
    .orderBy('publishedAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as (Article & { id: string })[];
}

function buildBriefingPrompt(articles: (Article & { id: string })[]): string {
  const articlesJson = articles.map(a => ({
    id: a.id,
    title: a.title,
    source: a.source,
    category: a.category,
    summary: a.summary,
    urgency: a.urgency,
    politicalActors: a.politicalActors,
    keyQuotes: a.keyQuotes,
    publishedAt: a.publishedAt,
  }));

  return `You are preparing the morning briefing for the Minister of Justice and Human Rights of Corrientes Province, Argentina.
Governor: Juan Pablo Valdés (Vamos Corrientes / UCR coalition, sworn in Dec 2025).
Minister reading this: Juan José López Desimoni (Justice & Human Rights).

From today's processed articles, create a JSON response with:
1. "executiveSummary": 3-5 sentence overview of the political day. What matters most? Lead with the most important development.
2. "sections": array of objects, each with:
   - "title": section name
   - "icon": emoji
   - "items": array of {articleId, headline, summary (1-2 sentences focused on political relevance), urgency (breaking/important/routine), source, time}

Sections should be in this order:
- "El Gobernador" (icon: 🏛) — What Governor Valdés did/said
- "Justicia y DDHH" (icon: ⚖) — Courts, justice policy, human rights
- "Gabinete" (icon: 👥) — Other ministers' public activity
- "Oposición" (icon: 📢) — Opposition statements and activity
- "Nacional" (icon: 🇦🇷) — National news affecting the province

Only include sections that have content. Skip empty sections.
Prioritize: breaking > important > routine within each section.
Be concise and factual. No editorializing. Use formal tone (title + surname for political figures).
Respond ONLY with valid JSON, no markdown fences, no preamble.

Articles to analyze:
${JSON.stringify(articlesJson, null, 2)}`;
}

function parseGeminiResponse(text: string): { executiveSummary: string; sections: BriefingSection[] } {
  try {
    return JSON.parse(text);
  } catch {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error(`Could not parse JSON from Gemini response: ${text.substring(0, 200)}`);
  }
}

export async function generateBriefing(targetDate?: Date): Promise<Briefing> {
  const date = targetDate || getYesterdayART();
  const dateId = formatDateId(date);

  console.log(`[briefing] Generating briefing for ${dateId}`);

  const articles = await fetchArticlesForDate(date);
  console.log(`[briefing] Found ${articles.length} processed articles for ${dateId}`);

  if (articles.length === 0) {
    const briefing: Briefing = {
      id: dateId,
      generatedAt: Timestamp.now(),
      executiveSummary: 'No se registraron noticias relevantes.',
      sections: [],
    };

    await db.collection('dailyBriefings').doc(dateId).set(briefing);
    console.log(`[briefing] Stored empty briefing for ${dateId}`);
    return briefing;
  }

  const prompt = buildBriefingPrompt(articles);

  let parsed: { executiveSummary: string; sections: BriefingSection[] };
  let attempts = 0;

  while (true) {
    attempts++;
    try {
      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text();
      parsed = parseGeminiResponse(responseText);
      break;
    } catch (error) {
      if (attempts >= 2) {
        console.error(`[briefing] Gemini failed after ${attempts} attempts:`, error);
        // Store partial briefing
        const partialBriefing: Briefing = {
          id: dateId,
          generatedAt: Timestamp.now(),
          executiveSummary: `Error al generar el briefing. Se encontraron ${articles.length} artículos pero el procesamiento falló.`,
          sections: [],
        };
        await db.collection('dailyBriefings').doc(dateId).set(partialBriefing);
        console.log(`[briefing] Stored partial (error) briefing for ${dateId}`);
        return partialBriefing;
      }
      console.warn(`[briefing] Gemini attempt ${attempts} failed, retrying...`, error);
    }
  }

  const briefing: Briefing = {
    id: dateId,
    generatedAt: Timestamp.now(),
    executiveSummary: parsed.executiveSummary || '',
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
  };

  await db.collection('dailyBriefings').doc(dateId).set(briefing);
  console.log(`[briefing] Stored briefing for ${dateId} with ${briefing.sections.length} sections`);

  return briefing;
}
