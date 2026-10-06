import {
  refreshControlApiSession,
  getControlApiBaseUrl,
} from "./control-api.ts";
import {
  appendHeader,
  createError,
  getHeader,
  getRequestURL,
  getRouterParam,
  readBody,
  setHeader,
  type H3Event,
} from "h3";

const uuid =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
export async function proxyFinancialApi(
  event: H3Event,
  audience: "billing" | "financial-portal",
): Promise<unknown> {
  const path = getRouterParam(event, "path") ?? "";
  const method = event.method;
  const routes =
    audience === "billing"
      ? [
          ["GET", "plans/[a-zA-Z0-9_-]{1,80}/prices"],
          ["POST", "plans/[a-zA-Z0-9_-]{1,80}/prices"],
          ["GET", `customers/${uuid}/contracts/${uuid}/terms`],
          ["POST", `customers/${uuid}/contracts/${uuid}/terms`],
          ["POST", `customers/${uuid}/contracts/${uuid}/terms/${uuid}/sync`],
          ["POST", `customers/${uuid}/contracts/${uuid}/terms/${uuid}/cancel`],
          ["GET", `customers/${uuid}/contracts/${uuid}/termination`],
          ["POST", `customers/${uuid}/contracts/${uuid}/termination`],
          ["GET", `customers/${uuid}/contracts/${uuid}/financial-state`],
          ["POST", `customers/${uuid}/contracts/${uuid}/financial-state`],
          [
            "POST",
            `customers/${uuid}/contracts/${uuid}/financial-state/renewal`,
          ],
          [
            "POST",
            `customers/${uuid}/contracts/${uuid}/financial-state/suspension-policy`,
          ],
          ["GET", `customers/${uuid}/contracts/${uuid}/recurrence`],
          ["POST", `customers/${uuid}/contracts/${uuid}/recurrence`],
          ["POST", `customers/${uuid}/contracts/${uuid}/recurrence/process`],
          ["PUT", `customers/${uuid}/contracts/${uuid}/recurrence/state`],
          ["GET", `customers/${uuid}/card`],
          ["POST", `customers/${uuid}/card/customer`],
          ["GET", `customers/${uuid}`],
          ["PUT", `customers/${uuid}/profile`],
          ["POST", `customers/${uuid}/access`],
          ["DELETE", `customers/${uuid}/access/${uuid}`],
          ["GET", `customers/${uuid}/invoices/${uuid}`],
          ["POST", `customers/${uuid}/invoices/${uuid}/external-receipts`],
          ["POST", `customers/${uuid}/invoices/${uuid}/fiscal-documents`],
          ["POST", `customers/${uuid}/external-receipts/${uuid}/reverse`],
          ["GET", `customers/${uuid}/receipts/${uuid}`],
          ["POST", `customers/${uuid}/notifications/${uuid}/retry`],
        ]
      : [
          ["GET", "card"],
          ["POST", "card/setup"],
          ["DELETE", "card"],
          ["GET", "session"],
          ["POST", "session"],
          ["POST", "logout"],
          ["GET", "invoices"],
          ["GET", `invoices/${uuid}`],
          ["POST", `invoices/${uuid}/checkout`],
          ["GET", `invoices/${uuid}/payments/${uuid}`],
          ["GET", `receipts/${uuid}`],
        ];
  if (
    !routes.some(
      ([allowedMethod, pattern]) =>
        method === allowedMethod && new RegExp(`^${pattern}$`).test(path),
    )
  )
    throw createError({ statusCode: 404 });
  const origin = getHeader(event, "origin");
  if (
    !["GET", "HEAD"].includes(method) &&
    origin !== getRequestURL(event).origin &&
    origin !== useRuntimeConfig(event).controlFrontendOrigin
  )
    throw createError({
      statusCode: 403,
      statusMessage: "Origem não autorizada.",
    });
  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "Referrer-Policy", "no-referrer");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  const requestUrl = getRequestURL(event);
  const query = new URLSearchParams();
  if (requestUrl.searchParams.has("page"))
    query.set("page", requestUrl.searchParams.get("page")!);
  if (requestUrl.searchParams.has("format"))
    query.set("format", requestUrl.searchParams.get("format")!);
  const suffix = query.size ? `?${query}` : "";
  const document = isFinancialDocumentPath(path);
  const body = ["POST", "PUT"].includes(method)
    ? await readBody(event)
    : undefined;
  const initialCookie = getHeader(event, "cookie") ?? "";
  const request = (cookie: string) =>
    $fetch.raw<unknown>(
      `${getControlApiBaseUrl(event)}/${audience}/${path}${suffix}`,
      {
        method: method as "GET" | "POST" | "PUT" | "DELETE",
        body,
        headers: {
          cookie,
          ...(origin ? { origin } : {}),
          ...(getHeader(event, "idempotency-key")
            ? { "idempotency-key": getHeader(event, "idempotency-key")! }
            : {}),
        },
        responseType: document ? "arrayBuffer" : "json",
        redirect: "error",
        timeout: 50000,
      },
    );
  try {
    let response;
    try {
      response = await request(initialCookie);
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (audience !== "billing" || status !== 401) throw error;
      const cookie = await refreshControlApiSession(
        event,
        getControlApiBaseUrl(event),
        initialCookie,
      );
      if (!cookie) throw error;
      response = await request(cookie);
    }
    for (const cookie of response.headers.getSetCookie())
      appendHeader(event, "set-cookie", cookie);
    if (document) {
      setHeader(
        event,
        "Content-Type",
        response.headers.get("content-type") ?? "application/octet-stream",
      );
      setHeader(
        event,
        "Content-Disposition",
        response.headers.get("content-disposition") ?? "attachment",
      );
      setHeader(
        event,
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      );
      return new Uint8Array(response._data as ArrayBuffer);
    }
    return response._data;
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 502;
    throw createError({
      statusCode: status,
      statusMessage:
        status === 401
          ? "O acesso expirou. Entre novamente ou solicite um novo link."
          : "Não foi possível concluir a operação financeira.",
    });
  }
}

export function isFinancialDocumentPath(path: string): boolean {
  return /(?:^|\/)receipts\/[^/]+$/.test(path);
}
