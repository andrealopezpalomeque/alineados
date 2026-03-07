<script setup lang="ts">
const uiStore = useUiStore()
const { isMobile, isTablet, breakpoint } = useBreakpoint()

watch(breakpoint, (bp) => {
  if (bp === 'tablet') uiStore.sidebarOpen = false
  if (bp === 'desktop') uiStore.sidebarOpen = true
})
</script>

<template>
  <div class="flex min-h-screen bg-paper font-sans">
    <LayoutSidebar class="hidden md:flex" />

    <div class="flex flex-1 flex-col min-w-0">
      <LayoutHeader />

      <main class="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
        <div class="mx-auto max-w-4xl">
          <slot />
        </div>
      </main>
    </div>

    <LayoutMobileNav class="md:hidden" />
  </div>
</template>
