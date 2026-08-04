import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, CashRegisterSession]),
        KeycloakModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule {}
