import { getQuery } from 'h3';
import { requestControlApi } from '../utils/control-api';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const params = new URLSearchParams();

  for (const key of ['search', 'stage', 'environment']) {
    const value = query[key];
    if (typeof value === 'string' && value.trim()) params.set(key, value);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return requestControlApi(event, `/customers${suffix}`);
});
