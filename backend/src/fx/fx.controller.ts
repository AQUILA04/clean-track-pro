import { Controller, Get, Query, Req } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import type { Request } from 'express';
import { FxService } from './fx.service';
import { Response } from '../shared/response/response.builder';
import { HttpStatus } from '@nestjs/common';
import { suggestCurrencyForCountry } from './fx.constants';

@Controller('fx')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('rates')
  @Public()
  async rates() {
    const rates = await this.fxService.getRatesPerEur();
    return Response.builder().status(HttpStatus.OK).data({ base: 'EUR', rates }).build();
  }

  @Get('convert')
  @Public()
  async convert(
    @Query('amount') amountRaw: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || !from || !to) {
      return Response.builder()
        .status(HttpStatus.BAD_REQUEST)
        .message('amount, from and to are required')
        .build();
    }
    const converted = await this.fxService.convert(amount, from, to);
    return Response.builder()
      .status(HttpStatus.OK)
      .data({
        amount,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        converted,
        indicative: true,
      })
      .build();
  }

  /** Suggest display currency from client IP (geo). */
  @Get('suggest-currency')
  @Public()
  async suggestCurrency(@Req() req: Request) {
    const ip = extractClientIp(req);
    let country: string | null = null;
    let apiCurrency: string | null = null;

    try {
      const lookupIp = normalizeLookupIp(ip);
      const url = lookupIp
        ? `https://ipapi.co/${lookupIp}/json/`
        : 'https://ipapi.co/json/';
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CleanTrackPro/1.0' },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          country_code?: string;
          currency?: string;
          error?: boolean;
        };
        if (!data.error) {
          country = data.country_code?.toUpperCase() ?? null;
          apiCurrency = data.currency?.toUpperCase() ?? null;
        }
      }
    } catch {
      // fall through to default
    }

    const mapped = suggestCurrencyForCountry(country);
    const currency = mapped ?? apiCurrency ?? 'XOF';
    return Response.builder()
      .status(HttpStatus.OK)
      .data({
        currency,
        country,
        source: mapped || apiCurrency ? 'geo' : 'default',
      })
      .build();
  }
}

function normalizeLookupIp(ip: string): string {
  if (!ip) return '';
  // IPv6-mapped IPv4 (::ffff:x.x.x.x)
  const mapped = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (mapped === '127.0.0.1' || mapped === '::1' || mapped === 'localhost') {
    return '';
  }
  // Private LAN — let ipapi use server egress (dev) or fail → client timezone fallback
  if (
    mapped.startsWith('10.') ||
    mapped.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(mapped)
  ) {
    return '';
  }
  return mapped;
}

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}
