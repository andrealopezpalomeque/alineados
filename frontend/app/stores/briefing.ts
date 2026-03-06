import { defineStore } from 'pinia'
import type { Briefing, BriefingType, LatestBriefingsResponse } from '~/types/briefing'

export const useBriefingStore = defineStore('briefing', () => {
  const recap = ref<Briefing | null>(null)
  const midday = ref<Briefing | null>(null)
  const activeType = ref<BriefingType>('midday')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<Date | null>(null)

  const activeBriefing = computed(() =>
    activeType.value === 'midday' && midday.value ? midday.value : recap.value,
  )

  const hasBoth = computed(() => !!recap.value && !!midday.value)

  const sectionCount = computed(() => activeBriefing.value?.sections.length ?? 0)

  const totalItems = computed(() =>
    activeBriefing.value?.sections.reduce((sum, s) => sum + s.items.length, 0) ?? 0,
  )

  const urgencyCounts = computed(() => {
    const counts = { breaking: 0, important: 0, routine: 0 }
    if (!activeBriefing.value) return counts
    for (const section of activeBriefing.value.sections) {
      for (const item of section.items) {
        counts[item.urgency]++
      }
    }
    return counts
  })

  function pickDefaultType() {
    // If midday exists, default to it (it's the more recent one)
    if (midday.value) {
      activeType.value = 'midday'
    } else {
      activeType.value = 'recap'
    }
  }

  async function fetchLatestBriefings(apiBase: string, force = false) {
    if (!force && lastFetchedAt.value) {
      const elapsed = Date.now() - lastFetchedAt.value.getTime()
      if (elapsed < 5 * 60 * 1000 && (recap.value || midday.value)) return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<LatestBriefingsResponse>(`${apiBase}/api/briefings/latest`)

      midday.value = response.latestUpdate || null
      recap.value = response.yesterdayRecap || null

      pickDefaultType()
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        recap.value = null
        midday.value = null
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el resumen'
      }
    } finally {
      loading.value = false
    }
  }

  function setActiveType(type: BriefingType) {
    activeType.value = type
  }

  return {
    recap,
    midday,
    activeType,
    activeBriefing,
    hasBoth,
    loading,
    error,
    lastFetchedAt,
    sectionCount,
    totalItems,
    urgencyCounts,
    fetchLatestBriefings,
    setActiveType,
  }
})
