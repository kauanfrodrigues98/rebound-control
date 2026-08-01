import { requestControlApi } from '../utils/control-api';

export default defineEventHandler((event) => {
  return requestControlApi(event, '/licenses');
});
