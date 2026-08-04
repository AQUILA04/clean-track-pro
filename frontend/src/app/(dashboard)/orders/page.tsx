'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClientOmnibox } from '@/components/clients/ClientOmnibox';
import { ClientRegistrationForm } from '@/components/clients/ClientRegistrationForm';
import { ArticleGrid } from '@/components/orders/ArticleGrid';
import { OrderDraftSummary } from '@/components/orders/OrderDraftSummary';
import { OrderDraftProvider, useOrderDraft } from '@/context/order-draft.context';
import { ShoppingCart, User, UserPlus, X } from 'lucide-react';
import { ReceptionStorageModal } from '@/components/storage/ReceptionStorageModal';
import { ReceiptPreviewModal } from '@/components/orders/ReceiptPreviewModal';
import { Modal } from '@/components/ui/modal';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/simple-toast';
import { ClientService, ClientRecord } from '@/services/client.service';
import { useFormatMoney } from '@/context/tenant-config.context';

type MobilePanel = 'catalog' | 'cart';

function ClientPanel({ compact = false }: { compact?: boolean }) {
    const { setClient, clearClient, clientName } = useOrderDraft();
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [prefill, setPrefill] = useState<{ phone?: string; name?: string }>({});

    const handleClientSelect = (client: { id: string; first_name: string; last_name: string; phone?: string }) => {
        setClient(client.id, `${client.first_name} ${client.last_name}`, client.phone);
    };

    const openQuickAdd = (values?: { phone?: string; name?: string }) => {
        setPrefill(values || {});
        setQuickAddOpen(true);
    };

    const handleCreated = (client: ClientRecord) => {
        setClient(client.id, `${client.first_name} ${client.last_name}`, client.phone);
        setQuickAddOpen(false);
    };

    const nameParts = (prefill.name || '').trim().split(/\s+/).filter(Boolean);

    return (
        <div className={`flex flex-col gap-3 ${compact ? '' : 'p-6 gap-4 h-full'}`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h1 className={`font-bold text-foreground ${compact ? 'text-lg' : 'text-xl'}`}>
                        Nouvelle commande
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Réception Fast-Scan</p>
                </div>
                <button
                    type="button"
                    onClick={() => openQuickAdd()}
                    className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Nouveau client"
                    aria-label="Nouveau client"
                >
                    <UserPlus className="h-5 w-5" />
                </button>
            </div>

            <ClientOmnibox
                onSelect={handleClientSelect}
                onCreateNew={openQuickAdd}
                placeholder="Rechercher un client (nom, téléphone)..."
                className="w-full"
            />

            {clientName ? (
                <div
                    className={`rounded-xl bg-primary/10 border border-primary/20 flex items-start justify-between gap-2 ${
                        compact ? 'px-3 py-2' : 'p-4'
                    }`}
                >
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                            Client sélectionné
                        </p>
                        <p className="font-semibold text-foreground truncate">{clientName}</p>
                    </div>
                    <button
                        type="button"
                        onClick={clearClient}
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Retirer le client"
                        aria-label="Retirer le client"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={`rounded-xl border border-dashed border-border text-center text-muted-foreground text-sm ${
                        compact ? 'px-3 py-2' : 'p-4'
                    }`}
                >
                    {!compact && <User className="h-8 w-8 mx-auto mb-2 opacity-50" />}
                    Sélectionnez un client pour commencer
                </div>
            )}

            <Modal
                isOpen={quickAddOpen}
                onClose={() => setQuickAddOpen(false)}
                title="Nouveau client"
            >
                <ClientRegistrationForm
                    key={`quick-add-${prefill.phone || ''}-${prefill.name || ''}-${quickAddOpen}`}
                    compact
                    defaultValues={{
                        phone: prefill.phone || '',
                        first_name: nameParts[0] || '',
                        last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
                    }}
                    onSuccess={handleCreated}
                    submitLabel="Créer et sélectionner"
                />
            </Modal>
        </div>
    );
}

function ClientPreloadFromQuery() {
    const searchParams = useSearchParams();
    const { setClient, clientId } = useOrderDraft();
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (done) return;
        const paramId = searchParams.get('clientId');
        if (!paramId) {
            setDone(true);
            return;
        }

        const paramName = searchParams.get('clientName');
        let cancelled = false;

        (async () => {
            try {
                if (paramName) {
                    if (!cancelled) setClient(paramId, paramName);
                } else {
                    const client = await ClientService.getById(paramId);
                    if (!cancelled) {
                        setClient(client.id, `${client.first_name} ${client.last_name}`, client.phone);
                    }
                }
            } catch (error) {
                console.error('Failed to preload client', error);
            } finally {
                if (!cancelled) setDone(true);
            }
        })();

        return () => {
            cancelled = true;
        };
        // Intentionally run once when params are available; do not re-run on clientId changes from draft.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, setClient, done]);

    // silence unused — preload may override existing draft client by design
    void clientId;
    return null;
}

function OrderPageContent() {
    const {
        clientId,
        items,
        totalPrice,
        pendingReceipt,
        dismissReceipt,
        pendingStorageOrderId,
        completeStorageStep,
    } = useOrderDraft();
    const { data: session } = useSession();
    const { toast } = useToast();
    const formatMoney = useFormatMoney();
    const [mobilePanel, setMobilePanel] = useState<MobilePanel>('catalog');

    const siteId = (session?.user as any)?.site_ids?.[0] || (session?.user as any)?.site_id || '';
    const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

    return (
        <>
            <Suspense fallback={null}>
                <ClientPreloadFromQuery />
            </Suspense>

            <ReceiptPreviewModal
                isOpen={!!pendingReceipt}
                receipt={pendingReceipt}
                onClose={dismissReceipt}
            />
            <ReceptionStorageModal
                isOpen={!!pendingStorageOrderId && !pendingReceipt}
                orderId={pendingStorageOrderId || ''}
                siteId={siteId}
                onComplete={() => {
                    toast({
                        title: 'Rangement confirmé',
                        description: 'Commande stockée en réception.',
                        variant: 'success',
                    });
                    completeStorageStep();
                }}
                onError={(msg) =>
                    toast({ title: 'Erreur de rangement', description: msg, variant: 'destructive' })
                }
            />

            <div className="fixed inset-0 top-16 md:top-0 md:left-64 z-10 flex flex-col overflow-hidden bg-background">
                <div className="lg:hidden shrink-0 flex border-b border-border bg-card">
                    <button
                        type="button"
                        onClick={() => setMobilePanel('catalog')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 ${
                            mobilePanel === 'catalog'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground'
                        }`}
                    >
                        Articles
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobilePanel('cart')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2 ${
                            mobilePanel === 'cart'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground'
                        }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Panier
                        {itemCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                {itemCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
                    <aside className="hidden xl:flex flex-col border-r border-border bg-card min-h-0 overflow-y-auto">
                        <ClientPanel />
                    </aside>

                    <section
                        className={`min-h-0 flex-col overflow-hidden ${
                            mobilePanel === 'catalog' ? 'flex' : 'hidden'
                        } lg:flex`}
                    >
                        <div className="xl:hidden shrink-0 border-b border-border bg-card p-4">
                            <ClientPanel compact />
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto relative">
                            {!clientId && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex items-center justify-center">
                                    <div className="bg-card p-6 rounded-xl border border-border text-center max-w-md mx-4">
                                        <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                        <h3 className="text-lg font-bold text-foreground mb-2">
                                            Sélectionnez un client
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            Recherchez un client ci-dessus pour activer la grille d&apos;articles.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <ArticleGrid className="max-w-5xl mx-auto" />
                        </div>

                        {itemCount > 0 && (
                            <div className="lg:hidden shrink-0 border-t border-border bg-card p-3">
                                <button
                                    type="button"
                                    onClick={() => setMobilePanel('cart')}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-colors duration-150 hover:bg-blue-600"
                                >
                                    <span className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        {itemCount} article{itemCount > 1 ? 's' : ''}
                                    </span>
                                    <span>{formatMoney(totalPrice)}</span>
                                </button>
                            </div>
                        )}
                    </section>

                    <section
                        className={`min-h-0 flex-col overflow-hidden border-l border-border ${
                            mobilePanel === 'cart' ? 'flex' : 'hidden'
                        } lg:flex`}
                    >
                        <OrderDraftSummary className="h-full min-h-0" />
                    </section>
                </div>
            </div>
        </>
    );
}

export default function OrderPage() {
    return (
        <OrderDraftProvider>
            <OrderPageContent />
        </OrderDraftProvider>
    );
}
