'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { formatOrderLabel } from '@/lib/order-display';
import { formatStatusLabel } from '@/lib/status-labels';
import { StatusLabel } from '@/components/shared/StatusLabel';
import type { WorkflowOrder, WorkflowOrderStatus } from '@/lib/workflow-kanban';

interface StatusTransitionModalProps {
    isOpen: boolean;
    order: WorkflowOrder | null;
    targetStatus: WorkflowOrderStatus | null;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function StatusTransitionModal({
    isOpen,
    order,
    targetStatus,
    loading,
    onConfirm,
    onClose,
}: StatusTransitionModalProps) {
    if (!isOpen || !order || !targetStatus) return null;

    const fromLabel = formatStatusLabel(order.status);
    const toLabel = formatStatusLabel(targetStatus);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmer le changement de statut">
            <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                    Vous allez mettre à jour la commande{' '}
                    <span className="font-mono font-medium text-primary">
                        {formatOrderLabel(order)}
                    </span>
                    {order.client_name ? (
                        <>
                            {' '}
                            ({order.client_name})
                        </>
                    ) : null}
                    .
                </p>

                <div className="flex items-center justify-center gap-3 py-2">
                    <StatusLabel status={order.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <StatusLabel status={targetStatus} />
                </div>

                <p className="text-sm text-foreground text-center">
                    Passer de <strong>{fromLabel}</strong> à <strong>{toLabel}</strong> ?
                </p>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        className="flex-1"
                        onClick={onConfirm}
                        isLoading={loading}
                    >
                        Confirmer
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
