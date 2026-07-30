import { requestControlApi } from '../../../utils/control-api';

export default defineEventHandler((event) => {
  const planId = getRouterParam(event, 'planId');

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
      method: 'DELETE',
    },
  );
});
