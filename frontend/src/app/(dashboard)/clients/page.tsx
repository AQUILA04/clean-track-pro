'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { Eye, Pencil, Plus, Search } from 'lucide-react';
import { ClientService, ClientRecord } from '@/services/client.service';

export default function ClientsListPage() {
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const fetchClients = useCallback(async (page: number, q?: string) => {
        setLoading(true);
        try {
            const result = await ClientService.list({
                page,
                limit: 20,
                q: q && q.trim().length >= 2 ? q.trim() : undefined,
            });
            setClients(result.data);
            setPagination({
                page: result.meta.page,
                limit: result.meta.limit,
                total: result.meta.total,
                totalPages: result.meta.totalPages,
            });
        } catch (error) {
            console.error('Failed to fetch clients', error);
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients(1, debouncedQuery);
    }, [debouncedQuery, fetchClients]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Clients</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Liste des clients du tenant — recherche par nom, prénom ou téléphone.
                    </p>
                </div>
                <Link
                    href="/clients/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau client
                </Link>
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher (nom, prénom, téléphone)..."
                    className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Nom
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Prénom
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Téléphone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Agence de création
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                                        Aucun client trouvé.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            {client.unique_code}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">{client.last_name}</td>
                                        <td className="px-4 py-3 text-foreground">{client.first_name}</td>
                                        <td className="px-4 py-3 text-foreground">{client.phone}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{client.email || '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {client.site_name || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/clients/${client.id}`}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                                    title="Voir"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Voir
                                                </Link>
                                                <Link
                                                    href={`/clients/${client.id}/edit`}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Modifier
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
                        <span>
                            Page {pagination.page} / {pagination.totalPages} — {pagination.total} client
                            {pagination.total > 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={pagination.page <= 1 || loading}
                                onClick={() => fetchClients(pagination.page - 1, debouncedQuery)}
                                className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
                            >
                                Précédent
                            </button>
                            <button
                                type="button"
                                disabled={pagination.page >= pagination.totalPages || loading}
                                onClick={() => fetchClients(pagination.page + 1, debouncedQuery)}
                                className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
