import { DEFAULT_TENANT_CURRENCY, getCurrencySymbol, normalizeCurrencyCode } from './currencies';

/**
 * Format a monetary amount using the tenant's ISO currency code.
 * Falls back to a plain number + code if Intl rejects the currency.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = DEFAULT_TENANT_CURRENCY,
  locale = 'fr-FR',
): string {
  const value = typeof amount === 'string' ? Number(amount) : Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const code = normalizeCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).format(safe);
  } catch {
    return `${safe.toLocaleString(locale)} ${getCurrencySymbol(code)}`;
  }
}
