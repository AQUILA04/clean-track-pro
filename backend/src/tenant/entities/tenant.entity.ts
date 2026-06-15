import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.5 })
  express_multiplier: number;

  @Column({ type: 'int', default: 24 })
  express_sla_hours: number;

  @Column({ type: 'boolean', default: true })
  express_enabled: boolean;

  @Column({ default: 'Euro (€)' })
  currency: string;

  @Column({ default: 'Kilogrammes (kg)' })
  weight_unit: string;

  @Column({ type: 'jsonb', default: { showTTC: true, allowDiscounts: true, showInventory: false } })
  express_visibility: {
    showTTC: boolean;
    allowDiscounts: boolean;
    showInventory: boolean;
  };

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<Tenant>) {
    Object.assign(this, partial);
  }
}
