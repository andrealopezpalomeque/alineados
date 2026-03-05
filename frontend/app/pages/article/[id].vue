<script setup lang="ts">
import { CATEGORY_LABELS } from '~/types/article'

const route = useRoute()
const articleId = route.params.id as string

const { article, loading, error } = useArticle(articleId)

const sentimentConfig: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positivo', color: '#16a34a', bg: '#f0fdf4' },
  neutral: { label: 'Neutral', color: '#64748b', bg: '#f8fafc' },
  negative: { label: 'Negativo', color: '#dc2626', bg: '#fef2f2' },
}

const relevanceColors: Record<string, { color: string; bg: string }> = {
  high: { color: '#dc2626', bg: '#fef2f2' },
  medium: { color: '#d97706', bg: '#fffbeb' },
  low: { color: '#64748b', bg: '#f8fafc' },
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="h-4 w-24 rounded bg-slate-200" />
      <div class="h-8 w-3/4 rounded bg-slate-200" />
      <div class="h-4 w-1/2 rounded bg-slate-200" />
      <div class="space-y-2 mt-6">
        <div v-for="i in 5" :key="i" class="h-4 rounded bg-slate-200" />
      </div>
    </div>

    <!-- Error / Not found -->
    <div
      v-else-if="error"
      class="rounded-lg bg-white border border-slate-200 p-12 text-center"
    >
      <p class="text-slate-500 text-lg mb-2">Artículo no encontrado</p>
      <p class="text-slate-400 text-sm mb-4">{{ error }}</p>
      <NuxtLink
        to="/feed"
        class="text-sm font-medium text-institutional-blue hover:underline"
      >
        Volver al feed
      </NuxtLink>
    </div>

    <!-- Article content -->
    <div v-else-if="article">
      <!-- Back link -->
      <NuxtLink
        to="/feed"
        class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <span>←</span>
        <span>Volver al feed</span>
      </NuxtLink>

      <!-- Top meta: urgency + source + date -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <UiUrgencyBadge :urgency="article.urgency || 'routine'" />
        <UiSourceTag :source="article.source" />
        <span class="text-sm text-slate-400">
          {{ formatDate(article.publishedAt) }}
        </span>
      </div>

      <!-- Headline -->
      <h1 class="font-playfair text-2xl font-bold text-slate-900 mb-4 leading-tight">
        {{ article.title }}
      </h1>

      <!-- AI Summary -->
      <div
        v-if="article.summary"
        class="mb-8 rounded-lg bg-white border border-slate-200 p-6"
      >
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Resumen IA
        </p>
        <p class="font-serif-body text-base leading-relaxed text-slate-600">
          {{ article.summary }}
        </p>
      </div>

      <!-- Metadata section -->
      <div class="space-y-5 mb-8">
        <!-- Category & subcategory -->
        <div v-if="article.category" class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Categoría
          </span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {{ CATEGORY_LABELS[article.category] || article.category }}
          </span>
          <span
            v-if="article.subcategory"
            class="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500"
          >
            {{ article.subcategory }}
          </span>
        </div>

        <!-- Political actors -->
        <div v-if="article.politicalActors?.length" class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Actores
          </span>
          <span
            v-for="actor in article.politicalActors"
            :key="actor"
            class="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
          >
            {{ actor }}
          </span>
        </div>

        <!-- Topics -->
        <div v-if="article.topics?.length" class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Temas
          </span>
          <span
            v-for="topic in article.topics"
            :key="topic"
            class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
          >
            {{ topic }}
          </span>
        </div>

        <!-- Sentiment -->
        <div v-if="article.sentiment" class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Sentimiento
          </span>
          <span
            class="rounded-full px-3 py-1 text-xs font-medium"
            :style="{
              color: sentimentConfig[article.sentiment]?.color,
              backgroundColor: sentimentConfig[article.sentiment]?.bg,
            }"
          >
            {{ sentimentConfig[article.sentiment]?.label }}
          </span>
        </div>

        <!-- Ministry relevance -->
        <div v-if="article.ministryRelevance?.length">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Relevancia ministerial
          </span>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="mr in article.ministryRelevance"
              :key="mr.ministry"
              class="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2"
            >
              <span class="text-sm text-slate-700">{{ mr.ministry }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                :style="{
                  color: relevanceColors[mr.score]?.color,
                  backgroundColor: relevanceColors[mr.score]?.bg,
                }"
              >
                {{ mr.score }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Key quotes -->
      <div v-if="article.keyQuotes?.length" class="mb-8">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Citas clave
        </p>
        <div class="space-y-3">
          <blockquote
            v-for="(kq, i) in article.keyQuotes"
            :key="i"
            class="border-l-4 border-institutional-blue/30 bg-blue-50/50 rounded-r-lg pl-4 pr-4 py-3"
          >
            <p class="font-serif-body text-sm text-slate-600 italic leading-relaxed">
              "{{ kq.quote }}"
            </p>
            <p class="mt-1.5 text-xs font-semibold text-slate-500">
              — {{ kq.speaker }}
            </p>
          </blockquote>
        </div>
      </div>

      <!-- Original article link -->
      <a
        :href="article.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
      >
        Ver artículo original
        <span class="text-xs">↗</span>
      </a>
    </div>
  </div>
</template>
