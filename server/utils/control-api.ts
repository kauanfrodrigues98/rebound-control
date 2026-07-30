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

  try {
    return await $fetch<TResponse>(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: {
        cookie: getHeader(event, 'cookie') ?? '',
      },
      credentials: 'include',
    });
  } catch (error) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : 502;

    throw createError({
      statusCode,
      statusMessage:
        statusCode === 502
          ? 'Não foi possível conectar ao rebound-control-api.'
          : 'A requisição ao rebound-control-api falhou.',
    });
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

  try {
    const response = await $fetch.raw<TResponse>(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      body: options.body,
      headers: {
        cookie: getHeader(event, 'cookie') ?? '',
      },
      credentials: 'include',
    });

    for (const cookie of getSetCookieHeaders(response.headers)) {
      appendHeader(event, 'set-cookie', cookie);
    }

    return response._data as TResponse;
  } catch (error) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : 502;

    throw createError({
      statusCode,
      statusMessage:
        statusCode === 502
          ? 'Não foi possível conectar ao rebound-control-api.'
          : 'A requisição ao rebound-control-api falhou.',
    });
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
