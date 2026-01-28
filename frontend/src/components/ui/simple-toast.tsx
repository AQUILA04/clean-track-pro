'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    toast: (props: { title: string; description: string; variant?: 'default' | 'destructive' | 'success' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((messageOrProps: string | { title: string; description: string; variant?: 'default' | 'destructive' | 'success' }, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);

        let message = '';
        let finalType: ToastType = type;

        if (typeof messageOrProps === 'object') {
            message = `${messageOrProps.title}: ${messageOrProps.description}`;
            finalType = messageOrProps.variant === 'destructive' ? 'error' :
                messageOrProps.variant === 'success' ? 'success' : 'info';
        } else {
            message = messageOrProps;
        }

        setToasts(prev => [...prev, { id, message, type: finalType }]);

        // Auto remove
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, toast: showToast as any }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-2 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' :
                            toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                            }`}
                    >
                        {toast.message}
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
