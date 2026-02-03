
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const userAgent = req.get('user-agent') || '';
        const authHeader = req.get('authorization');

        this.logger.log(
            `Incoming Request: ${method} ${originalUrl} - User-Agent: ${userAgent}`,
        );

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
                    this.logger.log(`Parsed JWT Payload: ${payload}`);
                }
            } catch (e) {
                this.logger.error('Failed to parse JWT payload', e);
            }
            this.logger.log(`Authorization Header Present. Token length: ${token.length}`);
        } else {
            this.logger.warn(`Missing or Invalid Authorization Header for ${originalUrl}`);
        }

        next();
    }
}
