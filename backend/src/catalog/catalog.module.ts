import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controllers/catalog.controller';
import { CatalogService } from './services/catalog.service';
import { ArticleType } from './entities/article-type.entity';
import { ServiceDefinition } from './entities/service-definition.entity';
import { ServicePrice } from './entities/service-price.entity';
import { ServiceDefinitionController } from './controllers/service-definition.controller';
import { PricingController } from './controllers/pricing.controller';
import { ServiceDefinitionService } from './services/service-definition.service';
import { PricingService } from './services/pricing.service';

@Module({
    imports: [TypeOrmModule.forFeature([ArticleType, ServiceDefinition, ServicePrice])],
    controllers: [CatalogController, ServiceDefinitionController, PricingController],
    providers: [CatalogService, ServiceDefinitionService, PricingService],
    exports: [CatalogService, ServiceDefinitionService, PricingService],
})
export class CatalogModule { }
