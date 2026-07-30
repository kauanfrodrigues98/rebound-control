import { getRouterParam } from 'h3';
import { requestControlApi } from '../../../utils/control-api';

export default defineEventHandler((event) => {
  const licenseInstanceId = getRouterParam(event, 'licenseInstanceId');

  if (!licenseInstanceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O ID da instância da licença é obrigatório.',
    });
  }

  return requestControlApi(
    event,
    `/licenses/${encodeURIComponent(licenseInstanceId)}/current`,
  );
});
