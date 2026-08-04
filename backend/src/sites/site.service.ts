import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Site } from './entities/site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { RlsService } from '../shared/database/rls/rls.service';
import { OperationKey } from '../subscription/enums/operation-key.enum';
import { QuotaService } from '../subscription/services/quota.service';

@Injectable()
export class SiteService {
    constructor(
        @InjectRepository(Site)
        private siteRepository: Repository<Site>,
        private readonly rls: RlsService,
        private readonly dataSource: DataSource,
        private readonly quotaService: QuotaService,
    ) { }

    /**
     * Creates a site during tenant bootstrap, before tenant context exists in CLS.
     * Sets RLS tenant context explicitly for the new tenant.
     */
    async createForTenantBootstrap(tenantId: string, createSiteDto: CreateSiteDto): Promise<Site> {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new BadRequestException('Invalid tenant ID');
        }

        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SET LOCAL "app.current_tenant" = '${tenantId}'`);
            const nextCode = await this.nextSiteCode(manager, tenantId);
            const newSite = manager.create(Site, {
                ...createSiteDto,
                tenant_id: tenantId,
                code: nextCode,
                status: createSiteDto.status ?? 'ACTIVE',
            });
            return manager.save(Site, newSite);
        });
    }

    async create(tenantId: string, createSiteDto: CreateSiteDto): Promise<Site> {
        await this.quotaService.assertWithinQuota(tenantId, OperationKey.SITES_CAPACITY);

        return this.rls.wrapTransaction(async (manager) => {
            const nextCode = await this.nextSiteCode(manager, tenantId);
            const newSite = manager.create(Site, {
                ...createSiteDto,
                tenant_id: tenantId,
                code: nextCode,
            });
            return manager.save(Site, newSite);
        });
    }

    private async nextSiteCode(manager: EntityManager, tenantId: string): Promise<number> {
        const raw = await manager
            .createQueryBuilder(Site, 'site')
            .select('COALESCE(MAX(site.code), 0)', 'max')
            .where('site.tenant_id = :tenantId', { tenantId })
            .getRawOne<{ max: string | number }>();
        const next = Number(raw?.max ?? 0) + 1;
        if (next > 99) {
            throw new BadRequestException('Limite de 99 agences par tenant atteinte (codes REF).');
        }
        return next;
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
