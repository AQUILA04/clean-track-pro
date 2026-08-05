import { CFA_PER_EUR, STATIC_RATES_PER_EUR, convertAmount as convertWithRates } from './fx-rates';
import { getPublicApiUrl } from '@/lib/public-env';

export { CFA_PER_EUR, STATIC_RATES_PER_EUR };


let cachedRates: Record<string, number> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** Browser timezone → display currency when IP geo is unavailable (e.g. local dev). */
const TIMEZONE_CURRENCY_MAP: Record<string, string> = {
  'Indian/Mauritius': 'MUR',
  'Indian/Mahe': 'SCR',
  'Indian/Antananarivo': 'MGA',
  'Indian/Reunion': 'EUR',
  'Indian/Mayotte': 'EUR',
  'Africa/Abidjan': 'XOF',
  'Africa/Dakar': 'XOF',
  'Africa/Bamako': 'XOF',
  'Africa/Ouagadougou': 'XOF',
  'Africa/Lome': 'XOF',
  'Africa/Porto-Novo': 'XOF',
  'Africa/Niamey': 'XOF',
  'Africa/Douala': 'XAF',
  'Africa/Libreville': 'XAF',
  'Africa/Casablanca': 'MAD',
  'Africa/Tunis': 'TND',
  'Africa/Algiers': 'DZD',
  'Africa/Lagos': 'NGN',
  'Africa/Accra': 'GHS',
  'Africa/Johannesburg': 'ZAR',
  'Africa/Cairo': 'EGP',
  'Europe/Paris': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/London': 'GBP',
  'America/New_York': 'USD',
  'America/Toronto': 'CAD',
};

export function currencyFromTimezone(timeZone?: string | null): string | null {
  if (!timeZone) return null;
  return TIMEZONE_CURRENCY_MAP[timeZone] ?? null;
}

export async function fetchRatesPerEur(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cachedAt < CACHE_TTL_MS) {
    return cachedRates;
  }
  try {
    const res = await fetch(`${getPublicApiUrl()}/fx/rates`);
    if (!res.ok) throw new Error('FX rates unavailable');
    const body = await res.json();
    const rates = (body?.data?.rates ?? body?.rates ?? {}) as Record<string, number>;
    cachedRates = {
      ...STATIC_RATES_PER_EUR,
      ...rates,
      EUR: 1,
      XOF: CFA_PER_EUR,
      XAF: CFA_PER_EUR,
      MUR: rates.MUR ?? STATIC_RATES_PER_EUR.MUR,
    };
    cachedAt = now;
    return cachedRates;
  } catch {
    return { ...STATIC_RATES_PER_EUR };
  }
}

export function convertAmountSync(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = STATIC_RATES_PER_EUR,
): number {
  try {
    return convertWithRates(amount, from, to, rates);
  } catch {
    return amount;
  }
}

export async function convertAmount(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  const rates = await fetchRatesPerEur();
  return convertAmountSync(amount, from, to, rates);
}

export async function suggestDisplayCurrency(): Promise<{
  currency: string;
  country: string | null;
  source: string;
}> {
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : null;
  const tzCurrency = currencyFromTimezone(tz);

  try {
    const res = await fetch(`${getPublicApiUrl()}/fx/suggest-currency`);
    if (!res.ok) throw new Error('suggest failed');
    const body = await res.json();
    const data = body?.data ?? body;
    const apiCurrency = String(data.currency || '').toUpperCase() || null;
    const source = String(data.source || 'default');

    // Prefer real geo; if API fell back to platform default, use browser timezone.
    if (source === 'geo' && apiCurrency) {
      return {
        currency: apiCurrency,
        country: data.country ?? null,
        source: 'geo',
      };
    }
    if (tzCurrency) {
      return { currency: tzCurrency, country: data.country ?? null, source: 'timezone' };
    }
    return {
      currency: apiCurrency || 'XOF',
      country: data.country ?? null,
      source: source === 'default' ? 'default' : source,
    };
  } catch {
    if (tzCurrency) {
      return { currency: tzCurrency, country: null, source: 'timezone' };
    }
    return { currency: 'XOF', country: null, source: 'default' };
  }
}
