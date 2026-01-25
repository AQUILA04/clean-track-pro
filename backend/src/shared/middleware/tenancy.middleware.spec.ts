
import { TenancyMiddleware } from './tenancy.middleware';
import { ClsService } from 'nestjs-cls';
import { Request, Response, NextFunction } from 'express';

describe('TenancyMiddleware', () => {
    let middleware: TenancyMiddleware;
    let clsService: ClsService;

    beforeEach(() => {
        clsService = {
            set: jest.fn(),
        } as any;
        middleware = new TenancyMiddleware(clsService);
    });

    it('should set tenantId in CLS if user has tenant_id', () => {
        const req = {
            user: {
                tenant_id: 'tenant-123',
            },
        } as unknown as Request;
        const res = {} as Response;
        const next = jest.fn();

        middleware.use(req, res, next);

        expect(clsService.set).toHaveBeenCalledWith('tenantId', 'tenant-123');
        expect(next).toHaveBeenCalled();
    });

    it('should not set tenantId if user is missing', () => {
        const req = {} as Request;
        const res = {} as Response;
        const next = jest.fn();

        middleware.use(req, res, next);

        expect(clsService.set).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
});
