import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locality } from './entities/locality.entity';
import { CreateLocalityDto, UpdateLocalityDto } from './dto/locality.dto';
import { Site } from '../sites/entities/site.entity';

@Injectable()
export class LocalitiesService {
    constructor(
        @InjectRepository(Locality)
        private readonly localityRepository: Repository<Locality>,
        @InjectRepository(Site)
        private readonly siteRepository: Repository<Site>,
    ) {}

    async create(tenantId: string, dto: CreateLocalityDto): Promise<Locality> {
        const site = await this.siteRepository.findOne({
            where: { id: dto.site_id, tenant_id: tenantId },
        });
        if (!site) {
            throw new BadRequestException('Site not found for this tenant');
        }

        const locality = this.localityRepository.create({
            tenant_id: tenantId,
            site_id: dto.site_id,
            name: dto.name.trim(),
            is_active: dto.is_active ?? true,
        });
        return this.localityRepository.save(locality);
    }

    async findAll(
        tenantId: string,
        siteId?: string,
        activeOnly = false,
    ): Promise<Locality[]> {
        const where: Record<string, unknown> = { tenant_id: tenantId };
        if (siteId) where.site_id = siteId;
        if (activeOnly) where.is_active = true;

        return this.localityRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<Locality> {
        const locality = await this.localityRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!locality) {
            throw new NotFoundException('Locality not found');
        }
        return locality;
    }

    async update(
        id: string,
        tenantId: string,
        dto: UpdateLocalityDto,
    ): Promise<Locality> {
        const locality = await this.findOne(id, tenantId);
        if (dto.name !== undefined) locality.name = dto.name.trim();
        if (dto.is_active !== undefined) locality.is_active = dto.is_active;
        return this.localityRepository.save(locality);
    }

    async deactivate(id: string, tenantId: string): Promise<Locality> {
        return this.update(id, tenantId, { is_active: false });
    }
}
