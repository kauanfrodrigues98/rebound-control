import { getQuery } from 'h3';
import { requestControlApi } from '../utils/control-api';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const includeArchived = query.includeArchived === 'true';
  const suffix = includeArchived ? '?includeArchived=true' : '';

  return requestControlApi(event, `/plans${suffix}`);
});
