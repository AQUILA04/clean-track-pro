import { getVisibleNavItems } from '@/lib/navigation';

describe('getVisibleNavItems', () => {
    it('hides tenant admin items for User_Site', () => {
        const items = getVisibleNavItems(['User_Site']);
        const names = items.map((item) => item.name);

        expect(names).not.toContain('Agences');
        expect(names).not.toContain('Utilisateurs');
        expect(names).not.toContain('Catalogue');
        expect(names).not.toContain('Paramètres');
    });

    it('shows operational items for User_Site', () => {
        const items = getVisibleNavItems(['User_Site']);
        const names = items.map((item) => item.name);

        expect(names).toContain('Tableau de bord');
        expect(names).toContain('Commandes');
        expect(names).toContain('Workflow');
        expect(names).toContain('Rangement');
        expect(names).toContain('Dépenses');
    });

    it('shows tenant admin items for Admin_Tenant', () => {
        const items = getVisibleNavItems(['Admin_Tenant']);
        const names = items.map((item) => item.name);

        expect(names).toContain('Agences');
        expect(names).toContain('Utilisateurs');
        expect(names).toContain('Catalogue');
        expect(names).not.toContain('Nouvelle commande');
    });

    it('shows operational and reports items for Admin_Site', () => {
        const items = getVisibleNavItems(['Admin_Site']);
        const names = items.map((item) => item.name);

        expect(names).toContain('Tableau de bord');
        expect(names).toContain('Nouvelle commande');
        expect(names).toContain('Stockage');
        expect(names).toContain('Rapports');
        expect(names).not.toContain('Agences');
        expect(names).not.toContain('Utilisateurs');
    });

    it('supports realm-prefixed roles from Keycloak', () => {
        const items = getVisibleNavItems(['realm:User_Site']);
        const names = items.map((item) => item.name);

        expect(names).not.toContain('Agences');
        expect(names).not.toContain('Utilisateurs');
    });

    it('shows platform admin items for Superadmin, not agency/tenant ops', () => {
        const items = getVisibleNavItems(['Superadmin']);
        const names = items.map((item) => item.name);

        expect(names).toContain('Tableau de bord');
        expect(names).toContain('Tenants');
        expect(names).toContain('Utilisateurs');
        expect(names).toContain('Paramètres');
        expect(names).not.toContain('Agences');
        expect(names).not.toContain('Catalogue');
        expect(names).not.toContain('Rapports');
        expect(names).not.toContain('Nouvelle commande');
    });
});
