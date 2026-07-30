import { requestControlApiWithCookies } from '../../utils/control-api';

export default defineEventHandler((event) => {
  return requestControlApiWithCookies(event, '/auth/refresh', {
    method: 'POST',
  });
});
