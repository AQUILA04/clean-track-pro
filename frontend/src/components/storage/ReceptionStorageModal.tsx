'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { StorageSlotPicker } from '@/components/storage/StorageSlotPicker';
import { SlotType } from '@/services/storage.service';
import { Package } from 'lucide-react';
import { formatOrderLabel } from '@/lib/order-display';

interface ReceptionStorageModalProps {
    isOpen: boolean;
    orderId: string;
    siteId: string;
    orderReference?: string | null;
    onComplete: () => void;
    onError?: (message: string) => void;
}

export const ReceptionStorageModal: React.FC<ReceptionStorageModalProps> = ({
    isOpen,
    orderId,
    siteId,
    orderReference,
    onComplete,
    onError,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={() => {}} title="" size="lg">
            <div className="text-center mb-6">
                <Package className="h-12 w-12 mx-auto text-primary mb-3" />
                <h2 className="text-xl font-bold text-foreground">Ranger en réception</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Choisissez un rayon de réception libre pour stocker la commande avant
                    traitement.
                </p>
                <p className="text-sm font-mono text-primary mt-2">
                    {formatOrderLabel({ id: orderId, reference: orderReference })}
                </p>
            </div>

            {siteId && (
                <StorageSlotPicker
                    orderId={orderId}
                    slotType={SlotType.RECEPTION}
                    siteId={siteId}
                    orderStatus="CREATED"
                    onAssigned={() => onComplete()}
                    onError={onError}
                    label="Choisir le rayon de réception"
                />
            )}
        </Modal>
    );
};
