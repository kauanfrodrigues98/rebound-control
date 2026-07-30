const brNumberFormatter = new Intl.NumberFormat('pt-BR');
const brCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

export function onlyDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function parseMaskedInteger(value: unknown, fallback = 0): number {
  const digits = onlyDigits(value);

  if (!digits) {
    return fallback;
  }

  const parsed = Number(digits);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatIntegerInput(value: unknown): string {
  const numericValue = typeof value === 'number'
    ? value
    : parseMaskedInteger(value, 0);

  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return brNumberFormatter.format(Math.max(0, Math.trunc(numericValue)));
}

export function parseMaskedCurrencyToCents(value: unknown): number {
  return parseMaskedInteger(value, 0);
}

export function formatBrlFromCents(cents: number): string {
  return brCurrencyFormatter.format(Math.max(0, cents) / 100);
}

export function formatBrlInput(value: unknown): string {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return '';
  }

  return formatBrlFromCents(parseMaskedCurrencyToCents(rawValue));
}
