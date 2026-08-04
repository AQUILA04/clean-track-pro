import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSignupRequest } from './entities/tenant-signup-request.entity';
import { SignupController } from './controllers/signup.controller';
import { SignupService } from './services/signup.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { SubscriptionPlan } from '../subscription/entities/subscription-plan.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { TenantModule } from '../tenant/tenant.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TenantSignupRequest, SubscriptionPlan, Tenant]),
        TenantModule,
        SubscriptionModule,
        KeycloakModule,
    ],
    controllers: [SignupController],
    providers: [SignupService, StripePaymentService],
    exports: [SignupService],
})
export class SignupModule {}
