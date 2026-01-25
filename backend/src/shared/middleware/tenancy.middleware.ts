
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenancyMiddleware.name);

    constructor(private readonly cls: ClsService) { }

    use(req: Request, res: Response, next: NextFunction) {
        // Placeholder logic
        const user = (req as any).user;
        if (user && user.tenant_id) {
            this.cls.set('tenantId', user.tenant_id);
        }
        next();
    }
}
