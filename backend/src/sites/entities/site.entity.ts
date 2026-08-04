import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('sites')
export class Site {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    tenant_id: string;

    /** Sequential agency code within a tenant (1–99), used in order references. */
    @Column({ type: 'smallint' })
    code: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    postal_code: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({
        type: 'enum',
        enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
        default: 'ACTIVE'
    })
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

    @Column({ nullable: true })
    logoUrl: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
