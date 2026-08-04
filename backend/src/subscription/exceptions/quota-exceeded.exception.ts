import { ForbiddenException } from '@nestjs/common';
import { QuotaExceededDetails } from '../types/plan-limits.types';

export class QuotaExceededException extends ForbiddenException {
    constructor(details: QuotaExceededDetails) {
        super({
            statusCode: 403,
            error: 'QUOTA_EXCEEDED',
            ...details,
        });
    }
}
