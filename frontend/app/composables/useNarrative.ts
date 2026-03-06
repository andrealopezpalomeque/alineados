import { useNarrativeStore } from '~/stores/narrative'

export function useNarrative() {
  const store = useNarrativeStore()
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl as string

  if (import.meta.client) {
    store.fetchLatest(apiBase)
  }

  return {
    report: computed(() => store.currentReport),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    lastFetchedAt: computed(() => store.lastFetchedAt),
    refresh: () => store.fetchLatest(apiBase, true),
    fetchByWeek: (weekId: string) => store.fetchByWeek(apiBase, weekId),
  }
}
