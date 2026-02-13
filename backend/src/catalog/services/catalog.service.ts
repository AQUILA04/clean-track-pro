import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ArticleType } from '../entities/article-type.entity';
import { CreateArticleTypeDto } from '../dto/create-article-type.dto';
import { UpdateArticleTypeDto } from '../dto/update-article-type.dto';

@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(ArticleType)
        private readonly articleTypeRepository: Repository<ArticleType>,
    ) { }

    async create(tenantId: string, createDto: CreateArticleTypeDto): Promise<ArticleType> {
        const existing = await this.articleTypeRepository.findOne({
            where: { tenant_id: tenantId, label: createDto.label },
        });

        if (existing) {
            throw new ConflictException('Article type with this label already exists');
        }

        const articleType = this.articleTypeRepository.create({
            ...createDto,
            tenant_id: tenantId,
        });

        return this.articleTypeRepository.save(articleType);
    }

    async findAll(tenantId: string, query?: string): Promise<ArticleType[]> {
        const where: any = { tenant_id: tenantId };

        if (query) {
            where.label = ILike(`%${query}%`);
            // To do OR in TypeORM with other conditions (kept from original snippet comment):
            // where: [
            //   { tenant_id: tenantId, label: ILike(`%${query}%`) },
            //   { tenant_id: tenantId, category: ILike(`%${query}%`) }
            // ]
            return this.articleTypeRepository.find({
                where: [
                    { tenant_id: tenantId, label: ILike(`%${query}%`) },
                    { tenant_id: tenantId, category: ILike(`%${query}%`) }
                ],
                order: { label: 'ASC' },
            });
        }

        return this.articleTypeRepository.find({
            where,
            order: { label: 'ASC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<ArticleType> {
        const articleType = await this.articleTypeRepository.findOne({
            where: { id, tenant_id: tenantId },
        });

        if (!articleType) {
            throw new NotFoundException(`Article type with ID ${id} not found`);
        }

        return articleType;
    }

    async update(id: string, tenantId: string, updateDto: UpdateArticleTypeDto): Promise<ArticleType> {
        const articleType = await this.findOne(id, tenantId);

        if (updateDto.label && updateDto.label !== articleType.label) {
            const existing = await this.articleTypeRepository.findOne({
                where: { tenant_id: tenantId, label: updateDto.label },
            });
            if (existing) {
                throw new ConflictException('Article type with this label already exists');
            }
        }

        Object.assign(articleType, updateDto);
        return this.articleTypeRepository.save(articleType);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const articleType = await this.findOne(id, tenantId);
        await this.articleTypeRepository.remove(articleType);
    }
}
