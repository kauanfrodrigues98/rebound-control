export function billingMoney(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  })
  return formatter.format(
    amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2),
  )
}
export function billingDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeZone: 'America/Recife',
      }).format(new Date(value))
    : 'Não informado'
}
export function safeFinancialUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.toString()
      : null
  } catch {
    return null
  }
}
export function billingStatus(status: string) {
  return (
    (
      {
        draft: 'Rascunho',
        open: 'Em aberto',
        partially_paid: 'Pagamento parcial',
        paid: 'Paga',
        past_due: 'Vencida',
        void: 'Anulada',
        uncollectible: 'Incobrável',
        cancelled: 'Cancelada',
        pending: 'Pendente',
        processing: 'Em processamento',
        succeeded: 'Confirmado',
        failed: 'Falhou',
        refunded: 'Reembolsado',
        partially_refunded: 'Reembolso parcial',
      } as Record<string, string>
    )[status] ?? status
  )
}
export function minorAmount(input: string, currency = 'BRL'): number {
  const value = input.trim()
  const digits =
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  if (!new RegExp(`^\\d+(?:[,.]\\d{1,${Math.max(1, digits)}})?$`).test(value))
    throw new Error('Valor inválido.')
  const [whole, decimals = ''] = value.replace(',', '.').split('.')
  if (decimals.length > digits)
    throw new Error('Casas decimais inválidas para a moeda.')
  const minor = Number(
    BigInt(whole!) * 10n ** BigInt(digits) +
      BigInt(decimals.padEnd(digits, '0') || '0'),
  )
  if (!Number.isSafeInteger(minor) || minor <= 0)
    throw new Error('Valor inválido.')
  return minor
}
