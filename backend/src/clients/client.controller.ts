import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Param,
    Patch,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('clients')
@UseGuards(AuthGuard, RoleGuard)
export class ClientController {
    constructor(private readonly clientService: ClientService) {}

    @Post()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    create(@Body() createClientDto: CreateClientDto, @CurrentUser() user: AuthUser) {
        return this.clientService.create(createClientDto, user.site_ids?.[0] ?? null);
    }

    @Get('search')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    search(@Query('q') query: string) {
        if (!query || query.length < 3) {
            throw new BadRequestException('Query must be at least 3 characters');
        }
        return this.clientService.search(query);
    }

    @Get()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('q') q?: string,
    ) {
        return this.clientService.findAll(parseInt(page, 10) || 1, parseInt(limit, 10) || 50, q);
    }

    @Get(':id')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    findOne(@Param('id') id: string) {
        return this.clientService.findOne(id);
    }

    @Patch(':id')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
        return this.clientService.update(id, updateClientDto);
    }
}
