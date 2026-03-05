export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (authStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
