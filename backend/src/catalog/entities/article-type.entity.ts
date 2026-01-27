import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../shared/database/base.entity';

@Entity('article_types')
@Index(['tenant_id', 'label'], { unique: true })
export class ArticleType extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'varchar', length: 100 })
    label: string;

    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;
}
