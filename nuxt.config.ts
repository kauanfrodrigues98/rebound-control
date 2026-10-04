// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    controlFrontendOrigin:
      process.env.NUXT_CONTROL_FRONTEND_ORIGIN || 'http://localhost:3020',
    controlApiBaseUrl:
      process.env.NUXT_CONTROL_API_BASE_URL || 'http://localhost:3021/api/v1',
  },
})
