import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRemittance } from './entities/cash-remittance.entity';
import { SiteRemittance } from './entities/site-remittance.entity';
import { RemittancesService } from './remittances.service';
import { RemittancesController } from './remittances.controller';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CashRemittance, SiteRemittance, CashRegisterSession]),
        KeycloakModule,
    ],
    controllers: [RemittancesController],
    providers: [RemittancesService],
    exports: [RemittancesService],
})
export class RemittancesModule {}
