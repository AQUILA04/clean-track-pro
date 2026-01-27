import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    tenant_id: string;

    // GIN indexes with pg_trgm extension are managed via migration (EnablePgTrgmAndGinIndexes1769350800000)
    // These support efficient ILIKE '%substring%' queries for the search endpoint
    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Index() // Unique per tenant enforced by DB unique index (tenant_id, unique_code)
    @Column({ length: 8 })
    unique_code: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    constructor(partial: Partial<Client>) {
        Object.assign(this, partial);
    }
}
