import { useBriefingStore } from '~/stores/briefing'

export function useTodayBriefing() {
  const store = useBriefingStore()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl as string

  if (import.meta.client) {
    store.fetchTodayBriefing(apiBase)
  }

  return {
    briefing: computed(() => store.briefing),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    lastFetchedAt: computed(() => store.lastFetchedAt),
    sectionCount: computed(() => store.sectionCount),
    totalItems: computed(() => store.totalItems),
    urgencyCounts: computed(() => store.urgencyCounts),
    refresh: () => store.fetchTodayBriefing(apiBase, true),
  }
}

export function useBriefingByDate(date: string) {
  const store = useBriefingStore()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl as string

  if (import.meta.client) {
    store.fetchBriefingByDate(apiBase, date)
  }

  return {
    briefing: computed(() => store.briefing),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    refresh: () => store.fetchBriefingByDate(apiBase, date),
  }
}
