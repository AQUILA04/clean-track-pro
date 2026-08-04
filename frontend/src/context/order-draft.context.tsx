'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { calculateOrderTotal, calculateDueDate } from '../utils/pricing.utils';
import { TenantService } from '../services/tenant.service';
import { SiteService } from '../services/site.service';
import { OrdersService } from '../services/orders.service';
import { ServiceLevel, PaymentMethod, DeliveryMode } from '../types/create-order.dto';
import { useToast } from '../components/ui/simple-toast';
import { PrintableOrder } from '../types/printing.types';
import { getErrorMessage } from '../lib/api-error';
import { DEFAULT_TENANT_CURRENCY, normalizeCurrencyCode } from '../lib/currencies';
import { getSiteIdFromSession } from '../lib/roles';

export interface OrderItemDraft {
    articleId: string;
    articleName: string; // Cached for display
    serviceId: string;
    serviceName: string; // Cached for display
    price: number;
    quantity: number;
    icon?: string; // Optional icon for display
}

interface OrderDraftState {
    clientId: string | null;
    clientName: string | null; // Cached for display
    clientPhone: string | null;
    items: OrderItemDraft[];
    isExpress: boolean;
    deliveryMode: DeliveryMode;
    deliveryAddress: string;
    deliveryPhone: string;
    localityId: string | null;
    tenantConfig?: {
        express_multiplier: number;
        express_sla_hours: number;
        currency?: string;
        name?: string;
        logoUrl?: string | null;
        address?: string | null;
        legal_id?: string | null;
        vat_number?: string | null;
    };
    siteName?: string | null;
}

interface OrderDraftContextType extends OrderDraftState {
    setClient: (clientId: string, clientName: string, clientPhone?: string) => void;
    clearClient: () => void;
    addItem: (item: Omit<OrderItemDraft, 'quantity'>) => void;
    updateQuantity: (index: number, delta: number) => void;
    updateService: (index: number, serviceId: string, serviceName: string, price: number) => void;
    removeItem: (index: number) => void;
    clearDraft: () => void;
    toggleExpress: () => void;
    setDeliveryMode: (mode: DeliveryMode) => void;
    setDeliveryAddress: (address: string) => void;
    setDeliveryPhone: (phone: string) => void;
    setLocalityId: (localityId: string | null) => void;
    totalPrice: number;
    estimatedDueDate: Date | null;
    validateOrder: (paymentAmount?: number, paymentMethod?: PaymentMethod, paymentReference?: string) => Promise<void>;
    pendingReceipt: PrintableOrder | null;
    dismissReceipt: () => void;
    pendingStorageOrderId: string | null;
    completeStorageStep: () => void;
}

const OrderDraftContext = createContext<OrderDraftContextType | undefined>(undefined);

// const STORAGE_KEY_PREFIX = 'tenant_default_draft_'; 

export function OrderDraftProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    // Use a tenant-specific key. If no session/tenant, fallback to a generic one (though auth should prevent this).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantId = (session?.user as any)?.tenant_id;
    const storageKey = tenantId ? `tenant_${tenantId}_draft` : 'clean_track_order_draft';

    const [state, setState] = useState<OrderDraftState>({
        clientId: null,
        clientName: null,
        clientPhone: null,
        items: [],
        isExpress: false,
        deliveryMode: DeliveryMode.PICKUP,
        deliveryAddress: '',
        deliveryPhone: '',
        localityId: null,
    });

    const [isLoaded, setIsLoaded] = useState(false);
    const [pendingReceipt, setPendingReceipt] = useState<PrintableOrder | null>(null);
    const [pendingStorageOrderId, setPendingStorageOrderId] = useState<string | null>(null);

    // Load from localStorage on mount or when tenantId changes
    useEffect(() => {
        if (!tenantId) return; // Wait for tenantId

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // eslint-disable-next-line react-hooks/exhaustive-deps
                // eslint-disable-next-line react-hooks/exhaustive-deps
                setState(prev => ({
                    ...parsed,
                    // Ensure new fields exist if loading old state
                    isExpress: parsed.isExpress ?? false,
                    clientPhone: parsed.clientPhone ?? null,
                    deliveryMode: parsed.deliveryMode ?? DeliveryMode.PICKUP,
                    deliveryAddress: parsed.deliveryAddress ?? '',
                    deliveryPhone: parsed.deliveryPhone ?? '',
                    localityId: parsed.localityId ?? null,
                    tenantConfig: prev.tenantConfig // Keep config if we already fetched it, or it will be populated below
                }));
            } catch (e) {
                console.error('Failed to parse order draft', e);
            }
        }
        setIsLoaded(true);
    }, [tenantId, storageKey]);

    // Fetch Tenant Config + current agency name for receipts
    useEffect(() => {
        if (!tenantId) return;
        const fetchConfig = async () => {
            try {
                const tenant = await TenantService.getCurrentTenant();
                let siteName: string | null = null;
                const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);
                if (siteId) {
                    try {
                        const site = await SiteService.getById(siteId);
                        siteName = site.name || null;
                    } catch {
                        siteName = null;
                    }
                }
                setState(prev => ({
                    ...prev,
                    siteName,
                    tenantConfig: {
                        express_multiplier: tenant.express_multiplier,
                        express_sla_hours: tenant.express_sla_hours,
                        currency: normalizeCurrencyCode(tenant.currency),
                        name: tenant.name,
                        logoUrl: tenant.logoUrl ?? null,
                        address: tenant.address ?? null,
                        legal_id: tenant.legal_id ?? null,
                        vat_number: tenant.vat_number ?? null,
                    },
                }));
            } catch (e) {
                console.error('Failed to fetch tenant config', e);
            }
        };
        fetchConfig();
    }, [tenantId, session?.user]);

    // Save to localStorage on change
    useEffect(() => {
        if (isLoaded && tenantId) {
            // Don't persist branding/config — always refresh from API
            const { tenantConfig, siteName, ...toSave } = state;
            localStorage.setItem(storageKey, JSON.stringify(toSave));
        }
    }, [state, isLoaded, tenantId, storageKey]);

    // Derived values
    const totalPrice = React.useMemo(() => {
        return calculateOrderTotal(
            state.items.map(i => ({ price: i.price, quantity: i.quantity })),
            state.isExpress,
            state.tenantConfig || {}
        );
    }, [state.items, state.isExpress, state.tenantConfig]);

    const estimatedDueDate = React.useMemo(() => {
        return calculateDueDate(state.isExpress, state.tenantConfig || {});
    }, [state.isExpress, state.tenantConfig]);

    const toggleExpress = useCallback(() => {
        setState(prev => ({ ...prev, isExpress: !prev.isExpress }));
    }, []);

    const setClient = useCallback((clientId: string, clientName: string, clientPhone?: string) => {
        setState(prev => ({
            ...prev,
            clientId,
            clientName,
            clientPhone: clientPhone ?? null,
            deliveryPhone: prev.deliveryPhone || clientPhone || '',
        }));
    }, []);

    const clearClient = useCallback(() => {
        setState(prev => ({ ...prev, clientId: null, clientName: null, clientPhone: null }));
    }, []);

    const setDeliveryMode = useCallback((mode: DeliveryMode) => {
        setState(prev => ({
            ...prev,
            deliveryMode: mode,
            deliveryPhone:
                mode === DeliveryMode.HOME_DELIVERY
                    ? prev.deliveryPhone || prev.clientPhone || ''
                    : prev.deliveryPhone,
        }));
    }, []);

    const setDeliveryAddress = useCallback((address: string) => {
        setState(prev => ({ ...prev, deliveryAddress: address }));
    }, []);

    const setDeliveryPhone = useCallback((phone: string) => {
        setState(prev => ({ ...prev, deliveryPhone: phone }));
    }, []);

    const setLocalityId = useCallback((localityId: string | null) => {
        setState(prev => ({ ...prev, localityId }));
    }, []);

    const addItem = useCallback((newItem: Omit<OrderItemDraft, 'quantity'>) => {
        setState(prev => {
            // Check if same article+service exists to merge?
            // Usually POS systems merge identical lines.
            const existingIndex = prev.items.findIndex(
                item => item.articleId === newItem.articleId && item.serviceId === newItem.serviceId
            );

            if (existingIndex >= 0) {
                const newItems = [...prev.items];
                newItems[existingIndex].quantity += 1;
                return { ...prev, items: newItems };
            }

            return {
                ...prev,
                items: [...prev.items, { ...newItem, quantity: 1 }],
            };
        });
    }, []);

    const updateQuantity = useCallback((index: number, delta: number) => {
        setState(prev => {
            const newItems = [...prev.items];
            if (newItems[index]) {
                newItems[index].quantity += delta;
                if (newItems[index].quantity <= 0) {
                    newItems.splice(index, 1);
                }
            }
            return { ...prev, items: newItems };
        });
    }, []);

    const updateService = useCallback((index: number, serviceId: string, serviceName: string, price: number) => {
        setState(prev => {
            const item = prev.items[index];
            if (!item || item.serviceId === serviceId) return prev;

            const newItems = [...prev.items];

            // Merge into an existing line with the same article + service
            const existingIndex = newItems.findIndex(
                (i, idx) => idx !== index && i.articleId === item.articleId && i.serviceId === serviceId
            );

            if (existingIndex >= 0) {
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newItems[existingIndex].quantity + item.quantity,
                };
                newItems.splice(index, 1);
                return { ...prev, items: newItems };
            }

            newItems[index] = { ...item, serviceId, serviceName, price };
            return { ...prev, items: newItems };
        });
    }, []);

    const removeItem = useCallback((index: number) => {
        setState(prev => {
            const newItems = [...prev.items];
            newItems.splice(index, 1);
            return { ...prev, items: newItems };
        });
    }, []);

    const clearDraft = useCallback(() => {
        setState({
            clientId: null,
            clientName: null,
            clientPhone: null,
            items: [],
            isExpress: false,
            deliveryMode: DeliveryMode.PICKUP,
            deliveryAddress: '',
            deliveryPhone: '',
            localityId: null,
        });
        setPendingStorageOrderId(null);
        setPendingReceipt(null);
    }, []);

    const dismissReceipt = useCallback(() => {
        setPendingReceipt(null);
    }, []);

    const completeStorageStep = useCallback(() => {
        setPendingStorageOrderId(null);
        clearDraft();
    }, [clearDraft]);

    const { toast } = useToast();

    const validateOrder = useCallback(async (paymentAmount?: number, paymentMethod?: PaymentMethod, paymentReference?: string) => {
        if (!state.clientId) {
            toast({
                title: 'Validation Error',
                description: 'Please select a client first.',
                variant: 'destructive',
            });
            return;
        }
        if (state.items.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Order draft is empty.',
                variant: 'destructive',
            });
            return;
        }

        if (state.deliveryMode === DeliveryMode.HOME_DELIVERY) {
            if (!state.deliveryAddress.trim() || !state.deliveryPhone.trim() || !state.localityId) {
                toast({
                    title: 'Livraison incomplete',
                    description: 'Adresse, telephone et localite sont requis pour une livraison a domicile.',
                    variant: 'destructive',
                });
                return;
            }
        }

        try {
            // Retrieve site_id from session or use tenant_id if site_id is missing (simple tenant-scoped logic)
            // Casting session.user to any to access custom claims that might not be in generic definition yet
            const user = session?.user as any;
            const siteId = user?.site_ids?.[0] || user?.site_id;

            if (!siteId) {
                toast({
                    title: 'Context Error',
                    description: 'Missing Site/Tenant ID in user session.',
                    variant: 'destructive',
                });
                return;
            }

            const createDto: any = {
                site_id: siteId,
                client_id: state.clientId,
                service_level: state.isExpress ? ServiceLevel.EXPRESS : ServiceLevel.NORMAL,
                delivery_mode: state.deliveryMode,
                due_date: estimatedDueDate?.toISOString() || new Date().toISOString(),
                total_price: totalPrice,
                items: state.items.map(item => ({
                    article_type_id: item.articleId,
                    service_definition_id: item.serviceId,
                    quantity: item.quantity,
                    price: item.price
                })),
            };
            if (state.deliveryMode === DeliveryMode.HOME_DELIVERY) {
                createDto.delivery_address = state.deliveryAddress.trim();
                createDto.delivery_phone = state.deliveryPhone.trim();
                createDto.locality_id = state.localityId;
            }
            if (paymentAmount && paymentAmount > 0) {
                createDto.initial_payment_amount = paymentAmount;
                createDto.initial_payment_method = paymentMethod || PaymentMethod.CASH;
                if (paymentReference) createDto.initial_payment_reference = paymentReference;
            }

            await OrdersService.create(createDto).then(async (response) => {
                const orderData = (response as any)?.data ?? response;

                toast({
                    title: 'Order Created',
                    description: 'Order created successfully!',
                    variant: 'success',
                });

                const printPayload: PrintableOrder = {
                    header: {
                        tenantName: state.tenantConfig?.name || 'CleanTrack Pro',
                        siteName: state.siteName || 'Agence',
                        date: new Date().toISOString(),
                        logoUrl: state.tenantConfig?.logoUrl ?? null,
                        address: state.tenantConfig?.address ?? null,
                        legalId: state.tenantConfig?.legal_id ?? null,
                        vatNumber: state.tenantConfig?.vat_number ?? null,
                    },
                    client: {
                        name: state.clientName || 'Unknown Client',
                        phone: state.clientPhone || '',
                        qrCodeValue: orderData.id,
                        reference: orderData.reference || null,
                    },
                    items: state.items.map((item) => {
                        const createdItem = orderData.items?.find((i: any) =>
                            i.article_type_id === item.articleId &&
                            i.service_definition_id === item.serviceId
                        );

                        return {
                            label: item.articleName,
                            service: item.serviceName,
                            price: item.price,
                            qrCodeValue: createdItem?.id || 'unknown-id'
                        };
                    }),
                    totals: {
                        totalPrice: totalPrice,
                        currency: state.tenantConfig?.currency || DEFAULT_TENANT_CURRENCY,
                        dueDate: estimatedDueDate?.toISOString() || '',
                        amountPaid: paymentAmount || 0,
                        balanceDue: totalPrice - (paymentAmount || 0),
                    }
                };

                setPendingReceipt(printPayload);
                setPendingStorageOrderId(orderData.id);
            });

        } catch (error: unknown) {
            console.error('Failed to validate order', error);
            const message = getErrorMessage(error, 'Impossible de créer la commande.');
            toast({
                title: 'Échec de l\'encaissement',
                description: message,
                variant: 'destructive',
            });
            throw error;
        }
    }, [state, estimatedDueDate, totalPrice, session, toast]);

    return (
        <OrderDraftContext.Provider
            value={{
                ...state,
                setClient,
                clearClient,
                addItem,
                updateQuantity,
                updateService,
                removeItem,
                clearDraft,
                toggleExpress,
                setDeliveryMode,
                setDeliveryAddress,
                setDeliveryPhone,
                setLocalityId,
                totalPrice,
                estimatedDueDate,
                validateOrder,
                pendingReceipt,
                dismissReceipt,
                pendingStorageOrderId,
                completeStorageStep,
            }}
        >
            {children}
        </OrderDraftContext.Provider>
    );
}

export function useOrderDraft() {
    const context = useContext(OrderDraftContext);
    if (context === undefined) {
        throw new Error('useOrderDraft must be used within an OrderDraftProvider');
    }
    return context;
}
