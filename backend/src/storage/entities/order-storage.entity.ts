import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { StorageSlot } from './storage-slot.entity';

@Entity('order_storage')
export class OrderStorage {
    @PrimaryColumn('uuid')
    order_id: string;

    @PrimaryColumn('uuid')
    shelf_slot_id: string;

    @Column({ name: 'tenant_id', nullable: false })
    tenant_id: string;

    @CreateDateColumn({ type: 'timestamptz' })
    stored_at: Date;

    @ManyToOne(() => Order, (order) => order.storage_assignments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => StorageSlot, (slot) => slot.stored_orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shelf_slot_id' })
    shelf_slot: StorageSlot;
}
