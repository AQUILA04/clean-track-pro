import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<Tenant>) {
    Object.assign(this, partial);
  }
}
