import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SignupRequestStatus } from '../enums/signup-request-status.enum';
import { SubscriptionPlan } from '../../subscription/entities/subscription-plan.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('tenant_signup_requests')
export class TenantSignupRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 120 })
    organization_name: string;

    @Column({ length: 120 })
    agency_name: string;

    @Column({ length: 63 })
    subdomain: string;

    @Column({ length: 255 })
    admin_email: string;

    @Column({ length: 80 })
    admin_first_name: string;

    @Column({ length: 80 })
    admin_last_name: string;

    @Column('uuid')
    plan_id: string;

    @ManyToOne(() => SubscriptionPlan)
    @JoinColumn({ name: 'plan_id' })
    plan: SubscriptionPlan;

    @Column({ type: 'varchar', length: 30, default: SignupRequestStatus.PENDING })
    status: SignupRequestStatus;

    @Column({ type: 'varchar', length: 255, nullable: true })
    payment_reference: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    payment_completed_at: Date | null;

    @Column({ type: 'uuid', nullable: true })
    tenant_id: string | null;

    @ManyToOne(() => Tenant, { nullable: true })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    reviewed_by: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    reviewed_at: Date | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    rejection_reason: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
