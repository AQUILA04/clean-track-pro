import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../shared/database/base.entity';

@Entity('service_definitions')
@Index(['tenant_id', 'label'], { unique: true })
export class ServiceDefinition extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'varchar', length: 100 })
    label: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
}
