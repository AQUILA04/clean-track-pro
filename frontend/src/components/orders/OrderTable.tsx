'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import { getSLAStatus } from '../../utils/sla.utils';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { resolveDisplayOrderStatus } from '@/lib/status-labels';
import { useFormatMoney } from '@/context/tenant-config.context';
import { ContentLoader } from '@/components/ui/loading';

interface OrderSummary {
    id: string;
    reference?: string | null;
    client_name: string;
    items_summary: string;
    due_date: string;
    status: string;
    total_price: number;
    service_level: string;
    created_at: string;
    is_late?: boolean;
}

interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

interface OrderTableProps {
    orders: OrderSummary[];
    loading: boolean;
    pagination: PaginationProps;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, loading, pagination }) => {
    const formatMoney = useFormatMoney();

    if (loading) {
        return <ContentLoader label="Chargement des commandes…" />;
    }

    if (orders.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">Aucune commande trouvée.</div>;
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                    <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Référence</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Articles</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Échéance</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                        const sla = getSLAStatus(order.due_date);

                        let rowClass = 'hover:bg-muted/30 transition-colors';
                        if (sla === 'danger') rowClass = 'bg-red-500/10 hover:bg-red-500/20 transition-colors';
                        if (sla === 'warning') rowClass = 'bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors';

                        let dateClass = 'text-sm font-medium text-foreground';
                        if (sla === 'danger') dateClass = 'text-sm font-medium text-red-400';
                        if (sla === 'warning') dateClass = 'text-sm font-medium text-yellow-400';

                        const displayStatus = resolveDisplayOrderStatus(order.status, {
                            isLate: order.is_late || sla === 'danger',
                        });

                        return (
                            <tr key={order.id} className={rowClass}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary font-mono">
                                    <Link href={`/orders/${order.id}`} className="hover:underline">
                                        {formatOrderLabel(order)}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {order.client_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {order.items_summary}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {sla === 'danger' && <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />}
                                        {sla === 'warning' && <Clock className="w-4 h-4 text-yellow-500 mr-2" />}
                                        <span className={dateClass}>
                                            {format(new Date(order.due_date), 'dd/MM HH:mm')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusLabel status={displayStatus} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-foreground">
                                    {formatMoney(order.total_price)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="px-6 py-3 flex items-center justify-between border-t border-border bg-muted/30">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 disabled:opacity-50"
                    >
                        Précédent
                    </button>
                    <button
                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 disabled:opacity-50"
                    >
                        Suivant
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Page <span className="font-medium">{pagination.page}</span> sur{' '}
                            <span className="font-medium">{pagination.totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => pagination.onPageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => pagination.onPageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};
