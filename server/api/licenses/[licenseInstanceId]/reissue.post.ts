import { getRouterParam, readBody } from 'h3';
import { requestControlApi } from '../../../utils/control-api';

export default defineEventHandler(async (event) => {
  const licenseInstanceId = getRouterParam(event, 'licenseInstanceId');

  if (!licenseInstanceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O ID da instância da licença é obrigatório.',
    });
  }

  const body = await readBody(event);

  return requestControlApi(
    event,
    `/licenses/${encodeURIComponent(licenseInstanceId)}/reissue`,
    {
      method: 'POST',
      body,
    },
  );
});
