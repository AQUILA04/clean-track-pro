import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailSendResult {
    ok: boolean;
    providerRef?: string;
    error?: string;
}

@Injectable()
export class EmailProvider {
    private readonly logger = new Logger(EmailProvider.name);

    constructor(private readonly config: ConfigService) {}

    async send(to: string, subject: string, body: string): Promise<EmailSendResult> {
        const host = this.config.get<string>('MAIL_HOST') || this.config.get<string>('SMTP_HOST');
        if (!host) {
            this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject} | ${body}`);
            return { ok: true, providerRef: 'dev-log' };
        }

        try {
            const port = parseInt(
                this.config.get<string>('MAIL_PORT') ||
                    this.config.get<string>('SMTP_PORT') ||
                    '1025',
                10,
            );
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth:
                    this.config.get('MAIL_USER') || this.config.get('SMTP_USER')
                        ? {
                              user: this.config.get('MAIL_USER') || this.config.get('SMTP_USER'),
                              pass: this.config.get('MAIL_PASS') || this.config.get('SMTP_PASS'),
                          }
                        : undefined,
            });

            const from =
                this.config.get<string>('MAIL_FROM') ||
                this.config.get<string>('SMTP_FROM') ||
                'noreply@cleantrack.local';

            const info = await transporter.sendMail({
                from,
                to,
                subject,
                text: body,
            });
            return { ok: true, providerRef: info.messageId };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Email send failed: ${message}`);
            return { ok: false, error: message };
        }
    }
}
