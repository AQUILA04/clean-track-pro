'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, MapPin, Plus } from 'lucide-react';
import {
    StorageService,
    StorageSlot,
    SlotType,
    StorageSlotStatus,
} from '@/services/storage.service';
import { ScannerInput, ScannerInputHandle } from '@/components/shared/ScannerInput';
import { getStorageMismatchMessage } from '@/lib/storage-messages';

interface StorageSlotPickerProps {
    orderId: string;
    slotType: SlotType;
    siteId: string;
    orderStatus?: string;
    onAssigned: (slotName: string) => void;
    onError?: (message: string) => void;
    label?: string;
    /** Keep barcode/scan shortcut alongside clickable grid */
    enableScan?: boolean;
}

function getRayonKey(name: string): string {
    const match = name.trim().match(/^([A-Za-zÀ-ÿ]+)/);
    return match ? match[1].toUpperCase() : 'Autres';
}

export function StorageSlotPicker({
    orderId,
    slotType,
    siteId,
    orderStatus,
    onAssigned,
    onError,
    label,
    enableScan = true,
}: StorageSlotPickerProps) {
    const [allSlots, setAllSlots] = useState<StorageSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [slotInput, setSlotInput] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const scannerRef = useRef<ScannerInputHandle>(null);

    const typeLabel = slotType === SlotType.RECEPTION ? 'réception' : 'livraison';

    const loadSlots = async () => {
        if (!siteId) return;
        try {
            const slots = await StorageService.getAll(siteId, slotType);
            setAllSlots(slots);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadSlots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteId, slotType]);

    const reportError = (message: string) => {
        setErrorMessage(message);
        onError?.(message);
        setSlotInput('');
        scannerRef.current?.focus();
    };

    const assignSlot = async (targetSlot: StorageSlot) => {
        setLoading(true);
        setAssigningId(targetSlot.id);
        setErrorMessage(null);
        try {
            if (targetSlot.slot_type !== slotType) {
                throw new Error(
                    getStorageMismatchMessage(
                        targetSlot.name,
                        targetSlot.slot_type,
                        slotType,
                        orderStatus,
                    ),
                );
            }
            if (targetSlot.status !== StorageSlotStatus.FREE) {
                throw new Error(
                    `Le rayon ${targetSlot.name} est occupé. Choisissez un rayon libre.`,
                );
            }

            await StorageService.assignOrder(orderId, targetSlot.id);
            onAssigned(targetSlot.name);
            setSlotInput('');
            await loadSlots();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Échec du rangement';
            reportError(msg);
        } finally {
            setLoading(false);
            setAssigningId(null);
        }
    };

    const handleSlotScan = async (scannedValue?: string) => {
        const value = (scannedValue ?? slotInput).trim();
        if (!value) return;

        const targetSlot = allSlots.find(
            (s) => s.name.toUpperCase() === value.toUpperCase(),
        );
        if (!targetSlot) {
            reportError(
                `Rayon « ${value} » introuvable. Vérifiez le label ou créez ce rayon dans la configuration.`,
            );
            return;
        }
        await assignSlot(targetSlot);
    };

    const freeSlots = useMemo(
        () => allSlots.filter((s) => s.status === StorageSlotStatus.FREE),
        [allSlots],
    );

    const groups = useMemo(() => {
        const map = new Map<string, StorageSlot[]>();
        for (const slot of allSlots) {
            const key = getRayonKey(slot.name);
            const list = map.get(key) ?? [];
            list.push(slot);
            map.set(key, list);
        }
        for (const list of map.values()) {
            list.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
        }
        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b, 'fr'))
            .map(([key, slots]) => ({ key, slots }));
    }, [allSlots]);

    return (
        <div className="space-y-4">
            {errorMessage && (
                <div
                    role="alert"
                    className="flex gap-3 p-4 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 text-amber-200"
                >
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-300 text-sm">Rangement impossible</p>
                        <p className="text-sm text-amber-100/90 mt-1 leading-relaxed">{errorMessage}</p>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-medium text-foreground">
                            {label || `Choisir un rayon ${typeLabel}`}
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {freeSlots.length} libre{freeSlots.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {enableScan && (
                    <ScannerInput
                        ref={scannerRef}
                        label=""
                        value={slotInput}
                        onChange={(e) => {
                            setSlotInput(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                        }}
                        onScan={handleSlotScan}
                        disabled={loading}
                        placeholder={`Scan rapide (ex: ${slotType === SlotType.RECEPTION ? 'A-01' : 'B-01'})…`}
                    />
                )}

                {allSlots.length === 0 ? (
                    <p className="text-sm text-amber-400 py-4 text-center">
                        Aucun rayon {typeLabel} configuré. Créez-en un dans Stockage.
                    </p>
                ) : freeSlots.length === 0 ? (
                    <p className="text-sm text-amber-400 py-4 text-center">
                        Aucun rayon {typeLabel} libre. Libérez un rayon ou créez-en un nouveau.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {groups.map(({ key, slots }) => (
                            <section key={key}>
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    Rayon {key}
                                </h3>
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                    {slots.map((slot) => {
                                        const isFree = slot.status === StorageSlotStatus.FREE;
                                        const isBusy = assigningId === slot.id;
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                disabled={!isFree || loading}
                                                onClick={() => {
                                                    if (isFree) void assignSlot(slot);
                                                }}
                                                title={
                                                    isFree
                                                        ? `${slot.name} — Libre · clic pour ranger`
                                                        : `${slot.name} — Occupé`
                                                }
                                                className={`
                                                    relative flex flex-col items-center justify-center
                                                    min-h-[64px] rounded-xl border p-2
                                                    transition-all duration-150
                                                    ${
                                                        isFree
                                                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 hover:bg-emerald-500/25 hover:ring-2 hover:ring-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary'
                                                            : 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-60'
                                                    }
                                                    ${isBusy ? 'ring-2 ring-primary bg-primary/20' : ''}
                                                `}
                                            >
                                                <span className="text-xs font-semibold tracking-wide">
                                                    {slot.name}
                                                </span>
                                                {isFree && (
                                                    <Plus className="h-4 w-4 mt-1" strokeWidth={2} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    Cliquez un slot libre pour y ranger la commande
                    {enableScan ? ', ou scannez le label.' : '.'}
                </p>
            </div>
        </div>
    );
}
