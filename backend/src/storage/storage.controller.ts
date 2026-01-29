import { Controller, Post, Body, Get, Query, UseGuards, HttpCode, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
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

    @Post('assign')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    @HttpCode(HttpStatus.OK)
    assign(@Body() assignOrderDto: AssignOrderDto) {
        return this.storageService.assignOrderToSlot(assignOrderDto);
    }

    @Get('lookup/:orderId')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    lookup(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.storageService.lookupOrder(orderId);
    }

    @Post('deliver/:orderId')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    @HttpCode(HttpStatus.OK)
    deliver(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.storageService.processDelivery(orderId);
    }

}
