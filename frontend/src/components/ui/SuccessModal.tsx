import React from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    secondaryMessage?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
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
            {/* Backdrop with glassmorphism to match app style, but darker to focus on the vivid modal */}
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className="relative transform overflow-hidden rounded-3xl bg-[#10B981] p-8 text-left shadow-2xl transition-all w-full max-w-md flex flex-col items-center">

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
                            <Check size={40} className="text-white ring-4 ring-white/10 rounded-full" />
                        </div>

                        {/* Content */}
                        <h3 className="text-2xl font-bold text-white text-center mb-2">
                            {title}
                        </h3>

                        <p className="text-white/90 text-center font-medium text-lg leading-relaxed mb-6">
                            {message}
                        </p>

                        {secondaryMessage && (
                            <div className="bg-white/20 rounded-full px-6 py-2 mb-6 flex items-center gap-2">
                                <span className="text-white text-sm font-medium">{secondaryMessage}</span>
                            </div>
                        )}

                        {/* Action - only if provided */}
                        {/* If we want to mimic the image exactly, it might act as a link or button for 'Voir détails' */}
                        {actionLabel && onAction && (
                            <button
                                onClick={onAction}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-colors border border-white/20"
                            >
                                {actionLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
