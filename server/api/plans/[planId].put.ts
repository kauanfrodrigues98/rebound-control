import { getRouterParam, readBody } from 'h3';
import { requestControlApi } from '../../utils/control-api';

export default defineEventHandler(async (event) => {
  const planId = getRouterParam(event, 'planId');
  const body = await readBody(event);

  if (!planId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O ID do plano é obrigatório.',
    });
  }

  return requestControlApi(
    event,
    `/plans/${encodeURIComponent(planId)}`,
    {
      method: 'PUT',
      body,
    },
  );
});
