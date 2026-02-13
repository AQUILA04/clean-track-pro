import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ServiceDefinitionService } from '../services/service-definition.service';
import { CreateServiceDefinitionDto } from '../dto/create-service-definition.dto';
import { UpdateServiceDefinitionDto } from '../dto/update-service-definition.dto';
import { Roles, AuthenticatedUser, AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { Response } from '../../shared/response/response.builder';

@Controller('catalog/services')
@UseGuards(AuthGuard, RoleGuard)
export class ServiceDefinitionController {
    constructor(private readonly serviceDefinitionService: ServiceDefinitionService) { }

    @Post()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async create(@AuthenticatedUser() user: any, @Body() createDto: CreateServiceDefinitionDto) {
        const tenantId = user.tenant_id;
        const data = await this.serviceDefinitionService.create(tenantId, createDto);
        return Response.builder()
            .status(201)
            .message('Service created successfully')
            .data(data)
            .build();
    }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:User_Site', 'realm:Admin_Site', 'realm:Superadmin'] })
    async findAll(@AuthenticatedUser() user: any, @Query('q') query?: string) {
        const tenantId = user.tenant_id;
        const data = await this.serviceDefinitionService.findAll(tenantId, query);
        return Response.builder()
            .status(200)
            .data(data)
            .build();
    }

    @Patch(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async update(
        @AuthenticatedUser() user: any,
        @Param('id') id: string,
        @Body() updateDto: UpdateServiceDefinitionDto,
    ) {
        const tenantId = user.tenant_id;
        const data = await this.serviceDefinitionService.update(id, tenantId, updateDto);
        return Response.builder()
            .status(200)
            .message('Service updated successfully')
            .data(data)
            .build();
    }

    @Delete(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async delete(@AuthenticatedUser() user: any, @Param('id') id: string) {
        const tenantId = user.tenant_id;
        await this.serviceDefinitionService.delete(id, tenantId);
        return Response.builder()
            .status(200)
            .message('Service deleted successfully')
            .build();
    }
}
