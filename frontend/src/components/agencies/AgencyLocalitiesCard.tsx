'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { LocalityService, Locality } from '@/services/locality.service';
import { useToast } from '@/components/ui/simple-toast';
import { getErrorMessage } from '@/lib/api-error';
import { ContentLoader } from '@/components/ui/loading';

interface AgencyLocalitiesCardProps {
    siteId: string;
}

export function AgencyLocalitiesCard({ siteId }: AgencyLocalitiesCardProps) {
    const { toast } = useToast();
    const [localities, setLocalities] = useState<Locality[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const rows = await LocalityService.list(siteId);
            setLocalities(rows);
        } catch (err) {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Impossible de charger les localites'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            await LocalityService.create({ site_id: siteId, name: name.trim() });
            setName('');
            await load();
            toast({ title: 'Ajoutee', description: 'Localite creee.', variant: 'success' });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Creation impossible'),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        try {
            await LocalityService.deactivate(id);
            await load();
        } catch (err) {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Desactivation impossible'),
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Localites de livraison</h2>
            </div>
            <p className="text-sm text-muted-foreground">
                Grouper les commandes domicile par zone pour faciliter les tournees.
            </p>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de la localite"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter
                </button>
            </form>

            {loading ? (
                <ContentLoader label="Chargement des localités…" className="py-4" />
            ) : localities.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucune localite.</div>
            ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                    {localities.map((l) => (
                        <li key={l.id} className="flex items-center justify-between px-3 py-2.5">
                            <div>
                                <span className="text-sm font-medium text-foreground">{l.name}</span>
                                {!l.is_active && (
                                    <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                                )}
                            </div>
                            {l.is_active && (
                                <button
                                    type="button"
                                    onClick={() => handleDeactivate(l.id)}
                                    className="text-muted-foreground hover:text-red-400"
                                    title="Desactiver"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
