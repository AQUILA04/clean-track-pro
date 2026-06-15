'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { StorageService, StorageSlot, StorageSlotStatus } from '@/services/storage.service';
import { OrdersService } from '@/services/orders.service';
import { useToast } from '@/components/ui/simple-toast';
import { ScannerInput, ScannerInputHandle } from '@/components/shared/ScannerInput';

export default function StorageScannerPage() {
    const { data: session } = useSession();
    const { toast } = useToast();

    // State
    const [orderInput, setOrderInput] = useState('');
    const [slotInput, setSlotInput] = useState('');
    const [scannedOrder, setScannedOrder] = useState<any | null>(null);
    const [slots, setSlots] = useState<StorageSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Refs
    const orderInputRef = useRef<ScannerInputHandle>(null);
    const slotInputRef = useRef<ScannerInputHandle>(null);

    // Load Slots on Mount
    useEffect(() => {
        const fetchSlots = async () => {
            const user = session?.user;
            const siteId = user?.site_id || user?.tenant_id;

            if (siteId) {
                try {
                    const loadedSlots = await StorageService.getAll(siteId);
                    setSlots(loadedSlots);
                } catch (error) {
                    console.error('Failed to load storage slots', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to load storage slots map.',
                        variant: 'destructive',
                    });
                }
            }
            setInitializing(false);
        };

        if (session) {
            fetchSlots();
        }
    }, [session, toast]);

    // Handle Order Scan (Enter Key)
    const handleOrderSubmit = async () => {
        if (!orderInput.trim()) return;

        setLoading(true);
        try {
            // Fetch order details
            // Order Input could be the UUID directly or a QR code value
            const response = await OrdersService.getById(orderInput.trim());
            const order = response.data || response; // Handle API wrapping

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status !== 'READY' && order.status !== 'STORED') {
                toast({
                    title: 'Invalid Status',
                    description: `Order is ${order.status}. Must be READY.`,
                    variant: 'destructive'
                });
                setScannedOrder(null);
                setOrderInput('');
                return;
            }

            setScannedOrder(order);
            // Move focus to Slot Input
            setTimeout(() => slotInputRef.current?.focus(), 100);

        } catch (error) {
            toast({
                title: 'Scan Error',
                description: 'Order not found or invalid.',
                variant: 'destructive'
            });
            setScannedOrder(null);
            setOrderInput(''); // Ask user to scan again
            orderInputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Handle Slot Scan (Enter Key)
    const handleSlotSubmit = async () => {
        if (!slotInput.trim() || !scannedOrder) return;

        setLoading(true);
        try {
            // Find slot UUID by name (Scanner input)
            const targetSlot = slots.find(s => s.name.toUpperCase() === slotInput.trim().toUpperCase());

            if (!targetSlot) {
                throw new Error('Slot label not found in system.');
            }

            if (targetSlot.status !== StorageSlotStatus.FREE && targetSlot.status !== StorageSlotStatus.OCCUPIED /* Idempotency for occupied? Backend handles logic logic */) {
                // Backend handles specific logic if it's logically occupied by SOMEONE ELSE vs SAME order.
                // We'll trust backend to throw if scanned slot is invalid.
            }

            // Call Backend
            await StorageService.assignOrder(scannedOrder.id, targetSlot.id);

            toast({
                title: 'Success',
                description: `Order assigned to ${targetSlot.name}`,
                variant: 'success'
            });

            // Reset flow for next order
            setScannedOrder(null);
            setOrderInput('');
            setSlotInput('');
            orderInputRef.current?.focus();

            // Refresh slots logic? Ideally RLS/Socket updates, but basic refresh:
            const user = session?.user;
            if (user?.site_id) {
                StorageService.getAll(user.site_id).then(setSlots);
            }

        } catch (error: any) {
            toast({
                title: 'Assignment Failed',
                description: error.message || 'Could not assign order to slot.',
                variant: 'destructive'
            });
            setSlotInput(''); // Clear slot input to retry
            slotInputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    if (initializing) return <div className="p-8">Loading storage configuration...</div>;

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Assign Order to Storage</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Scanner Section */}
                <div className="space-y-6">

                    {/* Order Scanner */}
                    <div className={`p-6 rounded-xl border-2 transition-colors ${!scannedOrder ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <ScannerInput
                            ref={orderInputRef}
                            label="1. Scan Order Ticket"
                            value={orderInput}
                            onChange={(e) => setOrderInput(e.target.value)}
                            disabled={!!scannedOrder || loading}
                            placeholder="Scan Order QR / ID..."
                            autoFocus={true}
                            onScan={handleOrderSubmit}
                        />
                        {scannedOrder && (
                            <button
                                onClick={() => {
                                    setScannedOrder(null);
                                    setSlotInput('');
                                    setOrderInput('');
                                    setTimeout(() => orderInputRef.current?.focus(), 100);
                                }}
                                className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                                Reset / Scan Different Order
                            </button>
                        )}
                    </div>

                    {/* Slot Scanner */}
                    <div className={`p-6 rounded-xl border-2 transition-colors ${scannedOrder ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                        <ScannerInput
                            ref={slotInputRef}
                            label="2. Scan Shelf Slot"
                            value={slotInput}
                            onChange={(e) => setSlotInput(e.target.value)}
                            disabled={!scannedOrder || loading}
                            placeholder={scannedOrder ? "Scan Slot Label (e.g. A-01)..." : "Scan Order First"}
                            inputClassName="focus:ring-purple-500 focus:border-purple-500"
                            onScan={handleSlotSubmit}
                        />
                    </div>

                </div>

                {/* Info Section */}
                <div className="space-y-6">
                    {scannedOrder ? (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                    <p className="text-sm text-gray-500">ID: {scannedOrder.id.slice(0, 8)}...</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${scannedOrder.service_level === 'EXPRESS' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {scannedOrder.service_level}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                                    <p className="font-medium text-gray-900 text-lg">{scannedOrder.client?.first_name} {scannedOrder.client?.last_name}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Items ({scannedOrder.items?.length || 0})</p>
                                    <ul className="mt-1 space-y-1">
                                        {scannedOrder.items?.map((item: any, idx: number) => (
                                            <li key={idx} className="text-sm text-gray-700 flex justify-between">
                                                <span>{item.quantity}x {item.article_type_id}</span> {/* Using ID as label assuming mock defaults, can be enriched */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Price</p>
                                    <p className="font-bold text-gray-900 text-xl">{scannedOrder.total_price} XOF</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-center p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                                <span className="animate-pulse mr-2">📍</span>
                                <span className="font-medium">Waiting for Slot Scan...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
                            <p className="text-6xl mb-4">📦</p>
                            <p className="text-lg font-medium">Ready to Store</p>
                            <p className="text-sm">Scan an order ticket to begin the storage process.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

