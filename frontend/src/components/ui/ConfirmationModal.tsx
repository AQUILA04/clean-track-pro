import React from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

const VARIANT_STYLES = {
    warning: {
        iconWrap: 'bg-amber-500/10 text-amber-400',
        Icon: AlertTriangle,
        confirmVariant: 'primary' as const,
    },
    danger: {
        iconWrap: 'bg-red-500/10 text-red-400',
        Icon: AlertCircle,
        confirmVariant: 'destructive' as const,
    },
    info: {
        iconWrap: 'bg-blue-500/10 text-blue-400',
        Icon: Info,
        confirmVariant: 'primary' as const,
    },
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'warning',
}) => {
    if (!isOpen) return null;

    const { iconWrap, Icon, confirmVariant } = VARIANT_STYLES[variant];

    return (
        <div className="relative z-[60]" aria-labelledby="confirmation-modal-title" role="dialog" aria-modal="true">
            <div
                className="fixed inset-0 bg-background/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className="relative w-full max-w-md transform overflow-hidden rounded-xl border border-border bg-card p-6 text-left shadow-xl transition-all">
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 rounded-md text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div
                                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${iconWrap}`}
                            >
                                <Icon size={28} strokeWidth={1.75} />
                            </div>

                            <h3
                                id="confirmation-modal-title"
                                className="text-lg font-semibold text-foreground mb-2"
                            >
                                {title}
                            </h3>

                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                {message}
                            </p>

                            <div className="w-full flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1 dark:text-muted-foreground dark:hover:bg-muted/50"
                                    onClick={onClose}
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    type="button"
                                    variant={confirmVariant}
                                    className="flex-1"
                                    onClick={onConfirm}
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
