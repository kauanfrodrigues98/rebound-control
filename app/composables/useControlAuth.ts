import { appendResponseHeader } from 'h3';

const sessionRequests = new WeakMap<
  object,
  Promise<ControlUserSession | null>
>();

interface ControlUserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

interface AuthResponse {
  user: ControlUserSession | null;
}

export function useControlAuth() {
  const user = useState<ControlUserSession | null>(
    'control-auth-user',
    () => null,
  );
  const isCheckingSession = useState('control-auth-checking', () => false);

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch;
  const apiFetch = <T,>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {},
  ) =>
    requestFetch<T>(`/api${path}`, {
      ...options,
      credentials: 'include',
    });

  async function loadCurrentUser(): Promise<ControlUserSession | null> {
    const app = useNuxtApp();
    const pending = sessionRequests.get(app);
    if (pending) return pending;
    const event = import.meta.server ? useRequestEvent() : undefined;
    const request = (async () => {
      isCheckingSession.value = true;
      try {
        const response = await $fetch.raw<ControlUserSession>(
          '/api/auth/me',
          {
            credentials: 'include',
            headers: event ? { cookie: event.node.req.headers.cookie ?? '' } : undefined,
            retry: 0,
          },
        );
        if (event) {
          for (const cookie of response.headers.getSetCookie()) {
            appendResponseHeader(event, 'set-cookie', cookie);
          }
        }
        user.value = response._data ?? null;
        return user.value;
      } catch (error) {
        if (getAuthErrorStatus(error) === 401) {
          user.value = null;
          return null;
        }
        throw createError({
          statusCode: 503,
          message: 'Não foi possível verificar sua sessão. Tente novamente.',
        });
      } finally {
        isCheckingSession.value = false;
      }
    })();
    sessionRequests.set(app, request);
    try {
      return await request;
    } finally {
      sessionRequests.delete(app);
    }
  }

  async function login(input: {
    email: string;
    password: string;
  }): Promise<ControlUserSession> {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
    });

    if (!response.user) throw new Error('Sessão não retornada pela API.');
    user.value = response.user;
    return response.user;
  }

  async function completeFirstAccess(input: {
    email: string;
    setupToken: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ControlUserSession> {
    const response = await apiFetch<AuthResponse>('/auth/first-access', {
      method: 'POST',
      body: input,
    });

    if (!response.user) throw new Error('Sessão não retornada pela API.');
    user.value = response.user;
    return response.user;
  }

  async function logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
      });
    } finally {
      user.value = null;
      await navigateTo('/login', { replace: true });
    }
  }

  return {
    user,
    loadCurrentUser,
    login,
    completeFirstAccess,
    logout,
  };
}

function getAuthErrorStatus(error: unknown): number | undefined {
  const value = error as { statusCode?: number; status?: number; response?: { status?: number }; data?: { statusCode?: number } };
  return value.response?.status ?? value.statusCode ?? value.status ?? value.data?.statusCode;
}
