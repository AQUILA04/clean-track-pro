import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/database/base.entity';
import { ArticleType } from './article-type.entity';
import { ServiceDefinition } from './service-definition.entity';

@Entity('service_prices')
@Unique(['tenant_id', 'article_type_id', 'service_definition_id'])
export class ServicePrice extends BaseEntity {
    @Column({ type: 'uuid' })
    tenant_id: string;

    @Column({ type: 'uuid' })
    article_type_id: string;

    @Column({ type: 'uuid' })
    service_definition_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ManyToOne(() => ArticleType, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'article_type_id' })
    article_type: ArticleType;

    @ManyToOne(() => ServiceDefinition, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'service_definition_id' })
    service_definition: ServiceDefinition;
}
