import { getQuery } from "h3";
import { requestControlApi } from "../../utils/control-api";
export default defineEventHandler((event) => {
  const query = getQuery(event),
    params = new URLSearchParams();
  for (const key of ["status", "page"])
    if (typeof query[key] === "string") params.set(key, query[key] as string);
  return requestControlApi(event, `/requests/self-hosted?${params}`);
});
