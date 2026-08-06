import { readBody } from 'h3';
import { requestControlApi } from '../../utils/control-api';

export default defineEventHandler(async (event) => {
  const customerId = getRouterParam(event, 'customerId');
  const body = await readBody(event);

  return requestControlApi(event, `/customers/${encodeURIComponent(String(customerId))}`, {
    method: 'PUT',
    body,
  });
});
