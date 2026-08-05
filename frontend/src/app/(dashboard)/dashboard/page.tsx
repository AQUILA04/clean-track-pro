'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { getSessionRoles, hasAnyRole } from '@/lib/roles';
import { TenantNetworkDashboard } from '@/components/dashboard/TenantNetworkDashboard';
import { AdminSiteDashboard } from '@/components/dashboard/AdminSiteDashboard';
import { UserSiteOpsHome } from '@/components/dashboard/UserSiteOpsHome';
import { PageLoader } from '@/components/ui/loading';

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <PageLoader />;
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
