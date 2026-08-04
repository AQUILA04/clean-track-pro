import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsSendResult {
    ok: boolean;
    providerRef?: string;
    error?: string;
}

@Injectable()
export class SmsProvider {
    private readonly logger = new Logger(SmsProvider.name);

    constructor(private readonly config: ConfigService) {}

    async send(to: string, body: string): Promise<SmsSendResult> {
        const accountSid = this.config.get<string>('SMS_TWILIO_ACCOUNT_SID');
        const authToken = this.config.get<string>('SMS_TWILIO_AUTH_TOKEN');
        const from = this.config.get<string>('SMS_TWILIO_FROM');

        if (!accountSid || !authToken || !from) {
            this.logger.log(`[DEV SMS] To: ${to} | ${body}`);
            return { ok: true, providerRef: 'dev-log' };
        }

        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const params = new URLSearchParams({ To: to, From: from, Body: body });
            const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            const data = (await res.json()) as { sid?: string; message?: string };
            if (!res.ok) {
                return { ok: false, error: data.message || `Twilio HTTP ${res.status}` };
            }
            return { ok: true, providerRef: data.sid };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`SMS send failed: ${message}`);
            return { ok: false, error: message };
        }
    }
}
