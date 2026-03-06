<script setup lang="ts">
import { useBriefingStore } from '~/stores/briefing'

const store = useBriefingStore()

const updatedAgo = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateAgo() {
  const briefing = store.activeBriefing
  if (!briefing) {
    updatedAgo.value = ''
    return
  }

  // Use updatedAt if available, otherwise generatedAt
  const raw = briefing.updatedAt || briefing.generatedAt
  let ts: number
  if (typeof raw === 'string') {
    ts = new Date(raw).getTime()
  } else if (raw && '_seconds' in raw) {
    ts = raw._seconds * 1000
  } else {
    updatedAgo.value = ''
    return
  }

  const diffMs = Date.now() - ts
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) {
    updatedAgo.value = 'Actualizado ahora'
  } else if (diffMin < 60) {
    updatedAgo.value = `Actualizado hace ${diffMin} min`
  } else {
    const diffH = Math.floor(diffMin / 60)
    updatedAgo.value = `Actualizado hace ${diffH}h`
  }
}

onMounted(() => {
  updateAgo()
  timer = setInterval(updateAgo, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

watch(() => store.activeBriefing, updateAgo)
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-lg">
    <div class="flex items-center justify-between gap-4">
      <!-- Search -->
      <div class="relative max-w-md flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Buscar noticias, entrevistas, personas..."
          class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-institutional-blue focus:outline-none focus:ring-2 focus:ring-institutional-blue/20"
        />
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-4">
        <!-- Updated status -->
        <div
          v-if="updatedAgo"
          class="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
        >
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          {{ updatedAgo }}
        </div>

        <!-- Notification bell -->
        <button class="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <span class="text-lg">🔔</span>
          <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
      </div>
    </div>
  </header>
</template>
