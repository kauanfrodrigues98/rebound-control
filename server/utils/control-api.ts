import type { H3Event } from 'h3';
import { appendHeader, getHeader } from 'h3';

export function getControlApiBaseUrl(event: H3Event): string {
  const config = useRuntimeConfig(event);
  const configuredBaseUrl = String(config.controlApiBaseUrl || '');

  return configuredBaseUrl.replace(/\/+$/, '');
}

export async function requestControlApi<TResponse>(
  event: H3Event,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  } = {},
): Promise<TResponse> {
  const baseUrl = getControlApiBaseUrl(event);
  const initialCookieHeader = getHeader(event, 'cookie') ?? '';

  try {
    return await requestControlApiRaw<TResponse>(baseUrl, path, options, initialCookieHeader);
  } catch (error) {
    if (getFetchStatusCode(error) === 401) {
      const refreshedCookieHeader = await refreshControlApiSession(
        event,
        baseUrl,
        initialCookieHeader,
      );

      if (refreshedCookieHeader) {
        try {
          return await requestControlApiRaw<TResponse>(
            baseUrl,
            path,
            options,
            refreshedCookieHeader,
          );
        } catch (retryError) {
          toControlApiError(retryError);
        }
      }
    }

    toControlApiError(error);
  }
}

export async function requestControlApiWithCookies<TResponse>(
  event: H3Event,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  } = {},
): Promise<TResponse> {
  const baseUrl = getControlApiBaseUrl(event);
  const initialCookieHeader = getHeader(event, 'cookie') ?? '';

  try {
    return await requestControlApiRawWithCookies<TResponse>(
      event,
      baseUrl,
      path,
      options,
      initialCookieHeader,
    );
  } catch (error) {
    if (getFetchStatusCode(error) === 401 && !path.startsWith('/auth/')) {
      const refreshedCookieHeader = await refreshControlApiSession(
        event,
        baseUrl,
        initialCookieHeader,
      );

      if (refreshedCookieHeader) {
        try {
          return await requestControlApiRawWithCookies<TResponse>(
            event,
            baseUrl,
            path,
            options,
            refreshedCookieHeader,
          );
        } catch (retryError) {
          toControlApiError(retryError);
        }
      }
    }

    toControlApiError(error);
  }
}

async function requestControlApiRaw<TResponse>(
  baseUrl: string,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  },
  cookieHeader: string,
): Promise<TResponse> {
  return $fetch<TResponse>(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    body: options.body,
    headers: {
      cookie: cookieHeader,
    },
    credentials: 'include',
  });
}

async function requestControlApiRawWithCookies<TResponse>(
  event: H3Event,
  baseUrl: string,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  },
  cookieHeader: string,
): Promise<TResponse> {
  const response = await $fetch.raw<TResponse>(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    body: options.body,
    headers: {
      cookie: cookieHeader,
    },
    credentials: 'include',
  });

  appendSetCookieHeaders(event, response.headers);

  return response._data as TResponse;
}

async function refreshControlApiSession(
  event: H3Event,
  baseUrl: string,
  cookieHeader: string,
): Promise<string | null> {
  try {
    const response = await $fetch.raw(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
      },
      credentials: 'include',
    });
    const setCookieHeaders = getSetCookieHeaders(response.headers);

    if (!setCookieHeaders.length) {
      return null;
    }

    appendSetCookieHeaders(event, response.headers);

    return mergeCookieHeader(cookieHeader, setCookieHeaders);
  } catch {
    return null;
  }
}

function appendSetCookieHeaders(event: H3Event, headers: Headers): void {
  for (const cookie of getSetCookieHeaders(headers)) {
    appendHeader(event, 'set-cookie', cookie);
  }
}

function getSetCookieHeaders(headers: Headers): string[] {
  const headerWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  const explicitCookies = headerWithGetSetCookie.getSetCookie?.();
  if (explicitCookies?.length) return explicitCookies;

  const rawCookies = headerWithGetSetCookie.raw?.()['set-cookie'];
  if (rawCookies?.length) return rawCookies;

  const combinedCookie = headers.get('set-cookie');
  return combinedCookie ? splitSetCookieHeader(combinedCookie) : [];
}

function splitSetCookieHeader(header: string): string[] {
  return header.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((cookie) => cookie.trim());
}

function mergeCookieHeader(cookieHeader: string, setCookieHeaders: string[]): string {
  const cookies = new Map<string, string>();

  for (const cookie of cookieHeader.split(';')) {
    const trimmed = cookie.trim();
    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    cookies.set(trimmed.slice(0, separatorIndex), trimmed.slice(separatorIndex + 1));
  }

  for (const setCookie of setCookieHeaders) {
    const [cookiePair] = setCookie.split(';');
    const separatorIndex = cookiePair.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    cookies.set(cookiePair.slice(0, separatorIndex), cookiePair.slice(separatorIndex + 1));
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function getFetchStatusCode(error: unknown): number {
  return typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
    ? error.statusCode
    : 502;
}

function toControlApiError(error: unknown): never {
  const statusCode = getFetchStatusCode(error);

  throw createError({
    statusCode,
    statusMessage:
      statusCode === 502
        ? 'Não foi possível conectar ao rebound-control-api.'
        : 'A requisição ao rebound-control-api falhou.',
  });
}
