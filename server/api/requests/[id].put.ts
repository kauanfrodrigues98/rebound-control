import { readBody, getRouterParam } from "h3";
import { requestSalesApi } from "../../utils/request-api";
export default defineEventHandler(async (event) =>
  requestSalesApi(
    event,
    `/requests/self-hosted/${encodeURIComponent(getRouterParam(event, "id") ?? "")}`,
    { method: "PUT", body: await readBody(event) },
  ),
);
