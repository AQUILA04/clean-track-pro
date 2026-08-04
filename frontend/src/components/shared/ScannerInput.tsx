'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface ScannerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    onScan?: (value: string) => void; // Triggered on Enter with the scanned value
    autoFocus?: boolean;
    containerClassName?: string;
    labelClassName?: string;
    inputClassName?: string;
}

export interface ScannerInputHandle {
    focus: () => void;
    blur: () => void;
    select: () => void;
}

export const ScannerInput = forwardRef<ScannerInputHandle, ScannerInputProps>(({
    label,
    onScan,
    autoFocus = false,
    containerClassName = '',
    labelClassName = '',
    inputClassName = '',
    onKeyDown,
    ...props
}, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => internalRef.current?.focus(),
        blur: () => internalRef.current?.blur(),
        select: () => internalRef.current?.select(),
    }));

    useEffect(() => {
        if (autoFocus) {
            // Small timeout to ensure DOM is ready
            const timer = setTimeout(() => {
                internalRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if inside form
            const value = e.currentTarget.value.trim();
            if (onScan && value) {
                onScan(value);
            }
        }
        if (onKeyDown) {
            onKeyDown(e);
        }
    };

    return (
        <div className={containerClassName}>
            {label && (
                <label className={`block text-sm font-medium text-muted-foreground mb-2 ${labelClassName}`}>
                    {label}
                </label>
            )}
            <input
                ref={internalRef}
                type="text"
                onKeyDown={handleKeyDown}
                className={`w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary text-lg transition-all duration-150 ${inputClassName}`}
                {...props}
            />
        </div>
    );
});

ScannerInput.displayName = 'ScannerInput';
