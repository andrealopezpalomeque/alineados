// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    'dayjs-nuxt',
    // 'nuxt-vuefire', // TODO: enable once Firebase credentials are configured in .env
  ],
  app: {
    head: {
      title: 'Alineados — Inteligencia Política',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/logos/logo-icon-dark.svg',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: '',
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: '',
      loginUser: '',
      loginPass: '',
    },
  },
})
