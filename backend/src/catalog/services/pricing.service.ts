import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicePrice } from '../entities/service-price.entity';
import { UpsertServicePriceDto } from '../dto/upsert-service-price.dto';

@Injectable()
export class PricingService {
    constructor(
        @InjectRepository(ServicePrice)
        private readonly servicePriceRepository: Repository<ServicePrice>,
    ) { }

    async upsert(tenantId: string, upsertDto: UpsertServicePriceDto): Promise<ServicePrice> {
        let price = await this.servicePriceRepository.findOne({
            where: {
                tenant_id: tenantId,
                article_type_id: upsertDto.article_type_id,
                service_definition_id: upsertDto.service_definition_id,
            },
        });

        if (price) {
            price.price = upsertDto.price;
        } else {
            price = this.servicePriceRepository.create({
                tenant_id: tenantId,
                ...upsertDto,
            });
        }

        return this.servicePriceRepository.save(price);
    }

    async findAll(tenantId: string): Promise<ServicePrice[]> {
        return this.servicePriceRepository.find({
            where: { tenant_id: tenantId },
            relations: ['article_type', 'service_definition'],
        });
    }

    async findByArticleType(tenantId: string, articleTypeId: string): Promise<ServicePrice[]> {
        return this.servicePriceRepository.find({
            where: { tenant_id: tenantId, article_type_id: articleTypeId },
            relations: ['service_definition'],
        });
    }

    async getPrice(tenantId: string, articleTypeId: string, serviceDefinitionId: string): Promise<number> {
        const priceDef = await this.servicePriceRepository.findOne({
            where: {
                tenant_id: tenantId,
                article_type_id: articleTypeId,
                service_definition_id: serviceDefinitionId
            }
        });

        if (!priceDef) {
            throw new NotFoundException(`Price not defined for article ${articleTypeId} and service ${serviceDefinitionId}`);
        }

        return Number(priceDef.price);
    }
}
