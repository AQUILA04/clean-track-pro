import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';

@Injectable()
export class SiteService {
    constructor(
        @InjectRepository(Site)
        private siteRepository: Repository<Site>,
    ) { }

    async findAll(tenantId: string): Promise<Site[]> {
        return this.siteRepository.find({ where: { tenant_id: tenantId } });
    }

    async findOne(id: string, tenantId: string): Promise<Site> {
        const site = await this.siteRepository.findOne({ where: { id, tenant_id: tenantId } });
        if (!site) {
            throw new NotFoundException(`Site with ID ${id} not found`);
        }
        return site;
    }

    async validate(tenantId: string, siteId: string): Promise<boolean> {
        const count = await this.siteRepository.count({ where: { id: siteId, tenant_id: tenantId } });
        return count > 0;
    }
}
