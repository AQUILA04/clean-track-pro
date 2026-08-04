'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserService } from '@/services/user.service';
import { TenantService, Tenant } from '@/services/tenant.service';
import { SiteService, Site } from '@/services/site.service';
import { WashingMachine, X, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasAnyRole, getRoleDisplayLabel, getSessionRoles } from '@/lib/roles';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** Pre-selected tenant for Superadmin flows */
    defaultTenantId?: string;
}

const selectClassName =
    'w-full appearance-none rounded-lg border border-border py-2.5 px-3 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    defaultTenantId = '',
}) => {
    const { data: session } = useSession();
    const userRoles = getSessionRoles(session?.user);
    const isSuperadmin = hasAnyRole(userRoles, ['Superadmin', 'Super_Admin']);

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState(isSuperadmin ? 'Admin_Tenant' : 'Admin_Site');
    const [tenantId, setTenantId] = useState(defaultTenantId);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedAgencies, setSelectedAgencies] = useState<{ id: string; name: string }[]>([]);
    const [agencyInput, setAgencyInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        setEmail('');
        setFirstName('');
        setLastName('');
        setError(null);
        setSelectedAgencies([]);
        setAgencyInput('');
        setRole(isSuperadmin ? 'Admin_Tenant' : 'Admin_Site');
        setTenantId(defaultTenantId);

        if (isSuperadmin) {
            TenantService.getAll()
                .then(setTenants)
                .catch(() => setError('Impossible de charger les tenants.'));
        } else {
            SiteService.getAll()
                .then(setSites)
                .catch(() => setError('Impossible de charger les agences.'));
        }
    }, [isOpen, isSuperadmin, defaultTenantId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSuperadmin) {
                if (!tenantId) {
                    throw new Error('Sélectionnez un tenant');
                }
                await UserService.inviteUser({
                    email,
                    role: 'Admin_Tenant',
                    tenantId,
                });
            } else {
                const siteId = selectedAgencies[0]?.id;
                if (!siteId) {
                    throw new Error('Sélectionnez au moins une agence');
                }
                if (!firstName.trim() || !lastName.trim()) {
                    throw new Error('Le prénom et le nom sont obligatoires');
                }
                await UserService.inviteUser({
                    email,
                    role,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    siteId,
                    agencyIds: selectedAgencies.map((a) => a.id),
                });
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Échec de l'invitation";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgency = (agencyId: string) => {
        const agency = sites.find((a) => a.id === agencyId);
        if (!agency) return;

        if (selectedAgencies.some((a) => a.id === agencyId)) {
            setSelectedAgencies(selectedAgencies.filter((a) => a.id !== agencyId));
        } else {
            setSelectedAgencies([...selectedAgencies, { id: agency.id, name: agency.name }]);
            setAgencyInput('');
            setIsDropdownOpen(false);
        }
        inputRef.current?.focus();
    };

    const filteredAgencies = sites.filter(
        (agency) =>
            !selectedAgencies.some((sa) => sa.id === agency.id) &&
            agency.name.toLowerCase().includes(agencyInput.toLowerCase()),
    );

    const selectedTenant = tenants.find((tenant) => tenant.id === tenantId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-[500px] p-8 relative">
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4 text-white">
                        <WashingMachine className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground text-center">
                        {isSuperadmin ? 'Inviter un administrateur' : 'Inviter un nouvel utilisateur'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs mx-auto">
                        {isSuperadmin
                            ? 'Créez un administrateur rattaché à un tenant.'
                            : 'Envoyez une invitation par e-mail pour rejoindre le réseau.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Adresse e-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemple@domaine.fr"
                        required
                    />

                    {isSuperadmin ? (
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                Tenant
                            </label>
                            <div className="relative">
                                <select
                                    className={selectClassName}
                                    value={tenantId}
                                    onChange={(e) => setTenantId(e.target.value)}
                                    required
                                >
                                    <option value="">Sélectionner un tenant</option>
                                    {tenants.map((tenant) => (
                                        <option key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Rôle assigné :{' '}
                                <span className="font-medium text-foreground">{getRoleDisplayLabel('Admin_Tenant')}</span>
                            </p>
                            {selectedTenant && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Identité Keycloak :{' '}
                                    <span className="font-medium text-foreground">
                                        Admin {selectedTenant.name}
                                    </span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Prénom"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Jean"
                                    required
                                />
                                <Input
                                    label="Nom"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Dupont"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1.5">
                                    Rôle
                                </label>
                                <div className="relative">
                                    <select
                                        className={selectClassName}
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="Admin_Site">{getRoleDisplayLabel('Admin_Site')}</option>
                                        <option value="User_Site">{getRoleDisplayLabel('User_Site')}</option>
                                        <option value="Livreur">{getRoleDisplayLabel('Livreur')}</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <div ref={dropdownRef} className="relative">
                                <label className="block text-sm font-semibold text-foreground mb-1.5">
                                    Agences assignées
                                </label>
                                <div
                                    className="rounded-lg border border-border px-3 py-2 min-h-[42px] bg-card transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 cursor-text"
                                    onClick={() => inputRef.current?.focus()}
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAgencies.map((agency) => (
                                            <span
                                                key={agency.id}
                                                className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                                            >
                                                {agency.name}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleAgency(agency.id);
                                                    }}
                                                    className="ml-1.5 text-primary/60 hover:text-primary focus:outline-none"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground py-0.5"
                                            placeholder={
                                                selectedAgencies.length === 0 ? 'Ajouter une agence...' : ''
                                            }
                                            value={agencyInput}
                                            onChange={(e) => setAgencyInput(e.target.value)}
                                            onFocus={() => setIsDropdownOpen(true)}
                                        />
                                    </div>
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg shadow-lg bg-card max-h-40 overflow-y-auto z-20">
                                        {filteredAgencies.length > 0 ? (
                                            filteredAgencies.map((agency) => (
                                                <div
                                                    key={agency.id}
                                                    className="px-3 py-2 text-sm text-foreground hover:bg-muted/50 cursor-pointer"
                                                    onClick={() => toggleAgency(agency.id)}
                                                >
                                                    {agency.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground italic text-center">
                                                Aucune agence trouvée
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col space-y-3 mt-8 pt-2">
                        <Button type="submit" isLoading={loading} className="w-full">
                            Envoyer l&apos;invitation
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                            Annuler
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
