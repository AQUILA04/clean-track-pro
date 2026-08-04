import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { Payment } from '../payments/entities/payment.entity';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CashRegisterSession, Payment]),
        KeycloakModule,
    ],
    controllers: [CashRegisterController],
    providers: [CashRegisterService],
    exports: [CashRegisterService],
})
export class CashRegisterModule {}
