<script setup lang="ts">
const props = defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const tabs = [
  { id: 'themes', label: 'Temas', icon: '📊' },
  { id: 'frames', label: 'Narrativas del Gobernador', icon: '🏛' },
  { id: 'opposition', label: 'Radar Oposicion', icon: '📢' },
  { id: 'sentiment', label: 'Sentimiento por Fuente', icon: '📰' },
  { id: 'timeline', label: 'Linea de Tiempo', icon: '📅' },
]
</script>

<template>
  <div class="flex gap-1 overflow-x-auto pb-1">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all"
      :class="
        activeTab === tab.id
          ? 'bg-slate-800 text-white shadow-sm'
          : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
      "
      @click="emit('update:activeTab', tab.id)"
    >
      <span>{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
