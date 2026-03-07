<script setup lang="ts">
import type { SourceSentiment } from '~/types/narrative'
import { SOURCE_COLORS } from '~/types/article'

defineProps<{
  sources: SourceSentiment[]
}>()

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || '#64748b'
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-base md:text-lg font-bold text-slate-800">
        Sentimiento por Fuente
      </h2>
    </div>
    <p class="mb-4 md:mb-6 font-editorial text-xs md:text-sm text-slate-500">
      Distribución del tono hacia el gobierno provincial en la cobertura de cada fuente monitoreada.
    </p>

    <div class="rounded-2xl border border-slate-100 bg-white p-4 md:p-6">
      <div class="mb-4 md:mb-5 flex items-center gap-3 md:gap-4 border-b border-slate-100 pb-3 md:pb-4">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-emerald-400" />
          <span class="text-xs font-medium text-slate-500">Positivo</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-slate-300" />
          <span class="text-xs font-medium text-slate-500">Neutro</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm bg-red-400" />
          <span class="text-xs font-medium text-slate-500">Negativo</span>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="item in sources"
          :key="item.source"
        >
          <div class="mb-1.5 flex items-center justify-between">
            <span
              class="text-xs font-semibold"
              :style="{ color: getSourceColor(item.source) }"
            >
              {{ item.source }}
            </span>
            <div class="flex items-center gap-1">
              <span class="text-xs font-medium text-emerald-600">{{ item.positivePercent }}%</span>
              <span class="text-xs text-slate-300">/</span>
              <span class="text-xs text-slate-400">{{ item.neutralPercent }}%</span>
              <span class="text-xs text-slate-300">/</span>
              <span class="text-xs text-red-400">{{ item.negativePercent }}%</span>
            </div>
          </div>
          <div class="flex h-5 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full transition-all"
              :style="{ width: `${item.positivePercent}%`, backgroundColor: '#34d399' }"
              :title="`Positivo: ${item.positivePercent}%`"
            />
            <div
              class="h-full transition-all"
              :style="{ width: `${item.neutralPercent}%`, backgroundColor: '#cbd5e1' }"
              :title="`Neutro: ${item.neutralPercent}%`"
            />
            <div
              class="h-full transition-all"
              :style="{ width: `${item.negativePercent}%`, backgroundColor: '#f87171' }"
              :title="`Negativo: ${item.negativePercent}%`"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
