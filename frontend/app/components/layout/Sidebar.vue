<script setup lang="ts">
const route = useRoute()
const uiStore = useUiStore()

const navItems = [
  { label: 'Resumen del Día', icon: '📋', to: '/' },
  { label: 'Todas las Noticias', icon: '📰', to: '/feed' },
  { label: 'El Gobernador', icon: '🏛', to: '/governor' },
  { label: 'Justicia y DDHH', icon: '⚖', to: '/justice' },
  { label: 'Gabinete', icon: '👥', to: '/cabinet' },
  { label: 'Oposición', icon: '📢', to: '/opposition' },
  { label: 'Entrevistas', icon: '🎙', to: '/interviews' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <aside
    class="sticky top-0 flex h-screen flex-col justify-between transition-all duration-300"
    :class="uiStore.sidebarOpen ? 'w-[260px]' : 'w-[72px]'"
    :style="{ background: 'linear-gradient(180deg, #0f172a 0%, #162032 100%)' }"
  >
    <!-- Logo -->
    <div>
      <div class="flex items-center gap-3 px-5 pt-6 pb-8">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
          :style="{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }"
        >
          A
        </div>
        <div v-if="uiStore.sidebarOpen" class="min-w-0">
          <p class="truncate font-playfair text-lg font-bold text-white">Alineados</p>
          <p class="truncate text-xs text-slate-400">Inteligencia política</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex flex-col gap-1 px-3">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          "
        >
          <span class="shrink-0 text-base">{{ item.icon }}</span>
          <span v-if="uiStore.sidebarOpen" class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Bottom section -->
    <div class="px-3 pb-4">
      <!-- User -->
      <div class="mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          :style="{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }"
        >
          JL
        </div>
        <div v-if="uiStore.sidebarOpen" class="min-w-0">
          <p class="truncate text-sm font-medium text-white">López Desimoni</p>
          <p class="truncate text-xs text-slate-400">Justicia y DDHH</p>
        </div>
      </div>

      <!-- Collapse toggle -->
      <button
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        @click="uiStore.toggleSidebar()"
      >
        <span class="shrink-0 text-base">{{ uiStore.sidebarOpen ? '◀' : '▶' }}</span>
        <span v-if="uiStore.sidebarOpen">Colapsar</span>
      </button>
    </div>
  </aside>
</template>
