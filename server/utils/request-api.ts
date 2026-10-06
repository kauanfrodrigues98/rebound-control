import { createError, getHeader, getRequestURL, type H3Event } from "h3";
import { requestControlApi } from "./control-api";
export function requestSalesApi(
  event: H3Event,
  path: string,
  options: { method: "PUT" | "POST"; body?: Record<string, unknown> },
) {
  const origin = getHeader(event, "origin");
  if (
    !origin ||
    (origin !== getRequestURL(event).origin &&
      origin !== useRuntimeConfig(event).controlFrontendOrigin)
  )
    throw createError({ statusCode: 403, message: "Origem não autorizada." });
  return requestControlApi(event, path, { ...options, origin });
}
