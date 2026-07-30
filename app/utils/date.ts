export function formatDate(value?: string): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toEndOfDayIso(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59.000Z`).toISOString();
}
