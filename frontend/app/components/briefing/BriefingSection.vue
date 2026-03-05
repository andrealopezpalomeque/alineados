<script setup lang="ts">
import type { BriefingItem } from '~/types/briefing'

const props = defineProps<{
  title: string
  icon: string
  items: BriefingItem[]
  initialExpanded?: boolean
}>()

const hasBreaking = computed(() =>
  props.items.some(item => item.urgency === 'breaking'),
)

const expanded = ref(props.initialExpanded ?? hasBreaking.value)

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
    <button
      class="flex w-full items-center justify-between py-3 group"
      @click="expanded = !expanded"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-xl leading-none">{{ icon }}</span>
        <h2 class="font-display text-lg font-bold text-slate-900">{{ title }}</h2>
        <span class="text-sm text-slate-400 font-body">{{ items.length }}</span>
      </div>
      <span class="text-sm text-slate-400 font-body group-hover:text-slate-600 transition-colors">
        {{ expanded ? 'Colapsar' : 'Expandir' }} {{ expanded ? '\u25B2' : '\u25BC' }}
      </span>
    </button>

    <div v-show="expanded" class="space-y-3 pb-6">
      <div
        v-for="item in items"
        :key="item.articleId"
        class="rounded-xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md hover:border-slate-200 cursor-pointer"
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
              <span class="text-xs text-slate-400 font-body">{{ item.time }}</span>
            </div>
            <h3 class="font-body text-[15px] font-semibold text-slate-900 leading-snug">
              {{ item.headline }}
            </h3>
            <p
              v-if="item.urgency !== 'routine' || expanded"
              class="mt-1.5 font-editorial text-sm text-slate-500 leading-relaxed"
            >
              {{ item.summary }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
