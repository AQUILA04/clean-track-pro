import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { RemittanceStatus } from '../enums/remittance-status.enum';

@Entity('site_remittances')
export class SiteRemittance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenant_id: string;

    @Column()
    site_id: string;

    @Column()
    submitted_by: string;

    @Column({ type: 'varchar', nullable: true })
    received_by: string | null;

    @Column({ type: 'date' })
    period_start: Date;

    @Column({ type: 'date' })
    period_end: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_amount: number;

    @Column({ type: 'enum', enum: RemittanceStatus, default: RemittanceStatus.PENDING })
    status: RemittanceStatus;

    @Column({ type: 'timestamp', nullable: true })
    acknowledged_at: Date | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @CreateDateColumn()
    created_at: Date;
}
