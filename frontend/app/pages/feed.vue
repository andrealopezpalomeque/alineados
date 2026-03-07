<script setup lang="ts">
import type { ArticleCategory } from '~/types/article'

const { articles, loading, error, hasMore, filters, setFilter, loadMore } = useArticles()

const categoryFilters: Array<{ key: ArticleCategory | null; label: string }> = [
  { key: null, label: 'Todas' },
  { key: 'governor', label: 'Gobernador' },
  { key: 'justice', label: 'Justicia' },
  { key: 'ministry', label: 'Gabinete' },
  { key: 'opposition', label: 'Oposición' },
  { key: 'national', label: 'Nacional' },
]

function selectCategory(cat: ArticleCategory | null) {
  setFilter('category', cat || undefined)
}
</script>

<template>
  <div>
    <h1 class="font-display text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
      Todas las Noticias
    </h1>

    <!-- Category filter pills -->
    <div class="feed-filters flex gap-2 mb-5 md:mb-6 overflow-x-auto pb-2 md:overflow-visible md:pb-0 md:flex-wrap -mx-1 px-1 md:mx-0 md:px-0">
      <button
        v-for="cat in categoryFilters"
        :key="cat.label"
        class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
        :class="
          filters.category === cat.key || (!filters.category && !cat.key)
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
        @click="selectCategory(cat.key)"
      >
        {{ cat.label }}
      </button>
    </div>

    <ArticlesArticleList
      :articles="articles"
      :loading="loading"
      :error="error"
      :has-more="hasMore"
      empty-message="No se encontraron artículos con los filtros seleccionados."
      @load-more="loadMore"
    />
  </div>
</template>

<style scoped>
.feed-filters {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.feed-filters::-webkit-scrollbar {
  display: none;
}
</style>
