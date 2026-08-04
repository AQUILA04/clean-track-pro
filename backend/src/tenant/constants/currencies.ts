/** ISO 4217 codes for the most widely used currencies worldwide. */
export const POPULAR_CURRENCY_CODES = [
  'XOF', // Franc CFA BCEAO (default)
  'XAF', // Franc CFA BEAC
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'JPY',
  'CNY',
  'MAD',
  'TND',
  'DZD',
  'NGN',
  'GHS',
  'ZAR',
  'EGP',
  'AED',
  'SAR',
  'INR',
  'BRL',
  'MXN',
  'TRY',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'RON',
  'HUF',
  'RUB',
  'KRW',
  'SGD',
  'HKD',
  'NZD',
  'THB',
  'MYR',
  'IDR',
  'PHP',
  'VND',
] as const;

export type PopularCurrencyCode = (typeof POPULAR_CURRENCY_CODES)[number];

export const DEFAULT_TENANT_CURRENCY: PopularCurrencyCode = 'XOF';

const LEGACY_CURRENCY_LABELS: Record<string, PopularCurrencyCode> = {
  'Euro (€)': 'EUR',
  'Dollar ($)': 'USD',
  'Livre Sterling (£)': 'GBP',
  Euro: 'EUR',
  Dollar: 'USD',
};

/** Normalize legacy display labels or free-form values to an ISO code. */
export function normalizeCurrencyCode(value: string | null | undefined): string {
  if (!value) return DEFAULT_TENANT_CURRENCY;
  const trimmed = value.trim();
  if ((POPULAR_CURRENCY_CODES as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  const upper = trimmed.toUpperCase();
  if ((POPULAR_CURRENCY_CODES as readonly string[]).includes(upper)) {
    return upper;
  }
  return LEGACY_CURRENCY_LABELS[trimmed] ?? DEFAULT_TENANT_CURRENCY;
}
