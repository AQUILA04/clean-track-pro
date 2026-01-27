import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClsService } from 'nestjs-cls';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
};

const mockClsService = {
    get: jest.fn(),
};

const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
};

describe('ClientService', () => {
    let service: ClientService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientService,
                {
                    provide: getRepositoryToken(Client),
                    useValue: mockRepository,
                },
                {
                    provide: ClsService,
                    useValue: mockClsService,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
            ],
        }).compile();

        service = module.get<ClientService>(ClientService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a client with unique code', async () => {
            const tenantId = 'tenant-uuid';
            mockClsService.get.mockReturnValue(tenantId);
            mockRepository.findOne.mockReturnValue(null); // Code unique
            mockRepository.create.mockImplementation((dto) => dto);
            mockRepository.save.mockImplementation((client) => Promise.resolve({ id: 'client-id', ...client }));

            const result = await service.create({
                first_name: 'John',
                last_name: 'Doe',
                phone: '+1234567890',
            });

            expect(result).toHaveProperty('unique_code');
            expect(result.unique_code).toHaveLength(8);
            expect(result.tenant_id).toBe(tenantId);
        });

        it('should retry if code exists', async () => {
            const tenantId = 'tenant-uuid';
            mockClsService.get.mockReturnValue(tenantId);

            // First attempt finds existing code, second attempt finds nothing
            mockRepository.findOne
                .mockReturnValueOnce({ id: 'existing' })
                .mockReturnValueOnce(null);

            mockRepository.create.mockImplementation((dto) => dto);
            mockRepository.save.mockImplementation((client) => Promise.resolve({ id: 'client-id', ...client }));

            const result = await service.create({
                first_name: 'Jane',
                last_name: 'Doe',
                phone: '+0987654321',
            });

            expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
            expect(result.unique_code).toHaveLength(8);
        });
    });

    describe('search', () => {
        it('should throw if no tenant context', async () => {
            mockClsService.get.mockReturnValue(undefined);
            await expect(service.search('query')).rejects.toThrow(InternalServerErrorException);
        });

        it('should return cached results if available', async () => {
            const tenantId = 'tenant-1';
            const cachedClients = [{ id: '1', first_name: 'Cached' }];
            mockClsService.get.mockReturnValue(tenantId);
            mockCacheManager.get.mockResolvedValue(cachedClients);

            const result = await service.search('query');
            expect(result).toBe(cachedClients);
            expect(mockCacheManager.get).toHaveBeenCalledWith(`tenant_${tenantId}_search_query`);
            expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
        });

        it('should query database and cache results if not cached', async () => {
            const tenantId = 'tenant-1';
            const dbClients = [{ id: '2', first_name: 'DB' }];
            mockClsService.get.mockReturnValue(tenantId);
            mockCacheManager.get.mockResolvedValue(null);

            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(dbClients),
            };
            mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.search('query');
            expect(result).toBe(dbClients);
            expect(mockCacheManager.set).toHaveBeenCalledWith(`tenant_${tenantId}_search_query`, dbClients, 300000);
            expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
        });
    });
});
