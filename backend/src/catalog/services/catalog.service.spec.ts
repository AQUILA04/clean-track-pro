import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ArticleType } from '../entities/article-type.entity';

const mockArticleTypeRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
};

describe('CatalogService', () => {
    let service: CatalogService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CatalogService,
                {
                    provide: getRepositoryToken(ArticleType),
                    useValue: mockArticleTypeRepository,
                },
            ],
        }).compile();

        service = module.get<CatalogService>(CatalogService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('[P1] should create an article type when label is unique', async () => {
            const tenantId = 'tenant-1';
            const dto = { label: 'Chemise', category: 'Vêtements' };
            mockArticleTypeRepository.findOne.mockResolvedValue(null);
            mockArticleTypeRepository.create.mockReturnValue({ ...dto, tenant_id: tenantId });
            mockArticleTypeRepository.save.mockResolvedValue({ id: 'art-1', ...dto, tenant_id: tenantId });

            const result = await service.create(tenantId, dto);

            expect(result.id).toBe('art-1');
            expect(mockArticleTypeRepository.findOne).toHaveBeenCalledWith({
                where: { tenant_id: tenantId, label: dto.label },
            });
        });

        it('[P1] should throw ConflictException when label already exists', async () => {
            mockArticleTypeRepository.findOne.mockResolvedValue({ label: 'Chemise' });

            await expect(
                service.create('tenant-1', { label: 'Chemise', category: 'Vêtements' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('findAll', () => {
        it('[P1] should return all article types for tenant', async () => {
            const articles = [{ id: '1', label: 'Chemise' }];
            mockArticleTypeRepository.find.mockResolvedValue(articles);

            const result = await service.findAll('tenant-1');

            expect(result).toEqual(articles);
            expect(mockArticleTypeRepository.find).toHaveBeenCalledWith({
                where: { tenant_id: 'tenant-1' },
                order: { label: 'ASC' },
            });
        });

        it('[P2] should search by label or category when query provided', async () => {
            mockArticleTypeRepository.find.mockResolvedValue([]);

            await service.findAll('tenant-1', 'chem');

            expect(mockArticleTypeRepository.find).toHaveBeenCalledWith({
                where: [
                    { tenant_id: 'tenant-1', label: expect.anything() },
                    { tenant_id: 'tenant-1', category: expect.anything() },
                ],
                order: { label: 'ASC' },
            });
        });
    });

    describe('findOne', () => {
        it('[P1] should return article type when found', async () => {
            const article = { id: 'art-1', label: 'Chemise', tenant_id: 'tenant-1' };
            mockArticleTypeRepository.findOne.mockResolvedValue(article);

            const result = await service.findOne('art-1', 'tenant-1');

            expect(result).toEqual(article);
        });

        it('[P1] should throw NotFoundException when article not found', async () => {
            mockArticleTypeRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('[P1] should update article type', async () => {
            const existing = { id: 'art-1', label: 'Chemise', tenant_id: 'tenant-1' };
            mockArticleTypeRepository.findOne
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce(null);
            mockArticleTypeRepository.save.mockImplementation((a) => Promise.resolve(a));

            const result = await service.update('art-1', 'tenant-1', { label: 'Pantalon' });

            expect(result.label).toBe('Pantalon');
        });

        it('[P2] should throw ConflictException on duplicate label during update', async () => {
            const existing = { id: 'art-1', label: 'Chemise', tenant_id: 'tenant-1' };
            mockArticleTypeRepository.findOne
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce({ id: 'art-2', label: 'Pantalon' });

            await expect(
                service.update('art-1', 'tenant-1', { label: 'Pantalon' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('delete', () => {
        it('[P1] should remove article type', async () => {
            const article = { id: 'art-1', label: 'Chemise', tenant_id: 'tenant-1' };
            mockArticleTypeRepository.findOne.mockResolvedValue(article);
            mockArticleTypeRepository.remove.mockResolvedValue(article);

            await service.delete('art-1', 'tenant-1');

            expect(mockArticleTypeRepository.remove).toHaveBeenCalledWith(article);
        });
    });
});
