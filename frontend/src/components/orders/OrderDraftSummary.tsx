'use client';

import React from 'react';
import { useOrderDraft } from '../../context/order-draft.context';

interface OrderDraftSummaryProps {
    className?: string;
}

export const OrderDraftSummary: React.FC<OrderDraftSummaryProps> = ({ className }) => {
    const { items, clientName, updateQuantity, clearDraft } = useOrderDraft();

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className={`bg-white border-l border-gray-200 h-full flex flex-col ${className}`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 className="font-semibold text-lg text-gray-800">Current Order</h2>
                {items.length > 0 && (
                    <button
                        onClick={clearDraft}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="p-4 bg-blue-50 border-b border-blue-100">
                <span className="text-sm text-gray-600">Customer:</span>
                <div className="font-bold text-gray-900 truncate">
                    {clientName || <span className="text-gray-400 italic">No client selected</span>}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {items.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p>No items added.</p>
                        <p className="text-sm">Select a client and tap articles to add.</p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <div key={`${item.articleId}-${item.serviceId}-${index}`} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.articleName}</div>
                                <div className="text-xs text-gray-500">{item.serviceName}</div>
                                <div className="text-sm font-semibold text-gray-700 mt-1">
                                    {(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => updateQuantity(index, -1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center font-medium">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(index, 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-300 text-green-600 hover:bg-green-50"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-bold">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-gray-900 mb-4">
                    <span>Total</span>
                    <span>{total.toFixed(2)}</span>
                </div>
                <button
                    disabled={items.length === 0 || !clientName}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                    Checkout (Draft)
                </button>
            </div>
        </div>
    );
};
