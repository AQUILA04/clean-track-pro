import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';

const mockUseSession = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
}));

jest.mock('@/components/dashboard/TenantNetworkDashboard', () => ({
    TenantNetworkDashboard: () => <div>Tenant Network Dashboard</div>,
}));

jest.mock('@/components/dashboard/AdminSiteDashboard', () => ({
    AdminSiteDashboard: () => <div>Admin Site Dashboard</div>,
}));

jest.mock('@/components/dashboard/UserSiteOpsHome', () => ({
    UserSiteOpsHome: () => <div>User Site Ops Home</div>,
}));

describe('DashboardPage role routing', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows loading while session is loading', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });
        render(<DashboardPage />);
        expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('renders TenantNetworkDashboard for Admin_Tenant', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { roles: ['Admin_Tenant'] } },
            status: 'authenticated',
        });
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText('Tenant Network Dashboard')).toBeInTheDocument();
        });
    });

    it('renders TenantNetworkDashboard for Superadmin', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { roles: ['Superadmin'] } },
            status: 'authenticated',
        });
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText('Tenant Network Dashboard')).toBeInTheDocument();
        });
    });

    it('renders AdminSiteDashboard for Admin_Site', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { roles: ['Admin_Site'], site_ids: ['site-1'] } },
            status: 'authenticated',
        });
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText('Admin Site Dashboard')).toBeInTheDocument();
        });
    });

    it('renders UserSiteOpsHome for User_Site', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { roles: ['User_Site'], site_ids: ['site-1'] } },
            status: 'authenticated',
        });
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText('User Site Ops Home')).toBeInTheDocument();
        });
    });

    it('prefers TenantNetworkDashboard when user has both Admin_Tenant and Admin_Site', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { roles: ['Admin_Tenant', 'Admin_Site'] } },
            status: 'authenticated',
        });
        render(<DashboardPage />);
        await waitFor(() => {
            expect(screen.getByText('Tenant Network Dashboard')).toBeInTheDocument();
        });
        expect(screen.queryByText('Admin Site Dashboard')).not.toBeInTheDocument();
    });
});
