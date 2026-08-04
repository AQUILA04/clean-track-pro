'use client';

/**
 * @deprecated Prefer StorageSlotPicker — clickable free-slot grid + optional scan.
 * Kept as a thin wrapper for any remaining scan-only call sites.
 */
import React from 'react';
import { StorageSlotPicker } from '@/components/storage/StorageSlotPicker';
import { SlotType } from '@/services/storage.service';

interface StorageSlotScannerProps {
    orderId: string;
    slotType: SlotType;
    siteId: string;
    orderStatus?: string;
    onAssigned: (slotName: string) => void;
    onError?: (message: string) => void;
    label?: string;
    placeholder?: string;
}

export const StorageSlotScanner: React.FC<StorageSlotScannerProps> = (props) => {
    return <StorageSlotPicker {...props} enableScan />;
};
