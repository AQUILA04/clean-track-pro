import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard, Public, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../../auth/decorators/current-user.decorator';
import { Response } from '../../shared/response/response.builder';
import { SignupService } from '../services/signup.service';
import { SubmitSignupDto } from '../dto/submit-signup.dto';
import { RejectSignupDto } from '../dto/reject-signup.dto';
import { SignupRequestStatus } from '../enums/signup-request-status.enum';

@Controller('signup')
export class SignupController {
    constructor(private readonly signupService: SignupService) {}

    @Get('plans')
    @Public()
    async listPublicPlans() {
        const plans = await this.signupService.listPublicPlans();
        return Response.builder().status(HttpStatus.OK).data(plans).build();
    }

    @Post()
    @Public()
    async submit(@Body() dto: SubmitSignupDto) {
        const result = await this.signupService.submit(dto);
        return Response.builder().status(HttpStatus.CREATED).data(result).build();
    }

    @Get('checkout/complete')
    @Public()
    async completeCheckout(@Query('session_id') sessionId: string) {
        const result = await this.signupService.completePayment(sessionId);
        return Response.builder().status(HttpStatus.OK).data(result).build();
    }

    @Get('requests')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async listRequests(@Query('status') status?: SignupRequestStatus) {
        const requests = await this.signupService.listRequests(status);
        return Response.builder().status(HttpStatus.OK).data(requests).build();
    }

    @Post('requests/:id/approve')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        const request = await this.signupService.approve(id, user.id);
        return Response.builder().status(HttpStatus.OK).data(request).build();
    }

    @Post('requests/:id/reject')
    @UseGuards(AuthGuard, RoleGuard)
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async reject(
        @Param('id') id: string,
        @Body() dto: RejectSignupDto,
        @CurrentUser() user: AuthUser,
    ) {
        const request = await this.signupService.reject(id, user.id, dto.reason);
        return Response.builder().status(HttpStatus.OK).data(request).build();
    }
}
