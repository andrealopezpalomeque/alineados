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
          Ultima actualizacion: {{ formatLastUpdate(lastFetchedAt) }}
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
