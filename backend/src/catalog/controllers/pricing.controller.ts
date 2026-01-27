import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { PricingService } from '../services/pricing.service';
import { UpsertServicePriceDto } from '../dto/upsert-service-price.dto';
import { Roles, AuthenticatedUser, AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { Response } from '../../shared/response/response.builder';

@Controller('catalog/prices')
@UseGuards(AuthGuard, RoleGuard)
export class PricingController {
    constructor(private readonly pricingService: PricingService) { }

    @Post()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async upsert(@AuthenticatedUser() user: any, @Body() upsertDto: UpsertServicePriceDto) {
        const tenantId = user.tenant_id;
        const data = await this.pricingService.upsert(tenantId, upsertDto);
        return Response.builder()
            .status(201)
            .message('Price saved successfully')
            .data(data)
            .build();
    }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:User_Site', 'realm:Admin_Site', 'realm:Superadmin'] })
    async findAll(@AuthenticatedUser() user: any) {
        const tenantId = user.tenant_id;
        const data = await this.pricingService.findAll(tenantId);
        return Response.builder()
            .status(200)
            .data(data)
            .build();
    }
}
