import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';

export enum StorageSlotStatus {
    FREE = 'FREE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
}

export enum SlotType {
    RECEPTION = 'RECEPTION',
    DELIVERY = 'DELIVERY',
}

@Entity('storage_slots')
@Unique(['name', 'site_id', 'tenant_id'])
export class StorageSlot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: StorageSlotStatus,
        default: StorageSlotStatus.FREE,
    })
    status: StorageSlotStatus;

    @Column({
        type: 'enum',
        enum: SlotType,
        default: SlotType.RECEPTION,
        name: 'slot_type',
    })
    slot_type: SlotType;

    @Column({ name: 'site_id' })
    site_id: string;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @OneToMany('OrderStorage', (storage: any) => storage.shelf_slot)
    stored_orders: any[];
}
