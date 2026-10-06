export default defineNuxtPlugin((app) => {
  const { user, loadCurrentUser } = useControlAuth();
  let redirecting = false;
  async function expireSession() {
    if (redirecting) return;
    redirecting = true;
    user.value = null;
    clearNuxtData();
    try {
      await $fetch('/api/auth/logout', { method: 'POST', retry: 0 });
    } catch {
      /* Redirect even if the logout endpoint is unavailable. */
    }
    await app.runWithContext(() => navigateTo('/login', { replace: true }));
    redirecting = false;
  }
  async function checkSession() {
    if (!user.value || document.hidden) return;
    try {
      const current = await app.runWithContext(loadCurrentUser);
      if (!current) await expireSession();
    } catch {
      /* A network outage does not invalidate an existing session. */
    }
  }
  const timer = window.setInterval(checkSession, 60000);
  window.addEventListener('focus', checkSession);
  import.meta.hot?.dispose(() => {
    window.clearInterval(timer);
    window.removeEventListener('focus', checkSession);
  });
  globalThis.$fetch = globalThis.$fetch.create({
    async onResponseError({ request, response }) {
      const path = typeof request === 'string' ? request : request.url;
      if (
        response.status !== 401 ||
        !path.startsWith('/api/') ||
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/financial-portal/') ||
        redirecting
      )
        return;
      await expireSession();
    },
  });
});
