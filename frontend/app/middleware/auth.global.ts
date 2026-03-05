export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (import.meta.client) {
    authStore.hydrate()
  }

  if (!authStore.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (authStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
