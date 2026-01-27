import { Controller, Get, Post, Body, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';
import { CreateArticleTypeDto } from '../dto/create-article-type.dto';
import { UpdateArticleTypeDto } from '../dto/update-article-type.dto';
import { Roles, AuthenticatedUser, AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { Response } from '../../shared/response/response.builder';

// Mocking Roles and Auth for now if imports fail, but using standard structure.
// I need to check how Auth is implemented. The plan mentioned protecting with @Roles(['ADMIN_TENANT']).
// I will check `backend/src/shared/guards` if needed.
// For now, I'll generate with standard assumptions and adjust if needed.

@Controller('article-types')
@UseGuards(AuthGuard, RoleGuard)
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Post()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async create(@AuthenticatedUser() user: any, @Body() createDto: CreateArticleTypeDto) {
        const tenantId = user.tenant_id;

        if (!tenantId) {
            // Superadmin might not have a tenant_id implies they should provide one in body? 
            // Or better, restrict creation to Admin_Tenant for now as per story.
            // Story says "As an Admin_Tenant".
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
    async findAll(@AuthenticatedUser() user: any) {
        const tenantId = user.tenant_id;
        if (!tenantId) {
            throw new Error('User has no tenant_id associated');
        }
        const data = await this.catalogService.findAll(tenantId);
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
}
