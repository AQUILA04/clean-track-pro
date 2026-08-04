/** Route → roles map without UI imports (safe for Edge middleware). */
export type RouteAccessRule = {
    href: string;
    allowedRoles: string[];
};

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
    {
        href: '/dashboard',
        allowedRoles: ['Admin_Tenant', 'Admin_Site', 'User_Site', 'Superadmin', 'Super_Admin'],
    },
    {
        href: '/admin/tenants',
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        href: '/admin/plans',
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        href: '/admin/signup-requests',
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        href: '/orders',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/orders/active',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/workflow',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/storage',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/storage/scan',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/storage/delivery',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/clients',
        allowedRoles: ['User_Site', 'Admin_Site', 'Admin_Tenant'],
    },
    {
        href: '/agencies',
        allowedRoles: ['Admin_Tenant'],
    },
    {
        href: '/catalogue',
        allowedRoles: ['Admin_Tenant'],
    },
    {
        href: '/users',
        allowedRoles: ['Admin_Tenant', 'Superadmin', 'Super_Admin'],
    },
    {
        href: '/cash-register',
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        href: '/expenses/types',
        allowedRoles: ['Admin_Tenant', 'Admin_Site'],
    },
    {
        href: '/expenses',
        allowedRoles: ['User_Site', 'Admin_Site', 'Admin_Tenant'],
    },
    {
        href: '/finance',
        allowedRoles: ['Admin_Site', 'Admin_Tenant'],
    },
    {
        href: '/reports',
        allowedRoles: ['Admin_Tenant', 'Admin_Site'],
    },
    {
        href: '/settings',
        allowedRoles: ['Admin_Tenant', 'Superadmin', 'Super_Admin'],
    },
];
