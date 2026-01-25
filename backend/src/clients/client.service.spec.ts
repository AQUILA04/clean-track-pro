import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClsService } from 'nestjs-cls';
import { ConflictException } from '@nestjs/common';

const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
};

const mockClsService = {
    get: jest.fn(),
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
});
