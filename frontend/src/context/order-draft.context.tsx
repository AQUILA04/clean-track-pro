'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { calculateOrderTotal, calculateDueDate } from '../utils/pricing.utils';
import { TenantService } from '../services/tenant.service';

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
    items: OrderItemDraft[];
    isExpress: boolean;
    tenantConfig?: { express_multiplier: number; express_sla_hours: number };
}

interface OrderDraftContextType extends OrderDraftState {
    setClient: (clientId: string, clientName: string) => void;
    addItem: (item: Omit<OrderItemDraft, 'quantity'>) => void;
    updateQuantity: (index: number, delta: number) => void;
    updateService: (index: number, serviceId: string, serviceName: string, price: number) => void;
    removeItem: (index: number) => void;
    clearDraft: () => void;
    toggleExpress: () => void;
    totalPrice: number;
    estimatedDueDate: Date | null;
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
        items: [],
        isExpress: false,
    });

    const [isLoaded, setIsLoaded] = useState(false);

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
                    tenantConfig: prev.tenantConfig // Keep config if we already fetched it, or it will be populated below
                }));
            } catch (e) {
                console.error('Failed to parse order draft', e);
            }
        }
        setIsLoaded(true);
    }, [tenantId, storageKey]);

    // Fetch Tenant Config
    useEffect(() => {
        if (!tenantId) return;
        const fetchConfig = async () => {
            try {
                const tenant = await TenantService.getCurrentTenant();
                setState(prev => ({
                    ...prev,
                    tenantConfig: {
                        express_multiplier: tenant.express_multiplier,
                        express_sla_hours: tenant.express_sla_hours
                    }
                }));
            } catch (e) {
                console.error('Failed to fetch tenant config', e);
            }
        };
        fetchConfig();
    }, [tenantId]);

    // Save to localStorage on change
    useEffect(() => {
        if (isLoaded && tenantId) {
            // Don't save tenantConfig to localstorage necessarily, mainly data
            const { tenantConfig, ...toSave } = state;
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

    const setClient = useCallback((clientId: string, clientName: string) => {
        setState(prev => ({ ...prev, clientId, clientName }));
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
            const newItems = [...prev.items];
            if (newItems[index]) {
                newItems[index] = { ...newItems[index], serviceId, serviceName, price };
            }
            return { ...prev, items: newItems };
        })
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
            items: [],
        });
    }, []);

    return (
        <OrderDraftContext.Provider
            value={{
                ...state,
                setClient,
                addItem,
                updateQuantity,
                updateService,
                removeItem,
                clearDraft,
                toggleExpress,
                totalPrice,
                estimatedDueDate
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
