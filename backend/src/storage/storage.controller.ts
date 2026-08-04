import { Controller, Post, Body, Get, Query, UseGuards, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { TenancyGuard } from '../shared/guards/tenancy.guard';
import { Response } from '../shared/response/response.builder';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { OrderStatus } from '../orders/enums/order-status.enum';

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
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin', 'realm:Admin_Tenant'] })
    findAll(@Query('site_id') siteId: string, @Query('slot_type') slotType?: string) {
        return this.storageService.findAll(siteId, slotType as any);
    }

    @Get('slots/:slotId/contents')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin', 'realm:Admin_Tenant'] })
    getSlotContents(@Param('slotId', ParseUUIDPipe) slotId: string) {
        return this.storageService.getSlotContents(slotId);
    }

    @Get('stats/occupancy')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:Super_Admin', 'realm:Superadmin'] })
    getOccupancyBySite() {
        return this.storageService.getOccupancyBySite();
    }

    @Post('assign')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    @HttpCode(HttpStatus.OK)
    assign(@Body() assignOrderDto: AssignOrderDto) {
        return this.storageService.assignOrderToSlot(assignOrderDto);
    }

    @Post('release/:orderId')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    @HttpCode(HttpStatus.OK)
    release(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.storageService.releaseOrder(orderId);
    }

    @Get('lookup')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    lookupByQuery(
        @Query('q') q: string,
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('statuses') statuses?: string,
    ) {
        if (!q?.trim()) {
            throw new BadRequestException('Query parameter q is required');
        }
        const statusList = statuses
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) as OrderStatus[] | undefined;
        return this.storageService.lookupOrders(q.trim(), {
            siteId: siteId || user.site_ids?.[0],
            statuses: statusList,
        });
    }

    /** @deprecated Prefer GET /storage/lookup?q= — kept for full-UUID clients */
    @Get('lookup/:orderId')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    lookup(@Param('orderId') orderId: string) {
        return this.storageService.lookupOrder(orderId);
    }

    @Post('deliver/:orderId')
    @Roles({ roles: ['realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    @HttpCode(HttpStatus.OK)
    deliver(@Param('orderId', ParseUUIDPipe) orderId: string) {
        return this.storageService.processDelivery(orderId);
    }

    @Post('upload')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site', 'realm:Super_Admin'] })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const url = await this.storageService.uploadFile(file);
        return Response.builder()
            .status(HttpStatus.CREATED)
            .data({ url })
            .build();
    }
}
