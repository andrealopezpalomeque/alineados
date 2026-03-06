<script setup lang="ts">
import type { NarrativeTheme } from '~/types/narrative'

const props = defineProps<{
  themes: NarrativeTheme[]
}>()

const THEME_COLORS = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#be185d', '#dc2626', '#059669', '#6366f1']

const maxCount = computed(() =>
  Math.max(...props.themes.map(t => t.mentionCount), 1)
)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Frecuencia de Temas
      </h2>
      <span class="text-sm text-slate-400">Ultimos 7 dias · todas las fuentes</span>
    </div>

    <div class="space-y-5 rounded-2xl border border-slate-100 bg-white p-6">
      <div
        v-for="(theme, i) in themes"
        :key="theme.name"
        class="group cursor-pointer"
      >
        <div class="mb-1.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-700">{{ theme.name }}</span>
            <span
              v-if="theme.trend === 'up'"
              class="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-600"
            >
              +{{ theme.weekOverWeekDelta }} ▲
            </span>
            <span
              v-else-if="theme.trend === 'down'"
              class="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-500"
            >
              {{ theme.weekOverWeekDelta }} ▼
            </span>
            <span
              v-else
              class="rounded bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-400"
            >
              = estable
            </span>
          </div>
          <span class="text-sm font-bold text-slate-800">{{ theme.mentionCount }} menciones</span>
        </div>

        <div class="h-7 overflow-hidden rounded-lg bg-slate-50">
          <div
            class="h-full rounded-lg transition-all duration-700 ease-out"
            :style="{
              width: `${(theme.mentionCount / maxCount) * 100}%`,
              backgroundColor: THEME_COLORS[i % THEME_COLORS.length],
              opacity: 0.85,
            }"
          />
        </div>

        <p class="mt-1.5 font-editorial text-xs leading-relaxed text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
          {{ theme.context }}
        </p>
      </div>
    </div>

    <p class="ml-1 mt-3 font-editorial text-xs text-slate-400">
      Pase el cursor sobre cada tema para ver contexto. Las flechas indican la variacion respecto a la semana anterior.
    </p>
  </div>
</template>
