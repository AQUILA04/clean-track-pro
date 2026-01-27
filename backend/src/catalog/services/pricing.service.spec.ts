import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { ServicePrice } from '../entities/service-price.entity';
import { ArticleType } from '../entities/article-type.entity';
import { ServiceDefinition } from '../entities/service-definition.entity';

const mockServicePriceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
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

    describe('upsert', () => {
        it('should create price if not exists', async () => {
            const tenantId = 'tenant-1';
            const dto = { article_type_id: 'a1', service_definition_id: 's1', price: 10 };
            mockServicePriceRepository.findOne.mockResolvedValue(null);
            mockServicePriceRepository.create.mockReturnValue({ ...dto, tenant_id: tenantId });
            mockServicePriceRepository.save.mockResolvedValue({ id: 'p1', ...dto, tenant_id: tenantId });

            const result = await service.upsert(tenantId, dto);
            expect(result).toEqual({ id: 'p1', ...dto, tenant_id: tenantId });
        });

        it('should update price if exists', async () => {
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
