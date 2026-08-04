import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Entity('notification_logs')
export class NotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenant_id: string;

    @Column({ type: 'uuid', nullable: true })
    order_id: string | null;

    @Column({ type: 'enum', enum: NotificationChannel, enumName: 'notification_channel_enum' })
    channel: NotificationChannel;

    @Column({ type: 'varchar', length: 80 })
    template_key: string;

    @Column({ type: 'varchar', length: 255 })
    recipient: string;

    @Column({ type: 'enum', enum: NotificationStatus, enumName: 'notification_status_enum' })
    status: NotificationStatus;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    unit_cost: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    provider_ref: string | null;

    @Column({ type: 'text', nullable: true })
    error: string | null;

    @CreateDateColumn()
    created_at: Date;
}
