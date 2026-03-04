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

  // AI-generated fields (from Claude processing — optional until processed)
  summary?: string;
  category?: ArticleCategory;
  politicalActors?: string[];
  ministryRelevance?: number; // 0-100
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgency?: 'breaking' | 'important' | 'routine';
  keyQuotes?: string[];
  topics?: string[];
}

export type ArticleCategory =
  | 'justice'
  | 'security'
  | 'legislation'
  | 'governance'
  | 'opposition'
  | 'national'
  | 'economy'
  | 'infrastructure'
  | 'health'
  | 'education'
  | 'other';

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
