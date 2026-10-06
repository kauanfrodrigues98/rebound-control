export default defineEventHandler((event): Promise<unknown> =>
  proxyFinancialApi(event, 'financial-portal'),
)
