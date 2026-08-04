import {
    BadRequestException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformNotificationSettings } from './entities/platform-notification-settings.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationChannel } from './enums/notification-channel.enum';
import { NotificationStatus } from './enums/notification-status.enum';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { NotifyPayload } from './types/notify-payload';
import { TenantService } from '../tenant/tenant.service';
import { UpdatePlatformNotificationSettingsDto } from './dto/update-platform-notification-settings.dto';
import { UpdateTenantNotificationPrefsDto } from './dto/update-tenant-notification-prefs.dto';
import { Tenant } from '../tenant/entities/tenant.entity';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @InjectRepository(PlatformNotificationSettings)
        private readonly settingsRepo: Repository<PlatformNotificationSettings>,
        @InjectRepository(NotificationLog)
        private readonly logRepo: Repository<NotificationLog>,
        private readonly emailProvider: EmailProvider,
        private readonly smsProvider: SmsProvider,
        private readonly tenantService: TenantService,
    ) {}

    async getPlatformSettings(): Promise<PlatformNotificationSettings> {
        let settings = await this.settingsRepo.find({
            order: { created_at: 'ASC' },
            take: 1,
        });
        if (!settings.length) {
            const created = this.settingsRepo.create({
                sms_unit_price: null,
                currency: 'EUR',
            });
            return this.settingsRepo.save(created);
        }
        return settings[0];
    }

    async updatePlatformSettings(
        dto: UpdatePlatformNotificationSettingsDto,
        updatedBy?: string,
    ): Promise<PlatformNotificationSettings> {
        const settings = await this.getPlatformSettings();
        if (dto.sms_unit_price !== undefined) {
            settings.sms_unit_price = dto.sms_unit_price;
        }
        if (dto.currency !== undefined) {
            settings.currency = dto.currency;
        }
        settings.updated_by = updatedBy ?? null;
        return this.settingsRepo.save(settings);
    }

    async getTenantNotificationConfig(tenantId: string) {
        const tenant = await this.tenantService.findOne(tenantId);
        const platform = await this.getPlatformSettings();
        return {
            notification_email_enabled: tenant.notification_email_enabled ?? true,
            notification_sms_enabled: tenant.notification_sms_enabled ?? false,
            sms_unit_price: platform.sms_unit_price,
            currency: platform.currency,
        };
    }

    async updateTenantNotificationPrefs(
        tenantId: string,
        dto: UpdateTenantNotificationPrefsDto,
    ): Promise<Tenant> {
        if (dto.notification_sms_enabled === true) {
            const platform = await this.getPlatformSettings();
            if (platform.sms_unit_price === null || platform.sms_unit_price === undefined) {
                throw new BadRequestException(
                    'SMS cannot be enabled: platform SMS unit price is not configured by Superadmin',
                );
            }
        }

        return this.tenantService.updateNotificationPrefs(tenantId, {
            notification_email_enabled: dto.notification_email_enabled,
            notification_sms_enabled: dto.notification_sms_enabled,
        });
    }

    async notify(tenantId: string, payload: NotifyPayload): Promise<void> {
        try {
            const tenant = await this.tenantService.findOne(tenantId);
            const platform = await this.getPlatformSettings();

            if (tenant.notification_email_enabled && payload.email) {
                await this.sendEmailChannel(tenantId, payload);
            }

            if (tenant.notification_sms_enabled && payload.phone) {
                if (platform.sms_unit_price === null || platform.sms_unit_price === undefined) {
                    await this.logRepo.save(
                        this.logRepo.create({
                            tenant_id: tenantId,
                            order_id: payload.orderId ?? null,
                            channel: NotificationChannel.SMS,
                            template_key: payload.templateKey,
                            recipient: payload.phone,
                            status: NotificationStatus.SKIPPED,
                            unit_cost: 0,
                            error: 'SMS unit price not configured',
                        }),
                    );
                } else {
                    await this.sendSmsChannel(
                        tenantId,
                        payload,
                        Number(platform.sms_unit_price),
                    );
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`notify failed for tenant ${tenantId}: ${message}`);
        }
    }

    private async sendEmailChannel(tenantId: string, payload: NotifyPayload) {
        const result = await this.emailProvider.send(
            payload.email!,
            payload.subject,
            payload.body,
        );
        await this.logRepo.save(
            this.logRepo.create({
                tenant_id: tenantId,
                order_id: payload.orderId ?? null,
                channel: NotificationChannel.EMAIL,
                template_key: payload.templateKey,
                recipient: payload.email!,
                status: result.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                unit_cost: 0,
                provider_ref: result.providerRef ?? null,
                error: result.error ?? null,
            }),
        );
    }

    private async sendSmsChannel(
        tenantId: string,
        payload: NotifyPayload,
        unitCost: number,
    ) {
        const smsBody = payload.smsBody || payload.body;
        const result = await this.smsProvider.send(payload.phone!, smsBody);
        await this.logRepo.save(
            this.logRepo.create({
                tenant_id: tenantId,
                order_id: payload.orderId ?? null,
                channel: NotificationChannel.SMS,
                template_key: payload.templateKey,
                recipient: payload.phone!,
                status: result.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
                unit_cost: unitCost,
                provider_ref: result.providerRef ?? null,
                error: result.error ?? null,
            }),
        );
    }

    async listLogs(tenantId: string, limit = 50): Promise<NotificationLog[]> {
        return this.logRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
            take: Math.min(limit, 200),
        });
    }
}
