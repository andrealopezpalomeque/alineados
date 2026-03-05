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
  generatedAt: string | { _seconds: number; _nanoseconds: number }
  executiveSummary: string
  sections: BriefingSection[]
}
