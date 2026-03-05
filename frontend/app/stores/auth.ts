export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
  }),
  actions: {
    login(username: string, password: string): boolean {
      const config = useRuntimeConfig()
      if (username === config.public.loginUser && password === config.public.loginPass) {
        this.isAuthenticated = true
        if (import.meta.client) {
          sessionStorage.setItem('auth', 'true')
        }
        return true
      }
      return false
    },
    logout() {
      this.isAuthenticated = false
      if (import.meta.client) {
        sessionStorage.removeItem('auth')
      }
      navigateTo('/login')
    },
    hydrate() {
      if (import.meta.client) {
        this.isAuthenticated = sessionStorage.getItem('auth') === 'true'
      }
    },
  },
})
