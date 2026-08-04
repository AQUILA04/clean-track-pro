'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { UserService, User } from '@/services/user.service';
import { SiteService, Site } from '@/services/site.service';
import { WashingMachine, ChevronDown } from 'lucide-react';
import { getRoleDisplayLabel } from '@/lib/roles';

interface EditUserModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
    isSuperadmin?: boolean;
    tenantId?: string;
}

const selectClassName =
    'w-full appearance-none rounded-lg border border-border py-2.5 px-3 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export const EditUserModal: React.FC<EditUserModalProps> = ({
    isOpen,
    user,
    onClose,
    onSuccess,
    isSuperadmin = false,
    tenantId,
}) => {
    const [role, setRole] = useState('Admin_Site');
    const [siteId, setSiteId] = useState('');
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !user) return;

        setRole(user.role ?? 'Admin_Site');
        setSiteId(user.attributes?.site_ids?.[0] ?? '');
        setError(null);

        if (!isSuperadmin) {
            SiteService.getAll()
                .then(setSites)
                .catch(() => setError('Impossible de charger les agences.'));
        }
    }, [isOpen, user, isSuperadmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (isSuperadmin) {
                await UserService.updateUser(
                    user.id,
                    {},
                    tenantId ? { tenantId } : undefined,
                );
            } else {
                if (!siteId) {
                    throw new Error('Sélectionnez une agence');
                }
                await UserService.updateUser(user.id, {
                    role,
                    siteId,
                });
            }
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Échec de la mise à jour';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-[500px] p-8 relative">
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4 text-white">
                        <WashingMachine className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground text-center">Modifier l&apos;utilisateur</h2>
                    <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs mx-auto">
                        {fullName}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Adresse e-mail</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full rounded-lg border border-border bg-muted/30 py-2.5 px-3 text-sm text-muted-foreground cursor-not-allowed"
                        />
                    </div>

                    {isSuperadmin ? (
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1.5">Rôle</label>
                            <input
                                type="text"
                                value={getRoleDisplayLabel('Admin_Tenant')}
                                disabled
                                className="w-full rounded-lg border border-border bg-muted/30 py-2.5 px-3 text-sm text-muted-foreground cursor-not-allowed"
                            />
                            <p className="mt-2 text-xs text-muted-foreground">
                                Les comptes Admin ne peuvent être modifiés que via la suppression et une nouvelle invitation.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1.5">Rôle</label>
                                <div className="relative">
                                    <select
                                        className={selectClassName}
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="Admin_Site">{getRoleDisplayLabel('Admin_Site')}</option>
                                        <option value="User_Site">{getRoleDisplayLabel('User_Site')}</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-1.5">
                                    Agence assignée
                                </label>
                                <div className="relative">
                                    <select
                                        className={selectClassName}
                                        value={siteId}
                                        onChange={(e) => setSiteId(e.target.value)}
                                        required
                                    >
                                        <option value="">Sélectionner une agence</option>
                                        {sites.map((site) => (
                                            <option key={site.id} value={site.id}>
                                                {site.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col space-y-3 mt-8 pt-2">
                        {!isSuperadmin && (
                            <Button type="submit" isLoading={loading} className="w-full">
                                Enregistrer les modifications
                            </Button>
                        )}
                        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                            {isSuperadmin ? 'Fermer' : 'Annuler'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
