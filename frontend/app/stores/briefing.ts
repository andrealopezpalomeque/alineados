import { defineStore } from 'pinia'
import type { Briefing } from '~/types/briefing'

export const useBriefingStore = defineStore('briefing', () => {
  const briefing = ref<Briefing | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<Date | null>(null)

  const sectionCount = computed(() => briefing.value?.sections.length ?? 0)

  const totalItems = computed(() =>
    briefing.value?.sections.reduce((sum, s) => sum + s.items.length, 0) ?? 0,
  )

  const urgencyCounts = computed(() => {
    const counts = { breaking: 0, important: 0, routine: 0 }
    if (!briefing.value) return counts
    for (const section of briefing.value.sections) {
      for (const item of section.items) {
        counts[item.urgency]++
      }
    }
    return counts
  })

  async function fetchTodayBriefing(apiBase: string, force = false) {
    if (briefing.value && !force && lastFetchedAt.value) {
      const elapsed = Date.now() - lastFetchedAt.value.getTime()
      if (elapsed < 5 * 60 * 1000) return // Cache for 5 minutes
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Briefing>(`${apiBase}/api/briefings/today`)
      briefing.value = data
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        briefing.value = null
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el resumen'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchBriefingByDate(apiBase: string, date: string) {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Briefing>(`${apiBase}/api/briefings/${date}`)
      briefing.value = data
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        briefing.value = null
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el resumen'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    briefing,
    loading,
    error,
    lastFetchedAt,
    sectionCount,
    totalItems,
    urgencyCounts,
    fetchTodayBriefing,
    fetchBriefingByDate,
  }
})
