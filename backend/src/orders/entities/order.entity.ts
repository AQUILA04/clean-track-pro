import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';

import { OrderStatus } from '../enums/order-status.enum';

export enum ServiceLevel {
    NORMAL = 'NORMAL',
    EXPRESS = 'EXPRESS'
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

    @Column({ type: 'timestamp' })
    due_date: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany('OrderStorage', (storage: any) => storage.order)
    storage_assignments: any[];
}

