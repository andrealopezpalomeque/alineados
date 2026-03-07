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
  'credit-claiming': 'Reclamo de crédito',
  'agenda-setting': 'Fijación de agenda',
  'coalition-building': 'Construcción de coalición',
  'crisis-response': 'Respuesta a crisis',
  'blame-deflection': 'Deflexión de culpa',
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
