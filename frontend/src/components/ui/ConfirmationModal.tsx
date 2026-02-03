import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    // Define colors based on variant
    const styles = {
        warning: {
            bg: 'bg-amber-500',
            iconBg: 'bg-white/20',
            iconColor: 'text-white',
            buttonPrimary: 'bg-white text-amber-600 hover:bg-gray-50',
            buttonSecondary: 'bg-amber-500 hover:bg-amber-600 border-white/20'
        },
        danger: {
            bg: 'bg-red-500',
            iconBg: 'bg-white/20',
            iconColor: 'text-white',
            buttonPrimary: 'bg-white text-red-600 hover:bg-gray-50',
            buttonSecondary: 'bg-red-500 hover:bg-red-600 border-white/20'
        },
        info: {
            bg: 'bg-blue-500',
            iconBg: 'bg-white/20',
            iconColor: 'text-white',
            buttonPrimary: 'bg-white text-blue-600 hover:bg-gray-50',
            buttonSecondary: 'bg-blue-500 hover:bg-blue-600 border-white/20'
        }
    };

    const currentStyle = styles[variant];

    return (
        <div className="relative z-[60]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop with glassmorphism */}
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className={`relative transform overflow-hidden rounded-3xl ${currentStyle.bg} p-8 text-left shadow-2xl transition-all w-full max-w-md flex flex-col items-center`}>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Icon */}
                        <div className={`w-20 h-20 rounded-full ${currentStyle.iconBg} flex items-center justify-center mb-6`}>
                            <AlertTriangle size={40} className={`${currentStyle.iconColor} ring-4 ring-white/10 rounded-full`} />
                        </div>

                        {/* Content */}
                        <h3 className="text-2xl font-bold text-white text-center mb-2">
                            {title}
                        </h3>

                        <p className="text-white/90 text-center font-medium text-lg leading-relaxed mb-8">
                            {message}
                        </p>

                        {/* Actions */}
                        <div className="w-full flex gap-3">
                            {/* Secondary Action (Cancel) */}
                            <button
                                onClick={onClose}
                                className={`flex-1 ${currentStyle.buttonSecondary} text-white font-semibold py-3 rounded-xl transition-colors border`}
                            >
                                {cancelLabel}
                            </button>

                            {/* Primary Action (Confirm) */}
                            <button
                                onClick={onConfirm}
                                className={`flex-1 ${currentStyle.buttonPrimary} font-bold py-3 rounded-xl transition-colors shadow-sm`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
