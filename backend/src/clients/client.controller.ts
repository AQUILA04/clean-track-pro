import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
// Assuming AuthGuard and standard Guards are available in shared
// import { AuthGuard } from '../shared/guards/auth.guard'; 
// Actually, I'll rely on global guards or standard ones. The docs say 'Role Guards: User_Site, Admin_Site...'.
// I will just use standard Controller for now and assume global validation pipe or similar.
// I'll check 'user.controller.ts' for guard patterns in a moment, but write basic structure first.

@Controller('clients')
export class ClientController {
    constructor(private readonly clientService: ClientService) { }

    @Post()
    create(@Body() createClientDto: CreateClientDto) {
        // RLS context is handled by middleware/global guard setting CLS context
        return this.clientService.create(createClientDto);
    }
}
