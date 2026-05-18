const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  const year = parseInt(parts?.[0] ?? '2026', 10);
  const month = parseInt(parts?.[1] ?? '1', 10) - 1;
  const day = parseInt(parts?.[2] ?? '1', 10);
  const monthName = MONTH_NAMES[month] ?? 'January';
  return `${monthName} ${day}, ${year}`;
}

export function formatMonthYear(year: number, month: number): string {
  const monthName = MONTH_NAMES[month] ?? 'January';
  return `${monthName} ${year}`;
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;
  return { start, end };
}

export function formatCurrency(amount: number | undefined | null): string {
  const val = amount ?? 0;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
}
