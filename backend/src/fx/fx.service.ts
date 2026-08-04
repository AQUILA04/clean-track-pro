import { Injectable, Logger } from '@nestjs/common';
import {
  CFA_PER_EUR,
  STATIC_RATES_PER_EUR,
  convertAmount,
  suggestCurrencyForCountry,
} from './fx.constants';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private cachedRates: Record<string, number> | null = null;
  private cachedAt = 0;
  private readonly cacheTtlMs = 6 * 60 * 60 * 1000; // 6h

  async getRatesPerEur(): Promise<Record<string, number>> {
    const now = Date.now();
    if (this.cachedRates && now - this.cachedAt < this.cacheTtlMs) {
      return this.cachedRates;
    }

    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=EUR');
      if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
      const data = (await res.json()) as { rates?: Record<string, number> };
      const rates: Record<string, number> = {
        ...STATIC_RATES_PER_EUR,
        ...(data.rates ?? {}),
        EUR: 1,
        XOF: CFA_PER_EUR,
        XAF: CFA_PER_EUR,
        // Preserve static rates for currencies Frankfurter does not cover
        MUR: data.rates?.MUR ?? STATIC_RATES_PER_EUR.MUR,
        SCR: data.rates?.SCR ?? STATIC_RATES_PER_EUR.SCR,
        MGA: data.rates?.MGA ?? STATIC_RATES_PER_EUR.MGA,
      };
      this.cachedRates = rates;
      this.cachedAt = now;
      return rates;
    } catch (err) {
      this.logger.warn(`FX fetch failed, using static rates: ${err}`);
      return { ...STATIC_RATES_PER_EUR };
    }
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    const rates = await this.getRatesPerEur();
    return convertAmount(amount, from, to, rates);
  }

  suggestCurrency(countryCode?: string | null): string {
    return suggestCurrencyForCountry(countryCode) ?? 'XOF';
  }
}
