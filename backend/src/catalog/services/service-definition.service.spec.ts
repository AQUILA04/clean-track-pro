import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ServiceDefinitionService } from './service-definition.service';
import { ServiceDefinition } from '../entities/service-definition.entity';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

const mockServiceDefinitionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
};

const mockManager = {
    query: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((_e, data) => data),
    save: jest.fn((_e, data) => Promise.resolve({ id: '1', ...data })),
};

const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockManager)),
};

describe('ServiceDefinitionService', () => {
    let service: ServiceDefinitionService;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockDataSource.transaction.mockImplementation((cb) => cb(mockManager));
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServiceDefinitionService,
                {
                    provide: getRepositoryToken(ServiceDefinition),
                    useValue: mockServiceDefinitionRepository,
                },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<ServiceDefinitionService>(ServiceDefinitionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('ensureDefaultServices', () => {
        it('seeds Lavage and Repassage', async () => {
            mockManager.findOne.mockResolvedValue(null);
            await service.ensureDefaultServices('11111111-1111-1111-1111-111111111111');
            expect(mockManager.save).toHaveBeenCalledTimes(2);
            expect(mockManager.create).toHaveBeenCalledWith(
                ServiceDefinition,
                expect.objectContaining({ label: 'Lavage', is_system: true }),
            );
        });
    });

    describe('create', () => {
        it('should create a service definition if not exists', async () => {
            const tenantId = 'tenant-1';
            const dto = { label: 'Test Service', is_active: true };
            mockServiceDefinitionRepository.findOne.mockResolvedValue(null);
            mockServiceDefinitionRepository.create.mockReturnValue({ ...dto, is_system: false });
            mockServiceDefinitionRepository.save.mockResolvedValue({ id: '1', ...dto, is_system: false });

            const result = await service.create(tenantId, dto);
            expect(result.id).toBe('1');
            expect(mockServiceDefinitionRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ is_system: false, tenant_id: tenantId }),
            );
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
                order: { is_system: 'DESC', label: 'ASC' },
            });
        });
    });

    describe('findOne', () => {
        it('[P1] should return service when found', async () => {
            const svc = { id: 'svc-1', label: 'Lavage', tenant_id: 'tenant-1' };
            mockServiceDefinitionRepository.findOne.mockResolvedValue(svc);

            const result = await service.findOne('svc-1', 'tenant-1');

            expect(result).toEqual(svc);
        });

        it('should throw NotFoundException when missing', async () => {
            mockServiceDefinitionRepository.findOne.mockResolvedValue(null);
            await expect(service.findOne('x', 'tenant-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('blocks deleting system services', async () => {
            mockServiceDefinitionRepository.findOne.mockResolvedValue({
                id: '1',
                label: 'Lavage',
                is_system: true,
            });
            await expect(service.delete('1', 'tenant-1')).rejects.toThrow(BadRequestException);
        });
    });
});
