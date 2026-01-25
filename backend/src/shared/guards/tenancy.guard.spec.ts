
import { TenancyGuard } from './tenancy.guard';
import { ClsService } from 'nestjs-cls';
import { ExecutionContext } from '@nestjs/common';

describe('TenancyGuard', () => {
    let guard: TenancyGuard;
    let clsService: ClsService;

    beforeEach(() => {
        clsService = {
            set: jest.fn(),
        } as any;
        guard = new TenancyGuard(clsService);
    });

    it('should set tenantId when user has one', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { tenant_id: 'tenant-123' }
                })
            })
        } as ExecutionContext;

        guard.canActivate(context);
        expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-123');
        expect(clsService.set).toHaveBeenCalledWith('userRole', 'user');
    });

    it('should set superadmin role when user has it', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: {
                        tenant_id: 'tenant-1',
                        roles: ['superadmin']
                    }
                })
            })
        } as ExecutionContext;

        guard.canActivate(context);
        expect(clsService.set).toHaveBeenCalledWith('userRole', 'superadmin');
    });

    it('should handle missing user gracefully', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: undefined
                })
            })
        } as ExecutionContext;

        guard.canActivate(context);
        expect(clsService.set).not.toHaveBeenCalled();
    });
});
