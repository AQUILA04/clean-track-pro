
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class RlsService {
    constructor(
        private readonly cls: ClsService,
        private readonly dataSource: DataSource,
    ) { }

    getTenantId(): string | undefined {
        return this.cls.get('tenantId');
    }

    getUserRole(): string | undefined {
        return this.cls.get('userRole');
    }

    async wrapTransaction<T>(
        operation: (manager: EntityManager) => Promise<T>,
    ): Promise<T> {
        return this.dataSource.transaction(async (manager) => {
            const tenantId = this.getTenantId();
            const userRole = this.getUserRole();

            // Validate Tenant ID to prevent SQL Injection
            // UUID regex or strict length check
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (tenantId && uuidRegex.test(tenantId)) {
                await manager.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
            } else if (tenantId) {
                // Log warning if invalid tenant ID found? 
                // For now, strict security: don't set if invalid.
            }

            if (userRole) {
                // Role is internal string from Guard, safer but still sanitize if needed
                // Simple sanitize: alphanumeric check? or just direct for now as it comes from internal map
                await manager.query(`SET LOCAL app.current_role = '${userRole.replace(/'/g, "''")}'`);
            }

            return operation(manager);
        });
    }
}
