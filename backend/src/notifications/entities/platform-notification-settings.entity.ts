import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('platform_notification_settings')
export class PlatformNotificationSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
    sms_unit_price: number | null;

    @Column({ type: 'varchar', length: 32, default: 'EUR' })
    currency: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    updated_by: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
