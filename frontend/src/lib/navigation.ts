import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Store,
    ShoppingBag,
    Users,
    UsersRound,
    BarChart3,
    Settings,
    ScanLine,
    Package,
    Truck,
    Workflow,
    Building2,
    Banknote,
    Wallet,
    CreditCard,
    ClipboardList,
    Receipt,
    MapPin,
    Bell,
} from 'lucide-react';
import { hasAnyRole } from '@/lib/roles';

export type NavItem = {
    name: string;
    href: string;
    icon: LucideIcon;
    allowedRoles: string[];
};

export const NAV_ITEMS: NavItem[] = [
    {
        name: 'Tableau de bord',
        href: '/dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['Admin_Tenant', 'Admin_Site', 'User_Site', 'Livreur', 'Superadmin', 'Super_Admin'],
    },
    {
        name: 'Tenants',
        href: '/admin/tenants',
        icon: Building2,
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        name: 'Plans',
        href: '/admin/plans',
        icon: CreditCard,
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        name: 'Inscriptions',
        href: '/admin/signup-requests',
        icon: ClipboardList,
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        name: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
        allowedRoles: ['Superadmin', 'Super_Admin'],
    },
    {
        name: 'Nouvelle commande',
        href: '/orders',
        icon: ShoppingBag,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Commandes',
        href: '/orders/active',
        icon: Package,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Workflow',
        href: '/workflow',
        icon: Workflow,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Stockage',
        href: '/storage',
        icon: Store,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Rangement',
        href: '/storage/scan',
        icon: ScanLine,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Livraison',
        href: '/storage/delivery',
        icon: Truck,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Tournées',
        href: '/deliveries',
        icon: MapPin,
        allowedRoles: ['Livreur', 'User_Site', 'Admin_Site'],
    },
    {
        name: 'Clients',
        href: '/clients',
        icon: UsersRound,
        allowedRoles: ['User_Site', 'Admin_Site', 'Admin_Tenant'],
    },
    {
        name: 'Agences',
        href: '/agencies',
        icon: Store,
        allowedRoles: ['Admin_Tenant'],
    },
    {
        name: 'Catalogue',
        href: '/catalogue',
        icon: ShoppingBag,
        allowedRoles: ['Admin_Tenant'],
    },
    {
        name: 'Utilisateurs',
        href: '/users',
        icon: Users,
        allowedRoles: ['Admin_Tenant', 'Superadmin', 'Super_Admin'],
    },
    {
        name: 'Ma Caisse',
        href: '/cash-register',
        icon: Banknote,
        allowedRoles: ['User_Site', 'Admin_Site'],
    },
    {
        name: 'Dépenses',
        href: '/expenses',
        icon: Receipt,
        allowedRoles: ['User_Site', 'Admin_Site', 'Admin_Tenant'],
    },
    {
        name: 'Finance',
        href: '/finance',
        icon: Wallet,
        allowedRoles: ['Admin_Site', 'Admin_Tenant'],
    },
    {
        name: 'Rapports',
        href: '/reports',
        icon: BarChart3,
        allowedRoles: ['Admin_Tenant', 'Admin_Site'],
    },
    {
        name: 'Paramètres',
        href: '/settings',
        icon: Settings,
        allowedRoles: ['Admin_Tenant', 'Superadmin', 'Super_Admin'],
    },
    {
        name: 'Canaux notif.',
        href: '/settings/notifications',
        icon: Bell,
        allowedRoles: ['Admin_Tenant'],
    },
];

export function getVisibleNavItems(userRoles: unknown): NavItem[] {
    return NAV_ITEMS.filter((item) => hasAnyRole(userRoles, item.allowedRoles));
}
