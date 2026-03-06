<script setup lang="ts">
const {
  briefing, hasBoth, activeType, setActiveType,
  loading, error, urgencyCounts, lastFetchedAt, refresh,
} = useTodayBriefing()

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toDate(raw: string | { _seconds: number; _nanoseconds: number }): Date {
  if (typeof raw === 'string') return new Date(raw)
  if (raw && '_seconds' in raw) return new Date(raw._seconds * 1000)
  return new Date()
}

function formatSpanishDate(raw: string | { _seconds: number; _nanoseconds: number }): string {
  const date = toDate(raw)
  return `${DAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

function formatARTTime(raw: string | { _seconds: number; _nanoseconds: number }): string {
  const date = toDate(raw)
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Cordoba',
  })
}

const heroSubtitle = computed(() => {
  if (!briefing.value) return ''
  const dateStr = formatSpanishDate(briefing.value.generatedAt)
  if (briefing.value.type === 'midday') {
    const timeSource = briefing.value.updatedAt || briefing.value.generatedAt
    const time = formatARTTime(timeSource)
    return `${dateStr} · Actualizado ${time}`
  }
  return dateStr
})

const heroTitle = computed(() => {
  if (!briefing.value) return 'Ultima Actualizacion'
  return briefing.value.type === 'midday' ? 'Ultima Actualizacion' : 'Resumen de Ayer'
})

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
    <div v-if="loading && !briefing" class="space-y-6">
      <div class="rounded-2xl bg-slate-800 p-8 animate-pulse">
        <div class="h-3 w-40 rounded bg-slate-600 mb-4" />
        <div class="h-7 w-72 rounded bg-slate-600 mb-5" />
        <div class="space-y-2.5 max-w-3xl">
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
      <div v-for="n in 3" :key="n" class="space-y-3">
        <div class="h-6 w-48 rounded bg-slate-200 animate-pulse" />
        <div
          v-for="m in 2"
          :key="m"
          class="rounded-xl border border-slate-100 bg-white p-5 animate-pulse"
        >
          <div class="flex items-start gap-3">
            <div class="mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-200" />
            <div class="flex-1 space-y-2">
              <div class="flex gap-2">
                <div class="h-5 w-16 rounded-full bg-slate-200" />
                <div class="h-5 w-24 rounded-full bg-slate-200" />
              </div>
              <div class="h-4 w-3/4 rounded bg-slate-200" />
              <div class="h-3 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="rounded-2xl border border-slate-200 bg-white px-8 py-10 max-w-md">
        <Icon name="heroicons:exclamation-triangle" class="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <p class="font-body text-slate-600 mb-1">No se pudo cargar el resumen.</p>
        <p v-if="lastFetchedAt" class="font-body text-sm text-slate-400 mb-6">
          Ultima actualizacion: {{ formatLastUpdate(lastFetchedAt) }}
        </p>
        <button
          class="rounded-lg bg-institutional-blue px-5 py-2.5 text-sm font-semibold text-white font-body hover:bg-blue-700 transition-colors"
          @click="refresh"
        >
          Reintentar
        </button>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div
      v-else-if="!loading && !briefing"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="rounded-2xl border border-slate-200 bg-white px-8 py-10 max-w-md">
        <Icon name="heroicons:clock" class="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <p class="font-body text-slate-600">
          El resumen del dia se genera a las 6:00 AM. Volve mas tarde.
        </p>
      </div>
    </div>

    <!-- BRIEFING CONTENT -->
    <div v-else-if="briefing" class="space-y-6">
      <!-- Hero Card -->
      <div
        class="relative overflow-hidden rounded-2xl p-8"
        :style="{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2438 100%)',
        }"
      >
        <div class="absolute inset-0 opacity-[0.05] hero-pattern" />

        <div class="relative">
          <p class="text-sm font-body uppercase tracking-widest text-slate-400 mb-2">
            {{ heroSubtitle }}
          </p>
          <h1 class="font-display text-2xl font-bold text-white mb-4">
            {{ heroTitle }}
          </h1>
          <p class="font-editorial text-base text-slate-300 leading-relaxed max-w-3xl">
            {{ briefing.executiveSummary }}
          </p>

          <!-- Urgency counters -->
          <div
            v-if="urgencyCounts.breaking || urgencyCounts.important || urgencyCounts.routine"
            class="mt-6 flex flex-wrap gap-5"
          >
            <div v-if="urgencyCounts.breaking" class="flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              <span class="text-sm font-body text-slate-300">
                {{ urgencyCounts.breaking }} urgente{{ urgencyCounts.breaking > 1 ? 's' : '' }}
              </span>
            </div>
            <div v-if="urgencyCounts.important" class="flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span class="text-sm font-body text-slate-300">
                {{ urgencyCounts.important }} importante{{ urgencyCounts.important > 1 ? 's' : '' }}
              </span>
            </div>
            <div v-if="urgencyCounts.routine" class="flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span class="text-sm font-body text-slate-300">
                {{ urgencyCounts.routine }} rutina
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Latest update / Yesterday recap toggle -->
      <div v-if="hasBoth" class="flex gap-2">
        <button
          class="rounded-full px-4 py-1.5 text-sm font-semibold font-body transition-colors"
          :class="activeType === 'midday'
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="setActiveType('midday')"
        >
          Ultima actualizacion
        </button>
        <button
          class="rounded-full px-4 py-1.5 text-sm font-semibold font-body transition-colors"
          :class="activeType === 'recap'
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="setActiveType('recap')"
        >
          Resumen de ayer
        </button>
      </div>

      <!-- Sections -->
      <BriefingSection
        v-for="section in briefing.sections"
        :key="section.title + activeType"
        :title="section.title"
        :icon="section.icon"
        :items="section.items"
      />
    </div>
  </div>
</template>

<style scoped>
.hero-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M0 20h40v1H0zM20 0v40h1V0z'/%3E%3C/g%3E%3C/svg%3E");
}
</style>
