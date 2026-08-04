import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, ILike } from 'typeorm';
import { ServiceDefinition } from '../entities/service-definition.entity';
import { CreateServiceDefinitionDto } from '../dto/create-service-definition.dto';
import { UpdateServiceDefinitionDto } from '../dto/update-service-definition.dto';
import { DEFAULT_SERVICE_DEFINITIONS } from '../constants/default-services';

@Injectable()
export class ServiceDefinitionService {
    private readonly logger = new Logger(ServiceDefinitionService.name);

    constructor(
        @InjectRepository(ServiceDefinition)
        private readonly serviceDefinitionRepository: Repository<ServiceDefinition>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Idempotent seed of default services (Lavage, Repassage) for a tenant.
     */
    async ensureDefaultServices(tenantId: string): Promise<void> {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            throw new BadRequestException('Invalid tenant ID');
        }

        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SET LOCAL "app.current_tenant" = '${tenantId}'`);

            for (const def of DEFAULT_SERVICE_DEFINITIONS) {
                const existing = await manager.findOne(ServiceDefinition, {
                    where: { tenant_id: tenantId, label: def.label },
                });
                if (existing) {
                    if (!existing.is_system) {
                        existing.is_system = true;
                        if (!existing.description) {
                            existing.description = def.description;
                        }
                        await manager.save(ServiceDefinition, existing);
                    }
                    continue;
                }

                const service = manager.create(ServiceDefinition, {
                    tenant_id: tenantId,
                    label: def.label,
                    description: def.description,
                    is_active: true,
                    is_system: true,
                });
                await manager.save(ServiceDefinition, service);
            }
        });

        this.logger.log(`Default services ensured for tenant ${tenantId}`);
    }

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
            is_system: false,
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
            order: { is_system: 'DESC', label: 'ASC' },
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

        if (service.is_system && updateDto.label && updateDto.label !== service.label) {
            throw new BadRequestException(
                'Les services système (Lavage, Repassage) ne peuvent pas être renommés.',
            );
        }

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
        const service = await this.findOne(id, tenantId);
        if (service.is_system) {
            throw new BadRequestException(
                'Les services système (Lavage, Repassage) ne peuvent pas être supprimés. Désactivez-les si besoin.',
            );
        }

        const result = await this.serviceDefinitionRepository.delete({ id, tenant_id: tenantId });

        if (result.affected === 0) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }
    }
}
