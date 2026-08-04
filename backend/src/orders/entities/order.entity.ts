import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';

import { OrderStatus } from '../enums/order-status.enum';
import { DeliveryMode } from '../enums/delivery-mode.enum';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';

export enum ServiceLevel {
    NORMAL = 'NORMAL',
    EXPRESS = 'EXPRESS'
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Human-readable reference, e.g. REF-01-2507-000136 */
    @Column({ type: 'varchar', length: 32, nullable: true })
    reference: string | null;

    @Column()
    tenant_id: string;

    @Column()
    site_id: string;

    @Column()
    client_id: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.CREATED
    })
    status: OrderStatus;

    @Column({
        type: 'enum',
        enum: ServiceLevel,
        default: ServiceLevel.NORMAL
    })
    service_level: ServiceLevel;

    @Column({
        type: 'enum',
        enum: DeliveryMode,
        enumName: 'delivery_mode_enum',
        default: DeliveryMode.PICKUP,
    })
    delivery_mode: DeliveryMode;

    @Column({ type: 'varchar', length: 500, nullable: true })
    delivery_address: string | null;

    @Column({ type: 'varchar', length: 32, nullable: true })
    delivery_phone: string | null;

    @Column({ type: 'uuid', nullable: true })
    locality_id: string | null;

    @Column({ type: 'timestamp' })
    due_date: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amount_paid: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.UNPAID,
    })
    payment_status: PaymentStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany('OrderStorage', (storage: any) => storage.order)
    storage_assignments: any[];
}

