import { Entity, Column, PrimaryColumn } from 'typeorm';
import { UsagePeriod } from '../enums/usage-period.enum';

@Entity('tenant_usage_periods')
export class TenantUsagePeriod {
    @PrimaryColumn('uuid')
    tenant_id: string;

    @PrimaryColumn({ type: 'varchar', length: 128 })
    operation_key: string;

    @PrimaryColumn({ type: 'varchar', length: 10 })
    period_type: UsagePeriod;

    @PrimaryColumn({ type: 'varchar', length: 16 })
    period_key: string;

    @Column({ type: 'timestamptz' })
    period_start: Date;

    @Column({ type: 'timestamptz' })
    period_end: Date;

    @Column({ type: 'bigint', default: 0 })
    count: string;
}
