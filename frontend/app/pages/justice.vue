<script setup lang="ts">
const { articles, loading, error, hasMore, loadMore } = useArticles({ category: 'justice' })
</script>

<template>
  <div>
    <h1 class="font-playfair text-2xl font-bold text-slate-900 mb-6">
      ⚖ Justicia y DDHH
    </h1>
    <ArticlesArticleList
      :articles="articles"
      :loading="loading"
      :error="error"
      :has-more="hasMore"
      empty-message="No hay noticias de Justicia y DDHH"
      @load-more="loadMore"
    />
  </div>
</template>
