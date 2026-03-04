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

  // AI-generated fields (from Gemini processing — optional until processed)
  summary?: string;
  category?: ArticleCategory;
  subcategory?: string;
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

export interface ProcessedFields {
  summary: string;
  category: ArticleCategory;
  subcategory?: string;
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
