<script setup lang="ts">
import type { Article } from '~/types/article'

defineProps<{
  articles: readonly Article[]
  loading: boolean
  error: string | null
  hasMore: boolean
  emptyMessage?: string
}>()

const emit = defineEmits<{
  loadMore: []
}>()

function formatTime(date: Date) {
  const d = new Date(date)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))
  if (diffHours < 1) return 'Hace minutos'
  if (diffHours < 24) return `Hace ${diffHours}h`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', timeZone: 'America/Argentina/Cordoba' })
}
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="loading && articles.length === 0" class="space-y-3">
    <div v-for="i in 6" :key="i" class="flex items-center gap-4 rounded-lg bg-white p-4 animate-pulse">
      <div class="h-2.5 w-2.5 rounded-full bg-slate-200" />
      <div class="w-16 h-4 rounded bg-slate-200" />
      <div class="flex-1 h-4 rounded bg-slate-200" />
      <div class="w-24 h-5 rounded-full bg-slate-200" />
    </div>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
    <p class="text-red-700 text-sm">{{ error }}</p>
  </div>

  <!-- Empty -->
  <div v-else-if="!loading && articles.length === 0" class="rounded-lg bg-white border border-slate-200 p-12 text-center">
    <p class="text-slate-400 text-lg">{{ emptyMessage || 'No hay noticias' }}</p>
  </div>

  <!-- List -->
  <template v-else>
    <div class="space-y-1">
      <NuxtLink
        v-for="article in articles"
        :key="article.id"
        :to="`/article/${article.id}`"
        class="flex items-center gap-4 rounded-lg bg-white px-4 py-3 transition-colors hover:bg-slate-50 group border border-transparent hover:border-slate-200"
      >
        <UiUrgencyDot :urgency="article.urgency || 'routine'" />
        <span class="w-20 shrink-0 text-xs text-slate-400 font-mono tabular-nums">
          {{ formatTime(article.publishedAt) }}
        </span>
        <span class="flex-1 min-w-0 truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
          {{ article.title }}
        </span>
        <div class="flex items-center gap-2 shrink-0">
          <UiUrgencyBadge :urgency="article.urgency || 'routine'" />
          <UiSourceTag :source="article.source" />
        </div>
      </NuxtLink>
    </div>

    <div v-if="hasMore" class="mt-6 text-center">
      <button
        class="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
        :disabled="loading"
        @click="emit('loadMore')"
      >
        {{ loading ? 'Cargando...' : 'Cargar más' }}
      </button>
    </div>
  </template>
</template>
