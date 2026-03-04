// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    'dayjs-nuxt',
    // 'nuxt-vuefire', // TODO: enable once Firebase credentials are configured in .env
  ],
  app: {
    head: {
      link: [
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
  // vuefire: {
  //   config: {
  //     apiKey: process.env.FIREBASE_API_KEY,
  //     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  //     projectId: process.env.FIREBASE_PROJECT_ID,
  //     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  //     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  //     appId: process.env.FIREBASE_APP_ID,
  //   },
  // },
})
