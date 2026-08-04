import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClsService } from 'nestjs-cls';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

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
    clear: jest.fn(),
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
        it('should create a client with unique code and site_id', async () => {
            const tenantId = 'tenant-uuid';
            mockClsService.get.mockReturnValue(tenantId);
            mockRepository.findOne.mockReturnValue(null);
            mockRepository.create.mockImplementation((dto) => dto);
            mockRepository.save.mockImplementation((client) => Promise.resolve({ id: 'client-id', ...client }));

            const result = await service.create(
                {
                    first_name: 'John',
                    last_name: 'Doe',
                    phone: '+1234567890',
                },
                'site-1',
            );

            expect(result).toHaveProperty('unique_code');
            expect(result.unique_code).toHaveLength(8);
            expect(result.tenant_id).toBe(tenantId);
            expect(result.site_id).toBe('site-1');
            expect(mockCacheManager.clear).toHaveBeenCalled();
        });

        it('should create with null site_id when not provided', async () => {
            const tenantId = 'tenant-uuid';
            mockClsService.get.mockReturnValue(tenantId);
            mockRepository.findOne.mockReturnValue(null);
            mockRepository.create.mockImplementation((dto) => dto);
            mockRepository.save.mockImplementation((client) => Promise.resolve({ id: 'client-id', ...client }));

            const result = await service.create({
                first_name: 'Jane',
                last_name: 'Doe',
                phone: '+0987654321',
            });

            expect(result.site_id).toBeNull();
        });

        it('should retry if code exists', async () => {
            const tenantId = 'tenant-uuid';
            mockClsService.get.mockReturnValue(tenantId);

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

    describe('findAll', () => {
        it('should return paginated clients with site_name', async () => {
            mockClsService.get.mockReturnValue('tenant-1');
            const client = { id: 'c1', first_name: 'A', last_name: 'B', site_id: 's1' };
            const mockQb: any = {
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                clone: jest.fn(),
                getCount: jest.fn().mockResolvedValue(1),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [client],
                    raw: [{ site_name: 'Agence Centre' }],
                }),
            };
            mockQb.clone.mockReturnValue(mockQb);
            mockRepository.createQueryBuilder.mockReturnValue(mockQb);

            const result = await service.findAll(1, 50, 'dup');
            expect(result.data[0].site_name).toBe('Agence Centre');
            expect(result.meta.total).toBe(1);
            expect(mockQb.andWhere).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should throw NotFoundException when missing', async () => {
            mockClsService.get.mockReturnValue('tenant-1');
            const mockQb: any = {
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
            };
            mockRepository.createQueryBuilder.mockReturnValue(mockQb);
            await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update fields without changing site_id', async () => {
            mockClsService.get.mockReturnValue('tenant-1');
            const existing = {
                id: 'c1',
                tenant_id: 'tenant-1',
                site_id: 'site-original',
                first_name: 'Old',
                last_name: 'Name',
                phone: '+111',
                email: null,
                notes: null,
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockImplementation((c) => Promise.resolve(c));

            const mockQb: any = {
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [{ ...existing, first_name: 'New' }],
                    raw: [{ site_name: 'Agence' }],
                }),
            };
            mockRepository.createQueryBuilder.mockReturnValue(mockQb);

            await service.update('c1', { first_name: 'New' });
            expect(mockRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ first_name: 'New', site_id: 'site-original' }),
            );
            expect(mockCacheManager.clear).toHaveBeenCalled();
        });

        it('should throw NotFoundException when client missing', async () => {
            mockClsService.get.mockReturnValue('tenant-1');
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.update('x', { first_name: 'A' })).rejects.toThrow(NotFoundException);
        });
    });
});
