import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { ClsService } from 'nestjs-cls';
import { customAlphabet } from 'nanoid';

@Injectable()
export class ClientService {
    private generateCode: () => string;

    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly cls: ClsService,
    ) {
        // Custom alphabet as per requirements: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ
        this.generateCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);
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
