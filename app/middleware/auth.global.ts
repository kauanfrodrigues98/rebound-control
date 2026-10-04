export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/financial') return

  const { loadCurrentUser } = useControlAuth()
  const user = await loadCurrentUser()

  if (!user) {
    return navigateTo('/login', { replace: true })
  }
})
