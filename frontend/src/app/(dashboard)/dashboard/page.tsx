'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { getSessionRoles, hasAnyRole } from '@/lib/roles';
import { TenantNetworkDashboard } from '@/components/dashboard/TenantNetworkDashboard';
import { AdminSiteDashboard } from '@/components/dashboard/AdminSiteDashboard';
import { UserSiteOpsHome } from '@/components/dashboard/UserSiteOpsHome';

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        );
    }

    const roles = getSessionRoles(session?.user);

    if (hasAnyRole(roles, ['Admin_Tenant', 'Superadmin', 'Super_Admin'])) {
        return <TenantNetworkDashboard />;
    }

    if (hasAnyRole(roles, ['Admin_Site'])) {
        return <AdminSiteDashboard />;
    }

    return <UserSiteOpsHome />;
}
