# Narrative Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Weekly AI-powered narrative analysis that surfaces political themes, governor messaging frames, opposition tracking, and sentiment analysis from scraped news.

**Architecture:** Backend processor (`narrative-generator.ts`) queries 7 days of articles, sends to Gemini 2.5 Flash for analysis, stores in `narrativeAnalysis/{YYYY-WXX}`. Express routes serve the data. Frontend fetches via API and renders in a tabbed page with 6 section components.

**Tech Stack:** Gemini 2.5 Flash (AI), Firestore (storage), Express (API), Nuxt 4 + Vue 3 + Tailwind (frontend), GitHub Actions (cron)

---

### Task 1: Backend — Update Cleanup to Protect Collections

**Files:**
- Modify: `backend/src/routes/cleanup.ts`

The cleanup route already only targets the `articles` collection, so `narrativeAnalysis` and `dailyBriefings` are already safe from the hard delete. But the archive-week route needs adjustment: change from "archive before last Monday" to "archive articles older than 30 days." Add explicit comments documenting which collections are protected.

**Step 1: Update archive-week logic**

In `backend/src/routes/cleanup.ts`, replace the archive-week route's cutoff calculation (lines 50-64) to use 30-day retention instead of "last Monday":

```typescript
// POST /api/cleanup/archive-week — mark articles older than 30 days as archived
// NOTE: This route ONLY affects the 'articles' collection.
// The 'narrativeAnalysis' and 'dailyBriefings' collections are NEVER modified by cleanup.
router.post('/archive-week', async (_req: Request, res: Response) => {
  try {
    const ARCHIVE_DAYS = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    console.log(`[cleanup] Archiving articles older than ${ARCHIVE_DAYS} days (before ${cutoff.toISOString()})`);
    // ... rest of archiving logic stays the same (batch loop for archived === false, then legacy loop)
```

Also add a comment to the DELETE route (line 10):

```typescript
// DELETE /api/cleanup — remove articles older than 90 days
// NOTE: Only affects 'articles' collection. 'narrativeAnalysis' and 'dailyBriefings' are NEVER deleted.
```

**Step 2: Verify the change compiles**

Run: `cd backend && yarn build`
Expected: Successful compilation

**Step 3: Commit**

```bash
git add backend/src/routes/cleanup.ts
git commit -m "feat: update archive to 30-day retention, document protected collections"
```

---

### Task 2: Backend — Narrative Report Types

**Files:**
- Modify: `backend/src/types/index.ts`

**Step 1: Add NarrativeReport types to backend**

Append to `backend/src/types/index.ts`:

```typescript
// ─── Narrative Analysis ─────────────────────────────────────────────

export interface NarrativeTheme {
  name: string;
  mentionCount: number;
  trend: 'up' | 'down' | 'stable';
  weekOverWeekDelta: number;
  context: string;
  relatedArticleIds: string[];
}

export interface GovernorFrame {
  frame: string;
  communicationType:
    | 'credit-claiming'
    | 'agenda-setting'
    | 'coalition-building'
    | 'crisis-response'
    | 'blame-deflection';
  frequency: 'alta' | 'media' | 'baja';
  exampleQuote: string;
  analysis: string;
}

export interface OppositionNarrative {
  actor: string;
  narrative: string;
  mentionCount: number;
  momentum: 'growing' | 'stable' | 'declining' | 'emerging';
  riskAssessment: string;
}

export interface SourceSentiment {
  source: string;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: 'gobierno' | 'oposicion' | 'nacional';
  articleId?: string;
  interviewId?: string;
}

export interface NarrativeReport {
  id: string;
  periodStart: Timestamp | Date;
  periodEnd: Timestamp | Date;
  generatedAt: Timestamp | Date;
  executiveSummary: string;
  themes: NarrativeTheme[];
  governorFrames: GovernorFrame[];
  oppositionNarratives: OppositionNarrative[];
  sentimentBySource: SourceSentiment[];
  timeline: TimelineEvent[];
}
```

**Step 2: Verify compilation**

Run: `cd backend && yarn build`
Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/types/index.ts
git commit -m "feat: add NarrativeReport types"
```

---

### Task 3: Backend — Gemini Model for Narrative Analysis

**Files:**
- Modify: `backend/src/config/gemini.ts`

**Step 1: Add narrative model export**

Add a new export using `gemini-2.5-flash` (not lite) for the heavier narrative synthesis:

```typescript
// Model for narrative analysis — full flash for complex weekly synthesis
export const geminiModelNarrative = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**Step 2: Verify compilation**

Run: `cd backend && yarn build`
Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/config/gemini.ts
git commit -m "feat: add gemini-2.5-flash model for narrative analysis"
```

---

### Task 4: Backend — Narrative Generator Processor

**Files:**
- Create: `backend/src/processors/narrative-generator.ts`

This is the core processor. It follows the same patterns as `briefing-generator.ts`: query Firestore, call Gemini, parse JSON, store result.

**Step 1: Create the narrative generator**

Create `backend/src/processors/narrative-generator.ts`:

```typescript
import { db } from '../config/firebase.js';
import { geminiModelNarrative } from '../config/gemini.js';
import { Timestamp } from 'firebase-admin/firestore';
import type { Article, NarrativeReport } from '../types/index.js';

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

function getISOWeekId(date: Date): string {
  // Compute ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  // Get Monday 00:00 ART and Sunday 23:59 ART for the week containing `date`
  const artDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const dayOfWeek = artDate.getUTCDay() || 7; // Monday=1..Sunday=7
  const monday = new Date(artDate);
  monday.setUTCDate(artDate.getUTCDate() - (dayOfWeek - 1));

  const start = new Date(Date.UTC(
    monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(),
    3, 0, 0, 0 // 00:00 ART = 03:00 UTC
  ));

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const end = new Date(Date.UTC(
    sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(),
    26, 59, 59, 999 // 23:59 ART = 02:59+1 UTC
  ));

  return { start, end };
}

function getPreviousWeekId(weekId: string): string {
  // Parse YYYY-WXX and subtract 1 week
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error(`Invalid weekId: ${weekId}`);
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);

  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, '0')}`;
  }
  // First week: go to last week of previous year
  // Use Dec 28 of previous year (always in last ISO week)
  const dec28 = new Date(Date.UTC(year - 1, 11, 28));
  return getISOWeekId(dec28);
}

async function fetchWeekArticles(start: Date, end: Date): Promise<(Article & { id: string })[]> {
  const snapshot = await db.collection('articles')
    .where('processed', '==', true)
    .where('publishedAt', '>=', Timestamp.fromDate(start))
    .where('publishedAt', '<=', Timestamp.fromDate(end))
    .orderBy('publishedAt', 'desc')
    .get();

  return snapshot.docs
    .filter(doc => !doc.data().filtered && !doc.data().archived)
    .map(doc => ({ id: doc.id, ...doc.data() })) as (Article & { id: string })[];
}

async function fetchPreviousReport(weekId: string): Promise<NarrativeReport | null> {
  const prevWeekId = getPreviousWeekId(weekId);
  const doc = await db.collection('narrativeAnalysis').doc(prevWeekId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as NarrativeReport;
}

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

export async function generateNarrativeReport(weekOverride?: string): Promise<NarrativeReport> {
  const now = new Date();
  const weekId = weekOverride || getISOWeekId(now);
  const { start, end } = getWeekBoundaries(now);

  console.log(`[narrative] Generating report for ${weekId} (${start.toISOString()} — ${end.toISOString()})`);

  const [articles, previousReport] = await Promise.all([
    fetchWeekArticles(start, end),
    fetchPreviousReport(weekId),
  ]);

  console.log(`[narrative] Found ${articles.length} articles, previous report: ${previousReport ? 'yes' : 'no'}`);

  if (articles.length === 0) {
    const emptyReport: NarrativeReport = {
      id: weekId,
      periodStart: Timestamp.fromDate(start),
      periodEnd: Timestamp.fromDate(end),
      generatedAt: Timestamp.now(),
      executiveSummary: 'No se encontraron articulos procesados para esta semana.',
      themes: [],
      governorFrames: [],
      oppositionNarratives: [],
      sentimentBySource: [],
      timeline: [],
    };
    await db.collection('narrativeAnalysis').doc(weekId).set(emptyReport);
    lastGenerationStatus = { weekId, attemptedAt: new Date(), success: true, articleCount: 0 };
    return emptyReport;
  }

  const articlesForPrompt = articles.map(a => ({
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
    publishedAt: a.publishedAt instanceof Timestamp ? a.publishedAt.toDate().toISOString() : String(a.publishedAt),
  }));

  const prompt = `${SYSTEM_PROMPT}

This week's articles (${articles.length} total):
${JSON.stringify(articlesForPrompt, null, 2)}

${previousReport ? `Last week's report for trend comparison:
${JSON.stringify({
  themes: previousReport.themes,
  governorFrames: previousReport.governorFrames,
  oppositionNarratives: previousReport.oppositionNarratives,
  sentimentBySource: previousReport.sentimentBySource,
}, null, 2)}` : 'No previous week data available for comparison.'}`;

  try {
    const result = await geminiModelNarrative.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseJsonResponse<Omit<NarrativeReport, 'id' | 'periodStart' | 'periodEnd' | 'generatedAt'>>(responseText);

    const report: NarrativeReport = {
      id: weekId,
      periodStart: Timestamp.fromDate(start),
      periodEnd: Timestamp.fromDate(end),
      generatedAt: Timestamp.now(),
      executiveSummary: parsed.executiveSummary || '',
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      governorFrames: Array.isArray(parsed.governorFrames) ? parsed.governorFrames : [],
      oppositionNarratives: Array.isArray(parsed.oppositionNarratives) ? parsed.oppositionNarratives : [],
      sentimentBySource: Array.isArray(parsed.sentimentBySource) ? parsed.sentimentBySource : [],
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
    };

    await db.collection('narrativeAnalysis').doc(weekId).set(report);
    console.log(`[narrative] Stored report ${weekId}: ${report.themes.length} themes, ${report.timeline.length} timeline events`);

    lastGenerationStatus = { weekId, attemptedAt: new Date(), success: true, articleCount: articles.length };
    return report;
  } catch (error) {
    console.error(`[narrative] Generation failed for ${weekId}:`, error);

    lastGenerationStatus = {
      weekId,
      attemptedAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      articleCount: articles.length,
    };

    throw error;
  }
}
```

**Step 2: Verify compilation**

Run: `cd backend && yarn build`
Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/processors/narrative-generator.ts
git commit -m "feat: add narrative analysis generator processor"
```

---

### Task 5: Backend — Narrative API Routes

**Files:**
- Create: `backend/src/routes/narrative.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create the narrative routes**

Create `backend/src/routes/narrative.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { generateNarrativeReport, getNarrativeGenerationStatus } from '../processors/narrative-generator.js';

const router = Router();

// GET /api/narrative/latest — most recent narrative report
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('narrativeAnalysis')
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'No narrative reports found' });
      return;
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[narrative] Error fetching latest:', error);
    res.status(500).json({ error: 'Failed to fetch narrative report' });
  }
});

// GET /api/narrative/generate-status — last generation attempt
router.get('/generate-status', (_req: Request, res: Response) => {
  const status = getNarrativeGenerationStatus();
  if (!status) {
    res.json({ message: 'No generation attempts since server started.' });
    return;
  }
  res.json(status);
});

// GET /api/narrative/history — last N weeks of reports
router.get('/history', async (req: Request, res: Response) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks as string) || 8, 52);

    const snapshot = await db.collection('narrativeAnalysis')
      .orderBy('generatedAt', 'desc')
      .limit(weeks)
      .get();

    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ reports, count: reports.length });
  } catch (error) {
    console.error('[narrative] Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch narrative history' });
  }
});

// POST /api/narrative/generate — trigger narrative generation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { weekId } = req.body || {};
    const report = await generateNarrativeReport(weekId);

    res.json({
      success: true,
      report: {
        id: report.id,
        executiveSummary: report.executiveSummary,
        themesCount: report.themes.length,
        timelineCount: report.timeline.length,
      },
    });
  } catch (error) {
    console.error('[narrative] Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate narrative report' });
  }
});

// GET /api/narrative/:weekId — specific week's report
router.get('/:weekId', async (req: Request, res: Response) => {
  try {
    const weekId = req.params.weekId;

    if (!/^\d{4}-W\d{2}$/.test(weekId)) {
      res.status(400).json({ error: 'Invalid week ID format. Use YYYY-WXX (e.g., 2026-W10).' });
      return;
    }

    const doc = await db.collection('narrativeAnalysis').doc(weekId).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Narrative report not found for this week' });
      return;
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('[narrative] Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch narrative report' });
  }
});

export default router;
```

**Step 2: Register the route in index.ts**

Add to `backend/src/index.ts` after the briefings import:

```typescript
import narrativeRouter from './routes/narrative.js';
```

And register it after the briefings route:

```typescript
app.use('/api/narrative', narrativeRouter);
```

**Step 3: Verify compilation**

Run: `cd backend && yarn build`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/src/routes/narrative.ts backend/src/index.ts
git commit -m "feat: add narrative analysis API routes"
```

---

### Task 6: Backend — GitHub Actions Cron

**Files:**
- Create: `.github/workflows/narrative-analysis.yml`

**Step 1: Create the workflow**

```yaml
name: Weekly Narrative Analysis

on:
  schedule:
    # Sunday 02:00 UTC = 23:00 ART (after weekly-archive at 03:00 UTC Sunday)
    - cron: '0 2 * * 1'
    # Note: cron '0 2 * * 1' = Monday 02:00 UTC = Sunday 23:00 ART
  workflow_dispatch:

jobs:
  generate-narrative:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Wake up Render backend
        run: |
          echo "Pinging backend to wake from sleep..."
          curl -sf --max-time 120 "${{ secrets.BACKEND_URL }}/health" || true
          echo "Waiting for backend to fully start..."
          sleep 10

      - name: Generate narrative analysis
        run: |
          echo "Generating weekly narrative analysis..."
          RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            "${{ secrets.BACKEND_URL }}/api/narrative/generate" \
            -H "Content-Type: application/json" \
            --max-time 300)

          HTTP_CODE=$(echo "$RESPONSE" | tail -1)
          BODY=$(echo "$RESPONSE" | head -n -1)

          echo "HTTP Status: $HTTP_CODE"

          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Narrative analysis failed with status $HTTP_CODE"
            echo "Response: $BODY"
            exit 1
          fi

          echo "$BODY" | jq -r '"Report \(.report.id): \(.report.themesCount) themes, \(.report.timelineCount) timeline events"' 2>/dev/null
          echo "$BODY" | jq -r '"Summary: \(.report.executiveSummary)"' 2>/dev/null
```

**Step 2: Commit**

```bash
git add .github/workflows/narrative-analysis.yml
git commit -m "feat: add weekly narrative analysis cron job"
```

---

### Task 7: Frontend — Narrative Types

**Files:**
- Create: `frontend/app/types/narrative.ts`

**Step 1: Create frontend types**

```typescript
export interface NarrativeTheme {
  name: string
  mentionCount: number
  trend: 'up' | 'down' | 'stable'
  weekOverWeekDelta: number
  context: string
  relatedArticleIds: string[]
}

export type CommunicationType =
  | 'credit-claiming'
  | 'agenda-setting'
  | 'coalition-building'
  | 'crisis-response'
  | 'blame-deflection'

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  'credit-claiming': 'Reclamo de credito',
  'agenda-setting': 'Fijacion de agenda',
  'coalition-building': 'Construccion de coalicion',
  'crisis-response': 'Respuesta a crisis',
  'blame-deflection': 'Deflexion de culpa',
}

export const COMMUNICATION_TYPE_STYLES: Record<CommunicationType, { bg: string; text: string; border: string }> = {
  'credit-claiming': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'agenda-setting': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'coalition-building': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'crisis-response': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'blame-deflection': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

export interface GovernorFrame {
  frame: string
  communicationType: CommunicationType
  frequency: 'alta' | 'media' | 'baja'
  exampleQuote: string
  analysis: string
}

export type Momentum = 'growing' | 'stable' | 'declining' | 'emerging'

export const MOMENTUM_CONFIG: Record<Momentum, { label: string; bg: string; text: string; border: string }> = {
  growing: { label: 'En crecimiento', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  emerging: { label: 'Emergente', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  stable: { label: 'Estable', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
  declining: { label: 'En declive', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
}

export interface OppositionNarrative {
  actor: string
  narrative: string
  mentionCount: number
  momentum: Momentum
  riskAssessment: string
}

export interface SourceSentiment {
  source: string
  positivePercent: number
  neutralPercent: number
  negativePercent: number
}

export interface TimelineEvent {
  date: string
  event: string
  type: 'gobierno' | 'oposicion' | 'nacional'
  articleId?: string
  interviewId?: string
}

export interface NarrativeReport {
  id: string
  periodStart: string | { _seconds: number; _nanoseconds: number }
  periodEnd: string | { _seconds: number; _nanoseconds: number }
  generatedAt: string | { _seconds: number; _nanoseconds: number }
  executiveSummary: string
  themes: NarrativeTheme[]
  governorFrames: GovernorFrame[]
  oppositionNarratives: OppositionNarrative[]
  sentimentBySource: SourceSentiment[]
  timeline: TimelineEvent[]
}
```

**Step 2: Commit**

```bash
git add frontend/app/types/narrative.ts
git commit -m "feat: add NarrativeReport frontend types"
```

---

### Task 8: Frontend — Pinia Store + Composable

**Files:**
- Create: `frontend/app/stores/narrative.ts`
- Create: `frontend/app/composables/useNarrative.ts`

**Step 1: Create the Pinia store**

Create `frontend/app/stores/narrative.ts`:

```typescript
import { defineStore } from 'pinia'
import type { NarrativeReport } from '~/types/narrative'

export const useNarrativeStore = defineStore('narrative', () => {
  const currentReport = ref<NarrativeReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<Date | null>(null)

  async function fetchLatest(apiBase: string, force = false) {
    if (!force && lastFetchedAt.value) {
      const elapsed = Date.now() - lastFetchedAt.value.getTime()
      if (elapsed < 5 * 60 * 1000 && currentReport.value) return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<NarrativeReport>(`${apiBase}/api/narrative/latest`)
      currentReport.value = response
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        currentReport.value = null
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el analisis semanal'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchByWeek(apiBase: string, weekId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<NarrativeReport>(`${apiBase}/api/narrative/${weekId}`)
      currentReport.value = response
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        currentReport.value = null
        error.value = 'No se encontro analisis para esta semana'
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el analisis'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    currentReport,
    loading,
    error,
    lastFetchedAt,
    fetchLatest,
    fetchByWeek,
  }
})
```

**Step 2: Create the composable**

Create `frontend/app/composables/useNarrative.ts`:

```typescript
import { useNarrativeStore } from '~/stores/narrative'

export function useNarrative() {
  const store = useNarrativeStore()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl as string

  if (import.meta.client) {
    store.fetchLatest(apiBase)
  }

  return {
    report: computed(() => store.currentReport),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    lastFetchedAt: computed(() => store.lastFetchedAt),
    refresh: () => store.fetchLatest(apiBase, true),
    fetchByWeek: (weekId: string) => store.fetchByWeek(apiBase, weekId),
  }
}
```

**Step 3: Commit**

```bash
git add frontend/app/stores/narrative.ts frontend/app/composables/useNarrative.ts
git commit -m "feat: add narrative Pinia store and composable"
```

---

### Task 9: Frontend — NarrativeTabs Component

**Files:**
- Create: `frontend/app/components/narrative/NarrativeTabs.vue`

**Step 1: Create the tab navigation**

```vue
<script setup lang="ts">
const props = defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const tabs = [
  { id: 'themes', label: 'Temas', icon: '📊' },
  { id: 'frames', label: 'Narrativas del Gobernador', icon: '🏛' },
  { id: 'opposition', label: 'Radar Oposicion', icon: '📢' },
  { id: 'sentiment', label: 'Sentimiento por Fuente', icon: '📰' },
  { id: 'timeline', label: 'Linea de Tiempo', icon: '📅' },
]
</script>

<template>
  <div class="flex gap-1 overflow-x-auto pb-1">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all"
      :class="
        activeTab === tab.id
          ? 'bg-slate-800 text-white shadow-sm'
          : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
      "
      @click="emit('update:activeTab', tab.id)"
    >
      <span>{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/NarrativeTabs.vue
git commit -m "feat: add NarrativeTabs component"
```

---

### Task 10: Frontend — NarrativeHero Component

**Files:**
- Create: `frontend/app/components/narrative/NarrativeHero.vue`

**Step 1: Create the hero component**

```vue
<script setup lang="ts">
import type { NarrativeReport } from '~/types/narrative'

const props = defineProps<{
  report: NarrativeReport
}>()

function toDate(raw: string | { _seconds: number; _nanoseconds: number }): Date {
  if (typeof raw === 'string') return new Date(raw)
  if (raw && '_seconds' in raw) return new Date(raw._seconds * 1000)
  return new Date()
}

function formatPeriod(start: NarrativeReport['periodStart'], end: NarrativeReport['periodEnd']): string {
  const s = toDate(start)
  const e = toDate(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${s.toLocaleDateString('es-AR', opts)} — ${e.toLocaleDateString('es-AR', opts)} ${e.getFullYear()}`
}

const totalMentions = computed(() =>
  props.report.themes.reduce((sum, t) => sum + t.mentionCount, 0)
)

const governorAppearances = computed(() =>
  props.report.governorFrames.length
)

const sourcesCount = computed(() =>
  props.report.sentimentBySource.length
)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl"
    :style="{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f2438 100%)' }"
  >
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 24px 24px" />
    <div class="relative p-8">
      <div class="mb-1 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg backdrop-blur-sm">
          📊
        </div>
        <p class="text-sm font-medium uppercase tracking-wide text-slate-400">
          Analisis semanal
        </p>
      </div>
      <h1 class="mt-4 font-display text-2xl font-bold text-white">
        Radar de Narrativa Politica
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        {{ formatPeriod(report.periodStart, report.periodEnd) }}
      </p>

      <p class="mt-4 max-w-3xl font-editorial text-base leading-relaxed text-slate-300">
        {{ report.executiveSummary }}
      </p>

      <div class="mt-6 flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-white">{{ totalMentions }}</span>
          <span class="text-xs leading-tight text-slate-400">menciones<br>analizadas</span>
        </div>
        <div class="h-8 w-px bg-white/10" />
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-white">{{ governorAppearances }}</span>
          <span class="text-xs leading-tight text-slate-400">marcos del<br>gobernador</span>
        </div>
        <div class="h-8 w-px bg-white/10" />
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-white">{{ sourcesCount }}</span>
          <span class="text-xs leading-tight text-slate-400">fuentes<br>monitoreadas</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/NarrativeHero.vue
git commit -m "feat: add NarrativeHero component"
```

---

### Task 11: Frontend — ThemeFrequency Component

**Files:**
- Create: `frontend/app/components/narrative/ThemeFrequency.vue`

**Step 1: Create the theme frequency chart**

```vue
<script setup lang="ts">
import type { NarrativeTheme } from '~/types/narrative'

const props = defineProps<{
  themes: NarrativeTheme[]
}>()

const THEME_COLORS = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#be185d', '#dc2626', '#059669', '#6366f1']

const maxCount = computed(() =>
  Math.max(...props.themes.map(t => t.mentionCount), 1)
)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Frecuencia de Temas
      </h2>
      <span class="text-sm text-slate-400">Ultimos 7 dias · todas las fuentes</span>
    </div>

    <div class="space-y-5 rounded-2xl border border-slate-100 bg-white p-6">
      <div
        v-for="(theme, i) in themes"
        :key="theme.name"
        class="group cursor-pointer"
      >
        <div class="mb-1.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-700">{{ theme.name }}</span>
            <span
              v-if="theme.trend === 'up'"
              class="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-600"
            >
              +{{ theme.weekOverWeekDelta }} ▲
            </span>
            <span
              v-else-if="theme.trend === 'down'"
              class="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-500"
            >
              {{ theme.weekOverWeekDelta }} ▼
            </span>
            <span
              v-else
              class="rounded bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-400"
            >
              = estable
            </span>
          </div>
          <span class="text-sm font-bold text-slate-800">{{ theme.mentionCount }} menciones</span>
        </div>

        <div class="h-7 overflow-hidden rounded-lg bg-slate-50">
          <div
            class="h-full rounded-lg transition-all duration-700 ease-out"
            :style="{
              width: `${(theme.mentionCount / maxCount) * 100}%`,
              backgroundColor: THEME_COLORS[i % THEME_COLORS.length],
              opacity: 0.85,
            }"
          />
        </div>

        <p class="mt-1.5 font-editorial text-xs leading-relaxed text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
          {{ theme.context }}
        </p>
      </div>
    </div>

    <p class="ml-1 mt-3 font-editorial text-xs text-slate-400">
      Pase el cursor sobre cada tema para ver contexto. Las flechas indican la variacion respecto a la semana anterior.
    </p>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/ThemeFrequency.vue
git commit -m "feat: add ThemeFrequency component"
```

---

### Task 12: Frontend — GovernorFrames Component

**Files:**
- Create: `frontend/app/components/narrative/GovernorFrames.vue`

**Step 1: Create the governor frames component**

```vue
<script setup lang="ts">
import type { GovernorFrame } from '~/types/narrative'
import { COMMUNICATION_TYPE_LABELS, COMMUNICATION_TYPE_STYLES } from '~/types/narrative'

defineProps<{
  frames: GovernorFrame[]
}>()
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Narrativas del Gobernador
      </h2>
    </div>
    <p class="mb-6 font-editorial text-sm text-slate-500">
      Analisis de los encuadres comunicacionales utilizados por el gobernador Valdes en sus apariciones publicas esta semana.
    </p>

    <div class="space-y-4">
      <div
        v-for="frame in frames"
        :key="frame.frame"
        class="rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:shadow-md"
      >
        <div class="mb-3 flex flex-wrap items-center gap-3">
          <h3 class="text-base font-bold text-slate-800">{{ frame.frame }}</h3>
          <span
            :class="[
              'rounded-full border px-2 py-0.5 text-xs font-semibold',
              COMMUNICATION_TYPE_STYLES[frame.communicationType].bg,
              COMMUNICATION_TYPE_STYLES[frame.communicationType].text,
              COMMUNICATION_TYPE_STYLES[frame.communicationType].border,
            ]"
          >
            {{ COMMUNICATION_TYPE_LABELS[frame.communicationType] }}
          </span>
          <span class="ml-auto text-xs text-slate-400">
            Frecuencia: <span class="font-semibold text-slate-600">{{ frame.frequency }}</span>
          </span>
        </div>

        <div class="mb-3 rounded-xl border-l-2 border-institutional-blue bg-slate-50 p-4">
          <p class="font-editorial text-sm italic text-slate-600">
            {{ frame.exampleQuote }}
          </p>
        </div>

        <p class="font-editorial text-sm leading-relaxed text-slate-500">
          {{ frame.analysis }}
        </p>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/GovernorFrames.vue
git commit -m "feat: add GovernorFrames component"
```

---

### Task 13: Frontend — OppositionRadar Component

**Files:**
- Create: `frontend/app/components/narrative/OppositionRadar.vue`

**Step 1: Create the opposition radar component**

```vue
<script setup lang="ts">
import type { OppositionNarrative } from '~/types/narrative'
import { MOMENTUM_CONFIG } from '~/types/narrative'

defineProps<{
  narratives: OppositionNarrative[]
}>()
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Radar de Oposicion
      </h2>
    </div>
    <p class="mb-6 font-editorial text-sm text-slate-500">
      Narrativas activas de la oposicion y evaluacion de riesgo comunicacional.
    </p>

    <div class="space-y-4">
      <div
        v-for="item in narratives"
        :key="item.actor + item.narrative"
        class="rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:shadow-md"
      >
        <div class="mb-3 flex items-start justify-between gap-4">
          <div>
            <div class="mb-1 flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ item.actor }}
              </span>
              <span
                :class="[
                  'rounded-full border px-2 py-0.5 text-xs font-bold',
                  MOMENTUM_CONFIG[item.momentum].bg,
                  MOMENTUM_CONFIG[item.momentum].text,
                  MOMENTUM_CONFIG[item.momentum].border,
                ]"
              >
                {{ MOMENTUM_CONFIG[item.momentum].label }}
                <template v-if="item.momentum === 'growing'"> ▲</template>
              </span>
            </div>
            <h3 class="text-base font-bold text-slate-800">{{ item.narrative }}</h3>
          </div>
          <div class="flex-shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-center">
            <p class="text-lg font-bold text-slate-700">{{ item.mentionCount }}</p>
            <p class="text-xs text-slate-400">menciones</p>
          </div>
        </div>

        <div class="rounded-xl border-l-2 border-red-300 bg-red-50 p-4">
          <p class="mb-1 text-xs font-bold uppercase tracking-wider text-red-700">
            Evaluacion de riesgo
          </p>
          <p class="font-editorial text-sm leading-relaxed text-red-800">
            {{ item.riskAssessment }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/OppositionRadar.vue
git commit -m "feat: add OppositionRadar component"
```

---

### Task 14: Frontend — SentimentChart Component

**Files:**
- Create: `frontend/app/components/narrative/SentimentChart.vue`

**Step 1: Create the sentiment chart**

```vue
<script setup lang="ts">
import type { SourceSentiment } from '~/types/narrative'
import { SOURCE_COLORS } from '~/types/article'

defineProps<{
  sources: SourceSentiment[]
}>()

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || '#64748b'
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Sentimiento por Fuente
      </h2>
    </div>
    <p class="mb-6 font-editorial text-sm text-slate-500">
      Distribucion del tono hacia el gobierno provincial en la cobertura de cada fuente monitoreada.
    </p>

    <div class="rounded-2xl border border-slate-100 bg-white p-6">
      <!-- Legend -->
      <div class="mb-5 flex items-center gap-4 border-b border-slate-100 pb-4">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-emerald-400" />
          <span class="text-xs font-medium text-slate-500">Positivo</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-slate-300" />
          <span class="text-xs font-medium text-slate-500">Neutro</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-red-400" />
          <span class="text-xs font-medium text-slate-500">Negativo</span>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="item in sources"
          :key="item.source"
          class="flex items-center gap-3"
        >
          <span
            class="w-36 flex-shrink-0 text-right text-xs font-semibold"
            :style="{ color: getSourceColor(item.source) }"
          >
            {{ item.source }}
          </span>

          <div class="flex h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full transition-all"
              :style="{ width: `${item.positivePercent}%`, backgroundColor: '#34d399' }"
              :title="`Positivo: ${item.positivePercent}%`"
            />
            <div
              class="h-full transition-all"
              :style="{ width: `${item.neutralPercent}%`, backgroundColor: '#cbd5e1' }"
              :title="`Neutro: ${item.neutralPercent}%`"
            />
            <div
              class="h-full transition-all"
              :style="{ width: `${item.negativePercent}%`, backgroundColor: '#f87171' }"
              :title="`Negativo: ${item.negativePercent}%`"
            />
          </div>

          <div class="flex w-24 flex-shrink-0 items-center gap-1">
            <span class="text-xs font-medium text-emerald-600">{{ item.positivePercent }}%</span>
            <span class="text-xs text-slate-300">/</span>
            <span class="text-xs text-slate-400">{{ item.neutralPercent }}%</span>
            <span class="text-xs text-slate-300">/</span>
            <span class="text-xs text-red-400">{{ item.negativePercent }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/SentimentChart.vue
git commit -m "feat: add SentimentChart component"
```

---

### Task 15: Frontend — WeeklyTimeline Component

**Files:**
- Create: `frontend/app/components/narrative/WeeklyTimeline.vue`

**Step 1: Create the timeline**

```vue
<script setup lang="ts">
import type { TimelineEvent } from '~/types/narrative'

defineProps<{
  events: TimelineEvent[]
}>()

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  gobierno: { color: '#2563eb', bg: 'bg-blue-50', label: 'Gobierno' },
  oposicion: { color: '#7c3aed', bg: 'bg-purple-50', label: 'Oposicion' },
  nacional: { color: '#dc2626', bg: 'bg-red-50', label: 'Nacional' },
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Linea de Tiempo
      </h2>
    </div>
    <p class="mb-6 font-editorial text-sm text-slate-500">
      Momentos clave de la semana politica.
    </p>

    <div class="rounded-2xl border border-slate-100 bg-white p-6">
      <div
        v-for="(item, i) in events"
        :key="i"
        class="flex gap-4"
      >
        <!-- Timeline rail -->
        <div class="flex flex-col items-center">
          <div
            class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2"
            :style="{
              borderColor: TYPE_CONFIG[item.type]?.color || '#2563eb',
              backgroundColor: i === events.length - 1 ? (TYPE_CONFIG[item.type]?.color || '#2563eb') : 'white',
            }"
          />
          <div
            v-if="i !== events.length - 1"
            class="my-1 w-px flex-1 bg-slate-200"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 pb-5">
          <div class="mb-1 flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
              {{ item.date }}
            </span>
            <span
              :class="['rounded-full px-2 py-0.5 text-xs font-semibold', TYPE_CONFIG[item.type]?.bg || 'bg-blue-50']"
              :style="{ color: TYPE_CONFIG[item.type]?.color || '#2563eb' }"
            >
              {{ TYPE_CONFIG[item.type]?.label || item.type }}
            </span>
          </div>
          <p class="text-sm font-medium leading-relaxed text-slate-700">
            {{ item.event }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/components/narrative/WeeklyTimeline.vue
git commit -m "feat: add WeeklyTimeline component"
```

---

### Task 16: Frontend — Narrative Page

**Files:**
- Create: `frontend/app/pages/narrative.vue`

**Step 1: Create the page**

```vue
<script setup lang="ts">
const { report, loading, error, lastFetchedAt, refresh } = useNarrative()

const activeTab = ref('themes')

function formatLastUpdate(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Cordoba',
  })
}
</script>

<template>
  <div>
    <!-- LOADING STATE -->
    <div v-if="loading && !report" class="space-y-6">
      <div class="animate-pulse rounded-2xl bg-slate-800 p-8">
        <div class="mb-4 h-3 w-40 rounded bg-slate-600" />
        <div class="mb-5 h-7 w-72 rounded bg-slate-600" />
        <div class="max-w-3xl space-y-2.5">
          <div class="h-4 w-full rounded bg-slate-600" />
          <div class="h-4 w-5/6 rounded bg-slate-600" />
          <div class="h-4 w-3/4 rounded bg-slate-600" />
        </div>
        <div class="mt-6 flex gap-6">
          <div class="h-5 w-20 rounded bg-slate-600" />
          <div class="h-5 w-20 rounded bg-slate-600" />
          <div class="h-5 w-20 rounded bg-slate-600" />
        </div>
      </div>
      <div class="flex gap-1">
        <div v-for="n in 5" :key="n" class="h-9 w-32 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div class="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </div>

    <!-- ERROR STATE -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10">
        <Icon name="heroicons:exclamation-triangle" class="mx-auto mb-4 h-10 w-10 text-slate-400" />
        <p class="mb-1 font-body text-slate-600">No se pudo cargar el analisis semanal.</p>
        <p v-if="lastFetchedAt" class="mb-6 font-body text-sm text-slate-400">
          Ultima actualización: {{ formatLastUpdate(lastFetchedAt) }}
        </p>
        <button
          class="rounded-lg bg-institutional-blue px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          @click="refresh"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div
      v-else-if="!loading && !report"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10">
        <Icon name="heroicons:chart-bar" class="mx-auto mb-4 h-10 w-10 text-slate-400" />
        <p class="font-body text-slate-600">
          El analisis semanal se genera los domingos a las 23:00. Volve el lunes.
        </p>
      </div>
    </div>

    <!-- CONTENT -->
    <div v-else-if="report" class="space-y-8">
      <NarrativeHero :report="report" />

      <NarrativeTabs v-model:active-tab="activeTab" />

      <ThemeFrequency v-if="activeTab === 'themes'" :themes="report.themes" />
      <GovernorFrames v-if="activeTab === 'frames'" :frames="report.governorFrames" />
      <OppositionRadar v-if="activeTab === 'opposition'" :narratives="report.oppositionNarratives" />
      <SentimentChart v-if="activeTab === 'sentiment'" :sources="report.sentimentBySource" />
      <WeeklyTimeline v-if="activeTab === 'timeline'" :events="report.timeline" />
    </div>
  </div>
</template>
```

**Step 2: Commit**

```bash
git add frontend/app/pages/narrative.vue
git commit -m "feat: add narrative analysis page"
```

---

### Task 17: Frontend — Sidebar Navigation

**Files:**
- Modify: `frontend/app/components/layout/Sidebar.vue`

**Step 1: Add the navigation item**

In `frontend/app/components/layout/Sidebar.vue`, add the narrative item after 'Entrevistas' in the `navItems` array (after line 13):

```typescript
  { label: 'Analisis Semanal', icon: '📊', to: '/narrative' },
```

The full array becomes:

```typescript
const navItems = [
  { label: 'Resumen del Dia', icon: '📋', to: '/' },
  { label: 'Todas las Noticias', icon: '📰', to: '/feed' },
  { label: 'El Gobernador', icon: '🏛', to: '/governor' },
  { label: 'Justicia y DDHH', icon: '⚖', to: '/justice' },
  { label: 'Gabinete', icon: '👥', to: '/cabinet' },
  { label: 'Oposicion', icon: '📢', to: '/opposition' },
  { label: 'Entrevistas', icon: '🎙', to: '/interviews' },
  { label: 'Analisis Semanal', icon: '📊', to: '/narrative' },
]
```

**Step 2: Commit**

```bash
git add frontend/app/components/layout/Sidebar.vue
git commit -m "feat: add narrative analysis to sidebar navigation"
```

---

### Task 18: Verify Full Build

**Step 1: Build backend**

Run: `cd backend && yarn build`
Expected: PASS — no TypeScript errors

**Step 2: Build frontend**

Run: `cd frontend && yarn build`
Expected: PASS — Nuxt builds successfully

**Step 3: Final commit if any adjustments needed**

---

## Summary of Files

**Created (11 files):**
- `backend/src/processors/narrative-generator.ts`
- `backend/src/routes/narrative.ts`
- `.github/workflows/narrative-analysis.yml`
- `frontend/app/types/narrative.ts`
- `frontend/app/stores/narrative.ts`
- `frontend/app/composables/useNarrative.ts`
- `frontend/app/pages/narrative.vue`
- `frontend/app/components/narrative/NarrativeTabs.vue`
- `frontend/app/components/narrative/NarrativeHero.vue`
- `frontend/app/components/narrative/ThemeFrequency.vue`
- `frontend/app/components/narrative/GovernorFrames.vue`
- `frontend/app/components/narrative/OppositionRadar.vue`
- `frontend/app/components/narrative/SentimentChart.vue`
- `frontend/app/components/narrative/WeeklyTimeline.vue`

**Modified (4 files):**
- `backend/src/routes/cleanup.ts` — 30-day archive + protection comments
- `backend/src/types/index.ts` — NarrativeReport types
- `backend/src/config/gemini.ts` — narrative model export
- `backend/src/index.ts` — register narrative route
- `frontend/app/components/layout/Sidebar.vue` — add nav item
