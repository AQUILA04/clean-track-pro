/** Mirrors backend FX constants for offline / fallback conversion. */

export const CFA_PER_EUR = 655.957;

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
  return (amount / fromRate) * toRate;
}
