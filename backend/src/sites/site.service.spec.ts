import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SiteService } from './site.service';
import { Site } from './entities/site.entity';
import { RlsService } from '../shared/database/rls/rls.service';
import { QuotaService } from '../subscription/services/quota.service';

const mockMaxCodeQuery = () => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
    getMany: jest.fn().mockResolvedValue([]),
});

const mockManager = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn().mockResolvedValue(undefined),
};

const mockRlsService = {
    wrapTransaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
};

const mockQuotaService = {
    assertWithinQuota: jest.fn().mockResolvedValue(undefined),
};

describe('SiteService', () => {
    let service: SiteService;
    const mockDataSource = {
        transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockDataSource.transaction.mockImplementation(async (cb) => cb(mockManager));
        mockManager.createQueryBuilder.mockImplementation(() => mockMaxCodeQuery());
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SiteService,
                { provide: getRepositoryToken(Site), useValue: {} },
                { provide: RlsService, useValue: mockRlsService },
                { provide: DataSource, useValue: mockDataSource },
                { provide: QuotaService, useValue: mockQuotaService },
            ],
        }).compile();

        service = module.get<SiteService>(SiteService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createForTenantBootstrap', () => {
        it('[P0] should create a site with explicit tenant RLS context', async () => {
            const dto = { name: 'Agence Principale', city: 'Paris' };
            const created = {
                id: 'site-1',
                ...dto,
                tenant_id: '550e8400-e29b-41d4-a716-446655440001',
                status: 'ACTIVE',
                code: 1,
            };
            mockManager.create.mockReturnValue(created);
            mockManager.save.mockResolvedValue(created);

            const result = await service.createForTenantBootstrap(
                '550e8400-e29b-41d4-a716-446655440001',
                dto,
            );

            expect(result).toEqual(created);
            expect(mockDataSource.transaction).toHaveBeenCalled();
            expect(mockManager.query).toHaveBeenCalledWith(
                `SET LOCAL "app.current_tenant" = '550e8400-e29b-41d4-a716-446655440001'`,
            );
            expect(mockManager.create).toHaveBeenCalledWith(
                Site,
                expect.objectContaining({
                    code: 1,
                    tenant_id: '550e8400-e29b-41d4-a716-446655440001',
                }),
            );
        });

        it('[P0] should reject invalid tenant ID', async () => {
            await expect(
                service.createForTenantBootstrap('invalid-id', { name: 'Agence' }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('create', () => {
        it('[P1] should create a site for tenant with next code', async () => {
            const dto = { name: 'Agence Paris', city: 'Paris', location: '1 rue de Rivoli' };
            const created = { id: 'site-1', ...dto, tenant_id: 'tenant-1', code: 1 };
            mockManager.create.mockReturnValue(created);
            mockManager.save.mockResolvedValue(created);

            const result = await service.create('tenant-1', dto);

            expect(result).toEqual(created);
            expect(mockManager.create).toHaveBeenCalledWith(Site, {
                ...dto,
                tenant_id: 'tenant-1',
                code: 1,
            });
        });
    });

    describe('findAll', () => {
        it('[P1] should return all sites for tenant', async () => {
            const sites = [{ id: 'site-1', name: 'Agence Paris' }];
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(sites),
            };
            mockManager.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.findAll('tenant-1');

            expect(result).toEqual(sites);
            expect(queryBuilder.where).toHaveBeenCalledWith('site.tenant_id = :tenantId', {
                tenantId: 'tenant-1',
            });
        });

        it('[P2] should apply search filter when provided', async () => {
            const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };
            mockManager.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.findAll('tenant-1', 'paris');

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                '(site.name ILIKE :search OR site.city ILIKE :search OR site.location ILIKE :search)',
                { search: '%paris%' },
            );
        });
    });

    describe('findOne', () => {
        it('[P1] should return site when found', async () => {
            const site = { id: 'site-1', name: 'Agence Paris', tenant_id: 'tenant-1' };
            mockManager.findOne.mockResolvedValue(site);

            const result = await service.findOne('site-1', 'tenant-1');

            expect(result).toEqual(site);
        });

        it('[P1] should throw NotFoundException when site not found', async () => {
            mockManager.findOne.mockResolvedValue(null);

            await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('[P1] should update site fields', async () => {
            const site = { id: 'site-1', name: 'Old Name', tenant_id: 'tenant-1' };
            mockManager.findOne.mockResolvedValue(site);
            mockManager.save.mockImplementation((_, s) => Promise.resolve(s));

            const result = await service.update('site-1', 'tenant-1', { name: 'New Name' });

            expect(result.name).toBe('New Name');
        });
    });

    describe('validate', () => {
        it('[P0] should return true when site belongs to tenant', async () => {
            mockManager.count.mockResolvedValue(1);

            const result = await service.validate('tenant-1', 'site-1');

            expect(result).toBe(true);
        });

        it('[P0] should return false when site does not belong to tenant', async () => {
            mockManager.count.mockResolvedValue(0);

            const result = await service.validate('tenant-1', 'site-other');

            expect(result).toBe(false);
        });
    });
});
