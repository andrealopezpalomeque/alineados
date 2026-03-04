<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Resumen', icon: '📋', to: '/' },
  { label: 'Noticias', icon: '📰', to: '/feed' },
  { label: 'Gobernador', icon: '🏛', to: '/governor' },
  { label: 'Justicia', icon: '⚖', to: '/justice' },
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
  <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-lg">
    <div class="flex items-center justify-around px-2 py-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-center transition-colors"
        :class="
          isActive(item.to)
            ? 'text-institutional-blue'
            : 'text-slate-400'
        "
      >
        <span class="text-lg">{{ item.icon }}</span>
        <span class="text-[10px] font-medium leading-tight">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
