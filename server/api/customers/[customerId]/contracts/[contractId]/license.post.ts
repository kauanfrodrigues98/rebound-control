import { getRouterParam } from 'h3';
import { requestControlApi } from '../../../../../utils/control-api';

export default defineEventHandler((event) => {
  const customerId = getRouterParam(event, 'customerId');
  const contractId = getRouterParam(event, 'contractId');

  return requestControlApi(
    event,
    `/customers/${encodeURIComponent(String(customerId))}/contracts/${encodeURIComponent(
      String(contractId),
    )}/license`,
    {
      method: 'POST',
    },
  );
});
