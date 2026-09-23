// Date and Time Formatting Utilities
import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateString?: string, formatStr = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  try {
    const d = parseISO(dateString);
    return isValid(d) ? format(d, formatStr) : dateString;
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

export function formatCurrencyINR(amount?: number): string {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDurationMinutes(minutes?: number): string {
  if (!minutes) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
