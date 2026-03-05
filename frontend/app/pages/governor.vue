<script setup lang="ts">
const { articles, loading, error, hasMore, loadMore } = useArticles({ category: 'governor' })
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-bold text-slate-900 mb-6">
      🏛 El Gobernador
    </h1>
    <ArticlesArticleList
      :articles="articles"
      :loading="loading"
      :error="error"
      :has-more="hasMore"
      empty-message="No hay noticias del Gobernador"
      @load-more="loadMore"
    />
  </div>
</template>
