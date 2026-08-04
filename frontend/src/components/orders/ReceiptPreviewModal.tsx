'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { PrintableOrder } from '@/types/printing.types';
import { PrintingService } from '@/services/printing.service';
import { useToast } from '@/components/ui/simple-toast';
import { Printer, Receipt, X } from 'lucide-react';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    receipt: PrintableOrder | null;
    onClose: () => void;
}

function formatReceiptDate(isoDate: string): string {
    try {
        return new Date(isoDate).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoDate;
    }
}

function ReceiptTicket({ receipt }: { receipt: PrintableOrder }) {
    const { logoUrl, tenantName, siteName, address, legalId, vatNumber, date } = receipt.header;
    const initial = (tenantName || 'C').charAt(0).toUpperCase();

    return (
        <div
            id="receipt-preview-content"
            className="mx-auto w-full max-w-[320px] rounded-lg border border-border bg-white text-gray-900 p-5 font-mono text-xs shadow-inner"
        >
            <div className="text-center mb-4">
                {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={logoUrl}
                        alt={tenantName}
                        className="h-12 max-w-[180px] object-contain mx-auto mb-2"
                    />
                ) : (
                    <div className="h-10 w-10 rounded-lg bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-2">
                        {initial}
                    </div>
                )}
                <p className="text-sm font-bold">{tenantName}</p>
                <p className="text-[11px] text-gray-500">{siteName}</p>
                {address ? (
                    <p className="text-[10px] text-gray-500 mt-1 whitespace-pre-line">{address}</p>
                ) : null}
                {(legalId || vatNumber) && (
                    <p className="text-[10px] text-gray-400 mt-1">
                        {[legalId && `ID: ${legalId}`, vatNumber && `TVA: ${vatNumber}`]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                )}
                <p className="text-[11px] text-gray-500 mt-2">{formatReceiptDate(date)}</p>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 mb-3">
                <p className="font-semibold mb-1">Client</p>
                <p>{receipt.client.name}</p>
                {receipt.client.phone ? <p className="text-gray-500">{receipt.client.phone}</p> : null}
                <p className="text-[10px] text-gray-600 mt-1 font-semibold">
                    N° {receipt.client.reference || receipt.client.qrCodeValue}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 break-all">ID: {receipt.client.qrCodeValue}</p>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 mb-3 space-y-3">
                {receipt.items.map((item, index) => (
                    <div key={`${item.qrCodeValue}-${index}`}>
                        <div className="flex justify-between gap-2">
                            <span className="font-medium">{item.label}</span>
                            <span>{item.price.toFixed(0)} {receipt.totals.currency}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{item.service}</p>
                        <p className="text-[10px] text-gray-400 break-all">#{item.qrCodeValue}</p>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3">
                <div className="flex justify-between text-sm font-bold">
                    <span>TOTAL</span>
                    <span>{receipt.totals.totalPrice.toFixed(0)} {receipt.totals.currency}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 text-center">
                    Retrait prévu : {formatReceiptDate(receipt.totals.dueDate)}
                </p>
            </div>
        </div>
    );
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
    isOpen,
    receipt,
    onClose,
}) => {
    const { toast } = useToast();
    const [isPrinting, setIsPrinting] = useState(false);

    if (!receipt) return null;

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            const method = await PrintingService.printWithFallback(receipt);
            toast({
                title: 'Impression lancée',
                description:
                    method === 'proxy'
                        ? 'Ticket envoyé à l\'imprimante via le proxy local.'
                        : 'Dialogue d\'impression du navigateur ouvert.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Erreur d\'impression',
                description: 'Vérifiez le proxy local ou autorisez les pop-ups du navigateur.',
                variant: 'destructive',
            });
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Reçu de commande
                </span>
            }
        >
            <p className="text-sm text-muted-foreground mb-4">
                Commande créée avec succès. Vérifiez le reçu avant impression.
            </p>

            <ReceiptTicket receipt={receipt} />

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                    className="flex-1"
                    icon={<Printer className="h-4 w-4" />}
                    onClick={handlePrint}
                    isLoading={isPrinting}
                >
                    Imprimer
                </Button>
                <Button
                    className="flex-1"
                    variant="secondary"
                    icon={<X className="h-4 w-4" />}
                    onClick={onClose}
                    disabled={isPrinting}
                >
                    Fermer
                </Button>
            </div>
        </Modal>
    );
};
