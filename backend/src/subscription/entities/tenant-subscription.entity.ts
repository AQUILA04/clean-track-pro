import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionStatus } from '../enums/usage-period.enum';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('tenant_subscriptions')
export class TenantSubscription {
    @PrimaryColumn('uuid')
    tenant_id: string;

    @Column('uuid')
    plan_id: string;

    @ManyToOne(() => SubscriptionPlan)
    @JoinColumn({ name: 'plan_id' })
    plan: SubscriptionPlan;

    @Column({ type: 'varchar', length: 20, default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    @Column({ type: 'timestamptz', nullable: true })
    trial_ends_at: Date | null;

    @Column({ type: 'timestamptz' })
    current_period_start: Date;

    @Column({ type: 'timestamptz' })
    current_period_end: Date;

    @Column({ type: 'timestamptz', nullable: true })
    grace_period_ends_at: Date | null;

    @Column({ type: 'jsonb', default: {} })
    custom_limits: Record<string, unknown>;

    @Column({ type: 'varchar', length: 255, nullable: true })
    external_billing_id: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
