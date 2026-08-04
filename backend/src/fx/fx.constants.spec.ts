import { convertAmount, suggestCurrencyForCountry, CFA_PER_EUR } from './fx.constants';

describe('Fx constants', () => {
  it('suggests XOF for Côte d\'Ivoire', () => {
    expect(suggestCurrencyForCountry('CI')).toBe('XOF');
  });

  it('suggests MUR for Mauritius', () => {
    expect(suggestCurrencyForCountry('MU')).toBe('MUR');
  });

  it('returns null for unknown countries (no silent XOF fallback)', () => {
    expect(suggestCurrencyForCountry('ZZ')).toBeNull();
    expect(suggestCurrencyForCountry(null)).toBeNull();
  });

  it('converts EUR to XOF with fixed peg', () => {
    expect(convertAmount(1, 'EUR', 'XOF')).toBeCloseTo(CFA_PER_EUR, 3);
    expect(convertAmount(49, 'EUR', 'XOF')).toBeCloseTo(49 * CFA_PER_EUR, 1);
  });

  it('converts EUR to MUR', () => {
    expect(convertAmount(1, 'EUR', 'MUR')).toBeCloseTo(50.5, 1);
  });

  it('converts USD to XOF via EUR pivot', () => {
    const amount = convertAmount(49, 'USD', 'XOF');
    expect(amount).toBeGreaterThan(10000);
  });
});
