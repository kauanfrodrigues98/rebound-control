import { getRouterParam } from "h3";
import { requestSalesApi } from "../../../utils/request-api";
export default defineEventHandler((event) =>
  requestSalesApi(
    event,
    `/requests/self-hosted/${encodeURIComponent(getRouterParam(event, "id") ?? "")}/retry-email`,
    { method: "POST" },
  ),
);
