<script setup lang="ts">
const props = defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const tabs = [
  { id: 'themes', label: 'Temas', shortLabel: 'Temas', icon: '📊' },
  { id: 'frames', label: 'Narrativas del Gobernador', shortLabel: 'Gobernador', icon: '🏛' },
  { id: 'opposition', label: 'Radar Oposición', shortLabel: 'Oposición', icon: '📢' },
  { id: 'sentiment', label: 'Sentimiento por Fuente', shortLabel: 'Sentimiento', icon: '📰' },
  { id: 'timeline', label: 'Línea de Tiempo', shortLabel: 'Línea', icon: '📅' },
]
</script>

<template>
  <div class="narrative-tabs flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 md:mx-0 md:px-0">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="flex shrink-0 items-center gap-1.5 md:gap-2 whitespace-nowrap rounded-xl px-3 md:px-4 py-2 text-sm font-medium transition-all"
      :class="
        activeTab === tab.id
          ? 'bg-slate-800 text-white shadow-sm'
          : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
      "
      @click="emit('update:activeTab', tab.id)"
    >
      <span>{{ tab.icon }}</span>
      <span class="hidden md:inline">{{ tab.label }}</span>
      <span class="md:hidden">{{ tab.shortLabel || tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.narrative-tabs {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.narrative-tabs::-webkit-scrollbar {
  display: none;
}
</style>
