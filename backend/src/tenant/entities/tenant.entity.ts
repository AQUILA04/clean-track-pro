import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  /** Public URL of the tenant logo (white-label). */
  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  /** Optional favicon URL for the tenant workspace. */
  @Column({ type: 'varchar', nullable: true })
  faviconUrl: string | null;

  /** Headquarters / billing address shown on receipts and invoices. */
  @Column({ type: 'text', nullable: true })
  address: string | null;

  /** National business registry ID (e.g. SIRET, RCCM). */
  @Column({ type: 'varchar', nullable: true })
  legal_id: string | null;

  /** VAT / tax identifier. */
  @Column({ type: 'varchar', nullable: true })
  vat_number: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ default: 'Europe/Paris' })
  timezone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.5 })
  express_multiplier: number;

  @Column({ type: 'int', default: 24 })
  express_sla_hours: number;

  @Column({ type: 'boolean', default: true })
  express_enabled: boolean;

  /** ISO 4217 currency code (e.g. XOF, EUR, USD). Default: XOF (FCFA). */
  @Column({ default: 'XOF' })
  currency: string;

  @Column({ default: 'Kilogrammes (kg)' })
  weight_unit: string;

  @Column({ type: 'jsonb', default: { showTTC: true, allowDiscounts: true, showInventory: false } })
  express_visibility: {
    showTTC: boolean;
    allowDiscounts: boolean;
    showInventory: boolean;
  };

  @Column({ type: 'boolean', default: true })
  notification_email_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  notification_sms_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<Tenant>) {
    Object.assign(this, partial);
  }
}
