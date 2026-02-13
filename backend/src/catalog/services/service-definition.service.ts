import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ServiceDefinition } from '../entities/service-definition.entity';
import { CreateServiceDefinitionDto } from '../dto/create-service-definition.dto';
import { UpdateServiceDefinitionDto } from '../dto/update-service-definition.dto';

@Injectable()
export class ServiceDefinitionService {
    constructor(
        @InjectRepository(ServiceDefinition)
        private readonly serviceDefinitionRepository: Repository<ServiceDefinition>,
    ) { }

    async create(tenantId: string, createDto: CreateServiceDefinitionDto): Promise<ServiceDefinition> {
        const existing = await this.serviceDefinitionRepository.findOne({
            where: { tenant_id: tenantId, label: createDto.label },
        });

        if (existing) {
            throw new ConflictException('Service with this label already exists for this tenant');
        }

        const service = this.serviceDefinitionRepository.create({
            ...createDto,
            tenant_id: tenantId,
        });

        return this.serviceDefinitionRepository.save(service);
    }

    async findAll(tenantId: string, query?: string): Promise<ServiceDefinition[]> {
        const where: any = { tenant_id: tenantId };

        if (query) {
            where.label = ILike(`%${query}%`);
        }

        return this.serviceDefinitionRepository.find({
            where,
            order: { label: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<ServiceDefinition> {
        const service = await this.serviceDefinitionRepository.findOne({
            where: { id, tenant_id: tenantId },
        });

        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }

        return service;
    }

    async update(id: string, tenantId: string, updateDto: UpdateServiceDefinitionDto): Promise<ServiceDefinition> {
        const service = await this.findOne(id, tenantId);

        if (updateDto.label && updateDto.label !== service.label) {
            const existing = await this.serviceDefinitionRepository.findOne({
                where: { tenant_id: tenantId, label: updateDto.label },
            });
            if (existing) {
                throw new ConflictException('Service with this label already exists');
            }
        }

        Object.assign(service, updateDto);
        return this.serviceDefinitionRepository.save(service);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const result = await this.serviceDefinitionRepository.delete({ id, tenant_id: tenantId });

        if (result.affected === 0) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }
    }
}
