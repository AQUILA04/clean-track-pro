import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ExpenseType } from './expense-type.entity';

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    tenant_id: string;

    @Index()
    @Column()
    site_id: string;

    @Column({ type: 'uuid' })
    expense_type_id: string;

    @ManyToOne(() => ExpenseType, { eager: true })
    @JoinColumn({ name: 'expense_type_id' })
    expense_type: ExpenseType;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'date' })
    expense_date: string;

    @Column({ type: 'varchar', nullable: true })
    receipt_url: string | null;

    @Column()
    created_by: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
