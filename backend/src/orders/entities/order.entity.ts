import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OrderStatus {
    CREATED = 'CREATED',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

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
}
