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

const governorFrameCount = computed(() => props.report.governorFrames.length)
const sourcesCount = computed(() => props.report.sentimentBySource.length)
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
          Análisis semanal
        </p>
      </div>
      <h1 class="mt-4 font-display text-2xl font-bold text-white">
        Radar de Narrativa Política
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
          <span class="text-2xl font-bold text-white">{{ governorFrameCount }}</span>
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
