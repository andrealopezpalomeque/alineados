import { defineStore } from 'pinia'
import type { NarrativeReport } from '~/types/narrative'

export const useNarrativeStore = defineStore('narrative', () => {
  const currentReport = ref<NarrativeReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<Date | null>(null)

  async function fetchLatest(apiBase: string, force = false) {
    if (!force && lastFetchedAt.value) {
      const elapsed = Date.now() - lastFetchedAt.value.getTime()
      if (elapsed < 5 * 60 * 1000 && currentReport.value) return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<NarrativeReport>(`${apiBase}/api/narrative/latest`)
      currentReport.value = response
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        currentReport.value = null
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el analisis semanal'
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchByWeek(apiBase: string, weekId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<NarrativeReport>(`${apiBase}/api/narrative/${weekId}`)
      currentReport.value = response
      lastFetchedAt.value = new Date()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        currentReport.value = null
        error.value = 'No se encontro analisis para esta semana'
      } else {
        error.value = e instanceof Error ? e.message : 'Error al cargar el analisis'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    currentReport,
    loading,
    error,
    lastFetchedAt,
    fetchLatest,
    fetchByWeek,
  }
})
