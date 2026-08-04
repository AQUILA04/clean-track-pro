import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Client } from './entities/client.entity';
import { Site } from '../sites/entities/site.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClsService } from 'nestjs-cls';
import { customAlphabet } from 'nanoid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export type ClientWithSiteName = Client & { site_name: string | null };

@Injectable()
export class ClientService {
    private generateCode: () => string;

    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly cls: ClsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        // Custom alphabet as per requirements: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ
        this.generateCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);
    }

    async search(query: string): Promise<Client[]> {
        const tenantId = this.cls.get('tenantId');
        if (!tenantId) throw new InternalServerErrorException('Tenant context missing');

        const cacheKey = `tenant_${tenantId}_search_${query}`;
        const cached = await this.cacheManager.get<Client[]>(cacheKey);
        if (cached) return cached;

        const results = await this.clientRepository.createQueryBuilder('client')
            .where('client.tenant_id = :tenantId', { tenantId })
            .andWhere(new Brackets(qb => {
                qb.where('client.first_name ILIKE :query', { query: `%${query}%` })
                    .orWhere('client.last_name ILIKE :query', { query: `%${query}%` })
                    .orWhere('client.phone ILIKE :query', { query: `%${query}%` })
                    .orWhere('client.unique_code = :exactQuery', { exactQuery: query });
            }))
            .getMany();

        await this.cacheManager.set(cacheKey, results, 300000); // 5 minutes (ms)
        return results;
    }

    async findAll(
        page: number = 1,
        limit: number = 50,
        q?: string,
    ): Promise<{ data: ClientWithSiteName[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const tenantId = this.cls.get('tenantId');
        if (!tenantId) throw new InternalServerErrorException('Tenant context missing');

        const skip = (page - 1) * limit;
        const qb = this.clientRepository
            .createQueryBuilder('client')
            .leftJoin(Site, 'site', 'site.id::text = client.site_id::text')
            .addSelect('site.name', 'site_name')
            .where('client.tenant_id = :tenantId', { tenantId });

        if (q && q.trim().length >= 2) {
            const query = q.trim();
            qb.andWhere(new Brackets(inner => {
                inner.where('client.first_name ILIKE :query', { query: `%${query}%` })
                    .orWhere('client.last_name ILIKE :query', { query: `%${query}%` })
                    .orWhere('client.phone ILIKE :query', { query: `%${query}%` })
                    .orWhere('client.unique_code = :exactQuery', { exactQuery: query });
            }));
        }

        const total = await qb.clone().getCount();
        const { entities, raw } = await qb
            .orderBy('client.created_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getRawAndEntities();

        const data: ClientWithSiteName[] = entities.map((client, index) => {
            const rawRow = raw[index] || {};
            const siteName =
                (rawRow.site_name as string | null | undefined) ??
                (rawRow.site_site_name as string | null | undefined) ??
                null;
            return Object.assign(client, { site_name: siteName });
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async findOne(id: string): Promise<ClientWithSiteName> {
        const tenantId = this.cls.get('tenantId');
        if (!tenantId) throw new InternalServerErrorException('Tenant context missing');

        const qb = this.clientRepository
            .createQueryBuilder('client')
            .leftJoin(Site, 'site', 'site.id::text = client.site_id::text')
            .addSelect('site.name', 'site_name')
            .where('client.id = :id', { id })
            .andWhere('client.tenant_id = :tenantId', { tenantId });

        const { entities, raw } = await qb.getRawAndEntities();
        const client = entities[0];
        if (!client) {
            throw new NotFoundException(`Client ${id} not found`);
        }

        return Object.assign(client, {
            site_name:
                (raw[0]?.site_name as string | null | undefined) ??
                (raw[0]?.site_site_name as string | null | undefined) ??
                null,
        });
    }

    async create(createClientDto: CreateClientDto, siteId?: string | null): Promise<Client> {
        const tenantId = this.cls.get('tenantId');
        if (!tenantId) {
            throw new InternalServerErrorException('Tenant context missing');
        }

        // generated guaranteed unique code
        const uniqueCode = await this.generateUniqueCode(tenantId);

        const client = this.clientRepository.create({
            ...createClientDto,
            tenant_id: tenantId,
            unique_code: uniqueCode,
            site_id: siteId ?? null,
        });

        const saved = await this.clientRepository.save(client);
        await this.cacheManager.clear();
        return saved;
    }

    async update(id: string, updateClientDto: UpdateClientDto): Promise<ClientWithSiteName> {
        const tenantId = this.cls.get('tenantId');
        if (!tenantId) throw new InternalServerErrorException('Tenant context missing');

        const client = await this.clientRepository.findOne({ where: { id, tenant_id: tenantId } });
        if (!client) {
            throw new NotFoundException(`Client ${id} not found`);
        }

        // site_id is immutable (creation provenance) — never apply from DTO
        Object.assign(client, {
            ...(updateClientDto.first_name !== undefined && { first_name: updateClientDto.first_name }),
            ...(updateClientDto.last_name !== undefined && { last_name: updateClientDto.last_name }),
            ...(updateClientDto.phone !== undefined && { phone: updateClientDto.phone }),
            ...(updateClientDto.email !== undefined && { email: updateClientDto.email }),
            ...(updateClientDto.notes !== undefined && { notes: updateClientDto.notes }),
        });

        await this.clientRepository.save(client);
        await this.cacheManager.clear();
        return this.findOne(id);
    }

    private async generateUniqueCode(tenantId: string): Promise<string> {
        const maxRetries = 5;
        let attempt = 0;

        while (attempt < maxRetries) {
            const code = this.generateCode();
            const existing = await this.clientRepository.findOne({
                where: { unique_code: code, tenant_id: tenantId },
            });

            if (!existing) {
                return code;
            }
            attempt++;
        }

        throw new ConflictException('Failed to generate unique code after multiple attempts');
    }
}
