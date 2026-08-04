import {
  normalizeCurrencyCode,
  DEFAULT_TENANT_CURRENCY,
  getCurrencySymbol,
} from '../currencies';
import { formatCurrency } from '../format-currency';

describe('currencies', () => {
  it('defaults to XOF', () => {
    expect(normalizeCurrencyCode(undefined)).toBe(DEFAULT_TENANT_CURRENCY);
  });

  it('maps legacy labels', () => {
    expect(normalizeCurrencyCode('Euro (€)')).toBe('EUR');
  });

  it('returns FCFA symbol for XOF', () => {
    expect(getCurrencySymbol('XOF')).toBe('F CFA');
  });
});

describe('formatCurrency', () => {
  it('formats XOF amounts', () => {
    const formatted = formatCurrency(1500, 'XOF');
    expect(formatted).toMatch(/1[\s\u202f]?500/);
    expect(formatted.toUpperCase()).toMatch(/F|XOF|CFA/);
  });

  it('formats EUR amounts', () => {
    const formatted = formatCurrency(10.5, 'EUR');
    expect(formatted).toContain('10');
  });
});
