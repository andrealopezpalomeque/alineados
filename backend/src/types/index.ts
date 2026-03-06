import type { Timestamp } from 'firebase-admin/firestore';

export interface Article {
  id?: string;

  // Raw fields (from scraper)
  source: string;
  sourceUrl: string;
  title: string;
  rawContent: string;
  publishedAt: Timestamp | Date;
  scrapedAt: Timestamp | Date;

  // Processing status
  processed?: boolean;
  processedAt?: Timestamp | Date;

  // Filtering metadata
  filtered?: boolean;
  filterReason?: string;
  filterStage?: 'keyword' | 'ai-gate' | 'relevance-none';
  matchedKeywords?: string[];

  // AI-generated fields (from Gemini processing — optional until processed)
  summary?: string;
  category?: ArticleCategory;
  subcategory?: string;
  relevance?: ArticleRelevance;
  politicalActors?: string[];
  ministryRelevance?: MinistryRelevance[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgency?: 'breaking' | 'important' | 'routine';
  keyQuotes?: KeyQuote[];
  topics?: string[];
}

export interface MinistryRelevance {
  ministry: string;
  score: 'high' | 'medium' | 'low';
}

export interface KeyQuote {
  speaker: string;
  quote: string;
}

export type ArticleCategory =
  | 'governor'
  | 'justice'
  | 'opposition'
  | 'ministry'
  | 'national'
  | 'general';

export type ArticleRelevance = 'high' | 'medium' | 'low' | 'none';

export interface ProcessedFields {
  summary: string;
  category: ArticleCategory;
  subcategory?: string;
  relevance: ArticleRelevance;
  politicalActors: string[];
  ministryRelevance: MinistryRelevance[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'breaking' | 'important' | 'routine';
  keyQuotes: KeyQuote[];
  topics: string[];
}

export interface ScrapeResult {
  source: string;
  articlesFound: number;
  articlesStored: number;
  errors: string[];
}

export interface ScrapeStatus {
  lastScrapeAt: Timestamp | Date | null;
  sources: Record<string, {
    lastScrapeAt: Timestamp | Date | null;
    articleCount: number;
  }>;
}

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
