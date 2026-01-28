import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StorageSlot, StorageSlotStatus } from './entities/storage-slot.entity';
import { RlsService } from '../shared/database/rls/rls.service';
import { EntityManager, Repository } from 'typeorm';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';

describe('StorageService', () => {
    let service: StorageService;
    let rlsService: RlsService;

    const mockManager = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };

    const mockRepository = {
        // Repository methods if used directly, but we use manager via RLS
    };

    const mockRlsService = {
        wrapTransaction: jest.fn().mockImplementation(async (cb) => {
            return cb(mockManager);
        }),
        getTenantId: jest.fn().mockReturnValue('tenant-1'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageService,
                {
                    provide: getRepositoryToken(StorageSlot),
                    useValue: mockRepository,
                },
                {
                    provide: RlsService,
                    useValue: mockRlsService,
                },
            ],
        }).compile();

        service = module.get<StorageService>(StorageService);
        rlsService = module.get<RlsService>(RlsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a storage slot using RLS transaction', async () => {
            const dto: CreateStorageSlotDto = { name: 'A-01', site_id: 'site-123' };
            const expectedSlot = {
                id: 'uuid',
                ...dto,
                status: StorageSlotStatus.FREE,
                tenant_id: 'tenant-1',
                created_at: new Date(),
                updated_at: new Date()
            };

            mockManager.create.mockReturnValue(expectedSlot);
            mockManager.save.mockResolvedValue(expectedSlot);

            const result = await service.create(dto);

            expect(rlsService.wrapTransaction).toHaveBeenCalled();
            expect(mockManager.create).toHaveBeenCalledWith(StorageSlot, dto);
            expect(mockManager.save).toHaveBeenCalledWith(StorageSlot, expectedSlot);
            expect(result).toEqual(expectedSlot);
        });
    });

    describe('findAll', () => {
        it('should return all slots for a site', async () => {
            const siteId = 'site-123';
            const expectedSlots = [{ id: '1', name: 'A-01', site_id: siteId }];

            mockManager.find.mockResolvedValue(expectedSlots);

            const result = await service.findAll(siteId);

            expect(rlsService.wrapTransaction).toHaveBeenCalled();
            expect(mockManager.find).toHaveBeenCalledWith(StorageSlot, { where: { site_id: siteId } });
            expect(result).toEqual(expectedSlots);
        });
    });
});
