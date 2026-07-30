import { readBody } from 'h3';
import { requestControlApi } from '../../utils/control-api';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return requestControlApi(event, '/licenses', {
    method: 'POST',
    body,
  });
});
