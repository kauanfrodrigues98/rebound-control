import { readBody } from 'h3';
import { requestControlApiWithCookies } from '../../utils/control-api';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return requestControlApiWithCookies(event, '/auth/first-access', {
    method: 'POST',
    body,
  });
});
