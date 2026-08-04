/** Platform billing currencies accepted for plans & SMS (Stripe charge currencies). */
export const PLATFORM_BILLING_CURRENCIES = ['EUR', 'USD'] as const;
export type PlatformBillingCurrency = (typeof PLATFORM_BILLING_CURRENCIES)[number];

export const DEFAULT_PLATFORM_CURRENCY: PlatformBillingCurrency = 'EUR';

/** Official BCEAO / BEAC peg (fixed). */
export const CFA_PER_EUR = 655.957;

/**
 * Approximate units of each currency for 1 EUR (display only).
 * USD and major currencies are refreshed via Frankfurter when available.
 */
export const STATIC_RATES_PER_EUR: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.94,
  CAD: 1.47,
  AUD: 1.65,
  JPY: 162,
  CNY: 7.8,
  MAD: 10.8,
  TND: 3.4,
  DZD: 145,
  NGN: 1700,
  GHS: 16.5,
  ZAR: 19.5,
  EGP: 53,
  AED: 3.97,
  SAR: 4.05,
  INR: 90,
  BRL: 6.1,
  MXN: 19.5,
  TRY: 38,
  SEK: 11.2,
  NOK: 11.5,
  DKK: 7.46,
  PLN: 4.3,
  CZK: 25.2,
  RON: 4.97,
  HUF: 395,
  RUB: 98,
  KRW: 1450,
  SGD: 1.45,
  HKD: 8.4,
  NZD: 1.78,
  THB: 38,
  MYR: 5.1,
  IDR: 17000,
  PHP: 61,
  VND: 27000,
  MUR: 50.5,
  SCR: 15.5,
  MGA: 4900,
  XOF: CFA_PER_EUR,
  XAF: CFA_PER_EUR,
};

/** Country ISO-3166-1 alpha-2 → preferred display currency. */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Franc CFA BCEAO
  CI: 'XOF',
  SN: 'XOF',
  BJ: 'XOF',
  BF: 'XOF',
  ML: 'XOF',
  NE: 'XOF',
  TG: 'XOF',
  GW: 'XOF',
  // Franc CFA BEAC
  CM: 'XAF',
  CF: 'XAF',
  TD: 'XAF',
  CG: 'XAF',
  GQ: 'XAF',
  GA: 'XAF',
  // Eurozone / nearby
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  BE: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  LU: 'EUR',
  GR: 'EUR',
  RE: 'EUR', // La Réunion
  YT: 'EUR', // Mayotte
  // Indian Ocean
  MU: 'MUR', // Maurice
  SC: 'SCR',
  MG: 'MGA',
  // Others
  US: 'USD',
  GB: 'GBP',
  CH: 'CHF',
  CA: 'CAD',
  AU: 'AUD',
  MA: 'MAD',
  TN: 'TND',
  DZ: 'DZD',
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  EG: 'EGP',
  AE: 'AED',
  SA: 'SAR',
  IN: 'INR',
  BR: 'BRL',
  MX: 'MXN',
  TR: 'TRY',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  SG: 'SGD',
  HK: 'HKD',
  NZ: 'NZD',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
};

/**
 * Mapped currency for a country, or null if unknown (caller may use IP API currency).
 * Does NOT default to XOF — that is only the ultimate platform fallback.
 */
export function suggestCurrencyForCountry(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? null;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesPerEur: Record<string, number> = STATIC_RATES_PER_EUR,
): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;

  const fromRate = ratesPerEur[from];
  const toRate = ratesPerEur[to];
  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency conversion: ${from} → ${to}`);
  }
  // amount in EUR, then to target
  const inEur = amount / fromRate;
  return inEur * toRate;
}
