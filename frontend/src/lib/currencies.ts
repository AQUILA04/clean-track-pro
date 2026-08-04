/** Popular ISO 4217 currencies available for tenant selection. Default: XOF. */
export const DEFAULT_TENANT_CURRENCY = 'XOF';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const POPULAR_CURRENCIES: CurrencyOption[] = [
  { code: 'XOF', name: 'Franc CFA (BCEAO)', symbol: 'F CFA' },
  { code: 'XAF', name: 'Franc CFA (BEAC)', symbol: 'FCFA' },
  { code: 'MUR', name: 'Roupie mauricienne', symbol: '₨' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar américain', symbol: '$' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$' },
  { code: 'AUD', name: 'Dollar australien', symbol: 'A$' },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
  { code: 'CNY', name: 'Yuan chinois', symbol: '¥' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'MAD' },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'TND' },
  { code: 'DZD', name: 'Dinar algérien', symbol: 'DZD' },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦' },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: 'GH₵' },
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R' },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£' },
  { code: 'AED', name: 'Dirham des ÉAU', symbol: 'AED' },
  { code: 'SAR', name: 'Riyal saoudien', symbol: 'SAR' },
  { code: 'INR', name: 'Roupie indienne', symbol: '₹' },
  { code: 'BRL', name: 'Real brésilien', symbol: 'R$' },
  { code: 'MXN', name: 'Peso mexicain', symbol: 'MX$' },
  { code: 'TRY', name: 'Livre turque', symbol: '₺' },
  { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr' },
  { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr' },
  { code: 'DKK', name: 'Couronne danoise', symbol: 'kr' },
  { code: 'PLN', name: 'Zloty polonais', symbol: 'zł' },
  { code: 'CZK', name: 'Couronne tchèque', symbol: 'Kč' },
  { code: 'RON', name: 'Leu roumain', symbol: 'lei' },
  { code: 'HUF', name: 'Forint hongrois', symbol: 'Ft' },
  { code: 'RUB', name: 'Rouble russe', symbol: '₽' },
  { code: 'KRW', name: 'Won sud-coréen', symbol: '₩' },
  { code: 'SGD', name: 'Dollar de Singapour', symbol: 'S$' },
  { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$' },
  { code: 'NZD', name: 'Dollar néo-zélandais', symbol: 'NZ$' },
  { code: 'THB', name: 'Baht thaïlandais', symbol: '฿' },
  { code: 'MYR', name: 'Ringgit malaisien', symbol: 'RM' },
  { code: 'IDR', name: 'Roupie indonésienne', symbol: 'Rp' },
  { code: 'PHP', name: 'Peso philippin', symbol: '₱' },
  { code: 'VND', name: 'Dong vietnamien', symbol: '₫' },
];

const LEGACY_LABELS: Record<string, string> = {
  'Euro (€)': 'EUR',
  'Dollar ($)': 'USD',
  'Livre Sterling (£)': 'GBP',
  Euro: 'EUR',
  Dollar: 'USD',
};

const VALID_CODES = new Set(POPULAR_CURRENCIES.map((c) => c.code));

/** Normalize legacy labels or free-form values to an ISO 4217 code. */
export function normalizeCurrencyCode(value: string | null | undefined): string {
  if (!value) return DEFAULT_TENANT_CURRENCY;
  const trimmed = value.trim();
  if (VALID_CODES.has(trimmed)) return trimmed;
  const upper = trimmed.toUpperCase();
  if (VALID_CODES.has(upper)) return upper;
  return LEGACY_LABELS[trimmed] ?? DEFAULT_TENANT_CURRENCY;
}

export function getCurrencyOption(code: string): CurrencyOption | undefined {
  const normalized = normalizeCurrencyCode(code);
  return POPULAR_CURRENCIES.find((c) => c.code === normalized);
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyOption(code)?.symbol ?? normalizeCurrencyCode(code);
}

export function getCurrencyLabel(code: string): string {
  const opt = getCurrencyOption(code);
  if (!opt) return normalizeCurrencyCode(code);
  return `${opt.name} (${opt.code})`;
}
