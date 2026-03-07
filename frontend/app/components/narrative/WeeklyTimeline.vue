<script setup lang="ts">
import type { TimelineEvent } from '~/types/narrative'

defineProps<{
  events: TimelineEvent[]
}>()

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  gobierno: { color: '#2563eb', bg: 'bg-blue-50', label: 'Gobierno' },
  oposicion: { color: '#7c3aed', bg: 'bg-purple-50', label: 'Oposición' },
  nacional: { color: '#dc2626', bg: 'bg-red-50', label: 'Nacional' },
}
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-3">
      <h2 class="font-display text-base md:text-lg font-bold text-slate-800">
        Línea de Tiempo
      </h2>
    </div>
    <p class="mb-4 md:mb-6 font-editorial text-xs md:text-sm text-slate-500">
      Momentos clave de la semana política.
    </p>

    <div class="rounded-2xl border border-slate-100 bg-white p-4 md:p-6">
      <div
        v-for="(item, i) in events"
        :key="i"
        class="flex gap-3 md:gap-4"
      >
        <div class="flex flex-col items-center">
          <div
            class="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full border-2"
            :style="{
              borderColor: TYPE_CONFIG[item.type]?.color || '#2563eb',
              backgroundColor: i === events.length - 1 ? (TYPE_CONFIG[item.type]?.color || '#2563eb') : 'white',
            }"
          />
          <div
            v-if="i !== events.length - 1"
            class="my-1 w-px flex-1 bg-slate-200"
          />
        </div>

        <div class="flex-1 pb-5">
          <div class="mb-1 flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
              {{ item.date }}
            </span>
            <span
              :class="['rounded-full px-2 py-0.5 text-xs font-semibold', TYPE_CONFIG[item.type]?.bg || 'bg-blue-50']"
              :style="{ color: TYPE_CONFIG[item.type]?.color || '#2563eb' }"
            >
              {{ TYPE_CONFIG[item.type]?.label || item.type }}
            </span>
          </div>
          <p class="text-sm font-medium leading-relaxed text-slate-700">
            {{ item.event }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
