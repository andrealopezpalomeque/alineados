export interface Article {
  id: string

  // Raw fields (from scraper)
  source: string
  sourceUrl: string
  title: string
  rawContent: string
  publishedAt: Date
  scrapedAt: Date

  // Processing status
  processed?: boolean
  processedAt?: Date

  // AI-generated fields
  summary?: string
  category?: ArticleCategory
  subcategory?: string
  politicalActors?: string[]
  ministryRelevance?: MinistryRelevance[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  urgency?: 'breaking' | 'important' | 'routine'
  keyQuotes?: KeyQuote[]
  topics?: string[]
}

export interface MinistryRelevance {
  ministry: string
  score: 'high' | 'medium' | 'low'
}

export interface KeyQuote {
  speaker: string
  quote: string
}

export type ArticleCategory =
  | 'governor'
  | 'justice'
  | 'opposition'
  | 'ministry'
  | 'national'
  | 'general'

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  governor: 'Gobernador',
  justice: 'Justicia',
  opposition: 'Oposición',
  ministry: 'Gabinete',
  national: 'Nacional',
  general: 'General',
}

export const URGENCY_CONFIG = {
  breaking: { label: 'URGENTE', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  important: { label: 'IMPORTANTE', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  routine: { label: '', color: '#16a34a', bg: '', border: '' },
} as const

export const SOURCE_COLORS: Record<string, string> = {
  'El Litoral': '#1a6b3c',
  'Época': '#8b5e3c',
  'Diario El Libertador': '#2d5a9e',
  'Radio Sudamericana': '#c23b22',
  'Radio Dos': '#6b21a8',
  'Gobierno': '#1e3a5f',
} as const
