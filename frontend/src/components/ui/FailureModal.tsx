import React from 'react';
import { X } from 'lucide-react';

interface FailureModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    secondaryMessage?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const FailureModal: React.FC<FailureModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    secondaryMessage,
    actionLabel,
    onAction
}) => {
    if (!isOpen) return null;

    return (
        <div className="relative z-[60]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop with glassmorphism */}
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className="relative transform overflow-hidden rounded-3xl bg-[#EF4444] p-8 text-left shadow-2xl transition-all w-full max-w-md flex flex-col items-center">

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
                            <X size={40} className="text-white ring-4 ring-white/10 rounded-full" />
                        </div>

                        {/* Content */}
                        <h3 className="text-2xl font-bold text-white text-center mb-2">
                            {title}
                        </h3>

                        <p className="text-white/90 text-center font-medium text-lg leading-relaxed mb-6">
                            {message}
                        </p>

                        {secondaryMessage && (
                            <p className="text-white/80 text-center text-sm font-medium mb-8">
                                {secondaryMessage}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="w-full space-y-3">
                            {/* Primary Action (Retry) */}
                            {actionLabel && onAction && (
                                <button
                                    onClick={onAction}
                                    className="w-full bg-white text-red-600 hover:bg-gray-50 font-bold py-3 rounded-full transition-colors shadow-sm"
                                >
                                    {actionLabel}
                                </button>
                            )}

                            {/* Secondary Action (Cancel) */}
                            <button
                                onClick={onClose}
                                className="w-full bg-[#EF4444] hover:bg-red-500 text-white font-semibold py-3 rounded-full transition-colors border-2 border-white/20"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
