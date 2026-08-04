'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    action?: React.ReactNode;
}

interface ToastProps {
    title: string;
    description: string;
    variant?: 'default' | 'destructive' | 'success';
    action?: React.ReactNode;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((messageOrProps: string | ToastProps, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);

        let message = '';
        let finalType: ToastType = type;
        let action: React.ReactNode = undefined;

        if (typeof messageOrProps === 'object') {
            message = `${messageOrProps.title}: ${messageOrProps.description}`;
            finalType = messageOrProps.variant === 'destructive' ? 'error' :
                messageOrProps.variant === 'success' ? 'success' : 'info';
            action = messageOrProps.action;
        } else {
            message = messageOrProps;
        }

        setToasts(prev => [...prev, { id, message, type: finalType, action }]);

        // Only auto-remove if no action is required
        if (!action) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        }
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, toast: showToast as any }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-2 rounded shadow-lg text-white flex items-center justify-between gap-4 ${toast.type === 'success' ? 'bg-green-600' :
                            toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                            }`}
                    >
                        <span>{toast.message}</span>
                        <div className="flex items-center gap-3">
                            {toast.action && (
                                <div className="shrink-0">
                                    {toast.action}
                                </div>
                            )}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/80 hover:text-white font-bold"
                                aria-label="Dismiss"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
