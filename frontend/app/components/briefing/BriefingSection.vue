<script setup lang="ts">
import type { BriefingItem } from '~/types/briefing'

defineProps<{
  title: string
  icon: string
  items: BriefingItem[]
}>()

const urgencyDotClass: Record<string, string> = {
  breaking: 'bg-red-500',
  important: 'bg-amber-500',
  routine: 'bg-emerald-400',
}

const router = useRouter()

function goToArticle(articleId: string) {
  if (articleId) {
    router.push(`/article/${articleId}`)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2.5 py-3">
      <span class="text-lg md:text-xl leading-none">{{ icon }}</span>
      <h2 class="font-display text-base md:text-lg font-bold text-slate-800">{{ title }}</h2>
      <span class="text-sm text-slate-400 font-body">{{ items.length }}</span>
    </div>

    <div v-if="items.length === 0" class="py-4">
      <p class="text-sm text-slate-400 italic font-body">Sin novedades en esta sección.</p>
    </div>

    <div v-else class="space-y-3 pb-6">
      <div
        v-for="item in items"
        :key="item.articleId"
        class="rounded-xl border border-slate-100 bg-white p-4 md:p-5 transition-all hover:shadow-md hover:border-slate-200 cursor-pointer"
        @click="goToArticle(item.articleId)"
      >
        <div class="flex items-start gap-3">
          <span
            class="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            :class="urgencyDotClass[item.urgency] || 'bg-emerald-400'"
          />
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <BriefingUrgencyBadge :urgency="item.urgency" />
              <BriefingSourceTag :source="item.source" />
            </div>
            <h3 class="font-body text-sm md:text-[15px] font-semibold text-slate-900 leading-snug">
              {{ item.headline }}
            </h3>
            <p class="mt-1.5 font-editorial text-sm text-slate-500 leading-relaxed">
              {{ item.summary }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
