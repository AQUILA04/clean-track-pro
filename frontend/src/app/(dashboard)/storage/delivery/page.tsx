'use client';

import React, { useState, useRef } from 'react';
import { StorageService } from '@/services/storage.service';
import { useToast } from '@/components/ui/simple-toast';
import { ScannerInput, ScannerInputHandle } from '@/components/shared/ScannerInput';
import { OrderDeliveryCard } from '@/components/storage/OrderDeliveryCard';
import { useRouter } from 'next/navigation';

export default function DeliveryPage() {
    const { toast } = useToast();
    const router = useRouter();

    // State
    const [orderInput, setOrderInput] = useState('');
    const [lookupResult, setLookupResult] = useState<any | null>(null); // { order, slot_label }
    const [loading, setLoading] = useState(false);

    // Refs
    const scannerRef = useRef<ScannerInputHandle>(null);

    const handleScan = async () => {
        if (!orderInput.trim()) return;

        setLoading(true);
        try {
            // Lookup order and slot info
            const result = await StorageService.lookupOrder(orderInput.trim());

            // Check logical constraints for delivery
            if (result.order.status === 'DELIVERED') {
                toast({
                    title: 'Already Delivered',
                    description: `Order ${result.order.id.slice(0, 8)} is already delivered.`,
                    variant: 'default' // Info
                });
            } else if (result.order.status !== 'READY' && result.order.status !== 'STORED') {
                toast({
                    title: 'Invalid Status',
                    description: `Order is ${result.order.status}. Must be READY or STORED.`,
                    variant: 'destructive'
                });
            }

            setLookupResult(result);
            setOrderInput(''); // Clear input for next usage logic? Or keep it? Clearing is better for focus flow if we were scanning multiple things, but here we stop to confirm.

        } catch (error: any) {
            console.error('Scan Error:', error);
            toast({
                title: 'Scan Failed',
                description: error.message || 'Order not found.',
                variant: 'destructive'
            });
            setLookupResult(null);
            setOrderInput('');
            scannerRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleDeliver = async () => {
        if (!lookupResult) return;

        setLoading(true);
        try {
            await StorageService.deliverOrder(lookupResult.order.id);

            toast({
                title: 'Delivery Confirmed',
                description: 'Order status updated and slot released.',
                variant: 'success'
            });

            resetFlow();

        } catch (error: any) {
            toast({
                title: 'Delivery Failed',
                description: error.message || 'Could not complete delivery.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setLookupResult(null);
        setOrderInput('');
        // Small timeout to ensure ref is ready if DOM shifted
        setTimeout(() => scannerRef.current?.focus(), 100);
    };

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Client Delivery</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left: Scanner */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <ScannerInput
                            ref={scannerRef}
                            label="Scan Client Ticket / QR"
                            value={orderInput}
                            onChange={(e) => setOrderInput(e.target.value)}
                            onScan={handleScan}
                            disabled={loading || !!lookupResult}
                            placeholder="Scan Order ID..."
                            autoFocus={true}
                            inputClassName="text-xl"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Press Enter to search
                        </p>

                        {/* Manual Controls/Back using standard links can be here */}
                    </div>

                    {!lookupResult && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-800">
                            <h3 className="font-bold mb-2">Instructions</h3>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Scan the QR code on the client's ticket.</li>
                                <li>Verify the shelf slot location.</li>
                                <li>Retrieve the package.</li>
                                <li>Click "Confirm Delivery" to release the slot.</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right: Result Card */}
                <div>
                    {lookupResult ? (
                        <OrderDeliveryCard
                            order={lookupResult.order}
                            slotLabel={lookupResult.slot_label}
                            onDeliver={handleDeliver}
                            onCancel={resetFlow}
                            loading={loading}
                        />
                    ) : (
                        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center h-full flex flex-col justify-center items-center opacity-60">
                            <span className="text-6xl mb-4">👋</span>
                            <p className="text-lg font-medium text-gray-400">Waiting for Client...</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
