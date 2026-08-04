import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BillingInterval } from '../enums/usage-period.enum';

@Entity('subscription_plans')
export class SubscriptionPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    /** ISO billing currency for Stripe charge: EUR or USD. */
    @Column({ type: 'varchar', length: 3, default: 'EUR' })
    currency: string;

    @Column({ type: 'varchar', length: 10, default: BillingInterval.MONTHLY })
    billing_interval: BillingInterval;

    @Column({ type: 'boolean', default: true })
    is_public: boolean;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'boolean', default: false })
    is_free: boolean;

    @Column({ type: 'boolean', default: false })
    auto_approve_signups: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    stripe_price_id: string | null;

    @Column({ type: 'jsonb', default: {} })
    limits: Record<string, unknown>;

    @Column({ type: 'jsonb', default: {} })
    features: Record<string, boolean>;

    @CreateDateColumn()
    created_at: Date;
}
