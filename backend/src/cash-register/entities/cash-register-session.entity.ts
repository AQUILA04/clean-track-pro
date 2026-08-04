import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { SessionStatus } from '../enums/session-status.enum';

@Entity('cash_register_sessions')
export class CashRegisterSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenant_id: string;

    @Column()
    site_id: string;

    @Column()
    operator_id: string;

    @CreateDateColumn()
    opened_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date | null;

    @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.OPEN })
    status: SessionStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    opening_balance: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    expected_cash: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    declared_cash: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discrepancy: number | null;

    @Column({ type: 'varchar', nullable: true })
    closed_by: string | null;

    @Column({ type: 'text', nullable: true })
    notes: string | null;
}
