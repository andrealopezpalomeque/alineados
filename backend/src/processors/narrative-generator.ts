import { db } from '../config/firebase.js';
import { geminiModelNarrative } from '../config/gemini.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { Article, NarrativeReport } from '../types/index.js';

// ─── Status tracking ────────────────────────────────────────────────

let lastGenerationStatus: {
  weekId: string;
  attemptedAt: Date;
  success: boolean;
  error?: string;
  articleCount: number;
} | null = null;

export function getNarrativeGenerationStatus() {
  return lastGenerationStatus;
}

// ─── ISO week helpers ───────────────────────────────────────────────

function getISOWeekId(date: Date): string {
  // Clone to avoid mutation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getCurrentWeekId(): string {
  // Current time in ART (UTC-3)
  const now = new Date();
  const artNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return getISOWeekId(artNow);
}

function getPreviousWeekId(weekId: string): string {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid week ID: ${weekId}`);

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, '0')}`;
  }

  // Week 1 → last week of previous year. Use Dec 28 which is always in the last ISO week.
  const dec28 = new Date(Date.UTC(year - 1, 11, 28));
  return getISOWeekId(dec28);
}

function getWeekBoundariesUTC(weekId: string): { start: Date; end: Date } {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid week ID: ${weekId}`);

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Find Jan 4 of the year (always in ISO week 1), then find its Monday
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Mon=1 .. Sun=7
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));

  // Target Monday = week1Monday + (week - 1) * 7 days
  const monday = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);

  // Monday 00:00 ART = Monday 03:00 UTC
  const start = new Date(Date.UTC(
    monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 3, 0, 0, 0,
  ));

  // Sunday 23:59:59.999 ART = next Monday 02:59:59.999 UTC
  const nextMonday = new Date(monday.getTime() + 7 * 86400000);
  const end = new Date(Date.UTC(
    nextMonday.getUTCFullYear(), nextMonday.getUTCMonth(), nextMonday.getUTCDate(), 2, 59, 59, 999,
  ));

  return { start, end };
}

// ─── Firestore queries ──────────────────────────────────────────────

async function fetchArticlesForRange(start: Date, end: Date): Promise<(Article & { id: string })[]> {
  const snapshot = await db.collection('articles')
    .where('processed', '==', true)
    .where('publishedAt', '>=', Timestamp.fromDate(start))
    .where('publishedAt', '<=', Timestamp.fromDate(end))
    .orderBy('publishedAt', 'desc')
    .get();

  return snapshot.docs
    .filter(doc => !doc.data().filtered && !doc.data().archived)
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (Article & { id: string })[];
}

async function fetchPreviousReport(weekId: string): Promise<NarrativeReport | null> {
  const prevWeekId = getPreviousWeekId(weekId);
  const doc = await db.collection('narrativeAnalysis').doc(prevWeekId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as NarrativeReport;
}

// ─── JSON parsing (same robust pattern as briefing-generator) ───────

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
      const result = await geminiModelNarrative.generateContent(prompt);
      const responseText = result.response.text();
      return parseJsonResponse<T>(responseText);
    } catch (error) {
      if (attempt >= 2) {
        console.error(`[narrative] ${label}: failed after ${attempt} attempts:`, error);
        throw error;
      }
      console.warn(`[narrative] ${label}: attempt ${attempt} failed, retrying in 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  throw new Error('Unreachable');
}

// ─── Prompt construction ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a political communication analyst for the provincial government of Corrientes, Argentina.
Governor: Juan Pablo Valdes (Vamos Corrientes / UCR coalition, sworn in Dec 2025).
Primary reader: Juan Jose Lopez Desimoni, Minister of Justice and Human Rights.

Analyze this week's news articles and interviews. Compare with last week's data when provided.

Return a JSON object with these fields (the system will add id, periodStart, periodEnd, generatedAt):

- "executiveSummary": string — 3-5 sentences summarizing the political week in Spanish. Highlight the dominant narrative, any shifts from last week, and what to watch next week.

- "themes": array of objects — 5-8 most prominent political themes:
  { "name": string, "mentionCount": number, "trend": "up"|"down"|"stable", "weekOverWeekDelta": number, "context": string (why this matters), "relatedArticleIds": string[] }

- "governorFrames": array — Governor's communication patterns this week:
  { "frame": string, "communicationType": "credit-claiming"|"agenda-setting"|"coalition-building"|"crisis-response"|"blame-deflection", "frequency": "alta"|"media"|"baja", "exampleQuote": string, "analysis": string }

- "oppositionNarratives": array — Opposition narrative tracking:
  { "actor": string, "narrative": string, "mentionCount": number, "momentum": "growing"|"stable"|"declining"|"emerging", "riskAssessment": string }

- "sentimentBySource": array — Sentiment per news source:
  { "source": string, "positivePercent": number, "neutralPercent": number, "negativePercent": number }
  Percentages must add up to 100 for each source.

- "timeline": array — 5-10 key political moments in chronological order:
  { "date": string (e.g. "Lun 3"), "event": string, "type": "gobierno"|"oposicion"|"nacional", "articleId": string (optional) }

Write in Spanish. Be factual and analytical, never editorializing.
Respond ONLY with valid JSON, no markdown fences.`;

function buildArticlePayload(articles: (Article & { id: string })[]) {
  return articles.map(a => {
    let publishedAtISO = '';
    const raw = a.publishedAt;
    if (raw instanceof Timestamp) {
      publishedAtISO = raw.toDate().toISOString();
    } else if (raw instanceof Date) {
      publishedAtISO = raw.toISOString();
    } else if (typeof raw === 'string' || typeof raw === 'number') {
      publishedAtISO = new Date(raw).toISOString();
    }

    return {
      id: a.id,
      title: a.title,
      source: a.source,
      summary: a.summary,
      category: a.category,
      sentiment: a.sentiment,
      urgency: a.urgency,
      politicalActors: a.politicalActors,
      keyQuotes: a.keyQuotes,
      topics: a.topics,
      publishedAt: publishedAtISO,
    };
  });
}

function buildPrompt(
  articles: (Article & { id: string })[],
  previousReport: NarrativeReport | null,
): string {
  const articlesPayload = buildArticlePayload(articles);

  let prompt = `${SYSTEM_PROMPT}\n\n--- THIS WEEK'S ARTICLES (${articles.length}) ---\n${JSON.stringify(articlesPayload, null, 2)}`;

  if (previousReport) {
    const prevSummary = {
      executiveSummary: previousReport.executiveSummary,
      themes: previousReport.themes,
      governorFrames: previousReport.governorFrames,
      oppositionNarratives: previousReport.oppositionNarratives,
    };
    prompt += `\n\n--- LAST WEEK'S REPORT (for trend comparison) ---\n${JSON.stringify(prevSummary, null, 2)}`;
  }

  return prompt;
}

// ─── Main generator ─────────────────────────────────────────────────

interface GeminiNarrativeResponse {
  executiveSummary: string;
  themes: NarrativeReport['themes'];
  governorFrames: NarrativeReport['governorFrames'];
  oppositionNarratives: NarrativeReport['oppositionNarratives'];
  sentimentBySource: NarrativeReport['sentimentBySource'];
  timeline: NarrativeReport['timeline'];
}

export async function generateNarrativeReport(weekOverride?: string): Promise<NarrativeReport> {
  const weekId = weekOverride || getCurrentWeekId();
  console.log(`[narrative] Generating narrative report for ${weekId}`);

  const { start, end } = getWeekBoundariesUTC(weekId);
  console.log(`[narrative] Week boundaries: ${start.toISOString()} to ${end.toISOString()}`);

  const articles = await fetchArticlesForRange(start, end);
  console.log(`[narrative] Found ${articles.length} articles for ${weekId}`);

  // Handle empty articles case
  if (articles.length === 0) {
    const now = Timestamp.now();
    const report: NarrativeReport = {
      id: weekId,
      periodStart: Timestamp.fromDate(start),
      periodEnd: Timestamp.fromDate(end),
      generatedAt: now,
      executiveSummary: 'No se registraron articulos procesados durante esta semana.',
      themes: [],
      governorFrames: [],
      oppositionNarratives: [],
      sentimentBySource: [],
      timeline: [],
    };

    await db.collection('narrativeAnalysis').doc(weekId).set(report);
    console.log(`[narrative] Stored empty report for ${weekId}`);

    lastGenerationStatus = {
      weekId,
      attemptedAt: new Date(),
      success: true,
      articleCount: 0,
    };

    return report;
  }

  // Fetch previous week's report for trend comparison
  const previousReport = await fetchPreviousReport(weekId);
  if (previousReport) {
    console.log(`[narrative] Found previous week's report for comparison`);
  } else {
    console.log(`[narrative] No previous week's report found`);
  }

  // Call Gemini
  const prompt = buildPrompt(articles, previousReport);
  const parsed = await callGeminiWithRetry<GeminiNarrativeResponse>(prompt, 'narrative-analysis');

  const now = Timestamp.now();
  const report: NarrativeReport = {
    id: weekId,
    periodStart: Timestamp.fromDate(start),
    periodEnd: Timestamp.fromDate(end),
    generatedAt: now,
    executiveSummary: parsed.executiveSummary || '',
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    governorFrames: Array.isArray(parsed.governorFrames) ? parsed.governorFrames : [],
    oppositionNarratives: Array.isArray(parsed.oppositionNarratives) ? parsed.oppositionNarratives : [],
    sentimentBySource: Array.isArray(parsed.sentimentBySource) ? parsed.sentimentBySource : [],
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
  };

  await db.collection('narrativeAnalysis').doc(weekId).set(report);
  console.log(`[narrative] Stored report for ${weekId}: ${report.themes.length} themes, ${report.timeline.length} timeline events`);

  lastGenerationStatus = {
    weekId,
    attemptedAt: new Date(),
    success: true,
    articleCount: articles.length,
  };

  return report;
}
