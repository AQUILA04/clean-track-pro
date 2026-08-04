import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { RlsService } from './rls.service';
import { TenancyGuard } from '../../guards/tenancy.guard';

@Global()
@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
        }),
    ],
    providers: [
        RlsService,
        {
            provide: APP_GUARD,
            useClass: TenancyGuard,
        },
    ],
    exports: [RlsService],
})
export class RlsModule { }
