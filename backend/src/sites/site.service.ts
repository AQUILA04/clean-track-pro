import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { RlsService } from '../shared/database/rls/rls.service';

@Injectable()
export class SiteService {
    constructor(
        @InjectRepository(Site)
        private siteRepository: Repository<Site>,
        private readonly rls: RlsService,
    ) { }

    async create(tenantId: string, createSiteDto: CreateSiteDto): Promise<Site> {
        return this.rls.wrapTransaction(async (manager) => {
            const newSite = manager.create(Site, {
                ...createSiteDto,
                tenant_id: tenantId,
            });
            return manager.save(Site, newSite);
        });
    }

    async findAll(tenantId: string, search?: string): Promise<Site[]> {
        return this.rls.wrapTransaction(async (manager) => {
            const queryBuilder = manager.createQueryBuilder(Site, 'site')
                .where('site.tenant_id = :tenantId', { tenantId });

            if (search) {
                queryBuilder.andWhere(
                    '(site.name ILIKE :search OR site.city ILIKE :search OR site.location ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            return queryBuilder.getMany();
        });
    }

    async findOne(id: string, tenantId: string): Promise<Site> {
        return this.rls.wrapTransaction(async (manager) => {
            const site = await manager.findOne(Site, { where: { id, tenant_id: tenantId } });
            if (!site) {
                throw new NotFoundException(`Site with ID ${id} not found`);
            }
            return site;
        });
    }

    async update(id: string, tenantId: string, updateData: Partial<Site>): Promise<Site> {
        return this.rls.wrapTransaction(async (manager) => {
            const site = await manager.findOne(Site, { where: { id, tenant_id: tenantId } });
            if (!site) {
                throw new NotFoundException(`Site with ID ${id} not found`);
            }

            // Apply updates
            Object.assign(site, updateData);

            return manager.save(Site, site);
        });
    }

    async validate(tenantId: string, siteId: string): Promise<boolean> {
        return this.rls.wrapTransaction(async (manager) => {
            const count = await manager.count(Site, { where: { id: siteId, tenant_id: tenantId } });
            return count > 0;
        });
    }
}
