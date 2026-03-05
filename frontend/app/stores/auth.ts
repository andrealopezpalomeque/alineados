export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
  }),
  actions: {
    login(username: string, password: string): boolean {
      const config = useRuntimeConfig()
      if (username === config.public.loginUser && password === config.public.loginPass) {
        this.isAuthenticated = true
        return true
      }
      return false
    },
    logout() {
      this.isAuthenticated = false
      navigateTo('/login')
    },
  },
})
