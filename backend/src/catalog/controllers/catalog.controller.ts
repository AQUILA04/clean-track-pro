import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';
import { CreateArticleTypeDto } from '../dto/create-article-type.dto';
import { UpdateArticleTypeDto } from '../dto/update-article-type.dto';
import { Roles, AuthenticatedUser, AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { Response } from '../../shared/response/response.builder';

@Controller('article-types')
@UseGuards(AuthGuard, RoleGuard)
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Post()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async create(@AuthenticatedUser() user: any, @Body() createDto: CreateArticleTypeDto) {
        const tenantId = user.tenant_id;
        if (!tenantId) {
            throw new Error('User has no tenant_id associated');
        }
        const data = await this.catalogService.create(tenantId, createDto);
        return Response.builder()
            .status(201)
            .message('Article type created successfully')
            .data(data)
            .build();
    }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:User_Site', 'realm:Admin_Site', 'realm:Superadmin'] })
    async findAll(@AuthenticatedUser() user: any, @Query('q') query?: string) {
        const tenantId = user.tenant_id;
        if (!tenantId) {
            throw new Error('User has no tenant_id associated');
        }
        const data = await this.catalogService.findAll(tenantId, query);
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
        @Body() updateDto: UpdateArticleTypeDto,
    ) {
        const tenantId = user.tenant_id;
        if (!tenantId) {
            throw new Error('User has no tenant_id associated');
        }
        const data = await this.catalogService.update(id, tenantId, updateDto);
        return Response.builder()
            .status(200)
            .message('Article type updated successfully')
            .data(data)
            .build();
    }

    @Delete(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async delete(@AuthenticatedUser() user: any, @Param('id') id: string) {
        const tenantId = user.tenant_id;
        if (!tenantId) {
            throw new Error('User has no tenant_id associated');
        }
        await this.catalogService.delete(id, tenantId);
        return Response.builder()
            .status(200)
            .message('Article type deleted successfully')
            .build();
    }
}
