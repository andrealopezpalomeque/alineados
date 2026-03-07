<script setup lang="ts">
import type { GovernorFrame } from '~/types/narrative'
import { COMMUNICATION_TYPE_LABELS, COMMUNICATION_TYPE_STYLES } from '~/types/narrative'

defineProps<{
  frames: GovernorFrame[]
}>()
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-base md:text-lg font-bold text-slate-800">
        Narrativas del Gobernador
      </h2>
    </div>
    <p class="mb-4 md:mb-6 font-editorial text-xs md:text-sm text-slate-500">
      Análisis de los encuadres comunicacionales utilizados por el gobernador Valdés en sus apariciones públicas esta semana.
    </p>

    <div class="space-y-4">
      <div
        v-for="frame in frames"
        :key="frame.frame"
        class="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 transition-all hover:shadow-md"
      >
        <div class="mb-3 flex flex-wrap items-center gap-2 md:gap-3">
          <h3 class="text-sm md:text-base font-bold text-slate-800">{{ frame.frame }}</h3>
          <span
            :class="[
              'rounded-full border px-2 py-0.5 text-xs font-semibold',
              COMMUNICATION_TYPE_STYLES[frame.communicationType].bg,
              COMMUNICATION_TYPE_STYLES[frame.communicationType].text,
              COMMUNICATION_TYPE_STYLES[frame.communicationType].border,
            ]"
          >
            {{ COMMUNICATION_TYPE_LABELS[frame.communicationType] }}
          </span>
          <span class="text-xs text-slate-400 md:ml-auto">
            Frecuencia: <span class="font-semibold text-slate-600">{{ frame.frequency }}</span>
          </span>
        </div>

        <div class="mb-3 rounded-xl border-l-2 border-[#2563eb] bg-slate-50 p-3 md:p-4">
          <p class="font-editorial text-sm italic text-slate-600">
            {{ frame.exampleQuote }}
          </p>
        </div>

        <p class="font-editorial text-sm leading-relaxed text-slate-500">
          {{ frame.analysis }}
        </p>
      </div>
    </div>
  </div>
</template>
