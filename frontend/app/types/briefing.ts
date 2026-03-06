export type BriefingType = 'recap' | 'midday'

export interface BriefingItem {
  articleId: string
  headline: string
  summary: string
  urgency: 'breaking' | 'important' | 'routine'
  source: string
  time: string
}

export interface BriefingSection {
  title: string
  icon: string
  items: BriefingItem[]
}

export interface Briefing {
  id: string
  type: BriefingType
  generatedAt: string | { _seconds: number; _nanoseconds: number }
  updatedAt?: string | { _seconds: number; _nanoseconds: number }
  executiveSummary: string
  sections: BriefingSection[]
}

export interface DateBriefings {
  recap?: Briefing
  midday?: Briefing
}

export interface LatestBriefingsResponse {
  latestUpdate: Briefing | null
  yesterdayRecap: Briefing | null
  todayDate: string
  yesterdayDate: string
}
