export default defineEventHandler((event): Promise<unknown> =>
  proxyFinancialApi(event, 'billing'),
)
