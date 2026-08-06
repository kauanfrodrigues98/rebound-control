import { requestControlApi } from '../../utils/control-api';

export default defineEventHandler((event) => {
  const customerId = getRouterParam(event, 'customerId');

  return requestControlApi(event, `/customers/${encodeURIComponent(String(customerId))}`);
});
