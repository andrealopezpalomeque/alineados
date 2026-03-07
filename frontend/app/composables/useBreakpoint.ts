import { ref, computed, onMounted, onUnmounted } from 'vue'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const breakpoint = ref<Breakpoint>('desktop')

  let onResize: (() => void) | undefined

  onMounted(() => {
    const update = () => {
      breakpoint.value = getBreakpoint(window.innerWidth)
    }

    update()
    onResize = update
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    if (onResize) {
      window.removeEventListener('resize', onResize)
    }
  })

  const isMobile = computed(() => breakpoint.value === 'mobile')
  const isTablet = computed(() => breakpoint.value === 'tablet')

  return {
    breakpoint,
    isMobile,
    isTablet,
  }
}
