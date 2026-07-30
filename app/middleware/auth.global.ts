export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { loadCurrentUser } = useControlAuth()
  const user = await loadCurrentUser()

  if (!user) {
    return navigateTo('/login', { replace: true })
  }
})
