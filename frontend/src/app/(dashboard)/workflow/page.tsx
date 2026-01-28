'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OrdersService } from '@/services/orders.service';
import { toast } from 'sonner';

// Define types locally for now since we don't have shared types set up yet
type OrderStatus = 'CREATED' | 'IN_PROGRESS' | 'READY' | 'STORED' | 'DELIVERED' | 'CANCELLED';

interface Order {
    id: string;
    status: OrderStatus;
    total_price: number;
    due_date: string;
    items: any[];
    client_id: string;
}

export default function WorkflowPage() {
    const [scanBuffer, setScanBuffer] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [inputFocused, setInputFocused] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus management for hidden input
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current) {
                inputRef.current.focus();
                setInputFocused(true);
            }
        };

        focusInput();
        window.addEventListener('click', focusInput);
        return () => window.removeEventListener('click', focusInput);
    }, []);

    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!scanBuffer.trim()) return;

            await fetchOrder(scanBuffer.trim());
            setScanBuffer('');
        }
    };

    const fetchOrder = async (id: string) => {
        setLoading(true);
        try {
            const data = await OrdersService.getById(id);
            setOrder(data);
            toast.success('Order loaded');
        } catch (error) {
            console.error('Scan error:', error);
            toast.error('Order not found or access denied');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        if (!order) return;

        try {
            const updatedOrder = await OrdersService.updateStatus(order.id, newStatus);
            setOrder(updatedOrder);
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update status');
        }
    };

    const getNextActions = (currentStatus: OrderStatus): OrderStatus[] => {
        const transitions: Record<OrderStatus, OrderStatus[]> = {
            'CREATED': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['READY', 'CANCELLED'],
            'READY': ['STORED', 'DELIVERED', 'CANCELLED'],
            'STORED': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],
            'CANCELLED': []
        };
        return transitions[currentStatus] || [];
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Workflow Scanner</h1>

            {/* Hidden Scanner Input */}
            <div className="relative mb-8">
                <input
                    ref={inputRef}
                    type="text"
                    value={scanBuffer}
                    onChange={(e) => setScanBuffer(e.target.value)}
                    onKeyDown={handleScan}
                    onBlur={() => setInputFocused(false)}
                    className="absolute opacity-0 w-0 h-0"
                    autoFocus
                    aria-label="Scanner Input"
                />
                <div className={`p-4 border-2 rounded-lg text-center ${inputFocused ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                    <p className="text-lg font-medium text-gray-700">
                        {inputFocused ? 'Ready to Scan' : 'Click anywhere to enable scanner'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Scan an order barcode or type ID and press Enter
                    </p>
                </div>
            </div>

            {loading && <div className="text-center py-8">Loading...</div>}

            {order && (
                <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Order ID</h2>
                            <p className="text-lg font-mono">{order.id}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Current Status</h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.status === 'READY' ? 'bg-green-100 text-green-800' :
                                    order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Client</h2>
                            <p className="text-lg">{order.client_id}</p>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-500">Total Price</h2>
                            <p className="text-lg font-bold">${Number(order.total_price).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-md font-medium mb-4">Available Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            {getNextActions(order.status).map((action) => (
                                <button
                                    key={action}
                                    onClick={() => handleUpdateStatus(action)}
                                    className={`px-4 py-2 rounded-md font-medium text-white shadow-sm transition-colors ${action === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    Mark as {action}
                                </button>
                            ))}
                        </div>
                        {getNextActions(order.status).length === 0 && (
                            <p className="text-gray-500 italic">No further actions available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
