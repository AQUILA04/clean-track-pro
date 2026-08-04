import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RemittanceStatus } from '../enums/remittance-status.enum';
import { CashRegisterSession } from '../../cash-register/entities/cash-register-session.entity';

@Entity('cash_remittances')
export class CashRemittance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenant_id: string;

    @Column()
    site_id: string;

    @Column()
    session_id: string;

    @ManyToOne(() => CashRegisterSession)
    @JoinColumn({ name: 'session_id' })
    session: CashRegisterSession;

    @Column()
    operator_id: string;

    @Column({ type: 'varchar', nullable: true })
    manager_id: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: RemittanceStatus, default: RemittanceStatus.PENDING })
    status: RemittanceStatus;

    @Column({ type: 'timestamp', nullable: true })
    acknowledged_at: Date | null;

    @Column({ type: 'text', nullable: true })
    manager_notes: string | null;

    @Column({ type: 'uuid', nullable: true })
    site_remittance_id: string | null;

    @CreateDateColumn()
    created_at: Date;
}
