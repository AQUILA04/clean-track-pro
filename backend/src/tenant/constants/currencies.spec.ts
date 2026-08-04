import { normalizeCurrencyCode, DEFAULT_TENANT_CURRENCY } from '../constants/currencies';

describe('normalizeCurrencyCode', () => {
  it('defaults to XOF', () => {
    expect(normalizeCurrencyCode(undefined)).toBe(DEFAULT_TENANT_CURRENCY);
    expect(normalizeCurrencyCode('')).toBe('XOF');
  });

  it('maps legacy labels to ISO codes', () => {
    expect(normalizeCurrencyCode('Euro (€)')).toBe('EUR');
    expect(normalizeCurrencyCode('Dollar ($)')).toBe('USD');
    expect(normalizeCurrencyCode('Livre Sterling (£)')).toBe('GBP');
  });

  it('keeps valid ISO codes', () => {
    expect(normalizeCurrencyCode('XOF')).toBe('XOF');
    expect(normalizeCurrencyCode('eur')).toBe('EUR');
  });
});
