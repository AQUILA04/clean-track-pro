import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServiceDefinitionService } from './service-definition.service';
import { ServiceDefinition } from '../entities/service-definition.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockServiceDefinitionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
};

describe('ServiceDefinitionService', () => {
    let service: ServiceDefinitionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServiceDefinitionService,
                {
                    provide: getRepositoryToken(ServiceDefinition),
                    useValue: mockServiceDefinitionRepository,
                },
            ],
        }).compile();

        service = module.get<ServiceDefinitionService>(ServiceDefinitionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a service definition if not exists', async () => {
            const tenantId = 'tenant-1';
            const dto = { label: 'Test Service', is_active: true };
            mockServiceDefinitionRepository.findOne.mockResolvedValue(null);
            mockServiceDefinitionRepository.create.mockReturnValue(dto);
            mockServiceDefinitionRepository.save.mockResolvedValue({ id: '1', ...dto });

            const result = await service.create(tenantId, dto);
            expect(result).toEqual({ id: '1', ...dto });
            expect(mockServiceDefinitionRepository.findOne).toHaveBeenCalledWith({ where: { tenant_id: tenantId, label: dto.label } });
        });

        it('should throw ConflictException if service already exists', async () => {
            const tenantId = 'tenant-1';
            const dto = { label: 'Test Service' };
            mockServiceDefinitionRepository.findOne.mockResolvedValue(dto);

            await expect(service.create(tenantId, dto as any)).rejects.toThrow(ConflictException);
        });
    });

    describe('findAll', () => {
        it('should return array of services', async () => {
            const tenantId = 'tenant-1';
            const resultValue = [{ label: 'Service 1' }];
            mockServiceDefinitionRepository.find.mockResolvedValue(resultValue);

            const result = await service.findAll(tenantId);
            expect(result).toEqual(resultValue);
            expect(mockServiceDefinitionRepository.find).toHaveBeenCalledWith({
                where: { tenant_id: tenantId },
                order: { label: 'ASC' },
            });
        });
    });
});
