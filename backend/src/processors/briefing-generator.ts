import { db } from '../config/firebase.js';
import { geminiModel } from '../config/gemini.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { Article, ArticleCategory } from '../types/index.js';

const MAX_ARTICLES_PER_CATEGORY = 15;

export type BriefingType = 'recap' | 'midday';

const URGENCY_ORDER: Record<string, number> = { breaking: 0, important: 1, routine: 2 };

const CATEGORY_SECTION_MAP: Record<string, { title: string; icon: string }> = {
  governor: { title: 'El Gobernador', icon: '\u{1F3DB}' },
  justice: { title: 'Justicia y DDHH', icon: '\u2696' },
  ministry: { title: 'Gabinete', icon: '\u{1F465}' },
  opposition: { title: 'Oposición', icon: '\u{1F4E2}' },
  national: { title: 'Nacional', icon: '\u{1F1E6}\u{1F1F7}' },
  general: { title: 'General', icon: '\u{1F4F0}' },
};

const SECTION_ORDER: string[] = ['governor', 'justice', 'ministry', 'opposition', 'national', 'general'];

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
  type: BriefingType;
  generatedAt: Timestamp;
  updatedAt?: Timestamp;
  executiveSummary: string;
  sections: BriefingSection[];
}

// Track last generation attempt for status endpoint
let lastGenerationStatus: {
  date: string;
  type: BriefingType;
  attemptedAt: Date;
  success: boolean;
  error?: string;
  articleCount: number;
  sectionCount: number;
} | null = null;

export function getLastGenerationStatus() {
  return lastGenerationStatus;
}

function getARTDayBoundaries(date: Date): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const start = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, day + 1, 2, 59, 59, 999));

  return { start, end };
}

function getARTDayStart(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
}

function getYesterdayART(): Date {
  const now = new Date();
  const artNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  artNow.setDate(artNow.getDate() - 1);
  return artNow;
}

function getTodayART(): Date {
  const now = new Date();
  return new Date(now.getTime() - 3 * 60 * 60 * 1000);
}

function formatDateId(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatARTTime(date: Date): string {
  const artTime = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const h = String(artTime.getUTCHours()).padStart(2, '0');
  const m = String(artTime.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

async function fetchArticlesForRange(start: Date, end: Date): Promise<(Article & { id: string })[]> {
  console.log(`[briefing] Query range: ${start.toISOString()} → ${end.toISOString()}`);

  const snapshot = await db.collection('articles')
    .where('processed', '==', true)
    .where('publishedAt', '>=', Timestamp.fromDate(start))
    .where('publishedAt', '<=', Timestamp.fromDate(end))
    .orderBy('publishedAt', 'desc')
    .get();

  console.log(`[briefing] Firestore returned ${snapshot.docs.length} processed articles in range`);

  const results: (Article & { id: string })[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const publishedAt = data.publishedAt?.toDate?.() || data.publishedAt;
    if (data.filtered) {
      console.log(`[briefing]   EXCLUDED (filtered): "${data.title}" [${data.category}] publishedAt=${publishedAt}`);
    } else if (data.archived) {
      console.log(`[briefing]   EXCLUDED (archived): "${data.title}" [${data.category}] publishedAt=${publishedAt}`);
    } else {
      console.log(`[briefing]   INCLUDED: "${data.title}" [${data.category}, ${data.urgency}] publishedAt=${publishedAt}`);
      results.push({ id: doc.id, ...data } as Article & { id: string });
    }
  }

  return results;
}

function groupByCategory(articles: (Article & { id: string })[]): Record<string, (Article & { id: string })[]> {
  const groups: Record<string, (Article & { id: string })[]> = {};

  for (const article of articles) {
    const cat = article.category || 'general';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(article);
  }

  for (const cat of Object.keys(groups)) {
    groups[cat].sort((a, b) => {
      const urgA = URGENCY_ORDER[a.urgency || 'routine'] ?? 2;
      const urgB = URGENCY_ORDER[b.urgency || 'routine'] ?? 2;
      if (urgA !== urgB) return urgA - urgB;

      const timeA = a.publishedAt instanceof Date ? a.publishedAt.getTime() : 0;
      const timeB = b.publishedAt instanceof Date ? b.publishedAt.getTime() : 0;
      return timeB - timeA;
    });

    if (groups[cat].length > MAX_ARTICLES_PER_CATEGORY) {
      groups[cat] = groups[cat].slice(0, MAX_ARTICLES_PER_CATEGORY);
    }
  }

  return groups;
}

function parseJsonResponse<T>(text: string): T {
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

    throw new Error(`Could not parse JSON: ${text.substring(0, 200)}`);
  }
}

async function callGeminiWithRetry<T>(prompt: string, label: string): Promise<T> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text();
      return parseJsonResponse<T>(responseText);
    } catch (error) {
      if (attempt >= 2) {
        console.error(`[briefing] ${label}: failed after ${attempt} attempts:`, error);
        throw error;
      }
      console.warn(`[briefing] ${label}: attempt ${attempt} failed, retrying in 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  throw new Error('Unreachable');
}

async function summarizeCategory(
  category: string,
  articles: (Article & { id: string })[],
): Promise<BriefingItem[]> {
  const categoryName = CATEGORY_SECTION_MAP[category]?.title || category;
  console.log(`[briefing] Processing category: ${category} (${articles.length} articles)...`);

  const articlesJson = articles.map(a => {
    // Format publishedAt as HH:mm ART so Gemini returns a clean time string
    let timeStr = '';
    const raw = a.publishedAt;
    if (raw instanceof Timestamp) {
      timeStr = formatARTTime(raw.toDate());
    } else if (raw instanceof Date) {
      timeStr = formatARTTime(raw);
    } else if (typeof raw === 'string' || typeof raw === 'number') {
      timeStr = formatARTTime(new Date(raw));
    }

    return {
      id: a.id,
      title: a.title,
      source: a.source,
      summary: a.summary,
      urgency: a.urgency,
      politicalActors: a.politicalActors,
      keyQuotes: a.keyQuotes,
      time: timeStr,
    };
  });

  const prompt = `You are a political analyst for Corrientes Province, Argentina. Governor: Juan Pablo Valdés (UCR).
From these articles in the "${categoryName}" category, select the 3-5 most politically relevant items for the Minister of Justice and Human Rights.
For each selected item return: { articleId, headline, summary (1-2 sentences, factual, formal tone), urgency (breaking/important/routine), source, time (use the time field from the input, format HH:mm) }
Respond ONLY with valid JSON: { "items": [...] }

Articles:
${JSON.stringify(articlesJson, null, 2)}`;

  const result = await callGeminiWithRetry<{ items: BriefingItem[] }>(prompt, `category:${category}`);
  const items = Array.isArray(result.items) ? result.items : [];
  console.log(`[briefing] Category ${category}: selected ${items.length} items`);
  return items;
}

async function generateExecutiveSummary(
  selectedByCategory: Record<string, BriefingItem[]>,
  type: BriefingType,
  updateTime?: string,
): Promise<{ executiveSummary: string; sections: BriefingSection[] }> {
  console.log('[briefing] Pass 2: generating executive summary...');

  const selectedItemsJson: Record<string, BriefingItem[]> = {};
  for (const cat of SECTION_ORDER) {
    if (selectedByCategory[cat]?.length) {
      const sectionInfo = CATEGORY_SECTION_MAP[cat];
      selectedItemsJson[sectionInfo.title] = selectedByCategory[cat];
    }
  }

  const summaryInstruction = type === 'midday'
    ? `1. "executiveSummary": 3-5 sentence resumen de la jornada hasta el momento. Lead with the most important development. End with "Actualizado a las ${updateTime || '18:00'}."`
    : '1. "executiveSummary": 3-5 sentence overview of the political day. Lead with the most important development.';

  const prompt = `You are preparing the ${type === 'midday' ? 'midday update' : 'morning briefing'} for the Minister of Justice and Human Rights of Corrientes Province, Argentina.
Governor: Juan Pablo Valdés (Vamos Corrientes / UCR coalition, sworn in Dec 2025).

From these pre-selected items, generate:
${summaryInstruction}
2. "sections": repackage the items into sections in this order:
   - "El Gobernador" (icon: 🏛)
   - "Justicia y DDHH" (icon: ⚖)
   - "Gabinete" (icon: 👥)
   - "Oposición" (icon: 📢)
   - "Nacional" (icon: 🇦🇷)
   - "General" (icon: 📰) — only if there are general items
Only include sections that have items. Sort items within each section: breaking first, then important, then routine.
Respond ONLY with valid JSON, no markdown fences.

Selected items by category:
${JSON.stringify(selectedItemsJson, null, 2)}`;

  return callGeminiWithRetry<{ executiveSummary: string; sections: BriefingSection[] }>(
    prompt,
    'executive-summary',
  );
}

export interface GenerateBriefingOptions {
  date?: string;
  type?: BriefingType;
}

export async function generateBriefing(options?: GenerateBriefingOptions): Promise<Briefing> {
  const type: BriefingType = options?.type || 'recap';

  let date: Date;
  if (options?.date) {
    date = new Date(options.date + 'T12:00:00-03:00');
  } else {
    date = type === 'recap' ? getYesterdayART() : getTodayART();
  }

  const dateId = formatDateId(date);
  const briefingId = `${dateId}-${type}`;

  console.log(`[briefing] Generating ${type} briefing for ${dateId} (id: ${briefingId})`);

  // Determine query range
  let start: Date;
  let end: Date;

  if (type === 'midday') {
    start = getARTDayStart(date);
    end = new Date(); // now
  } else {
    const bounds = getARTDayBoundaries(date);
    start = bounds.start;
    end = bounds.end;
  }

  console.log(`[briefing] Date range for ${type}: start=${start.toISOString()} end=${end.toISOString()}`);
  const articles = await fetchArticlesForRange(start, end);
  console.log(`[briefing] Found ${articles.length} processed articles for ${dateId} (${type})`);

  if (articles.length === 0) {
    const now = Timestamp.now();
    const existingDoc = await db.collection('dailyBriefings').doc(briefingId).get();
    const generatedAt = existingDoc.exists ? existingDoc.data()!.generatedAt : now;

    const briefing: Briefing = {
      id: briefingId,
      type,
      generatedAt,
      updatedAt: now,
      executiveSummary: type === 'midday'
        ? `No se registraron noticias relevantes hasta el momento. Actualizado a las ${formatARTTime(new Date())}.`
        : 'No se registraron noticias relevantes.',
      sections: [],
    };

    await db.collection('dailyBriefings').doc(briefingId).set(briefing);
    console.log(`[briefing] Stored empty ${type} briefing for ${dateId}`);

    lastGenerationStatus = {
      date: dateId,
      type,
      attemptedAt: new Date(),
      success: true,
      articleCount: 0,
      sectionCount: 0,
    };

    return briefing;
  }

  try {
    const groups = groupByCategory(articles);
    const categories = Object.keys(groups).filter(cat => groups[cat].length > 0);
    console.log(`[briefing] Categories with articles: ${categories.join(', ')}`);

    // PASS 1: Summarize each category in parallel
    const categoryResults: Record<string, BriefingItem[]> = {};
    const categoryPromises = categories.map(async (cat) => {
      try {
        const items = await summarizeCategory(cat, groups[cat]);
        categoryResults[cat] = items;
      } catch (error) {
        console.error(`[briefing] Failed to process category ${cat}:`, error);
        categoryResults[cat] = [];
      }
    });

    await Promise.all(categoryPromises);

    const totalSelected = Object.values(categoryResults).reduce((sum, items) => sum + items.length, 0);
    console.log(`[briefing] Pass 1 complete: ${totalSelected} items selected across ${categories.length} categories`);

    if (totalSelected === 0) {
      const now = Timestamp.now();
      const existingDoc = await db.collection('dailyBriefings').doc(briefingId).get();
      const generatedAt = existingDoc.exists ? existingDoc.data()!.generatedAt : now;

      const briefing: Briefing = {
        id: briefingId,
        type,
        generatedAt,
        updatedAt: now,
        executiveSummary: 'No se identificaron noticias de relevancia política.',
        sections: [],
      };

      await db.collection('dailyBriefings').doc(briefingId).set(briefing);

      lastGenerationStatus = {
        date: dateId,
        type,
        attemptedAt: new Date(),
        success: true,
        articleCount: articles.length,
        sectionCount: 0,
      };

      return briefing;
    }

    // PASS 2: Executive summary + final sections
    const updateTime = type === 'midday' ? formatARTTime(new Date()) : undefined;
    const parsed = await generateExecutiveSummary(categoryResults, type, updateTime);

    const now = Timestamp.now();
    const existingDoc = await db.collection('dailyBriefings').doc(briefingId).get();
    const generatedAt = existingDoc.exists ? existingDoc.data()!.generatedAt : now;

    const briefing: Briefing = {
      id: briefingId,
      type,
      generatedAt,
      updatedAt: now,
      executiveSummary: parsed.executiveSummary || '',
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    };

    await db.collection('dailyBriefings').doc(briefingId).set(briefing);
    console.log(`[briefing] Stored ${type} briefing for ${dateId} with ${briefing.sections.length} sections`);

    lastGenerationStatus = {
      date: dateId,
      type,
      attemptedAt: new Date(),
      success: true,
      articleCount: articles.length,
      sectionCount: briefing.sections.length,
    };

    return briefing;
  } catch (error) {
    console.error(`[briefing] Generation failed for ${briefingId}:`, error);

    const now = Timestamp.now();
    const existingDoc = await db.collection('dailyBriefings').doc(briefingId).get();
    const generatedAt = existingDoc.exists ? existingDoc.data()!.generatedAt : now;

    const partialBriefing: Briefing = {
      id: briefingId,
      type,
      generatedAt,
      updatedAt: now,
      executiveSummary: `Error al generar el briefing. Se encontraron ${articles.length} artículos pero el procesamiento falló.`,
      sections: [],
    };

    await db.collection('dailyBriefings').doc(briefingId).set(partialBriefing);

    lastGenerationStatus = {
      date: dateId,
      type,
      attemptedAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      articleCount: articles.length,
      sectionCount: 0,
    };

    return partialBriefing;
  }
}
