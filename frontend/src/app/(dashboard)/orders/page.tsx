'use client';

import React from 'react';
import { ClientOmnibox } from '@/components/clients/ClientOmnibox';
import { ArticleGrid } from '@/components/orders/ArticleGrid';
import { OrderDraftSummary } from '@/components/orders/OrderDraftSummary';
import { OrderDraftProvider, useOrderDraft } from '@/context/order-draft.context';

function OrderPageContent() {
    const { setClient, clientId } = useOrderDraft();

    const handleClientSelect = (client: any) => {
        setClient(client.id, `${client.first_name} ${client.last_name}`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header / Client Selection */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-xl font-bold text-gray-800 mb-4 px-1">New Order</h1>
                    <ClientOmnibox
                        onSelect={handleClientSelect}
                        placeholder="Search Client (Name, Phone) or Create New..."
                        className="w-full"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Overlay if no client selected */}
                {!clientId && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 text-center max-w-md mx-4">
                            <div className="text-4xl mb-4">👤</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Select a Client First</h3>
                            <p className="text-gray-500">Please search for a client above to enable the article selection grid.</p>
                        </div>
                    </div>
                )}

                {/* Article Grid (Left) */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <ArticleGrid className="max-w-4xl mx-auto" />
                </div>

                {/* Order Summary (Right) */}
                <div className="w-96 bg-white border-l border-gray-200 shadow-lg relative z-30">
                    <OrderDraftSummary className="h-full" />
                </div>
            </div>
        </div>
    );
}

export default function OrderPage() {
    return (
        <OrderDraftProvider>
            <OrderPageContent />
        </OrderDraftProvider>
    );
}
