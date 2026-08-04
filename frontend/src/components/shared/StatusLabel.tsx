'use client';

import React from 'react';
import {
    formatStatusLabel,
    getStatusPillClass,
    type StatusKind,
} from '@/lib/status-labels';

const pillBase =
    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';

export interface StatusLabelProps {
    /** Technical status code (e.g. IN_PROGRESS, PAID). Never shown raw. */
    status: string | null | undefined;
    /** Domain of the status — selects the French dictionary. */
    kind?: StatusKind;
    /**
     * `badge` — colored pill (default).
     * `text` — plain French label only (pipe-like).
     */
    variant?: 'badge' | 'text';
    className?: string;
}

/**
 * Reusable status translator (React equivalent of an Angular pipe).
 * Always renders French labels for known domain statuses.
 */
export function StatusLabel({
    status,
    kind = 'order',
    variant = 'badge',
    className = '',
}: StatusLabelProps) {
    const label = formatStatusLabel(status, kind);

    if (variant === 'text') {
        return <span className={className}>{label}</span>;
    }

    return (
        <span className={`${pillBase} ${getStatusPillClass(status, kind)} ${className}`}>
            {label}
        </span>
    );
}

export default StatusLabel;
