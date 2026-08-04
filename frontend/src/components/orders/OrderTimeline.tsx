'use client';

import React from 'react';
import { Check, Shirt, Sparkles, Waves } from 'lucide-react';
import { formatStatusLabel } from '@/lib/status-labels';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

type OrderStatus = 'CREATED' | 'IN_PROGRESS' | 'READY' | 'STORED' | 'DELIVERED' | 'CANCELLED' | string;

interface OrderTimelineProps {
    status: OrderStatus;
    createdAt: string | Date;
    updatedAt?: string | Date;
}

type StepState = 'done' | 'current' | 'pending';

interface TimelineStep {
    key: string;
    label: string;
    state: StepState;
    subtitle: string;
    icon: React.ReactNode;
}

function elapsedLabel(createdAt: string | Date): string {
    const mins = Math.max(0, differenceInMinutes(new Date(), new Date(createdAt)));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m.toString().padStart(2, '0')}min`;
}

function formatStepTime(date: string | Date): string {
    return format(new Date(date), "d MMM — HH:mm", { locale: fr });
}

/**
 * Maps real order statuses onto the 5-step agency timeline from the UI reference.
 */
function buildSteps(status: OrderStatus, createdAt: string | Date, updatedAt?: string | Date): TimelineStep[] {
    const created = new Date(createdAt);
    const updated = updatedAt ? new Date(updatedAt) : created;
    const waiting = formatStatusLabel('WAITING', 'timeline');

    const rank: Record<string, number> = {
        CREATED: 1,
        IN_PROGRESS: 3,
        READY: 5,
        STORED: 5,
        DELIVERED: 5,
        CANCELLED: 0,
    };
    const current = rank[status] ?? 1;

    const defs: Array<{ key: string; labelKey: string; threshold: number; icon: React.ReactNode }> = [
        { key: 'received', labelKey: 'RECEIVED', threshold: 1, icon: <Check className="h-4 w-4" /> },
        { key: 'sorting', labelKey: 'SORTING', threshold: 2, icon: <Sparkles className="h-4 w-4" /> },
        { key: 'washing', labelKey: 'WASHING', threshold: 3, icon: <Waves className="h-4 w-4" /> },
        { key: 'ironing', labelKey: 'IRONING', threshold: 4, icon: <Shirt className="h-4 w-4" /> },
        { key: 'ready', labelKey: 'READY', threshold: 5, icon: <Check className="h-4 w-4" /> },
    ];

    return defs.map((def) => {
        let state: StepState = 'pending';
        if (current >= def.threshold && def.threshold < current) state = 'done';
        else if (current === def.threshold) state = status === 'DELIVERED' || status === 'STORED' || (status === 'READY' && def.key === 'ready') ? 'done' : 'current';
        else if (current > def.threshold) state = 'done';

        // CREATED → step 1 done as "current" reception complete, sorting pending visually as next
        if (status === 'CREATED') {
            if (def.threshold === 1) state = 'done';
            else if (def.threshold === 2) state = 'current';
            else state = 'pending';
        }
        if (status === 'IN_PROGRESS') {
            if (def.threshold <= 2) state = 'done';
            else if (def.threshold === 3) state = 'current';
            else state = 'pending';
        }
        if (status === 'READY' || status === 'STORED' || status === 'DELIVERED') {
            state = 'done';
        }
        if (status === 'CANCELLED') {
            state = def.threshold === 1 ? 'done' : 'pending';
        }

        let subtitle = waiting;
        if (state === 'done' || state === 'current') {
            subtitle = formatStepTime(def.threshold <= 1 ? created : updated);
        }

        return {
            key: def.key,
            label: formatStatusLabel(def.labelKey, 'timeline'),
            state,
            subtitle,
            icon: def.icon,
        };
    });
}

export function OrderTimeline({ status, createdAt, updatedAt }: OrderTimelineProps) {
    const steps = buildSteps(status, createdAt, updatedAt);

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Historique de la commande</h2>
                <span className="text-sm text-muted-foreground">
                    Temps écoulé : {elapsedLabel(createdAt)}
                </span>
            </div>

            <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const circleClass =
                        step.state === 'pending'
                            ? 'bg-muted text-muted-foreground border border-border'
                            : 'bg-primary text-white';

                    return (
                        <div key={step.key} className="flex items-start flex-1 min-w-[100px]">
                            <div className="flex flex-col items-center text-center w-full">
                                <div className="relative flex items-center w-full justify-center mb-3">
                                    {!isLast && (
                                        <div
                                            className={`absolute left-1/2 right-0 top-1/2 h-0.5 translate-x-4 ${
                                                step.state === 'done' ? 'bg-primary' : 'bg-border'
                                            }`}
                                            aria-hidden
                                        />
                                    )}
                                    {index > 0 && (
                                        <div
                                            className={`absolute right-1/2 left-0 top-1/2 h-0.5 -translate-x-4 ${
                                                steps[index - 1].state === 'done' ? 'bg-primary' : 'bg-border'
                                            }`}
                                            aria-hidden
                                        />
                                    )}
                                    <div
                                        className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center ${circleClass} ${
                                            step.state === 'current' ? 'ring-4 ring-primary/30' : ''
                                        }`}
                                    >
                                        {step.state === 'done' ? <Check className="h-4 w-4" /> : step.icon}
                                    </div>
                                </div>
                                <p
                                    className={`text-sm font-medium ${
                                        step.state === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                                    }`}
                                >
                                    {step.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{step.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
