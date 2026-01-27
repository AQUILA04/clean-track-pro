import { Injectable, ConflictException, InternalServerErrorException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { ClsService } from 'nestjs-cls';
import { customAlphabet } from 'nanoid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

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

    async create(createClientDto: CreateClientDto): Promise<Client> {
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
        });

        return await this.clientRepository.save(client);
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
