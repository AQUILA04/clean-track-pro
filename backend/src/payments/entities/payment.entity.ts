import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentPhase } from '../enums/payment-phase.enum';
import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenant_id: string;

    @Column()
    order_id: string;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: PaymentMethod })
    payment_method: PaymentMethod;

    @Column({ type: 'enum', enum: PaymentPhase })
    payment_phase: PaymentPhase;

    @Column()
    collected_by: string;

    @Column()
    site_id: string;

    @Column({ nullable: true })
    session_id: string;

    @Column({ nullable: true })
    reference: string;

    @Column({ nullable: true })
    notes: string;

    @CreateDateColumn()
    created_at: Date;
}
