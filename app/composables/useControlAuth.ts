interface ControlUserSession {
  id: string
  email: string
  name: string
  role: string
  mustChangePassword: boolean
}

interface AuthResponse {
  user: ControlUserSession | null
}

export function useControlAuth() {
  const user = useState<ControlUserSession | null>('control-auth-user', () => null)
  const isCheckingSession = useState('control-auth-checking', () => false)

  const apiFetch = $fetch.create({
    baseURL: '/api',
    credentials: 'include',
  })

  async function loadCurrentUser(): Promise<ControlUserSession | null> {
    if (user.value) return user.value
    if (isCheckingSession.value) return user.value

    isCheckingSession.value = true

    try {
      user.value = await apiFetch<ControlUserSession>('/auth/me')
      return user.value
    } catch {
      try {
        const refreshed = await apiFetch<AuthResponse>('/auth/refresh', {
          method: 'POST',
        })
        user.value = refreshed.user
        return user.value
      } catch {
        user.value = null
        return null
      }
    } finally {
      isCheckingSession.value = false
    }
  }

  async function login(input: { email: string; password: string }): Promise<ControlUserSession> {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
    })

    if (!response.user) throw new Error('Sessão não retornada pela API.')
    user.value = response.user
    return response.user
  }

  async function completeFirstAccess(input: {
    email: string
    setupToken: string
    newPassword: string
    confirmPassword: string
  }): Promise<ControlUserSession> {
    const response = await apiFetch<AuthResponse>('/auth/first-access', {
      method: 'POST',
      body: input,
    })

    if (!response.user) throw new Error('Sessão não retornada pela API.')
    user.value = response.user
    return response.user
  }

  async function logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
      })
    } finally {
      user.value = null
      await navigateTo('/login', { replace: true })
    }
  }

  return {
    user,
    loadCurrentUser,
    login,
    completeFirstAccess,
    logout,
  }
}
