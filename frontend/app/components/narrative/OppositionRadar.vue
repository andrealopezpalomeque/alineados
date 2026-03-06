<script setup lang="ts">
import type { OppositionNarrative } from '~/types/narrative'
import { MOMENTUM_CONFIG } from '~/types/narrative'

defineProps<{
  narratives: OppositionNarrative[]
}>()
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-lg font-bold text-slate-800">
        Radar de Oposicion
      </h2>
    </div>
    <p class="mb-6 font-editorial text-sm text-slate-500">
      Narrativas activas de la oposicion y evaluacion de riesgo comunicacional.
    </p>

    <div class="space-y-4">
      <div
        v-for="item in narratives"
        :key="item.actor + item.narrative"
        class="rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:shadow-md"
      >
        <div class="mb-3 flex items-start justify-between gap-4">
          <div>
            <div class="mb-1 flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ item.actor }}
              </span>
              <span
                :class="[
                  'rounded-full border px-2 py-0.5 text-xs font-bold',
                  MOMENTUM_CONFIG[item.momentum].bg,
                  MOMENTUM_CONFIG[item.momentum].text,
                  MOMENTUM_CONFIG[item.momentum].border,
                ]"
              >
                {{ MOMENTUM_CONFIG[item.momentum].label }}
                <template v-if="item.momentum === 'growing'"> ▲</template>
              </span>
            </div>
            <h3 class="text-base font-bold text-slate-800">{{ item.narrative }}</h3>
          </div>
          <div class="flex-shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-center">
            <p class="text-lg font-bold text-slate-700">{{ item.mentionCount }}</p>
            <p class="text-xs text-slate-400">menciones</p>
          </div>
        </div>

        <div class="rounded-xl border-l-2 border-red-300 bg-red-50 p-4">
          <p class="mb-1 text-xs font-bold uppercase tracking-wider text-red-700">
            Evaluacion de riesgo
          </p>
          <p class="font-editorial text-sm leading-relaxed text-red-800">
            {{ item.riskAssessment }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
