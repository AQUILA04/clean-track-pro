import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('expense_types')
export class ExpenseType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    tenant_id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ default: true })
    is_active: boolean;

    /** Built-in categories seeded per tenant (Loyer, Fournitures, Salaires, Autres). */
    @Column({ default: false })
    is_system: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
