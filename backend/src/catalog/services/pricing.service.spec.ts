import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { ServicePrice } from '../entities/service-price.entity';
import { ArticleType } from '../entities/article-type.entity';
import { ServiceDefinition } from '../entities/service-definition.entity';

const mockServicePriceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
};

describe('PricingService', () => {
    let service: PricingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PricingService,
                {
                    provide: getRepositoryToken(ServicePrice),
                    useValue: mockServicePriceRepository,
                },
                {
                    provide: getRepositoryToken(ArticleType),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(ServiceDefinition),
                    useValue: {},
                }
            ],
        }).compile();

        service = module.get<PricingService>(PricingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('[P1] should return all prices for tenant with relations', async () => {
            const prices = [{ id: 'p1', price: 10 }];
            mockServicePriceRepository.find.mockResolvedValue(prices);

            const result = await service.findAll('tenant-1');

            expect(result).toEqual(prices);
            expect(mockServicePriceRepository.find).toHaveBeenCalledWith({
                where: { tenant_id: 'tenant-1' },
                relations: ['article_type', 'service_definition'],
            });
        });
    });

    describe('getPrice', () => {
        it('[P1] should return numeric price when defined', async () => {
            mockServicePriceRepository.findOne.mockResolvedValue({ price: '12.50' });

            const result = await service.getPrice('tenant-1', 'art-1', 'svc-1');

            expect(result).toBe(12.5);
        });

        it('[P1] should throw NotFoundException when price not defined', async () => {
            mockServicePriceRepository.findOne.mockResolvedValue(null);

            await expect(
                service.getPrice('tenant-1', 'art-1', 'svc-1'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('[P1] should delete price by article and service', async () => {
            mockServicePriceRepository.delete.mockResolvedValue({ affected: 1 });

            await service.delete('tenant-1', 'art-1', 'svc-1');

            expect(mockServicePriceRepository.delete).toHaveBeenCalledWith({
                tenant_id: 'tenant-1',
                article_type_id: 'art-1',
                service_definition_id: 'svc-1',
            });
        });
    });

    describe('upsert', () => {
        it('[P1] should create price if not exists', async () => {
            const tenantId = 'tenant-1';
            const dto = { article_type_id: 'a1', service_definition_id: 's1', price: 10 };
            mockServicePriceRepository.findOne.mockResolvedValue(null);
            mockServicePriceRepository.create.mockReturnValue({ ...dto, tenant_id: tenantId });
            mockServicePriceRepository.save.mockResolvedValue({ id: 'p1', ...dto, tenant_id: tenantId });

            const result = await service.upsert(tenantId, dto);
            expect(result).toEqual({ id: 'p1', ...dto, tenant_id: tenantId });
        });

        it('[P1] should update price if exists', async () => {
            const tenantId = 'tenant-1';
            const dto = { article_type_id: 'a1', service_definition_id: 's1', price: 20 };
            const existing = { id: 'p1', article_type_id: 'a1', service_definition_id: 's1', price: 10, tenant_id: tenantId };

            mockServicePriceRepository.findOne.mockResolvedValue(existing);
            mockServicePriceRepository.save.mockImplementation(k => Promise.resolve(k));

            const result = await service.upsert(tenantId, dto);
            expect(result.price).toBe(20);
            expect(mockServicePriceRepository.save).toHaveBeenCalled();
        });
    });
});
