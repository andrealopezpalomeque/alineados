<script setup lang="ts">
const route = useRoute()

const primaryTabs = [
  { label: 'Resumen', icon: '📋', to: '/' },
  { label: 'Noticias', icon: '📰', to: '/feed' },
  { label: 'Justicia', icon: '⚖', to: '/justice' },
  { label: 'Entrevistas', icon: '🎙', to: '/interviews' },
]

const overflowItems = [
  { label: 'Gobernador', icon: '🏛', to: '/governor' },
  { label: 'Gabinete', icon: '👥', to: '/cabinet' },
  { label: 'Oposición', icon: '📢', to: '/opposition' },
  { label: 'Análisis Semanal', icon: '📊', to: '/narrative' },
]

const overflowOpen = ref(false)

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const isOverflowActive = computed(() => {
  return overflowItems.some((item) => isActive(item.to))
})

function toggleOverflow() {
  overflowOpen.value = !overflowOpen.value
}

function closeOverflow() {
  overflowOpen.value = false
}
</script>

<template>
  <nav class="mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/[0.92] backdrop-blur-xl">
    <!-- Overflow menu overlay -->
    <div
      v-if="overflowOpen"
      class="fixed inset-0 z-40"
      @click="closeOverflow"
    />

    <!-- Overflow menu popup -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="overflowOpen"
        class="absolute bottom-20 left-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
      >
        <NuxtLink
          v-for="item in overflowItems"
          :key="item.to"
          :to="item.to"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
          :class="isActive(item.to) ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'"
          @click="closeOverflow"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-sm font-medium">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </Transition>

    <!-- Tab bar -->
    <div class="mobile-nav-inner flex items-center justify-around px-2 py-2">
      <NuxtLink
        v-for="item in primaryTabs"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-center transition-colors"
        :class="isActive(item.to) ? 'text-blue-600' : 'text-slate-400'"
      >
        <span class="text-xl">{{ item.icon }}</span>
        <span class="text-xs font-medium leading-tight">{{ item.label }}</span>
      </NuxtLink>

      <!-- More button -->
      <button
        class="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-center transition-colors"
        :class="isOverflowActive || overflowOpen ? 'text-blue-600' : 'text-slate-400'"
        @click="toggleOverflow"
      >
        <span class="text-xl">•••</span>
        <span class="text-xs font-medium leading-tight">Más</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.mobile-nav {
  -webkit-backdrop-filter: blur(20px);
}

.mobile-nav-inner {
  padding-bottom: env(safe-area-inset-bottom, 8px);
}
</style>
