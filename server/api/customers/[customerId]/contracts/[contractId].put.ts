import { readBody } from 'h3';
import { requestControlApi } from '../../../../utils/control-api';

export default defineEventHandler(async (event) => {
  const customerId = getRouterParam(event, 'customerId');
  const contractId = getRouterParam(event, 'contractId');
  const body = await readBody(event);

  return requestControlApi(
    event,
    `/customers/${encodeURIComponent(String(customerId))}/contracts/${encodeURIComponent(
      String(contractId),
    )}`,
    {
      method: 'PUT',
      body,
    },
  );
});
