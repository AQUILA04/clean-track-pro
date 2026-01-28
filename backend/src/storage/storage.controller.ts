import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { TenancyGuard } from '../shared/guards/tenancy.guard';

@Controller('storage')
@UseGuards(AuthGuard, RoleGuard, TenancyGuard)
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('slots')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Super_Admin'] })
    create(@Body() createStorageSlotDto: CreateStorageSlotDto) {
        return this.storageService.create(createStorageSlotDto);
    }

    @Get('slots')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    findAll(@Query('site_id') siteId: string) {
        return this.storageService.findAll(siteId);
    }
}
