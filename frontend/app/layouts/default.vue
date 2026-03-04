<script setup lang="ts">
const uiStore = useUiStore()

// Auto-collapse sidebar on tablet (768-1023px)
function handleResize() {
  if (typeof window === 'undefined') return
  const width = window.innerWidth
  if (width >= 768 && width < 1024) {
    uiStore.sidebarOpen = false
  } else if (width >= 1024) {
    uiStore.sidebarOpen = true
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="flex h-screen bg-paper font-sans">
    <LayoutSidebar class="hidden md:flex" />

    <div class="flex flex-1 flex-col min-w-0">
      <LayoutHeader />

      <main class="flex-1 overflow-y-auto px-8 py-8 pb-24 md:pb-8">
        <div class="mx-auto max-w-4xl">
          <slot />
        </div>
      </main>
    </div>

    <LayoutMobileNav class="md:hidden" />
  </div>
</template>
