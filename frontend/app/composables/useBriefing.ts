import { useBriefingStore } from '~/stores/briefing'
import type { BriefingType } from '~/types/briefing'

export function useTodayBriefing() {
  const store = useBriefingStore()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl as string

  if (import.meta.client) {
    store.fetchLatestBriefings(apiBase)
  }

  return {
    briefing: computed(() => store.activeBriefing),
    recap: computed(() => store.recap),
    midday: computed(() => store.midday),
    activeType: computed(() => store.activeType),
    hasBoth: computed(() => store.hasBoth),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    lastFetchedAt: computed(() => store.lastFetchedAt),
    sectionCount: computed(() => store.sectionCount),
    totalItems: computed(() => store.totalItems),
    urgencyCounts: computed(() => store.urgencyCounts),
    setActiveType: (type: BriefingType) => store.setActiveType(type),
    refresh: () => store.fetchLatestBriefings(apiBase, true),
  }
}
