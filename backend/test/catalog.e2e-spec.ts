import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Repository } from 'typeorm';
import { ArticleType } from './../src/catalog/entities/article-type.entity';

describe('CatalogController (e2e)', () => {
    let app: INestApplication;
    let articleTypeRepository: Repository<ArticleType>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        articleTypeRepository = moduleFixture.get('ArticleTypeRepository');
    });

    afterAll(async () => {
        await app.close();
    });

    // Mocking auth or headers to simulate different tenants if possible
    // Since authentication is guarded, we might need to bypass it or mock the guard for E2E
    // or use a setup that enables bypassing.
    // For now, let's assume we can mock the user context or use a test helper.

    it('/article-types (POST)', () => {
        return request(app.getHttpServer())
            .post('/article-types')
            .send({
                label: 'Test Shirt',
                category: 'Clothing',
            })
            .expect(201)
            .expect((res) => {
                expect(res.body.data.label).toEqual('Test Shirt');
            });
    });

    it('/article-types (GET)', () => {
        return request(app.getHttpServer())
            .get('/article-types')
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body.data)).toBe(true);
            });
    });
});
