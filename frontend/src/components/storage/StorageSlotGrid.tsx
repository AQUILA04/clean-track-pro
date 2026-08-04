'use client';

import React, { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search, LayoutGrid, CircleDot, Package } from 'lucide-react';
import {
    StorageSlot,
    StorageSlotStatus,
    SlotType,
} from '@/services/storage.service';
import { SiteKpiCard } from '@/components/dashboard/SiteKpiCard';

type ZoneFilter = 'ALL' | SlotType;

interface StorageSlotGridProps {
    slots: StorageSlot[];
    isLoading: boolean;
    onOccupiedClick: (slot: StorageSlot) => void;
}

function getRayonKey(name: string): string {
    const match = name.trim().match(/^([A-Za-zÀ-ÿ]+)/);
    return match ? match[1].toUpperCase() : 'Autres';
}

function groupSlotsByRayon(slots: StorageSlot[]): Array<{ key: string; slots: StorageSlot[] }> {
    const map = new Map<string, StorageSlot[]>();
    for (const slot of slots) {
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
        .map(([key, grouped]) => ({ key, slots: grouped }));
}

export function StorageSlotGrid({ slots, isLoading, onOccupiedClick }: StorageSlotGridProps) {
    const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('ALL');
    const [search, setSearch] = useState('');

    const stats = useMemo(() => {
        const total = slots.length;
        const free = slots.filter((s) => s.status === StorageSlotStatus.FREE).length;
        const occupied = slots.filter((s) => s.status === StorageSlotStatus.OCCUPIED).length;
        return { total, free, occupied };
    }, [slots]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return slots.filter((slot) => {
            if (zoneFilter !== 'ALL' && slot.slot_type !== zoneFilter) return false;
            if (q && !slot.name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [slots, zoneFilter, search]);

    const groups = useMemo(() => groupSlotsByRayon(filtered), [filtered]);

    const receptionCount = slots.filter((s) => s.slot_type === SlotType.RECEPTION).length;
    const deliveryCount = slots.filter((s) => s.slot_type === SlotType.DELIVERY).length;

    const chips: Array<{ id: ZoneFilter; label: string; count: number }> = [
        { id: 'ALL', label: 'Tous', count: slots.length },
        { id: SlotType.RECEPTION, label: 'Réception', count: receptionCount },
        { id: SlotType.DELIVERY, label: 'Livraison', count: deliveryCount },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-28 rounded-xl border border-border bg-card animate-pulse"
                        />
                    ))}
                </div>
                <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SiteKpiCard
                    label="Total slots"
                    value={stats.total}
                    icon={LayoutGrid}
                    subValue="Capacité max"
                    trend="neutral"
                />
                <SiteKpiCard
                    label="Slots libres"
                    value={stats.free}
                    icon={CircleDot}
                    subValue={
                        stats.total > 0
                            ? `${Math.round((stats.free / stats.total) * 100)} % disponibles`
                            : undefined
                    }
                    trend="up"
                />
                <SiteKpiCard
                    label="Slots occupés"
                    value={stats.occupied}
                    icon={Package}
                    subValue={
                        stats.total > 0
                            ? `${Math.round((stats.occupied / stats.total) * 100)} % utilisés`
                            : undefined
                    }
                    trend={stats.occupied > 0 ? 'down' : 'neutral'}
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => {
                        const active = zoneFilter === chip.id;
                        return (
                            <button
                                key={chip.id}
                                type="button"
                                onClick={() => setZoneFilter(chip.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                                    active
                                        ? 'bg-primary text-white'
                                        : 'bg-card border border-border text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                {chip.label} ({chip.count})
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un slot (ex. A-12)"
                        className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
                    {slots.length === 0
                        ? 'Aucun rayon configuré. Ajoutez un slot pour commencer.'
                        : 'Aucun slot ne correspond aux filtres.'}
                </div>
            ) : (
                <div className="space-y-8">
                    {groups.map(({ key, slots: groupSlots }) => (
                        <section key={key}>
                            <div className="flex items-baseline gap-2 mb-3">
                                <h2 className="text-lg font-semibold text-foreground">
                                    Rayon {key}
                                </h2>
                                <span className="text-sm text-muted-foreground">
                                    ({groupSlots.length} slot{groupSlots.length > 1 ? 's' : ''})
                                </span>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                                {groupSlots.map((slot) => {
                                    const isFree = slot.status === StorageSlotStatus.FREE;
                                    const isOccupied = slot.status === StorageSlotStatus.OCCUPIED;
                                    const isClickable = isOccupied;

                                    return (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            disabled={!isClickable}
                                            onClick={() => {
                                                if (isClickable) onOccupiedClick(slot);
                                            }}
                                            title={
                                                isOccupied
                                                    ? `${slot.name} — Occupé · clic pour le détail`
                                                    : isFree
                                                      ? `${slot.name} — Libre`
                                                      : `${slot.name} — Réservé`
                                            }
                                            className={`
                                                relative flex flex-col items-center justify-center
                                                min-h-[72px] rounded-xl border p-2
                                                transition-all duration-150
                                                ${
                                                    isFree
                                                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 cursor-default'
                                                        : isOccupied
                                                          ? 'bg-muted border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary'
                                                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-default'
                                                }
                                            `}
                                        >
                                            <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold tracking-wide opacity-80">
                                                {slot.name}
                                            </span>
                                            {isFree ? (
                                                <Plus className="h-5 w-5 mt-2" strokeWidth={2} />
                                            ) : (
                                                <ClipboardList className="h-5 w-5 mt-2" strokeWidth={1.5} />
                                            )}
                                            <span className="sr-only">
                                                {slot.name},{' '}
                                                {slot.slot_type === SlotType.DELIVERY
                                                    ? 'livraison'
                                                    : 'réception'}
                                                ,{' '}
                                                {isFree ? 'libre' : isOccupied ? 'occupé' : 'réservé'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground text-right">
                Cliquez un slot occupé pour voir la commande et ses articles.
            </p>
        </div>
    );
}
